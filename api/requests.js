const { getAdminClient } = require('./_supabase');

function json(res, status, body) {
  res.status(status).setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(body));
}

module.exports = async (req, res) => {
  try {
    const supabase = getAdminClient();
    if (req.method !== 'POST') {
      res.setHeader('Allow', 'POST');
      return json(res, 405, { error: 'Method not allowed' });
    }
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    for (const key of ['service','name','phone','details']) {
      if (!body[key]) return json(res, 400, { error: `Missing field: ${key}` });
    }
    if (!/^01\d{9}$/.test(String(body.phone))) return json(res, 400, { error: 'Invalid Bangladesh mobile number' });

    const { data, error } = await supabase.rpc('submit_help_request', {
      p_service: String(body.service).trim(),
      p_name: String(body.name).trim(),
      p_phone: String(body.phone).trim(),
      p_division: String(body.division || '').trim(),
      p_district: String(body.district || '').trim(),
      p_upazila: String(body.upazila || '').trim(),
      p_union_name: String(body.union_name || '').trim(),
      p_details: String(body.details).trim(),
      p_amount: body.amount === undefined || body.amount === '' ? null : Number(body.amount),
      p_type: body.type ? String(body.type).trim() : null,
      p_urgency: body.urgency ? String(body.urgency).trim() : null
    });
    if (error) throw error;
    return json(res, 201, { ok: true, request: data, status: 'pending' });
  } catch (err) {
    const status = err.code === 'SUPABASE_NOT_CONFIGURED' ? 503 : 500;
    return json(res, status, { error: err.message });
  }
};
