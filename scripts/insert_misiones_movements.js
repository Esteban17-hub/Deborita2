import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://sbzwjddntsrbnwirrtzi.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNiendqZGRudHNyYm53aXJydHppIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU4OTA1NjEsImV4cCI6MjEwMTQ2NjU2MX0.0qsBmHNUv7-Dhel1Uh5SOPQ9pZcQk16XmAbMTYrM6H8';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function insertMisionesMovements() {
  console.log('--- BUSCANDO COMITÉ DE MISIONES ---');
  const { data: congs } = await supabase.from('congregations').select('*');
  const targetCongregationId = congs?.[0]?.id || 'cong-zuluaga';

  const { data: coms } = await supabase.from('committees').select('*').eq('congregationId', targetCongregationId);
  const misionesCommittee = coms?.find(c => {
    const name = c.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    return name.includes('mision');
  });

  if (!misionesCommittee) {
    console.error('No se encontró el comité de Misiones');
    return;
  }

  console.log(`Comité encontrado: ${misionesCommittee.name} (ID: ${misionesCommittee.id})`);

  // Lista de 20 movimientos de Misiones
  const rawMovements = [
    { date: '2026-02-15', description: 'Aporte', amount: 130000 },
    { date: '2026-03-22', description: 'Aporte', amount: 551000 },
    { date: '2026-04-19', description: 'Aporte', amount: 120000 },
    { date: '2026-04-19', description: 'Aporte', amount: 80000 },
    { date: '2026-04-19', description: 'Aporte', amount: 20000 },
    { date: '2026-05-10', description: 'Asignacion del fondo local', amount: 1000000 },
    { date: '2026-05-17', description: 'Aporte', amount: 20000 },
    { date: '2026-05-17', description: 'Aporte', amount: 70000 },
    { date: '2026-05-17', description: 'Aporte', amount: 162000 },
    { date: '2026-05-17', description: 'Aporte', amount: 337000 },
    { date: '2026-06-07', description: 'Aporte', amount: 302000 },
    { date: '2026-06-21', description: 'Aporte', amount: 215000 },
    { date: '2026-06-21', description: 'Aporte', amount: 263000 },
    { date: '2026-06-14', description: 'Aporte', amount: 100000 },
    { date: '2026-06-14', description: 'Aporte', amount: 50000 },
    { date: '2026-06-28', description: 'Aporte', amount: 237000 },
    { date: '2026-07-05', description: 'Aporte', amount: 900000 },
    { date: '2026-07-05', description: 'Aporte', amount: 20000 },
    { date: '2026-07-05', description: 'Aporte', amount: 400000 },
    { date: '2026-07-12', description: 'Aporte', amount: 112900 },
  ];

  console.log(`\n--- INSERTANDO ${rawMovements.length} MOVIMIENTOS DE INGRESO EN MISIONES ---`);

  const payload = rawMovements.map((item, index) => {
    return {
      id: `mov-mis-${item.date}-${String(index + 1).padStart(2, '0')}-${Date.now()}`,
      congregationId: targetCongregationId,
      committeeId: misionesCommittee.id,
      type: 'INGRESO',
      amount: item.amount,
      description: item.description,
      date: item.date,
      annulled: false,
      annulReason: '',
      createdAt: Date.now() + index
    };
  });

  const { data, error } = await supabase.from('movements').insert(payload).select();
  if (error) {
    console.error('Error insertando movimientos de Misiones:', error);
  } else {
    console.log(`✅ ¡Éxito! Se insertaron ${data.length} movimientos de ingreso en Misiones.`);
    const totalIngresos = payload.reduce((acc, m) => acc + m.amount, 0);
    console.log(`💰 Saldo Total de Ingresos Misiones: $ ${totalIngresos.toLocaleString('es-CO')}`);

    // Actualizar balance en el comité
    await supabase.from('committees').update({ balance: totalIngresos, updatedAt: Date.now() }).eq('id', misionesCommittee.id);
  }
}

insertMisionesMovements();
