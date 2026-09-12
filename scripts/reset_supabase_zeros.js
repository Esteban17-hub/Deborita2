import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://sbzwjddntsrbnwirrtzi.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNiendqZGRudHNyYm53aXJydHppIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU4OTA1NjEsImV4cCI6MjEwMTQ2NjU2MX0.0qsBmHNUv7-Dhel1Uh5SOPQ9pZcQk16XmAbMTYrM6H8';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function resetAllToZero() {
  console.log('--- RESTABLECIENDO TODOS LOS DATOS EN SUPABASE A CEROS ---');

  // 1. Eliminar todos los movimientos
  const { error: movErr } = await supabase.from('movements').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  console.log('Movimientos eliminados:', movErr || 'OK');

  // 2. Poner en 0 los saldos de todos los comités
  const { error: comErr } = await supabase.from('committees').update({ balance: 0, updatedAt: Date.now() }).neq('id', '00000000-0000-0000-0000-000000000000');
  console.log('Saldos de comités puestos en $0:', comErr || 'OK');

  // 3. Eliminar todos los diezmos
  const { error: titheErr } = await supabase.from('tithes').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  console.log('Diezmos eliminados:', titheErr || 'OK');

  // 4. Eliminar todas las ofrendas
  const { error: offErr } = await supabase.from('offerings').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  console.log('Ofrendas eliminadas:', offErr || 'OK');

  // 5. Eliminar todos los votos y proyectos
  const { error: voteErr } = await supabase.from('votes').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  console.log('Votos eliminados:', voteErr || 'OK');

  const { error: projErr } = await supabase.from('projects').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  console.log('Proyectos eliminados:', projErr || 'OK');

  console.log('--- TODO RESTABLECIDO A CEROS EXITOSAMENTE ---');
}

resetAllToZero();
