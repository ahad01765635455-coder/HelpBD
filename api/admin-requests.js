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
      const { data, error } = await supabase.rpc('admin_list_help_requests');
      if (error) throw error;
      return json(res, 200, { ok: true, requests: data || [] });
    }
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    const id = String(body.id || '').trim();
    if (!id) return json(res, 400, { error: 'Request id is required' });
    if (req.method === 'DELETE') {
      const { data, error } = await supabase.rpc('admin_delete_help_request', { p_id: id });
      if (error) throw error;
      return json(res, 200, { ok: true, result: data });
    }
    if (req.method === 'POST') {
      if (body.action !== 'approve') return json(res, 400, { error: 'Unknown action' });
      const { data, error } = await supabase.rpc('admin_approve_help_request', {
        p_id: id,
        p_title: String(body.title || '').trim(),
        p_image_url: body.image_url ? String(body.image_url).trim() : null,
        p_youtube_url: body.youtube_url ? String(body.youtube_url).trim() : null,
        p_amount: body.amount === undefined || body.amount === '' ? null : Number(body.amount)
      });
      if (error) throw error;
      return json(res, 200, { ok: true, result: data });
    }
    res.setHeader('Allow', 'GET, POST, DELETE');
    return json(res, 405, { error: 'Method not allowed' });
  } catch (err) {
    return json(res, err.code === 'SUPABASE_NOT_CONFIGURED' ? 503 : 500, { error: err.message });
  }
};
