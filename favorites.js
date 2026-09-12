function $(id){ return document.getElementById(id); }
function safe(fn, label){ try{ fn(); }catch(e){ console.error('خطأ في: '+label, e); } }

const body = document.body;
const FAV_KEY = 'quran-favorites';

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

/* ---------------- صوت النقر ---------------- */
const audioClick = $('audioClick');
function playClick(){
  if(window.siteSettings && !window.siteSettings.soundEnabled()) return;
  try{ audioClick.currentTime = 0; audioClick.play().catch(()=>{}); }catch(e){}
}
document.addEventListener('click', (e)=>{ if(e.target.closest('button,a')) playClick(); });

const toastBox = $('toastBox');
function showToast(msg, duration=3000){
  if(!toastBox) return;
  toastBox.textContent = msg;
  toastBox.classList.add('show');
  clearTimeout(showToast._t);
  showToast._t = setTimeout(()=> toastBox.classList.remove('show'), duration);
}

const EASTERN_DIGITS = ['٠','١','٢','٣','٤','٥','٦','٧','٨','٩'];
function toEasternDigits(n){ return String(n).split('').map(c=> /[0-9]/.test(c) ? EASTERN_DIGITS[+c] : c).join(''); }

function getFavorites(){
  try{ return JSON.parse(localStorage.getItem(FAV_KEY) || '[]'); }catch(e){ return []; }
}
function saveFavorites(list){ localStorage.setItem(FAV_KEY, JSON.stringify(list)); }

const favContainer = $('favContainer');
const favCount = $('favCount');

function render(){
  const list = getFavorites().slice().sort((a,b)=> (a.ts||0) - (b.ts||0));
  if(!list.length){
    favCount.textContent = '';
    favContainer.innerHTML = `
      <div class="fav-empty">
        <div class="big-emoji">⭐</div>
        <p>لسه معندكش أي آية في المفضلة.</p>
        <p style="margin-top:6px;">افتح <a href="quran.html" style="color:var(--gold-bright); text-decoration:underline;">المصحف الشريف</a>، دوس على أي آية، واضغط "إضافة للمفضلة".</p>
      </div>`;
    return;
  }
  favCount.textContent = `📌 عدد الآيات المحفوظة: ${toEasternDigits(list.length)}`;
  favContainer.innerHTML = `<div class="fav-list">${list.map(f=>`
    <div class="fav-card" data-key="${f.verseKey}">
      <div class="fav-text">${f.text}</div>
      <div class="fav-source">سورة ${f.surahName || ''} — آية ${toEasternDigits(f.verseNumber || '')}</div>
      <div class="fav-actions">
        <button class="btn small primary" data-action="open">📖 فتح في المصحف</button>
        <button class="btn small" data-action="copy">📋 نسخ</button>
        <button class="btn small danger" data-action="remove">🗑️ إزالة</button>
      </div>
    </div>`).join('')}</div>`;
}
render();

/* ---------------- التبويبات: آيات / سور ---------------- */
safe(()=>{
  const tabs = [...document.querySelectorAll('.fav-tab')];
  const panels = { verses: $('versesTab'), surahs: $('surahsTab'), names: $('namesTab') };
  tabs.forEach(t=> t.addEventListener('click', ()=>{
    tabs.forEach(x=> x.classList.remove('active'));
    t.classList.add('active');
    Object.values(panels).forEach(p=> p.classList.add('hidden'));
    panels[t.dataset.tab].classList.remove('hidden');
  }));
}, 'تبويبات المفضلة');

/* ---------------- أسماء الله الحسنى المفضّلة ---------------- */
safe(()=>{
  const FAV_NAMES_KEY = 'asma-favorite-names';
  function getFavIdxs(){ try{ return JSON.parse(localStorage.getItem(FAV_NAMES_KEY) || '[]'); }catch(e){ return []; } }
  const container = $('favNameContainer');
  const countEl = $('favNameCount');

  function render(){
    const idxs = getFavIdxs();
    if(typeof asmaAlHusna === 'undefined' || !idxs.length){
      countEl.textContent = '';
      container.innerHTML = `
        <div class="fav-empty">
          <div class="big-emoji">🌙</div>
          <p>لسه معندكش أسماء محفوظة في المفضلة.</p>
          <p style="margin-top:6px;">افتح <a href="asma.html" style="color:var(--gold-bright); text-decoration:underline;">أسماء الله الحسنى</a> ودوس على النجمة ☆ جنب أي اسم.</p>
        </div>`;
      return;
    }
    countEl.textContent = `🌙 عدد الأسماء المحفوظة: ${toEasternDigits(idxs.length)}`;
    container.innerHTML = `<div class="fav-list">${idxs.map(i=>{
      const item = asmaAlHusna[i];
      if(!item) return '';
      return `
      <div class="fav-card" data-idx="${i}">
        <div class="fav-text" style="font-family:var(--font-display); font-size:1.3rem;">${item.name}</div>
        <div class="fav-source">${item.meaning}</div>
        <div class="fav-actions">
          <button class="btn small primary" data-action="open">📖 فتح في الصفحة</button>
          <button class="btn small danger" data-action="remove">🗑️ إزالة</button>
        </div>
      </div>`;
    }).join('')}</div>`;
  }
  render();

  container.addEventListener('click', (e)=>{
    const btn = e.target.closest('button[data-action]');
    if(!btn) return;
    const card = e.target.closest('.fav-card');
    const i = parseInt(card?.dataset.idx, 10);
    if(btn.dataset.action === 'open'){
      location.href = 'asma.html';
    }else if(btn.dataset.action === 'remove'){
      const list = getFavIdxs().filter(x=> x !== i);
      localStorage.setItem(FAV_NAMES_KEY, JSON.stringify(list));
      showToast('🗑️ تمت إزالة الاسم من المفضلة');
      render();
    }
  });
}, 'أسماء الله الحسنى المفضلة');

/* ---------------- السور المفضّلة ---------------- */
safe(()=>{
  const FAV_SURAHS_KEY = 'quran-favorite-surahs';
  function getFavSurahIds(){ try{ return JSON.parse(localStorage.getItem(FAV_SURAHS_KEY) || '[]'); }catch(e){ return []; } }
  const surahContainer = $('favSurahContainer');
  const surahCount = $('favSurahCount');

  async function renderFavSurahs(){
    const ids = getFavSurahIds();
    if(!ids.length){
      surahCount.textContent = '';
      surahContainer.innerHTML = `
        <div class="fav-empty">
          <div class="big-emoji">💛</div>
          <p>لسه معندكش أي سورة في المفضلة.</p>
          <p style="margin-top:6px;">افتح <a href="quran.html" style="color:var(--gold-bright); text-decoration:underline;">المصحف الشريف</a> ودوس على النجمة ☆ جنب اسم أي سورة تحبها.</p>
        </div>`;
      return;
    }
    let chapters = [];
    try{ chapters = JSON.parse(localStorage.getItem('quran-chapters-v1') || '[]'); }catch(e){}
    surahCount.textContent = `💛 عدد السور المحفوظة: ${toEasternDigits(ids.length)}`;
    surahContainer.innerHTML = `<div class="fav-list">${ids.map(id=>{
      const ch = chapters.find(c=> c.id === id);
      const name = ch ? ch.name_arabic : ('سورة رقم ' + toEasternDigits(id));
      return `
      <div class="fav-card" data-id="${id}">
        <div class="fav-text" style="font-family:var(--font-display); font-size:1.2rem;">${name}</div>
        <div class="fav-actions">
          <button class="btn small primary" data-action="open">📖 فتح السورة</button>
          <button class="btn small danger" data-action="remove">🗑️ إزالة</button>
        </div>
      </div>`;
    }).join('')}</div>`;
  }
  renderFavSurahs();

  surahContainer.addEventListener('click', (e)=>{
    const btn = e.target.closest('button[data-action]');
    if(!btn) return;
    const card = e.target.closest('.fav-card');
    const id = parseInt(card?.dataset.id, 10);
    if(btn.dataset.action === 'open'){
      location.href = `quran.html?surah=${id}`;
    }else if(btn.dataset.action === 'remove'){
      const list = getFavSurahIds().filter(x=> x !== id);
      localStorage.setItem(FAV_SURAHS_KEY, JSON.stringify(list));
      showToast('🗑️ تمت إزالة السورة من المفضلة');
      renderFavSurahs();
    }
  });
}, 'السور المفضلة');

favContainer.addEventListener('click', (e)=>{
  const btn = e.target.closest('button[data-action]');
  if(!btn) return;
  const card = e.target.closest('.fav-card');
  const key = card?.dataset.key;
  const list = getFavorites();
  const item = list.find(f=> f.verseKey === key);
  if(!item) return;

  if(btn.dataset.action === 'open'){
    location.href = `quran.html?surah=${item.surahId}&verse=${item.verseNumber}`;
  }
  else if(btn.dataset.action === 'copy'){
    const text = `${item.text} — سورة ${item.surahName}، آية ${item.verseNumber}`;
    if(navigator.clipboard && navigator.clipboard.writeText){
      navigator.clipboard.writeText(text).then(()=> showToast('✅ تم نسخ الآية')).catch(()=> showToast('⚠️ تعذر النسخ'));
    }else{
      showToast('⚠️ النسخ التلقائي مش مدعوم في هذا المتصفح');
    }
  }
  else if(btn.dataset.action === 'remove'){
    const updated = list.filter(f=> f.verseKey !== key);
    saveFavorites(updated);
    showToast('🗑️ تمت إزالة الآية من المفضلة');
    render();
  }
});
