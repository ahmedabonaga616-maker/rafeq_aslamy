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
function playClick(){
  if(window.siteSettings && !window.siteSettings.soundEnabled()) return;
  try{ audioClick.currentTime = 0; audioClick.play().catch(()=>{}); }catch(e){}
}
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

/* اختيار الذكر + إضافة أذكار خاصة */
safe(()=>{
  const dhikrSelect = $('dhikrSelect');
  const CUSTOM_KEY = 'tasbihCustomDhikrs';
  function getCustomDhikrs(){ try{ return JSON.parse(localStorage.getItem(CUSTOM_KEY)||'[]'); }catch(e){ return []; } }
  function saveCustomDhikrs(list){ localStorage.setItem(CUSTOM_KEY, JSON.stringify(list)); }

  getCustomDhikrs().forEach(text=>{
    const opt = document.createElement('option');
    opt.value = text; opt.textContent = '🌙 ' + text;
    dhikrSelect.appendChild(opt);
  });

  dhikrSelect.addEventListener('change', ()=>{
    $('dhikrDisplayModern').textContent = dhikrSelect.value;
    $('dhikrDisplayHand').textContent = dhikrSelect.value;
  });

  $('addCustomDhikrBtn')?.addEventListener('click', ()=>{
    const input = $('customDhikrInput');
    const text = (input.value || '').trim();
    if(!text){ showToast('⚠️ اكتب الذكر الأول'); return; }
    const list = getCustomDhikrs();
    if(!list.includes(text)){ list.push(text); saveCustomDhikrs(list); }
    const opt = document.createElement('option');
    opt.value = text; opt.textContent = '🌙 ' + text;
    dhikrSelect.appendChild(opt);
    dhikrSelect.value = text;
    $('dhikrDisplayModern').textContent = text;
    $('dhikrDisplayHand').textContent = text;
    input.value = '';
    playClick();
    showToast('✅ اتضاف الذكر واتحفظ عندك');
  });
}, 'اختيار الذكر');

/* العداد المشترك */
let TOTAL = parseInt(localStorage.getItem('tasbihTarget') || '33', 10) || 33;
let count = 0;
let totalAllTime = parseInt(localStorage.getItem('tasbihTotalAllTime') || '0', 10);
const CIRCUMFERENCE = 2 * Math.PI * 95;
let history = []; // للتراجع: يخزن الحالة قبل كل زيادة

safe(()=>{ $('totalCount').textContent = totalAllTime; }, 'عرض الإجمالي');

function renderCount(){
  safe(()=>{
    $('countNum').textContent = count;
    $('handCountNum').textContent = String(count).padStart(2,'0');
    const offset = CIRCUMFERENCE - (count / TOTAL) * CIRCUMFERENCE;
    $('ringFg').style.strokeDashoffset = offset;
    $('targetDisplay').textContent = TOTAL;
    $('targetDisplayHand').textContent = TOTAL;
  }, 'عرض العداد');
}

/* ---------------- اختيار الهدف (33 / 99 / 100 / 1000 / مخصوص) ---------------- */
safe(()=>{
  const row = $('targetRow');
  const buttons = [...row.querySelectorAll('.target-btn')];
  const customInput = $('customTargetInput');

  function setTarget(val){
    TOTAL = Math.max(1, Math.min(99999, parseInt(val, 10) || 33));
    localStorage.setItem('tasbihTarget', String(TOTAL));
    count = 0; history = [];
    renderCount();
  }
  function render(){
    const known = ['33','99','100','1000'];
    buttons.forEach(b=>{
      const isCustom = b.dataset.target === 'custom';
      const active = isCustom ? !known.includes(String(TOTAL)) : String(TOTAL) === b.dataset.target;
      b.classList.toggle('active', active);
    });
    customInput.classList.toggle('hidden', known.includes(String(TOTAL)));
    if(!known.includes(String(TOTAL))) customInput.value = TOTAL;
  }
  render();
  buttons.forEach(b=> b.addEventListener('click', ()=>{
    playClick();
    if(b.dataset.target === 'custom'){
      customInput.classList.remove('hidden');
      customInput.focus();
      return;
    }
    setTarget(b.dataset.target);
    render();
    showToast('🎯 الهدف بقى ' + TOTAL);
  }));
  customInput.addEventListener('change', ()=>{
    if(!customInput.value) return;
    setTarget(customInput.value);
    render();
    showToast('🎯 الهدف بقى ' + TOTAL);
  });
}, 'اختيار الهدف');

/* ---------------- وضع تسبيح بعد الصلاة: تتابع 33 / 33 / 34 ---------------- */
const SEQUENCE_STEPS = [
  { text:'سُبْحَانَ اللَّهِ', target:33 },
  { text:'الْحَمْدُ لِلَّهِ', target:33 },
  { text:'اللَّهُ أَكْبَرُ', target:34 }
];
let sequenceMode = false;
let sequenceIdx = 0;

function updateSequenceStatus(){
  const el = $('sequenceStatus');
  if(!sequenceMode){ el.classList.add('hidden'); return; }
  el.classList.remove('hidden');
  el.textContent = `🔁 الخطوة ${sequenceIdx+1} من ${SEQUENCE_STEPS.length} — بعدها: ${SEQUENCE_STEPS[sequenceIdx+1] ? SEQUENCE_STEPS[sequenceIdx+1].text : 'انتهى التسبيح 🤍'}`;
}
function enterSequenceStep(idx){
  sequenceIdx = idx;
  const step = SEQUENCE_STEPS[idx];
  TOTAL = step.target;
  count = 0; history = [];
  $('dhikrDisplayModern').textContent = step.text;
  $('dhikrDisplayHand').textContent = step.text;
  renderCount();
  updateSequenceStatus();
}
safe(()=>{
  const btn = $('sequenceModeBtn');
  btn.addEventListener('click', ()=>{
    playClick();
    sequenceMode = !sequenceMode;
    btn.classList.toggle('active', sequenceMode);
    $('dhikrSelect').disabled = sequenceMode;
    if(sequenceMode){
      enterSequenceStep(0);
      showToast('🔁 اتفعّل وضع التسبيح بعد الصلاة');
    }else{
      updateSequenceStatus();
      showToast('تم الخروج من وضع التتابع');
    }
  });
}, 'وضع التتابع');

/* ---------------- إحصائية اليوم + المتتالية ---------------- */
function todayKey(){ return new Date().toISOString().slice(0,10); }
function bumpDailyStats(amount){
  safe(()=>{
    const STATS_KEY = 'tasbihDailyStats';
    let stats = {};
    try{ stats = JSON.parse(localStorage.getItem(STATS_KEY) || '{}'); }catch(e){}
    const key = todayKey();
    stats[key] = (stats[key] || 0) + amount;
    localStorage.setItem(STATS_KEY, JSON.stringify(stats));
    renderStats(stats);
  }, 'تحديث إحصائية اليوم');
}
function renderStats(stats){
  safe(()=>{
    if(!stats){ try{ stats = JSON.parse(localStorage.getItem('tasbihDailyStats') || '{}'); }catch(e){ stats = {}; } }
    const key = todayKey();
    $('todayCount').textContent = stats[key] || 0;
    // احسب المتتالية: كام يوم متتالي فيهم تسبيح، رجوعًا من النهارده
    let streak = 0;
    let d = new Date();
    while(true){
      const k = d.toISOString().slice(0,10);
      if(stats[k] && stats[k] > 0){ streak++; d.setDate(d.getDate() - 1); }
      else break;
    }
    $('streakCount').textContent = streak;
  }, 'عرض إحصائية اليوم');
}
renderStats();

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
  history.push(count);
  if(history.length > 50) history.shift();
  count = (count + 1) % (TOTAL + 1);
  bumpDailyStats(1);
  if(count === 0){
    totalAllTime += TOTAL;
    localStorage.setItem('tasbihTotalAllTime', totalAllTime);
    safe(()=> $('totalCount').textContent = totalAllTime, 'تحديث الإجمالي');
    if(sequenceMode){
      vibrate([20,40,20]);
      if(sequenceIdx + 1 < SEQUENCE_STEPS.length){
        showToast('✅ خلصت "' + SEQUENCE_STEPS[sequenceIdx].text + '" — يلا للي بعده');
        setTimeout(()=> enterSequenceStep(sequenceIdx + 1), 900);
        return;
      }else{
        showToast('🤍 تمّ التسبيح بعد الصلاة كامل، تقبّل الله منك');
        sequenceMode = false;
        $('sequenceModeBtn').classList.remove('active');
        $('dhikrSelect').disabled = false;
        updateSequenceStatus();
      }
    }else{
      showToast('✅ أتممت دورة كاملة (' + TOTAL + ') - بارك الله فيك');
    }
  }
  renderCount();
}

function undoLast(){
  if(!history.length) return;
  count = history.pop();
  renderCount();
  playClick();
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
  $('resetBtn').addEventListener('click', (e)=>{ e.stopPropagation(); playClick(); count = 0; history = []; renderCount(); });
}, 'زرار تصفير الحديثة');
safe(()=>{
  $('resetHandBtn').addEventListener('click', (e)=>{ e.stopPropagation(); playClick(); count = 0; history = []; renderCount(); });
}, 'زرار تصفير اليد');
safe(()=>{
  $('undoBtn').addEventListener('click', (e)=>{ e.stopPropagation(); undoLast(); });
}, 'زرار تراجع الحديثة');
safe(()=>{
  $('undoHandBtn').addEventListener('click', (e)=>{ e.stopPropagation(); undoLast(); });
}, 'زرار تراجع اليد');

/* ---------------- رسالة تأكيد لو حاول يخرج ولسه في عدّ شغال ما اتصفرش ---------------- */
window.addEventListener('beforeunload', (e)=>{
  if(count > 0){
    e.preventDefault();
    e.returnValue = 'لسه في عدّ تسبيح شغال ومتصفرش، عايز فعلاً تخرج؟';
    return e.returnValue;
  }
});

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
