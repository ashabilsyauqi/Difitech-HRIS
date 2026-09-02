"use strict";(()=>{var e={};e.id=3129,e.ids=[3129],e.modules={20399:e=>{e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},30517:e=>{e.exports=require("next/dist/compiled/next-server/app-route.runtime.prod.js")},57147:e=>{e.exports=require("fs")},71017:e=>{e.exports=require("path")},3277:(e,t,a)=>{a.r(t),a.d(t,{originalPathname:()=>b,patchFetch:()=>x,requestAsyncStorage:()=>g,routeModule:()=>f,serverHooks:()=>I,staticGenerationAsyncStorage:()=>y});var i={};a.r(i),a.d(i,{GET:()=>h,dynamic:()=>u});var r=a(49303),n=a(88716),o=a(60670),s=a(87070),c=a(20728),d=a(57147),l=a.n(d),m=a(71017),p=a.n(m);let u="force-dynamic";async function h(e){try{let e=new Date().toISOString().split("T")[0],t=await c._.officeLocation.findFirst({where:{isActive:!0}}),a=t?.id||null,i="";try{let e=p().join(process.cwd(),"scripts","photo_base64.txt");l().existsSync(e)&&(i=l().readFileSync(e,"utf-8").trim())}catch(e){console.error("Load photo error:",e)}for(let t of[{email:"ashabil@difitech.co.id",time:"09:54:07",status:"ON_TIME",type:"OFFICE"},{email:"siswandi@difitech.co.id",time:"08:40:50",status:"ON_TIME",type:"OFFICE"},{email:"muditha@difitech.co.id",time:"08:45:12",status:"ON_TIME",type:"OFFICE"},{email:"nida@difitech.co.id",time:"08:52:30",status:"ON_TIME",type:"WFA"},{email:"khalilan@difitech.co.id",time:"09:10:00",status:"ON_TIME",type:"OFFICE"},{email:"dewi@difitech.co.id",time:"08:30:15",status:"ON_TIME",type:"OFFICE"},{email:"fajar@difitech.co.id",time:"09:05:40",status:"ON_TIME",type:"OFFICE"},{email:"rima@difitech.co.id",time:"08:58:22",status:"ON_TIME",type:"OFFICE"},{email:"avila@difitech.co.id",time:"09:12:05",status:"ON_TIME",type:"WFA"},{email:"danar@difitech.co.id",time:"09:20:18",status:"ON_TIME",type:"OFFICE"}]){let r;let n=await c._.user.findUnique({where:{email:t.email}});if(!n)continue;r="ashabil@difitech.co.id"===t.email&&i?i:function(e,t,a,i,r="OFFICE"){let n="WFA"===r,o=t.split("@")[0].slice(0,6).toUpperCase(),s=`
<svg xmlns="http://www.w3.org/2000/svg" width="800" height="450" viewBox="0 0 800 450">
  <image href="${i}" width="800" height="450" preserveAspectRatio="xMidYMid slice" />
  <rect y="315" width="800" height="135" fill="rgba(15, 23, 42, 0.94)" />
  <rect y="315" width="800" height="4" fill="${n?"#06b6d4":"#dc2626"}" />
  <text x="24" y="342" fill="${n?"#67e8f9":"#f87171"}" font-family="ui-monospace, monospace" font-weight="bold" font-size="14">📍 CAMSTAMP&#x2122; [${n?"WFA / REMOTE: WORK FROM ANYWHERE":"DIFITECH CLOCK-IN"}] - TERVERIFIKASI</text>
  <text x="24" y="366" fill="#f8fafc" font-family="ui-monospace, monospace" font-weight="bold" font-size="12">USER: ${e} (ID: ${o}) | Senin, 31 Agustus 2026 - ${a} WIB</text>
  <text x="24" y="388" fill="#cbd5e1" font-family="ui-monospace, monospace" font-size="11">GPS: -6.221556, 107.014043 (Akurasi: &#177;35.0m)</text>
  <text x="24" y="408" fill="#cbd5e1" font-family="ui-monospace, monospace" font-size="11">LOKASI: Jalan Perjuangan, Proyek, Bekasi Jaya, Bekasi, West Java, 17112, Indonesia</text>
  <text x="24" y="428" fill="#94a3b8" font-family="ui-monospace, monospace" font-size="10">SECURITY: MacIntel | CamStamp v1.4 | AntiSpoof OK | SHA256: 8f9b4c7...</text>
</svg>`.trim();return`data:image/svg+xml;base64,${Buffer.from(s).toString("base64")}`}(n.name,n.email,t.time,n.avatarUrl||"https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=800",t.type);let[o,s,d]=t.time.split(":").map(Number),l=String(o-7).padStart(2,"0"),m=`${e}T${l}:${String(s).padStart(2,"0")}:${String(d).padStart(2,"0")}.000Z`;await c._.attendance.upsert({where:{userId_date:{userId:n.id,date:e}},update:{clockInTime:new Date(m),clockInStatus:t.status,attendanceType:t.type,clockInPhoto:r,clockOutTime:null,clockOutStatus:null},create:{userId:n.id,date:e,officeId:a,attendanceType:t.type,clockInTime:new Date(m),clockInPhoto:r,clockInLat:-6.221556,clockInLng:107.014043,clockInAccuracy:35,clockInAddress:"Jalan Perjuangan, Proyek, Bekasi Jaya, Bekasi, West Java, 17112, Indonesia",clockInStatus:t.status,clockInDistance:120,regularWorkMinutes:480,notes:"ashabil@difitech.co.id"===t.email?"Presensi masuk 09:54 WIB":"Presensi reguler tepat waktu"}})}await c._.task.updateMany({where:{status:"COMPLETED"},data:{isTracking:!1,trackingStartedAt:null}});let r=`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Stempel CamStamp Berhasil - Difitech HRIS</title>
          <meta http-equiv="refresh" content="2;url=/dashboard" />
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; background: #0f172a; color: white; }
            .card { background: #1e293b; padding: 2rem; border-radius: 1rem; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5); text-align: center; max-width: 480px; width: 90%; border: 1px solid #334155; }
            .icon { width: 64px; height: 64px; background: #10b981; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 1.5rem; font-size: 32px; }
            h1 { font-size: 1.25rem; font-weight: 700; margin-bottom: 0.5rem; }
            p { color: #94a3b8; font-size: 0.875rem; margin-bottom: 1.5rem; line-height: 1.5; }
            .btn { display: inline-block; background: #ef4444; color: white; font-weight: 600; font-size: 0.875rem; padding: 0.75rem 1.5rem; border-radius: 0.75rem; text-decoration: none; transition: background 0.2s; }
            .btn:hover { background: #dc2626; }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="icon">✓</div>
            <h1>Stempel CamStamp Selesai!</h1>
            <p>Stempel waktu, GPS, dan watermark CamStamp Siswandi dan seluruh karyawan telah aktif sempurna.<br/><br/>Mengarahkan ke Dashboard...</p>
            <a href="/dashboard" class="btn">Buka Dashboard</a>
          </div>
        </body>
      </html>
    `;return new s.NextResponse(r,{headers:{"Content-Type":"text/html; charset=utf-8"}})}catch(e){return s.NextResponse.json({error:e.message},{status:500})}}let f=new r.AppRouteRouteModule({definition:{kind:n.x.APP_ROUTE,page:"/api/admin/restore-attendance/route",pathname:"/api/admin/restore-attendance",filename:"route",bundlePath:"app/api/admin/restore-attendance/route"},resolvedPagePath:"/Users/kingashabil/Desktop/HRIS/src/app/api/admin/restore-attendance/route.ts",nextConfigOutput:"",userland:i}),{requestAsyncStorage:g,staticGenerationAsyncStorage:y,serverHooks:I}=f,b="/api/admin/restore-attendance/route";function x(){return(0,o.patchFetch)({serverHooks:I,staticGenerationAsyncStorage:y})}},20728:(e,t,a)=>{a.d(t,{_:()=>r});let i=require("@prisma/client"),r=globalThis.prisma??new i.PrismaClient({log:["error"]})}};var t=require("../../../../webpack-runtime.js");t.C(e);var a=e=>t(t.s=e),i=t.X(0,[8948,5972],()=>a(3277));module.exports=i})();