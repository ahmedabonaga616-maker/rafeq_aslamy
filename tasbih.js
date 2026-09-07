/* ===================== السبحة الإلكترونية ===================== */
function $(id){ return document.getElementById(id); }
function safe(fn, label){ try{ fn(); }catch(e){ console.error('خطأ في: '+label, e); } }

const body = document.body;
safe(()=>{
  const themeToggle = $('themeToggle');
  const themeIcon = $('themeIcon');
  function applyTheme(theme){
    body.setAttribute('data-theme', theme);
    themeIcon.textContent = theme === 'dark' ? '🌙' : '☀️';
    localStorage.setItem('site-theme', theme);
  }
  applyTheme(localStorage.getItem('site-theme') || 'dark');
  themeToggle.addEventListener('click', ()=> applyTheme(body.getAttribute('data-theme') === 'dark' ? 'light' : 'dark'));
}, 'الوضع الليلي');

const audioClick = $('audioClick');
function playClick(){ try{ audioClick.currentTime = 0; audioClick.play().catch(()=>{}); }catch(e){} }
function vibrate(ms){ try{ if(navigator.vibrate) navigator.vibrate(ms); }catch(e){} }

const toastBox = $('toastBox');
function showToast(msg, duration=3000){
  toastBox.textContent = msg;
  toastBox.classList.add('show');
  clearTimeout(showToast._t);
  showToast._t = setTimeout(()=> toastBox.classList.remove('show'), duration);
}

/* تبديل الوضع */
safe(()=>{
  const modernModeBtn = $('modernModeBtn'), handModeBtn = $('handModeBtn');
  const modernView = $('modernView'), handView = $('handView');
  modernModeBtn.addEventListener('click', ()=>{
    playClick();
    modernModeBtn.classList.add('active'); handModeBtn.classList.remove('active');
    modernView.classList.remove('hidden'); handView.classList.add('hidden');
  });
  handModeBtn.addEventListener('click', ()=>{
    playClick();
    handModeBtn.classList.add('active'); modernModeBtn.classList.remove('active');
    handView.classList.remove('hidden'); modernView.classList.add('hidden');
  });
}, 'تبديل الوضع');

/* اختيار الذكر */
safe(()=>{
  const dhikrSelect = $('dhikrSelect');
  dhikrSelect.addEventListener('change', ()=>{
    $('dhikrDisplayModern').textContent = dhikrSelect.value;
    $('dhikrDisplayHand').textContent = dhikrSelect.value;
  });
}, 'اختيار الذكر');

/* العداد المشترك */
const TOTAL = 33;
let count = 0;
let totalAllTime = parseInt(localStorage.getItem('tasbihTotalAllTime') || '0', 10);
const CIRCUMFERENCE = 2 * Math.PI * 95;

safe(()=>{ $('totalCount').textContent = totalAllTime; }, 'عرض الإجمالي');

function renderCount(){
  safe(()=>{
    $('countNum').textContent = count;
    $('handCountNum').textContent = String(count).padStart(2,'0');
    const offset = CIRCUMFERENCE - (count / TOTAL) * CIRCUMFERENCE;
    $('ringFg').style.strokeDashoffset = offset;
  }, 'عرض العداد');
}

let clickTimestamps = [];
let cooldownActive = false;

function tryIncrement(originEl){
  if(cooldownActive) return;
  const now = Date.now();
  clickTimestamps.push(now);
  clickTimestamps = clickTimestamps.filter(t => now - t <= 2000);
  if(clickTimestamps.length > 5){ triggerCooldown(originEl); return; }

  playClick();
  vibrate(15);
  count = (count + 1) % (TOTAL + 1);
  if(count === 0){
    totalAllTime += TOTAL;
    localStorage.setItem('tasbihTotalAllTime', totalAllTime);
    safe(()=> $('totalCount').textContent = totalAllTime, 'تحديث الإجمالي');
    showToast('✅ أتممت دورة كاملة (33) - بارك الله فيك');
  }
  renderCount();
}

function triggerCooldown(originEl){
  cooldownActive = true;
  clickTimestamps = [];
  vibrate([30,30,30]);
  const msgEl = originEl === 'hand' ? $('calmMsgHand') : $('calmMsg');
  const circEl = $('circularCounter');
  const handEl = $('handDevice');
  msgEl.textContent = 'تمهّل، ركّز في ذكرك 🤍';
  msgEl.classList.add('show');
  if(originEl === 'hand') handEl.classList.add('cooldown'); else circEl.classList.add('cooldown');
  setTimeout(()=>{
    cooldownActive = false;
    msgEl.classList.remove('show');
    if(originEl === 'hand') handEl.classList.remove('cooldown'); else circEl.classList.remove('cooldown');
  }, 3000);
}

safe(()=>{
  const circularCounter = $('circularCounter');
  circularCounter.addEventListener('click', ()=>{
    circularCounter.classList.add('tapped');
    setTimeout(()=> circularCounter.classList.remove('tapped'), 180);
    tryIncrement('modern');
  });
}, 'الدائرة الحديثة');

safe(()=>{
  $('resetBtn').addEventListener('click', (e)=>{ e.stopPropagation(); playClick(); count = 0; renderCount(); });
}, 'زرار تصفير الحديثة');
safe(()=>{
  $('resetHandBtn').addEventListener('click', (e)=>{ e.stopPropagation(); playClick(); count = 0; renderCount(); });
}, 'زرار تصفير اليد');

/* جهاز سبحة اليد */
safe(()=>{
  const handDevice = $('handDevice');
  handDevice.addEventListener('click', (e)=>{
    if(e.target.closest('#resetHandBtn')) return;
    handDevice.classList.add('tapped');
    setTimeout(()=> handDevice.classList.remove('tapped'), 150);
    tryIncrement('hand');
  });
}, 'جهاز سبحة اليد');

/* 20 تصميم لجهاز سبحة اليد */
safe(()=>{
  const designs = [
    'linear-gradient(160deg,#f5f5f5,#cfcfcf)',
    'linear-gradient(160deg,#d9c08c,#8a6a3a)',
    'linear-gradient(160deg,#a8d5ba,#3f7a5c)',
    'linear-gradient(160deg,#a9d0e0,#2c6a85)',
    'linear-gradient(160deg,#e3a6a6,#8a2f2f)',
    'linear-gradient(160deg,#c9a6e0,#5c2f85)',
    'linear-gradient(160deg,#f0c6e8,#a13f8f)',
    'linear-gradient(160deg,#f5da8a,#a17d1f)',
    'linear-gradient(160deg,#8a8fae,#33374a)',
    'linear-gradient(160deg,#8ecbe0,#116e8a)',
    'linear-gradient(160deg,#f0a0b4,#c22255)',
    'linear-gradient(160deg,#8de0c4,#068a5f)',
    'linear-gradient(160deg,#5a6a78,#0f2230)',
    'linear-gradient(160deg,#f5c48a,#c26a1f)',
    'linear-gradient(160deg,#7a8fa0,#1f3540)',
    'linear-gradient(160deg,#f0a880,#a13f1f)',
    'linear-gradient(160deg,#c58af0,#4a0f7a)',
    'linear-gradient(160deg,#8ab0f5,#1f4fa1)',
    'linear-gradient(160deg,#f5e08a,#a18a1f)',
    'linear-gradient(160deg,#b08af5,#4a1fa1)'
  ];
  const designsGrid = $('designsGrid');
  const handDevice = $('handDevice');
  designs.forEach((grad, i)=>{
    const sw = document.createElement('button');
    sw.className = 'design-swatch';
    sw.style.background = grad;
    sw.title = 'تصميم ' + (i+1);
    if(i === 0) sw.classList.add('selected');
    sw.addEventListener('click', (e)=>{
      e.stopPropagation();
      playClick();
      document.querySelectorAll('.design-swatch').forEach(s=>s.classList.remove('selected'));
      sw.classList.add('selected');
      handDevice.style.setProperty('--device-skin', grad);
      localStorage.setItem('tasbihDeviceSkin', grad);
    });
    designsGrid.appendChild(sw);
  });
  const savedSkin = localStorage.getItem('tasbihDeviceSkin');
  if(savedSkin){ handDevice.style.setProperty('--device-skin', savedSkin); }
}, '20 تصميم لسبحة اليد');

renderCount();
