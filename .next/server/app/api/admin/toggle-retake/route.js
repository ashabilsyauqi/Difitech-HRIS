"use strict";(()=>{var e={};e.id=7240,e.ids=[7240],e.modules={20399:e=>{e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},30517:e=>{e.exports=require("next/dist/compiled/next-server/app-route.runtime.prod.js")},57147:e=>{e.exports=require("fs")},71017:e=>{e.exports=require("path")},29409:(e,t,a)=>{a.r(t),a.d(t,{originalPathname:()=>p,patchFetch:()=>h,requestAsyncStorage:()=>g,routeModule:()=>u,serverHooks:()=>m,staticGenerationAsyncStorage:()=>b});var r={};a.r(r),a.d(r,{GET:()=>c,dynamic:()=>d});var o=a(49303),n=a(88716),i=a(60670),s=a(87070),l=a(40033);let d="force-dynamic";async function c(e){try{let{searchParams:t}=new URL(e.url),a=t.get("enable"),r=(0,l.B)();null!==a&&(r=(0,l.z)({allowRetakeClockInPhoto:"true"===a||"1"===a||"on"===a}));let o=`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Pengaturan Fitur Foto Ulang - Difitech HRIS</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; background: #0f172a; color: white; }
            .card { background: #1e293b; padding: 2.5rem; border-radius: 1.25rem; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5); text-align: center; max-width: 480px; width: 90%; border: 1px solid #334155; }
            .badge { display: inline-block; padding: 0.5rem 1rem; border-radius: 9999px; font-weight: 700; font-size: 0.875rem; margin-bottom: 1.5rem; }
            .badge-on { background: #065f46; color: #34d399; border: 1px solid #059669; }
            .badge-off { background: #7f1d1d; color: #f87171; border: 1px solid #dc2626; }
            h1 { font-size: 1.25rem; font-weight: 700; margin-bottom: 0.5rem; }
            p { color: #94a3b8; font-size: 0.875rem; margin-bottom: 1.75rem; line-height: 1.5; }
            .btn { display: inline-block; font-weight: 700; font-size: 0.875rem; padding: 0.75rem 1.5rem; border-radius: 0.75rem; text-decoration: none; transition: background 0.2s; margin: 0.25rem; }
            .btn-off { background: #dc2626; color: white; }
            .btn-off:hover { background: #b91c1c; }
            .btn-on { background: #059669; color: white; }
            .btn-on:hover { background: #047857; }
            .btn-back { background: #334155; color: #cbd5e1; }
            .btn-back:hover { background: #475569; }
          </style>
        </head>
        <body>
          <div class="card">
            <span class="badge ${r.allowRetakeClockInPhoto?"badge-on":"badge-off"}">
              STATUS FITUR: ${r.allowRetakeClockInPhoto?"AKTIF / ON \uD83D\uDFE2":"NONAKTIF / OFF \uD83D\uDD34"}
            </span>
            <h1>Fitur Foto Ulang Presensi (Re-CamStamp)</h1>
            <p>
              ${r.allowRetakeClockInPhoto?"Fitur saat ini <strong>AKTIF</strong>. Karyawan dapat mengambil foto ulang dengan stempel jam masuk pagi.":"Fitur saat ini <strong>NONAKTIF</strong>. Tombol Foto Ulang Masuk disembunyikan dari dashboard karyawan."}
            </p>
            <div>
              ${r.allowRetakeClockInPhoto?'<a href="/api/admin/toggle-retake?enable=false" class="btn btn-off">\uD83D\uDD12 Matikan Fitur Sekarang (Untuk Besok)</a>':'<a href="/api/admin/toggle-retake?enable=true" class="btn btn-on">\uD83D\uDD13 Aktifkan Kembali Fitur</a>'}
              <br/><br/>
              <a href="/dashboard" class="btn btn-back">Kembali ke Dashboard</a>
            </div>
          </div>
        </body>
      </html>
    `;return new s.NextResponse(o,{headers:{"Content-Type":"text/html; charset=utf-8"}})}catch(e){return s.NextResponse.json({error:e.message},{status:500})}}let u=new o.AppRouteRouteModule({definition:{kind:n.x.APP_ROUTE,page:"/api/admin/toggle-retake/route",pathname:"/api/admin/toggle-retake",filename:"route",bundlePath:"app/api/admin/toggle-retake/route"},resolvedPagePath:"/Users/kingashabil/Desktop/HRIS/src/app/api/admin/toggle-retake/route.ts",nextConfigOutput:"",userland:r}),{requestAsyncStorage:g,staticGenerationAsyncStorage:b,serverHooks:m}=u,p="/api/admin/toggle-retake/route";function h(){return(0,i.patchFetch)({serverHooks:m,staticGenerationAsyncStorage:b})}},40033:(e,t,a)=>{a.d(t,{B:()=>d,z:()=>c});var r=a(57147),o=a.n(r),n=a(71017),i=a.n(n);let s=i().join(process.cwd(),"config","features.json"),l={allowRetakeClockInPhoto:!0};function d(){try{if(o().existsSync(s)){let e=o().readFileSync(s,"utf-8");return{...l,...JSON.parse(e)}}}catch(e){console.error("Failed to read feature flags:",e)}return l}function c(e){try{let t=i().dirname(s);o().existsSync(t)||o().mkdirSync(t,{recursive:!0});let a={...d(),...e};return o().writeFileSync(s,JSON.stringify(a,null,2),"utf-8"),a}catch(e){return console.error("Failed to write feature flags:",e),l}}}};var t=require("../../../../webpack-runtime.js");t.C(e);var a=e=>t(t.s=e),r=t.X(0,[8948,5972],()=>a(29409));module.exports=r})();