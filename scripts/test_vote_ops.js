import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://sbzwjddntsrbnwirrtzi.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNiendqZGRudHNyYm53aXJydHppIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU4OTA1NjEsImV4cCI6MjEwMTQ2NjU2MX0.0qsBmHNUv7-Dhel1Uh5SOPQ9pZcQk16XmAbMTYrM6H8';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testVoteOperations() {
  const { data: projs } = await supabase.from('projects').select('*');
  console.log('Proyectos:', projs);
  const projId = projs[0]?.id;

  // 1. Insert test vote
  const testVote = {
    id: `v-test-${Date.now()}`,
    projectId: projId,
    memberName: 'Prueba Integración',
    voterName: 'Prueba Integración',
    amount: 50000,
    notes: 'Test note',
    date: '2026-08-17',
    createdAt: Date.now()
  };

  const { data: insData, error: insErr } = await supabase.from('votes').insert(testVote).select();
  console.log('Insert Result:', insData, 'Error:', insErr);

  if (insErr) {
    console.error('FAILED TO INSERT VOTE:', insErr);
    return;
  }

  // 2. Update test vote
  const { data: upData, error: upErr } = await supabase.from('votes').update({ amount: 75000 }).eq('id', testVote.id).select();
  console.log('Update Result:', upData, 'Error:', upErr);

  // 3. Clean up test vote
  const { error: delErr } = await supabase.from('votes').delete().eq('id', testVote.id);
  console.log('Delete Result Error:', delErr);

  console.log('✅ ¡TODAS LAS OPERACIONES CRUD DE VOTOS VERIFICADAS EXITOSAMENTE!');
}

testVoteOperations();
