/* ===================================================================
   المصحف الشريف - quran.js
   نص الآيات وترقيم الصفحات/الأجزاء/الأحزاب: Al-Quran Cloud API (بدون
   مفتاح، ثابت من سنين) — نفس ترقيم المصحف المطبوع القياسي (604 صفحة).
   القراء + الصوتيات: mp3quran.net API v3 (بدون تسجيل دخول، روابط ثابتة).
=================================================================== */
function $(id){ return document.getElementById(id); }
function safe(fn, label){ try{ fn(); }catch(e){ console.error('خطأ في: '+label, e); } }

const body = document.body;
const TEXT_API = 'https://api.alquran.cloud/v1';
const MP3API = 'https://www.mp3quran.net/api/v3';
const TOTAL_PAGES = 604;

/* ---------------- الوضع الليلي ---------------- */
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
document.addEventListener('click', (e)=>{ if(e.target.closest('button,a')) playClick(); });
document.addEventListener('click', (e)=>{
  const el = e.target.closest('.btn, .round-btn, .surah-card, .juz-card');
  if(!el) return;
  try{
    const rect = el.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const span = document.createElement('span');
    span.className = 'ripple';
    span.style.width = span.style.height = size + 'px';
    span.style.left = (e.clientX - rect.left - size/2) + 'px';
    span.style.top = (e.clientY - rect.top - size/2) + 'px';
    if(getComputedStyle(el).position === 'static') el.style.position = 'relative';
    el.style.overflow = 'hidden';
    el.appendChild(span);
    setTimeout(()=> span.remove(), 600);
  }catch(err){}
});

const toastBox = $('toastBox');
function showToast(msg, duration=4000){
  if(!toastBox) return;
  toastBox.textContent = msg;
  toastBox.classList.add('show');
  clearTimeout(showToast._t);
  showToast._t = setTimeout(()=> toastBox.classList.remove('show'), duration);
}

const EASTERN_DIGITS = ['٠','١','٢','٣','٤','٥','٦','٧','٨','٩'];
function toEasternDigits(n){ return String(n).split('').map(c=> /[0-9]/.test(c) ? EASTERN_DIGITS[+c] : c).join(''); }

/* ---------------- الحالة العامة ---------------- */
let chapters = [];
let reciters = [];
let reciterMoshafMap = {};
let currentChapter = 1;
let currentPage = 1;
let currentReciterId = null;
let continuousAll = false;
let selectedAyahEl = null;

const quranAudio = $('quranAudio');
const indexScreen = $('indexScreen');
const readerScreen = $('readerScreen');
const surahGrid = $('surahGrid');
const juzGrid = $('juzGrid');
const hizbGrid = $('hizbGrid');
const mushafPage = $('mushafPage');
const reciterPicker = $('reciterPicker');
const reciterPickerToggle = $('reciterPickerToggle');
const reciterCurrentName = $('reciterCurrentName');
const reciterPanel = $('reciterPanel');
const reciterSearchInput = $('reciterSearchInput');
const reciterList = $('reciterList');
const playPauseBtn = $('playPauseBtn');
const seekBar = $('seekBar');
const curTimeEl = $('curTime');
const durTimeEl = $('durTime');
const dlProgress = $('dlProgress');
const recitersRetryBtn = $('recitersRetryBtn');
const resumeBanner = $('resumeBanner');
const ayahActionBar = $('ayahActionBar');
const ayahActionLabel = $('ayahActionLabel');
const copyAyahBtn = $('copyAyahBtn');
const favAyahBtn = $('favAyahBtn');

function fmtTime(sec){
  if(!isFinite(sec)) return '00:00';
  const m = Math.floor(sec/60), s = Math.floor(sec%60);
  return String(m).padStart(2,'0')+':'+String(s).padStart(2,'0');
}

/* ---------------- تحميل قائمة السور (بيانات + الاسم العربي) ---------------- */
async function loadChapters(){
  try{
    const cached = localStorage.getItem('quran-chapters-v3');
    if(cached){ chapters = JSON.parse(cached); renderSurahGrid(chapters); renderResumeBanner(); }
    const res = await fetch(`${TEXT_API}/surah`);
    const data = await res.json();
    chapters = data.data.map(s=>({
      id: s.number,
      name_arabic: s.name.replace(/^سورة\s*/,''),
      revelation_place: s.revelationType === 'Meccan' ? 'makkah' : 'madinah',
      verses_count: s.numberOfAyahs,
      name_simple: s.englishName
    }));
    localStorage.setItem('quran-chapters-v3', JSON.stringify(chapters));
    renderSurahGrid(chapters);
    renderResumeBanner();
  }catch(e){
    if(!chapters.length) surahGrid.innerHTML = '<div class="loading-box">⚠️ تعذر تحميل قائمة السور، تأكد من الاتصال بالإنترنت.<br><button class="btn small" id="retryChaptersBtn" style="margin-top:10px;">🔄 إعادة المحاولة</button></div>';
    $('retryChaptersBtn')?.addEventListener('click', loadChapters);
  }
}

/* ---------------- بانر "كمّل من حيث وقفت" ---------------- */
function renderResumeBanner(){
  if(!resumeBanner) return;
  const raw = localStorage.getItem('quran-last-read');
  if(!raw){ resumeBanner.classList.add('hidden'); return; }
  try{
    const {page} = JSON.parse(raw);
    if(!page){ resumeBanner.classList.add('hidden'); return; }
    resumeBanner.innerHTML = `📖 كمّل من حيث وقفت: <b>صفحة ${toEasternDigits(page)}</b> <button class="btn small primary" id="resumeReadingBtn">متابعة القراءة</button>`;
    resumeBanner.classList.remove('hidden');
    $('resumeReadingBtn')?.addEventListener('click', ()=> openPage(page));
  }catch(e){ resumeBanner.classList.add('hidden'); }
}

/* ---------------- نسبة إتمام قراءة المصحف (حسب الصفحات اللي فُتحت) ---------------- */
const VISITED_PAGES_KEY = 'quran-visited-pages';
function getVisitedPages(){ try{ return JSON.parse(localStorage.getItem(VISITED_PAGES_KEY) || '[]'); }catch(e){ return []; } }
function markPageVisited(n){
  const list = getVisitedPages();
  if(!list.includes(n)){ list.push(n); localStorage.setItem(VISITED_PAGES_KEY, JSON.stringify(list)); }
  renderCompletionPercent();
}
function renderCompletionPercent(){
  const bar = $('completionPercentBar'), txt = $('completionPercentText');
  if(!bar || !txt) return;
  const pct = Math.round((getVisitedPages().length / TOTAL_PAGES) * 100);
  bar.style.width = pct + '%';
  txt.textContent = toEasternDigits(pct) + '% (' + toEasternDigits(getVisitedPages().length) + ' من ٦٠٤ صفحة)';
}
renderCompletionPercent();

/* ---------------- السور المفضّلة ---------------- */
const FAV_SURAHS_KEY = 'quran-favorite-surahs';
function getFavSurahs(){ try{ return JSON.parse(localStorage.getItem(FAV_SURAHS_KEY) || '[]'); }catch(e){ return []; } }
function isFavSurah(id){ return getFavSurahs().includes(id); }
function toggleFavSurah(id){
  const list = getFavSurahs();
  const idx = list.indexOf(id);
  if(idx >= 0) list.splice(idx, 1); else list.push(id);
  localStorage.setItem(FAV_SURAHS_KEY, JSON.stringify(list));
  return idx < 0;
}
let showFavSurahsOnly = false;

function renderSurahGrid(list){
  surahGrid.innerHTML = '';
  const shown = showFavSurahsOnly ? list.filter(ch => isFavSurah(ch.id)) : list;
  if(showFavSurahsOnly && !shown.length){
    surahGrid.innerHTML = '<div class="loading-box">⭐ لسه معندكش سور في المفضلة. دوس على النجمة اللي جنب أي سورة عشان تضيفها.</div>';
    return;
  }
  shown.forEach(ch=>{
    const card = document.createElement('div');
    card.className = 'surah-card';
    const fav = isFavSurah(ch.id);
    card.innerHTML = `
      <button class="surah-fav-star ${fav ? 'active' : ''}" data-id="${ch.id}" title="${fav ? 'إزالة من السور المفضّلة' : 'إضافة للسور المفضّلة'}">${fav ? '⭐' : '☆'}</button>
      <div class="num">${toEasternDigits(ch.id)}</div>
      <div class="info">
        <div class="ar-name">${ch.name_arabic}</div>
        <div class="meta">${ch.revelation_place === 'makkah' ? 'مكية' : 'مدنية'} · ${toEasternDigits(ch.verses_count)} آية</div>
      </div>`;
    card.querySelector('.surah-fav-star').addEventListener('click', (e)=>{
      e.stopPropagation();
      const nowFav = toggleFavSurah(ch.id);
      showToast(nowFav ? '⭐ اتضافت سورة ' + ch.name_arabic + ' للمفضلة' : '🗑️ اتشالت سورة ' + ch.name_arabic + ' من المفضلة');
      renderSurahGrid(list);
    });
    card.addEventListener('click', ()=> openSurah(ch.id));
    surahGrid.appendChild(card);
  });
}

safe(()=>{
  const btn = $('favSurahsFilterBtn');
  btn?.addEventListener('click', ()=>{
    showFavSurahsOnly = !showFavSurahsOnly;
    btn.classList.toggle('primary', showFavSurahsOnly);
    btn.textContent = showFavSurahsOnly ? '📖 كل السور' : '💛 السور المفضّلة';
    renderSurahGrid(chapters);
  });
}, 'فلتر السور المفضلة');

safe(()=>{
  $('surahSearch').addEventListener('input', (e)=>{
    const q = e.target.value.trim();
    if(!q){ renderSurahGrid(chapters); return; }
    const filtered = chapters.filter(ch => ch.name_arabic.includes(q) || ch.name_simple.toLowerCase().includes(q.toLowerCase()) || String(ch.id) === q);
    renderSurahGrid(filtered);
  });
  $('continueAllToggle').addEventListener('change', (e)=>{ continuousAll = e.target.checked; });
}, 'أدوات قائمة السور');

/* ===================================================================
   فهرس الأجزاء والأحزاب — بيتبني مرة واحدة بس من 30 طلب لبيانات الأجزاء
   (كل طلب جزء بيرجع صفحة بداية الجزء + صفحتي بداية حزبيه)، وبيتخزّن
   محليًا فمتتكررش تاني أبدًا.
=================================================================== */
let juzStartPage = {};
let hizbStartPage = {};
let surahStartPage = {};

async function ensureJuzHizbIndex(onProgress){
  const cached = localStorage.getItem('quran-juz-hizb-index-v1');
  if(cached){
    try{
      const d = JSON.parse(cached);
      juzStartPage = d.juz; hizbStartPage = d.hizb; surahStartPage = d.surah;
      return true;
    }catch(e){}
  }
  juzStartPage = {}; hizbStartPage = {}; surahStartPage = {};
  try{
    for(let j=1;j<=30;j++){
      onProgress && onProgress(j);
      const res = await fetch(`${TEXT_API}/juz/${j}/quran-uthmani`);
      const data = await res.json();
      const ayahs = data.data.ayahs;
      if(!ayahs || !ayahs.length) continue;
      juzStartPage[j] = ayahs[0].page;
      ayahs.forEach(a=>{
        const hizbN = Math.ceil(a.hizbQuarter/4);
        if(!(hizbN in hizbStartPage) || a.page < hizbStartPage[hizbN]) hizbStartPage[hizbN] = a.page;
        const surahN = a.surah ? a.surah.number : null;
        if(surahN && (!(surahN in surahStartPage) || a.page < surahStartPage[surahN])) surahStartPage[surahN] = a.page;
      });
    }
    localStorage.setItem('quran-juz-hizb-index-v1', JSON.stringify({ juz:juzStartPage, hizb:hizbStartPage, surah:surahStartPage }));
    return true;
  }catch(e){
    return false;
  }
}

function renderJuzGrid(){
  juzGrid.innerHTML = Array.from({length:30}, (_,i)=>{
    const n = i+1;
    const page = juzStartPage[n];
    return `<div class="juz-card" data-juz="${n}">
      <div class="juz-num">${toEasternDigits(n)}</div>
      <div class="juz-title">الجزء ${toEasternDigits(n)}</div>
      <div class="juz-sub">${page ? 'صفحة ' + toEasternDigits(page) : '...'}</div>
    </div>`;
  }).join('');
  juzGrid.querySelectorAll('.juz-card').forEach(card=>{
    card.addEventListener('click', ()=>{
      const n = +card.dataset.juz;
      const page = juzStartPage[n];
      if(page) openPage(page); else showToast('⚠️ لسه بيانات الفهرس بتتحمّل، حاول تاني بعد شوية');
    });
  });
}
function renderHizbGrid(){
  hizbGrid.innerHTML = Array.from({length:60}, (_,i)=>{
    const n = i+1;
    const page = hizbStartPage[n];
    return `<div class="juz-card" data-hizb="${n}">
      <div class="juz-num">${toEasternDigits(n)}</div>
      <div class="juz-title">الحزب ${toEasternDigits(n)}</div>
      <div class="juz-sub">${page ? 'صفحة ' + toEasternDigits(page) : '...'}</div>
    </div>`;
  }).join('');
  hizbGrid.querySelectorAll('.juz-card').forEach(card=>{
    card.addEventListener('click', ()=>{
      const n = +card.dataset.hizb;
      const page = hizbStartPage[n];
      if(page) openPage(page); else showToast('⚠️ لسه بيانات الفهرس بتتحمّل، حاول تاني بعد شوية');
    });
  });
}

let juzHizbLoading = false;
async function ensureAndRenderJuzHizb(){
  if(Object.keys(juzStartPage).length === 30){ renderJuzGrid(); renderHizbGrid(); return; }
  if(juzHizbLoading) return;
  juzHizbLoading = true;
  juzGrid.innerHTML = '<div class="loading-box">⏳ جاري تجهيز فهرس الأجزاء والأحزاب لأول مرة (هيتخزن بعد كده ومش هيتكرر)...</div>';
  hizbGrid.innerHTML = juzGrid.innerHTML;
  const ok = await ensureJuzHizbIndex((j)=>{
    juzGrid.innerHTML = `<div class="loading-box">⏳ جاري تجهيز الفهرس... (${toEasternDigits(j)}/٣٠)</div>`;
  });
  juzHizbLoading = false;
  if(ok){ renderJuzGrid(); renderHizbGrid(); }
  else{ juzGrid.innerHTML = '<div class="loading-box">⚠️ تعذر تجهيز الفهرس، تأكد من الإنترنت وحاول تاني.</div>'; hizbGrid.innerHTML = juzGrid.innerHTML; }
}

/* ---------------- تبويبات الفهرس ---------------- */
safe(()=>{
  const tabs = { surah: $('tabSurahBtn'), juz: $('tabJuzBtn'), hizb: $('tabHizbBtn') };
  const panels = { surah: [$('surahToolbar'), $('offlineProgress'), surahGrid], juz: [juzGrid], hizb: [hizbGrid] };
  function showTab(name){
    Object.keys(tabs).forEach(k=>{
      tabs[k].classList.toggle('primary', k===name);
      panels[k].forEach(el=> el && el.classList.toggle('hidden', k!==name));
    });
    if(name === 'juz' || name === 'hizb') ensureAndRenderJuzHizb();
  }
  tabs.surah.addEventListener('click', ()=> showTab('surah'));
  tabs.juz.addEventListener('click', ()=> showTab('juz'));
  tabs.hizb.addEventListener('click', ()=> showTab('hizb'));
}, 'تبويبات الفهرس');

/* ---------------- تحميل قائمة القراء (mp3quran.net) ---------------- */
function buildReciterMap(){
  reciterMoshafMap = {};
  reciters.forEach(r=>{
    if(!r.moshaf || !r.moshaf.length) return;
    const hafs = r.moshaf.find(m=> m.moshaf_type === 11) || r.moshaf.find(m=> /مرتل/.test(m.name||'')) || r.moshaf[0];
    reciterMoshafMap[r.id] = { name: r.name, moshaf: hafs };
  });
}
let reciterIdsSorted = [];
function reciterDisplayName(id){
  const r = reciterMoshafMap[id];
  if(!r) return '';
  const style = (r.moshaf.name && !/حفص عن عاصم/.test(r.moshaf.name)) ? ` (${r.moshaf.name})` : '';
  return r.name + style;
}
function renderReciterList(filterText){
  const q = (filterText || '').trim();
  const ids = q
    ? reciterIdsSorted.filter(id => (reciterMoshafMap[id].name || '').includes(q))
    : reciterIdsSorted;
  if(!ids.length){ reciterList.innerHTML = '<div class="reciter-empty">لا يوجد قارئ بهذا الاسم</div>'; return; }
  reciterList.innerHTML = ids.map(id=>{
    const active = id === currentReciterId ? ' active' : '';
    return `<button type="button" class="reciter-item${active}" data-id="${id}">${reciterDisplayName(id)}</button>`;
  }).join('');
}
function selectReciter(id){
  currentReciterId = id;
  localStorage.setItem('quran-last-reciter', currentReciterId);
  reciterCurrentName.textContent = reciterDisplayName(id) || 'اختر القارئ';
  reciterList.querySelectorAll('.reciter-item.active').forEach(el=> el.classList.remove('active'));
  reciterList.querySelector(`.reciter-item[data-id="${id}"]`)?.classList.add('active');
  if(!readerScreen.classList.contains('hidden')) loadAudioForCurrentSurah(false);
}
function renderReciterSelect(){
  const ids = Object.keys(reciterMoshafMap);
  if(!ids.length){ reciterCurrentName.textContent = 'تعذر تحميل قائمة القراء'; recitersRetryBtn?.classList.remove('hidden'); return; }
  recitersRetryBtn?.classList.add('hidden');
  const priority = ['العفاسي','عبد الباسط','الحصري','المنشاوي','السديس','الشريم','الغامدي','المعيقلي','أيوب','الدوسري','الحذيفي','الطبلاوي','السويد'];
  ids.sort((a,b)=>{
    const an = reciterMoshafMap[a].name || '', bn = reciterMoshafMap[b].name || '';
    const ai = priority.findIndex(p=> an.includes(p));
    const bi = priority.findIndex(p=> bn.includes(p));
    const aw = ai===-1 ? 999 : ai, bw = bi===-1 ? 999 : bi;
    if(aw !== bw) return aw - bw;
    return an.localeCompare(bn, 'ar');
  });
  reciterIdsSorted = ids;
  const saved = localStorage.getItem('quran-last-reciter');
  currentReciterId = (saved && reciterMoshafMap[saved]) ? saved : ids[0];
  reciterCurrentName.textContent = reciterDisplayName(currentReciterId);
  renderReciterList(reciterSearchInput ? reciterSearchInput.value : '');
}
async function loadReciters(){
  reciterCurrentName.textContent = 'جاري تحميل القراء...';
  const cached = localStorage.getItem('quran-reciters-v2');
  if(cached){ try{ reciters = JSON.parse(cached); buildReciterMap(); renderReciterSelect(); }catch(e){} }
  try{
    const res = await fetch(`${MP3API}/reciters?language=ar`);
    if(!res.ok) throw new Error('http '+res.status);
    const data = await res.json();
    if(!data.reciters || !data.reciters.length) throw new Error('قائمة فاضية');
    reciters = data.reciters;
    localStorage.setItem('quran-reciters-v2', JSON.stringify(reciters));
    buildReciterMap();
    renderReciterSelect();
  }catch(e){
    if(!reciters.length){ reciterCurrentName.textContent = 'تعذر تحميل قائمة القراء'; recitersRetryBtn?.classList.remove('hidden'); }
  }
}
recitersRetryBtn?.addEventListener('click', loadReciters);

safe(()=>{
  reciterPickerToggle.addEventListener('click', ()=>{
    const willOpen = reciterPanel.classList.contains('hidden');
    reciterPanel.classList.toggle('hidden');
    reciterPicker.classList.toggle('open', willOpen);
    if(willOpen) reciterSearchInput.focus();
  });
  reciterSearchInput.addEventListener('input', (e)=> renderReciterList(e.target.value));
  reciterList.addEventListener('click', (e)=>{
    const item = e.target.closest('.reciter-item');
    if(!item) return;
    selectReciter(item.dataset.id);
    reciterPanel.classList.add('hidden');
    reciterPicker.classList.remove('open');
  });
  document.addEventListener('click', (e)=>{
    if(!reciterPicker.contains(e.target)){ reciterPanel.classList.add('hidden'); reciterPicker.classList.remove('open'); }
  });
}, 'قائمة القراء');

/* ---------------- فتح سورة (بيحوّلها لصفحة بدايتها) ---------------- */
async function openSurah(id){
  if(surahStartPage[id]){ return openPage(surahStartPage[id]); }
  try{
    const res = await fetch(`${TEXT_API}/ayah/${id}:1/quran-uthmani`);
    const data = await res.json();
    const page = data.data.page;
    surahStartPage[id] = page;
    return openPage(page);
  }catch(e){
    showToast('⚠️ تعذر فتح السورة، تأكد من الاتصال بالإنترنت');
  }
}

$('backToListBtn')?.addEventListener('click', ()=>{
  quranAudio.pause();
  readerScreen.classList.add('hidden');
  indexScreen.classList.remove('hidden');
  renderResumeBanner();
});
$('prevPageBtn')?.addEventListener('click', ()=> openPage(currentPage>1 ? currentPage-1 : TOTAL_PAGES));
$('nextPageBtn')?.addEventListener('click', ()=> openPage(currentPage<TOTAL_PAGES ? currentPage+1 : 1));
$('pageJumpBtn')?.addEventListener('click', ()=>{
  const n = parseInt($('pageJumpInput').value, 10);
  if(n>=1 && n<=TOTAL_PAGES) openPage(n); else showToast('اكتب رقم صفحة من ١ لـ٦٠٤');
});

/* ---------------- فتح صفحة معيّنة من المصحف ---------------- */
async function openPage(pageNum){
  currentPage = pageNum;
  indexScreen.classList.add('hidden');
  readerScreen.classList.remove('hidden');
  window.scrollTo({top:0, behavior:'auto'});
  mushafPage.innerHTML = '<div class="loading-box">⏳ جاري تحميل الصفحة...</div>';
  ayahActionBar?.classList.add('hidden');
  selectedAyahEl = null;
  await loadPageText(pageNum);
  markPageVisited(pageNum);
  localStorage.setItem('quran-last-read', JSON.stringify({page:pageNum, ts:Date.now()}));
  await loadAudioForCurrentSurah(false);
}

/* ---------------- تحميل نص الصفحة (الرسم العثماني) ---------------- */
async function loadPageText(pageNum){
  const cacheKey = 'quran-page-v1-'+pageNum;
  let ayahs;
  try{
    const cached = localStorage.getItem(cacheKey);
    if(cached){ ayahs = JSON.parse(cached); }
    else{
      const res = await fetch(`${TEXT_API}/page/${pageNum}/quran-uthmani`);
      const data = await res.json();
      ayahs = data.data.ayahs;
      localStorage.setItem(cacheKey, JSON.stringify(ayahs));
    }
  }catch(e){
    mushafPage.innerHTML = '<div class="loading-box">⚠️ تعذر تحميل الصفحة، تأكد من الاتصال بالإنترنت.<br><button class="btn small" id="retryPageBtn" style="margin-top:10px;">🔄 إعادة المحاولة</button></div>';
    $('retryPageBtn')?.addEventListener('click', ()=> loadPageText(pageNum));
    return;
  }
  if(!ayahs || !ayahs.length) return;

  currentChapter = ayahs[0].surah.number;
  $('topbarPage').textContent = toEasternDigits(pageNum);
  $('pageJumpInput').value = '';

  const juzNum = ayahs[0].juz;
  const lastHizbQuarter = ayahs[ayahs.length-1].hizbQuarter;
  const hizbNum = Math.ceil(lastHizbQuarter / 4);
  const quarterInHizb = ((lastHizbQuarter - 1) % 4) + 1;
  const firstCh = chapters.find(c=>c.id===currentChapter);
  const pageMainSurahName = firstCh ? firstCh.name_arabic : ayahs[0].surah.name;

  let html = `<div class="mushaf-page-header">
    <span class="mph-juz">📑 الجزء ${toEasternDigits(juzNum)}</span>
    <span class="mph-surah">سورة ${pageMainSurahName}</span>
  </div>`;
  let lastSurah = null;
  ayahs.forEach(a=>{
    const surahNum = a.surah.number;
    if(surahNum !== lastSurah){
      const ch = chapters.find(c=>c.id===surahNum);
      const name = ch ? ch.name_arabic : a.surah.name;
      const revPlace = a.surah.revelationType === 'Meccan' ? 'مكية' : 'مدنية';
      html += `<div class="surah-frame"><div class="name">سورة ${name}</div><div class="sub">${revPlace}</div></div>`;
      if(a.numberInSurah === 1 && surahNum !== 9) html += `<div class="basmala">بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</div>`;
      html += `<div class="ayat-block">`;
      lastSurah = surahNum;
    }
    let text = a.text;
    const words = text.split(' ').map((w,i)=> `<span class="word" data-pos="${i+1}">${w}</span>`).join(' ');
    const verseKey = `${surahNum}:${a.numberInSurah}`;
    html += `<span class="ayah" data-verse="${verseKey}">${words} <span class="ayah-end">${toEasternDigits(a.numberInSurah)}</span></span> `;
  });
  html += `</div>`;
  html += `<div class="mushaf-page-footer"><span class="mpf-pill">${toEasternDigits(quarterInHizb)}/٤ الحزب ${toEasternDigits(hizbNum)}</span></div>`;
  mushafPage.innerHTML = html;
}

/* ---------------- تحميل الصوت (السورة الحالية على الصفحة) ---------------- */
async function loadAudioForCurrentSurah(autoplay){
  if(!currentReciterId) return;
  dlProgress.textContent = '';
  const info = reciterMoshafMap[currentReciterId];
  if(!info || !info.moshaf){ showToast('⚠️ اختر قارئ أولًا'); return; }
  const list = (info.moshaf.surah_list || '').split(',').map(s=>s.trim());
  if(!list.includes(String(currentChapter))){
    quranAudio.removeAttribute('src');
    quranAudio.removeAttribute('data-download-url');
    showToast('⚠️ الصوت مش متاح لهذا القارئ في هذه السورة');
    return;
  }
  const url = info.moshaf.server + String(currentChapter).padStart(3,'0') + '.mp3';
  quranAudio.src = url;
  quranAudio.dataset.downloadUrl = url;
  if(autoplay) quranAudio.play().catch(()=>{});
}

/* ---------------- التحكم في التشغيل ---------------- */
playPauseBtn?.addEventListener('click', ()=>{
  if(quranAudio.paused){ quranAudio.play().catch(()=>{}); } else{ quranAudio.pause(); }
});
quranAudio.addEventListener('play', ()=> playPauseBtn.textContent = '⏸️');
quranAudio.addEventListener('pause', ()=> playPauseBtn.textContent = '▶️');
quranAudio.addEventListener('loadedmetadata', ()=>{
  seekBar.max = quranAudio.duration || 0;
  durTimeEl.textContent = fmtTime(quranAudio.duration);
});
seekBar?.addEventListener('input', ()=>{ quranAudio.currentTime = seekBar.value; });
quranAudio.addEventListener('timeupdate', ()=>{
  curTimeEl.textContent = fmtTime(quranAudio.currentTime);
  if(!seekBar.matches(':active')) seekBar.value = quranAudio.currentTime;
});

/* ---------------- التحميل ---------------- */
$('downloadSurahBtn')?.addEventListener('click', ()=>{
  const url = quranAudio.dataset.downloadUrl;
  if(!url){ showToast('⚠️ الصوت لسه ما اتحملش'); return; }
  const ch = chapters.find(c=>c.id===currentChapter);
  const a = document.createElement('a');
  a.href = url; a.download = `${currentChapter}-${ch?ch.name_simple:'surah'}.mp3`; a.target = '_blank'; a.rel = 'noopener';
  document.body.appendChild(a); a.click(); a.remove();
  showToast('⬇️ بدأ تحميل السورة');
});
$('downloadAllBtn')?.addEventListener('click', async ()=>{
  if(!currentReciterId){ showToast('اختار القارئ الأول'); return; }
  const info = reciterMoshafMap[currentReciterId];
  if(!info || !info.moshaf){ showToast('اختار القارئ الأول'); return; }
  const list = (info.moshaf.surah_list || '').split(',').map(s=>s.trim());
  showToast('⬇️ هيتم فتح تحميل السور المتاحة لهذا الشيخ واحدة واحدة، لازم تسمح للمتصفح بتحميلات متعددة', 6000);
  for(let i=1;i<=114;i++){
    if(!list.includes(String(i))) continue;
    dlProgress.textContent = `جاري تجهيز تحميل السورة ${toEasternDigits(i)} من ١١٤...`;
    const url = info.moshaf.server + String(i).padStart(3,'0') + '.mp3';
    const a = document.createElement('a');
    a.href = url; a.download = `${i}.mp3`; a.target = '_blank'; a.rel = 'noopener';
    document.body.appendChild(a); a.click(); a.remove();
    await new Promise(r=> setTimeout(r, 700));
  }
  dlProgress.textContent = '✅ تم تجهيز تحميل كل ما هو متاح من المصحف بصوت هذا الشيخ';
  showToast('✅ تم تجهيز تحميل السور المتاحة');
});

/* ---------------- تكبير/تصغير خط المصحف ---------------- */
safe(()=>{
  const KEY = 'quran-font-scale';
  let scale = parseFloat(localStorage.getItem(KEY)) || 1;
  function applyScale(){ mushafPage.style.setProperty('--ayat-scale', scale); localStorage.setItem(KEY, scale); }
  applyScale();
  $('fontIncBtn')?.addEventListener('click', ()=>{ scale = Math.min(1.6, +(scale + 0.1).toFixed(2)); applyScale(); });
  $('fontDecBtn')?.addEventListener('click', ()=>{ scale = Math.max(0.7, +(scale - 0.1).toFixed(2)); applyScale(); });
}, 'حجم خط المصحف');

/* ---------------- تلميح المفضلة ---------------- */
safe(()=>{
  const banner = $('favHintBanner');
  const closeBtn = $('favHintClose');
  if(!banner) return;
  if(localStorage.getItem('quran-fav-hint-seen') !== '1') banner.classList.remove('hidden');
  closeBtn?.addEventListener('click', ()=>{ banner.classList.add('hidden'); localStorage.setItem('quran-fav-hint-seen', '1'); });
}, 'تلميح المفضلة');

/* ---------------- الآيات المفضّلة ---------------- */
const FAV_KEY = 'quran-favorites';
function getFavorites(){ try{ return JSON.parse(localStorage.getItem(FAV_KEY) || '[]'); }catch(e){ return []; } }
function saveFavorites(list){ localStorage.setItem(FAV_KEY, JSON.stringify(list)); }
function isFavoriteVerse(verseKey){ return getFavorites().some(f=> f.verseKey === verseKey); }
function toggleFavoriteVerse(verseKey, text){
  const list = getFavorites();
  const idx = list.findIndex(f=> f.verseKey === verseKey);
  if(idx >= 0){ list.splice(idx, 1); saveFavorites(list); return false; }
  const ch = chapters.find(c=> c.id === currentChapter);
  list.push({ verseKey, surahId: currentChapter, surahName: ch ? ch.name_arabic : '', verseNumber: parseInt((verseKey.split(':')[1] || '0'), 10), text, ts: Date.now() });
  saveFavorites(list);
  return true;
}
function renderFavBtnState(verseKey){
  if(!favAyahBtn) return;
  const fav = isFavoriteVerse(verseKey);
  favAyahBtn.textContent = fav ? '💛 في المفضلة' : '⭐ إضافة للمفضلة';
  favAyahBtn.classList.toggle('primary', fav);
}

/* ---------------- الضغط على آية لتظليلها ونسخها وتفضيلها ---------------- */
safe(()=>{
  mushafPage.addEventListener('click', (e)=>{
    const ayahEl = e.target.closest('.ayah');
    if(mushafPage.classList.contains('tasmee-mode')){
      if(ayahEl) ayahEl.classList.toggle('revealed');
      return; // في وضع التسميع، الضغطة بس تكشف/تخفي الآية، مفيش نسخ ولا تفضيل
    }
    document.querySelectorAll('.ayah.active-ayah').forEach(el=> el.classList.remove('active-ayah'));
    if(!ayahEl){ ayahActionBar?.classList.add('hidden'); selectedAyahEl = null; return; }
    ayahEl.classList.add('active-ayah');
    selectedAyahEl = ayahEl;
    $('favHintBanner')?.classList.add('hidden');
    localStorage.setItem('quran-fav-hint-seen', '1');
    const verseKey = ayahEl.dataset.verse || '';
    if(ayahActionLabel) ayahActionLabel.textContent = 'آية ' + toEasternDigits(verseKey.split(':')[1] || '');
    renderFavBtnState(verseKey);
    ayahActionBar?.classList.remove('hidden');
  });
  copyAyahBtn?.addEventListener('click', ()=>{
    if(!selectedAyahEl) return;
    const ch = chapters.find(c=>c.id===currentChapter);
    const verseKey = selectedAyahEl.dataset.verse || '';
    const text = selectedAyahEl.textContent.trim();
    const ref = ch ? ` — سورة ${ch.name_arabic}، آية ${verseKey.split(':')[1]||''}` : '';
    if(navigator.clipboard && navigator.clipboard.writeText){
      navigator.clipboard.writeText(text + ref).then(()=> showToast('✅ تم نسخ الآية')).catch(()=> showToast('⚠️ تعذر النسخ'));
    }else{ showToast('⚠️ النسخ التلقائي مش مدعوم في هذا المتصفح'); }
  });
  favAyahBtn?.addEventListener('click', ()=>{
    if(!selectedAyahEl) return;
    const verseKey = selectedAyahEl.dataset.verse || '';
    const text = selectedAyahEl.textContent.trim();
    const nowFav = toggleFavoriteVerse(verseKey, text);
    renderFavBtnState(verseKey);
    showToast(nowFav ? '⭐ تمت إضافة الآية للمفضلة' : '🗑️ تمت إزالة الآية من المفضلة');
  });
}, 'نسخ الآية وتفضيلها');

/* ---------------- فتح آية معيّنة قادمة من صفحة المفضلة (?surah=..&verse=..) ---------------- */
async function openFromFavoriteLink(){
  const params = new URLSearchParams(location.search);
  const surah = parseInt(params.get('surah'), 10);
  const verse = params.get('verse');
  if(!surah) return;
  let targetPage = null;
  try{
    if(verse){
      const res = await fetch(`${TEXT_API}/ayah/${surah}:${verse}/quran-uthmani`);
      const data = await res.json();
      targetPage = data.data.page;
    }
  }catch(e){}
  if(!targetPage){ await openSurah(surah); return; }
  await openPage(targetPage);
  if(verse){
    const verseKey = `${surah}:${verse}`;
    const ayahEl = mushafPage.querySelector(`.ayah[data-verse="${verseKey}"]`);
    if(ayahEl){
      ayahEl.classList.add('active-ayah');
      selectedAyahEl = ayahEl;
      renderFavBtnState(verseKey);
      if(ayahActionLabel) ayahActionLabel.textContent = 'آية ' + toEasternDigits(verse);
      ayahActionBar?.classList.remove('hidden');
      ayahEl.scrollIntoView({behavior:'auto', block:'center'});
    }
  }
}

/* ===================================================================
   ملء الشاشة أثناء القراءة
=================================================================== */
safe(()=>{
  const fsBtn = $('fullscreenBtn');
  fsBtn?.addEventListener('click', ()=>{
    if(!document.fullscreenElement){ readerScreen.requestFullscreen?.().catch(()=>{}); fsBtn.textContent = '✖ الخروج من ملء الشاشة'; }
    else{ document.exitFullscreen?.(); }
  });
  document.addEventListener('fullscreenchange', ()=>{
    if(fsBtn) fsBtn.textContent = document.fullscreenElement ? '✖ الخروج من ملء الشاشة' : '⛶ ملء الشاشة';
  });
}, 'ملء الشاشة');

/* ===================================================================
   تحميل نص المصحف كامل للقراءة بدون نت (كل الصفحات الـ604، بدون صوت)
=================================================================== */
$('offlineDownloadBtn')?.addEventListener('click', async ()=>{
  const progEl = $('offlineProgress');
  progEl.textContent = 'جاري التحميل...';
  let done = 0;
  for(let i=1;i<=TOTAL_PAGES;i++){
    const cacheKey = 'quran-page-v1-'+i;
    if(!localStorage.getItem(cacheKey)){
      try{
        const res = await fetch(`${TEXT_API}/page/${i}/quran-uthmani`);
        const data = await res.json();
        localStorage.setItem(cacheKey, JSON.stringify(data.data.ayahs));
      }catch(e){ /* هنكمل الباقي حتى لو صفحة فشلت */ }
    }
    done++;
    if(done % 5 === 0 || done === TOTAL_PAGES) progEl.textContent = `جاري تجهيز الصفحة ${toEasternDigits(done)} من ٦٠٤ للقراءة أوفلاين...`;
  }
  progEl.textContent = '✅ اتحمّل المصحف كامل نصيًا، دلوقتي تقدر تقرا أي صفحة بدون نت (الصوت لسه محتاج إنترنت)';
  setTimeout(()=> progEl.textContent = '', 8000);
});

/* ===================================================================
   إحصائيات السور (طول كل سورة + مكية/مدنية) — Canvas بسيط
=================================================================== */
safe(()=>{
  const modal = $('statsModal');
  $('statsChartBtn')?.addEventListener('click', ()=>{ modal.classList.remove('hidden'); drawSurahStats(); });
  $('statsModalClose')?.addEventListener('click', ()=> modal.classList.add('hidden'));
  modal?.addEventListener('click', (e)=>{ if(e.target === modal) modal.classList.add('hidden'); });
}, 'مودال إحصائيات السور');

function drawSurahStats(){
  const canvas = $('surahStatsCanvas');
  if(!canvas || !chapters.length) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  ctx.clearRect(0,0,W,H);
  const max = Math.max(...chapters.map(c=>c.verses_count));
  const stepX = (W-40) / chapters.length;
  chapters.forEach((c, i)=>{
    const x = 30 + i*stepX;
    const h = (c.verses_count/max) * (H-40);
    ctx.fillStyle = c.revelation_place === 'makkah' ? '#5a9c40' : '#c9a24b';
    ctx.fillRect(x, H-30-h, Math.max(1.5, stepX-1), h);
  });
  ctx.fillStyle = '#9aa4bd'; ctx.font = '12px Tahoma'; ctx.textAlign='center';
  ctx.fillText('كل سورة = عمود واحد (١١٤ سورة من اليمين للشمال)', W/2, H-10);
}

/* ===================================================================
   سجّل قراءتك وقارنها (تقريبي جدًا — مقارنة مدة فقط، مش تحليل تجويد)
=================================================================== */
safe(()=>{
  let mediaRecorder = null, recordedChunks = [], recordedBlobUrl = null, recordStartTs = 0;
  const recordBtn = $('recordAyahBtn');
  const panel = $('recordPanel');
  document.addEventListener('click', (e)=>{
    if(e.target && e.target.id === 'stopRecBtn'){
      mediaRecorder?.stop();
      e.target.classList.add('hidden');
      $('startRecBtn')?.classList.remove('hidden');
    }
    if(e.target && e.target.id === 'playRecBtn' && recordedBlobUrl){ new Audio(recordedBlobUrl).play().catch(()=>{}); }
  });
  recordBtn?.addEventListener('click', async ()=>{
    panel.classList.remove('hidden');
    if(!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia){ panel.innerHTML = '⚠️ المتصفح ده مش بيدعم التسجيل الصوتي'; return; }
    panel.innerHTML = `
      <div>🎙️ سجّل نفسك وانت بتقرا نفس الآية، وقارن مدة تلاوتك بمدة تلاوة الشيخ (مقارنة تقريبية للمدة بس، مش تحليل تجويد حقيقي)</div>
      <div class="record-actions">
        <button class="btn small primary" id="startRecBtn">⏺️ ابدأ التسجيل</button>
        <button class="btn small hidden" id="stopRecBtn">⏹️ إيقاف</button>
        <button class="btn small hidden" id="playRecBtn">▶️ سماع تسجيلي</button>
        <button class="btn small" id="closeRecBtn">✖ إغلاق</button>
      </div>
      <div class="record-result" id="recordResult"></div>`;
    $('closeRecBtn').addEventListener('click', ()=> panel.classList.add('hidden'));
    $('startRecBtn').addEventListener('click', async ()=>{
      try{
        const stream = await navigator.mediaDevices.getUserMedia({ audio:true });
        recordedChunks = [];
        mediaRecorder = new MediaRecorder(stream);
        mediaRecorder.ondataavailable = (e)=> recordedChunks.push(e.data);
        mediaRecorder.onstop = ()=>{
          const blob = new Blob(recordedChunks, { type:'audio/webm' });
          recordedBlobUrl = URL.createObjectURL(blob);
          const myDuration = (Date.now() - recordStartTs)/1000;
          const refDuration = quranAudio.duration || 0;
          $('playRecBtn').classList.remove('hidden');
          if(refDuration > 0){
            const diff = Math.abs(myDuration - refDuration);
            const pct = Math.round((1 - diff/Math.max(myDuration, refDuration)) * 100);
            $('recordResult').textContent = `⏱️ تسجيلك ${myDuration.toFixed(1)} ثانية، والشيخ ${refDuration.toFixed(1)} ثانية — تقارب تقريبي في السرعة: ${pct}%`;
          }else{ $('recordResult').textContent = `⏱️ مدة تسجيلك: ${myDuration.toFixed(1)} ثانية (شغّل صوت الشيخ الأول عشان تقدر تقارن)`; }
          stream.getTracks().forEach(t=>t.stop());
        };
        mediaRecorder.start();
        recordStartTs = Date.now();
        $('startRecBtn').classList.add('hidden');
        $('stopRecBtn').classList.remove('hidden');
      }catch(e){ $('recordResult').textContent = '⚠️ محتاج تسمح باستخدام الميكروفون'; }
    });
  });
}, 'تسجيل وقارن');

/* ===================================================================
   السحب (Swipe) لتقليب صفحات المصحف
=================================================================== */
safe(()=>{
  let touchStartX = 0, touchStartY = 0, isSwipe = false;
  mushafPage.addEventListener('touchstart', (e)=>{
    if(e.touches.length !== 1) return;
    touchStartX = e.touches[0].clientX; touchStartY = e.touches[0].clientY; isSwipe = false;
  }, {passive:true});
  mushafPage.addEventListener('touchmove', (e)=>{
    if(e.touches.length !== 1) return;
    const dx = e.touches[0].clientX - touchStartX, dy = e.touches[0].clientY - touchStartY;
    if(Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy) * 1.5) isSwipe = true;
  }, {passive:true});
  mushafPage.addEventListener('touchend', (e)=>{
    if(!isSwipe) return;
    const dx = (e.changedTouches[0].clientX - touchStartX);
    if(dx < -60){ openPage(currentPage<TOTAL_PAGES ? currentPage+1 : 1); }
    else if(dx > 60){ openPage(currentPage>1 ? currentPage-1 : TOTAL_PAGES); }
    setTimeout(()=> isSwipe = false, 300);
  }, {passive:true});
  mushafPage.addEventListener('click', (e)=>{ if(isSwipe) e.stopImmediatePropagation(); }, true);
}, 'السحب بين الصفحات');

/* ===================================================================
   تتبّع إتمام قراءة/استماع كل سورة، وإصدار شهادة ختم القرآن تلقائيًا
=================================================================== */
const COMPLETED_SURAHS_KEY = 'quran-completed-surahs';
function getCompletedSurahs(){ try{ return JSON.parse(localStorage.getItem(COMPLETED_SURAHS_KEY) || '[]'); }catch(e){ return []; } }
function markSurahCompleted(id){
  const list = getCompletedSurahs();
  if(!list.includes(id)) list.push(id);
  localStorage.setItem(COMPLETED_SURAHS_KEY, JSON.stringify(list));
  return list.length;
}
const MOTIVATION_MESSAGES = [
  '🌿 بارك الله فيك، كل حرف بعشر حسنات!',
  '✨ استمر، القلب اللي يألف القرآن ينوّر',
  '🤍 "خيركم من تعلم القرآن وعلّمه"',
  '📖 خطوة كمان في طريق الحفظ والفهم',
  '🌙 اللهم اجعل القرآن ربيع قلبك'
];
quranAudio.addEventListener('ended', ()=>{
  const count = markSurahCompleted(currentChapter);
  const banner = $('completionBanner');
  if(count >= 114){
    if(banner){
      banner.classList.remove('hidden');
      banner.innerHTML = `🎉 مبروك! ختمت المصحف الشريف كامل استماعًا. <button class="btn small primary" id="showQuranCertBtn">🏆 شهادتك</button>`;
      $('showQuranCertBtn')?.addEventListener('click', ()=>{
        const name = prompt('اكتب اسمك عشان يظهر في الشهادة:', localStorage.getItem('cert-name') || '') || 'المستخدم';
        localStorage.setItem('cert-name', name);
        showCertificateModal({ title: 'شهادة ختم القرآن الكريم', subtitle: 'أتم قراءة/استماع المصحف الشريف كاملًا عبر الموقع الإسلامي الشامل', name });
      });
    }
  }else if(banner && count > 0 && count % 10 === 0){
    banner.classList.remove('hidden');
    banner.innerHTML = `📖 وصلت لـ ${toEasternDigits(count)} سورة مكتملة من ١١٤، استمر! 💪`;
    setTimeout(()=> banner.classList.add('hidden'), 6000);
  }else if(!continuousAll){
    showToast(MOTIVATION_MESSAGES[Math.floor(Math.random()*MOTIVATION_MESSAGES.length)], 3500);
  }
});
quranAudio.addEventListener('ended', ()=>{
  if(continuousAll){
    const next = currentChapter < 114 ? currentChapter+1 : 1;
    openSurah(next).then(()=>{ quranAudio.play().catch(()=>{}); });
  }
});

/* ===================================================================
   وضع التسميع: بيغطّي نص الآيات عشان تسمّع من حفظك. فيه طريقتان للتأكد:
   1) تدوس على الآية بإيدك تكشفها.
   2) تدوس "ابدأ الاستماع لصوتي" والموقع يسمعك فعليًا (متصفح Chrome يدعم
      التعرف على الصوت العربي) ويكشف الآية لوحده لو قريتها قريب من الصح.
   ملحوظة مهمة: التعرف على الصوت في المتصفح تقريبي بيقارن الكلمات مش
   تلاوة/تجويد، يعني ممكن يخطّئك أو يصحّحك بالغلط أحيانًا — استخدمه كمساعد
   مش كحكم نهائي، وأفضل طريقة للتأكد الحقيقي هي الكشف اليدوي أو مُحفِّظ حقيقي.
=================================================================== */
safe(()=>{
  const tasmeeBtn = $('tasmeeToggleBtn');
  const tasmeeHint = $('tasmeeHint');
  const listenBar = $('tasmeeListenBar');
  const listenBtn = $('tasmeeListenBtn');
  const listenStatus = $('tasmeeListenStatus');

  function normalizeArabic(s){
    return (s || '')
      .replace(/[\u064B-\u0652\u0670\u0640]/g, '')   // تشكيل وتطويل
      .replace(/[إأآٱا]/g, 'ا')
      .replace(/ى/g, 'ي')
      .replace(/ؤ/g, 'و')
      .replace(/ئ/g, 'ي')
      .replace(/ة/g, 'ه')
      .replace(/[^\u0621-\u064A\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }
  function wordOverlapScore(said, target){
    const sw = normalizeArabic(said).split(' ').filter(Boolean);
    const tw = normalizeArabic(target).split(' ').filter(Boolean);
    if(!sw.length || !tw.length) return 0;
    const sSet = new Set(sw);
    const matched = tw.filter(w=> sSet.has(w)).length;
    return matched / tw.length;
  }

  tasmeeBtn?.addEventListener('click', ()=>{
    const on = mushafPage.classList.toggle('tasmee-mode');
    tasmeeBtn.classList.toggle('primary', on);
    tasmeeBtn.textContent = on ? '👁️ إنهاء وضع التسميع' : '🎙️ وضع التسميع';
    tasmeeHint?.classList.toggle('hidden', !on);
    listenBar?.classList.toggle('hidden', !on);
    mushafPage.querySelectorAll('.ayah.revealed').forEach(el=> el.classList.remove('revealed'));
    if(!on){ stopListening(); }
    showToast(on ? '🎙️ اتغطّى النص، سمّع من حفظك ودوس على أي آية تكشفها، أو استخدم الاستماع لصوتك' : '👁️ رجع النص يبان عادي');
  });

  /* ---------------- الاستماع الفعلي لصوت المستخدم ---------------- */
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  let recognizer = null;
  let listening = false;

  function nextUnrevealedAyah(){
    return mushafPage.querySelector('.ayah:not(.revealed)');
  }

  function stopListening(){
    if(recognizer){ try{ recognizer.stop(); }catch(e){} }
    listening = false;
    if(listenBtn) listenBtn.textContent = '🎤 ابدأ الاستماع لصوتي';
    if(listenStatus) listenStatus.textContent = '';
  }

  listenBtn?.addEventListener('click', ()=>{
    if(!SR){
      showToast('⚠️ متصفحك مش بيدعم التعرف على الصوت، جرب Chrome على الموبايل أو الكمبيوتر');
      return;
    }
    if(listening){ stopListening(); return; }

    const target = nextUnrevealedAyah();
    if(!target){
      showToast('✅ خلصت آيات الصفحة دي كلها، قلّب صفحة وكمّل');
      return;
    }

    recognizer = new SR();
    recognizer.lang = 'ar-SA';
    recognizer.continuous = true;
    recognizer.interimResults = true;

    recognizer.onresult = (e)=>{
      let said = '';
      for(let i=0; i<e.results.length; i++) said += e.results[i][0].transcript + ' ';
      const cur = nextUnrevealedAyah();
      if(!cur) return;
      const score = wordOverlapScore(said, cur.textContent);
      if(listenStatus) listenStatus.textContent = `🎧 بسمعك... (تطابق ${Math.round(score*100)}%)`;
      if(score >= 0.55){
        cur.classList.add('revealed', 'tasmee-correct');
        showToast('✅ تمام! كمّل اللي بعدها');
        const next = nextUnrevealedAyah();
        if(!next){
          showToast('🎉 خلصت آيات الصفحة دي من حفظك، ما شاء الله!');
          stopListening();
        }
      }
    };
    recognizer.onerror = (e)=>{
      if(e.error === 'not-allowed' || e.error === 'permission-denied'){
        showToast('⚠️ محتاج تسمح للموقع باستخدام المايك عشان الخاصية دي تشتغل');
      }
      stopListening();
    };
    recognizer.onend = ()=>{ if(listening) stopListening(); };

    try{
      recognizer.start();
      listening = true;
      listenBtn.textContent = '⏹️ إيقاف الاستماع';
      if(listenStatus) listenStatus.textContent = '🎧 بسمعك...';
    }catch(e){
      showToast('⚠️ تعذر تشغيل المايك');
    }
  });
}, 'وضع التسميع');

/* ---------------- البدء ---------------- */
loadChapters().then(()=>{ if(location.search.includes('surah=')) safe(openFromFavoriteLink, 'فتح آية من المفضلة'); });
loadReciters();
