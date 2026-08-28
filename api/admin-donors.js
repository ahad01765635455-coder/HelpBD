const { getAdminClient } = require('./_supabase');

function json(res, status, body) {
  res.status(status).setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(body));
}

function authorized(req) {
  const expected = process.env.ADMIN_PASSWORD;
  const supplied = req.headers['x-admin-password'];
  return Boolean(expected && supplied && supplied === expected);
}

module.exports = async (req, res) => {
  try {
    if (!authorized(req)) return json(res, 401, { error: 'Admin authentication required' });
    const supabase = getAdminClient();

    if (req.method === 'GET') {
      const { data, error } = await supabase
        .from('donor_applications')
        .select('id,name,phone,dob,birth_registration_no,blood_group,division,district,upazila,union_name,verification_status,status,created_at,updated_at')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return json(res, 200, { ok: true, donors: data || [] });
    }

    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    const id = String(body.id || '').trim();
    if (!id) return json(res, 400, { error: 'Donor id is required' });

    if (req.method === 'PATCH') {
      const patch = {};
      if (body.action === 'verify') patch.verification_status = 'verified';
      else if (body.action === 'unverify') patch.verification_status = 'not_verified';
      else if (body.action === 'approve') {
        const { data: current, error: currentError } = await supabase.from('donor_applications').select('verification_status').eq('id', id).single();
        if (currentError) throw currentError;
        if (current.verification_status !== 'verified') return json(res, 400, { error: 'Verify the donor before approval' });
        patch.status = 'approved';
      } else return json(res, 400, { error: 'Unknown action' });

      const { data, error } = await supabase.from('donor_applications').update(patch).eq('id', id).select('id,status,verification_status').single();
      if (error) throw error;
      return json(res, 200, { ok: true, donor: data });
    }

    if (req.method === 'DELETE') {
      const { error } = await supabase.from('donor_applications').delete().eq('id', id);
      if (error) throw error;
      return json(res, 200, { ok: true });
    }

    res.setHeader('Allow', 'GET, PATCH, DELETE');
    return json(res, 405, { error: 'Method not allowed' });
  } catch (err) {
    const status = err.code === 'SUPABASE_NOT_CONFIGURED' ? 503 : 500;
    return json(res, status, { error: err.message });
  }
};
