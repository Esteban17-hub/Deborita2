import { supabase } from '../services/supabaseClient';

/**
 * Registra una acción en el log de auditoría
 */
export async function logAuditAction({
  congregationId = 'global',
  userName = 'Usuario',
  userRole = 'USER',
  action = 'ACTION',
  entity = 'GENERAL',
  details = ''
}) {
  try {
    const newLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      congregationId,
      userName,
      userRole,
      action, // 'CREAR' | 'EDITAR' | 'ELIMINAR' | 'ANULAR' | 'LOGIN' | 'CAMBIO_PIN'
      entity, // 'DIEZMO' | 'OFRENDA' | 'MOVIMIENTO' | 'COMITE' | 'USUARIO' | 'CONGREGACION'
      details,
      createdAt: Date.now()
    };

    // Intentar insertar en Supabase
    await supabase.from('audit_logs').insert(newLog);

    // Guardar también copia local en sessionStorage/localStorage para redundancia
    try {
      const stored = JSON.parse(localStorage.getItem('deborita_local_audit') || '[]');
      stored.unshift(newLog);
      if (stored.length > 200) stored.pop(); // Mantener últimos 200
      localStorage.setItem('deborita_local_audit', JSON.stringify(stored));
    } catch (_) {}

  } catch (err) {
    console.warn('No se pudo guardar el log de auditoría en la nube:', err.message);
  }
}
