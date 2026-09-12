import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://sbzwjddntsrbnwirrtzi.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNiendqZGRudHNyYm53aXJydHppIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU4OTA1NjEsImV4cCI6MjEwMTQ2NjU2MX0.0qsBmHNUv7-Dhel1Uh5SOPQ9pZcQk16XmAbMTYrM6H8';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testTitheUpdate() {
  const { data: list } = await supabase.from('tithes').select('*');
  const t = list[0];
  console.log('Original Tithe:', t);

  const updatedPayload = {
    grossTithe: t.grossTithe,
    nationalTreasury: t.nationalTreasury,
    localFundAport: t.localFundAport,
    netIncome: t.netIncome,
    calculatedPoint: t.calculatedPoint,
    correctedPoint: t.correctedPoint,
    pastorAllocation: t.pastorAllocation,
    pastorName: t.pastorName
  };

  const { data: res, error } = await supabase.from('tithes').update(updatedPayload).eq('id', t.id).select();
  console.log('Update result:', res, 'Error:', error);
}

testTitheUpdate();
