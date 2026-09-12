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
document.addEventListener('click', (e)=>{ if(e.target.closest('button,a')) playClick(); });

const toastBox = $('toastBox');
function showToast(msg, duration=4000){
  toastBox.textContent = msg;
  toastBox.classList.add('show');
  clearTimeout(showToast._t);
  showToast._t = setTimeout(()=> toastBox.classList.remove('show'), duration);
}

safe(()=>{
  const form = $('contactForm');
  let formSubmitted = false;
  form.addEventListener('submit', ()=>{
    formSubmitted = true;
    showToast('جاري إرسال رسالتك... 🤍');
  });

  /* ---------------- رسالة تأكيد لو حاول يخرج وهو لسه كاتب رسالة ما بعتهاش ---------------- */
  function hasUnsavedInput(){
    return !formSubmitted && (
      $('nameInput').value.trim() !== '' ||
      $('messageInput').value.trim() !== ''
    );
  }
  window.addEventListener('beforeunload', (e)=>{
    if(hasUnsavedInput()){
      e.preventDefault();
      e.returnValue = 'لسه كاتب رسالة ومبعتهاش، عايز فعلاً تخرج؟';
      return e.returnValue;
    }
  });
}, 'فورم التواصل');
