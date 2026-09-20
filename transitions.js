/* ===================================================================
   transitions.js — انتقال بصري ناعم بين صفحات الموقع (fade)
=================================================================== */
(function(){
  const reduceMotion = localStorage.getItem('site-reduce-motion') === '1';
  const body = document.body;
  const page = location.pathname.split('/').pop() || 'index.html';
  try{ localStorage.setItem('visited-' + page, '1'); }catch(e){}
  body.classList.remove('page-fade-init');
  if(reduceMotion){ body.style.opacity = '1'; return; }
  body.classList.add('page-fade-in');
  requestAnimationFrame(()=> body.classList.add('page-visible'));

  document.addEventListener('click', (e)=>{
    const a = e.target.closest('a');
    if(!a) return;
    const href = a.getAttribute('href');
    if(!href || href.startsWith('#') || href.startsWith('http') || href.startsWith('mailto:') || href.startsWith('tel:') || a.target === '_blank' || a.hasAttribute('download')) return;
    e.preventDefault();
    body.classList.remove('page-visible');
    setTimeout(()=> { location.href = href; }, 180);
  });
})();
