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
// التنقل بين التبويبات
const tabG2H = document.getElementById('tabG2H');
const tabH2G = document.getElementById('tabH2G');
const g2hSec = document.getElementById('g2hSection');
const h2gSec = document.getElementById('h2gSection');

if (tabG2H && tabH2G) {
  tabG2H.addEventListener('click', () => {
    tabG2H.classList.add('active');
    tabH2G.classList.remove('active');
    g2hSec.style.display = 'flex';
    h2gSec.style.display = 'none';
  });

  tabH2G.addEventListener('click', () => {
    tabH2G.classList.add('active');
    tabG2H.classList.remove('active');
    h2gSec.style.display = 'flex';
    g2hSec.style.display = 'none';
  });
}

// عرض تاريخ اليوم بـ JavaScript تلقائياً
function showTodayDate() {
  const now = new Date();
  
  const hijriFormatter = new Intl.DateTimeFormat('ar-SA-u-ca-islamic-uma', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    weekday: 'long'
  });
  
  const gregFormatter = new Intl.DateTimeFormat('ar-EG', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  const hElem = document.getElementById('todayHijri');
  const gElem = document.getElementById('todayGreg');

  if (hElem) hElem.innerText = hijriFormatter.format(now);
  if (gElem) gElem.innerText = gregFormatter.format(now);
}
showTodayDate();

// تحويل من ميلادي للهجري
document.getElementById('convertG2HBtn')?.addEventListener('click', () => {
  const val = document.getElementById('gregInput').value;
  if (!val) { alert('الرجاء اختيار تاريخ ميلادي أولاً'); return; }
  
  const dateObj = new Date(val);
  const formatter = new Intl.DateTimeFormat('ar-SA-u-ca-islamic-uma', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    weekday: 'long'
  });

  const resBox = document.getElementById('g2hResult');
  resBox.style.display = 'block';
  resBox.innerText = `التاريخ الهجري: ${formatter.format(dateObj)}`;
});

// تحويل من هجري للميلادي
function hijriToGregorian(d, m, y) {
  let jd = Math.floor((11 * y + 3) / 30) + 354 * y + 30 * m - Math.floor((m - 1) / 2) + d + 1948440 - 385;
  let l = jd + 68569;
  let n = Math.floor((4 * l) / 146097);
  l = l - Math.floor((146097 * n + 3) / 4);
  let i = Math.floor((4000 * (l + 1)) / 1461001);
  l = l - Math.floor((1461 * i) / 4) + 31;
  let j = Math.floor((80 * l) / 2447);
  let gDay = l - Math.floor((2447 * j) / 80);
  l = Math.floor(j / 11);
  let gMonth = j + 2 - 12 * l;
  let gYear = 100 * (n - 49) + i + l;
  return new Date(gYear, gMonth - 1, gDay);
}

document.getElementById('convertH2GBtn')?.addEventListener('click', () => {
  const d = parseInt(document.getElementById('hDay').value);
  const m = parseInt(document.getElementById('hMonth').value);
  const y = parseInt(document.getElementById('hYear').value);

  if (!d || !m || !y || d < 1 || d > 30) {
    alert('يرجى إدخال يوم وشهر وسنة صحيحة');
    return;
  }

  const gDate = hijriToGregorian(d, m, y);
  const formatter = new Intl.DateTimeFormat('ar-EG', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  const resBox = document.getElementById('h2gResult');
  resBox.style.display = 'block';
  resBox.innerText = `التاريخ الميلادي: ${formatter.format(gDate)}`;
});
document.getElementById('findMosqueBtn')?.addEventListener('click', () => {
  const status = document.getElementById('mosqueStatus');
  status.innerText = "جاري تحديد موقعك...";

  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        status.innerText = "تم تحديد الموقع! جاري فتح الخريطة...";
        
        // رابط خرائط جوجل موجه لإحداثيات المستخدم الحالية موضحاً أقرب المساجد
        const mapsUrl = `https://www.google.com/maps/search/%D9%85%D8%B3%D8%AC%D8%AF/@${lat},${lng},15z`;
        window.open(mapsUrl, '_blank');
      },
      () => {
        status.innerText = "تعذر الحصول على الموقع، يرجى السماح بتشغيل الـ GPS.";
      }
    );
  } else {
    status.innerText = "متصفحك لا يدعم خاصية تحديد الموقع.";
  }
});
// كتم كلي لأصوات الموقع عند تفعيل عدم الإزعاج
const dndToggle = document.getElementById('dndToggle');
const dndStatusText = document.getElementById('dndStatusText');

function applySoundState(isMuted) {
  // كتم أو تشغيل كافة المشغلات الصوتية بالفحص
  document.querySelectorAll('audio, video').forEach(media => {
    media.muted = isMuted;
  });

  if (isMuted) {
    dndStatusText.innerText = 'مفعل';
    dndStatusText.className = 'dnd-status-text status-on';
  } else {
    dndStatusText.innerText = 'غير مفعل';
    dndStatusText.className = 'dnd-status-text status-off';
  }
}

if (dndToggle) {
  // قراءة الحالة المحفوظة سابقاً
  const isDndActive = localStorage.getItem('dndMode') === 'true';
  dndToggle.checked = isDndActive;
  applySoundState(isDndActive);

  dndToggle.addEventListener('change', () => {
    const active = dndToggle.checked;
    localStorage.setItem('dndMode', active);
    applySoundState(active);
  });
}
// تحديد تاريخ رمضان القادم (يرجى تحديث هذا التاريخ سنوياً حسب الرؤية الفلكية)
// تاريخ رمضان 1448 هـ التقريبي: 8 فبراير 2027
const nextRamadanDate = new Date("February 8, 2027 00:00:00").getTime();

function updateRamadanCountdown() {
  const countdownElement = document.getElementById('ramadanCountdown');
  if (!countdownElement) return; // لو الكارت مش موجود في الصفحة ميطلعش خطأ

  const now = new Date().getTime();
  const timeDifference = nextRamadanDate - now;

  // لو رمضان بدأ أو انتهى التوقيت
  if (timeDifference < 0) {
    countdownElement.innerHTML = '<div style="color: var(--green); font-weight: bold; font-size: 14px; text-align: center; width: 100%;">رمضان مبارك! 🌙</div>';
    return;
  }

  // حساب الأيام، الساعات، الدقائق، والثواني
  const days = Math.floor(timeDifference / (1000 * 60 * 60 * 24));
  const hours = Math.floor((timeDifference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((timeDifference % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((timeDifference % (1000 * 60)) / 1000);

  // تحديث الأرقام في الـ HTML
  document.getElementById('ramadanDays').innerText = days;
  // إضافة صفر على الشمال لو الرقم أقل من 10 (عشان الشكل يكون متناسق)
  document.getElementById('ramadanHours').innerText = hours < 10 ? '0' + hours : hours;
  document.getElementById('ramadanMinutes').innerText = minutes < 10 ? '0' + minutes : minutes;
  document.getElementById('ramadanSeconds').innerText = seconds < 10 ? '0' + seconds : seconds;
}
/* ---------------- التقويم الهجري "الفاخر" ---------------- */
safe(()=>{
  const calGrid = $('hijriCalGrid');
  const calTitle = $('hijriCalTitle');
  if(!calGrid || !calTitle) throw new Error('عناصر التقويم غير موجودة');

  const hijriFormatter = new Intl.DateTimeFormat('en-u-ca-islamic-umalqura', { year:'numeric', month:'numeric', day:'numeric' });
  const hijriMonthNameFormatter = new Intl.DateTimeFormat('ar-SA-u-ca-islamic-umalqura', { year:'numeric', month:'long' });

  function getHijriParts(date){
    const parts = hijriFormatter.formatToParts(date);
    const obj = {};
    parts.forEach(p=> obj[p.type] = p.value);
    return { year: parseInt(obj.year), month: parseInt(obj.month), day: parseInt(obj.day) };
  }
  function addDays(date, n){ const d = new Date(date); d.setDate(d.getDate() + n); return d; }
  function sameYMD(a, b){ return a.getFullYear()===b.getFullYear() && a.getMonth()===b.getMonth() && a.getDate()===b.getDate(); }

  function buildMonth(anchorDate){
    const anchorHijri = getHijriParts(anchorDate);
    let startDate = addDays(anchorDate, -(anchorHijri.day - 1));
    const days = [];
    let cursor = new Date(startDate);
    while(true){
      const h = getHijriParts(cursor);
      if(h.month !== anchorHijri.month || h.year !== anchorHijri.year) break;
      days.push({ date: new Date(cursor), hijriDay: h.day });
      cursor = addDays(cursor, 1);
    }
    return {
      title: hijriMonthNameFormatter.format(startDate) + ' هـ',
      startWeekday: startDate.getDay(),
      days, startDate, endDate: days[days.length - 1].date
    };
  }

  let currentMonthData = buildMonth(new Date());

  function renderCalendar(){
    calTitle.textContent = currentMonthData.title;
    calGrid.innerHTML = '';
    for(let i=0; i<currentMonthData.startWeekday; i++){
      const empty = document.createElement('div');
      empty.className = 'hijri-cal-day empty';
      calGrid.appendChild(empty);
    }
    const today = new Date();
    currentMonthData.days.forEach(dayInfo=>{
      const cell = document.createElement('div');
      cell.className = 'hijri-cal-day';
      if(sameYMD(dayInfo.date, today)) cell.classList.add('today');
      cell.textContent = dayInfo.hijriDay;
      cell.title = dayInfo.date.toLocaleDateString('ar-EG', { year:'numeric', month:'long', day:'numeric' });
      calGrid.appendChild(cell);
    });
  }
  renderCalendar();

  $('hijriPrevBtn').addEventListener('click', ()=>{
    currentMonthData = buildMonth(addDays(currentMonthData.startDate, -1));
    renderCalendar();
  });
  $('hijriNextBtn').addEventListener('click', ()=>{
    currentMonthData = buildMonth(addDays(currentMonthData.endDate, 1));
    renderCalendar();
  });
}, 'التقويم الهجري');

// حاسبة ختم القرآن الكريم
document.getElementById('calcQuranBtn')?.addEventListener('click', () => {
  const daysInput = document.getElementById('quranDaysInput').value;
  const days = parseInt(daysInput);
  
  // التحقق من إدخال رقم صحيح
  if (!days || days <= 0) {
    alert("يرجى إدخال عدد أيام صحيح (مثلاً: 30)!");
    return;
  }

  const totalQuranPages = 604; // عدد صفحات المصحف الشريف
  
  // حساب الصفحات اليومية (Math.ceil لتقريب الكسر للأعلى لضمان الختمة)
  const dailyPages = Math.ceil(totalQuranPages / days);
  
  // حساب الصفحات بعد كل صلاة مفروضة (5 صلوات)
  const pagesPerPrayer = Math.ceil(dailyPages / 5);

  // إرسال الأرقام للـ HTML
  document.getElementById('dailyPagesVal').innerText = dailyPages;
  document.getElementById('prayerPagesVal').innerText = pagesPerPrayer;
  
  // إظهار صندوق النتيجة
  document.getElementById('quranResultBox').style.display = 'block';
});
/* ===================================================================
   8. مفكرة العادات اليومية (يدوية بالكامل - المستخدم يضيف مهامه بنفسه)
=================================================================== */
safe(()=>{
  function habitsKey(){ return 'dailyHabits-' + new Date().toISOString().slice(0,10); }
  function getHabitsList(){
    const saved = localStorage.getItem('habitsListNames');
    return saved ? JSON.parse(saved) : [];
  }
  function saveHabitsList(list){ localStorage.setItem('habitsListNames', JSON.stringify(list)); }

  function renderHabits(){
    const names = getHabitsList();
    const done = JSON.parse(localStorage.getItem(habitsKey()) || '{}');
    const wrap = $('habitsList');
    wrap.innerHTML = '';

    names.forEach((name, idx)=>{
      const isDone = !!done[idx];
      const row = document.createElement('div');
      row.className = 'habit-row' + (isDone ? ' done' : '');
      row.innerHTML = `
        <span class="habit-text">${name}</span>
        <span class="habit-checkbox">${isDone ? '✓' : ''}</span>
        <span class="habit-spacer"></span>
        <button class="habit-del-btn">حذف</button>
      `;
      row.querySelector('.habit-checkbox').addEventListener('click', ()=>{
        done[idx] = !done[idx];
        localStorage.setItem(habitsKey(), JSON.stringify(done));
        renderHabits();
      });
      row.querySelector('.habit-del-btn').addEventListener('click', ()=>{
        const updated = names.filter((_,i)=>i!==idx);
        saveHabitsList(updated);
        renderHabits();
      });
      wrap.appendChild(row);
    });
  }
  renderHabits();

  $('addHabitBtn').addEventListener('click', ()=>{
    const input = $('newHabitInput');
    const val = input.value.trim();
    if(!val){ showToast('اكتب اسم المهمة أولاً'); return; }
    const names = getHabitsList();
    names.push(val);
    saveHabitsList(names);
    input.value = '';
    renderHabits();
    showToast('تمت الإضافة ✅');
  });
}, 'مفكرة العادات اليومية');