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

async function rpc(name, body = {}) {
  const { url, key } = getConfig();
  const response = await fetch(`${url}/rest/v1/rpc/${name}`, {
    method: 'POST',
    headers: {
      apikey: key,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });
  const text = await response.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = { raw: text }; }
  if (!response.ok) {
    const err = new Error(String(data?.message || data?.hint || data?.details || data?.raw || `Supabase RPC failed (${response.status})`));
    err.status = response.status;
    throw err;
  }
  return data;
}

module.exports = async (req, res) => {
  try {
    if (!authorized(req)) return json(res, 401, { error: 'Admin authentication required' });

    if (req.method === 'GET') {
      const data = await rpc('admin_list_donors');
      return json(res, 200, { ok: true, donors: Array.isArray(data) ? data : [] });
    }

    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    const id = String(body.id || '').trim();
    if (!id) return json(res, 400, { error: 'Donor id is required' });

    if (req.method === 'PATCH') {
      if (body.action === 'verify') {
        return json(res, 200, { ok: true, result: await rpc('admin_set_donor_verification', { p_id: id, p_status: 'verified' }) });
      }
      if (body.action === 'unverify') {
        return json(res, 200, { ok: true, result: await rpc('admin_set_donor_verification', { p_id: id, p_status: 'not_verified' }) });
      }
      if (body.action === 'approve') {
        return json(res, 200, { ok: true, result: await rpc('admin_approve_donor', { p_id: id }) });
      }
      return json(res, 400, { error: 'Unknown action' });
    }

    if (req.method === 'DELETE') {
      return json(res, 200, { ok: true, result: await rpc('admin_delete_donor', { p_id: id }) });
    }

    res.setHeader('Allow', 'GET, PATCH, DELETE');
    return json(res, 405, { error: 'Method not allowed' });
  } catch (err) {
    const status = err.code === 'SUPABASE_NOT_CONFIGURED' ? 503 : (err.status || 500);
    return json(res, status, { error: err.message });
  }
};
