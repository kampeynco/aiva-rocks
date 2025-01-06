import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import { getRequiredEnvVar } from './config.ts';

export function createSupabaseClient() {
  const supabaseUrl = getRequiredEnvVar('SUPABASE_URL');
  const supabaseKey = getRequiredEnvVar('SUPABASE_SERVICE_ROLE_KEY');
  return createClient(supabaseUrl, supabaseKey);
}