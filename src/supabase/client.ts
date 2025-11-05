import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://bzmixuxautbmqbrqtufx.supabase.co';
const supabaseAnonKey = 'sb_publishable_p_kFlPj1v5_qaypk8YWCLA_sEY8NVOP';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
