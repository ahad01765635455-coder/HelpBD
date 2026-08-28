const { getAdminClient } = require('./_supabase');

function json(res, status, body) {
  res.status(status).setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(body));
}

module.exports = async (req, res) => {
  try {
    if (req.method !== 'GET') {
      res.setHeader('Allow', 'GET');
      return json(res, 405, { error: 'Method not allowed' });
    }
    const supabase = getAdminClient();
    const { data, error } = await supabase.rpc('list_approved_campaigns');
    if (error) throw error;
    return json(res, 200, { ok: true, campaigns: data || [] });
  } catch (err) {
    return json(res, err.code === 'SUPABASE_NOT_CONFIGURED' ? 503 : 500, { error: err.message });
  }
};
