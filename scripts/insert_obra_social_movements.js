import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://sbzwjddntsrbnwirrtzi.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNiendqZGRudHNyYm53aXJydHppIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU4OTA1NjEsImV4cCI6MjEwMTQ2NjU2MX0.0qsBmHNUv7-Dhel1Uh5SOPQ9pZcQk16XmAbMTYrM6H8';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function insertObraSocialMovements() {
  console.log('--- BUSCANDO COMITÉ DE OBRA SOCIAL ---');
  const { data: congs } = await supabase.from('congregations').select('*');
  const targetCongregationId = congs?.[0]?.id || 'cong-zuluaga';

  const { data: coms } = await supabase.from('committees').select('*').eq('congregationId', targetCongregationId);
  const osCommittee = coms?.find(c => {
    const name = c.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    return name.includes('obra') || name.includes('social');
  });

  if (!osCommittee) {
    console.error('No se encontró el comité de Obra Social');
    return;
  }

  console.log(`Comité encontrado: ${osCommittee.name} (ID: ${osCommittee.id})`);

  // Lista de 10 movimientos (8 Ingresos, 2 Egresos)
  const rawMovements = [
    { date: '2026-01-01', description: 'Año Anterior', type: 'INGRESO', amount: 1192600 },
    { date: '2026-02-15', description: 'Aporte', type: 'INGRESO', amount: 342000 },
    { date: '2026-04-19', description: 'Aporte', type: 'INGRESO', amount: 105000 },
    { date: '2026-04-19', description: 'Aporte', type: 'INGRESO', amount: 230000 },
    { date: '2026-05-15', description: 'Aporte', type: 'INGRESO', amount: 473000 },
    { date: '2026-06-28', description: 'Aporte', type: 'INGRESO', amount: 731000 },
    { date: '2026-06-28', description: 'Aporte', type: 'INGRESO', amount: 300000 },
    { date: '2026-06-28', description: 'Aporte', type: 'INGRESO', amount: 700000 },
    { date: '2026-01-25', description: 'Ayuda', type: 'EGRESO', amount: 400000 },
    { date: '2026-03-29', description: 'Evento', type: 'EGRESO', amount: 100000 },
  ];

  console.log(`\n--- INSERTANDO ${rawMovements.length} MOVIMIENTOS EN OBRA SOCIAL ---`);

  const payload = rawMovements.map((item, index) => {
    return {
      id: `mov-os-${item.date}-${String(index + 1).padStart(2, '0')}-${Date.now()}`,
      congregationId: targetCongregationId,
      committeeId: osCommittee.id,
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
    console.error('Error insertando movimientos de Obra Social:', error);
  } else {
    console.log(`✅ ¡Éxito! Se insertaron ${data.length} movimientos en Obra Social.`);
    const totalIngresos = payload.filter(m => m.type === 'INGRESO').reduce((acc, m) => acc + m.amount, 0);
    const totalEgresos = payload.filter(m => m.type === 'EGRESO').reduce((acc, m) => acc + m.amount, 0);
    const saldoNeto = totalIngresos - totalEgresos;

    console.log(`🟢 Total Ingresos Obra Social: $ ${totalIngresos.toLocaleString('es-CO')}`);
    console.log(`🔴 Total Egresos Obra Social: $ ${totalEgresos.toLocaleString('es-CO')}`);
    console.log(`💰 Saldo Neto Obra Social: $ ${saldoNeto.toLocaleString('es-CO')}`);

    // Actualizar balance en el comité
    await supabase.from('committees').update({ balance: saldoNeto, updatedAt: Date.now() }).eq('id', osCommittee.id);
  }
}

insertObraSocialMovements();
