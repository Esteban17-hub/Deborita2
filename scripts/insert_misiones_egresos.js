import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://sbzwjddntsrbnwirrtzi.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNiendqZGRudHNyYm53aXJydHppIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU4OTA1NjEsImV4cCI6MjEwMTQ2NjU2MX0.0qsBmHNUv7-Dhel1Uh5SOPQ9pZcQk16XmAbMTYrM6H8';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function insertMisionesEgresos() {
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

  // Lista de 5 egresos de Misiones
  const rawEgresos = [
    { 
      date: '2026-03-31', 
      description: 'Para programa con apartados en San Gerardo', 
      amount: 670000 
    },
    { 
      date: '2026-05-10', 
      description: 'Asado evangelistico:$750.000, Musicos: $100.000, Pago a Elkin: 100.000', 
      amount: 950000 
    },
    { 
      date: '2026-06-28', 
      description: 'Gastos para culto de impacto en San Miguel', 
      amount: 142800 
    },
    { 
      date: '2026-07-05', 
      description: 'Semana de evangelismo', 
      amount: 1600000 
    },
    { 
      date: '2026-07-12', 
      description: 'Semana de evangelismo', 
      amount: 713000 
    }
  ];

  console.log(`\n--- INSERTANDO ${rawEgresos.length} EGRESOS EN MISIONES ---`);

  const payload = rawEgresos.map((item, index) => {
    return {
      id: `mov-mis-egr-${item.date}-${String(index + 1).padStart(2, '0')}-${Date.now()}`,
      congregationId: targetCongregationId,
      committeeId: misionesCommittee.id,
      type: 'EGRESO',
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
    console.error('Error insertando egresos de Misiones:', error);
  } else {
    console.log(`✅ ¡Éxito! Se insertaron ${data.length} egresos en Misiones.`);

    // Recalcular saldo total de Misiones
    const { data: allMovs } = await supabase.from('movements').select('*').eq('committeeId', misionesCommittee.id).eq('annulled', false);
    const totalIng = allMovs?.filter(m => m.type === 'INGRESO').reduce((acc, m) => acc + m.amount, 0) || 0;
    const totalEgr = allMovs?.filter(m => m.type === 'EGRESO').reduce((acc, m) => acc + m.amount, 0) || 0;
    const nuevoSaldo = totalIng - totalEgr;

    console.log(`🟢 Total Ingresos Misiones: $ ${totalIng.toLocaleString('es-CO')}`);
    console.log(`🔴 Total Egresos Misiones: $ ${totalEgr.toLocaleString('es-CO')}`);
    console.log(`💰 Nuevo Saldo Neto Misiones: $ ${nuevoSaldo.toLocaleString('es-CO')}`);

    await supabase.from('committees').update({ balance: nuevoSaldo, updatedAt: Date.now() }).eq('id', misionesCommittee.id);
  }
}

insertMisionesEgresos();
