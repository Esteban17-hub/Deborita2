import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://sbzwjddntsrbnwirrtzi.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNiendqZGRudHNyYm53aXJydHppIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU4OTA1NjEsImV4cCI6MjEwMTQ2NjU2MX0.0qsBmHNUv7-Dhel1Uh5SOPQ9pZcQk16XmAbMTYrM6H8';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function insertAlabanzaMovements() {
  console.log('--- BUSCANDO COMITÉ DE ALABANZA ---');
  const { data: congs } = await supabase.from('congregations').select('*');
  const targetCongregationId = congs?.[0]?.id || 'cong-zuluaga';

  const { data: coms } = await supabase.from('committees').select('*').eq('congregationId', targetCongregationId);
  const alabanzaCommittee = coms?.find(c => {
    const name = c.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    return name.includes('alabanza');
  });

  if (!alabanzaCommittee) {
    console.error('No se encontró el comité de Alabanza');
    return;
  }

  console.log(`Comité encontrado: ${alabanzaCommittee.name} (ID: ${alabanzaCommittee.id})`);

  // Lista de 7 movimientos (6 Ingresos, 1 Egreso)
  const rawMovements = [
    { date: '2026-04-18', description: 'Aporte', type: 'INGRESO', amount: 160000 },
    { date: '2026-06-21', description: 'Aporte', type: 'INGRESO', amount: 515000 },
    { date: '2026-06-25', description: 'Aporte', type: 'INGRESO', amount: 90000 },
    { date: '2026-02-15', description: 'Decoración', type: 'EGRESO', amount: 100000 },
    { date: '2026-07-15', description: 'Aporte', type: 'INGRESO', amount: 130000 },
    { date: '2026-07-16', description: 'Aporte', type: 'INGRESO', amount: 50000 },
    { date: '2026-07-30', description: 'Aporte', type: 'INGRESO', amount: 150000 },
  ];

  console.log(`\n--- INSERTANDO ${rawMovements.length} MOVIMIENTOS EN ALABANZA ---`);

  const payload = rawMovements.map((item, index) => {
    return {
      id: `mov-ala-${item.date}-${String(index + 1).padStart(2, '0')}-${Date.now()}`,
      congregationId: targetCongregationId,
      committeeId: alabanzaCommittee.id,
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
    console.error('Error insertando movimientos de Alabanza:', error);
  } else {
    console.log(`✅ ¡Éxito! Se insertaron ${data.length} movimientos en Alabanza.`);
    const totalIngresos = payload.filter(m => m.type === 'INGRESO').reduce((acc, m) => acc + m.amount, 0);
    const totalEgresos = payload.filter(m => m.type === 'EGRESO').reduce((acc, m) => acc + m.amount, 0);
    const saldoNeto = totalIngresos - totalEgresos;

    console.log(`🟢 Total Ingresos: $ ${totalIngresos.toLocaleString('es-CO')}`);
    console.log(`🔴 Total Egresos: $ ${totalEgresos.toLocaleString('es-CO')}`);
    console.log(`💰 Saldo Neto Alabanza: $ ${saldoNeto.toLocaleString('es-CO')}`);

    // Actualizar balance en el comité
    await supabase.from('committees').update({ balance: saldoNeto, updatedAt: Date.now() }).eq('id', alabanzaCommittee.id);
  }
}

insertAlabanzaMovements();
