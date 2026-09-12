/* ===================================================================
   settings-core.js
   محرك إعدادات الموقع المشترك بين كل الصفحات:
   - زخرفة الخلفية (40 شكل)
   - تفعيل/تعطيل الحركات والانتقالات
   - حجم الخط العام للموقع
   - اللون المميز (accent)
   - تفعيل/تعطيل صوت النقر
   لازم يتحمّل بدري (في <head>) عشان يتطبق قبل ما الصفحة تتعرض،
   عشان محدش يشوف "فلاش" قبل تطبيق الإعدادات المحفوظة.
=================================================================== */
(function(){
  function ls(key, fallback){
    try{ const v = localStorage.getItem(key); return v === null ? fallback : v; }
    catch(e){ return fallback; }
  }
  function setLs(key, val){ try{ localStorage.setItem(key, val); }catch(e){} }

  /* ---------------- لوحة ألوان موسّعة (تُستخدم للزخرفة وللّون المميز) ---------------- */
  const COLOR_PALETTE = [
    { id:'gold',    hex:'c9a24b', name:'ذهبي'      },
    { id:'amber',   hex:'d9922e', name:'كهرماني'   },
    { id:'bronze',  hex:'8a5a2b', name:'برونزي'    },
    { id:'green',   hex:'2e7d5b', name:'أخضر'      },
    { id:'emerald', hex:'139c5a', name:'زمردي'     },
    { id:'olive',   hex:'6b7a2b', name:'زيتوني'    },
    { id:'teal',    hex:'2f8f8a', name:'فيروزي'    },
    { id:'cyan',    hex:'1fa3b0', name:'سماوي'     },
    { id:'blue',    hex:'3b6fa0', name:'أزرق'      },
    { id:'navy',    hex:'2c4a7c', name:'كحلي'      },
    { id:'indigo',  hex:'4a4ea0', name:'نيلي'      },
    { id:'purple',  hex:'7a4aa0', name:'بنفسجي'    },
    { id:'magenta', hex:'a04a86', name:'أرجواني'   },
    { id:'rose',    hex:'a0453b', name:'عنابي'     },
    { id:'red',     hex:'b23b3b', name:'أحمر'      },
    { id:'coral',   hex:'c96b4b', name:'مرجاني'    },
    { id:'brown',   hex:'6e4a34', name:'بني'       },
    { id:'slate',   hex:'5a6b7a', name:'رمادي مزرق'},
    { id:'graphite',hex:'4a4a4a', name:'فحمي'      },
    { id:'silver',  hex:'9aa0a6', name:'فضي'       }
  ];
  /* توافق قديم: كان اسمها DECOR_COLORS */
  const DECOR_COLORS = COLOR_PALETTE;

  function hexToRgb(hex){
    const h = hex.replace('#','');
    return { r: parseInt(h.substr(0,2),16), g: parseInt(h.substr(2,2),16), b: parseInt(h.substr(4,2),16) };
  }
  function rgbToHex(r,g,b){
    const c = v=> Math.max(0,Math.min(255,Math.round(v))).toString(16).padStart(2,'0');
    return '#'+c(r)+c(g)+c(b);
  }
  function lighten(hex, amt){
    const {r,g,b} = hexToRgb(hex);
    return rgbToHex(r+(255-r)*amt, g+(255-g)*amt, b+(255-b)*amt);
  }
  window.SiteColor = { palette: COLOR_PALETTE, lighten, hexToRgb, rgbToHex };

  const DECOR_FAMILIES = [
    { name:'مربعات متقاطعة', size:165, draw:c=>
      `<svg xmlns='http://www.w3.org/2000/svg' width='110' height='110' viewBox='0 0 110 110'><g fill='none' stroke='%23${c}' stroke-width='1'><rect x='20' y='20' width='70' height='70'/><rect x='20' y='20' width='70' height='70' transform='rotate(45 55 55)'/><circle cx='55' cy='55' r='3' fill='%23${c}' stroke='none'/></g></svg>` },
    { name:'نجمة ثمانية', size:150, draw:c=>
      `<svg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'><g fill='none' stroke='%23${c}' stroke-width='1.2'><path d='M50 6 L60 38 L92 38 L66 58 L76 90 L50 70 L24 90 L34 58 L8 38 L40 38 Z'/></g></svg>` },
    { name:'شبكة سداسية', size:140, draw:c=>
      `<svg xmlns='http://www.w3.org/2000/svg' width='100' height='87' viewBox='0 0 100 87'><g fill='none' stroke='%23${c}' stroke-width='1'><polygon points='25,2 75,2 100,44 75,86 25,86 0,44'/></g></svg>` },
    { name:'أهلّة متكررة', size:130, draw:c=>
      `<svg xmlns='http://www.w3.org/2000/svg' width='90' height='90' viewBox='0 0 90 90'><g fill='none' stroke='%23${c}' stroke-width='1.3'><path d='M45 14a24 24 0 1 0 18 40 19 19 0 0 1 -18 -40z'/></g></svg>` },
    { name:'دوائر متشابكة', size:150, draw:c=>
      `<svg xmlns='http://www.w3.org/2000/svg' width='110' height='110' viewBox='0 0 110 110'><g fill='none' stroke='%23${c}' stroke-width='1'><circle cx='30' cy='30' r='25'/><circle cx='80' cy='30' r='25'/><circle cx='30' cy='80' r='25'/><circle cx='80' cy='80' r='25'/></g></svg>` },
    { name:'معين متشابك', size:120, draw:c=>
      `<svg xmlns='http://www.w3.org/2000/svg' width='90' height='90' viewBox='0 0 90 90'><g fill='none' stroke='%23${c}' stroke-width='1'><path d='M45 2 L88 45 L45 88 L2 45 Z'/><path d='M45 22 L68 45 L45 68 L22 45 Z'/></g></svg>` },
    { name:'محاريب مصغّرة', size:150, draw:c=>
      `<svg xmlns='http://www.w3.org/2000/svg' width='100' height='120' viewBox='0 0 100 120'><g fill='none' stroke='%23${c}' stroke-width='1.1'><path d='M20 112 V60 a30 30 0 0 1 60 0 V112 Z'/><line x1='12' y1='112' x2='88' y2='112'/></g></svg>` },
    { name:'مشربية مثلثات', size:110, draw:c=>
      `<svg xmlns='http://www.w3.org/2000/svg' width='100' height='60' viewBox='0 0 100 60'><g fill='none' stroke='%23${c}' stroke-width='1'><path d='M0 50 L25 10 L50 50 L75 10 L100 50'/></g></svg>` }
  ];

  /* شكل الزخرفة (1-8) ولونها (Hex) بقوا إعدادين منفصلين تمامًا.
     buildDecor بيقبل رقم الشكل + لون Hex مباشرة، ولسه بيدعم الاستخدام
     القديم (رقم من 1 لـ40) لو حصل استدعاء قديم فيه محفوظ. */
  function buildDecorShape(shapeId, hex){
    const sIdx = Math.max(1, Math.min(DECOR_FAMILIES.length, parseInt(shapeId, 10) || 1)) - 1;
    const fam = DECOR_FAMILIES[sIdx];
    const cleanHex = (hex || 'c9a24b').replace('#','');
    const svg = fam.draw(cleanHex);
    return {
      shapeId: sIdx + 1,
      hex: cleanHex,
      label: fam.name,
      size: fam.size,
      backgroundImage: `url("data:image/svg+xml,${svg}")`
    };
  }
  function buildDecor(rawId){
    // توافق مع القديم: id من 1 إلى 40 = 8 أشكال × 5 ألوان
    const id = Math.max(1, Math.min(40, parseInt(rawId, 10) || 1));
    const famIdx = Math.floor((id - 1) / 5);
    const colIdx = (id - 1) % 5;
    return buildDecorShape(famIdx + 1, DECOR_COLORS[colIdx].hex);
  }

  /* ---------------- تطبيق الإعدادات على الصفحة ---------------- */
  const root = document.documentElement;
  const DEFAULT_ACCENT_HEX = 'c9a24b';

  function currentDecorShape(){
    // توافق: لو فيه قيمة قديمة site-decoration (1-40) وملقيش site-decor-shape، حوّلها
    const explicit = ls('site-decor-shape', null);
    if(explicit) return explicit;
    const legacy = parseInt(ls('site-decoration', '1'), 10) || 1;
    return String(Math.floor((legacy - 1) / 5) + 1);
  }
  function currentDecorHex(){
    const explicit = ls('site-decor-color', null);
    if(explicit) return explicit;
    const legacy = parseInt(ls('site-decoration', '1'), 10) || 1;
    return DECOR_COLORS[(legacy - 1) % 5].hex;
  }
  function currentAccentHex(){
    const explicit = ls('site-accent-hex', null);
    if(explicit) return explicit;
    const named = ls('site-accent', 'gold');
    const found = COLOR_PALETTE.find(c=> c.id === named);
    return found ? found.hex : DEFAULT_ACCENT_HEX;
  }

  function applyAll(overrides){
    overrides = overrides || {};
    const reduceMotion = ls('site-reduce-motion', '0');
    const fontScale = ls('site-font-scale', '1');

    try{
      const shape = overrides.decorShape || currentDecorShape();
      const hex = overrides.decorHex || currentDecorHex();
      const d = buildDecorShape(shape, hex);
      root.style.setProperty('--decor-image', d.backgroundImage);
      root.style.setProperty('--decor-size', d.size + 'px');
    }catch(e){}

    root.setAttribute('data-reduce-motion', reduceMotion === '1' ? '1' : '0');
    root.style.setProperty('--font-scale', fontScale);

    const accentHex = '#' + (overrides.accentHex || currentAccentHex()).replace('#','');
    root.style.setProperty('--gold', accentHex);
    root.style.setProperty('--gold-bright', lighten(accentHex, .28));
    root.setAttribute('data-accent', ls('site-accent', 'custom'));
  }

  applyAll();

  window.SiteDecor = { build: buildDecor, buildShape: buildDecorShape, families: DECOR_FAMILIES, colors: DECOR_COLORS, COUNT: 40, SHAPES: DECOR_FAMILIES.length };

  window.siteSettings = {
    soundEnabled(){ return ls('site-sound', '1') !== '0'; },
    get(key, fallback){ return ls(key, fallback); },
    set(key, val){ setLs(key, val); },
    apply: applyAll,
    /* معاينة حية: بتطبّق شكل مؤقت من غير ما تحفظه في localStorage */
    preview(overrides){ applyAll(overrides); },
    currentDecorShape, currentDecorHex, currentAccentHex,
    reset(){
      ['site-decoration','site-decor-shape','site-decor-color','site-reduce-motion','site-font-scale','site-accent','site-accent-hex','site-sound'].forEach(k=>{
        try{ localStorage.removeItem(k); }catch(e){}
      });
      applyAll();
    }
  };
})();
