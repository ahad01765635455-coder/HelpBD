const { getAdminClient } = require('./_supabase');

function json(res, status, body) {
  res.status(status).setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(body));
}

module.exports = async (req, res) => {
  try {
    if (req.method !== 'POST') {
      res.setHeader('Allow', 'POST');
      return json(res, 405, { error: 'Method not allowed' });
    }

    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    for (const key of ['name', 'phone', 'skill', 'details', 'division', 'district', 'upazila', 'union_name']) {
      if (!String(body[key] || '').trim()) return json(res, 400, { error: `Missing field: ${key}` });
    }
    const phone = String(body.phone).trim();
    if (!/^01\d{9}$/.test(phone)) return json(res, 400, { error: 'Invalid Bangladesh mobile number' });

    const supabase = getAdminClient();
    const { data: existing, error: existingError } = await supabase
      .from('help_requests')
      .select('id,status')
      .eq('service', 'স্বেচ্ছাসেবী')
      .eq('phone', phone)
      .in('status', ['pending', 'approved'])
      .limit(1);
    if (existingError) throw existingError;
    if (existing?.length) return json(res, 409, { error: 'এই মোবাইল নম্বর দিয়ে ইতিমধ্যে একটি volunteer আবেদন আছে।' });

    const details = `দক্ষতা: ${String(body.skill).trim()}\nঅভিজ্ঞতা: ${String(body.experience || '').trim() || 'উল্লেখ করা হয়নি'}\n\nনিজের সম্পর্কে:\n${String(body.details).trim()}`;
    const { data, error } = await supabase.from('help_requests').insert({
      service: 'স্বেচ্ছাসেবী',
      name: String(body.name).trim(),
      phone,
      division: String(body.division).trim(),
      district: String(body.district).trim(),
      upazila: String(body.upazila).trim(),
      union_name: String(body.union_name).trim(),
      details,
      request_type: String(body.skill).trim(),
      status: 'pending'
    }).select('id,status,created_at').single();
    if (error) throw error;
    return json(res, 201, { ok: true, volunteer: data });
  } catch (err) {
    const status = err.code === 'SUPABASE_NOT_CONFIGURED' ? 503 : 500;
    return json(res, status, { error: err.message });
  }
};
