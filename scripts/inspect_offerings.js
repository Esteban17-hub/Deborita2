import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://sbzwjddntsrbnwirrtzi.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNiendqZGRudHNyYm53aXJydHppIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU4OTA1NjEsImV4cCI6MjEwMTQ2NjU2MX0.0qsBmHNUv7-Dhel1Uh5SOPQ9pZcQk16XmAbMTYrM6H8';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function inspect() {
  const { data: coms } = await supabase.from('committees').select('*');
  console.log('Comités:', coms.map(c => ({ id: c.id, name: c.name })));

  const { data: offs } = await supabase.from('offerings').select('*');
  console.log(`Total ofrendas: ${offs.length}`);

  // Buscar si alguna tiene notas o algo que diga 'educacion' o si en las imágenes de Mayo/Junio/Julio/Agosto estaban como Junta Local
  const juntaOffs = offs.filter(o => o.destinationCommitteeId === 'com-zuluaga-junta');
  console.log(`Ofrendas con Junta Local: ${juntaOffs.length}`);
  juntaOffs.forEach(o => {
    console.log(`  ${o.date} | ${o.amount} | notes: ${o.notes} | desc: ${o.description}`);
  });
}

inspect();
