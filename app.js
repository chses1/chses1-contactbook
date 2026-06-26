const STORAGE_KEY = 'cses-contactbook-attendance-v4';
const OLD_KEYS = [];
const CALENDAR_URL = 'https://docs.google.com/spreadsheets/d/1Dbs8Czjl6odsq6HOAz2J_ZU3gXmzm5lU8mSbXoOQD3E/edit?usp=sharing';
const AIR_DASHBOARD_URL = 'https://tyn-air.tydep.gov.tw/Dashboard/Dashboard.aspx?Id=4';
const TEMP_REFRESH_MS = 10 * 60 * 1000;
const FIREBASE_CDN_VERSION = '10.12.5';
const firebaseConfig = window.CSES_FIREBASE_CONFIG || {};
const classConfig = window.CSES_CLASS_CONFIG || {};
const FONT_STACKS = {
  default:'"Noto Sans TC","Microsoft JhengHei",system-ui,sans-serif',
  rounded:'"jf open 粉圓 2.1","GenJyuuGothic","M PLUS Rounded 1c","Noto Sans TC","Microsoft JhengHei",sans-serif',
  kai:'"BiauKai","DFKai-SB","標楷體","KaiTi","Noto Serif TC",serif',
  iansui:'"Bpmf Iansui","Noto Sans TC","Microsoft JhengHei",sans-serif'
};
const BOOK_FIELDS = [
  ['homework','今日功課'],
  ['reminder','明日提醒'],
  ['test','考試通知'],
  ['note','生活叮嚀'],
  ['teacher','老師的話']
];
const PHONETIC_READINGS = window.CSES_PHONETIC_READINGS || {};
const PHONETIC_CANDIDATES = window.CSES_PHONETIC_CANDIDATES || {
  '了':['˙ㄌㄜ','ㄌㄧㄠˇ'],
  '便':['ㄅㄧㄢˋ','ㄆㄧㄢˊ'],
  '傳':['ㄔㄨㄢˊ','ㄓㄨㄢˋ'],
  '和':['ㄏㄜˊ','ㄏㄢˋ','ㄏㄜˋ','ㄏㄨㄛˋ','˙ㄏㄨㄛ','ㄏㄨˊ'],
  '好':['ㄏㄠˇ','ㄏㄠˋ'],
  '少':['ㄕㄠˇ','ㄕㄠˋ'],
  '教':['ㄐㄧㄠˋ','ㄐㄧㄠ'],
  '會':['ㄏㄨㄟˋ','ㄎㄨㄞˋ','ㄏㄨㄟˇ','ㄍㄨㄟˋ'],
  '樂':['ㄌㄜˋ','ㄩㄝˋ','ㄧㄠˋ'],
  '為':['ㄨㄟˊ','ㄨㄟˋ'],
  '的':['˙ㄉㄜ','ㄉㄧˊ','ㄉㄧˋ'],
  '種':['ㄓㄨㄥˇ','ㄓㄨㄥˋ'],
  '空':['ㄎㄨㄥ','ㄎㄨㄥˋ'],
  '著':['˙ㄓㄜ','ㄓㄨˋ','ㄓㄠ','ㄓㄠˊ','ㄓㄨㄛˊ'],
  '行':['ㄒㄧㄥˊ','ㄏㄤˊ','ㄒㄧㄥˋ','ㄏㄤˋ'],
  '都':['ㄉㄡ','ㄉㄨ'],
  '重':['ㄓㄨㄥˋ','ㄔㄨㄥˊ'],
  '長':['ㄔㄤˊ','ㄓㄤˇ','ㄓㄤˋ']
};
const defaultStudents = Array.from({length:30},(_,i)=>({seat:String(i+1).padStart(2,'0'),name:`${i+1}號`}));
const $ = id => document.getElementById(id);
const refs = {
  cloudModeLabel:$('cloudModeLabel'),cloudHint:$('cloudHint'),signInBtn:$('signInBtn'),shareAttendanceToggle:$('shareAttendanceToggle'),publishShareBtn:$('publishShareBtn'),copyShareBtn:$('copyShareBtn'),helpBtn:$('helpBtn'),signOutBtn:$('signOutBtn'),storageStatus:$('storageStatus'),
  shell:document.querySelector('.app-shell'),hero:document.querySelector('.hero-clock'),mainGrid:document.querySelector('.main-grid'),topResizeHandle:$('topResizeHandle'),mainResizeHandle:$('mainResizeHandle'),
  clock:$('clock'),clockHours:$('clockHours'),clockMinutes:$('clockMinutes'),clockSeconds:$('clockSeconds'),dateFull:$('dateFull'),weekText:$('weekText'),schoolTempLink:$('schoolTempLink'),lunarText:$('lunarText'),lateTime:$('lateTime'),lateHour:$('lateHour'),lateMinute:$('lateMinute'),timeStatus:$('timeStatus'),lateLegendOnTime:$('lateLegendOnTime'),lateLegendLate:$('lateLegendLate'),calendarBtn:$('calendarBtn'),swapPanelsBtn:$('swapPanelsBtn'),settingsBtn:$('settingsBtn'),fullscreenBtn:$('fullscreenBtn'),formatBtn:$('formatBtn'),formatPanel:$('formatPanel'),fontDownBtn:$('fontDownBtn'),fontUpBtn:$('fontUpBtn'),lineHeightDownBtn:$('lineHeightDownBtn'),lineHeightUpBtn:$('lineHeightUpBtn'),lineHeightLabel:$('lineHeightLabel'),phoneticModeSelect:$('phoneticModeSelect'),alignLeftBtn:$('alignLeftBtn'),alignCenterBtn:$('alignCenterBtn'),alignRightBtn:$('alignRightBtn'),fontScaleLabel:$('fontScaleLabel'),fontFamilySelect:$('fontFamilySelect'),
  datePicker:$('datePicker'),selectedDateLabel:$('selectedDateLabel'),editBtn:$('editBtn'),writingModeBtn:$('writingModeBtn'),viewModeBtn:$('viewModeBtn'),bookDisplay:$('bookDisplay'),editor:$('editor'),
  homeworkCard:$('homeworkCard'),reminderCard:$('reminderCard'),testCard:$('testCard'),noteCard:$('noteCard'),teacherCard:$('teacherCard'),emptyBookMessage:$('emptyBookMessage'),
  homeworkView:$('homeworkView'),reminderView:$('reminderView'),testView:$('testView'),noteView:$('noteView'),teacherView:$('teacherView'),
  bookFieldToggles:$('bookFieldToggles'),homeworkToggle:$('homeworkToggle'),reminderToggle:$('reminderToggle'),testToggle:$('testToggle'),noteToggle:$('noteToggle'),teacherToggle:$('teacherToggle'),
  homeworkInput:$('homeworkInput'),reminderInput:$('reminderInput'),testInput:$('testInput'),noteInput:$('noteInput'),teacherInput:$('teacherInput'),saveBookBtn:$('saveBookBtn'),copyYesterdayBtn:$('copyYesterdayBtn'),markPhoneticBtn:$('markPhoneticBtn'),autosaveHint:$('autosaveHint'),
  arrivedCount:$('arrivedCount'),absentCount:$('absentCount'),lateCount:$('lateCount'),leaveCount:$('leaveCount'),studentGrid:$('studentGrid'),namesBtn:$('namesBtn'),
  statsBtn:$('statsBtn'),recordsBtn:$('recordsBtn'),allOnTimeBtn:$('allOnTimeBtn'),resetBtn:$('resetBtn'),lastSaved:$('lastSaved'),
  studentDialog:$('studentDialog'),studentTitle:$('studentTitle'),studentDetail:$('studentDetail'),markOnTimeBtn:$('markOnTimeBtn'),markLateBtn:$('markLateBtn'),markLeaveBtn:$('markLeaveBtn'),markAbsentBtn:$('markAbsentBtn'),
  namesDialog:$('namesDialog'),namesInput:$('namesInput'),saveNamesBtn:$('saveNamesBtn'),resetNamesBtn:$('resetNamesBtn'),infoDialog:$('infoDialog'),infoTitle:$('infoTitle'),infoContent:$('infoContent'),phoneticDialog:$('phoneticDialog'),phoneticChar:$('phoneticChar'),phoneticChoices:$('phoneticChoices'),phoneticInput:$('phoneticInput'),savePhoneticBtn:$('savePhoneticBtn'),clearPhoneticBtn:$('clearPhoneticBtn'),settingsDialog:$('settingsDialog'),classNameInput:$('classNameInput'),wakeLockStatus:$('wakeLockStatus')
};
let state = loadState();
let selectedDate = dateKey(new Date());
let editMode = false;
let selectedSeat = null;
let selectedPhoneticTarget = null;
let selectedPhoneticVariant = 0;
let lastPhoneticSelection = null;
let isApplyingRemoteState = false;
let cloudSaveTimer = null;
let screenWakeLock = null;
let wakeLockWanted = false;
let wakeLockStatus = 'idle';
let wakeLockRetryTimer = null;
const cloud = {
  configured:isFirebaseConfigured(),
  parentShareId:new URLSearchParams(location.search).get('share') || '',
  user:null,
  auth:null,
  db:null,
  provider:null,
  api:null,
  unsubscribe:null
};

function dateKey(d){ const y=d.getFullYear(),m=String(d.getMonth()+1).padStart(2,'0'),day=String(d.getDate()).padStart(2,'0'); return `${y}-${m}-${day}`; }
function displayDate(key){ const d = new Date(key+'T00:00:00'); const w='日一二三四五六'[d.getDay()]; return `${d.getFullYear()}/${String(d.getMonth()+1).padStart(2,'0')}/${String(d.getDate()).padStart(2,'0')}（${w}）`; }
function nowTime(){ return new Date().toLocaleTimeString('zh-TW',{hour12:false}); }
function isFirebaseConfigured(){ return ['apiKey','authDomain','projectId','appId'].every(k=>String(firebaseConfig[k]||'').trim()); }
function getClassId(){ return String(classConfig.classId || 'default').replace(/[^\w-]/g,'') || 'default'; }
function getClassLabel(){ return String(state.settings?.className || '').trim() || '班級'; }
function getClassName(){ return `${getClassLabel()}聯絡簿`; }
function classLabelFromTitle(title){ return String(title || '').replace(/聯絡簿系統?$/,'').replace(/聯絡簿$/,'').trim(); }
function getShareId(){ return String(classConfig.shareId || `${cloud.user?.uid || 'teacher'}-${getClassId()}`).replace(/[^\w-]/g,''); }
function normalizePhoneticMode(settings={}){
  if(settings.phoneticMode===true || settings.phoneticMode==='precise') return 'font';
  if(['none','font','zhuyin'].includes(settings.phoneticMode)) return settings.phoneticMode;
  if(['iansui','bopomofo'].includes(settings.fontFamily)) return 'font';
  return 'none';
}
function normalizeFontFamily(settings={}){
  const key=settings.fontFamily || 'default';
  return ['default','rounded','kai'].includes(key) ? key : 'default';
}
function normalizeState(s={}){
  return {
    students:Array.isArray(s.students) && s.students.length ? s.students : defaultStudents,
    books:s.books || {},
    bookFields:s.bookFields || {},
    bookPhonetics:s.bookPhonetics || {},
    attendance:s.attendance || {},
    settings:{
      lateTime:s.settings?.lateTime || '07:50',
      writingMode:s.settings?.writingMode || 'horizontal',
      fontScale:s.settings?.fontScale || 1,
      lineHeightScale:s.settings?.lineHeightScale || 1,
      fontFamily:normalizeFontFamily(s.settings || {}),
      phoneticMode:normalizePhoneticMode(s.settings || {}),
      textAlign:s.settings?.textAlign || 'center',
      className:s.settings?.className || '',
      layout:s.settings?.layout || {}
    }
  };
}
function loadState(){
  let raw=localStorage.getItem(STORAGE_KEY);
  if(!raw){ for(const k of OLD_KEYS){ if(localStorage.getItem(k)){ raw=localStorage.getItem(k); break; } } }
  if(raw){ try{ return normalizeState(JSON.parse(raw)); }catch(e){} }
  return normalizeState();
}
function save(){
  localStorage.setItem(STORAGE_KEY,JSON.stringify(state));
  if(refs.lastSaved) refs.lastSaved.textContent='最後儲存：'+nowTime();
  if(!isApplyingRemoteState) queueCloudSave();
}
function defaultBookFields(){ return Object.fromEntries(BOOK_FIELDS.map(([key])=>[key,key==='homework'])); }
function ensureDay(key){
  if(!state.attendance[key]) state.attendance[key]={};
  if(!state.books[key]) state.books[key]={homework:'',reminder:'',test:'',note:'',teacher:''};
  if(!state.bookFields) state.bookFields={};
  if(!state.bookFields[key]) state.bookFields[key]=defaultBookFields();
  if(!state.bookPhonetics) state.bookPhonetics={};
  if(!state.bookPhonetics[key]) state.bookPhonetics[key]={};
}
function getEnabledBookFields(key=selectedDate){
  ensureDay(key);
  return {...defaultBookFields(),...(state.bookFields[key]||{})};
}
function init(){
  refs.datePicker.value=selectedDate; refs.lateTime.value=state.settings.lateTime; refs.fontFamilySelect.value=state.settings.fontFamily||'default'; refs.phoneticModeSelect.value=state.settings.phoneticMode||'none'; refs.classNameInput.value=state.settings.className||''; ensureDay(selectedDate);
  applyLayout();
  updateLateTimeDisplay();
  wireEvents(); installLayoutResizers(); installResponsiveSizing(); tick(); setInterval(tick,1000); renderAll();
  installScreenWakeLock();
  initSchoolTemperature();
  initCloud();
}
function updateLateTimeDisplay(){
  const value=refs.lateTime.value||state.settings.lateTime||'07:50';
  const [h='07',m='50']=value.split(':');
  refs.lateHour.textContent=h;
  refs.lateMinute.textContent=m;
  if(refs.lateLegendOnTime) refs.lateLegendOnTime.textContent=value;
  if(refs.lateLegendLate) refs.lateLegendLate.textContent=value;
}
function clamp(n,min,max){ return Math.max(min,Math.min(max,n)); }
function getLayout(){ if(!state.settings.layout) state.settings.layout={}; return state.settings.layout; }
function applyLayout(){
  const layout=getLayout();
  if(!layout.topHeight) layout.topHeight=172;
  if(!layout.leftRatio) layout.leftRatio=.5;
  const maxTopHeight=clamp(Math.round(window.innerHeight*.28),112,300);
  layout.topHeight=clamp(layout.topHeight,112,maxTopHeight);
  refs.shell.style.setProperty('--top-height',layout.topHeight+'px');
  refs.mainGrid.classList.toggle('panels-swapped',!!layout.swapped);
  if(refs.swapPanelsBtn) refs.swapPanelsBtn.querySelector('span').textContent=layout.swapped?'恢復左右':'左右對調';
  updateMainLayoutWidth();
  updateResponsiveSizing();
}
function updateMainLayoutWidth(){
  const layout=getLayout();
  if(!refs.mainGrid) return;
  const width=refs.mainGrid.clientWidth||0;
  const handle=refs.mainResizeHandle?.offsetWidth||10;
  const gap=Number(getComputedStyle(refs.mainGrid).columnGap.replace('px',''))||0;
  const available=Math.max(0,width-handle-gap*2);
  const left=clamp(Math.round(available*(layout.leftRatio||.5)),Math.min(360,available*.7),Math.max(360,available-320));
  refs.shell.style.setProperty('--left-width',left+'px');
}
function updateResponsiveSizing(){
  if(!refs.shell) return;
  const topHeight=getLayout().topHeight||172;
  const contactPanel=refs.homeworkCard?.closest('.panel');
  const attendancePanel=refs.studentGrid?.closest('.panel');
  const viewportScale=clamp(Math.min(window.innerWidth/1280,window.innerHeight/760),.68,1.08);
  const heroScale=clamp(topHeight/172,.78,1.45);
  const panelScale=panel=>{
    if(!panel) return 1;
    const widthScale=panel.clientWidth/720;
    const heightScale=panel.clientHeight/620;
    return clamp(Math.min(widthScale,heightScale,viewportScale),.62,1.12);
  };
  refs.shell.style.setProperty('--viewport-scale',viewportScale.toFixed(3));
  refs.shell.style.setProperty('--hero-scale',heroScale.toFixed(3));
  const clockBox=refs.clock?.closest('.clock-block');
  if(clockBox){
    const boxWidth=Math.max(1,clockBox.clientWidth-12);
    const boxHeight=Math.max(1,clockBox.clientHeight-12);
    const clockSize=clamp(Math.min(boxWidth/4.58,boxHeight*1.08),56,220);
    refs.shell.style.setProperty('--clock-font-size',clockSize.toFixed(1)+'px');
  }
  contactPanel?.style.setProperty('--panel-scale',panelScale(contactPanel).toFixed(3));
  attendancePanel?.style.setProperty('--panel-scale',panelScale(attendancePanel).toFixed(3));
  updateAttendanceTileSizing();
  fitBookTextSoon();
}
function updateAttendanceTileSizing(){
  if(!refs.studentGrid) return;
  const gridRect=refs.studentGrid.getBoundingClientRect();
  const count=Math.max(1,state.students?.length || 30);
  const columns=window.innerWidth<1050 ? Math.min(6,Math.max(3,Math.ceil(Math.sqrt(count)))) : 6;
  const rows=Math.ceil(count/columns);
  const gap=Number(getComputedStyle(refs.studentGrid).gap.replace('px',''))||8;
  const tileWidth=(gridRect.width-gap*(columns-1))/columns;
  const tileHeight=(gridRect.height-gap*(rows-1))/rows;
  const seatSize=clamp(Math.floor(Math.min(tileWidth*.42,tileHeight*.48)),16,42);
  refs.studentGrid.style.setProperty('--student-columns',columns);
  refs.studentGrid.style.setProperty('--student-rows',rows);
  refs.studentGrid.style.setProperty('--student-seat-size',seatSize+'px');
}
function installLayoutResizers(){
  const drag=(handle,onMove)=>{
    if(!handle) return;
    handle.addEventListener('pointerdown',e=>{
      e.preventDefault();
      handle.setPointerCapture?.(e.pointerId);
      document.body.classList.add('resizing-layout');
      const move=ev=>{ onMove(ev); applyLayout(); };
      const up=()=>{
        document.removeEventListener('pointermove',move);
        document.removeEventListener('pointerup',up);
        document.body.classList.remove('resizing-layout');
        save();
      };
      document.addEventListener('pointermove',move);
      document.addEventListener('pointerup',up,{once:true});
    });
  };
  drag(refs.topResizeHandle,e=>{
    const rect=refs.shell.getBoundingClientRect();
    getLayout().topHeight=clamp(e.clientY-rect.top,132,Math.min(300,window.innerHeight*.34));
  });
  drag(refs.mainResizeHandle,e=>{
    const rect=refs.mainGrid.getBoundingClientRect();
    const handle=refs.mainResizeHandle.offsetWidth||10;
    const ratio=clamp((e.clientX-rect.left-handle/2)/Math.max(1,rect.width-handle),.32,.68);
    getLayout().leftRatio=ratio;
  });
  window.addEventListener('resize',()=>{ applyLayout(); fitBookTextSoon(); });
  document.addEventListener('fullscreenchange',()=>setTimeout(()=>{ applyLayout(); fitBookTextSoon(); },80));
}
function installResponsiveSizing(){
  if(!window.ResizeObserver) return;
  const observer=new ResizeObserver(()=>updateResponsiveSizing());
  [refs.hero,refs.mainGrid,refs.homeworkCard?.closest('.panel'),refs.studentGrid?.closest('.panel')].filter(Boolean).forEach(el=>observer.observe(el));
}
function wakeLockMessage(status=wakeLockStatus){
  const messages={
    idle:'螢幕喚醒準備中',
    active:'螢幕保持喚醒中',
    hidden:'分頁在背景，已暫停螢幕喚醒',
    unsupported:'此瀏覽器不支援螢幕喚醒',
    failed:'螢幕喚醒失敗，請確認瀏覽器與 Windows 電源設定',
    disabled:'家長分享頁不啟用螢幕喚醒'
  };
  return messages[status] || messages.idle;
}
function updateWakeLockUi(status=wakeLockStatus){
  wakeLockStatus=status;
  const message=wakeLockMessage(status);
  if(refs.wakeLockStatus){
    refs.wakeLockStatus.textContent=message;
    refs.wakeLockStatus.dataset.status=status;
  }
  if(refs.fullscreenBtn){
    refs.fullscreenBtn.title=message;
    refs.fullscreenBtn.dataset.wakeStatus=status;
  }
}
function shouldKeepScreenAwake(){
  return wakeLockWanted && !cloud.parentShareId && document.visibilityState==='visible';
}
async function releaseScreenWakeLock(status=document.visibilityState==='visible'?'idle':'hidden'){
  const wakeLock=screenWakeLock;
  screenWakeLock=null;
  if(wakeLock){
    try{ await wakeLock.release(); }
    catch(err){ console.warn('Unable to release screen wake lock.',err); }
  }
  updateWakeLockUi(status);
}
function scheduleWakeLockRetry(){
  clearTimeout(wakeLockRetryTimer);
  wakeLockRetryTimer=setTimeout(()=>syncScreenWakeLock(),1200);
}
async function requestScreenWakeLock(){
  if(!shouldKeepScreenAwake()){
    await releaseScreenWakeLock(cloud.parentShareId?'disabled':'hidden');
    return;
  }
  if(!('wakeLock' in navigator)){
    updateWakeLockUi('unsupported');
    return;
  }
  try{
    const wakeLock=await navigator.wakeLock.request('screen');
    if(!shouldKeepScreenAwake()){
      await wakeLock.release();
      return;
    }
    if(screenWakeLock && screenWakeLock!==wakeLock) await releaseScreenWakeLock('idle');
    screenWakeLock=wakeLock;
    updateWakeLockUi('active');
    wakeLock.addEventListener('release',()=>{
      if(screenWakeLock===wakeLock){
        screenWakeLock=null;
        updateWakeLockUi(document.visibilityState==='visible'?'idle':'hidden');
        if(shouldKeepScreenAwake()) scheduleWakeLockRetry();
      }
    });
  }catch(err){
    console.warn('Unable to request screen wake lock.',err);
    updateWakeLockUi('failed');
  }
}
async function syncScreenWakeLock(){
  if(shouldKeepScreenAwake()) await requestScreenWakeLock();
  else await releaseScreenWakeLock(cloud.parentShareId?'disabled':'hidden');
}
function installScreenWakeLock(){
  wakeLockWanted=!cloud.parentShareId;
  updateWakeLockUi(wakeLockWanted?'idle':'disabled');
  if(!wakeLockWanted) return;
  syncScreenWakeLock();
  document.addEventListener('visibilitychange',syncScreenWakeLock);
  const retryAfterGesture=()=>{
    if(wakeLockStatus==='failed' || wakeLockStatus==='idle') syncScreenWakeLock();
  };
  document.addEventListener('pointerdown',retryAfterGesture);
  document.addEventListener('keydown',retryAfterGesture);
}
function setSchoolTemperature(value){
  if(!refs.schoolTempLink) return;
  refs.schoolTempLink.href=AIR_DASHBOARD_URL;
  refs.schoolTempLink.classList.remove('temp-hot','temp-cool','temp-unknown');
  const rawValue=String(value ?? '').trim();
  const temperature=rawValue ? Number(rawValue) : NaN;
  if(Number.isFinite(temperature)){
    const label=Number.isInteger(temperature) ? String(temperature) : temperature.toFixed(1);
    refs.schoolTempLink.textContent=`氣溫 ${label}°C`;
    refs.schoolTempLink.classList.add(temperature>=28 ? 'temp-hot' : 'temp-cool');
    refs.schoolTempLink.title='點擊查看中山國小氣溫來源';
    return;
  }
  refs.schoolTempLink.textContent='氣溫暫無資料';
  refs.schoolTempLink.classList.add('temp-unknown');
  refs.schoolTempLink.title='點擊查看中山國小氣溫來源';
}
function getTemperatureProxyUrl(){
  return String(classConfig.temperatureProxyUrl || window.CSES_TEMP_PROXY_URL || '').trim();
}
function parseProxyTemperature(payload){
  const rawValue=String(payload?.temperature ?? '').trim();
  if(!/^-?\d+(?:\.\d+)?$/.test(rawValue)) return null;
  const value=Number(rawValue);
  return Number.isFinite(value) && value>0 && value<=60 ? value : null;
}
async function fetchSchoolTemperature(){
  const proxyUrl=getTemperatureProxyUrl();
  if(!proxyUrl){ setSchoolTemperature(null); return; }
  try{
    const response=await fetch(proxyUrl,{cache:'no-store'});
    if(!response.ok) throw new Error(`temperature source ${response.status}`);
    const temperature=parseProxyTemperature(await response.json());
    if(temperature===null) throw new Error('temperature not found');
    setSchoolTemperature(temperature);
  }catch(err){
    setSchoolTemperature(null);
  }
}
function initSchoolTemperature(){
  setSchoolTemperature(null);
  fetchSchoolTemperature();
  setInterval(fetchSchoolTemperature,TEMP_REFRESH_MS);
}
function tick(){
  const n=new Date();
  const hh=String(n.getHours()).padStart(2,'0'), mm=String(n.getMinutes()).padStart(2,'0'), ss=String(n.getSeconds()).padStart(2,'0');
  refs.clock.setAttribute('aria-label',`${hh}:${mm}:${ss}`);
  refs.clockHours.textContent=hh; refs.clockMinutes.textContent=mm; refs.clockSeconds.textContent=ss;
  refs.dateFull.textContent=`${n.getFullYear()}年${String(n.getMonth()+1).padStart(2,'0')}月${String(n.getDate()).padStart(2,'0')}日`; refs.weekText.textContent=`星期${'日一二三四五六'[n.getDay()]}`;
  refs.lunarText.textContent=getClassName();
  const hm=`${String(n.getHours()).padStart(2,'0')}:${String(n.getMinutes()).padStart(2,'0')}`; refs.timeStatus.textContent= hm<=state.settings.lateTime ? '準時時段 ✅' : '遲到時段 ⚠️';
}
function wireEvents(){
  refs.fullscreenBtn.onclick=()=>{ if(!document.fullscreenElement) document.documentElement.requestFullscreen?.(); else document.exitFullscreen?.(); };
  refs.datePicker.onchange=()=>{ selectedDate=refs.datePicker.value; ensureDay(selectedDate); editMode=false; renderAll(); save(); };
  refs.calendarBtn.onclick=()=>window.open(CALENDAR_URL,'_blank','noopener');
  refs.lateTime.onchange=()=>{ state.settings.lateTime=refs.lateTime.value; updateLateTimeDisplay(); renderAttendance(); save(); };
  refs.swapPanelsBtn.onclick=()=>{ const layout=getLayout(); layout.swapped=!layout.swapped; applyLayout(); save(); };
  refs.fontDownBtn.onclick=()=>changeFontScale(-0.1);
  refs.fontUpBtn.onclick=()=>changeFontScale(0.1);
  refs.lineHeightDownBtn.onclick=()=>changeLineHeight(-0.1);
  refs.lineHeightUpBtn.onclick=()=>changeLineHeight(0.1);
  refs.phoneticModeSelect.onchange=()=>setPhoneticMode(refs.phoneticModeSelect.value);
  refs.alignLeftBtn.onclick=()=>setBookAlign('left');
  refs.alignCenterBtn.onclick=()=>setBookAlign('center');
  refs.alignRightBtn.onclick=()=>setBookAlign('right');
  refs.fontFamilySelect.onchange=()=>{ state.settings.fontFamily=refs.fontFamilySelect.value; applyFontScale(); fitBookTextSoon(); save(); };
  refs.formatBtn.onclick=()=>toggleFormatPanel();

  refs.editBtn.onclick=()=>{ editMode=!editMode; renderBook(); };
  refs.saveBookBtn.onclick=()=>{ writeBookFromInputs(); editMode=false; renderBook(); save(); };
  refs.bookFieldToggles?.querySelectorAll('input[data-book-field]').forEach(toggle=>{
    toggle.addEventListener('change',()=>{
      ensureDay(selectedDate);
      state.bookFields[selectedDate]={...getEnabledBookFields(),[toggle.dataset.bookField]:toggle.checked};
      renderBook();
      save();
    });
  });
  bookInputEntries().forEach(([,textarea])=>{
    const remember=()=>capturePhoneticSelection(textarea);
    textarea.addEventListener('input',()=>{writeBookFromInputs(); remember(); save(); refs.autosaveHint.textContent='已自動儲存：'+nowTime();});
    ['focus','select','keyup','mouseup','pointerup'].forEach(type=>textarea.addEventListener(type,remember));
  });
  refs.copyYesterdayBtn.onclick=()=>{ const d=new Date(selectedDate+'T00:00:00'); d.setDate(d.getDate()-1); const y=dateKey(d); if(state.books[y]){ ensureDay(selectedDate); state.books[selectedDate]={...state.books[selectedDate],homework:state.books[y].homework||''}; renderBook(); save(); } else alert('前一天沒有聯絡簿內容'); };
  refs.markPhoneticBtn.onmousedown=e=>e.preventDefault();
  refs.markPhoneticBtn.onclick=openPhoneticEditor;
  refs.savePhoneticBtn.onclick=savePhoneticAnnotation;
  refs.clearPhoneticBtn.onclick=clearPhoneticAnnotation;
  refs.writingModeBtn.onclick=()=>{ state.settings.writingMode='horizontal'; renderBook(); save(); };
  refs.viewModeBtn.onclick=()=>{ state.settings.writingMode='vertical'; renderBook(); save(); };
  refs.namesBtn.onclick=openNames;
  refs.saveNamesBtn.onclick=saveNames;
  refs.resetNamesBtn.onclick=()=>{state.students=defaultStudents; refs.namesInput.value=studentsToText(); renderAttendance(); save();};
  refs.allOnTimeBtn.onclick=markAllOnTime;
  refs.resetBtn.onclick=()=>{ if(confirm('確定重設今天所有簽到紀錄？')){ state.attendance[selectedDate]={}; renderAttendance(); save(); }};
  refs.statsBtn.onclick=showTodayStats;
  refs.recordsBtn.onclick=showRecords;
  refs.settingsBtn.onclick=()=>refs.settingsDialog.showModal();
  refs.classNameInput.oninput=()=>{ state.settings.className=refs.classNameInput.value.trim(); refs.lunarText.textContent=getClassName(); save(); };
  refs.signInBtn.onclick=signInTeacher;
  refs.signOutBtn.onclick=signOutTeacher;
  refs.publishShareBtn.onclick=publishParentShare;
  refs.copyShareBtn.onclick=copyParentShareLink;
  refs.helpBtn.onclick=showHelp;
  document.querySelectorAll('[data-close]').forEach(b=>b.onclick=()=>$(b.dataset.close).close());
  refs.markOnTimeBtn.onclick=()=>{markSeat(selectedSeat,'ontime'); refs.studentDialog.close();};
  refs.markLateBtn.onclick=()=>{markSeat(selectedSeat,'late'); refs.studentDialog.close();};
  refs.markLeaveBtn.onclick=()=>{markSeat(selectedSeat,'leave'); refs.studentDialog.close();};
  refs.markAbsentBtn.onclick=()=>{markSeat(selectedSeat,'absent'); refs.studentDialog.close();};
}
function toggleFormatPanel(){
  const open=refs.formatPanel.classList.toggle('hidden')===false;
  refs.formatBtn.classList.toggle('active',open);
  refs.formatBtn.setAttribute('aria-expanded',String(open));
  setTimeout(()=>fitBookTextSoon(),0);
}
function changeFontScale(delta){ state.settings.fontScale=Math.max(0.75,Math.min(2.2,Number((state.settings.fontScale+delta).toFixed(2)))); applyFormatSettings(); fitBookTextSoon(); save(); }
function changeLineHeight(delta){ state.settings.lineHeightScale=Math.max(0.9,Math.min(2.2,Number(((state.settings.lineHeightScale||1)+delta).toFixed(2)))); applyFormatSettings(); fitBookTextSoon(); save(); }
function setPhoneticMode(mode){
  state.settings.phoneticMode=['none','font','zhuyin'].includes(mode) ? mode : 'none';
  applyFormatSettings();
  renderBook();
  save();
}
function applyFontScale(){ applyFormatSettings(); }
function applyFormatSettings(){
  const scale=state.settings.fontScale||1;
  const lineHeightScale=state.settings.lineHeightScale||1;
  const mode=normalizePhoneticMode(state.settings);
  state.settings.phoneticMode=mode;
  const fontKey=normalizeFontFamily(state.settings);
  state.settings.fontFamily=fontKey;
  const effectiveFontKey=mode==='font' ? 'iansui' : fontKey;
  const family=FONT_STACKS[effectiveFontKey]||FONT_STACKS.default;
  refs.bookDisplay.dataset.fontFamily=effectiveFontKey;
  refs.editor.dataset.fontFamily=fontKey;
  refs.bookDisplay.dataset.phoneticMode=mode;
  refs.editor.dataset.phoneticMode=mode;
  refs.bookDisplay.style.setProperty('--book-font-scale',scale);
  refs.editor.style.setProperty('--book-font-scale',scale);
  refs.bookDisplay.style.setProperty('--book-line-height-scale',lineHeightScale);
  refs.editor.style.setProperty('--book-line-height-scale',lineHeightScale);
  refs.bookDisplay.style.setProperty('--book-font-family',family);
  refs.editor.style.setProperty('--book-font-family',FONT_STACKS[fontKey]||FONT_STACKS.default);
  refs.fontScaleLabel.textContent=Math.round(scale*100)+'%';
  refs.lineHeightLabel.textContent=Math.round(lineHeightScale*100)+'%';
  refs.fontFamilySelect.value=fontKey;
  refs.phoneticModeSelect.value=mode;
}
function setBookAlign(align){ state.settings.textAlign=align; applyBookAlign(); fitBookTextSoon(); save(); }
function applyBookAlign(){
  const align=['left','center','right'].includes(state.settings.textAlign) ? state.settings.textAlign : 'center';
  refs.bookDisplay.dataset.align=align;
  [[refs.alignLeftBtn,'left'],[refs.alignCenterBtn,'center'],[refs.alignRightBtn,'right']].forEach(([btn,value])=>{
    if(!btn) return;
    btn.classList.toggle('active',align===value);
    btn.setAttribute('aria-pressed',String(align===value));
  });
}
function renderAll(){ refs.selectedDateLabel.textContent=displayDate(selectedDate); applyFontScale(); applyBookAlign(); renderBook(); renderAttendance(); }
function escapeHtml(text){ return String(text).replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch])); }
function isChineseChar(ch){ return /^[\u3400-\u9fff]$/.test(ch); }
function getBookLineEntries(text){
  const entries=[];
  let cursor=0;
  String(text||'').split('\n').forEach(rawLine=>{
    const trimmed=rawLine.trim();
    if(trimmed){
      const leading=rawLine.match(/^\s*/)?.[0].length || 0;
      entries.push({text:trimmed,start:cursor+leading});
    }
    cursor+=rawLine.length+1;
  });
  return entries;
}
function formatBookText(entries,startNo=1,fieldKey=''){
  const mode=state.settings.phoneticMode;
  return entries.map((line,index)=>{
    const body=mode==='zhuyin' ? renderZhuyinOnlyText(line.text,fieldKey,line.start) : (mode==='font' ? renderIvsText(line.text,fieldKey,line.start) : formatInlineText(line.text));
    return `<div class="book-line"><span class="line-no">${startNo+index}.</span><span>${body}</span></div>`;
  }).join('');
}
function normalizeToken(text){
  return String(text).replace(/[Ａ-Ｚａ-ｚ０-９]/g,ch=>String.fromCharCode(ch.charCodeAt(0)-0xFEE0)).replace(/[－—–～〜~]/g,'-').replace(/[．.・‧·]/g,'').replace(/\s+/g,'');
}
function isValidZhuyin(text){
  return /^[\u3105-\u312f\u02d9\u02ca\u02c7\u02cb\u02ea\u02eb\s]+$/.test(String(text||'').trim());
}
function compactZhuyin(text){ return String(text||'').replace(/\s+/g,'').trim(); }
function ivsSelector(variant=0){ return variant>0 ? String.fromCodePoint(0xE01E0+variant) : ''; }
function formatInlineText(text){
  return String(text).split(/([A-Za-zＡ-Ｚａ-ｚ]+(?:\s*[．.・‧·]?\s*)[0-9０-９]+(?:\s*[－—–～〜~-]\s*[0-9０-９]+)?|[A-Za-zＡ-Ｚａ-ｚ]+|[0-9０-９]+(?:\s*[－—–～〜~-]\s*[0-9０-９]+)*)/g).map(part=>{
    if(!part) return '';
    if(/[A-Za-zＡ-Ｚａ-ｚ0-9０-９]/.test(part)) return `<span class="inline-token">${escapeHtml(normalizeToken(part))}</span>`;
    return escapeHtml(part);
  }).join('');
}
function getValidPhoneticMap(fieldKey,fullText){
  const day=state.bookPhonetics?.[selectedDate] || {};
  const list=Array.isArray(day[fieldKey]) ? day[fieldKey] : [];
  const map=new Map();
  list.forEach(item=>{
    if(!item || !Number.isInteger(item.index) || !isValidZhuyin(item.note)) return;
    if(fullText[item.index]!==item.char) return;
    map.set(item.index,{note:compactZhuyin(item.note),variant:Number(item.variant)||0});
  });
  return map;
}
function renderIvsText(text,fieldKey,lineStart){
  const fullText=state.books[selectedDate]?.[fieldKey] || '';
  const notes=getValidPhoneticMap(fieldKey,fullText);
  return String(text).split(/([A-Za-zＡ-Ｚａ-ｚ]+(?:\s*[．.・‧·]?\s*)[0-9０-９]+(?:\s*[－—–～〜~-]\s*[0-9０-９]+)?|[A-Za-zＡ-Ｚａ-ｚ]+|[0-9０-９]+(?:\s*[－—–～〜~-]\s*[0-9０-９]+)*)/g).map((part,partIndex,parts)=>{
    if(!part) return '';
    if(/[A-Za-zＡ-Ｚａ-ｚ0-9０-９]/.test(part)) return `<span class="inline-token">${escapeHtml(normalizeToken(part))}</span>`;
    const before=parts.slice(0,partIndex).join('').length;
    return [...part].map((ch,i)=>{
      const sourceIndex=lineStart+before+i;
      const note=notes.get(sourceIndex);
      if(note && isChineseChar(ch)) return escapeHtml(ch+ivsSelector(note.variant));
      return escapeHtml(ch);
    }).join('');
  }).join('');
}
function zhuyinForChar(ch,note){
  if(note?.note) return note.note;
  return PHONETIC_READINGS[ch]?.[0] || '';
}
function splitZhuyinTone(note){
  const text=compactZhuyin(note);
  const tones=['\u02ca','\u02c7','\u02cb','\u02d9','\u02ea','\u02eb'];
  let tone='';
  const body=[...text].filter(ch=>{
    if(tones.includes(ch)){ tone=ch; return false; }
    return true;
  }).join('');
  return {body,tone};
}
function renderZhuyinOnlyToken(note){
  const {body,tone}=splitZhuyinTone(note);
  return `<span class="zhuyin-only-token"><span class="zhuyin-body">${escapeHtml(body)}</span><span class="zhuyin-tone">${escapeHtml(tone)}</span></span>`;
}
function renderZhuyinOnlyText(text,fieldKey,lineStart){
  const fullText=state.books[selectedDate]?.[fieldKey] || '';
  const notes=getValidPhoneticMap(fieldKey,fullText);
  return String(text).split(/([A-Za-zＡ-Ｚａ-ｚ]+(?:\s*[．.・‧·]?\s*)[0-9０-９]+(?:\s*[－—–～〜~-]\s*[0-9０-９]+)?|[A-Za-zＡ-Ｚａ-ｚ]+|[0-9０-９]+(?:\s*[－—–～〜~-]\s*[0-9０-９]+)*)/g).map((part,partIndex,parts)=>{
    if(!part) return '';
    if(/[A-Za-zＡ-Ｚａ-ｚ0-9０-９]/.test(part)) return `<span class="inline-token">${escapeHtml(normalizeToken(part))}</span>`;
    const before=parts.slice(0,partIndex).join('').length;
    return [...part].map((ch,i)=>{
      const sourceIndex=lineStart+before+i;
      if(isChineseChar(ch)){
        const note=zhuyinForChar(ch,notes.get(sourceIndex));
        return note ? renderZhuyinOnlyToken(note) : '';
      }
      return escapeHtml(ch);
    }).join('');
  }).join('');
}
function renderBook(){
  ensureDay(selectedDate); const b=state.books[selectedDate]||{};
  const enabled=getEnabledBookFields();
  refs.bookDisplay.closest('.contact-panel')?.classList.toggle('editing',editMode);
  applyBookAlign();
  refs.bookDisplay.classList.toggle('vertical-mode',state.settings.writingMode==='vertical'); refs.bookDisplay.classList.toggle('horizontal-mode',state.settings.writingMode!=='vertical');
  refs.writingModeBtn.textContent='橫書'; refs.viewModeBtn.textContent='直書';
  refs.writingModeBtn.classList.toggle('active',state.settings.writingMode!=='vertical');
  refs.viewModeBtn.classList.toggle('active',state.settings.writingMode==='vertical');
  refs.writingModeBtn.setAttribute('aria-pressed',String(state.settings.writingMode!=='vertical'));
  refs.viewModeBtn.setAttribute('aria-pressed',String(state.settings.writingMode==='vertical'));
  const items=BOOK_FIELDS.map(([key])=>[key,refs[key+'Card'],refs[key+'View'],refs[key+'Input']]);
  refs.bookFieldToggles?.querySelectorAll('input[data-book-field]').forEach(toggle=>{
    toggle.checked=!!enabled[toggle.dataset.bookField];
  });
  refs.editor?.querySelectorAll('[data-book-field-panel]').forEach(panel=>{
    panel.classList.toggle('hidden',!enabled[panel.dataset.bookFieldPanel]);
  });
  let any=false, visibleCount=0, nextNo=1; items.forEach(([k,card,view,input],order)=>{ const val=b[k]||''; const entries=getBookLineEntries(val); const weight=Math.max(1,entries.length); view.innerHTML=formatBookText(entries,nextNo,k); input.value=val; card.style.order=order; card.style.setProperty('--card-weight',weight); card.dataset.lineCount=entries.length; card.style.display=enabled[k]&&entries.length?'':'none'; if(enabled[k]&&entries.length){ any=true; visibleCount++; nextNo+=entries.length; } });
  refs.bookDisplay.dataset.visibleCount=visibleCount;
  refs.emptyBookMessage.style.display= any ? 'none':'grid'; refs.editor.classList.toggle('hidden',!editMode); refs.bookDisplay.classList.toggle('hidden',editMode); refs.editBtn.textContent=editMode?'返回':'編輯'; fitBookTextSoon();
}
function fitBookTextSoon(){ requestAnimationFrame(()=>requestAnimationFrame(fitBookText)); }
function fitBookText(){
  if(editMode || refs.bookDisplay.classList.contains('hidden')) return;
  const scale=state.settings.fontScale||1;
  const visibleCount=Number(refs.bookDisplay.dataset.visibleCount||0);
  const cards=[refs.homeworkCard,refs.reminderCard,refs.testCard,refs.noteCard,refs.teacherCard].filter(card=>card.style.display!=='none');
  cards.forEach(card=>{
    const text=card.querySelector('.book-text'), title=card.querySelector('h2');
    if(!text || !title) return;
    text.style.fontSize=''; title.style.fontSize='';
    const minSize=visibleCount>1 ? 12 : 14;
    let low=minSize, high=48*scale, best=low;
    for(let i=0;i<8;i++){
      const size=(low+high)/2;
      text.style.fontSize=size+'px';
      title.style.fontSize=Math.min(size*.78,34*scale)+'px';
      const overflow=card.scrollHeight>card.clientHeight+1 || card.scrollWidth>card.clientWidth+1;
      if(overflow) high=size; else { best=size; low=size; }
    }
    text.style.fontSize=best+'px';
    title.style.fontSize=Math.min(best*.78,34*scale)+'px';
    while(best>minSize && (card.scrollHeight>card.clientHeight+1 || card.scrollWidth>card.clientWidth+1)){
      best-=1;
      text.style.fontSize=best+'px';
      title.style.fontSize=Math.min(best*.78,34*scale)+'px';
    }
    text.style.fontSize=best+'px';
    title.style.fontSize=Math.min(best*.78,34*scale)+'px';
  });
}
function bookInputEntries(){
  return [
    ['homework',refs.homeworkInput],
    ['reminder',refs.reminderInput],
    ['test',refs.testInput],
    ['note',refs.noteInput],
    ['teacher',refs.teacherInput]
  ];
}
function pruneInvalidPhonetics(dateKeyValue,fieldKey,text){
  const day=state.bookPhonetics?.[dateKeyValue];
  const list=day?.[fieldKey];
  if(!Array.isArray(list)) return;
  const kept=list.filter(item=>item && Number.isInteger(item.index) && text[item.index]===item.char && isValidZhuyin(item.note));
  if(kept.length) day[fieldKey]=kept;
  else delete day[fieldKey];
}
function writeBookFromInputs(){
  ensureDay(selectedDate);
  state.books[selectedDate]={...(state.books[selectedDate]||{}),homework:refs.homeworkInput.value,reminder:refs.reminderInput.value,test:refs.testInput.value,note:refs.noteInput.value,teacher:refs.teacherInput.value};
  BOOK_FIELDS.forEach(([field])=>pruneInvalidPhonetics(selectedDate,field,state.books[selectedDate][field]||''));
}
function textareaFieldKey(textarea){
  const found=bookInputEntries().find(([,input])=>input===textarea);
  return found?.[0] || '';
}
function phoneticTargetFromTextarea(textarea){
  const field=textareaFieldKey(textarea);
  const value=textarea.value;
  const start=textarea.selectionStart ?? 0;
  const end=textarea.selectionEnd ?? start;
  let index=-1;
  if(end>start){
    for(let i=start;i<end;i++){ if(isChineseChar(value[i])){ index=i; break; } }
  }else if(isChineseChar(value[start])){
    index=start;
  }else if(start>0 && isChineseChar(value[start-1])){
    index=start-1;
  }
  if(index<0) return null;
  return {field,textarea,index,char:value[index]};
}
function capturePhoneticSelection(textarea){
  const target=phoneticTargetFromTextarea(textarea);
  if(target) lastPhoneticSelection={field:target.field,index:target.index,char:target.char};
}
function currentPhoneticTarget(){
  const activeTextarea=bookInputEntries().map(([,input])=>input).find(input=>input===document.activeElement);
  const activeTarget=activeTextarea ? phoneticTargetFromTextarea(activeTextarea) : null;
  if(activeTarget) return activeTarget;
  if(!lastPhoneticSelection) return null;
  const textarea=bookInputEntries().find(([field])=>field===lastPhoneticSelection.field)?.[1];
  if(!textarea) return null;
  const value=textarea.value;
  if(value[lastPhoneticSelection.index]!==lastPhoneticSelection.char) return null;
  return {...lastPhoneticSelection,textarea};
}
function existingPhoneticForTarget(target){
  const list=state.bookPhonetics?.[selectedDate]?.[target.field] || [];
  return list.find(item=>item.index===target.index && item.char===target.char);
}
function renderPhoneticChoices(target,selectedNote=''){
  const choices=PHONETIC_CANDIDATES[target.char] || [];
  refs.phoneticChoices.innerHTML='';
  if(!choices.length){
    refs.phoneticChoices.innerHTML='<span class="subtle">這個字暫無內建候選，會使用字型預設注音。</span>';
    selectedPhoneticVariant=0;
    refs.phoneticInput.value='';
    return;
  }
  choices.forEach((note,variant)=>{
    const btn=document.createElement('button');
    btn.type='button';
    btn.className='phonetic-choice';
    btn.textContent=note;
    btn.dataset.variant=String(variant);
    btn.classList.toggle('active',compactZhuyin(selectedNote)===note);
    btn.onclick=()=>{
      selectedPhoneticVariant=variant;
      refs.phoneticInput.value=note;
      refs.phoneticChoices.querySelectorAll('.phonetic-choice').forEach(el=>el.classList.toggle('active',el===btn));
    };
    refs.phoneticChoices.appendChild(btn);
  });
  const matchIndex=choices.indexOf(compactZhuyin(selectedNote));
  selectedPhoneticVariant=matchIndex>=0 ? matchIndex : 0;
}
function openPhoneticEditor(){
  writeBookFromInputs();
  const target=currentPhoneticTarget();
  if(!target){ alert('請先在聯絡簿文字框中選取一個中文字，再按「標注破音」。'); return; }
  selectedPhoneticTarget=target;
  const existing=existingPhoneticForTarget(target);
  refs.phoneticChar.textContent=target.char;
  refs.phoneticInput.value=existing?.note || '';
  selectedPhoneticVariant=Number(existing?.variant)||0;
  renderPhoneticChoices(target,existing?.note || '');
  refs.phoneticDialog.showModal();
  setTimeout(()=>refs.phoneticInput.focus(),0);
}
function savePhoneticAnnotation(){
  if(!selectedPhoneticTarget) return;
  const note=compactZhuyin(refs.phoneticInput.value);
  const choices=PHONETIC_CANDIDATES[selectedPhoneticTarget.char] || [];
  if(!choices.length){ alert('這個字暫無內建破音候選，會使用字型預設注音。'); return; }
  if(!isValidZhuyin(note) || !choices.includes(note)){ alert('請先點選一個候選讀音。'); return; }
  ensureDay(selectedDate);
  writeBookFromInputs();
  const target=selectedPhoneticTarget;
  if((state.books[selectedDate]?.[target.field] || '')[target.index]!==target.char){ alert('文字已變更，請重新選取要標注的字。'); return; }
  const matchedVariant=choices.indexOf(note);
  const variant=matchedVariant>=0 ? matchedVariant : selectedPhoneticVariant;
  const day=state.bookPhonetics[selectedDate];
  const list=Array.isArray(day[target.field]) ? day[target.field].filter(item=>item.index!==target.index) : [];
  list.push({index:target.index,char:target.char,note,variant});
  list.sort((a,b)=>a.index-b.index);
  day[target.field]=list;
  state.settings.phoneticMode=state.settings.phoneticMode==='zhuyin' ? 'zhuyin' : 'font';
  refs.phoneticDialog.close();
  applyFormatSettings();
  renderBook();
  save();
}
function clearPhoneticAnnotation(){
  if(!selectedPhoneticTarget) return;
  const day=state.bookPhonetics?.[selectedDate];
  const list=day?.[selectedPhoneticTarget.field];
  if(Array.isArray(list)){
    const kept=list.filter(item=>item.index!==selectedPhoneticTarget.index);
    if(kept.length) day[selectedPhoneticTarget.field]=kept;
    else delete day[selectedPhoneticTarget.field];
  }
  refs.phoneticDialog.close();
  renderBook();
  save();
}
function teacherWelcomeHint(){
  const name=String(cloud.user?.displayName || cloud.user?.email?.split('@')[0] || '教師').trim();
  return `歡迎${name}老師登入，點擊日期可以預先編輯之後的功課。`;
}
function updateCloudUi(message){
  const shareMode=!!cloud.parentShareId;
  document.body.classList.toggle('parent-share-mode',shareMode);
  refs.signInBtn.disabled=shareMode || !cloud.configured || !!cloud.user;
  refs.signOutBtn.disabled=shareMode || !cloud.user;
  refs.publishShareBtn.disabled=shareMode || !cloud.user;
  refs.copyShareBtn.disabled=shareMode || !cloud.user;
  if(refs.shareAttendanceToggle) refs.shareAttendanceToggle.disabled=shareMode || !cloud.user;
  if(shareMode){
    if(refs.cloudModeLabel) refs.cloudModeLabel.textContent='家長分享模式';
    if(refs.cloudHint) refs.cloudHint.textContent=message || '正在讀取老師分享的聯絡簿。';
    if(refs.storageStatus) refs.storageStatus.textContent='▣ 家長只讀分享頁';
    return;
  }
  if(!cloud.configured){
    if(refs.cloudModeLabel) refs.cloudModeLabel.textContent='本機模式';
    if(refs.cloudHint) refs.cloudHint.textContent='本系統可以單機使用亦可登入 Google 帳號。';
    if(refs.storageStatus) refs.storageStatus.textContent='▣ 資料已自動儲存於本機';
    return;
  }
  if(cloud.user){
    if(refs.cloudModeLabel) refs.cloudModeLabel.textContent='教師雲端同步';
    if(refs.cloudHint) refs.cloudHint.textContent=message && !/同步|教師雲端資料/.test(message) ? message : teacherWelcomeHint();
    if(refs.storageStatus) refs.storageStatus.textContent='▣ 資料已儲存在本機並同步到教師雲端';
    return;
  }
  if(refs.cloudModeLabel) refs.cloudModeLabel.textContent='雲端待登入';
  if(refs.cloudHint) refs.cloudHint.textContent=message || '本系統可以單機使用亦可登入 Google 帳號。';
  if(refs.storageStatus) refs.storageStatus.textContent='▣ 未登入時先儲存在本機';
}
async function initCloud(){
  updateCloudUi();
  if(!cloud.configured){
    if(cloud.parentShareId) updateCloudUi('Firebase 尚未設定，無法讀取家長分享頁。');
    return;
  }
  try{
    const appMod=await import(`https://www.gstatic.com/firebasejs/${FIREBASE_CDN_VERSION}/firebase-app.js`);
    const authMod=await import(`https://www.gstatic.com/firebasejs/${FIREBASE_CDN_VERSION}/firebase-auth.js`);
    const dbMod=await import(`https://www.gstatic.com/firebasejs/${FIREBASE_CDN_VERSION}/firebase-firestore.js`);
    const app=appMod.initializeApp(firebaseConfig);
    cloud.auth=authMod.getAuth(app);
    cloud.db=dbMod.getFirestore(app);
    cloud.provider=new authMod.GoogleAuthProvider();
    cloud.api={...authMod,...dbMod};
    if(cloud.parentShareId){
      await loadParentShare();
      return;
    }
    cloud.api.onAuthStateChanged(cloud.auth,user=>{
      cloud.user=user;
      if(user) subscribeTeacherData();
      else {
        if(cloud.unsubscribe) cloud.unsubscribe();
        cloud.unsubscribe=null;
        updateCloudUi();
      }
    });
  }catch(err){
    console.error(err);
    updateCloudUi('Firebase 載入失敗，先使用本機模式。');
  }
}
function teacherDocRef(){
  return cloud.api.doc(cloud.db,'teachers',cloud.user.uid,'classes',getClassId());
}
function publicShareDocRef(shareId=getShareId()){
  return cloud.api.doc(cloud.db,'publicShares',shareId);
}
function serializeTeacherState(){
  return {
    students:state.students,
    books:state.books,
    bookFields:state.bookFields || {},
    bookPhonetics:state.bookPhonetics || {},
    attendance:state.attendance,
    settings:state.settings,
    className:getClassName(),
    updatedAt:cloud.api.serverTimestamp()
  };
}
function serializePublicShare(){
  const shareAttendance=!!refs.shareAttendanceToggle?.checked;
  return {
    ownerUid:cloud.user.uid,
    classId:getClassId(),
    className:getClassName(),
    sharedDate:selectedDate,
    shareAttendance,
    books:{[selectedDate]:state.books[selectedDate] || {homework:'',reminder:'',test:'',note:'',teacher:''}},
    bookFields:{[selectedDate]:getEnabledBookFields()},
    bookPhonetics:{[selectedDate]:state.bookPhonetics?.[selectedDate] || {}},
    attendance:shareAttendance ? {[selectedDate]:state.attendance[selectedDate] || {}} : {},
    students:shareAttendance ? state.students.map(st=>({seat:st.seat,name:`${st.seat}號`})) : [],
    settings:{
      writingMode:state.settings.writingMode,
      fontScale:state.settings.fontScale,
      lineHeightScale:state.settings.lineHeightScale,
      fontFamily:state.settings.fontFamily,
      phoneticMode:'none',
      textAlign:state.settings.textAlign,
      className:state.settings.className || ''
    },
    updatedAt:cloud.api.serverTimestamp()
  };
}
function applyStateFromCloud(nextState){
  isApplyingRemoteState=true;
  state=normalizeState(nextState);
  ensureDay(selectedDate);
  localStorage.setItem(STORAGE_KEY,JSON.stringify(state));
  refs.lateTime.value=state.settings.lateTime;
  refs.fontFamilySelect.value=state.settings.fontFamily || 'default';
  refs.phoneticModeSelect.value=state.settings.phoneticMode || 'none';
  refs.classNameInput.value=state.settings.className || '';
  updateLateTimeDisplay();
  applyLayout();
  renderAll();
  if(refs.lastSaved) refs.lastSaved.textContent='最後同步：'+nowTime();
  isApplyingRemoteState=false;
}
async function subscribeTeacherData(){
  updateCloudUi('正在同步教師雲端資料...');
  if(cloud.unsubscribe) cloud.unsubscribe();
  const ref=teacherDocRef();
  const snap=await cloud.api.getDoc(ref);
  if(!snap.exists()){
    await cloud.api.setDoc(ref,serializeTeacherState());
    updateCloudUi('已建立教師雲端資料，並上傳目前本機內容。');
  }
  cloud.unsubscribe=cloud.api.onSnapshot(ref,docSnap=>{
    if(docSnap.exists()) applyStateFromCloud(docSnap.data());
    updateCloudUi('雲端資料已同步。');
  },err=>{
    console.error(err);
    updateCloudUi('雲端同步暫時失敗，仍保留本機資料。');
  });
}
function queueCloudSave(){
  if(!cloud.user || !cloud.api || !cloud.db) return;
  clearTimeout(cloudSaveTimer);
  cloudSaveTimer=setTimeout(async()=>{
    try{
      await cloud.api.setDoc(teacherDocRef(),serializeTeacherState());
      updateCloudUi('已同步到教師雲端：'+nowTime());
    }catch(err){
      console.error(err);
      updateCloudUi('雲端儲存失敗，已先保留在本機。');
    }
  },650);
}
async function signInTeacher(){
  if(!cloud.configured){ showInfo('Firebase 尚未設定','<p>請先在 firebase-config.js 填入 Firebase 專案設定，再重新開啟此頁。</p>'); return; }
  if(!cloud.auth || !cloud.provider){ updateCloudUi('Firebase 正在載入，請稍候再試。'); return; }
  try{ await cloud.api.signInWithPopup(cloud.auth,cloud.provider); }
  catch(err){ console.error(err); updateCloudUi('登入取消或失敗，資料仍保留在本機。'); }
}
async function signOutTeacher(){
  if(!cloud.auth) return;
  await cloud.api.signOut(cloud.auth);
}
async function publishParentShare(){
  if(!cloud.user){ showInfo('尚未登入','<p>請先用教師 Google 帳號登入，再更新家長分享。</p>'); return; }
  try{
    await cloud.api.setDoc(publicShareDocRef(),serializePublicShare());
    await copyParentShareLink(false);
    const shareNote=refs.shareAttendanceToggle?.checked ? '家長可看到聯絡簿與座號簽到狀態，但看不到學生姓名，也不能修改簽到。' : '家長只會看到聯絡簿，不會看到學生出席區。';
    showInfo('家長分享已更新',`<p>家長連結已複製，可傳給家長：</p><p><b>${escapeHtml(parentShareLink())}</b></p><p>${shareNote}</p>`);
  }catch(err){
    console.error(err);
    showInfo('分享失敗','<p>無法更新家長分享，請確認 Firestore 規則已發布，且目前已登入教師帳號。</p>');
  }
}
function parentShareLink(){
  const url=new URL(location.href);
  url.searchParams.set('share',getShareId());
  return url.toString();
}
async function copyParentShareLink(showMessage=true){
  const link=parentShareLink();
  try{ await navigator.clipboard.writeText(link); if(showMessage) updateCloudUi('家長分享連結已複製。'); }
  catch(e){ if(showMessage) showInfo('家長分享連結',`<p>${escapeHtml(link)}</p>`); }
}
async function loadParentShare(){
  updateCloudUi('正在讀取家長分享聯絡簿...');
  try{
    const snap=await cloud.api.getDoc(publicShareDocRef(cloud.parentShareId));
    if(!snap.exists()){ updateCloudUi('找不到這個分享連結，請向老師確認連結是否正確。'); return; }
    const data=snap.data();
    selectedDate=data.sharedDate || Object.keys(data.books||{}).sort().pop() || selectedDate;
    refs.datePicker.value=selectedDate;
    document.body.classList.toggle('share-attendance-enabled',!!data.shareAttendance);
    state=normalizeState({
      students:data.students || defaultStudents,
      books:data.books || {},
      bookFields:data.bookFields || {},
      bookPhonetics:data.bookPhonetics || {},
      attendance:data.attendance || {},
      settings:{...state.settings,...(data.settings||{}),phoneticMode:'none',className:data.settings?.className ?? classLabelFromTitle(data.className)}
    });
    ensureDay(selectedDate);
    refs.classNameInput.value=state.settings.className || '';
    refs.lunarText.textContent=getClassName();
    renderAll();
    updateCloudUi('已載入老師分享的聯絡簿。');
  }catch(err){
    console.error(err);
    updateCloudUi('讀取分享資料失敗，請稍後再試。');
  }
}
function renderAttendance(){
  ensureDay(selectedDate); const rec=state.attendance[selectedDate]; refs.studentGrid.innerHTML=''; let on=0,late=0,leave=0;
  state.students.forEach(st=>{ const r=rec[st.seat]; if(r?.status==='ontime') on++; if(r?.status==='late') late++; if(r?.status==='leave') leave++;
    const btn=document.createElement('button'); btn.className='student-btn '+(r?.status||'absent'); btn.innerHTML=`<div class="seat">${st.seat}</div><div class="name">${escapeHtml(st.name||'')}</div>`; if(!cloud.parentShareId) btn.onclick=()=>studentClick(st.seat); refs.studentGrid.appendChild(btn); });
  refs.arrivedCount.textContent=on+late; refs.lateCount.textContent=late; refs.leaveCount.textContent=leave; refs.absentCount.textContent=state.students.length-on-late-leave;
  updateAttendanceTileSizing();
}
function statusText(r){ if(!r)return'未到'; if(r.status==='ontime')return r.time||'準時'; if(r.status==='late')return r.time||'遲到'; if(r.status==='leave')return'請假'; return'未到'; }
function studentClick(seat){ const rec=state.attendance[selectedDate][seat]; if(!rec){ markSeat(seat,'auto'); return; } openStudent(seat); }
function markSeat(seat,mode){
  if(!seat) return;
  if(mode==='absent'){
    delete state.attendance[selectedDate][seat];
  } else if(mode==='leave'){
    state.attendance[selectedDate][seat]={status:'leave',time:'請假',updatedAt:new Date().toISOString()};
  } else {
    const t=nowTime().slice(0,5);
    const status=mode==='ontime' || mode==='late' ? mode : (t<=state.settings.lateTime?'ontime':'late');
    state.attendance[selectedDate][seat]={status,time:t,updatedAt:new Date().toISOString()};
  }
  renderAttendance();
  save();
}
function markAllOnTime(){
  if(!state.students.length) return;
  if(!confirm('確定將今天全班標記為準時出席？')) return;
  ensureDay(selectedDate);
  const time=nowTime().slice(0,5);
  const updatedAt=new Date().toISOString();
  state.students.forEach(st=>{
    state.attendance[selectedDate][st.seat]={status:'ontime',time,updatedAt};
  });
  renderAttendance();
  save();
}
function openStudent(seat){ selectedSeat=seat; const st=state.students.find(s=>s.seat===seat); const r=state.attendance[selectedDate][seat]; const stats=getStudentStats(seat); refs.studentTitle.textContent=`${seat}號 ${st?.name||''}`; refs.studentDetail.innerHTML=`<p>今天狀態：<b>${statusText(r)}</b></p><p>今日記錄時間：<b>${r?.time||'--'}</b></p><hr><p>累計準時：${stats.ontime} 次</p><p>累計遲到：${stats.late} 次</p><p>累計請假：${stats.leave} 次</p>`; refs.studentDialog.showModal(); }
function getStudentStats(seat){ const out={ontime:0,late:0,leave:0}; Object.values(state.attendance).forEach(day=>{ const r=day[seat]; if(r?.status&&out[r.status]!==undefined) out[r.status]++; }); return out; }
function studentsToText(){ return state.students.map(s=>`${s.seat},${s.name}`).join('\n'); }
function openNames(){ refs.namesInput.value=studentsToText(); refs.namesDialog.showModal(); }
function toHalfWidth(text){ return String(text||'').replace(/[０-９]/g,ch=>String.fromCharCode(ch.charCodeAt(0)-0xFEE0)).replace(/[，、]/g,','); }
function normalizeStudentName(text){ return String(text||'').replace(/[^\u3400-\u9fffA-Za-z·．・‧]/g,'').trim(); }
function rosterCells(line){
  const text=toHalfWidth(line).trim();
  if(!text) return [];
  return text.includes('\t') ? text.split('\t').map(x=>x.trim()) : text.split(/\s+/).map(x=>x.trim()).filter(Boolean);
}
function parseRosterTableRows(lines){
  const list=[];
  let unmatched=0;
  for(let i=0;i<lines.length;i++){
    const cells=rosterCells(lines[i]);
    const label=normalizeStudentName(cells[0]||'');
    if(label!=='號' && label!=='座號') continue;
    const nextCells=rosterCells(lines[i+1]||'');
    const nextLabel=normalizeStudentName(nextCells[0]||'');
    if(nextLabel!=='姓名') continue;
    const seats=cells.slice(1).map(x=>Number(x.match(/\d{1,2}/)?.[0])).filter(n=>n>=1&&n<=99);
    const names=nextCells.slice(1).map(normalizeStudentName);
    const count=Math.min(seats.length,names.length);
    for(let j=0;j<count;j++){
      if(!names[j]) continue;
      const seat=String(seats[j]).padStart(2,'0');
      if(!list.some(st=>st.seat===seat)) list.push({seat,name:names[j]});
      if(list.length>=60) break;
    }
    unmatched+=Math.abs(seats.length-names.length)+names.slice(0,seats.length).filter(name=>!name).length;
    i++;
  }
  return {list:list.slice(0,60),unmatched};
}
function parseCommaRoster(text){
  const list=[];
  toHalfWidth(text).split('\n').map(x=>x.trim()).filter(Boolean).forEach(line=>{
    const match=line.match(/^(\d{1,2})\s*[,，\t ]+\s*(.+)$/);
    if(!match) return;
    const seat=match[1].padStart(2,'0');
    const name=normalizeStudentName(match[2]) || `${Number(seat)}號`;
    if(/^\d{2}$/.test(seat)) list.push({seat,name});
  });
  return list;
}
function parseTeacherManualRoster(text){
  const raw=toHalfWidth(text).replace(/\r/g,'\n');
  const lines=raw.split('\n').map(line=>line.trim()).filter(Boolean);
  const tableRows=parseRosterTableRows(lines);
  if(tableRows.list.length) return tableRows;
  const stopWords=new Set(['號','姓名','姓','名','座號','班級','學生','導師','老師','男生','女生','共','人']);
  const seats=[];
  const names=[];
  let nameMode=false;
  for(const line of lines){
    const compact=line.replace(/\s+/g,'');
    if(/^(號|座號)\d+/.test(compact) || /^(號|座號)$/.test(compact)){ nameMode=false; }
    if(/^(姓名|姓名號|姓|名)$/.test(compact) || compact.startsWith('姓名')) nameMode=true;
    const isFooter=/班級|學生|導師|老師|共\s*\d+\s*人|\d+\s*人/.test(line);
    if(isFooter && !compact.startsWith('姓名')) continue;
    const nums=[...line.matchAll(/\d{1,2}/g)].map(m=>Number(m[0])).filter(n=>n>=1&&n<=99);
    nums.forEach(n=>{ if(!seats.includes(n)) seats.push(n); });
    const chunks=line.split(/[\s,，、|｜]+/).map(normalizeStudentName).filter(Boolean);
    chunks.forEach(chunk=>{
      if(stopWords.has(chunk) || /\d/.test(chunk) || /[班學生老師師男女共人]/.test(chunk)) return;
      if(chunk.length>=2 && chunk.length<=4 && (nameMode || seats.length)) names.push(chunk);
    });
  }
  if(!seats.length || !names.length) return {list:[],unmatched:0};
  const count=Math.min(seats.length,names.length,60);
  const list=Array.from({length:count},(_,i)=>({seat:String(seats[i]).padStart(2,'0'),name:names[i]}));
  return {list,unmatched:Math.abs(seats.length-names.length)};
}
function parseStudentRoster(text){
  const commaList=parseCommaRoster(text);
  if(commaList.length) return {list:commaList.slice(0,60),unmatched:0};
  const manual=parseTeacherManualRoster(text);
  return {list:manual.list.slice(0,60),unmatched:manual.unmatched};
}
function saveNames(){
  const parsed=parseStudentRoster(refs.namesInput.value);
  if(!parsed.list.length){ alert('名單格式錯誤，請確認是否包含座號與姓名'); return; }
  state.students=parsed.list;
  refs.namesDialog.close();
  renderAttendance();
  save();
  if(parsed.unmatched) alert(`已儲存可配對的 ${parsed.list.length} 筆名單，另有 ${parsed.unmatched} 筆座號或姓名未配對。`);
}
function showTodayStats(){ const rec=state.attendance[selectedDate]||{}; const absent=state.students.filter(s=>!rec[s.seat]); const late=state.students.filter(s=>rec[s.seat]?.status==='late'); const leave=state.students.filter(s=>rec[s.seat]?.status==='leave'); showInfo('今日統計',`<p><b>${displayDate(selectedDate)}</b></p><p>未到：${absent.map(s=>s.seat+' '+s.name).join('、')||'無'}</p><p>遲到：${late.map(s=>s.seat+' '+s.name+' '+rec[s.seat].time).join('、')||'無'}</p><p>請假：${leave.map(s=>s.seat+' '+s.name).join('、')||'無'}</p>`); }
function showRecords(){ const keys=Object.keys(state.attendance).sort().reverse(); let html='<table class="record-table"><tr><th>日期</th><th>已到</th><th>遲到</th><th>請假</th><th>未到</th></tr>'; keys.forEach(k=>{ const day=state.attendance[k]; let on=0,late=0,leave=0; Object.values(day).forEach(r=>{if(r.status==='ontime')on++; if(r.status==='late')late++; if(r.status==='leave')leave++;}); html+=`<tr><td>${displayDate(k)}</td><td>${on+late}</td><td>${late}</td><td>${leave}</td><td>${state.students.length-on-late-leave}</td></tr>`; }); html+='</table>'; showInfo('每日出缺席紀錄',html); }
function showHelp(){
  showInfo('使用說明',`
    <div class="help-list">
      <section><h3>Q：如何編輯今天的聯絡簿？</h3><p>A：選好日期後按「編輯聯絡簿」，填寫功課、提醒、考試、攜帶物品或老師的話，再按「完成編輯」。</p></section>
      <section><h3>Q：如何調整聯絡簿顯示？</h3><p>A：按「格式」可切換橫書、直書，也能調整字級、行距、對齊與字體。</p></section>
      <section><h3>Q：破音字注音怎麼處理？</h3><p>A：按「編輯聯絡簿」，先反白一個中文字，再按「標注破音」，直接點候選讀音即可，例如：重 ㄔㄨㄥˊ、樂 ㄩㄝˋ。格式裡可切換「顯示國字、顯示注音、全注音」。</p></section>
      <section><h3>Q：如何設定學生名單？</h3><p>A：按「名單設定」，可貼上校務系統或教師手冊名冊，也可每行輸入「座號,姓名」。空號會自動略過。</p></section>
      <section><h3>Q：如何登記學生到校？</h3><p>A：點學生座號即可依目前時間記為準時或遲到；再次點同一位學生可改為準時、遲到、請假或未到。</p></section>
      <section><h3>Q：全班都到齊時怎麼操作？</h3><p>A：按「全班準時出席」，確認後會把今天名單內所有學生標記為準時。</p></section>
      <section><h3>Q：如何分享給家長？</h3><p>A：登入教師 Google 帳號後按「更新家長分享」，再把連結傳給家長。需要顯示座號出席狀態時，先勾選「分享學生出席」。</p></section>
      <section><h3>Q：一般分頁會避免螢幕休眠嗎？</h3><p>A：教師主畫面開著且分頁可見時，系統會自動嘗試保持螢幕喚醒；若瀏覽器不支援或 Windows 電源政策阻擋，仍需調整「螢幕與睡眠」和「螢幕保護程式」。</p></section>
      <section><h3>Q：班級名稱在哪裡設定？</h3><p>A：在「系統設定」填入班級名稱，畫面與家長分享標題會顯示為該班級的聯絡簿。</p></section>
    </div>
  `);
}
function showInfo(title,html){ refs.infoTitle.textContent=title; refs.infoContent.innerHTML=html; refs.infoDialog.showModal(); }
init();
