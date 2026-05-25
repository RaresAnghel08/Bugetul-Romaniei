import { supabase } from './supabase';

export async function incrementAndGetCount(): Promise<number> {
  const { data, error } = await supabase.rpc('increment_counter', {
    counter_key: 'visitors',
  });
  if (error) {
    console.error('Counter error:', error);
    return 3776;
  }
  return data as number;
}

export async function getCount(): Promise<number> {
  const { data, error } = await supabase
    .from('counters')
    .select('count')
    .eq('key', 'visitors')
    .single();
  if (error) return 3776;
  return (data.count as number);
}
