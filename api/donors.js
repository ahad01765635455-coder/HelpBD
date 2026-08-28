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
      const { data, error } = await supabase.from('donor_applications').insert({
        name: String(body.name).trim(), phone: String(body.phone).trim(), dob: body.dob,
        birth_registration_no: String(body.birth_registration_no).trim(), blood_group: body.blood_group,
        division: body.division, district: body.district, upazila: body.upazila, union_name: body.union_name
      }).select('id,status,created_at').single();
      if (error) throw error;
      return json(res, 201, { ok: true, application: data });
    }
    if (req.method === 'GET') {
      const group = String(req.query?.blood_group || '').trim();
      const division = String(req.query?.division || '').trim();
      const district = String(req.query?.district || '').trim();
      const upazila = String(req.query?.upazila || '').trim();
      const unionName = String(req.query?.union_name || '').trim();
      if (!group || !division || !district || !upazila || !unionName) return json(res, 400, { error: 'Complete search filters are required' });
      const { data, error } = await supabase.from('donor_applications')
        .select('id,name,phone,blood_group,division,district,upazila,union_name')
        .eq('status','approved').eq('blood_group',group).eq('division',division)
        .limit(200);
      if (error) throw error;
      const rank = d => d.union_name===unionName&&d.upazila===upazila&&d.district===district?0:d.upazila===upazila&&d.district===district?1:d.district===district?2:3;
      const result = (data || []).sort((a,b)=>rank(a)-rank(b)).map(d=>({...d,match_level:['same_union','same_upazila','same_district','same_division'][rank(d)]}));
      return json(res, 200, { ok: true, donors: result });
    }
    res.setHeader('Allow','GET, POST');
    return json(res, 405, { error: 'Method not allowed' });
  } catch (err) {
    const status = err.code === 'SUPABASE_NOT_CONFIGURED' ? 503 : 500;
    return json(res, status, { error: err.message });
  }
};
