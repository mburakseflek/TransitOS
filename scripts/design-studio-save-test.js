// Local integration test: publish a temporary fixture, verify, then restore via the same action.
require("@next/env").loadEnvConfig(process.cwd());
const assert=require("node:assert/strict");
const base="http://127.0.0.1:3100";
const decode=s=>s.replace(/&quot;/g,'"').replace(/&#x27;/g,"'").replace(/&lt;/g,"<").replace(/&gt;/g,">").replace(/&amp;/g,"&");
(async()=>{
 const login=await fetch(base+"/api/auth/login",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({role:"MANAGER",loginId:process.env.ADMIN_LOGIN_ID||"admin",password:process.env.ADMIN_PASSWORD})});
 assert.equal(login.status,200);const cookie=login.headers.get("set-cookie").split(";")[0];
 const html=await(await fetch(base+"/site-admin",{headers:{cookie}})).text();
 const original=new Map();
 for(const match of html.matchAll(/<input\b([^>]+)>/g)){const attrs=match[1],name=attrs.match(/name="([^"]+)"/),value=attrs.match(/value="([^"]*)"/);if(name)original.set(decode(name[1]),decode(value?.[1]||""));}
 for(const match of html.matchAll(/<textarea\b([^>]+)>([\s\S]*?)<\/textarea>/g)){const name=match[1].match(/name="([^"]+)"/);if(name)original.set(decode(name[1]),decode(match[2]));}
 assert.ok([...original.keys()].some(k=>k.startsWith("$ACTION_ID_")),"server save action exists");
 const submit=async fields=>{const form=new FormData();for(const [key,value]of fields)form.set(key,value);const response=await fetch(base+"/site-admin",{method:"POST",headers:{cookie,origin:base},body:form,redirect:"manual"});assert.equal(response.status,303);};
 const next=new Map(original),marker="STUDIO-LOCAL-VERIFY-2026";
 const appearance=JSON.parse(next.get("appearance")||"{}");appearance.radius=23;next.set("appearance",JSON.stringify(appearance));
 const translations=JSON.parse(next.get("translations")||"{}");translations.eng={...translations.eng,Hizmetler:marker};next.set("translations",JSON.stringify(translations));
 const blocks=JSON.parse(next.get("designBlocks")||"{}");blocks.home=[{id:marker,type:"card",title:marker,body:"Local test",background:"#ffffff",foreground:"#ffffff",animation:"rise",gradient:false,radius:18,href:"javascript:alert(1)",imageUrl:""}];next.set("designBlocks",JSON.stringify(blocks));
 let attempted=false;
 try{attempted=true;await submit(next);
  const rendered=await(await fetch(base+"/eng")).text();assert.ok(rendered.includes(marker),"saved block/translation rendered");assert.ok(rendered.includes("border-radius:23px"),"saved appearance rendered");assert.ok(!rendered.includes('href="javascript:alert(1)"'),"unsafe link removed");
  const editor=await(await fetch(base+"/site-admin",{headers:{cookie}})).text();assert.ok(editor.includes(marker),"saved content reloaded in editor");console.log("PASS authenticated save → persistence → localized page → safe rendering → editor reload");
 }finally{if(attempted){await submit(original);const restored=await(await fetch(base+"/eng")).text();assert.ok(!restored.includes(marker));console.log("PASS original local content restored");}}
})().catch(error=>{console.error(error.message);process.exitCode=1;});
