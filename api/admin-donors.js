function json(res, status, body) {
  res.status(status).setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(body));
}

function authorized(req) {
  const expected = process.env.ADMIN_PASSWORD;
  const supplied = req.headers['x-admin-password'];
  return Boolean(expected && supplied && supplied === expected);
}

function getConfig() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    const err = new Error('Supabase environment variables are not configured');
    err.code = 'SUPABASE_NOT_CONFIGURED';
    throw err;
  }
  return { url: url.replace(/\/$/, ''), key };
}

async function supabaseRequest(path, options = {}) {
  const { url, key } = getConfig();
  const response = await fetch(`${url}/rest/v1/${path}`, {
    ...options,
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...(options.headers || {})
    }
  });
  const text = await response.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = { raw: text }; }
  if (!response.ok) {
    const message = data?.message || data?.hint || data?.details || data?.raw || `Supabase request failed (${response.status})`;
    const err = new Error(String(message));
    err.status = response.status;
    throw err;
  }
  return data;
}

module.exports = async (req, res) => {
  try {
    if (!authorized(req)) return json(res, 401, { error: 'Admin authentication required' });

    if (req.method === 'GET') {
      const data = await supabaseRequest('donor_applications?select=id,name,phone,dob,birth_registration_no,blood_group,division,district,upazila,union_name,verification_status,status,created_at,updated_at&order=created_at.desc');
      return json(res, 200, { ok: true, donors: Array.isArray(data) ? data : [] });
    }

    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    const id = String(body.id || '').trim();
    if (!id) return json(res, 400, { error: 'Donor id is required' });
    const safeId = encodeURIComponent(id);

    if (req.method === 'PATCH') {
      if (body.action === 'verify') {
        const data = await supabaseRequest(`donor_applications?id=eq.${safeId}`, { method: 'PATCH', body: JSON.stringify({ verification_status: 'verified' }), headers: { Prefer: 'return=representation' } });
        return json(res, 200, { ok: true, donor: Array.isArray(data) ? data[0] : data });
      }
      if (body.action === 'approve') {
        const current = await supabaseRequest(`donor_applications?id=eq.${safeId}&select=verification_status&limit=1`);
        if (!Array.isArray(current) || !current.length) return json(res, 404, { error: 'Donor not found' });
        if (current[0].verification_status !== 'verified') return json(res, 400, { error: 'Verify the donor before approval' });
        const data = await supabaseRequest(`donor_applications?id=eq.${safeId}`, { method: 'PATCH', body: JSON.stringify({ status: 'approved' }), headers: { Prefer: 'return=representation' } });
        return json(res, 200, { ok: true, donor: Array.isArray(data) ? data[0] : data });
      }
      return json(res, 400, { error: 'Unknown action' });
    }

    if (req.method === 'DELETE') {
      await supabaseRequest(`donor_applications?id=eq.${safeId}`, { method: 'DELETE' });
      return json(res, 200, { ok: true });
    }

    res.setHeader('Allow', 'GET, PATCH, DELETE');
    return json(res, 405, { error: 'Method not allowed' });
  } catch (err) {
    const status = err.code === 'SUPABASE_NOT_CONFIGURED' ? 503 : (err.status || 500);
    return json(res, status, { error: err.message });
  }
};
