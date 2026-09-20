/* ===================================================================
   stats.js — طبقة بيانات مشتركة لكل ما يخص التقدّم والإنجاز
   بتقرا بس من نفس المفاتيح اللي بتحفظها الصفحات التانية في localStorage،
   مفيهاش أي كتابة عشان متضاربش مع الصفحة الأصلية صاحبة البيانات.
=================================================================== */
function todayKeyStr(){ return new Date().toISOString().slice(0,10); }

function getTasbihDailyStats(){ try{ return JSON.parse(localStorage.getItem('tasbihDailyStats') || '{}'); }catch(e){ return {}; } }
function getTasbihTotalAllTime(){ return parseInt(localStorage.getItem('tasbihTotalAllTime') || '0', 10) || 0; }
function getAdhkarLog(){ try{ return JSON.parse(localStorage.getItem('adhkarCompletedLog') || '{}'); }catch(e){ return {}; } }
function getAdhkarTotal(){ return Object.values(getAdhkarLog()).reduce((s,v)=> s + (v.count||0), 0); }
function getCompletedSurahsCount(){ try{ return (JSON.parse(localStorage.getItem('quran-completed-surahs') || '[]')).length; }catch(e){ return 0; } }
function getMemorizedNamesCount(){ try{ return (JSON.parse(localStorage.getItem('asma-memorized-names') || '[]')).length; }catch(e){ return 0; } }

/* نقاط موحّدة: كل تسبيحة = نقطة، كل مرة ذكر مكتمل = 5 نقط، كل سورة مختومة = 20 نقطة، كل اسم محفوظ = 10 نقط */
function getGoodDeedsScore(){
  return getTasbihTotalAllTime()
       + getAdhkarTotal() * 5
       + getCompletedSurahsCount() * 20
       + getMemorizedNamesCount() * 10;
}

const LEVELS = [
  { min:0,    name:'بداية الطريق', icon:'🌱' },
  { min:100,  name:'مواظب',        icon:'🌿' },
  { min:500,  name:'مجتهد',        icon:'🌳' },
  { min:2000, name:'متمكّن',       icon:'🌴' },
  { min:6000, name:'قدوة',         icon:'✨' }
];
function getCurrentLevel(){
  const score = getGoodDeedsScore();
  let cur = LEVELS[0], next = LEVELS[1];
  for(let i=0;i<LEVELS.length;i++){
    if(score >= LEVELS[i].min){ cur = LEVELS[i]; next = LEVELS[i+1] || null; }
  }
  return { ...cur, score, next };
}

/* آخر 14 يوم من إحصائيات التسبيح (المصدر الوحيد اللي فيه تاريخ يومي فعلي) */
function getLastNDaysTasbih(n){
  const stats = getTasbihDailyStats();
  const out = [];
  const d = new Date();
  for(let i=n-1;i>=0;i--){
    const dd = new Date(d); dd.setDate(d.getDate()-i);
    const key = dd.toISOString().slice(0,10);
    out.push({ date:key, count: stats[key] || 0 });
  }
  return out;
}

function getFavSurahsCount(){ try{ return (JSON.parse(localStorage.getItem('quran-favorite-surahs') || '[]')).length; }catch(e){ return 0; } }
function getFavAyatCount(){ try{ return (JSON.parse(localStorage.getItem('quran-favorite-ayat') || '[]')).length; }catch(e){ return 0; } }
function getSiteVisits(){ return parseInt(localStorage.getItem('siteVisits') || '0', 10); }
function getMaxTasbihDay(){ const stats = getTasbihDailyStats(); const vals = Object.values(stats); return vals.length ? Math.max(...vals) : 0; }
function getConsecutiveTasbihDays(){
  const week = getLastNDaysTasbih(14);
  let maxStreak = 0, cur = 0;
  week.forEach(d=>{ if(d.count>0){ cur++; maxStreak = Math.max(maxStreak, cur); } else cur = 0; });
  return maxStreak;
}
function getVisitedPagesCount(){
  let n = 0;
  const pages = ['index.html','quran.html','azkar.html','asma.html','tasbih.html','tools.html','favorites.html','settings.html','progress.html','contact.html'];
  pages.forEach(p=>{ if(localStorage.getItem('visited-'+p)) n++; });
  return n;
}
function hasGeneratedCert(){ return localStorage.getItem('has-generated-cert') === '1'; }
function getAsmaQuizBest(){ return parseInt(localStorage.getItem('asma-quiz-best-score') || '0', 10); }

function getWeeklySummary(){
  const week = getLastNDaysTasbih(7);
  const tasbihWeek = week.reduce((s,d)=> s+d.count, 0);
  const activeDays = week.filter(d=> d.count>0).length;
  return {
    tasbihWeek,
    activeDays,
    adhkarTotal: getAdhkarTotal(),
    surahsCompleted: getCompletedSurahsCount(),
    namesMemorized: getMemorizedNamesCount()
  };
}
