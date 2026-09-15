import { createClient } from '@supabase/supabase-js';
import { env } from '$env/dynamic/public';

const supabaseUrl = (typeof env !== 'undefined' && env.PUBLIC_SUPABASE_URL)
  || 'https://zvkrdjhhnjgjyhmxdtaf.supabase.co';

const supabaseAnonKey = (typeof env !== 'undefined' && env.PUBLIC_SUPABASE_ANON_KEY)
  || 'sb_publishable_Gjweg6XfwtO5-wwM7HBCGA_M-PhxXJu';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
