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

(function initHelpBDScrollIntro(){
  if (location.pathname !== '/' && !/\/index\.html$/i.test(location.pathname)) return;
  const style = document.createElement('style');
  style.textContent = `#hb-scroll-intro{position:relative;height:125vh;margin:0;z-index:20;background:#06251b;overflow:hidden;color:#fff}#hb-scroll-intro .hb-intro-sticky{position:sticky;top:0;height:100vh;display:grid;place-items:center;overflow:hidden;background:radial-gradient(circle at 50% 35%,#164f39 0%,#082d21 48%,#03150f 100%)}#hb-scroll-intro .hb-glow{position:absolute;width:52vmin;height:52vmin;border-radius:50%;background:radial-gradient(circle,rgba(49,220,145,.28),rgba(49,220,145,0) 68%);filter:blur(2px);transform:translateY(calc(var(--hb-p,0) * -10vh)) scale(calc(1 + var(--hb-p,0) * .45))}#hb-scroll-intro .hb-art{position:absolute;width:min(680px,82vw);height:auto;opacity:calc(1 - var(--hb-p,0) * .72);transform:translateY(calc(var(--hb-p,0) * -13vh)) scale(calc(1 - var(--hb-p,0) * .28));filter:drop-shadow(0 28px 55px rgba(0,0,0,.3));transition:transform .12s linear,opacity .12s linear}#hb-scroll-intro .hb-art svg{width:100%;display:block}#hb-scroll-intro .hb-word{position:absolute;z-index:3;text-align:center;opacity:calc(var(--hb-p,0) * 1.35);transform:translateY(calc((1 - var(--hb-p,0)) * 16vh)) scale(calc(.78 + var(--hb-p,0) * .22));clip-path:inset(calc((1 - var(--hb-p,0)) * 100%) 0 0 0);transition:transform .12s linear,opacity .12s linear,clip-path .12s linear}#hb-scroll-intro .hb-word b{display:block;font:800 clamp(64px,13vw,150px)/.8 Inter,sans-serif;letter-spacing:-.08em;text-shadow:0 12px 40px rgba(0,0,0,.35)}#hb-scroll-intro .hb-word b span{color:#29cf86}#hb-scroll-intro .hb-word small{display:block;margin-top:24px;font-size:clamp(16px,2vw,24px);font-weight:600;letter-spacing:.08em;color:#c9e7dc}#hb-scroll-intro .hb-kicker{position:absolute;top:12vh;z-index:4;font-weight:700;letter-spacing:.08em;color:#7de3b7;opacity:calc(1 - var(--hb-p,0) * 1.8);transform:translateY(calc(var(--hb-p,0) * -20px))}#hb-scroll-intro .hb-scroll{position:absolute;bottom:30px;z-index:5;display:flex;flex-direction:column;align-items:center;gap:8px;color:#cbe5dc;font-size:12px;opacity:calc(1 - var(--hb-p,0) * 1.8)}#hb-scroll-intro .hb-mouse{width:23px;height:36px;border:2px solid rgba(255,255,255,.75);border-radius:16px;position:relative}.hb-mouse:after{content:'';position:absolute;width:3px;height:7px;border-radius:3px;background:#5ce2a6;left:50%;top:6px;transform:translateX(-50%);animation:hbWheel 1.4s infinite}@keyframes hbWheel{0%{opacity:0;transform:translate(-50%,0)}35%{opacity:1}100%{opacity:0;transform:translate(-50%,11px)}}@media(max-width:650px){#hb-scroll-intro{height:118vh}#hb-scroll-intro .hb-art{width:94vw}#hb-scroll-intro .hb-word b{font-size:22vw}#hb-scroll-intro .hb-kicker{top:10vh}}@media(prefers-reduced-motion:reduce){#hb-scroll-intro .hb-art,#hb-scroll-intro .hb-word,#hb-scroll-intro .hb-glow{transition:none!important;transform:none!important}}`;
  document.head.appendChild(style);
  const intro=document.createElement('section'); intro.id='hb-scroll-intro';
  intro.innerHTML=`<div class="hb-intro-sticky"><div class="hb-glow"></div><div class="hb-kicker">❤️ মানুষের পাশে মানুষ</div><div class="hb-art"><svg viewBox="0 0 800 520" role="img" aria-label="HelpBD humanitarian illustration"><defs><linearGradient id="hg" x1="0" x2="1"><stop stop-color="#21b875"/><stop offset="1" stop-color="#5be5ad"/></linearGradient><filter id="sh"><feDropShadow dx="0" dy="20" stdDeviation="18" flood-opacity=".22"/></filter></defs><circle cx="400" cy="260" r="190" fill="#0e4a36" opacity=".7"/><path d="M170 350c55-98 142-120 230-78 88-42 175-20 230 78" fill="none" stroke="#8de8c1" stroke-width="18" stroke-linecap="round" opacity=".25"/><g filter="url(#sh)"><path d="M400 362c-34-56-136-78-170-11-33 65 37 112 170 138 133-26 203-73 170-138-34-67-136-45-170 11z" fill="url(#hg)"/><path d="M400 430c-44-26-94-54-94-91 0-25 20-45 45-45 21 0 37 12 49 29 12-17 28-29 49-29 25 0 45 20 45 45 0 37-50 65-94 91z" fill="#fff" opacity=".96"/></g><path d="M250 250c-54-34-89-81-74-120 9-24 35-34 58-23 28 13 48 49 58 82M550 250c54-34 89-81 74-120-9-24-35-34-58-23-28 13-48 49-58 82" fill="none" stroke="#d8f4e8" stroke-width="26" stroke-linecap="round"/><circle cx="250" cy="111" r="17" fill="#31d48d"/><circle cx="550" cy="111" r="17" fill="#31d48d"/></svg></div><div class="hb-word"><b>Help<span>BD</span></b><small>সবার পাশে, সবসময়</small></div><div class="hb-scroll"><div class="hb-mouse"></div><span>স্ক্রল করুন</span></div></div>`;
  const first=document.body.firstElementChild; document.body.insertBefore(intro,first||null);
  const reduce=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const update=()=>{if(reduce)return; const rect=intro.getBoundingClientRect(); const total=Math.max(1,intro.offsetHeight-innerHeight); const p=Math.min(1,Math.max(0,-rect.top/total)); intro.style.setProperty('--hb-p',p.toFixed(4));};
  window.addEventListener('scroll',update,{passive:true}); window.addEventListener('resize',update,{passive:true}); update();
})();
