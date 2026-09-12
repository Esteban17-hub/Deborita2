import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://sbzwjddntsrbnwirrtzi.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNiendqZGRudHNyYm53aXJydHppIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU4OTA1NjEsImV4cCI6MjEwMTQ2NjU2MX0.0qsBmHNUv7-Dhel1Uh5SOPQ9pZcQk16XmAbMTYrM6H8';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testProjectEdit() {
  const { data: projs } = await supabase.from('projects').select('*');
  console.log('Current Projects:', projs);

  const p = projs[0];
  if (!p) return;

  // Update with endDate = null
  const { data: updated, error } = await supabase.from('projects').update({
    endDate: null
  }).eq('id', p.id).select();

  console.log('Updated with endDate: null ->', updated, 'Error:', error);
}

testProjectEdit();
