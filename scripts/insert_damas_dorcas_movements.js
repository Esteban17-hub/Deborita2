import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://sbzwjddntsrbnwirrtzi.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNiendqZGRudHNyYm53aXJydHppIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU4OTA1NjEsImV4cCI6MjEwMTQ2NjU2MX0.0qsBmHNUv7-Dhel1Uh5SOPQ9pZcQk16XmAbMTYrM6H8';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function insertDamasDorcasMovements() {
  console.log('--- BUSCANDO COMITÉ DE DAMAS DORCAS ---');
  const { data: congs } = await supabase.from('congregations').select('*');
  const targetCongregationId = congs?.[0]?.id || 'cong-zuluaga';

  const { data: coms } = await supabase.from('committees').select('*').eq('congregationId', targetCongregationId);
  const dorcasCommittee = coms?.find(c => {
    const name = c.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    return name.includes('dorcas') || name.includes('damas');
  });

  if (!dorcasCommittee) {
    console.error('No se encontró el comité de Damas Dorcas');
    return;
  }

  console.log(`Comité encontrado: ${dorcasCommittee.name} (ID: ${dorcasCommittee.id})`);

  // Lista de 8 movimientos (4 Ingresos, 4 Egresos)
  const rawMovements = [
    { date: '2026-02-28', description: 'Aseo', type: 'INGRESO', amount: 400000 },
    { date: '2026-04-09', description: 'Actividad', type: 'INGRESO', amount: 400000 },
    { date: '2026-06-07', description: 'Aporte', type: 'INGRESO', amount: 200000 },
    { date: '2026-05-05', description: 'Viáticos', type: 'EGRESO', amount: 150000 },
    { date: '2026-04-26', description: 'Culto', type: 'EGRESO', amount: 600000 },
    { date: '2026-06-07', description: 'Evento', type: 'EGRESO', amount: 200000 },
    { date: '2026-07-31', description: 'Aseo', type: 'INGRESO', amount: 400000 },
    { date: '2026-08-02', description: 'Evento Edad Dorada', type: 'EGRESO', amount: 300000 },
  ];

  console.log(`\n--- INSERTANDO ${rawMovements.length} MOVIMIENTOS EN DAMAS DORCAS ---`);

  const payload = rawMovements.map((item, index) => {
    return {
      id: `mov-dor-${item.date}-${String(index + 1).padStart(2, '0')}-${Date.now()}`,
      congregationId: targetCongregationId,
      committeeId: dorcasCommittee.id,
      type: item.type,
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
    console.error('Error insertando movimientos de Damas Dorcas:', error);
  } else {
    console.log(`✅ ¡Éxito! Se insertaron ${data.length} movimientos en Damas Dorcas.`);
    const totalIngresos = payload.filter(m => m.type === 'INGRESO').reduce((acc, m) => acc + m.amount, 0);
    const totalEgresos = payload.filter(m => m.type === 'EGRESO').reduce((acc, m) => acc + m.amount, 0);
    const saldoNeto = totalIngresos - totalEgresos;

    console.log(`🟢 Total Ingresos Damas Dorcas: $ ${totalIngresos.toLocaleString('es-CO')}`);
    console.log(`🔴 Total Egresos Damas Dorcas: $ ${totalEgresos.toLocaleString('es-CO')}`);
    console.log(`💰 Saldo Neto Damas Dorcas: $ ${saldoNeto.toLocaleString('es-CO')}`);

    // Actualizar balance en el comité
    await supabase.from('committees').update({ balance: saldoNeto, updatedAt: Date.now() }).eq('id', dorcasCommittee.id);
  }
}

insertDamasDorcasMovements();
