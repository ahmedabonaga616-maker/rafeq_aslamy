/* ===================================================================
   الموقع الإسلامي الشامل - script.js - نسخة مُصلحة (كل خاصية معزولة)
   جميع الحقوق محفوظة لصاحب الموقع أحمد
=================================================================== */

/* أداة مساعدة: تشغّل أي كود بأمان، ولو فيه خطأ يطبعه في الكونسول بس ومايوقفش الباقي */
function safe(fn, label){
  try{ fn(); }catch(e){ console.error('خطأ في: ' + label, e); };
}
function $(id){ return document.getElementById(id); }

/* ---------------- عناصر عامة ---------------- */
const body = document.body;
const toastBox = $('toastBox');
function showToast(msg, duration=4000){
  if(!toastBox) return;
  toastBox.textContent = msg;
  toastBox.classList.add('show');
  clearTimeout(showToast._t);
  showToast._t = setTimeout(()=> toastBox.classList.remove('show'), duration);
}

/* ---------------- صوت الكليك ---------------- */
const audioClick = $('audioClick');
function playClick(){
  if(window.siteSettings && !window.siteSettings.soundEnabled()) return;
  try{ audioClick.currentTime = 0; audioClick.play().catch(()=>{}); }catch(e){}
}
function vibrate(ms){ try{ if(navigator.vibrate) navigator.vibrate(ms); }catch(e){} }
document.addEventListener('click', (e)=>{ if(e.target.closest('button, .nav-card, a')) playClick(); });

/* ---------------- تأثير الموجة (Ripple) عند الضغط على أي زرار/كارت ---------------- */
document.addEventListener('click', (e)=>{
  const el = e.target.closest('.btn, .icon-btn, .nav-card, .progress-step');
  if(!el) return;
  try{
    const rect = el.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const span = document.createElement('span');
    span.className = 'ripple';
    span.style.width = span.style.height = size + 'px';
    span.style.left = (e.clientX - rect.left - size/2) + 'px';
    span.style.top = (e.clientY - rect.top - size/2) + 'px';
    const prevPos = getComputedStyle(el).position;
    if(prevPos === 'static') el.style.position = 'relative';
    if(getComputedStyle(el).overflow === 'visible') el.style.overflow = 'hidden';
    el.appendChild(span);
    setTimeout(()=> span.remove(), 600);
  }catch(err){}
});

/* ---------------- فتح تشغيل الصوت أول ما المستخدم يلمس/يدوس أي حاجة ----------------
   المتصفحات (خصوصًا الموبايل) بتمنع تشغيل صوت من setInterval لوحده من غير تفاعل
   مباشر من المستخدم. الحل: أول ما يحصل أي لمسة/دوسة في الصفحة، نشغّل كل الأصوات
   لحظة واحدة (صامتة عمليًا لأنها بتتوقف فورًا) عشان "نفتحها" للمتصفح، وبعدها أي
   تشغيل تلقائي (زي تذكير الصلاة على النبي ﷺ) هيشتغل عادي. */
let audioUnlocked = false;
function unlockAllAudio(){
  if(audioUnlocked) return;
  audioUnlocked = true;
  ['audioMohamed','audioAdhan','audioNearFajr','audioNearDhuhr','audioNearAsr','audioNearMaghrib','audioNearIsha'].forEach(id=>{
    const el = $(id);
    if(!el) return;
    try{
      el.muted = true;
      const p = el.play();
      if(p && p.then){
        p.then(()=>{ el.pause(); el.currentTime = 0; el.muted = false; }).catch(()=>{ el.muted = false; });
      } else { el.pause(); el.currentTime = 0; el.muted = false; }
    }catch(e){}
  });
}
['click','touchstart'].forEach(ev=> document.addEventListener(ev, unlockAllAudio, { once:true }));

/* ---------------- رسالة ترحيب أول زيارة ---------------- */
safe(()=>{
  const modal = $('welcomeModal');
  if(!modal) return;
  if(localStorage.getItem('welcome-msg-seen') !== '1'){
    modal.classList.add('show');
  }
  function closeWelcome(){
    modal.classList.remove('show');
    localStorage.setItem('welcome-msg-seen', '1');
  }
  $('welcomeCloseBtn')?.addEventListener('click', closeWelcome);
  $('welcomeCloseX')?.addEventListener('click', closeWelcome);
  modal.addEventListener('click', (e)=>{ if(e.target === modal) closeWelcome(); });
  $('welcomeShareBtn')?.addEventListener('click', ()=>{
    const msg = encodeURIComponent('موقع إسلامي شامل جميل جدًا، جربه: ' + location.href);
    if(navigator.share){ navigator.share({title:'الموقع الإسلامي الشامل', url: location.href}); }
    else { window.open('https://wa.me/?text=' + msg, '_blank'); }
  });
}, 'رسالة الترحيب');

/* ---------------- الوضع الليلي/النهاري ---------------- */
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
}, 'زرار الوضع الليلي');

/* ---------------- التاريخ والوقت ---------------- */
let currentHijriMonth = null, currentHijriDay = null;
safe(()=>{
  const gregorianDateEl = $('gregorianDate');
  const hijriDateEl = $('hijriDate');
  const dayNameEl = $('dayName');
  const clockNowEl = $('clockNow');

  function updateDateTime(){
    const now = new Date();
    gregorianDateEl.textContent = now.toLocaleDateString('ar-EG', { year:'numeric', month:'long', day:'numeric' });
    try{
      const parts = new Intl.DateTimeFormat('en-u-ca-islamic-umalqura', { year:'numeric', month:'numeric', day:'numeric' }).formatToParts(now);
      const obj = {}; parts.forEach(p=> obj[p.type] = p.value);
      currentHijriMonth = parseInt(obj.month); currentHijriDay = parseInt(obj.day);
      hijriDateEl.textContent = new Intl.DateTimeFormat('ar-SA-u-ca-islamic-umalqura', { year:'numeric', month:'long', day:'numeric' }).format(now) + ' هـ';
    }catch(e){ hijriDateEl.textContent = ''; }
    dayNameEl.textContent = now.toLocaleDateString('ar-EG', { weekday:'long' });
    clockNowEl.textContent = now.toLocaleTimeString('ar-EG', { hour12:true });

    const fridayBanner = $('fridayBanner');
    if(fridayBanner){ fridayBanner.classList.toggle('show', now.getDay() === 5); }
    safe(updateEidRamadanBanners, 'بانرات العيد ورمضان');
  }
  updateDateTime();
  setInterval(updateDateTime, 1000);

  let lastDay = new Date().getDate();
  setInterval(()=>{
    const d = new Date().getDate();
    if(d !== lastDay){ lastDay = d; updateDateTime(); safe(()=>{ if(typeof fetchWeekly==='function' && currentCoords) fetchWeekly(); }, 'تحديث الأسبوع'); }
  }, 30000);
}, 'التاريخ والوقت');

function updateEidRamadanBanners(){
  const eidBanner = $('eidBanner');
  const ramadanBanner = $('ramadanBanner');
  if(!eidBanner || !ramadanBanner) return;
  if(currentHijriMonth === 9){ ramadanBanner.classList.add('show'); body.classList.add('ramadan-theme'); }
  else { ramadanBanner.classList.remove('show'); body.classList.remove('ramadan-theme'); }
  const isEidFitr = currentHijriMonth === 10 && currentHijriDay <= 3;
  const isEidAdha = currentHijriMonth === 12 && currentHijriDay >= 10 && currentHijriDay <= 13;
  eidBanner.classList.toggle('show', isEidFitr || isEidAdha);
}

/* ---------------- الآيات والأحاديث ---------------- */
safe(()=>{
  const verseText = $('verseText');
  const verseSource = $('verseSource');
  const versesData = [
    {text:"وَمَن يَتَّقِ اللَّهَ يَجْعَل لَّهُ مَخْرَجًا * وَيَرْزُقْهُ مِنْ حَيْثُ لَا يَحْتَسِبُ", source:"سورة الطلاق: 2-3"},
    {text:"إِنَّ مَعَ الْعُسْرِ يُسْرًا", source:"سورة الشرح: 6"},
    {text:"وَبَشِّرِ الصَّابِرِينَ", source:"سورة البقرة: 155"},
    {text:"فَاذْكُرُونِي أَذْكُرْكُمْ وَاشْكُرُوا لِي وَلَا تَكْفُرُونِ", source:"سورة البقرة: 152"},
    {text:"وَقُل رَّبِّ زِدْنِي عِلْمًا", source:"سورة طه: 114"},
    {text:"إِنَّ اللَّهَ مَعَ الصَّابِرِينَ", source:"سورة البقرة: 153"},
    {text:"مَنْ صَلَّى عَلَيَّ صَلَاةً صَلَّى اللَّهُ عَلَيْهِ بِهَا عَشْرًا", source:"رواه مسلم"},
    {text:"الطُّهُورُ شَطْرُ الْإِيمَانِ", source:"رواه مسلم"},
    {text:"خَيْرُكُمْ مَنْ تَعَلَّمَ الْقُرْآنَ وَعَلَّمَهُ", source:"رواه البخاري"},
    {text:"مَن سَلَكَ طَرِيقًا يَلْتَمِسُ فِيهِ عِلْمًا سَهَّلَ اللَّهُ لَهُ بِهِ طَرِيقًا إِلَى الْجَنَّةِ", source:"رواه مسلم"},
    {text:"تَبَسُّمُكَ فِي وَجْهِ أَخِيكَ صَدَقَةٌ", source:"رواه الترمذي"},
    {text:"رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الْآخِرَةِ حَسَنَةً وَقِنَا عَذَابَ النَّارِ", source:"سورة البقرة: 201"}
  ];
  let verseIndex = 0;
  function rotateVerse(){
    verseText.classList.add('fade');
    setTimeout(()=>{
      verseIndex = (verseIndex + 1) % versesData.length;
      verseText.textContent = versesData[verseIndex].text;
      verseSource.textContent = versesData[verseIndex].source;
      verseText.classList.remove('fade');
    }, 400);
  }
  verseText.textContent = versesData[0].text;
  verseSource.textContent = versesData[0].source;
  setInterval(rotateVerse, 12000);

  $('copyVerseBtn').addEventListener('click', ()=>{
    navigator.clipboard.writeText(verseText.textContent + ' - ' + verseSource.textContent);
    showToast('تم نسخ النص ✅');
  });
  $('shareVerseBtn').addEventListener('click', ()=>{
    const msg = encodeURIComponent(verseText.textContent + '\n' + verseSource.textContent);
    window.open('https://wa.me/?text=' + msg, '_blank');
  });
  $('listenVerseBtn').addEventListener('click', ()=>{
    if('speechSynthesis' in window){
      const u = new SpeechSynthesisUtterance(verseText.textContent);
      u.lang = 'ar-SA'; speechSynthesis.cancel(); speechSynthesis.speak(u);
    } else { showToast('المتصفح لا يدعم خاصية الاستماع'); }
  });
  $('shareSiteBtn').addEventListener('click', ()=>{
    const msg = encodeURIComponent('موقع إسلامي شامل جميل جدًا، جربه: ' + location.href);
    if(navigator.share){ navigator.share({title:'الموقع الإسلامي الشامل', url: location.href}); }
    else { window.open('https://wa.me/?text=' + msg, '_blank'); }
  });
}, 'الآيات المتغيرة');

/* ================= مواقيت الصلاة ================= */
const PRAYER_NAMES_AR = { Fajr:'الفجر', Sunrise:'الشروق', Dhuhr:'الظهر', Asr:'العصر', Maghrib:'المغرب', Isha:'العشاء' };
let currentTimings = null;
let currentCoords = null;
let dndOn = false;

function getUserTimezone(){ try{ return Intl.DateTimeFormat().resolvedOptions().timeZone; }catch(e){ return 'auto'; } }
function timeStrToDate(str){
  const clean = str.split(' ')[0];
  const [h,m] = clean.split(':').map(Number);
  const d = new Date(); d.setHours(h, m, 0, 0);
  return d;
}
function to12h(str){
  const clean = str.split(' ')[0];
  let [h,m] = clean.split(':').map(Number);
  const period = h >= 12 ? 'م' : 'ص';
  h = h % 12; if(h === 0) h = 12;
  return `${h}:${String(m).padStart(2,'0')} ${period}`;
}

async function fetchTimingsByCoords(lat, lon, label){
  try{
    const tz = getUserTimezone();
    const res = await fetch(`https://api.aladhan.com/v1/timings?latitude=${lat}&longitude=${lon}&method=5&timezonestring=${encodeURIComponent(tz)}`);
    const data = await res.json();
    if(data.code === 200){
      currentTimings = data.data.timings;
      currentCoords = {lat, lon};
      localStorage.setItem('lastTimings', JSON.stringify(currentTimings));
      localStorage.setItem('lastLocationLabel', label || 'موقعك الحالي');
      localStorage.setItem('lastCoords', JSON.stringify(currentCoords));
      $('currentLocationLabel').textContent = '📍 ' + (label || 'موقعك الحالي');
      renderTimes();
      safe(fetchWeekly, 'جدول الأسبوع');
    }
  }catch(e){
    const cached = localStorage.getItem('lastTimings');
    if(cached){ currentTimings = JSON.parse(cached); renderTimes(); showToast('تعذر الاتصال، تم عرض آخر مواقيت محفوظة'); }
    else { showToast('تعذر جلب المواقيت، تأكد من الاتصال بالإنترنت'); }
  }
}
async function fetchTimingsByCity(city){
  try{
    const tz = getUserTimezone();
    const res = await fetch(`https://api.aladhan.com/v1/timingsByCity?city=${encodeURIComponent(city)}&country=&method=5&timezonestring=${encodeURIComponent(tz)}`);
    const data = await res.json();
    if(data.code === 200){
      currentTimings = data.data.timings;
      currentCoords = { lat: data.data.meta.latitude, lon: data.data.meta.longitude };
      localStorage.setItem('lastTimings', JSON.stringify(currentTimings));
      localStorage.setItem('lastLocationLabel', city);
      localStorage.setItem('lastCoords', JSON.stringify(currentCoords));
      $('currentLocationLabel').textContent = '📍 ' + city;
      renderTimes();
      safe(fetchWeekly, 'جدول الأسبوع');
    } else { showToast('لم يتم العثور على هذه المدينة'); }
  }catch(e){ showToast('تعذر جلب المواقيت، تأكد من الاتصال بالإنترنت'); }
}
function renderTimes(){
  if(!currentTimings) return;
  safe(()=>{
    $('t-fajr').textContent = to12h(currentTimings.Fajr);
    $('t-sunrise').textContent = to12h(currentTimings.Sunrise);
    $('t-dhuhr').textContent = to12h(currentTimings.Dhuhr);
    $('t-asr').textContent = to12h(currentTimings.Asr);
    $('t-maghrib').textContent = to12h(currentTimings.Maghrib);
    $('t-isha').textContent = to12h(currentTimings.Isha);
  }, 'عرض الأوقات');
  safe(updateCountdown, 'العداد التنازلي');
}

/* ---------------- نسخ مواقيت اليوم كاملة ---------------- */
safe(()=>{
  $('copyTimesBtn')?.addEventListener('click', ()=>{
    if(!currentTimings){ showToast('لسه مافيش مواقيت متحمّلة'); return; }
    const label = $('currentLocationLabel')?.textContent?.replace('📍 ', '') || '';
    const text = `🕌 مواقيت الصلاة${label ? ' - ' + label : ''}\n` +
      `الفجر: ${to12h(currentTimings.Fajr)}\n` +
      `الشروق: ${to12h(currentTimings.Sunrise)}\n` +
      `الظهر: ${to12h(currentTimings.Dhuhr)}\n` +
      `العصر: ${to12h(currentTimings.Asr)}\n` +
      `المغرب: ${to12h(currentTimings.Maghrib)}\n` +
      `العشاء: ${to12h(currentTimings.Isha)}`;
    if(navigator.clipboard && navigator.clipboard.writeText){
      navigator.clipboard.writeText(text).then(()=> showToast('✅ تم نسخ مواقيت اليوم')).catch(()=>{});
    }
  });
}, 'نسخ مواقيت اليوم');

safe(()=>{
  $('gpsBtn').addEventListener('click', ()=>{
    if(!navigator.geolocation){ showToast('المتصفح لا يدعم تحديد الموقع'); return; }
    $('currentLocationLabel').textContent = '📍 جاري تحديد موقعك...';
    navigator.geolocation.getCurrentPosition(async (pos)=>{
      const {latitude, longitude} = pos.coords;
      let label = 'موقعك الحالي';
      try{
        const geo = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&accept-language=ar`);
        const geoData = await geo.json();
        label = geoData.address.city || geoData.address.town || geoData.address.state || 'موقعك الحالي';
      }catch(e){}
      fetchTimingsByCoords(latitude, longitude, label);
    }, ()=>{ showToast('لم يتم السماح بتحديد الموقع'); $('currentLocationLabel').textContent = '📌 لم يتم تحديد الموقع بعد'; });
  });
  $('citySearchBtn').addEventListener('click', ()=>{
    const city = $('cityInput').value.trim();
    if(city) fetchTimingsByCity(city);
  });
}, 'أزرار الموقع');

safe(()=>{
  const savedCitiesRow = $('savedCitiesRow');
  function loadSavedCities(){
    const cities = JSON.parse(localStorage.getItem('savedCities') || '[]');
    savedCitiesRow.innerHTML = '';
    cities.forEach(city=>{
      const chip = document.createElement('div');
      chip.className = 'saved-city-chip';
      chip.innerHTML = `<span>${city}</span>`;
      const goBtn = document.createElement('button');
      goBtn.textContent = '↩'; goBtn.style.color = 'var(--gold)';
      goBtn.addEventListener('click', ()=> fetchTimingsByCity(city));
      const delBtn = document.createElement('button');
      delBtn.textContent = '×';
      delBtn.addEventListener('click', ()=>{
        localStorage.setItem('savedCities', JSON.stringify(cities.filter(c=>c!==city)));
        loadSavedCities();
      });
      chip.appendChild(goBtn); chip.appendChild(delBtn);
      savedCitiesRow.appendChild(chip);
    });
  }
  $('saveCityBtn').addEventListener('click', ()=>{
    const city = $('cityInput').value.trim();
    if(!city){ showToast('اكتب اسم مدينة أولاً'); return; }
    const cities = JSON.parse(localStorage.getItem('savedCities') || '[]');
    if(!cities.includes(city)){ cities.push(city); localStorage.setItem('savedCities', JSON.stringify(cities)); loadSavedCities(); showToast('تم حفظ المدينة ✅'); }
  });
  loadSavedCities();
}, 'المدن المحفوظة');

safe(()=>{
  const cached = localStorage.getItem('lastTimings');
  const label = localStorage.getItem('lastLocationLabel');
  const coords = localStorage.getItem('lastCoords');
  if(cached){
    currentTimings = JSON.parse(cached);
    if(coords) currentCoords = JSON.parse(coords);
    $('currentLocationLabel').textContent = '📍 ' + (label || 'آخر موقع محفوظ');
    renderTimes();
  }
}, 'تحميل آخر مواقيت محفوظة');

function updateCountdown(){
  if(!currentTimings) return;
  const order = ['Fajr','Dhuhr','Asr','Maghrib','Isha'];
  const now = new Date();
  let next = null, nextKey = null;
  for(const key of order){
    const t = timeStrToDate(currentTimings[key]);
    if(t > now){ next = t; nextKey = key; break; }
  }
  if(!next){ next = timeStrToDate(currentTimings['Fajr']); next.setDate(next.getDate()+1); nextKey = 'Fajr'; }

  const diffSec = Math.floor((next - now)/1000);
  const hh = String(Math.floor(diffSec/3600)).padStart(2,'0');
  const mm = String(Math.floor((diffSec%3600)/60)).padStart(2,'0');
  const ss = String(diffSec%60).padStart(2,'0');

  $('nextPrayerName').textContent = PRAYER_NAMES_AR[nextKey];
  $('countdownDisplay').textContent = `${hh}:${mm}:${ss}`;
  document.title = `⏳ ${PRAYER_NAMES_AR[nextKey]} بعد ${hh}:${mm}:${ss}`;

  document.querySelectorAll('.time-cell').forEach(c=>c.classList.remove('active'));
  const idMap = {Fajr:'t-fajr', Dhuhr:'t-dhuhr', Asr:'t-asr', Maghrib:'t-maghrib', Isha:'t-isha'};
  const cell = $(idMap[nextKey]);
  if(cell) cell.closest('.time-cell').classList.add('active');

  if(diffSec === 900 && !dndOn){
    showToast(`⏰ اقتربت صلاة ${PRAYER_NAMES_AR[nextKey]} (بعد 15 دقيقة)`);
    notifyUser('اقتربت الصلاة', `اقتربت صلاة ${PRAYER_NAMES_AR[nextKey]}`);

    const nearAudioMap = {
      Fajr: 'audioNearFajr',
      Dhuhr: 'audioNearDhuhr',
      Asr: 'audioNearAsr',
      Maghrib: 'audioNearMaghrib',
      Isha: 'audioNearIsha'
    };
    const audioId = nearAudioMap[nextKey];
    if(audioId){
      try{ $(audioId).currentTime = 0; $(audioId).play().catch(()=>{}); }catch(e){}
    }
  }
  if(diffSec === 0){
    const audioAdhan = $('audioAdhan');
    try{ audioAdhan.currentTime = 0; audioAdhan.play().catch(()=>{}); }catch(e){}
    showToast(`🕌 حان الآن موعد صلاة ${PRAYER_NAMES_AR[nextKey]}`, 8000);
    notifyUser('حان وقت الصلاة', `حان الآن موعد صلاة ${PRAYER_NAMES_AR[nextKey]}`);
  }
}
setInterval(()=>{ if(currentTimings) safe(updateCountdown, 'تحديث العداد'); }, 1000);

/* ---------------- الإشعارات المركزية ---------------- */
function requestNotifPermission(){
  if('Notification' in window && Notification.permission === 'default'){ Notification.requestPermission(); }
}
safe(requestNotifPermission, 'طلب إذن الإشعارات');

function notifyUser(title, bodyText){
  if(dndOn) return;
  safe(()=>{
    if('Notification' in window && Notification.permission === 'granted'){
      if(navigator.serviceWorker && navigator.serviceWorker.controller){
        navigator.serviceWorker.ready.then(reg=> reg.showNotification(title, {body: bodyText}));
      } else { new Notification(title, { body: bodyText }); }
    }
  }, 'إرسال إشعار');
}



setInterval(()=>{
  if(dndOn) return;
  safe(()=>{
    const audioMohamed = $('audioMohamed');
    audioMohamed.currentTime = 0; audioMohamed.play().catch(()=>{});
    showToast('صلِّ على محمد ﷺ');
    notifyUser('تذكير', 'صلِّ على محمد ﷺ');
  }, 'تنبيه صلِّ على محمد');
}, 15 * 60 * 1000);

let duhaAlerted = false;
setInterval(()=>{
  if(!currentTimings || dndOn || duhaAlerted) return;
  safe(()=>{
    const sunrise = timeStrToDate(currentTimings.Sunrise);
    const duhaTime = new Date(sunrise.getTime() + 20*60000);
    const now = new Date();
    if(now >= duhaTime && now - duhaTime < 60000){
      duhaAlerted = true;
      showToast('☀️ حان وقت صلاة الضحى، اغتنمها');
      notifyUser('صلاة الضحى', 'حان وقت صلاة الضحى، اغتنمها');
    }
  }, 'تذكير الضحى');
}, 30000);

/* ---------------- إشعارات أذكار الصباح والمساء ---------------- */
function azkarNotifKey(period){ return 'azkarNotif-' + period + '-' + new Date().toISOString().slice(0,10); }
setInterval(()=>{
  if(dndOn) return;
  safe(()=>{
    const now = new Date();
    const h = now.getHours();
    // أذكار الصباح: بين 6 و 9 صباحًا (أو بعد الشروق لو متاح)
    if(h >= 6 && h < 9 && !localStorage.getItem(azkarNotifKey('sabah'))){
      localStorage.setItem(azkarNotifKey('sabah'), '1');
      notifyUser('أذكار الصباح', 'حان وقت أذكار الصباح، لا تنساها 🌅');
      showToast('🌅 حان وقت أذكار الصباح');
    }
    // أذكار المساء: بين 4 و 7 مساءً
    if(h >= 16 && h < 19 && !localStorage.getItem(azkarNotifKey('masaa'))){
      localStorage.setItem(azkarNotifKey('masaa'), '1');
      notifyUser('أذكار المساء', 'حان وقت أذكار المساء، لا تنساها 🌇');
      showToast('🌇 حان وقت أذكار المساء');
    }
  }, 'إشعارات الأذكار');
}, 60000);

/* ---------------- شريط تقدم الصلوات اليومي (مُصلح) ---------------- */
safe(()=>{
  const progressBar = $('progressBar');
  if(!progressBar) throw new Error('progressBar غير موجود');
  function todayKey(){ return 'prayerProgress-' + new Date().toISOString().slice(0,10); }
  function loadProgress(){
    const saved = JSON.parse(localStorage.getItem(todayKey()) || '{}');
    progressBar.querySelectorAll('.progress-step').forEach(btn=>{
      btn.classList.toggle('done', !!saved[btn.dataset.prayer]);
    });
  }
  progressBar.addEventListener('click', (e)=>{
    const btn = e.target.closest('.progress-step');
    if(!btn) return;
    btn.classList.toggle('done');
    const saved = JSON.parse(localStorage.getItem(todayKey()) || '{}');
    const nowDone = btn.classList.contains('done');
    saved[btn.dataset.prayer] = nowDone;
    localStorage.setItem(todayKey(), JSON.stringify(saved));

    let totalPrayers = parseInt(localStorage.getItem('prayersCompletedTotal') || '0', 10);
    totalPrayers = nowDone ? totalPrayers + 1 : Math.max(0, totalPrayers - 1);
    localStorage.setItem('prayersCompletedTotal', totalPrayers);
    const statPrayers = $('statPrayers');
    if(statPrayers) statPrayers.textContent = totalPrayers;
  });
}, 'شريط تقدم الصلوات');

/* ---------------- جدول الأسبوع ---------------- */
safe(()=>{
  const weeklyToggleBtn = $('weeklyToggleBtn');
  const weeklyTableWrap = $('weeklyTableWrap');
  weeklyToggleBtn.addEventListener('click', ()=>{
    weeklyTableWrap.classList.toggle('open');
    if(weeklyTableWrap.classList.contains('open') && !weeklyTableWrap.dataset.loaded){ fetchWeekly(); }
  });
}, 'زرار جدول الأسبوع');

async function fetchWeekly(){
  if(!currentCoords) return;
  const tbody = $('weeklyTableBody');
  if(!tbody) return;
  tbody.innerHTML = '<tr><td colspan="6">جاري التحميل...</td></tr>';
  try{
    const tz = getUserTimezone();
    const now = new Date();
    const rows = [];
    for(let i=0;i<7;i++){
      const d = new Date(now); d.setDate(now.getDate()+i);
      const dateStr = `${String(d.getDate()).padStart(2,'0')}-${String(d.getMonth()+1).padStart(2,'0')}-${d.getFullYear()}`;
      const res = await fetch(`https://api.aladhan.com/v1/timings/${dateStr}?latitude=${currentCoords.lat}&longitude=${currentCoords.lon}&method=5&timezonestring=${encodeURIComponent(tz)}`);
      const data = await res.json();
      if(data.code === 200){
        const t = data.data.timings;
        rows.push({day: d.toLocaleDateString('ar-EG', {weekday:'short', day:'numeric', month:'short'}),
          t: { Fajr: to12h(t.Fajr), Dhuhr: to12h(t.Dhuhr), Asr: to12h(t.Asr), Maghrib: to12h(t.Maghrib), Isha: to12h(t.Isha) }});
      }
    }
    tbody.innerHTML = rows.map(r => `<tr><td>${r.day}</td><td>${r.t.Fajr}</td><td>${r.t.Dhuhr}</td><td>${r.t.Asr}</td><td>${r.t.Maghrib}</td><td>${r.t.Isha}</td></tr>`).join('');
    weeklyTableWrap.dataset.loaded = '1';
  }catch(e){ tbody.innerHTML = '<tr><td colspan="6">تعذر تحميل جدول الأسبوع</td></tr>'; }
}

/* ---------------- تتبع الصيام (مُصلح) ---------------- */
safe(()=>{
  const markBtn = $('markFastingBtn');
  const fastingCountEl = $('fastingCount');
  if(!markBtn) throw new Error('markFastingBtn غير موجود');
  function fastingKey(){ return 'fastingDays'; }
  function loadFastingCount(){
    const days = JSON.parse(localStorage.getItem(fastingKey()) || '[]');
    fastingCountEl.textContent = days.length;
    const statFasting = $('statFasting');
    if(statFasting) statFasting.textContent = days.length;
  }
  markBtn.addEventListener('click', ()=>{
    const todayStr = new Date().toISOString().slice(0,10);
    const days = JSON.parse(localStorage.getItem(fastingKey()) || '[]');
    if(days.includes(todayStr)){ showToast('مسجّل بالفعل إن اليوم ده صيام ✅'); return; }
    days.push(todayStr);
    localStorage.setItem(fastingKey(), JSON.stringify(days));
    loadFastingCount();
    showToast('تقبل الله صيامك 🤍');
  });
  loadFastingCount();
}, 'تتبع الصيام');

/* ---------------- إحصائيات شخصية (مُصلح) + نسخ احتياطي ---------------- */
safe(()=>{
  function loadStats(){
    const statTasbih = $('statTasbih');
    const statVisits = $('statVisits');
    const statFasting = $('statFasting');
    if(statTasbih) statTasbih.textContent = localStorage.getItem('tasbihTotalAllTime') || 0;
    if(statVisits) statVisits.textContent = parseInt(localStorage.getItem('siteVisits') || '0', 10);
    if(statFasting) statFasting.textContent = JSON.parse(localStorage.getItem('fastingDays') || '[]').length;
  }
  loadStats();
  window._loadStats = loadStats;

  const exportBtn = $('exportStatsBtn');
  const importBtn = $('importStatsBtn');
  const importFile = $('importStatsFile');

  if(exportBtn){
    exportBtn.addEventListener('click', ()=>{
      const backup = {
        tasbihTotalAllTime: localStorage.getItem('tasbihTotalAllTime'),
        fastingDays: localStorage.getItem('fastingDays'),
        myDuas: localStorage.getItem('myDuas'),
        siteVisits: localStorage.getItem('siteVisits'),
        savedCities: localStorage.getItem('savedCities')
      };
      const blob = new Blob([JSON.stringify(backup, null, 2)], {type:'application/json'});
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = 'نسخة-احتياطية-الموقع-الاسلامي.json';
      a.click();
      URL.revokeObjectURL(url);
      showToast('تم تحميل النسخة الاحتياطية ✅');
    });
  }
  if(importBtn && importFile){
    importBtn.addEventListener('click', ()=> importFile.click());
    importFile.addEventListener('change', (e)=>{
      const file = e.target.files[0];
      if(!file) return;
      const reader = new FileReader();
      reader.onload = (ev)=>{
        try{
          const data = JSON.parse(ev.target.result);
          Object.keys(data).forEach(key=>{ if(data[key] !== null && data[key] !== undefined) localStorage.setItem(key, data[key]); });
          loadStats();
          showToast('تم استرجاع البيانات بنجاح ✅');
        }catch(err){ showToast('❌ الملف غير صالح'); }
      };
      reader.readAsText(file);
    });
  }
}, 'الإحصائيات والنسخ الاحتياطي');

/* ---------------- PWA ---------------- */
safe(()=>{
  if('serviceWorker' in navigator){
    window.addEventListener('load', ()=>{ navigator.serviceWorker.register('sw.js').catch(()=>{}); });
  }
}, 'PWA');

/* ---------------- Analytics بسيط ---------------- */
safe(()=>{
  const key = 'siteVisits';
  const count = parseInt(localStorage.getItem(key) || '0', 10) + 1;
  localStorage.setItem(key, count);
  if(window._loadStats) window._loadStats();
  const params = new URLSearchParams(location.search);
  if(params.get('admin') === '1'){ showToast('عدد زياراتك المسجلة: ' + count, 6000); }
}, 'تتبع الزيارات');
