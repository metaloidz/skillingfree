/* ============================================================
   SUPABASE CLIENT
   ============================================================ */

const SUPABASE_URL =
    "https://jkdtxocrcchmeugmotvc.supabase.co";


const SUPABASE_PUBLISHABLE_KEY =
    "sb_publishable_uHci1XxA9Poc7ebKGAJ-1A_lbujjW8l";


const supabaseClient =
    supabase.createClient(
        SUPABASE_URL,
        SUPABASE_PUBLISHABLE_KEY,
        {
            auth: {

                autoRefreshToken:
                    true,

                persistSession:
                    true,

                detectSessionInUrl:
                    true

            }
        }
    );


window.supabaseClient =
    supabaseClient;