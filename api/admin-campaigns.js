const { getAdminClient } = require('./_supabase');

function json(res, status, body) {
  res.status(status).setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(body));
}
function authorized(req) {
  const expected = process.env.ADMIN_PASSWORD;
  return Boolean(expected && req.headers['x-admin-password'] === expected);
}

module.exports = async (req, res) => {
  try {
    if (!authorized(req)) return json(res, 401, { error: 'Admin authentication required' });
    const supabase = getAdminClient();
    if (req.method === 'GET') {
      const { data, error } = await supabase.rpc('admin_list_campaigns');
      if (error) throw error;
      return json(res, 200, { ok: true, campaigns: data || [] });
    }
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    const id = String(body.id || '').trim();
    if (!id) return json(res, 400, { error: 'Campaign id is required' });
    if (req.method === 'DELETE') {
      const { data, error } = await supabase.rpc('admin_delete_campaign', { p_id: id });
      if (error) throw error;
      return json(res, 200, { ok: true, result: data });
    }
    res.setHeader('Allow', 'GET, DELETE');
    return json(res, 405, { error: 'Method not allowed' });
  } catch (err) {
    return json(res, 500, { error: err.message });
  }
};
