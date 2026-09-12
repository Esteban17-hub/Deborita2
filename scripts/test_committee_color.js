import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://sbzwjddntsrbnwirrtzi.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNiendqZGRudHNyYm53aXJydHppIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU4OTA1NjEsImV4cCI6MjEwMTQ2NjU2MX0.0qsBmHNUv7-Dhel1Uh5SOPQ9pZcQk16XmAbMTYrM6H8';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testCommitteeColor() {
  const { data: list, error: fetchErr } = await supabase.from('committees').select('*');
  console.log('Current Committees:', list, 'Fetch error:', fetchErr);

  const first = list[0];
  if (!first) return;

  const { data: res, error } = await supabase.from('committees').update({
    color: 'emerald',
    treasurer: first.treasurer || 'Tesorero General'
  }).eq('id', first.id).select();

  console.log('Update result with color:', res, 'Error:', error);
}

testCommitteeColor();
