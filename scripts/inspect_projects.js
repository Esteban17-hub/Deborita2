import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://sbzwjddntsrbnwirrtzi.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNiendqZGRudHNyYm53aXJydHppIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU4OTA1NjEsImV4cCI6MjEwMTQ2NjU2MX0.0qsBmHNUv7-Dhel1Uh5SOPQ9pZcQk16XmAbMTYrM6H8';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function checkProjects() {
  const { data: congs } = await supabase.from('congregations').select('*');
  console.log('Congregations:', congs);

  const { data: projects, error: pErr } = await supabase.from('projects').select('*');
  console.log('Projects:', projects, 'Error:', pErr);

  const { data: votes, error: vErr } = await supabase.from('votes').select('*');
  console.log('Votes:', votes, 'Error:', vErr);
}

checkProjects();
