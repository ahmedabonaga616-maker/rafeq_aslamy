/* ===================================================================
   المصحف الشريف - quran.js
   نص الآيات (الرسم العثماني): Quran.com API v4
   القراء + الصوتيات: mp3quran.net API v3 (مصدر عام موحّد، بدون تسجيل دخول،
   وبروابط تحميل ثابتة) — تم الاعتماد عليه بدل chapter_recitations القديم
   لأن الأخير بقى محتاج مصادقة (OAuth) من Quran Foundation وبقى يفشل بشكل
   متقطّع ويظهر رسالة "تأكد من الإنترنت" حتى لو الاتصال سليم.
=================================================================== */
function $(id){ return document.getElementById(id); }
function safe(fn, label){ try{ fn(); }catch(e){ console.error('خطأ في: '+label, e); } }

const body = document.body;
const API = 'https://api.quran.com/api/v4';
const MP3API = 'https://www.mp3quran.net/api/v3';

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
  const el = e.target.closest('.btn, .round-btn, .surah-card');
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

/* أرقام عربية شرقية (١٢٣) للاستخدام في نهايات الآيات */
const EASTERN_DIGITS = ['٠','١','٢','٣','٤','٥','٦','٧','٨','٩'];
function toEasternDigits(n){ return String(n).split('').map(c=> /[0-9]/.test(c) ? EASTERN_DIGITS[+c] : c).join(''); }

/* ---------------- الحالة العامة ---------------- */
let chapters = [];        // كل السور (114)
let reciters = [];        // كل القراء (خام من mp3quran)
let reciterMoshafMap = {}; // id القارئ -> { name, moshaf: {server, surah_list,...} }
let currentChapter = 1;
let currentReciterId = null;
let currentTimestamps = []; // توقيتات السورة الحالية (تظليل كلمة بكلمة، لو متاحة)
let continuousAll = false;
let selectedAyahEl = null; // الآية المختارة بالضغط عليها (لنسخها)

const quranAudio = $('quranAudio');
const surahListScreen = $('surahListScreen');
const readerScreen = $('readerScreen');
const surahGrid = $('surahGrid');
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

/* ---------------- تحميل قائمة السور ---------------- */
async function loadChapters(){
  try{
    const cached = localStorage.getItem('quran-chapters-v1');
    if(cached){ chapters = JSON.parse(cached); renderSurahGrid(chapters); renderResumeBanner(); }
    const res = await fetch(`${API}/chapters?language=ar`);
    const data = await res.json();
    chapters = data.chapters;
    localStorage.setItem('quran-chapters-v1', JSON.stringify(chapters));
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
    const {chapter} = JSON.parse(raw);
    const ch = chapters.find(c=>c.id===chapter);
    if(!ch){ resumeBanner.classList.add('hidden'); return; }
    resumeBanner.innerHTML = `📖 كمّل من حيث وقفت: <b>سورة ${ch.name_arabic}</b> <button class="btn small primary" id="resumeReadingBtn">متابعة القراءة</button>`;
    resumeBanner.classList.remove('hidden');
    $('resumeReadingBtn')?.addEventListener('click', ()=> openSurah(chapter));
  }catch(e){ resumeBanner.classList.add('hidden'); }
}

/* ---------------- السور المفضّلة (سورة كاملة، منفصلة عن الآيات المفضّلة) ---------------- */
const FAV_SURAHS_KEY = 'quran-favorite-surahs';
function getFavSurahs(){ try{ return JSON.parse(localStorage.getItem(FAV_SURAHS_KEY) || '[]'); }catch(e){ return []; } }
function isFavSurah(id){ return getFavSurahs().includes(id); }
function toggleFavSurah(id){
  const list = getFavSurahs();
  const idx = list.indexOf(id);
  if(idx >= 0) list.splice(idx, 1); else list.push(id);
  localStorage.setItem(FAV_SURAHS_KEY, JSON.stringify(list));
  return idx < 0; // true لو دلوقتي بقت مفضّلة
}
let showFavSurahsOnly = false;

function renderSurahGrid(list){
  surahGrid.innerHTML = '';
  const shown = showFavSurahsOnly ? list.filter(ch => isFavSurah(ch.id)) : list;
  if(showFavSurahsOnly && !shown.length){
    surahGrid.innerHTML = '<div class="loading-box">⭐ لسه معندكش سور في المفضلة. دوس على النجمة اللي جنب أي سورة عشان تضيفها.</div>';
    return;
  }
  shown.forEach((ch, idx)=>{
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

/* ---------------- تحميل قائمة القراء (mp3quran.net) ---------------- */
function buildReciterMap(){
  reciterMoshafMap = {};
  reciters.forEach(r=>{
    if(!r.moshaf || !r.moshaf.length) return;
    // نفضّل رواية حفص عن عاصم - مرتل (moshaf_type=11) لأنها الأشهر، وإلا أول رواية متاحة
    const hafs = r.moshaf.find(m=> m.moshaf_type === 11) || r.moshaf.find(m=> /مرتل/.test(m.name||'')) || r.moshaf[0];
    reciterMoshafMap[r.id] = { name: r.name, moshaf: hafs };
  });
}

let reciterIdsSorted = [];

/* -------- قائمة القراء: قائمة معروضة ثابتة داخل الصفحة + بحث، بدل قائمة منسدلة تتحرك -------- */
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
  if(!ids.length){
    reciterList.innerHTML = '<div class="reciter-empty">لا يوجد قارئ بهذا الاسم</div>';
    return;
  }
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
  if(!ids.length){
    reciterCurrentName.textContent = 'تعذر تحميل قائمة القراء';
    recitersRetryBtn?.classList.remove('hidden');
    return;
  }
  recitersRetryBtn?.classList.add('hidden');
  // القراء الأشهر أول القايمة عشان يبانوا بسرعة
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
  if(cached){
    try{ reciters = JSON.parse(cached); buildReciterMap(); renderReciterSelect(); }catch(e){}
  }
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
    if(!reciters.length){
      reciterCurrentName.textContent = 'تعذر تحميل قائمة القراء';
      recitersRetryBtn?.classList.remove('hidden');
    }
  }
}
recitersRetryBtn?.addEventListener('click', loadReciters);

/* فتح/قفل قائمة القراء المعروضة (ثابتة في الصفحة، مش قائمة منسدلة عائمة) */
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
    if(!reciterPicker.contains(e.target)){
      reciterPanel.classList.add('hidden');
      reciterPicker.classList.remove('open');
    }
  });
}, 'قائمة القراء');

/* ---------------- فتح سورة معيّنة ---------------- */
async function openSurah(id){
  currentChapter = id;
  surahListScreen.classList.add('hidden');
  readerScreen.classList.remove('hidden');
  window.scrollTo({top:0, behavior:'auto'});
  mushafPage.innerHTML = '<div class="loading-box">⏳ جاري تحميل السورة...</div>';
  quranAudio.pause();
  ayahActionBar?.classList.add('hidden');
  selectedAyahEl = null;
  await loadSurahText(id);
  await loadAudioForCurrentSurah(false);
  localStorage.setItem('quran-last-read', JSON.stringify({chapter:id, ts:Date.now()}));
}

$('backToListBtn')?.addEventListener('click', ()=>{
  quranAudio.pause();
  readerScreen.classList.add('hidden');
  surahListScreen.classList.remove('hidden');
});
$('prevSurahBtn')?.addEventListener('click', ()=> openSurah(currentChapter>1 ? currentChapter-1 : 114));
$('nextSurahBtn')?.addEventListener('click', ()=> openSurah(currentChapter<114 ? currentChapter+1 : 1));

/* ---------------- تحميل نص السورة (الرسم العثماني) ---------------- */
async function loadSurahText(id){
  const ch = chapters.find(c=>c.id===id) || {name_arabic:'', id};
  const cacheKey = 'quran-text-v1-'+id;
  let verses;
  try{
    const cached = localStorage.getItem(cacheKey);
    if(cached){ verses = JSON.parse(cached); }
    else{
      const res = await fetch(`${API}/verses/by_chapter/${id}?language=ar&words=false&fields=text_uthmani&per_page=300`);
      const data = await res.json();
      verses = data.verses;
      localStorage.setItem(cacheKey, JSON.stringify(verses));
    }
  }catch(e){
    mushafPage.innerHTML = '<div class="loading-box">⚠️ تعذر تحميل نص السورة، تأكد من الاتصال بالإنترنت.<br><button class="btn small" id="retryTextBtn" style="margin-top:10px;">🔄 إعادة المحاولة</button></div>';
    $('retryTextBtn')?.addEventListener('click', ()=> loadSurahText(id));
    return;
  }

  const needsBasmala = id !== 1 && id !== 9;
  let html = `<div class="surah-frame"><div class="name">سورة ${ch.name_arabic}</div>
    <div class="sub">${ch.revelation_place==='makkah'?'مكية':'مدنية'} · عدد آياتها ${toEasternDigits(ch.verses_count||verses.length)}</div></div>`;
  if(needsBasmala) html += `<div class="basmala">بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</div>`;
  html += `<div class="ayat-block" id="ayatBlock">`;
  verses.forEach(v=>{
    let text = v.text_uthmani;
    // البسملة موجودة جوه أول آية في كل سورة غير التوبة والفاتحة، وإحنا عارضينها لوحدها فوق، فمنشيلهاش من النص الأصلي عشان الترقيم يفضل صحيح
    const words = text.split(' ').map((w,i)=> `<span class="word" data-pos="${i+1}">${w}</span>`).join(' ');
    html += `<span class="ayah" data-verse="${v.verse_key}">${words} <span class="ayah-end">${toEasternDigits(v.verse_number)}</span></span> `;
  });
  html += `</div>`;
  mushafPage.innerHTML = html;
}

/* ---------------- تحميل الصوت (رابط ثابت مباشر من mp3quran.net، بدون أي طلب شبكة) ---------------- */
async function loadAudioForCurrentSurah(autoplay){
  if(!currentReciterId) return;
  dlProgress.textContent = '';
  currentTimestamps = []; // المصدر الجديد مفيهوش توقيتات كلمة بكلمة، فالتظليل أثناء التلاوة بقى يدوي (بالضغط على الآية)
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
  if(quranAudio.paused){ quranAudio.play().catch(()=>{}); }
  else{ quranAudio.pause(); }
});
quranAudio.addEventListener('play', ()=> playPauseBtn.textContent = '⏸️');
quranAudio.addEventListener('pause', ()=> playPauseBtn.textContent = '▶️');

quranAudio.addEventListener('loadedmetadata', ()=>{
  seekBar.max = quranAudio.duration || 0;
  durTimeEl.textContent = fmtTime(quranAudio.duration);
});
seekBar?.addEventListener('input', ()=>{ quranAudio.currentTime = seekBar.value; });

let lastActiveVerse = null;
quranAudio.addEventListener('timeupdate', ()=>{
  curTimeEl.textContent = fmtTime(quranAudio.currentTime);
  if(!seekBar.matches(':active')) seekBar.value = quranAudio.currentTime;
  highlightAtTime(quranAudio.currentTime * 1000);
});

function highlightAtTime(ms){
  if(!currentTimestamps.length) return;
  const entry = currentTimestamps.find(t=> ms >= t.from && ms < t.to);
  if(!entry) return;
  if(entry.verse_key !== lastActiveVerse){
    document.querySelectorAll('.ayah.active-ayah').forEach(el=> el.classList.remove('active-ayah'));
    const ayahEl = mushafPage.querySelector(`.ayah[data-verse="${entry.verse_key}"]`);
    // ملحوظة: مقصود عمدًا عدم تحريك الصفحة تلقائيًا هنا (scrollIntoView) —
    // التمرير بقى بإيد القارئ نفسه بإصبعه، والآية بتتظلل بس من غير ما تجر الشاشة معاها.
    if(ayahEl) ayahEl.classList.add('active-ayah');
    lastActiveVerse = entry.verse_key;
  }
  document.querySelectorAll('.word.active-word').forEach(el=> el.classList.remove('active-word'));
  if(entry.segments && entry.segments.length){
    const seg = entry.segments.find(s=> ms >= s[1] && ms < s[2]);
    if(seg){
      const ayahEl = mushafPage.querySelector(`.ayah[data-verse="${entry.verse_key}"]`);
      const wordEl = ayahEl && ayahEl.querySelector(`.word[data-pos="${seg[0]}"]`);
      if(wordEl) wordEl.classList.add('active-word');
    }
  }
}

quranAudio.addEventListener('ended', ()=>{
  if(continuousAll){
    const next = currentChapter < 114 ? currentChapter+1 : 1;
    openSurah(next).then(()=>{
      quranAudio.play().catch(()=>{});
    });
  }
});

/* ---------------- التحميل ---------------- */
$('downloadSurahBtn')?.addEventListener('click', ()=>{
  const url = quranAudio.dataset.downloadUrl;
  if(!url){ showToast('⚠️ الصوت لسه ما اتحملش'); return; }
  const ch = chapters.find(c=>c.id===currentChapter);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${currentChapter}-${ch?ch.name_simple:'surah'}.mp3`;
  a.target = '_blank';
  a.rel = 'noopener';
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
  function applyScale(){
    mushafPage.style.setProperty('--ayat-scale', scale);
    localStorage.setItem(KEY, scale);
  }
  applyScale();
  $('fontIncBtn')?.addEventListener('click', ()=>{ scale = Math.min(1.6, +(scale + 0.1).toFixed(2)); applyScale(); });
  $('fontDecBtn')?.addEventListener('click', ()=>{ scale = Math.max(0.7, +(scale - 0.1).toFixed(2)); applyScale(); });
}, 'حجم خط المصحف');

/* ---------------- تلميح "المفضلة" لأول مرة (عشان الميزة تبقى واضحة) ---------------- */
safe(()=>{
  const banner = $('favHintBanner');
  const closeBtn = $('favHintClose');
  if(!banner) return;
  if(localStorage.getItem('quran-fav-hint-seen') !== '1'){
    banner.classList.remove('hidden');
  }
  closeBtn?.addEventListener('click', ()=>{
    banner.classList.add('hidden');
    localStorage.setItem('quran-fav-hint-seen', '1');
  });
}, 'تلميح المفضلة');

/* ---------------- الآيات المفضّلة ---------------- */
const FAV_KEY = 'quran-favorites';
function getFavorites(){
  try{ return JSON.parse(localStorage.getItem(FAV_KEY) || '[]'); }catch(e){ return []; }
}
function saveFavorites(list){ localStorage.setItem(FAV_KEY, JSON.stringify(list)); }
function isFavoriteVerse(verseKey){ return getFavorites().some(f=> f.verseKey === verseKey); }
function toggleFavoriteVerse(verseKey, text){
  const list = getFavorites();
  const idx = list.findIndex(f=> f.verseKey === verseKey);
  if(idx >= 0){ list.splice(idx, 1); saveFavorites(list); return false; }
  const ch = chapters.find(c=> c.id === currentChapter);
  list.push({
    verseKey,
    surahId: currentChapter,
    surahName: ch ? ch.name_arabic : '',
    verseNumber: parseInt((verseKey.split(':')[1] || '0'), 10),
    text,
    ts: Date.now()
  });
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
    }else{
      showToast('⚠️ النسخ التلقائي مش مدعوم في هذا المتصفح');
    }
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

/* ---------------- فتح آية معيّنة قادم من صفحة المفضلة (?surah=..&verse=..) ---------------- */
async function openFromFavoriteLink(){
  const params = new URLSearchParams(location.search);
  const surah = parseInt(params.get('surah'), 10);
  const verse = params.get('verse');
  if(!surah) return;
  await openSurah(surah);
  if(verse){
    const verseKey = `${surah}:${verse}`;
    const ayahEl = mushafPage.querySelector(`.ayah[data-verse="${verseKey}"]`);
    if(ayahEl){
      ayahEl.classList.add('active-ayah');
      selectedAyahEl = ayahEl;
      renderFavBtnState(verseKey);
      if(ayahActionLabel) ayahActionLabel.textContent = 'آية ' + toEasternDigits(verse);
      ayahActionBar?.classList.remove('hidden');
      // تمرير واحد يدوي القصد منه واضح: المستخدم جاي مقصودًا من المفضلة عشان يشوف الآية
      ayahEl.scrollIntoView({behavior:'auto', block:'center'});
    }
  }
}

/* ---------------- البدء ---------------- */
loadChapters().then(()=>{ if(location.search.includes('surah=')) safe(openFromFavoriteLink, 'فتح آية من المفضلة'); });
loadReciters();
