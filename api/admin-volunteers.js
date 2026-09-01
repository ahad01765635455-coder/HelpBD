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
      const { data, error } = await supabase
        .from('help_requests')
        .select('id,service,name,phone,division,district,upazila,union_name,details,request_type,status,created_at,updated_at')
        .eq('service', 'স্বেচ্ছাসেবী')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return json(res, 200, { ok: true, volunteers: data || [] });
    }

    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    const id = String(body.id || '').trim();
    if (!id) return json(res, 400, { error: 'Volunteer id is required' });

    if (req.method === 'PATCH') {
      const action = String(body.action || '').trim();
      if (action === 'accept') {
        const { data, error } = await supabase
          .from('help_requests')
          .update({ status: 'approved', updated_at: new Date().toISOString() })
          .eq('id', id)
          .eq('service', 'স্বেচ্ছাসেবী')
          .select('id,status')
          .single();
        if (error) throw error;
        return json(res, 200, { ok: true, volunteer: data });
      }
      return json(res, 400, { error: 'Unknown action' });
    }

    if (req.method === 'DELETE') {
      const { data, error } = await supabase
        .from('help_requests')
        .delete()
        .eq('id', id)
        .eq('service', 'স্বেচ্ছাসেবী')
        .select('id')
        .single();
      if (error) throw error;
      return json(res, 200, { ok: true, deleted: data });
    }

    res.setHeader('Allow', 'GET, PATCH, DELETE');
    return json(res, 405, { error: 'Method not allowed' });
  } catch (err) {
    return json(res, err.code === 'SUPABASE_NOT_CONFIGURED' ? 503 : 500, { error: err.message });
  }
};
