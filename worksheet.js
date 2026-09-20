/* ===================================================================
   ورقة عمل للطباعة - worksheet.js
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

const toastBox = $('toastBox');
function showToast(msg, duration=4000){
  toastBox.textContent = msg;
  toastBox.classList.add('show');
  clearTimeout(showToast._t);
  showToast._t = setTimeout(()=> toastBox.classList.remove('show'), duration);
}

const EASTERN_DIGITS = ['٠','١','٢','٣','٤','٥','٦','٧','٨','٩'];
function toEasternDigits(n){ return String(n).split('').map(c=> /[0-9]/.test(c) ? EASTERN_DIGITS[+c] : c).join(''); }

const API = 'https://api.quran.com/api/v4';
let chapters = [];
let selectedSurahs = new Set();
let selectedAzkar = new Set();
let mode = 'quran';

/* ---------------- تبويب المصدر ---------------- */
$('tabQuranBtn').addEventListener('click', ()=>{
  mode = 'quran';
  $('tabQuranBtn').classList.add('primary'); $('tabAzkarBtn').classList.remove('primary');
  $('quranPicker').classList.remove('hidden'); $('azkarPicker').classList.add('hidden');
  updatePickCount();
});
$('tabAzkarBtn').addEventListener('click', ()=>{
  mode = 'azkar';
  $('tabAzkarBtn').classList.add('primary'); $('tabQuranBtn').classList.remove('primary');
  $('azkarPicker').classList.remove('hidden'); $('quranPicker').classList.add('hidden');
  updatePickCount();
});

function updatePickCount(){
  const n = mode === 'quran' ? selectedSurahs.size : selectedAzkar.size;
  $('pickCount').textContent = n ? `اخترت ${toEasternDigits(n)} عنصر` : '';
}

/* ---------------- قائمة السور ---------------- */
async function loadChapters(){
  try{
    const cached = localStorage.getItem('quran-chapters-v1');
    if(cached){ chapters = JSON.parse(cached); renderSurahPick(chapters); }
    const res = await fetch(`${API}/chapters?language=ar`);
    const data = await res.json();
    chapters = data.chapters.map(c=>({ id:c.id, name_arabic:c.name_arabic, verses_count:c.verses_count }));
    localStorage.setItem('quran-chapters-v1', JSON.stringify(chapters));
    renderSurahPick(chapters);
  }catch(e){
    if(!chapters.length) $('surahPickGrid').innerHTML = '<div>⚠️ تعذر تحميل قائمة السور، تأكد من الإنترنت.</div>';
  }
}
function renderSurahPick(list){
  $('surahPickGrid').innerHTML = list.map(ch=>`
    <div class="pick-item ${selectedSurahs.has(ch.id)?'selected':''}" data-id="${ch.id}">
      <input type="checkbox" ${selectedSurahs.has(ch.id)?'checked':''}> ${ch.name_arabic}
    </div>`).join('');
  document.querySelectorAll('#surahPickGrid .pick-item').forEach(el=>{
    el.addEventListener('click', ()=>{
      const id = +el.dataset.id;
      if(selectedSurahs.has(id)) selectedSurahs.delete(id); else selectedSurahs.add(id);
      el.classList.toggle('selected');
      el.querySelector('input').checked = selectedSurahs.has(id);
      updatePickCount();
    });
  });
}
$('surahSearchWs').addEventListener('input', (e)=>{
  const q = e.target.value.trim();
  renderSurahPick(q ? chapters.filter(c=> c.name_arabic.includes(q) || String(c.id)===q) : chapters);
});

/* ---------------- قائمة الأذكار ---------------- */
function renderAzkarPick(){
  $('azkarPickGrid').innerHTML = azkarCategories.map(cat=>`
    <div class="pick-item ${selectedAzkar.has(cat.id)?'selected':''}" data-id="${cat.id}">
      <input type="checkbox" ${selectedAzkar.has(cat.id)?'checked':''}> ${cat.emoji} ${cat.name}
    </div>`).join('');
  document.querySelectorAll('#azkarPickGrid .pick-item').forEach(el=>{
    el.addEventListener('click', ()=>{
      const id = el.dataset.id;
      if(selectedAzkar.has(id)) selectedAzkar.delete(id); else selectedAzkar.add(id);
      el.classList.toggle('selected');
      el.querySelector('input').checked = selectedAzkar.has(id);
      updatePickCount();
    });
  });
}

/* ---------------- بناء الورقة ---------------- */
async function buildWorksheet(){
  const preview = $('worksheetPreview');
  if(mode === 'quran'){
    if(!selectedSurahs.size){ showToast('اختار سورة واحدة على الأقل'); return; }
    preview.innerHTML = '<div class="ws-block">⏳ جاري تجهيز الورقة...</div>';
    let html = `<div class="ws-header"><div class="ws-title">ورقة عمل — آيات من القرآن الكريم</div><div class="ws-sub">الموقع الإسلامي الشامل</div></div>`;
    for(const id of selectedSurahs){
      const ch = chapters.find(c=>c.id===id);
      let verses;
      try{
        const cacheKey = 'quran-text-v1-'+id;
        const cached = localStorage.getItem(cacheKey);
        if(cached) verses = JSON.parse(cached);
        else{
          const res = await fetch(`${API}/verses/by_chapter/${id}?language=ar&words=false&fields=text_uthmani&per_page=300`);
          const data = await res.json();
          verses = data.verses;
          localStorage.setItem(cacheKey, JSON.stringify(verses));
        }
      }catch(e){ continue; }
      const text = verses.map(v=> v.text_uthmani + ' ' + toEasternDigits(v.verse_number)).join(' ');
      html += `<div class="ws-block"><h3>سورة ${ch?ch.name_arabic:id}</h3><div class="ws-ayat">${text}</div></div>`;
    }
    html += `<div class="ws-footer">تم إنشاء هذه الورقة عبر الموقع الإسلامي الشامل — ${new Date().toLocaleDateString('ar-EG')}</div>`;
    preview.innerHTML = html;
  }else{
    if(!selectedAzkar.size){ showToast('اختار فئة أذكار واحدة على الأقل'); return; }
    let html = `<div class="ws-header"><div class="ws-title">ورقة عمل — أذكار</div><div class="ws-sub">الموقع الإسلامي الشامل</div></div>`;
    selectedAzkar.forEach(catId=>{
      const cat = azkarCategories.find(c=>c.id===catId);
      if(!cat) return;
      html += `<div class="ws-block"><h3>${cat.emoji} ${cat.name}</h3>`;
      cat.items.forEach(item=>{
        const rep = item.repeat || item.count || 1;
        html += `<div class="ws-zekr-item">${item.text} <span class="rep">(${toEasternDigits(rep)}×)</span></div>`;
      });
      html += `</div>`;
    });
    html += `<div class="ws-footer">تم إنشاء هذه الورقة عبر الموقع الإسلامي الشامل — ${new Date().toLocaleDateString('ar-EG')}</div>`;
    preview.innerHTML = html;
  }
  $('builderPanel').classList.add('hidden');
  $('printActions').style.display = 'flex';
  window.scrollTo({top:0, behavior:'smooth'});
}

$('buildBtn').addEventListener('click', buildWorksheet);
$('printBtn').addEventListener('click', ()=> window.print());
$('backToBuilderBtn').addEventListener('click', ()=>{
  $('builderPanel').classList.remove('hidden');
  $('printActions').style.display = 'none';
  $('worksheetPreview').innerHTML = '';
});

renderAzkarPick();
loadChapters();
