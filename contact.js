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
document.addEventListener('click', (e)=>{ if(e.target.closest('button,a')) playClick(); });

const toastBox = $('toastBox');
function showToast(msg, duration=4000){
  toastBox.textContent = msg;
  toastBox.classList.add('show');
  clearTimeout(showToast._t);
  showToast._t = setTimeout(()=> toastBox.classList.remove('show'), duration);
}

safe(()=>{
  $('contactForm').addEventListener('submit', ()=> showToast('جاري إرسال رسالتك... 🤍'));
}, 'فورم التواصل');
