const BD_LOCATION_DATA_URL='https://iqbalhasandev.github.io/bangladesh-geo-json/bangladesh-geo.json';
async function loadBDLocations(prefix=''){
  const d=document.getElementById(prefix+'division'),dist=document.getElementById(prefix+'district'),up=document.getElementById(prefix+'upazila'),un=document.getElementById(prefix+'union');
  if(!d||!dist||!up||!un)return;
  const set=(el,items,placeholder)=>{el.innerHTML='<option value="">'+placeholder+'</option>';items.forEach((x,i)=>{const o=document.createElement('option');o.value=i;o.textContent=x.bn_name||x.name;el.appendChild(o)});el.disabled=items.length===0};
  try{
    const data=await fetch(BD_LOCATION_DATA_URL).then(r=>{if(!r.ok)throw new Error('location data');return r.json()});
    set(d,data,'বিভাগ নির্বাচন করুন');
    d.onchange=()=>{const div=data[d.value];set(dist,div?div.districts:[],'জেলা নির্বাচন করুন');set(up,[],'উপজেলা নির্বাচন করুন');set(un,[],'ইউনিয়ন নির্বাচন করুন')};
    dist.onchange=()=>{const div=data[d.value],x=div?.districts[dist.value];set(up,x?.upazilas||[],'উপজেলা নির্বাচন করুন');set(un,[],'ইউনিয়ন নির্বাচন করুন')};
    up.onchange=()=>{const div=data[d.value],x=div?.districts[dist.value]?.upazilas[up.value];set(un,x?.unions||[],'ইউনিয়ন নির্বাচন করুন')};
  }catch(e){d.innerHTML='<option>লোকেশন ডেটা লোড হয়নি</option>';d.disabled=false;console.error(e)}
}
