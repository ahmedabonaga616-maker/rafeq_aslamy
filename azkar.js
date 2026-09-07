/* ===================== صفحة الأذكار (تصميم مبسط) ===================== */
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
document.addEventListener('click', (e)=>{ if(e.target.closest('button,a,.azkar-card')) playClick(); });

const toastBox = $('toastBox');
function showToast(msg, duration=3000){
  toastBox.textContent = msg;
  toastBox.classList.add('show');
  clearTimeout(showToast._t);
  showToast._t = setTimeout(()=> toastBox.classList.remove('show'), duration);
}
/* تعبئة وتنسيق قائمة الأقسام عمودياً مع المفضلة والبحث */
function renderCategoriesList() {
  const listContainer = document.getElementById('categoriesList');
  const data = (typeof azkarCategories !== 'undefined') ? azkarCategories : (typeof adhkarDatabase !== 'undefined' ? adhkarDatabase : []);
  if (!listContainer || !data) return;
  listContainer.innerHTML = '';

  const savedFavs = JSON.parse(localStorage.getItem('adhkarFavorites') || '{}');
  let items = Array.isArray(data) ? [...data] : Object.keys(data).map(k => ({ id: k, ...data[k] }));

  // ترتيب العناصر: المفضلة تظهر أولاً
  items.sort((a, b) => (savedFavs[b.id] ? 1 : 0) - (savedFavs[a.id] ? 1 : 0));

  items.forEach(cat => {
      let isFav = !!savedFavs[cat.id];
      let card = document.createElement('div');
      card.className = 'islamic-category-card';
      card.innerHTML = `
          <span onclick="renderCategory('${cat.id}')" style="flex:1; font-weight:bold;">${cat.emoji || ''} ${cat.name || cat.title}</span>
          <button class="star-btn ${isFav ? 'fav-active' : ''}" onclick="toggleFavorite('${cat.id}', event)">★</button>
      `;
      listContainer.appendChild(card);
  });
}

function toggleFavorite(id, event) {
  if (event) event.stopPropagation();
  let savedFavs = JSON.parse(localStorage.getItem('adhkarFavorites') || '{}');
  savedFavs[id] = !savedFavs[id];
  localStorage.setItem('adhkarFavorites', JSON.stringify(savedFavs));
  renderCategoriesList();
}

function filterAdhkar() {
  let input = document.getElementById('adhkarSearchInput').value.toLowerCase().replace(/[أإآ]/g, 'ا');
  let cards = document.querySelectorAll('.islamic-category-card');
  
  cards.forEach(card => {
      let text = card.innerText.toLowerCase().replace(/[أإآ]/g, 'ا');
      card.style.display = text.includes(input) ? "flex" : "none";
  });
}

// تشغيل القائمة فور التحميل
safe(() => {
  renderCategoriesList();
}, 'تعبئة القائمة العمودية');

 

/* =========================================================
   إدارة شاشة عرض الذكر (متابعة، رجوع، تكرار، والتقدم)
   ========================================================= */
   let currentCategoryItems = [];
   let currentCategoryTitle = '';
   let currentDhikrIndex = 0;
   let currentRemainingCount = 1;
   let currentInitialCount = 1;
   
   function renderCategory(catId) {
       const data = (typeof azkarCategories !== 'undefined') ? azkarCategories : (typeof adhkarDatabase !== 'undefined' ? adhkarDatabase : []);
       let cat = Array.isArray(data) ? data.find(c => c.id === catId) : data[catId];
       
       if (!cat) return;
       
       currentCategoryItems = cat.items || [];
       currentCategoryTitle = cat.name || cat.title || '';
       currentDhikrIndex = 0;
       
       if (currentCategoryItems.length === 0) return;
   
       const titleEl = document.getElementById('categoryTitleName');
       if (titleEl) titleEl.innerText = currentCategoryTitle;
   
       const listEl = document.getElementById('categoriesList');
       if (listEl) listEl.style.display = 'none';
   
       const searchEl = document.querySelector('.search-box');
       if (searchEl) searchEl.style.display = 'none';
   
       const detailEl = document.getElementById('dhkarDetailView');
       if (detailEl) detailEl.style.display = 'block';
   
       loadCurrentDhikr();
   }
   
   function closeAdhkarCategory() {
       const detailEl = document.getElementById('dhkarDetailView');
       if (detailEl) detailEl.style.display = 'none';
   
       const listEl = document.getElementById('categoriesList');
       if (listEl) listEl.style.display = 'flex';
   
       const searchEl = document.querySelector('.search-box');
       if (searchEl) searchEl.style.display = 'block';
   }
   
   function loadCurrentDhikr() {
       let item = currentCategoryItems[currentDhikrIndex];
       const textEl = document.getElementById('currentDhikrText');
       if (textEl) textEl.innerText = item.text;
   
       currentInitialCount = item.repeat || item.count || 1;
       currentRemainingCount = currentInitialCount;
       updateDhikrUI();
   }
   
   function updateDhikrUI() {
       const countEl = document.getElementById('dhkarRemainingCount');
       if (countEl) countEl.innerText = `${currentRemainingCount} تكرار - ${currentInitialCount}`;
   
       const progressEl = document.getElementById('dhkarProgressIndicator');
       if (progressEl) progressEl.innerText = `الذكر ${currentDhikrIndex + 1} من ${currentCategoryItems.length}`;
   
       let percent = ((currentDhikrIndex + 1) / currentCategoryItems.length) * 100;
       const barEl = document.getElementById('dhkarBarFill');
       if (barEl) barEl.style.width = `${percent}%`;
   }
   
   function handleDhikrTouch() {
    if (typeof playClick === 'function') playClick();

    // 1. اهتزاز حقيقي للهاتف (المحرك)
    if (navigator.vibrate) {
        navigator.vibrate(40); // اهتزاز خفيف لمدة 40 مللي ثانية
    }

    // 2. اهتزاز بصري للكارت
    const card = document.querySelector('#dhkarDetailView .azkar-card');
    if (card) {
        card.classList.add('shake-effect');
        setTimeout(() => {
            card.classList.remove('shake-effect');
        }, 150);
    }

    // تقليل العداد أو الانتقال
    if (currentRemainingCount > 1) {
        currentRemainingCount--;
        updateDhikrUI();
    } else {
        nextDhikrStep();
    }
}
   
   function nextDhikrStep() {
       if (currentDhikrIndex < currentCategoryItems.length - 1) {
           currentDhikrIndex++;
           loadCurrentDhikr();
       } else {
           if (typeof showToast === 'function') {
               showToast('أتممت كل أذكار هذا القسم، تقبل الله منك 🌟');
           } else {
               alert('أتممت كل أذكار هذا القسم، تقبل الله منك 🌟');
           }
           closeAdhkarCategory();
       }
   }
   
   function prevDhikrStep() {
       if (currentDhikrIndex > 0) {
           currentDhikrIndex--;
           loadCurrentDhikr();
       }
   }
   // 1. تعريف العناصر
const toggleDuaBtn = document.getElementById('toggleDuaBtn');
const duaSection = document.getElementById('duaSection');
const duaInput = document.getElementById('duaInput');
const addDuaBtn = document.getElementById('addDuaBtn');
const duaList = document.getElementById('duaList');

// 2. تشغيل زرار الإظهار والإخفاء (زي الفيديو بالظبط)
toggleDuaBtn?.addEventListener('click', () => {
    if (duaSection.style.display === 'none' || duaSection.style.display === '') {
        duaSection.style.display = 'block'; // إظهار
        displayDuas(); // تحميل الأدعية المحفوظة
    } else {
        duaSection.style.display = 'none'; // إخفاء
    }
});

// 3. إضافة دعاء جديد وحفظه
addDuaBtn?.addEventListener('click', () => {
    const text = duaInput.value.trim();
    if (!text) return; // لو المربع فاضي ميعملش حاجة

    // جلب الأدعية القديمة، إضافة الجديد، ثم الحفظ
    const savedDuas = JSON.parse(localStorage.getItem('my_saved_duas')) || [];
    savedDuas.push(text);
    localStorage.setItem('my_saved_duas', JSON.stringify(savedDuas));
    
    duaInput.value = ''; // تفريغ المربع
    displayDuas(); // تحديث العرض
});

// 4. دالة عرض الأدعية
function displayDuas() {
    if (!duaList) return;
    const savedDuas = JSON.parse(localStorage.getItem('my_saved_duas')) || [];
    
    duaList.innerHTML = savedDuas.map((dua, index) => `
        <div class="saved-dua">
            <p style="margin: 0;">${dua}</p>
            <button onclick="removeDua(${index})">حذف</button>
        </div>
    `).join('');
}

// 5. دالة حذف دعاء
window.removeDua = function(index) {
    let savedDuas = JSON.parse(localStorage.getItem('my_saved_duas')) || [];
    savedDuas.splice(index, 1);
    localStorage.setItem('my_saved_duas', JSON.stringify(savedDuas));
    displayDuas();
};