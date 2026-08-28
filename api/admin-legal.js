const { getAdminClient } = require('./_supabase');
function json(res,status,body){res.status(status).setHeader('Content-Type','application/json; charset=utf-8');res.end(JSON.stringify(body));}
function authorized(req){const expected=process.env.ADMIN_PASSWORD;return Boolean(expected&&req.headers['x-admin-password']===expected);}
module.exports=async(req,res)=>{try{if(!authorized(req))return json(res,401,{error:'Admin authentication required'});const sb=getAdminClient();
if(req.method==='GET'){const {data,error}=await sb.rpc('admin_list_legal_registrations');if(error)throw error;return json(res,200,{ok:true,registrations:data||[]});}
const body=typeof req.body==='string'?JSON.parse(req.body||'{}'):(req.body||{});const id=String(body.id||'').trim();if(!id)return json(res,400,{error:'Registration id is required'});
if(req.method==='GET')return;
if(req.method==='DELETE'){const {data,error}=await sb.rpc('admin_delete_legal_registration',{p_id:id});if(error)throw error;return json(res,200,{ok:true,result:data});}
if(req.method==='POST'){const message=String(body.message||'').trim();if(!message)return json(res,400,{error:'Message is required'});const {data,error}=await sb.rpc('admin_send_legal_message',{p_registration_id:id,p_message:message});if(error)throw error;return json(res,200,{ok:true,result:data});}
res.setHeader('Allow','GET,POST,DELETE');return json(res,405,{error:'Method not allowed'});
}catch(err){return json(res,500,{error:err.message});}};