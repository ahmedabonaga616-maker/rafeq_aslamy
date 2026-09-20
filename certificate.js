/* ===================================================================
   مولّد الشهادات - certificate.js
   بيرسم شهادة إنجاز على Canvas وبيدي خيار تحميلها أو مشاركتها كصورة
=================================================================== */
function generateCertificate({ title, subtitle, name, footer }){
  const canvas = document.createElement('canvas');
  canvas.width = 1200; canvas.height = 850;
  const ctx = canvas.getContext('2d');

  // خلفية متدرجة
  const bg = ctx.createLinearGradient(0,0,1200,850);
  bg.addColorStop(0,'#0a1122'); bg.addColorStop(1,'#152040');
  ctx.fillStyle = bg; ctx.fillRect(0,0,1200,850);

  // إطار ذهبي مزدوج
  ctx.strokeStyle = '#c9a24b'; ctx.lineWidth = 8;
  ctx.strokeRect(30,30,1140,790);
  ctx.lineWidth = 2;
  ctx.strokeRect(50,50,1100,750);

  // زخرفة زوايا (نجمة ثمانية مبسطة)
  function corner(x,y,flipX,flipY){
    ctx.save();
    ctx.translate(x,y);
    ctx.scale(flipX,flipY);
    ctx.strokeStyle = '#e6c877'; ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0,40); ctx.lineTo(40,0); ctx.lineTo(80,40); ctx.moveTo(40,0); ctx.lineTo(40,80);
    ctx.stroke();
    ctx.restore();
  }
  corner(50,50,1,1); corner(1150,50,-1,1); corner(50,800,1,-1); corner(1150,800,-1,-1);

  ctx.textAlign = 'center';
  ctx.direction = 'rtl';

  ctx.fillStyle = '#e6c877';
  ctx.font = '48px "Amiri", serif';
  ctx.fillText('☾ الموقع الإسلامي الشامل ☽', 600, 150);

  ctx.fillStyle = '#f4e7c1';
  ctx.font = 'bold 70px "Amiri", serif';
  ctx.fillText(title || 'شهادة إنجاز', 600, 290);

  ctx.strokeStyle = '#c9a24b'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(350,330); ctx.lineTo(850,330); ctx.stroke();

  ctx.fillStyle = '#ffffff';
  ctx.font = '34px "Amiri", serif';
  ctx.fillText('تُمنح هذه الشهادة إلى', 600, 400);

  ctx.fillStyle = '#e6c877';
  ctx.font = 'bold 58px "Amiri", serif';
  ctx.fillText(name || 'المستخدم', 600, 480);

  ctx.fillStyle = '#cfd6e6';
  ctx.font = '30px "Amiri", serif';
  wrapText(ctx, subtitle || '', 600, 560, 900, 42);

  const dateStr = new Date().toLocaleDateString('ar-EG-u-ca-islamic', { year:'numeric', month:'long', day:'numeric' });
  ctx.fillStyle = '#9aa4bd';
  ctx.font = '26px "Amiri", serif';
  ctx.fillText(dateStr + ' هـ', 600, 700);

  ctx.fillStyle = '#7c869c';
  ctx.font = '20px "Amiri", serif';
  ctx.fillText(footer || 'صدقة جارية لكل من ساهم في هذا العمل', 600, 760);

  return canvas;
}

function wrapText(ctx, text, x, y, maxWidth, lineHeight){
  const words = text.split(' ');
  let line = '';
  let curY = y;
  for(let i=0;i<words.length;i++){
    const test = line + words[i] + ' ';
    if(ctx.measureText(test).width > maxWidth && line){
      ctx.fillText(line, x, curY);
      line = words[i] + ' ';
      curY += lineHeight;
    } else { line = test; }
  }
  ctx.fillText(line, x, curY);
}

/* واجهة سهلة: تفتح الشهادة كصورة، مع أزرار تحميل/مشاركة */
function showCertificateModal(opts){
  try{ localStorage.setItem('has-generated-cert', '1'); }catch(e){}
  const canvas = generateCertificate(opts);
  const dataUrl = canvas.toDataURL('image/png');

  const overlay = document.createElement('div');
  overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.75);z-index:999;display:flex;align-items:center;justify-content:center;padding:16px;';
  overlay.innerHTML = `
    <div style="background:#101a30;border:1px solid #c9a24b;border-radius:16px;padding:16px;max-width:95vw;max-height:92vh;overflow:auto;text-align:center;">
      <img src="${dataUrl}" style="max-width:100%;border-radius:8px;display:block;margin-bottom:14px;">
      <div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap;">
        <button id="certDownloadBtn" class="btn primary">⬇️ تحميل الشهادة</button>
        <button id="certShareBtn" class="btn">📤 مشاركة</button>
        <button id="certCloseBtn" class="btn small">✖ إغلاق</button>
      </div>
    </div>`;
  document.body.appendChild(overlay);

  overlay.querySelector('#certCloseBtn').addEventListener('click', ()=> overlay.remove());
  overlay.addEventListener('click', (e)=>{ if(e.target === overlay) overlay.remove(); });
  overlay.querySelector('#certDownloadBtn').addEventListener('click', ()=>{
    const a = document.createElement('a');
    a.href = dataUrl; a.download = 'شهادة.png';
    document.body.appendChild(a); a.click(); a.remove();
  });
  overlay.querySelector('#certShareBtn').addEventListener('click', async ()=>{
    try{
      const blob = await (await fetch(dataUrl)).blob();
      const file = new File([blob], 'شهادة.png', { type:'image/png' });
      if(navigator.share && navigator.canShare && navigator.canShare({files:[file]})){
        await navigator.share({ files:[file], title: opts.title || 'شهادة' });
      } else {
        const a = document.createElement('a');
        a.href = dataUrl; a.download = 'شهادة.png';
        document.body.appendChild(a); a.click(); a.remove();
      }
    }catch(e){}
  });
}
