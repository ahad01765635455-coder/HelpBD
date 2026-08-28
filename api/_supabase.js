const { createClient } = require('@supabase/supabase-js');

function getAdminClient() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    const err = new Error('Supabase environment variables are not configured');
    err.code = 'SUPABASE_NOT_CONFIGURED';
    throw err;
  }
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}

module.exports = { getAdminClient };
