function showToast(message){const t=document.getElementById('toast');t.textContent=message;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),3200)}
function submitForm(e){e.preventDefault();showToast('ধন্যবাদ! আপনার আবেদনটি গ্রহণ করা হয়েছে।');e.target.reset()}
