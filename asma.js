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
function playClick(){ try{ audioClick.currentTime = 0; audioClick.play().catch(()=>{}); }catch(e){} }
document.addEventListener('click', (e)=>{ if(e.target.closest('button,a')) playClick(); });

safe(()=>{
  const asmaGrid = $('asmaGrid');
  asmaAlHusna.forEach((item, i)=>{
    const card = document.createElement('div');
    card.className = 'asma-card';
    card.innerHTML = `<div class="num">${i+1}</div><div class="name">${item.name}</div>`;
    card.addEventListener('click', ()=> openModal(item));
    asmaGrid.appendChild(card);
  });
}, 'عرض الأسماء');

const asmaModal = $('asmaModal');
function openModal(item){
  $('modalName').textContent = item.name;
  $('modalMeaning').textContent = item.meaning;
  
  // الكود الجديد لتشغيل الصوت الصحيح
  if (item.audio) {
    audioAllah.src = 'audio/' + item.audio;
  } else {
    audioAllah.src = '';
  }

  asmaModal.classList.add('show');
}
safe(()=>{
  $('modalCloseBtn').addEventListener('click', ()=>{ asmaModal.classList.remove('show'); audioAllah.pause(); });
  asmaModal.addEventListener('click', (e)=>{ if(e.target === asmaModal){ asmaModal.classList.remove('show'); audioAllah.pause(); } });
  $('modalPlayBtn').addEventListener('click', ()=>{ try{ audioAllah.currentTime = 0; audioAllah.play().catch(()=>{}); }catch(e){} });
}, 'أزرار المودال');
