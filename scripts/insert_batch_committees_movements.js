import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://sbzwjddntsrbnwirrtzi.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNiendqZGRudHNyYm53aXJydHppIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU4OTA1NjEsImV4cCI6MjEwMTQ2NjU2MX0.0qsBmHNUv7-Dhel1Uh5SOPQ9pZcQk16XmAbMTYrM6H8';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function insertAllCommitteesMovements() {
  console.log('--- BUSCANDO CONGREGACIÓN Y COMITÉS ---');
  const { data: congs } = await supabase.from('congregations').select('*');
  const targetCongregationId = congs?.[0]?.id || 'cong-zuluaga';

  const { data: coms } = await supabase.from('committees').select('*').eq('congregationId', targetCongregationId);

  const getCommittee = (term) => {
    return coms?.find(c => {
      const name = c.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      return name.includes(term.toLowerCase());
    });
  };

  const ujieresCom = getCommittee('ujier');
  const familiaCom = getCommittee('familia');
  const jovenesCom = getCommittee('joven');
  const intercesionCom = getCommittee('intercesi');

  console.log('Ujieres:', ujieresCom?.name, ujieresCom?.id);
  console.log('Familia:', familiaCom?.name, familiaCom?.id);
  console.log('Jóvenes:', jovenesCom?.name, jovenesCom?.id);
  console.log('Intercesión:', intercesionCom?.name, intercesionCom?.id);

  const batches = [
    // 1. Ujieres
    {
      committee: ujieresCom,
      movements: [
        { date: '2026-05-15', description: 'Aporte', type: 'INGRESO', amount: 40000 },
        { date: '2026-05-12', description: 'Aporte', type: 'INGRESO', amount: 20000 },
      ]
    },
    // 2. Familia
    {
      committee: familiaCom,
      movements: [
        { date: '2026-03-15', description: 'Aseo', type: 'INGRESO', amount: 400000 },
        { date: '2026-05-30', description: 'Aseo', type: 'INGRESO', amount: 400000 },
        { date: '2026-03-15', description: 'Pollos', type: 'EGRESO', amount: 700000 },
      ]
    },
    // 3. Jóvenes
    {
      committee: jovenesCom,
      movements: [
        { date: '2026-02-15', description: 'Aporte', type: 'INGRESO', amount: 280000 },
      ]
    },
    // 4. Intercesión
    {
      committee: intercesionCom,
      movements: [
        { date: '2026-02-15', description: 'Aporte', type: 'INGRESO', amount: 170000 },
        { date: '2026-04-25', description: 'Aporte', type: 'INGRESO', amount: 50000 },
        { date: '2026-06-14', description: 'Aporte', type: 'INGRESO', amount: 200000 },
        { date: '2026-06-27', description: 'Aporte', type: 'INGRESO', amount: 150000 },
        { date: '2026-07-04', description: 'Evento', type: 'EGRESO', amount: 300000 },
      ]
    }
  ];

  for (const batch of batches) {
    if (!batch.committee) {
      console.error(`Comité no encontrado en lote`);
      continue;
    }

    console.log(`\n========================================`);
    console.log(`Procesando: ${batch.committee.name} (ID: ${batch.committee.id})`);

    const payload = batch.movements.map((item, index) => ({
      id: `mov-${batch.committee.id.slice(-4)}-${item.date}-${index + 1}-${Date.now()}`,
      congregationId: targetCongregationId,
      committeeId: batch.committee.id,
      type: item.type,
      amount: item.amount,
      description: item.description,
      date: item.date,
      annulled: false,
      annulReason: '',
      createdAt: Date.now() + index
    }));

    const { data, error } = await supabase.from('movements').insert(payload).select();
    if (error) {
      console.error(`Error insertando en ${batch.committee.name}:`, error);
    } else {
      console.log(`✅ ${data.length} movimientos insertados en ${batch.committee.name}.`);

      // Recalcular saldo exacto
      const { data: allMovs } = await supabase.from('movements').select('*').eq('committeeId', batch.committee.id).eq('annulled', false);
      const totalIng = allMovs?.filter(m => m.type === 'INGRESO').reduce((acc, m) => acc + m.amount, 0) || 0;
      const totalEgr = allMovs?.filter(m => m.type === 'EGRESO').reduce((acc, m) => acc + m.amount, 0) || 0;
      const nuevoSaldo = totalIng - totalEgr;

      console.log(`Ingresos: $ ${totalIng.toLocaleString('es-CO')} | Egresos: $ ${totalEgr.toLocaleString('es-CO')} | Saldo Neto: $ ${nuevoSaldo.toLocaleString('es-CO')}`);
      await supabase.from('committees').update({ balance: nuevoSaldo, updatedAt: Date.now() }).eq('id', batch.committee.id);
    }
  }

  console.log('\n--- TODOS LOS MOVIMIENTOS HAN SIDO PROCESADOS EXITOSAMENTE ---');
}

insertAllCommitteesMovements();
