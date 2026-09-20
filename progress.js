/* ===================================================================
   رحلتي - progress.js
=================================================================== */
function $(id){ return document.getElementById(id); }
const body = document.body;

(function(){
  const themeToggle = $('themeToggle');
  const themeIcon = $('themeIcon');
  function applyTheme(theme){
    body.setAttribute('data-theme', theme);
    themeIcon.textContent = theme === 'dark' ? '🌙' : '☀️';
    localStorage.setItem('site-theme', theme);
  }
  applyTheme(localStorage.getItem('site-theme') || 'dark');
  themeToggle.addEventListener('click', ()=> applyTheme(body.getAttribute('data-theme') === 'dark' ? 'light' : 'dark'));
})();

const audioClick = $('audioClick');
function playClick(){ try{ audioClick.currentTime = 0; audioClick.play().catch(()=>{}); }catch(e){} }
document.addEventListener('click', (e)=>{ if(e.target.closest('button,a')) playClick(); });

const toastBox = $('toastBox');
function showToast(msg, duration=4000){
  toastBox.textContent = msg;
  toastBox.classList.add('show');
  clearTimeout(showToast._t);
  showToast._t = setTimeout(()=> toastBox.classList.remove('show'), duration);
}

const EASTERN_DIGITS = ['٠','١','٢','٣','٤','٥','٦','٧','٨','٩'];
function toEasternDigits(n){ return String(n).split('').map(c=> /[0-9]/.test(c) ? EASTERN_DIGITS[+c] : c).join(''); }

/* ---------------- مستوى المستخدم ---------------- */
const level = getCurrentLevel();
$('levelIcon').textContent = level.icon;
$('levelName').textContent = level.name;
if(level.next){
  const pct = Math.min(100, Math.round(((level.score - level.min) / (level.next.min - level.min)) * 100));
  $('levelBar').style.width = pct + '%';
  $('levelSub').textContent = `${toEasternDigits(level.score)} نقطة — محتاج ${toEasternDigits(level.next.min - level.score)} نقطة كمان عشان توصل لمستوى "${level.next.name}"`;
}else{
  $('levelBar').style.width = '100%';
  $('levelSub').textContent = `${toEasternDigits(level.score)} نقطة — ما شاء الله، وصلت لأعلى مستوى!`;
}

/* ---------------- شجرة الحسنات (SVG بيكبر تدريجيًا) ---------------- */
function treeSvg(stage){
  // stage من 0 (بذرة) لحد 4 (شجرة مثمرة)
  const stages = [
    `<svg viewBox="0 0 100 100"><circle cx="50" cy="85" r="6" fill="#8a6d3c"/><ellipse cx="50" cy="70" rx="4" ry="10" fill="#5a8f3c"/></svg>`,
    `<svg viewBox="0 0 100 100"><rect x="47" y="55" width="6" height="35" fill="#8a6d3c"/><circle cx="50" cy="48" r="18" fill="#6fae4a"/></svg>`,
    `<svg viewBox="0 0 100 100"><rect x="46" y="45" width="8" height="45" fill="#8a6d3c"/><circle cx="50" cy="38" r="26" fill="#5a9c40"/><circle cx="34" cy="50" r="14" fill="#5a9c40"/><circle cx="66" cy="50" r="14" fill="#5a9c40"/></svg>`,
    `<svg viewBox="0 0 100 100"><rect x="45" y="40" width="10" height="50" fill="#7a5a2c"/><circle cx="50" cy="30" r="30" fill="#4f9438"/><circle cx="28" cy="45" r="18" fill="#4f9438"/><circle cx="72" cy="45" r="18" fill="#4f9438"/></svg>`,
    `<svg viewBox="0 0 100 100"><rect x="45" y="38" width="10" height="52" fill="#7a5a2c"/><circle cx="50" cy="28" r="30" fill="#3f8a30"/><circle cx="26" cy="44" r="18" fill="#3f8a30"/><circle cx="74" cy="44" r="18" fill="#3f8a30"/>
      <circle cx="38" cy="26" r="3" fill="#e6c877"/><circle cx="60" cy="20" r="3" fill="#e6c877"/><circle cx="70" cy="40" r="3" fill="#e6c877"/><circle cx="30" cy="50" r="3" fill="#e6c877"/></svg>`
  ];
  return stages[Math.max(0, Math.min(4, stage))];
}
const stageIndex = LEVELS.findIndex(l=> l.name === level.name);
$('treeSvgWrap').innerHTML = treeSvg(stageIndex);

/* ---------------- الرسم البياني الأسبوعي ---------------- */
function drawWeekChart(){
  const canvas = $('weekChart');
  const ctx = canvas.getContext('2d');
  const week = getLastNDaysTasbih(7);
  const max = Math.max(1, ...week.map(d=>d.count));
  const W = canvas.width, H = canvas.height;
  ctx.clearRect(0,0,W,H);
  const barW = W / (week.length * 2);
  const dayNames = ['أحد','اثنين','ثلاثاء','أربعاء','خميس','جمعة','سبت'];
  week.forEach((d, i)=>{
    const x = W - (i+1) * (barW*2) + barW*0.5;
    const h = (d.count / max) * (H - 50);
    ctx.fillStyle = '#c9a24b';
    ctx.fillRect(x, H-30-h, barW, h);
    ctx.fillStyle = '#9aa4bd';
    ctx.font = '12px Tahoma';
    ctx.textAlign = 'center';
    const dow = new Date(d.date).getDay();
    ctx.fillText(dayNames[dow], x + barW/2, H-10);
    if(d.count>0){ ctx.fillStyle = '#e6c877'; ctx.fillText(d.count, x + barW/2, H-34-h); }
  });
}
drawWeekChart();

const summary = getWeeklySummary();
$('weekStatsRow').innerHTML = `
  <div><b>${toEasternDigits(summary.tasbihWeek)}</b>تسبيحة الأسبوع ده</div>
  <div><b>${toEasternDigits(summary.activeDays)}</b>يوم نشط من 7</div>
  <div><b>${toEasternDigits(summary.surahsCompleted)}</b>سورة مكتملة إجمالًا</div>
  <div><b>${toEasternDigits(summary.adhkarTotal)}</b>مرة ذكر مكتملة إجمالًا</div>
`;

/* ---------------- مشاركة بطاقة التقدم ---------------- */
$('shareProgressBtn').addEventListener('click', ()=>{
  const canvas = document.createElement('canvas');
  canvas.width = 900; canvas.height = 600;
  const ctx = canvas.getContext('2d');
  const bg = ctx.createLinearGradient(0,0,900,600);
  bg.addColorStop(0,'#0a1122'); bg.addColorStop(1,'#152040');
  ctx.fillStyle = bg; ctx.fillRect(0,0,900,600);
  ctx.strokeStyle = '#c9a24b'; ctx.lineWidth = 6; ctx.strokeRect(20,20,860,560);

  ctx.textAlign = 'center'; ctx.direction = 'rtl';
  ctx.fillStyle = '#e6c877'; ctx.font = '40px Tahoma';
  ctx.fillText('☾ الموقع الإسلامي الشامل ☽', 450, 90);

  ctx.font = '70px Tahoma'; ctx.fillText(level.icon, 450, 200);
  ctx.fillStyle = '#f4e7c1'; ctx.font = 'bold 44px Tahoma';
  ctx.fillText('مستوى: ' + level.name, 450, 260);

  ctx.fillStyle = '#ffffff'; ctx.font = '30px Tahoma';
  ctx.fillText(`${toEasternDigits(summary.tasbihWeek)} تسبيحة هذا الأسبوع`, 450, 340);
  ctx.fillText(`${toEasternDigits(summary.surahsCompleted)} سورة مكتملة إجمالًا`, 450, 390);
  ctx.fillText(`${toEasternDigits(summary.adhkarTotal)} مرة ذكر مكتملة إجمالًا`, 450, 440);

  ctx.fillStyle = '#9aa4bd'; ctx.font = '22px Tahoma';
  ctx.fillText('جرب الموقع بنفسك', 450, 520);

  const dataUrl = canvas.toDataURL('image/png');
  const overlay = document.createElement('div');
  overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.75);z-index:999;display:flex;align-items:center;justify-content:center;padding:16px;';
  overlay.innerHTML = `
    <div style="background:#101a30;border:1px solid #c9a24b;border-radius:16px;padding:16px;max-width:95vw;max-height:92vh;overflow:auto;text-align:center;">
      <img src="${dataUrl}" style="max-width:100%;border-radius:8px;display:block;margin-bottom:14px;">
      <div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap;">
        <button id="pDownloadBtn" class="btn primary">⬇️ تحميل</button>
        <button id="pShareBtn" class="btn">📤 مشاركة</button>
        <button id="pCloseBtn" class="btn small">✖ إغلاق</button>
      </div>
    </div>`;
  document.body.appendChild(overlay);
  overlay.addEventListener('click', (e)=>{ if(e.target === overlay) overlay.remove(); });
  overlay.querySelector('#pCloseBtn').addEventListener('click', ()=> overlay.remove());
  overlay.querySelector('#pDownloadBtn').addEventListener('click', ()=>{
    const a = document.createElement('a'); a.href = dataUrl; a.download = 'تقدمي.png';
    document.body.appendChild(a); a.click(); a.remove();
  });
  overlay.querySelector('#pShareBtn').addEventListener('click', async ()=>{
    try{
      const blob = await (await fetch(dataUrl)).blob();
      const file = new File([blob], 'تقدمي.png', { type:'image/png' });
      if(navigator.share && navigator.canShare && navigator.canShare({files:[file]})){
        await navigator.share({ files:[file], title:'تقدمي' });
      }else{
        const a = document.createElement('a'); a.href = dataUrl; a.download = 'تقدمي.png';
        document.body.appendChild(a); a.click(); a.remove();
      }
    }catch(e){}
  });
});

/* ===================================================================
   نظام الشارات (30+ شارة) وقسم الشهادات — منقول ومطوّر بعد حذف واحة الإيمان
=================================================================== */
const BADGES = [
  // تسبيح
  { icon:'📿', name:'أول تسبيحة', cond:()=> getTasbihTotalAllTime() >= 1 },
  { icon:'📿', name:'100 تسبيحة', cond:()=> getTasbihTotalAllTime() >= 100 },
  { icon:'📿', name:'1000 تسبيحة', cond:()=> getTasbihTotalAllTime() >= 1000 },
  { icon:'📿', name:'10 آلاف تسبيحة', cond:()=> getTasbihTotalAllTime() >= 10000 },
  { icon:'🔥', name:'يوم بـ100 تسبيحة', cond:()=> getMaxTasbihDay() >= 100 },
  { icon:'🔥', name:'3 أيام متتالية', cond:()=> getConsecutiveTasbihDays() >= 3 },
  { icon:'🔥', name:'أسبوع متتالي', cond:()=> getConsecutiveTasbihDays() >= 7 },
  // أذكار
  { icon:'🕊️', name:'أول ذكر مكتمل', cond:()=> getAdhkarTotal() >= 1 },
  { icon:'🕊️', name:'10 مرات ذكر', cond:()=> getAdhkarTotal() >= 10 },
  { icon:'🕊️', name:'50 مرة ذكر', cond:()=> getAdhkarTotal() >= 50 },
  { icon:'🕊️', name:'100 مرة ذكر', cond:()=> getAdhkarTotal() >= 100 },
  // قرآن
  { icon:'📖', name:'أول سورة مكتملة', cond:()=> getCompletedSurahsCount() >= 1 },
  { icon:'📖', name:'10 سور مكتملة', cond:()=> getCompletedSurahsCount() >= 10 },
  { icon:'📖', name:'50 سورة مكتملة', cond:()=> getCompletedSurahsCount() >= 50 },
  { icon:'🕋', name:'ختم القرآن كامل', cond:()=> getCompletedSurahsCount() >= 114 },
  { icon:'⭐', name:'أول سورة مفضّلة', cond:()=> getFavSurahsCount() >= 1 },
  { icon:'⭐', name:'5 سور مفضّلة', cond:()=> getFavSurahsCount() >= 5 },
  { icon:'💛', name:'أول آية مفضّلة', cond:()=> getFavAyatCount() >= 1 },
  // أسماء الله الحسنى
  { icon:'✨', name:'أول اسم محفوظ', cond:()=> getMemorizedNamesCount() >= 1 },
  { icon:'✨', name:'25 اسم محفوظ', cond:()=> getMemorizedNamesCount() >= 25 },
  { icon:'✨', name:'50 اسم محفوظ', cond:()=> getMemorizedNamesCount() >= 50 },
  { icon:'🌟', name:'حفظ كل الأسماء الحسنى', cond:()=> getMemorizedNamesCount() >= 99 },
  { icon:'🧠', name:'اجتياز اختبار الأسماء', cond:()=> getAsmaQuizBest() >= 8 },
  // عام
  { icon:'👋', name:'أول زيارة', cond:()=> getSiteVisits() >= 1 },
  { icon:'👋', name:'7 زيارات', cond:()=> getSiteVisits() >= 7 },
  { icon:'👋', name:'30 زيارة', cond:()=> getSiteVisits() >= 30 },
  { icon:'🗺️', name:'استكشاف الموقع', cond:()=> getVisitedPagesCount() >= 6 },
  { icon:'🗺️', name:'استكشاف كامل', cond:()=> getVisitedPagesCount() >= 9 },
  { icon:'🏆', name:'أول شهادة', cond:()=> hasGeneratedCert() },
  { icon:'🌿', name:'مستوى مواظب', cond:()=> getGoodDeedsScore() >= 100 },
  { icon:'🌳', name:'مستوى مجتهد', cond:()=> getGoodDeedsScore() >= 500 },
  { icon:'🌴', name:'مستوى متمكّن', cond:()=> getGoodDeedsScore() >= 2000 },
  { icon:'👑', name:'مستوى قدوة', cond:()=> getGoodDeedsScore() >= 6000 }
];

function renderBadges(){
  const grid = $('badgesGrid');
  if(!grid) return;
  grid.innerHTML = BADGES.map(b=>{
    const unlocked = (()=>{ try{ return b.cond(); }catch(e){ return false; } })();
    return `<div class="badge-item ${unlocked?'unlocked':'locked'}" title="${b.name}">
      <div class="badge-icon">${unlocked ? b.icon : '🔒'}</div>
      <div class="badge-name">${b.name}</div>
    </div>`;
  }).join('');
}
renderBadges();

/* ---------------- الشهادات والإنجازات ---------------- */
function askNameAndShow(opts){
  const name = prompt('اكتب اسمك عشان يظهر في الشهادة:', localStorage.getItem('cert-name') || '') || 'المستخدم';
  localStorage.setItem('cert-name', name);
  showCertificateModal({ ...opts, name });
}

function renderAchievements(){
  const grid = $('achievementsGrid');
  if(!grid) return;
  const quranCount = getCompletedSurahsCount();
  const namesCount = getMemorizedNamesCount();
  const azkarCount = getAdhkarTotal();
  const AZKAR_TARGET = 20;

  const items = [
    { emoji:'📖', title:'ختم القرآن الكريم', progress: quranCount, target: 114,
      cert:{ title:'شهادة ختم القرآن الكريم', subtitle:'أتم قراءة/استماع المصحف الشريف كاملًا عبر الموقع الإسلامي الشامل' } },
    { emoji:'✨', title:'حفظ أسماء الله الحسنى', progress: namesCount, target: 99,
      cert:{ title:'شهادة حفظ أسماء الله الحسنى', subtitle:'أتم حفظ الأسماء الحسنى التسعة والتسعين عبر الموقع الإسلامي الشامل' } },
    { emoji:'📿', title:'الاستمرار في الأذكار', progress: azkarCount, target: AZKAR_TARGET,
      cert:{ title:'شهادة المداومة على الأذكار', subtitle:'حافظ على أذكار الصباح والمساء بانتظام عبر الموقع الإسلامي الشامل' } }
  ];

  grid.innerHTML = items.map((it, idx)=>{
    const done = it.progress >= it.target;
    return `
    <div class="achievement-card ${done ? '' : 'locked'}">
      <div class="ach-emoji">${it.emoji}</div>
      <div class="ach-title">${it.title}</div>
      <div class="ach-progress">${Math.min(it.progress,it.target)} / ${it.target}</div>
      <button class="btn small ${done?'primary':''}" data-idx="${idx}" ${done?'':'disabled'}>${done ? '🏆 عرض الشهادة' : '🔒 لسه ماوصلتش'}</button>
    </div>`;
  }).join('') + `
    <div class="achievement-card">
      <div class="ach-emoji">🎖️</div>
      <div class="ach-title">شهادة عامة</div>
      <div class="ach-progress">لأي مناسبة تانية</div>
      <button class="btn small" id="customCertBtn">✏️ إنشاء شهادة</button>
    </div>`;

  grid.querySelectorAll('button[data-idx]').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      const it = items[+btn.dataset.idx];
      askNameAndShow(it.cert);
    });
  });
  $('customCertBtn')?.addEventListener('click', ()=>{
    const title = prompt('عنوان الشهادة:', 'شهادة تقدير') || 'شهادة تقدير';
    const subtitle = prompt('وصف قصير للشهادة:', '') || '';
    askNameAndShow({ title, subtitle });
  });
}
renderAchievements();
