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
      const required = ['name','phone','dob','birth_registration_no','blood_group','division','district','upazila','union_name'];
      for (const key of required) {
        if (!body[key]) return json(res, 400, { error: `Missing field: ${key}` });
      }
      if (!/^01\d{9}$/.test(String(body.phone))) return json(res, 400, { error: 'Invalid Bangladesh mobile number' });
      if (!/^\d{17}$/.test(String(body.birth_registration_no))) return json(res, 400, { error: 'Birth Registration Number must be 17 digits' });

      const { data, error } = await supabase.rpc('submit_donor_application', {
        p_name: String(body.name).trim(),
        p_phone: String(body.phone).trim(),
        p_dob: body.dob,
        p_birth_registration_no: String(body.birth_registration_no).trim(),
        p_blood_group: String(body.blood_group).trim(),
        p_division: String(body.division).trim(),
        p_district: String(body.district).trim(),
        p_upazila: String(body.upazila).trim(),
        p_union_name: String(body.union_name).trim()
      });

      if (error) throw error;
      return json(res, 201, { ok: true, application_id: data, status: 'pending' });
    }

    if (req.method === 'GET') {
      const group = String(req.query?.blood_group || '').trim();
      const division = String(req.query?.division || '').trim();
      const district = String(req.query?.district || '').trim();
      const upazila = String(req.query?.upazila || '').trim();
      const unionName = String(req.query?.union_name || '').trim();
      if (!group || !division || !district || !upazila || !unionName) return json(res, 400, { error: 'Complete search filters are required' });

      const { data, error } = await supabase.rpc('search_approved_donors', {
        p_blood_group: group,
        p_division: division,
        p_district: district,
        p_upazila: upazila,
        p_union_name: unionName
      });
      if (error) throw error;
      return json(res, 200, { ok: true, donors: data || [] });
    }

    res.setHeader('Allow','GET, POST');
    return json(res, 405, { error: 'Method not allowed' });
  } catch (err) {
    const status = err.code === 'SUPABASE_NOT_CONFIGURED' ? 503 : 500;
    return json(res, status, { error: err.message });
  }
};
