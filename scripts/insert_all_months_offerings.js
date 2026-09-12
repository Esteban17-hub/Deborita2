import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://sbzwjddntsrbnwirrtzi.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNiendqZGRudHNyYm53aXJydHppIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU4OTA1NjEsImV4cCI6MjEwMTQ2NjU2MX0.0qsBmHNUv7-Dhel1Uh5SOPQ9pZcQk16XmAbMTYrM6H8';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function insertAllMonths() {
  console.log('--- OBTENIENDO CONGREGACIONES Y COMITÉS ---');
  const { data: congs } = await supabase.from('congregations').select('*');
  const targetCongregationId = congs?.[0]?.id || 'cong-zuluaga';
  console.log('Congregación seleccionada:', targetCongregationId);

  const { data: coms } = await supabase.from('committees').select('*');

  function getCommitteeId(name) {
    const cleanName = name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
    
    // Buscar comité
    const match = coms?.find(c => {
      if (c.congregationId && c.congregationId !== targetCongregationId) return false;
      const cClean = c.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
      return cClean.includes(cleanName) || cleanName.includes(cClean);
    });

    if (match) return match.id;

    // Si es Junta Local o General
    const junta = coms?.find(c => c.name.toLowerCase().includes('junta') || c.name.toLowerCase().includes('general'));
    return junta ? junta.id : null;
  }

  // 1. MAYO 2026
  const mayoOfferings = [
    { date: '2026-05-02', dayOfWeek: 'Sábado', committeeName: 'Alabanza', amount: 164800, notes: '' },
    { date: '2026-05-03', dayOfWeek: 'Domingo', committeeName: 'Misiones', amount: 400000, notes: 'Misionera Nacional' },
    { date: '2026-05-03', dayOfWeek: 'Domingo', committeeName: 'Damas Dorcas', amount: 787700, notes: 'Culto Misionero' },
    { date: '2026-05-05', dayOfWeek: 'Martes', committeeName: 'Ujieres', amount: 75000, notes: '' },
    { date: '2026-05-07', dayOfWeek: 'Jueves', committeeName: 'Junta Local', amount: 147750, notes: '' },
    { date: '2026-05-09', dayOfWeek: 'Sábado', committeeName: 'Intercesion', amount: 296950, notes: '' },
    { date: '2026-05-10', dayOfWeek: 'Domingo', committeeName: 'Educacion Cristiana', amount: 512500, notes: '' },
    { date: '2026-05-12', dayOfWeek: 'Martes', committeeName: 'Obra Social', amount: 54000, notes: '' },
    { date: '2026-05-14', dayOfWeek: 'Jueves', committeeName: 'Junta Local', amount: 150000, notes: '' },
    { date: '2026-05-16', dayOfWeek: 'Sábado', committeeName: 'Jovenes', amount: 180750, notes: '' },
    { date: '2026-05-17', dayOfWeek: 'Domingo', committeeName: 'Junta Local', amount: 507950, notes: '' },
    { date: '2026-05-19', dayOfWeek: 'Martes', committeeName: 'Misiones', amount: 100900, notes: 'Lideres de Sector' },
    { date: '2026-05-21', dayOfWeek: 'Jueves', committeeName: 'Misiones', amount: 63700, notes: '' },
    { date: '2026-05-23', dayOfWeek: 'Sábado', committeeName: 'Familia', amount: 157700, notes: '' },
    { date: '2026-05-24', dayOfWeek: 'Domingo', committeeName: 'Junta Local', amount: 300000, notes: 'Pro Asamblea' },
    { date: '2026-05-24', dayOfWeek: 'Domingo', committeeName: 'Junta Local', amount: 300000, notes: '' },
    { date: '2026-05-26', dayOfWeek: 'Martes', committeeName: 'Decom', amount: 60650, notes: 'Con Sonido' },
    { date: '2026-05-28', dayOfWeek: 'Jueves', committeeName: 'Junta Local', amount: 111650, notes: '' },
    { date: '2026-05-30', dayOfWeek: 'Sábado', committeeName: 'Escuela Dominical', amount: 178300, notes: 'Maestros' },
    { date: '2026-05-31', dayOfWeek: 'Domingo', committeeName: 'Junta Local', amount: 554300, notes: 'Dia de primicias' },
  ];

  // 2. JUNIO 2026
  const junioOfferings = [
    { date: '2026-06-02', dayOfWeek: 'Martes', committeeName: 'Ujieres', amount: 65500, notes: '' },
    { date: '2026-06-04', dayOfWeek: 'Jueves', committeeName: 'Junta Local', amount: 141300, notes: 'Banco de Recursos' },
    { date: '2026-06-06', dayOfWeek: 'Sábado', committeeName: 'Alabanza', amount: 127700, notes: '' },
    { date: '2026-06-07', dayOfWeek: 'Domingo', committeeName: 'Misiones', amount: 878700, notes: 'Misionera Nacional' },
    { date: '2026-06-09', dayOfWeek: 'Martes', committeeName: 'Intercesion', amount: 69000, notes: '' },
    { date: '2026-06-11', dayOfWeek: 'Jueves', committeeName: 'Junta Local', amount: 123000, notes: '' },
    { date: '2026-06-12', dayOfWeek: 'Viernes', committeeName: 'Escuela Dominical', amount: 501600, notes: 'Vigilia Distrital' },
    { date: '2026-06-13', dayOfWeek: 'Sábado', committeeName: 'Damas Dorcas', amount: 144600, notes: '' },
    { date: '2026-06-14', dayOfWeek: 'Domingo', committeeName: 'Jovenes', amount: 977200, notes: 'Misionera Jovenes' },
    { date: '2026-06-16', dayOfWeek: 'Martes', committeeName: 'Obra Social', amount: 71800, notes: '' },
    { date: '2026-06-18', dayOfWeek: 'Jueves', committeeName: 'Junta Local', amount: 111650, notes: '' },
    { date: '2026-06-20', dayOfWeek: 'Sábado', committeeName: 'Familia', amount: 247000, notes: '' },
    { date: '2026-06-21', dayOfWeek: 'Domingo', committeeName: 'Junta Local', amount: 595600, notes: '' },
    { date: '2026-06-23', dayOfWeek: 'Martes', committeeName: 'Misiones', amount: 77000, notes: 'Lideres de Sector' },
    { date: '2026-06-25', dayOfWeek: 'Jueves', committeeName: 'Junta Local', amount: 259350, notes: '' },
    { date: '2026-06-27', dayOfWeek: 'Sábado', committeeName: 'Educacion Cristiana', amount: 281200, notes: '' },
    { date: '2026-06-28', dayOfWeek: 'Domingo', committeeName: 'Junta Local', amount: 349000, notes: '' },
    { date: '2026-06-28', dayOfWeek: 'Domingo', committeeName: 'Junta Local', amount: 300000, notes: 'Pro Asamblea' },
    { date: '2026-06-30', dayOfWeek: 'Martes', committeeName: 'Decom', amount: 99300, notes: 'Con Sonido' },
  ];

  // 3. JULIO 2026
  const julioOfferings = [
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

  // 4. AGOSTO 2026
  const agostoOfferings = [
    { date: '2026-08-01', dayOfWeek: 'Sábado', committeeName: 'Jovenes', amount: 222400, notes: '' },
    { date: '2026-08-02', dayOfWeek: 'Domingo', committeeName: 'Misiones', amount: 848000, notes: 'Misionera Nacional' },
    { date: '2026-08-04', dayOfWeek: 'Martes', committeeName: 'Ujieres', amount: 0, notes: '' },
    { date: '2026-08-06', dayOfWeek: 'Jueves', committeeName: 'Junta Local', amount: 100000, notes: '' },
    { date: '2026-08-08', dayOfWeek: 'Sábado', committeeName: 'Intercesion', amount: 167000, notes: '' },
    { date: '2026-08-09', dayOfWeek: 'Domingo', committeeName: 'Junta Local', amount: 693000, notes: '' },
  ];

  const allRaw = [
    ...mayoOfferings,
    ...junioOfferings,
    ...julioOfferings,
    ...agostoOfferings
  ];

  console.log(`\n--- INSERTANDO ${allRaw.length} OFRENDAS TOTALES (Mayo, Junio, Julio, Agosto 2026) ---`);

  // Limpiar anteriores de esta congregación
  await supabase.from('offerings').delete().eq('congregationId', targetCongregationId);

  const payload = allRaw.map((item, index) => {
    const committeeId = getCommitteeId(item.committeeName);
    const obsText = item.notes ? item.notes.trim() : null;

    return {
      id: `off-${item.date}-${String(index + 1).padStart(3, '0')}`,
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

  const { data, error } = await supabase.from('offerings').insert(payload).select();
  if (error) {
    console.error('Error:', error);
  } else {
    console.log(`✅ ¡Éxito rotundo! Se insertaron ${data.length} ofrendas correctamente.`);
    const grandTotal = payload.reduce((acc, o) => acc + o.amount, 0);
    console.log(`💰 Gran Total Ofrendas (Mayo a Agosto): $ ${grandTotal.toLocaleString('es-CO')}`);
  }
}

insertAllMonths();
