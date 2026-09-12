import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://sbzwjddntsrbnwirrtzi.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNiendqZGRudHNyYm53aXJydHppIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU4OTA1NjEsImV4cCI6MjEwMTQ2NjU2MX0.0qsBmHNUv7-Dhel1Uh5SOPQ9pZcQk16XmAbMTYrM6H8';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function list() {
  const { data: coms } = await supabase.from('committees').select('*');
  const comMap = {};
  coms.forEach(c => comMap[c.id] = c.name);

  const { data: offs } = await supabase.from('offerings').select('*').order('date', { ascending: true });
  console.log(`Total: ${offs.length}`);
  offs.forEach(o => {
    console.log(`${o.date} | ${comMap[o.destinationCommitteeId] || o.destinationCommitteeId} | $ ${o.amount} | obs: ${o.notes}`);
  });
}

list();
