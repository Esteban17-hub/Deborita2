import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://sbzwjddntsrbnwirrtzi.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNiendqZGRudHNyYm53aXJydHppIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU4OTA1NjEsImV4cCI6MjEwMTQ2NjU2MX0.0qsBmHNUv7-Dhel1Uh5SOPQ9pZcQk16XmAbMTYrM6H8';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

function deduceDayOfWeek(dateStr) {
  if (!dateStr) return 'Domingo';
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  return days[date.getDay()];
}

async function run() {
  console.log('--- REVISANDO CONGREGACIÓN Y COMITÉS ---');
  const { data: congs } = await supabase.from('congregations').select('*');
  const congregationId = congs?.[0]?.id || 'cong-zuluaga';

  const { data: coms } = await supabase.from('committees').select('*').eq('congregationId', congregationId);

  const getComId = (nameQuery) => {
    const found = coms?.find(c => {
      const n = c.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      const q = nameQuery.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      return n.includes(q) || q.includes(n);
    });
    return found ? found.id : coms?.[0]?.id;
  };

  const escuelaDomId = getComId('Escuela Dominical');
  const juntaLocalId = getComId('Junta Local');
  console.log('Escuela Dominical ID:', escuelaDomId);
  console.log('Junta Local ID:', juntaLocalId);

  // 1. Corregir registros anteriores de Educación Cristiana -> Escuela Dominical
  const { data: existingOfferings } = await supabase.from('offerings').select('*').eq('congregationId', congregationId);
  console.log(`Total ofrendas existentes en BD: ${existingOfferings?.length}`);

  let updatedCount = 0;
  for (const off of existingOfferings || []) {
    const notesStr = (off.notes || off.description || '').toLowerCase();
    if (notesStr.includes('educacion cristiana') || notesStr.includes('educación cristiana')) {
      await supabase.from('offerings').update({
        destinationCommitteeId: escuelaDomId
      }).eq('id', off.id);
      updatedCount++;
    }
  }
  console.log(`✅ ${updatedCount} ofrendas corregidas a Escuela Dominical.`);

  // 2. Definir los nuevos registros de Enero a Abril 2026
  const rawList = [
    // Imagen 1: Enero 2026
    { date: '2026-01-03', com: 'Escuela Dominical', obs: '', amount: 118750 },
    { date: '2026-01-04', com: 'Misiones', obs: 'Ofrenda Misionera Nacional', amount: 742350 },
    { date: '2026-01-08', com: 'Intercesión', obs: '', amount: 163800 },
    { date: '2026-01-10', com: 'Jóvenes', obs: '', amount: 230150 },
    { date: '2026-01-11', com: 'Junta Local', obs: '', amount: 582000 },
    { date: '2026-01-15', com: 'Misiones', obs: '', amount: 400000 },
    { date: '2026-01-17', com: 'Alabanza', obs: '', amount: 174800 },
    { date: '2026-01-18', com: 'Junta Local', obs: '', amount: 572600 },
    { date: '2026-01-22', com: 'Damas Dorcas', obs: 'Rayos de Luz', amount: 115000 },
    { date: '2026-01-24', com: 'Familia', obs: '', amount: 221250 },
    { date: '2026-01-25', com: 'Junta Local', obs: 'Pro Asamblea', amount: 714000 },
    { date: '2026-01-29', com: 'Junta Local', obs: '', amount: 154600 },

    // Imagen 2: Febrero 2026
    { date: '2026-01-31', com: 'Obra Social', obs: '', amount: 299350 },
    { date: '2026-02-01', com: 'Misiones', obs: 'Ofrenda Misionera', amount: 872450 },
    { date: '2026-02-03', com: 'Obra Social', obs: '', amount: 84000 },
    { date: '2026-02-05', com: 'Familia', obs: '', amount: 202100 },
    { date: '2026-02-07', com: 'Familia', obs: 'Con Obra Social', amount: 304000 },
    { date: '2026-02-08', com: 'Familia', obs: 'Con Obra Social', amount: 638000 },
    { date: '2026-02-10', com: 'Damas Dorcas', obs: '', amount: 99900 },
    { date: '2026-02-12', com: 'Misiones', obs: '', amount: 156200 },
    { date: '2026-02-14', com: 'Damas Dorcas', obs: 'Con Misiones', amount: 283200 },
    { date: '2026-02-15', com: 'Damas Dorcas', obs: 'Con Misiones', amount: 665000 },
    { date: '2026-02-17', com: 'Intercesión', obs: 'Gavillas Para Cristo', amount: 130950 },
    { date: '2026-02-19', com: 'Jóvenes', obs: '', amount: 229200 },
    { date: '2026-02-21', com: 'Intercesión', obs: 'Intercesión y Jóvenes', amount: 229350 },
    { date: '2026-02-22', com: 'Junta Local', obs: 'Ofrenda Especial Ofrenda Social', amount: 1140200 },
    { date: '2026-02-22', com: 'Junta Local', obs: 'Pro Asamblea', amount: 338950 },
    { date: '2026-02-24', com: 'Alabanza', obs: '', amount: 97500 },
    { date: '2026-02-26', com: 'Escuela Dominical', obs: '', amount: 167000 },
    { date: '2026-02-27', com: 'Junta Local', obs: '', amount: 251500 },
    { date: '2026-02-28', com: 'Junta Local', obs: '', amount: 624050 },

    // Imagen 3: Marzo 2026
    { date: '2026-03-01', com: 'Junta Local', obs: 'Misionera Nacional', amount: 729250 },
    { date: '2026-03-03', com: 'Obra Social', obs: '', amount: 100000 },
    { date: '2026-03-05', com: 'Misiones', obs: '', amount: 139600 },
    { date: '2026-03-07', com: 'Familia', obs: '', amount: 159750 },
    { date: '2026-03-08', com: 'Junta Local', obs: '', amount: 529800 },
    { date: '2026-03-10', com: 'Intercesión', obs: '', amount: 99000 },
    { date: '2026-03-12', com: 'Junta Local', obs: '', amount: 135750 },
    { date: '2026-03-14', com: 'Jóvenes', obs: 'Gavillas', amount: 180900 },
    { date: '2026-03-15', com: 'Escuela Dominical', obs: '', amount: 545900 },
    { date: '2026-03-17', com: 'Alabanza', obs: '', amount: 89300 },
    { date: '2026-03-19', com: 'Junta Local', obs: '', amount: 155300 },
    { date: '2026-03-21', com: 'Damas Dorcas', obs: 'Rayos de Luz', amount: 236000 },
    { date: '2026-03-22', com: 'Junta Local', obs: 'Pro Asamblea', amount: 502050 },
    { date: '2026-03-24', com: 'Ujieres', obs: '', amount: 56450 },
    { date: '2026-03-26', com: 'Junta Local', obs: '', amount: 106950 },
    { date: '2026-03-28', com: 'Obra Social', obs: '', amount: 242750 },
    { date: '2026-03-29', com: 'Junta Local', obs: '', amount: 532400 },
    { date: '2026-03-31', com: 'Decom', obs: 'Con Sonido', amount: 71600 },

    // Imagen 4: Abril 2026
    { date: '2026-04-02', com: 'Junta Local', obs: '', amount: 138000 },
    { date: '2026-04-04', com: 'Alabanza', obs: '', amount: 206150 },
    { date: '2026-04-05', com: 'Misiones', obs: 'Ofrenda Misionera', amount: 370250 },
    { date: '2026-04-05', com: 'Misiones', obs: 'Ofrenda Obra Carcelaria', amount: 700750 },
    { date: '2026-04-07', com: 'Intercesión', obs: '', amount: 57000 },
    { date: '2026-04-09', com: 'Junta Local', obs: '', amount: 158800 },
    { date: '2026-04-11', com: 'Escuela Dominical', obs: '', amount: 273200 },
    { date: '2026-04-12', com: 'Junta Local', obs: '', amount: 649400 },
    { date: '2026-04-14', com: 'Ujieres', obs: '', amount: 83950 },
    { date: '2026-04-16', com: 'Junta Local', obs: '', amount: 98300 },
    { date: '2026-04-17', com: 'Damas Dorcas', obs: '', amount: 158800 },
    { date: '2026-04-18', com: 'Damas Dorcas', obs: '', amount: 89300 },
    { date: '2026-04-19', com: 'Junta Local', obs: '', amount: 574000 },
    { date: '2026-04-21', com: 'Obra Social', obs: '', amount: 83950 },
    { date: '2026-04-23', com: 'Junta Local', obs: '', amount: 169400 },
    { date: '2026-04-25', com: 'Jóvenes', obs: '', amount: 220300 },
    { date: '2026-04-26', com: 'Familia', obs: 'Ofrenda Pro asamblea', amount: 300000 },
    { date: '2026-04-26', com: 'Familia', obs: '', amount: 324000 },
    { date: '2026-04-28', com: 'Decom', obs: 'Con Sonido', amount: 54000 },
    { date: '2026-04-30', com: 'Junta Local', obs: '', amount: 90950 }
  ];

  console.log(`\nInsertando ${rawList.length} ofrendas de Enero a Abril 2026...`);

  const payload = rawList.map((item, i) => {
    const committeeId = getComId(item.com);
    return {
      id: `off-batch-${item.date}-${i + 1}-${Date.now()}`,
      congregationId,
      date: item.date,
      dayOfWeek: deduceDayOfWeek(item.date),
      destinationCommitteeId: committeeId,
      amount: item.amount,
      responsible: 'Tesorero General',
      notes: item.obs ? `[${item.obs}]` : '',
      description: item.obs || '',
      type: 'OFRENDA',
      createdAt: Date.now() + i
    };
  });

  const { data, error } = await supabase.from('offerings').insert(payload).select();
  if (error) {
    console.error('Error insertando ofrendas:', error);
  } else {
    console.log(`✅ ¡${data.length} ofrendas insertadas exitosamente en Supabase!`);
  }

  // Verificar total general de ofrendas
  const { data: allOffs } = await supabase.from('offerings').select('*').eq('congregationId', congregationId);
  const totalAmount = allOffs?.reduce((acc, o) => acc + (o.amount || 0), 0) || 0;
  console.log(`📊 Total histórico actual de ofrendas: ${allOffs?.length} registros | $ ${totalAmount.toLocaleString('es-CO')}`);
}

run();
