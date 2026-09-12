import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://sbzwjddntsrbnwirrtzi.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNiendqZGRudHNyYm53aXJydHppIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU4OTA1NjEsImV4cCI6MjEwMTQ2NjU2MX0.0qsBmHNUv7-Dhel1Uh5SOPQ9pZcQk16XmAbMTYrM6H8';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function insertEscuelaDominicalMovements() {
  console.log('--- BUSCANDO COMITÉ DE ESCUELA DOMINICAL ---');
  const { data: congs } = await supabase.from('congregations').select('*');
  const targetCongregationId = congs?.[0]?.id || 'cong-zuluaga';

  const { data: coms } = await supabase.from('committees').select('*').eq('congregationId', targetCongregationId);
  const edCommittee = coms?.find(c => {
    const name = c.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    return name.includes('escuela') || name.includes('educacion');
  });

  if (!edCommittee) {
    console.error('No se encontró el comité de Escuela Dominical');
    return;
  }

  console.log(`Comité encontrado: ${edCommittee.name} (ID: ${edCommittee.id})`);

  // Lista exacta de movimientos
  const rawMovements = [
    { date: '2026-06-01', description: 'Cierre a Mayo', amount: 53100 },
    { date: '2026-06-07', description: 'Ofrenda E.D', amount: 94000 },
    { date: '2026-06-14', description: 'Ofrenda E.D', amount: 91250 },
    { date: '2026-06-21', description: 'Ofrenda E.D', amount: 113300 },
    { date: '2026-06-28', description: 'Ofrenda E.D', amount: 108250 },
    { date: '2026-06-12', description: 'Ofrenda E.D', amount: 100000 },
    { date: '2026-07-05', description: 'Ofrenda E.D', amount: 115300 },
    { date: '2026-07-12', description: 'Ofrenda E.D', amount: 81100 },
    { date: '2026-07-19', description: 'Ofrenda E.D', amount: 77350 },
    { date: '2026-07-26', description: 'Ofrenda E.D', amount: 117850 },
    { date: '2026-07-26', description: 'Aporte', amount: 100000 },
  ];

  console.log(`\n--- INSERTANDO ${rawMovements.length} MOVIMIENTOS DE INGRESO ---`);

  const payload = rawMovements.map((item, index) => {
    return {
      id: `mov-ed-${item.date}-${String(index + 1).padStart(2, '0')}-${Date.now()}`,
      congregationId: targetCongregationId,
      committeeId: edCommittee.id,
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
    console.error('Error insertando movimientos:', error);
  } else {
    console.log(`✅ ¡Éxito! Se insertaron ${data.length} movimientos de ingreso en Escuela Dominical.`);
    const totalIngresos = payload.reduce((acc, m) => acc + m.amount, 0);
    console.log(`💰 Saldo Total de Ingresos Escuela Dominical: $ ${totalIngresos.toLocaleString('es-CO')}`);

    // Actualizar también balance del comité
    await supabase.from('committees').update({ balance: totalIngresos, updatedAt: Date.now() }).eq('id', edCommittee.id);
  }
}

insertEscuelaDominicalMovements();
