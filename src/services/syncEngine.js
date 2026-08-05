import { initDB, getAllFromStore, deleteRecord, putRecord } from './db';
import { notifyDataChange } from './broadcast';
import { supabase } from './supabaseClient';

let isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
let isSyncing = false;
const listeners = new Set();

// Manejadores de eventos de red y polling automático
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    isOnline = true;
    notifyStatusChange();
    triggerBackgroundSync();
  });

  window.addEventListener('offline', () => {
    isOnline = false;
    notifyStatusChange();
  });

  // Polling automático cada 5 segundos: Envía pendientes y descarga novedades de otros dispositivos
  setInterval(() => {
    if (isOnline && !isSyncing) {
      triggerBackgroundSync();
    }
  }, 5000);
}

// Configurar WebSockets para Realtime
let isRealtimeInitialized = false;

export function setupRealtimeListeners() {
  if (isRealtimeInitialized || !supabase) return;
  
  const tables = ['congregations', 'users', 'committees', 'projects', 'tithes', 'offerings', 'movements', 'votes'];
  
  tables.forEach(table => {
    supabase
      .channel(`public:${table}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: table }, async (payload) => {
        console.log(`Realtime update en ${table}:`, payload);
        const { eventType, new: newRecord, old: oldRecord } = payload;
        
        if (eventType === 'INSERT' || eventType === 'UPDATE') {
          await putRecord(table, newRecord);
        } else if (eventType === 'DELETE') {
          await deleteRecord(table, oldRecord.id);
        }
        
        notifyDataChange('REALTIME_UPDATE');
      })
      .subscribe();
  });

  isRealtimeInitialized = true;
}

export function subscribeNetworkStatus(callback) {
  listeners.add(callback);
  callback({ isOnline, isSyncing });
  return () => listeners.delete(callback);
}

function notifyStatusChange() {
  getPendingCount().then((count) => {
    listeners.forEach((cb) => cb({ isOnline, isSyncing, pendingCount: count }));
  });
}

export async function getPendingCount() {
  try {
    const queue = await getAllFromStore('syncQueue');
    return queue.length;
  } catch (e) {
    return 0;
  }
}

export async function queueOfflineAction(action, entity, data) {
  const db = await initDB();
  const queueItem = {
    action, // 'CREATE', 'UPDATE', 'DELETE', 'ANNUL'
    entity, // 'movements', 'tithes', 'offerings', 'projects', 'votes', 'committees'
    data,
    timestamp: Date.now()
  };
  
  await db.add('syncQueue', queueItem);
  notifyStatusChange();
  notifyDataChange('QUEUE_UPDATED', { entity });

  // Si estamos en línea, intentar sincronizar de inmediato
  if (isOnline) {
    triggerBackgroundSync();
  }
}

export async function triggerBackgroundSync() {
  if (isSyncing || !isOnline) return;

  try {
    isSyncing = true;
    notifyStatusChange();

    const db = await initDB();
    const queue = await getAllFromStore('syncQueue');

    if (queue.length > 0) {
      // Sincronizar cola enviando a Supabase
      for (const item of queue) {
        let success = true;
        
        if (supabase) {
          if (item.action === 'CREATE' || item.action === 'UPDATE' || item.action === 'ANNUL') {
            const { error } = await supabase.from(item.entity).upsert(item.data);
            if (error) {
              console.error(`Error enviando ${item.entity} a Supabase:`, error);
              success = false;
            }
          } else if (item.action === 'DELETE') {
            const { error } = await supabase.from(item.entity).delete().match({ id: item.data.id });
            if (error) {
               console.error(`Error eliminando en Supabase:`, error);
               success = false;
            }
          }
        }
        
        if (success) {
          // Guardar el registro procesado de forma definitiva (en IndexedDB local)
          await putRecord(item.entity, item.data);
          
          // Eliminar de la cola de pendientes local
          await deleteRecord('syncQueue', item.id);
          notifyStatusChange();
        } else {
          // Si falla un elemento de la cola, detenemos el proceso para no perder el orden
          throw new Error(`Sincronización pausada debido a error en el elemento de la cola de tipo: ${item.entity}`);
        }
      }
    }

    // Regla de Oro: Solo cuando la cola está 100% vacía, se puede descargar información de la nube central
    const remainingQueue = await getAllFromStore('syncQueue');
    if (remainingQueue.length === 0) {
      await fetchFreshDataFromCloud();
    }
  } catch (err) {
    console.error('Error durante la sincronización en segundo plano:', err);
  } finally {
    isSyncing = false;
    notifyStatusChange();
    notifyDataChange('SYNC_COMPLETED');
  }
}

async function fetchFreshDataFromCloud() {
  if (!supabase) return;
  // Descarga de datos reales desde Supabase a IndexedDB local
  const entities = ['users', 'congregations', 'committees', 'projects', 'tithes', 'offerings', 'movements', 'votes'];
  
  for (const entity of entities) {
    const { data, error } = await supabase.from(entity).select('*');
    if (data && !error) {
      for (const record of data) {
         // Sobrescribe la DB local con la fuente de verdad (Nube)
         await putRecord(entity, record);
      }
    } else if (error) {
      console.error(`Error obteniendo ${entity} de Supabase:`, error);
    }
  }
}
