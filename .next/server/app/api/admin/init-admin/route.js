"use strict";(()=>{var e={};e.id=5969,e.ids=[5969],e.modules={20399:e=>{e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},30517:e=>{e.exports=require("next/dist/compiled/next-server/app-route.runtime.prod.js")},6113:e=>{e.exports=require("crypto")},58205:(e,a,t)=>{t.r(a),t.d(a,{originalPathname:()=>h,patchFetch:()=>g,requestAsyncStorage:()=>T,routeModule:()=>u,serverHooks:()=>E,staticGenerationAsyncStorage:()=>A});var i={};t.r(i),t.d(i,{GET:()=>l,dynamic:()=>p});var r=t(49303),n=t(88716),o=t(60670),d=t(87070),s=t(20728),c=t(42023),m=t.n(c);let p="force-dynamic";async function l(e){try{try{await s._.$executeRawUnsafe("ALTER TABLE User ADD COLUMN employmentStatus TEXT DEFAULT 'FULL_TIME';")}catch(e){}try{await s._.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS Department (
          id TEXT PRIMARY KEY,
          name TEXT UNIQUE NOT NULL,
          code TEXT,
          description TEXT,
          color TEXT DEFAULT '#dc2626',
          createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
          updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
        );
      `)}catch(e){}for(let e of[{id:"dept_ads",name:"Ads",code:"ADS",description:"Divisi Advertising & Media Buying",color:"#f59e0b"},{id:"dept_creative",name:"Creative",code:"CRTV",description:"Divisi Creative & Content Design",color:"#8b5cf6"},{id:"dept_operational",name:"Operational",code:"OPS",description:"Divisi Operasional & Administrasi",color:"#0ea5e9"},{id:"dept_website",name:"Website",code:"WEB",description:"Divisi Website & Software Engineering",color:"#dc2626"}])try{await s._.$executeRawUnsafe("INSERT OR REPLACE INTO Department (id, name, code, description, color, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)",e.id,e.name,e.code,e.description,e.color)}catch(e){}let e=await m().hash("password123",10);await s._.$executeRawUnsafe(`INSERT OR REPLACE INTO User (id, email, passwordHash, name, role, department, jobTitle, employmentStatus, avatarUrl, bankName, bankAccountNumber, bankAccountHolder, createdAt, updatedAt)
       VALUES ('user_admin_wijaya', 'wijaya@difitech.co.id', ?, 'Wijaya', 'ADMIN', 'Manajemen & HR', 'Human Capital & Operations Administrator', 'FULL_TIME', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400', 'BCA', '8012349988', 'Wijaya', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,e);try{await s._.$executeRawUnsafe(`UPDATE OfficeLocation SET 
          name = 'Difitech Office (Bekasi)', 
          address = 'Ruko Burgundy Summarecon Bekasi, Blok RAL/38, RT.001/RW.001, Harapan Baru, Kec. Bekasi Utara, Kota Bks, Jawa Barat 17123',
          latitude = -6.221538,
          longitude = 107.013962,
          radiusMeters = 150
        WHERE isActive = 1;`)}catch(e){}let a=`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Aktivasi Admin Wijaya - Difitech HRIS</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; background: #0f172a; color: white; }
            .card { background: #1e293b; padding: 2.5rem; border-radius: 1.25rem; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5); text-align: center; max-width: 480px; width: 90%; border: 1px solid #334155; }
            .badge { display: inline-block; padding: 0.5rem 1rem; border-radius: 9999px; font-weight: 700; font-size: 0.875rem; margin-bottom: 1.5rem; background: #065f46; color: #34d399; border: 1px solid #059669; }
            h1 { font-size: 1.25rem; font-weight: 700; margin-bottom: 0.5rem; }
            p { color: #94a3b8; font-size: 0.875rem; margin-bottom: 1.75rem; line-height: 1.5; }
            .btn { display: inline-block; font-weight: 700; font-size: 0.875rem; padding: 0.75rem 1.5rem; border-radius: 0.75rem; text-decoration: none; transition: background 0.2s; background: #dc2626; color: white; }
            .btn:hover { background: #b91c1c; }
          </style>
        </head>
        <body>
          <div class="card">
            <span class="badge">AKTIVASI ADMIN BERHASIL 100% 🟢</span>
            <h1>Akun Admin Wijaya Ready!</h1>
            <p>
              Akun Admin <strong>wijaya@difitech.co.id</strong> (Password: <strong>password123</strong>) dan struktur 5 divisi baru telah sukses diaktifkan di database.
            </p>
            <a href="/login" class="btn">🚀 Buka Halaman Login Sekarang</a>
          </div>
        </body>
      </html>
    `;return new d.NextResponse(a,{headers:{"Content-Type":"text/html; charset=utf-8"}})}catch(e){return d.NextResponse.json({error:e.message},{status:500})}}let u=new r.AppRouteRouteModule({definition:{kind:n.x.APP_ROUTE,page:"/api/admin/init-admin/route",pathname:"/api/admin/init-admin",filename:"route",bundlePath:"app/api/admin/init-admin/route"},resolvedPagePath:"/Users/kingashabil/Desktop/HRIS/src/app/api/admin/init-admin/route.ts",nextConfigOutput:"",userland:i}),{requestAsyncStorage:T,staticGenerationAsyncStorage:A,serverHooks:E}=u,h="/api/admin/init-admin/route";function g(){return(0,o.patchFetch)({serverHooks:E,staticGenerationAsyncStorage:A})}},20728:(e,a,t)=>{t.d(a,{_:()=>r});let i=require("@prisma/client"),r=globalThis.prisma??new i.PrismaClient({log:["error"]})}};var a=require("../../../../webpack-runtime.js");a.C(e);var t=e=>a(a.s=e),i=a.X(0,[8948,5972,2023],()=>t(58205));module.exports=i})();