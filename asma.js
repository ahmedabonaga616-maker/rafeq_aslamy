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
const audioAllah = $('audioAllah');
function playClick(){
  if(window.siteSettings && !window.siteSettings.soundEnabled()) return;
  try{ audioClick.currentTime = 0; audioClick.play().catch(()=>{}); }catch(e){}
}
document.addEventListener('click', (e)=>{ if(e.target.closest('button,a')) playClick(); });

safe(()=>{
  const asmaGrid = $('asmaGrid');
  asmaAlHusna.forEach((item, i)=>{
    const card = document.createElement('div');
    card.className = 'asma-card';
    card.dataset.idx = i;
    card.innerHTML = `
      <button class="asma-fav-star" data-idx="${i}" title="إضافة للمفضلة">☆</button>
      <div class="num">${i+1}</div>
      <div class="name">${item.name}</div>
      <div class="mem-badge hidden" title="حفظته">✓</div>`;
    card.querySelector('.asma-fav-star').addEventListener('click', (e)=>{
      e.stopPropagation();
      toggleFavName(i);
      renderGrid();
    });
    card.addEventListener('click', ()=> openModal(item, i));
    asmaGrid.appendChild(card);
  });
  renderGrid();
}, 'عرض الأسماء');

/* ---------------- المفضّلة والحفظ (محفوظين في localStorage) ---------------- */
const FAV_NAMES_KEY = 'asma-favorite-names';
const MEM_NAMES_KEY = 'asma-memorized-names';
function getFavNames(){ try{ return JSON.parse(localStorage.getItem(FAV_NAMES_KEY) || '[]'); }catch(e){ return []; } }
function getMemNames(){ try{ return JSON.parse(localStorage.getItem(MEM_NAMES_KEY) || '[]'); }catch(e){ return []; } }
function isFavName(i){ return getFavNames().includes(i); }
function isMemName(i){ return getMemNames().includes(i); }
function toggleFavName(i){
  const list = getFavNames();
  const idx = list.indexOf(i);
  if(idx >= 0) list.splice(idx, 1); else list.push(i);
  localStorage.setItem(FAV_NAMES_KEY, JSON.stringify(list));
  return idx < 0;
}
function toggleMemName(i){
  const list = getMemNames();
  const idx = list.indexOf(i);
  if(idx >= 0) list.splice(idx, 1); else list.push(i);
  localStorage.setItem(MEM_NAMES_KEY, JSON.stringify(list));
  renderProgress();
  return idx < 0;
}
function renderProgress(){
  safe(()=>{
    const n = getMemNames().length;
    $('memorizedCount').textContent = n;
    $('memorizedFill').style.width = Math.round((n/99)*100) + '%';
  }, 'شريط التقدم');
}
renderProgress();

let showFavOnly = false;
function renderGrid(){
  document.querySelectorAll('.asma-card').forEach(card=>{
    const i = parseInt(card.dataset.idx, 10);
    const fav = isFavName(i);
    const mem = isMemName(i);
    const star = card.querySelector('.asma-fav-star');
    star.textContent = fav ? '⭐' : '☆';
    star.classList.toggle('active', fav);
    card.querySelector('.mem-badge').classList.toggle('hidden', !mem);
    card.classList.toggle('is-memorized', mem);
    card.classList.toggle('filtered-out', showFavOnly && !fav);
  });
}
safe(()=>{
  const btn = $('favAsmaFilterBtn');
  btn.addEventListener('click', ()=>{
    showFavOnly = !showFavOnly;
    btn.classList.toggle('primary', showFavOnly);
    btn.textContent = showFavOnly ? '📜 كل الأسماء' : '💛 المفضّلة';
    renderGrid();
  });
}, 'فلتر المفضلة');

/* ---------------- البحث ---------------- */
safe(()=>{
  $('asmaSearch').addEventListener('input', (e)=>{
    const q = e.target.value.trim();
    document.querySelectorAll('.asma-card').forEach(card=>{
      const i = parseInt(card.dataset.idx, 10);
      const item = asmaAlHusna[i];
      const match = !q || item.name.includes(q) || item.meaning.includes(q);
      card.classList.toggle('search-hidden', !match);
    });
  });
}, 'بحث الأسماء');

/* ---------------- اسم اليوم (بيتغيّر يوميًا بشكل ثابت لنفس اليوم) ---------------- */
safe(()=>{
  const banner = $('asmaDayBanner');
  const dayNum = Math.floor(Date.now() / 86400000); // رقم ثابت لليوم
  const idx = dayNum % asmaAlHusna.length;
  const item = asmaAlHusna[idx];
  banner.innerHTML = `🌙 اسم اليوم: <b>${item.name}</b> — <span>${item.meaning}</span>`;
  banner.addEventListener('click', ()=> openModal(item, idx));
}, 'اسم اليوم');

/* ---------------- تشغيل كل الأسماء بالتتابع ---------------- */
let playAllActive = false;
let playAllIdx = 0;
safe(()=>{
  const playAllBtn = $('playAllBtn');
  const stopAllBtn = $('stopAllBtn');

  function highlightPlaying(i){
    document.querySelectorAll('.asma-card.playing').forEach(c=> c.classList.remove('playing'));
    const card = document.querySelector(`.asma-card[data-idx="${i}"]`);
    card?.classList.add('playing');
    card?.scrollIntoView({behavior:'smooth', block:'center'});
  }
  function playNext(){
    if(!playAllActive || playAllIdx >= asmaAlHusna.length){
      stopPlayAll();
      return;
    }
    const item = asmaAlHusna[playAllIdx];
    highlightPlaying(playAllIdx);
    if(!item.audio){ playAllIdx++; playNext(); return; }
    audioAllah.src = 'audio/' + item.audio;
    audioAllah.currentTime = 0;
    audioAllah.play().catch(()=>{ playAllIdx++; playNext(); });
  }
  function stopPlayAll(){
    playAllActive = false;
    playAllBtn.classList.remove('hidden');
    stopAllBtn.classList.add('hidden');
    document.querySelectorAll('.asma-card.playing').forEach(c=> c.classList.remove('playing'));
    try{ audioAllah.pause(); }catch(e){}
  }
  audioAllah.addEventListener('ended', ()=>{
    if(!playAllActive) return;
    playAllIdx++;
    playNext();
  });
  playAllBtn.addEventListener('click', ()=>{
    playAllActive = true;
    playAllIdx = 0;
    playAllBtn.classList.add('hidden');
    stopAllBtn.classList.remove('hidden');
    playNext();
  });
  stopAllBtn.addEventListener('click', stopPlayAll);
}, 'تشغيل الكل بالتتابع');

const asmaModal = $('asmaModal');
let modalIdx = null;
function openModal(item, idx){
  modalIdx = idx;
  $('modalName').textContent = item.name;
  $('modalMeaning').textContent = item.meaning;
  renderModalButtons();

  if (item.audio) {
    audioAllah.src = 'audio/' + item.audio;
  } else {
    audioAllah.src = '';
  }

  asmaModal.classList.add('show');
}
function renderModalButtons(){
  safe(()=>{
    const fav = isFavName(modalIdx);
    const mem = isMemName(modalIdx);
    $('modalFavBtn').textContent = fav ? '⭐ في المفضلة' : '☆ مفضّلة';
    $('modalFavBtn').classList.toggle('primary', fav);
    $('modalMemorizedBtn').textContent = mem ? '✅ محفوظ' : '⬜ حفظته';
    $('modalMemorizedBtn').classList.toggle('primary', mem);
  }, 'أزرار المودال');
}
safe(()=>{
  $('modalCloseBtn').addEventListener('click', ()=>{ asmaModal.classList.remove('show'); audioAllah.pause(); });
  asmaModal.addEventListener('click', (e)=>{ if(e.target === asmaModal){ asmaModal.classList.remove('show'); audioAllah.pause(); } });
  $('modalPlayBtn').addEventListener('click', ()=>{ try{ audioAllah.currentTime = 0; audioAllah.play().catch(()=>{}); }catch(e){} });
  $('modalFavBtn').addEventListener('click', ()=>{
    if(modalIdx === null) return;
    toggleFavName(modalIdx);
    renderModalButtons();
    renderGrid();
  });
  $('modalMemorizedBtn').addEventListener('click', ()=>{
    if(modalIdx === null) return;
    toggleMemName(modalIdx);
    renderModalButtons();
    renderGrid();
  });
  $('modalCopyBtn').addEventListener('click', ()=>{
    if(modalIdx === null) return;
    const item = asmaAlHusna[modalIdx];
    const text = `${item.name} — ${item.meaning}`;
    if(navigator.clipboard && navigator.clipboard.writeText){
      navigator.clipboard.writeText(text).then(()=> showToastAsma('✅ تم النسخ')).catch(()=>{});
    }
  });
}, 'أزرار المودال');

function showToastAsma(msg){
  let box = $('toastBox');
  if(!box) return;
  box.textContent = msg;
  box.classList.add('show');
  clearTimeout(showToastAsma._t);
  showToastAsma._t = setTimeout(()=> box.classList.remove('show'), 2200);
}
