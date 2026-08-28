const { getAdminClient } = require('./_supabase');

function json(res, status, body) {
  res.status(status).setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(body));
}

module.exports = async (req, res) => {
  try {
    const supabase = getAdminClient();
    if (req.method === 'POST') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
      for (const key of ['service','name','phone','details']) {
        if (!body[key]) return json(res, 400, { error: `Missing field: ${key}` });
      }
      if (!/^01\d{9}$/.test(String(body.phone))) return json(res, 400, { error: 'Invalid Bangladesh mobile number' });
      const allowed = ['service','name','phone','division','district','upazila','union_name','details'];
      const row = Object.fromEntries(allowed.filter(k => body[k] !== undefined).map(k => [k, String(body[k]).trim()]));
      const { data, error } = await supabase.from('help_requests').insert(row).select('id,status,created_at').single();
      if (error) throw error;
      return json(res, 201, { ok: true, request: data });
    }
    res.setHeader('Allow', 'POST');
    return json(res, 405, { error: 'Method not allowed' });
  } catch (err) {
    const status = err.code === 'SUPABASE_NOT_CONFIGURED' ? 503 : 500;
    return json(res, status, { error: err.message });
  }
};
