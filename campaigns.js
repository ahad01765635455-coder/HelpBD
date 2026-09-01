const HELPBD_CONTACT_NUMBER = '01949127864';

async function loadApprovedCampaigns(targetId='campaigns') {
  const target = document.getElementById(targetId);
  if (!target) return;
  target.innerHTML = '<div class="empty">অনুমোদিত campaign খোঁজা হচ্ছে...</div>';
  try {
    const r = await fetch('/api/campaigns', { cache: 'no-store' });
    const data = await r.json();
    if (!r.ok) throw new Error(data.error || 'Campaign load failed');
    const xs = data.campaigns || [];
    if (!xs.length) {
      target.innerHTML = '<div class="empty">এখনো কোনো অনুমোদিত campaign প্রকাশিত হয়নি।</div>';
      return;
    }
    target.innerHTML = xs.map(c => {
      const yt = String(c.youtube_url || '');
      const m = yt.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([A-Za-z0-9_-]{6,})/);
      const video = m ? `<div class="video"><iframe src="https://www.youtube.com/embed/${m[1]}" title="YouTube video" loading="lazy" allowfullscreen></iframe></div>` : '';
      const img = c.image_url ? `<img src="${escapeHtml(c.image_url)}" alt="${escapeHtml(c.title)}" loading="lazy">` : '';
      return `<article class="campaign-card">${img}<div class="campaign-body"><span class="service-pill">${escapeHtml(c.service)}</span><h3>${escapeHtml(c.title)}</h3><p class="person">👤 ${escapeHtml(c.name)}</p><p>📍 ${escapeHtml([c.division,c.district,c.upazila,c.union_name].filter(Boolean).join(' / '))}</p>${c.amount ? `<p>💰 প্রয়োজন: <b>${escapeHtml(c.amount)} টাকা</b></p>` : ''}<p class="details-text">${escapeHtml(c.details)}</p>${video}<button class="help-btn contact-help" type="button" data-phone="${HELPBD_CONTACT_NUMBER}">সহায়তার জন্য যোগাযোগ করুন</button></div></article>`;
    }).join('');
    target.querySelectorAll('.contact-help').forEach(btn => {
      btn.addEventListener('click', () => {
        const phone = btn.getAttribute('data-phone') || HELPBD_CONTACT_NUMBER;
        const mobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
        if (mobile) {
          window.location.href = `tel:${phone}`;
          return;
        }
        const copied = navigator.clipboard?.writeText ? navigator.clipboard.writeText(phone).then(() => true).catch(() => false) : Promise.resolve(false);
        copied.then(ok => alert(`যোগাযোগের নম্বর: ${phone}${ok ? '\n\nনম্বরটি clipboard-এ copy হয়েছে।' : ''}`));
      });
    });
  } catch (err) {
    target.innerHTML = `<div class="empty">❌ ${escapeHtml(err.message)}</div>`;
  }
}
function escapeHtml(v) { return String(v ?? '').replace(/[&<>\"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[c])); }
