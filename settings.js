function $(id){ return document.getElementById(id); }
function safe(fn, label){ try{ fn(); }catch(e){ console.error('خطأ في: '+label, e); } }

const body = document.body;

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
function showToast(msg, duration=2500){
  if(!toastBox) return;
  toastBox.textContent = msg;
  toastBox.classList.add('show');
  clearTimeout(showToast._t);
  showToast._t = setTimeout(()=> toastBox.classList.remove('show'), duration);
}

/* ---------------- معاينة حية قبل الحفظ ---------------- */
/* أي تغيير في الزخرفة أو اللون المميز بيتطبق فورًا كـ"معاينة" بس
   من غير ما يتحفظ نهائيًا، لحد ما المستخدم يدوس "✅ تأكيد وحفظ". */
let pending = {}; // { decorShape, decorHex, accentId, accentHex }
const previewBar = $('previewConfirmBar');

function hasPending(){ return Object.keys(pending).length > 0; }
function renderPreview(){
  window.siteSettings.preview({
    decorShape: pending.decorShape,
    decorHex: pending.decorHex,
    accentHex: pending.accentHex
  });
  previewBar?.classList.toggle('hidden', !hasPending());
}
function refreshAllSwatchRenders(){
  safe(()=> renderShapesFn && renderShapesFn(), 'تحديث شبكة الأشكال');
  safe(()=> renderColorsFn && renderColorsFn(), 'تحديث ألوان الزخرفة');
  safe(()=> renderAccentFn && renderAccentFn(), 'تحديث اللون المميز');
}
previewBar?.querySelector('#confirmPreviewBtn')?.addEventListener('click', ()=>{
  if(pending.decorShape) window.siteSettings.set('site-decor-shape', String(pending.decorShape));
  if(pending.decorHex) window.siteSettings.set('site-decor-color', pending.decorHex);
  if(pending.accentHex){
    window.siteSettings.set('site-accent', pending.accentId || 'custom');
    window.siteSettings.set('site-accent-hex', pending.accentHex);
  }
  pending = {};
  window.siteSettings.apply();
  previewBar?.classList.add('hidden');
  refreshAllSwatchRenders();
  showToast('✅ اتحفظت التغييرات');
});
previewBar?.querySelector('#cancelPreviewBtn')?.addEventListener('click', ()=>{
  pending = {};
  window.siteSettings.apply();
  previewBar?.classList.add('hidden');
  refreshAllSwatchRenders();
  showToast('↩️ رجّعنا القديم');
});
let renderShapesFn, renderColorsFn, renderAccentFn;

/* ---------------- زخرفة الخلفية: الشكل منفصل عن اللون ---------------- */
safe(()=>{
  function currentShape(){
    if(pending.decorShape) return pending.decorShape;
    const explicit = window.siteSettings.get('site-decor-shape', null);
    if(explicit) return parseInt(explicit, 10);
    const legacy = parseInt(window.siteSettings.get('site-decoration', '1'), 10) || 1;
    return Math.floor((legacy - 1) / 5) + 1;
  }
  function currentColorHex(){
    if(pending.decorHex) return pending.decorHex;
    const explicit = window.siteSettings.get('site-decor-color', null);
    if(explicit) return explicit;
    const legacy = parseInt(window.siteSettings.get('site-decoration', '1'), 10) || 1;
    return window.SiteDecor.colors[(legacy - 1) % 5].hex;
  }

  /* -------- شبكة الأشكال (8) -------- */
  const shapeGrid = $('decorShapeGrid');
  const shapeCount = (window.SiteDecor && window.SiteDecor.SHAPES) || 8;

  function renderShapes(){
    const activeShape = currentShape();
    const hex = currentColorHex();
    shapeGrid.innerHTML = '';
    for(let i=1; i<=shapeCount; i++){
      const d = window.SiteDecor.buildShape(i, hex);
      const el = document.createElement('div');
      el.className = 'decor-swatch' + (i === activeShape ? ' active' : '');
      el.style.backgroundImage = d.backgroundImage;
      el.style.backgroundSize = (d.size * 0.55) + 'px';
      el.title = d.label;
      el.addEventListener('click', ()=>{
        pending.decorShape = i;
        renderPreview();
        renderShapes();
        showToast('👁️ معاينة الشكل — دوس "تأكيد" عشان يتحفظ');
      });
      shapeGrid.appendChild(el);
    }
  }
  renderShapes();
  renderShapesFn = renderShapes;

  /* -------- صف ألوان الزخرفة -------- */
  const colorRow = $('decorColorRow');
  const palette = (window.SiteColor && window.SiteColor.palette) || [];

  function renderColors(){
    const activeHex = currentColorHex().replace('#','');
    colorRow.innerHTML = '';
    palette.forEach(c=>{
      const btn = document.createElement('button');
      btn.className = 'accent-swatch' + (c.hex === activeHex ? ' active' : '');
      btn.style.background = '#' + c.hex;
      btn.title = c.name;
      btn.addEventListener('click', ()=>{
        pending.decorHex = c.hex;
        renderPreview();
        renderShapes(); renderColors();
        showToast('👁️ معاينة اللون — ' + c.name + ' (لسه محفوظش)');
      });
      colorRow.appendChild(btn);
    });
  }
  renderColors();
  renderColorsFn = renderColors;

  const picker = $('decorColorPicker');
  if(picker){
    picker.value = '#' + currentColorHex().replace('#','');
    picker.addEventListener('input', ()=>{
      pending.decorHex = picker.value.replace('#','');
      renderPreview();
      renderShapes(); renderColors();
    });
  }
}, 'شبكة الزخارف');

/* ---------------- الحركة والانتقالات ---------------- */
safe(()=>{
  const sw = $('motionSwitch');
  const btn = $('motionSwitchBtn');
  function render(){
    const enabled = window.siteSettings.get('site-reduce-motion', '0') !== '1';
    sw.classList.toggle('active', enabled);
  }
  render();
  btn.addEventListener('click', ()=>{
    const enabled = window.siteSettings.get('site-reduce-motion', '0') !== '1';
    window.siteSettings.set('site-reduce-motion', enabled ? '1' : '0');
    window.siteSettings.apply();
    render();
    showToast(enabled ? '🕹️ تم تعطيل الحركات' : '🕹️ تم تفعيل الحركات');
  });
}, 'مفتاح الحركة');

/* ---------------- حجم الخط ---------------- */
safe(()=>{
  const row = $('fontChoiceRow');
  const buttons = [...row.querySelectorAll('.choice-btn')];
  function render(){
    const scale = window.siteSettings.get('site-font-scale', '1');
    buttons.forEach(b=> b.classList.toggle('active', b.dataset.scale === scale));
  }
  render();
  buttons.forEach(b=> b.addEventListener('click', ()=>{
    window.siteSettings.set('site-font-scale', b.dataset.scale);
    window.siteSettings.apply();
    render();
    showToast('🔠 تم تغيير حجم الخط');
  }));
}, 'حجم الخط');

/* ---------------- اللون المميز ---------------- */
safe(()=>{
  const row = $('accentRow');
  const palette = (window.SiteColor && window.SiteColor.palette) || [];

  function currentHex(){
    if(pending.accentHex) return pending.accentHex;
    const explicit = window.siteSettings.get('site-accent-hex', null);
    if(explicit) return explicit;
    const id = window.siteSettings.get('site-accent', 'gold');
    const found = palette.find(c=> c.id === id);
    return found ? found.hex : 'c9a24b';
  }

  function render(){
    const active = currentHex();
    row.innerHTML = '';
    palette.forEach(c=>{
      const btn = document.createElement('button');
      btn.className = 'accent-swatch' + (c.hex === active ? ' active' : '');
      btn.style.background = '#' + c.hex;
      btn.title = c.name;
      btn.addEventListener('click', ()=>{
        pending.accentId = c.id;
        pending.accentHex = c.hex;
        renderPreview();
        render();
        if(picker) picker.value = '#' + c.hex;
        showToast('👁️ معاينة اللون — ' + c.name + ' (لسه محفوظش)');
      });
      row.appendChild(btn);
    });
  }
  render();
  renderAccentFn = render;

  const picker = $('accentColorPicker');
  if(picker){
    picker.value = '#' + currentHex();
    picker.addEventListener('input', ()=>{
      pending.accentId = 'custom';
      pending.accentHex = picker.value.replace('#','');
      renderPreview();
      render();
    });
  }
}, 'اللون المميز');

/* ---------------- صوت النقر ---------------- */
safe(()=>{
  const sw = $('soundSwitch');
  const btn = $('soundSwitchBtn');
  function render(){
    const enabled = window.siteSettings.soundEnabled();
    sw.classList.toggle('active', enabled);
  }
  render();
  btn.addEventListener('click', ()=>{
    const enabled = !window.siteSettings.soundEnabled();
    window.siteSettings.set('site-sound', enabled ? '1' : '0');
    render();
    showToast(enabled ? '🔊 تم تفعيل صوت النقر' : '🔇 تم كتم صوت النقر');
  });
}, 'مفتاح الصوت');

/* ---------------- استعادة الإعدادات الافتراضية ---------------- */
$('resetSettingsBtn')?.addEventListener('click', ()=>{
  window.siteSettings.reset();
  showToast('↩️ تم استرجاع الإعدادات الافتراضية');
  setTimeout(()=> location.reload(), 700);
});

/* ---------------- شكل ولون عشوائي للزخرفة ---------------- */
$('randomDecorBtn')?.addEventListener('click', ()=>{
  const shapeCount = (window.SiteDecor && window.SiteDecor.SHAPES) || 8;
  const palette = (window.SiteColor && window.SiteColor.palette) || [];
  const shape = 1 + Math.floor(Math.random() * shapeCount);
  const color = palette[Math.floor(Math.random() * palette.length)];
  pending.decorShape = shape;
  pending.decorHex = color.hex;
  renderPreview();
  refreshAllSwatchRenders();
  showToast('🎲 معاينة شكل جديد — دوس "تأكيد" لو عجبك');
});

/* ---------------- نسخة احتياطية كاملة (إعدادات + مفضلة) ---------------- */
const BACKUP_KEYS = [
  'site-theme','site-decoration','site-decor-shape','site-decor-color',
  'site-reduce-motion','site-font-scale','site-accent','site-accent-hex','site-sound',
  'quran-favorite-ayat','quran-last-reciter'
];
$('backupAllBtn')?.addEventListener('click', ()=>{
  const data = {};
  BACKUP_KEYS.forEach(k=>{ const v = localStorage.getItem(k); if(v !== null) data[k] = v; });
  const blob = new Blob([JSON.stringify(data, null, 2)], {type:'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'نسخة-احتياطية-الموقع-الاسلامي.json';
  document.body.appendChild(a); a.click(); a.remove();
  URL.revokeObjectURL(url);
  showToast('✅ اتحمّلت النسخة الاحتياطية');
});
$('restoreAllBtn')?.addEventListener('click', ()=> $('restoreAllFile')?.click());
$('restoreAllFile')?.addEventListener('change', (e)=>{
  const file = e.target.files[0];
  if(!file) return;
  const reader = new FileReader();
  reader.onload = ()=>{
    try{
      const data = JSON.parse(reader.result);
      Object.keys(data).forEach(k=>{ if(BACKUP_KEYS.includes(k)) localStorage.setItem(k, data[k]); });
      showToast('✅ اترجعت النسخة الاحتياطية، هيتم تحديث الصفحة');
      setTimeout(()=> location.reload(), 900);
    }catch(err){
      showToast('⚠️ الملف مش صالح');
    }
  };
  reader.readAsText(file);
});

/* ---------------- تفريغ ذاكرة المصحف المؤقتة ---------------- */
$('clearQuranCacheBtn')?.addEventListener('click', ()=>{
  ['quran-chapters-v1','quran-reciters-v2'].forEach(k=> localStorage.removeItem(k));
  showToast('🧹 اتنضّفت الذاكرة المؤقتة، هتتحمّل بيانات جديدة من الإنترنت في المصحف');
});
