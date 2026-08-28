function showToast(message){const t=document.getElementById('toast');if(!t)return;t.textContent=message;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),3200)}
function submitForm(e){e.preventDefault();showToast('অনুগ্রহ করে আগে Login / Sign up করুন।');setTimeout(()=>location.href='login.html',500)}

document.addEventListener('DOMContentLoaded',()=>{
  if(location.pathname.endsWith('/index.html')||location.pathname==='/'||location.pathname.endsWith('/')){
    const routes={'#help':'login.html','#emergency':'emergency.html','#campaigns':'donation.html','#volunteer':'volunteer.html'};
    document.querySelectorAll('a[href^="#"]').forEach(a=>{const target=a.getAttribute('href');if(routes[target])a.addEventListener('click',e=>{e.preventDefault();location.href=routes[target]})});
    const help=document.getElementById('help');
    if(help)help.innerHTML='<div class="form-card"><div class="eyebrow">🔐 Login required</div><h2>সাহায্য করতে বা সাহায্য নিতে Login করুন</h2><p>HelpBD-তে কোনো সাহায্য চাওয়া, দেওয়া বা আবেদন করার আগে মোবাইল নম্বর দিয়ে Login / Sign up করতে হবে।</p><a class="primary" href="login.html">Login / Sign up →</a></div>';
  }
});
