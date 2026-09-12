import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://sbzwjddntsrbnwirrtzi.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNiendqZGRudHNyYm53aXJydHppIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU4OTA1NjEsImV4cCI6MjEwMTQ2NjU2MX0.0qsBmHNUv7-Dhel1Uh5SOPQ9pZcQk16XmAbMTYrM6H8';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function insertOfferings() {
  console.log('--- OBTENIENDO CONGREGACIONES Y COMITÉS ---');
  const { data: congs } = await supabase.from('congregations').select('*');
  console.log('Congregaciones:', congs);

  const { data: coms } = await supabase.from('committees').select('*');
  console.log('Comités encontrados:', coms?.map(c => ({ id: c.id, name: c.name, congregationId: c.congregationId })));

  const targetCongregationId = congs?.[0]?.id || 'cong-zuluaga';
  console.log('Usando congregación:', targetCongregationId);

  // Mapear nombres a IDs
  function getCommitteeId(name) {
    const cleanName = name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
    
    // Buscar comité de la congregación
    const match = coms?.find(c => {
      if (c.congregationId && c.congregationId !== targetCongregationId) return false;
      const cClean = c.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
      return cClean.includes(cleanName) || cleanName.includes(cClean);
    });

    if (match) return match.id;

    // Si es Junta Local o General o no existe comité específico, buscar 'Junta Local' o null
    const junta = coms?.find(c => c.name.toLowerCase().includes('junta') || c.name.toLowerCase().includes('general'));
    return junta ? junta.id : null;
  }

  // Lista exacta de la imagen del usuario:
  const rawOfferings = [
    { date: '2026-07-02', dayOfWeek: 'Jueves', committeeName: 'Intercesion', amount: 129600, notes: '' },
    { date: '2026-07-03', dayOfWeek: 'Viernes', committeeName: 'Intercesion', amount: 153200, notes: '' },
    { date: '2026-07-04', dayOfWeek: 'Sábado', committeeName: 'Alabanza', amount: 153200, notes: '' },
    { date: '2026-07-05', dayOfWeek: 'Domingo', committeeName: 'Misiones', amount: 525000, notes: 'Misionera Nacional' },
    { date: '2026-07-07', dayOfWeek: 'Martes', committeeName: 'Ujieres', amount: 46000, notes: '' },
    { date: '2026-07-09', dayOfWeek: 'Jueves', committeeName: 'Junta Local', amount: 81100, notes: '' },
    { date: '2026-07-11', dayOfWeek: 'Sábado', committeeName: 'Jovenes', amount: 401150, notes: '' },
    { date: '2026-07-12', dayOfWeek: 'Domingo', committeeName: 'Junta Local', amount: 715500, notes: '' },
    { date: '2026-07-14', dayOfWeek: 'Martes', committeeName: 'Obra Social', amount: 115600, notes: '' },
    { date: '2026-07-16', dayOfWeek: 'Jueves', committeeName: 'Junta Local', amount: 158200, notes: '' },
    { date: '2026-07-18', dayOfWeek: 'Sábado', committeeName: 'Damas Dorcas', amount: 115600, notes: '' },
    { date: '2026-07-19', dayOfWeek: 'Domingo', committeeName: 'Junta Local', amount: 682700, notes: 'Ofrenda venezuela' },
    { date: '2026-07-21', dayOfWeek: 'Martes', committeeName: 'Educacion Cristiana', amount: 46000, notes: '' },
    { date: '2026-07-23', dayOfWeek: 'Jueves', committeeName: 'Junta Local', amount: 101000, notes: '' },
    { date: '2026-07-25', dayOfWeek: 'Sábado', committeeName: 'Familia', amount: 242300, notes: '' },
    { date: '2026-07-26', dayOfWeek: 'Domingo', committeeName: 'Junta Local', amount: 383000, notes: '' },
    { date: '2026-07-26', dayOfWeek: 'Domingo', committeeName: 'Junta Local', amount: 300000, notes: 'Pro Asamblea' },
    { date: '2026-07-28', dayOfWeek: 'Martes', committeeName: 'Intercesion', amount: 741000, notes: '' },
    { date: '2026-07-30', dayOfWeek: 'Jueves', committeeName: 'Junta Local', amount: 224400, notes: '' },
  ];

  // Eliminar anteriores para no duplicar
  await supabase.from('offerings').delete().eq('congregationId', targetCongregationId);

  const offeringsToInsert = rawOfferings.map((item, index) => {
    const committeeId = getCommitteeId(item.committeeName);
    const obsText = item.notes ? item.notes.trim() : null;

    return {
      id: `off-2026-07-${String(index + 1).padStart(2, '0')}-${Date.now()}`,
      congregationId: targetCongregationId,
      destinationCommitteeId: committeeId,
      type: 'OFRENDA',
      amount: item.amount,
      description: obsText,
      notes: obsText,
      date: item.date,
      dayOfWeek: item.dayOfWeek,
      responsible: 'Tesorero General',
      createdAt: Date.now() + index
    };
  });

  const { data, error } = await supabase.from('offerings').insert(offeringsToInsert).select();
  if (error) {
    console.error('Error al insertar:', error);
  } else {
    console.log(`✅ ¡Éxito! Se insertaron ${data.length} ofrendas correctamente.`);
    console.log('Total recaudado en ofrendas:', offeringsToInsert.reduce((acc, o) => acc + o.amount, 0));
  }
}

insertOfferings();
