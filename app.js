const STORAGE_KEY = 'cses-contactbook-attendance-v4';
const OLD_KEYS = [];
const CALENDAR_URL = 'https://docs.google.com/spreadsheets/d/1Dbs8Czjl6odsq6HOAz2J_ZU3gXmzm5lU8mSbXoOQD3E/edit?usp=sharing';
const FIREBASE_CDN_VERSION = '10.12.5';
const firebaseConfig = window.CSES_FIREBASE_CONFIG || {};
const classConfig = window.CSES_CLASS_CONFIG || {};
const FONT_STACKS = {
  default:'"Noto Sans TC","Microsoft JhengHei",system-ui,sans-serif',
  rounded:'"jf open 粉圓 2.1","GenJyuuGothic","M PLUS Rounded 1c","Noto Sans TC","Microsoft JhengHei",sans-serif',
  kai:'"BiauKai","DFKai-SB","標楷體","KaiTi","Noto Serif TC",serif',
  iansui:'"Bpmf Iansui","Noto Sans TC","Microsoft JhengHei",sans-serif'
};
const defaultStudents = Array.from({length:30},(_,i)=>({seat:String(i+1).padStart(2,'0'),name:`${i+1}號`}));
const $ = id => document.getElementById(id);
const refs = {
  cloudModeLabel:$('cloudModeLabel'),cloudHint:$('cloudHint'),signInBtn:$('signInBtn'),shareAttendanceToggle:$('shareAttendanceToggle'),publishShareBtn:$('publishShareBtn'),copyShareBtn:$('copyShareBtn'),signOutBtn:$('signOutBtn'),storageStatus:$('storageStatus'),
  shell:document.querySelector('.app-shell'),hero:document.querySelector('.hero-clock'),mainGrid:document.querySelector('.main-grid'),topResizeHandle:$('topResizeHandle'),mainResizeHandle:$('mainResizeHandle'),
  clock:$('clock'),clockHours:$('clockHours'),clockMinutes:$('clockMinutes'),clockSeconds:$('clockSeconds'),dateFull:$('dateFull'),weekText:$('weekText'),lunarText:$('lunarText'),lateTime:$('lateTime'),lateHour:$('lateHour'),lateMinute:$('lateMinute'),timeStatus:$('timeStatus'),lateLegendOnTime:$('lateLegendOnTime'),lateLegendLate:$('lateLegendLate'),calendarBtn:$('calendarBtn'),swapPanelsBtn:$('swapPanelsBtn'),settingsBtn:$('settingsBtn'),fullscreenBtn:$('fullscreenBtn'),fontDownBtn:$('fontDownBtn'),fontUpBtn:$('fontUpBtn'),alignLeftBtn:$('alignLeftBtn'),alignCenterBtn:$('alignCenterBtn'),alignRightBtn:$('alignRightBtn'),fontResetBtn:$('fontResetBtn'),fontScaleLabel:$('fontScaleLabel'),fontFamilySelect:$('fontFamilySelect'),
  datePicker:$('datePicker'),selectedDateLabel:$('selectedDateLabel'),editBtn:$('editBtn'),writingModeBtn:$('writingModeBtn'),viewModeBtn:$('viewModeBtn'),bookDisplay:$('bookDisplay'),editor:$('editor'),
  homeworkCard:$('homeworkCard'),reminderCard:$('reminderCard'),testCard:$('testCard'),noteCard:$('noteCard'),teacherCard:$('teacherCard'),emptyBookMessage:$('emptyBookMessage'),
  homeworkView:$('homeworkView'),reminderView:$('reminderView'),testView:$('testView'),noteView:$('noteView'),teacherView:$('teacherView'),
  homeworkInput:$('homeworkInput'),reminderInput:$('reminderInput'),testInput:$('testInput'),noteInput:$('noteInput'),teacherInput:$('teacherInput'),saveBookBtn:$('saveBookBtn'),copyYesterdayBtn:$('copyYesterdayBtn'),autosaveHint:$('autosaveHint'),
  arrivedCount:$('arrivedCount'),absentCount:$('absentCount'),lateCount:$('lateCount'),leaveCount:$('leaveCount'),studentGrid:$('studentGrid'),namesBtn:$('namesBtn'),
  statsBtn:$('statsBtn'),recordsBtn:$('recordsBtn'),resetBtn:$('resetBtn'),exportBtn:$('exportBtn'),lastSaved:$('lastSaved'),
  studentDialog:$('studentDialog'),studentTitle:$('studentTitle'),studentDetail:$('studentDetail'),markOnTimeBtn:$('markOnTimeBtn'),markLateBtn:$('markLateBtn'),markLeaveBtn:$('markLeaveBtn'),markAbsentBtn:$('markAbsentBtn'),
  namesDialog:$('namesDialog'),namesInput:$('namesInput'),saveNamesBtn:$('saveNamesBtn'),resetNamesBtn:$('resetNamesBtn'),infoDialog:$('infoDialog'),infoTitle:$('infoTitle'),infoContent:$('infoContent')
};
let state = loadState();
let selectedDate = dateKey(new Date());
let editMode = false;
let selectedSeat = null;
let isApplyingRemoteState = false;
let cloudSaveTimer = null;
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
function getClassName(){ return String(classConfig.className || '中山國小聯絡簿'); }
function getShareId(){ return String(classConfig.shareId || `${cloud.user?.uid || 'teacher'}-${getClassId()}`).replace(/[^\w-]/g,''); }
function normalizeState(s={}){
  return {
    students:Array.isArray(s.students) && s.students.length ? s.students : defaultStudents,
    books:s.books || {},
    attendance:s.attendance || {},
    settings:{
      lateTime:s.settings?.lateTime || '07:50',
      writingMode:s.settings?.writingMode || 'horizontal',
      fontScale:s.settings?.fontScale || 1,
      fontFamily:s.settings?.fontFamily || 'default',
      textAlign:s.settings?.textAlign || 'center',
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
  refs.lastSaved.textContent='最後儲存：'+nowTime();
  if(!isApplyingRemoteState) queueCloudSave();
}
function ensureDay(key){ if(!state.attendance[key]) state.attendance[key]={}; if(!state.books[key]) state.books[key]={homework:'',reminder:'',test:'',note:'',teacher:''}; }
function init(){
  if(state.settings.fontFamily==='bopomofo') state.settings.fontFamily='iansui';
  refs.datePicker.value=selectedDate; refs.lateTime.value=state.settings.lateTime; refs.fontFamilySelect.value=state.settings.fontFamily||'default'; ensureDay(selectedDate);
  applyLayout();
  updateLateTimeDisplay();
  wireEvents(); installLayoutResizers(); installResponsiveSizing(); tick(); setInterval(tick,1000); renderAll();
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
  const heroScale=clamp(topHeight/172,.78,1.45);
  const panelScale=panel=>{
    if(!panel) return 1;
    const widthScale=panel.clientWidth/720;
    const heightScale=panel.clientHeight/620;
    return clamp(Math.min(widthScale,heightScale),.72,1.18);
  };
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
  fitBookTextSoon();
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
function tick(){
  const n=new Date();
  const hh=String(n.getHours()).padStart(2,'0'), mm=String(n.getMinutes()).padStart(2,'0'), ss=String(n.getSeconds()).padStart(2,'0');
  refs.clock.setAttribute('aria-label',`${hh}:${mm}:${ss}`);
  refs.clockHours.textContent=hh; refs.clockMinutes.textContent=mm; refs.clockSeconds.textContent=ss;
  refs.dateFull.textContent=`${n.getFullYear()}年${String(n.getMonth()+1).padStart(2,'0')}月${String(n.getDate()).padStart(2,'0')}日`; refs.weekText.textContent=`星期${'日一二三四五六'[n.getDay()]}`;
  refs.lunarText.textContent='中山國小聯絡簿系統';
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
  refs.alignLeftBtn.onclick=()=>setBookAlign('left');
  refs.alignCenterBtn.onclick=()=>setBookAlign('center');
  refs.alignRightBtn.onclick=()=>setBookAlign('right');
  refs.fontFamilySelect.onchange=()=>{ state.settings.fontFamily=refs.fontFamilySelect.value; applyFontScale(); fitBookTextSoon(); save(); };
  refs.fontResetBtn.onclick=()=>{ state.settings.fontScale=1; state.settings.fontFamily='default'; refs.fontFamilySelect.value='default'; applyFontScale(); fitBookTextSoon(); save(); };

  refs.editBtn.onclick=()=>{ editMode=!editMode; renderBook(); };
  refs.saveBookBtn.onclick=()=>{ writeBookFromInputs(); editMode=false; renderBook(); save(); };
  [refs.homeworkInput,refs.reminderInput,refs.testInput,refs.noteInput,refs.teacherInput].forEach(t=>t.addEventListener('input',()=>{writeBookFromInputs(); save(); refs.autosaveHint.textContent='已自動儲存：'+nowTime();}));
  refs.copyYesterdayBtn.onclick=()=>{ const d=new Date(selectedDate+'T00:00:00'); d.setDate(d.getDate()-1); const y=dateKey(d); if(state.books[y]){ state.books[selectedDate]={...state.books[y]}; renderBook(); save(); } else alert('前一天沒有聯絡簿內容'); };
  refs.writingModeBtn.onclick=()=>{ state.settings.writingMode='horizontal'; renderBook(); save(); };
  refs.viewModeBtn.onclick=()=>{ state.settings.writingMode='vertical'; renderBook(); save(); };
  refs.namesBtn.onclick=openNames;
  refs.saveNamesBtn.onclick=saveNames;
  refs.resetNamesBtn.onclick=()=>{state.students=defaultStudents; refs.namesInput.value=studentsToText(); renderAttendance(); save();};
  refs.resetBtn.onclick=()=>{ if(confirm('確定重設今天所有簽到紀錄？')){ state.attendance[selectedDate]={}; renderAttendance(); save(); }};
  refs.exportBtn.onclick=exportCsv;
  refs.statsBtn.onclick=showTodayStats;
  refs.recordsBtn.onclick=showRecords;
  refs.settingsBtn.onclick=()=>showInfo('系統設定',`<p>目前儲存模式：<b>${cloud.user?'教師雲端同步':'本機瀏覽器備援'}</b></p><p>到校準時時間：<b>${state.settings.lateTime}</b></p><p>Firebase 尚未設定或未登入時，資料仍會存在這台電腦的瀏覽器。</p>`);
  refs.signInBtn.onclick=signInTeacher;
  refs.signOutBtn.onclick=signOutTeacher;
  refs.publishShareBtn.onclick=publishParentShare;
  refs.copyShareBtn.onclick=copyParentShareLink;
  document.querySelectorAll('[data-close]').forEach(b=>b.onclick=()=>$(b.dataset.close).close());
  refs.markOnTimeBtn.onclick=()=>{markSeat(selectedSeat,'ontime'); refs.studentDialog.close();};
  refs.markLateBtn.onclick=()=>{markSeat(selectedSeat,'late'); refs.studentDialog.close();};
  refs.markLeaveBtn.onclick=()=>{markSeat(selectedSeat,'leave'); refs.studentDialog.close();};
  refs.markAbsentBtn.onclick=()=>{markSeat(selectedSeat,'absent'); refs.studentDialog.close();};
}
function changeFontScale(delta){ state.settings.fontScale=Math.max(0.75,Math.min(1.6,Number((state.settings.fontScale+delta).toFixed(2)))); applyFontScale(); fitBookTextSoon(); save(); }
function applyFontScale(){ const scale=state.settings.fontScale||1; const fontKey=state.settings.fontFamily||'default'; const family=FONT_STACKS[fontKey]||FONT_STACKS.default; refs.bookDisplay.dataset.fontFamily=fontKey; refs.editor.dataset.fontFamily=fontKey; refs.bookDisplay.style.setProperty('--book-font-scale',scale); refs.editor.style.setProperty('--book-font-scale',scale); refs.bookDisplay.style.setProperty('--book-font-family',family); refs.editor.style.setProperty('--book-font-family',family); refs.fontScaleLabel.textContent=Math.round(scale*100)+'%'; }
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
function getBookLines(text){
  const lines=String(text||'').split('\n').map(line=>line.trim()).filter(Boolean);
  return lines;
}
function formatBookText(lines,startNo=1){
  return lines.map((line,index)=>`<div class="book-line"><span class="line-no">${startNo+index}.</span><span>${formatInlineText(line)}</span></div>`).join('');
}
function normalizeToken(text){
  return String(text).replace(/[Ａ-Ｚａ-ｚ０-９]/g,ch=>String.fromCharCode(ch.charCodeAt(0)-0xFEE0)).replace(/[－—–～〜~]/g,'-').replace(/[．.・‧·]/g,'').replace(/\s+/g,'');
}
function formatInlineText(text){
  return String(text).split(/([A-Za-zＡ-Ｚａ-ｚ]+(?:\s*[．.・‧·]?\s*)[0-9０-９]+(?:\s*[－—–～〜~-]\s*[0-9０-９]+)?|[A-Za-zＡ-Ｚａ-ｚ]+|[0-9０-９]+(?:\s*[－—–～〜~-]\s*[0-9０-９]+)*)/g).map(part=>{
    if(!part) return '';
    if(/[A-Za-zＡ-Ｚａ-ｚ0-9０-９]/.test(part)) return `<span class="inline-token">${escapeHtml(normalizeToken(part))}</span>`;
    const safe=escapeHtml(part);
    return safe;
  }).join('');
}
function renderBook(){
  ensureDay(selectedDate); const b=state.books[selectedDate]||{};
  refs.bookDisplay.closest('.contact-panel')?.classList.toggle('editing',editMode);
  applyBookAlign();
  refs.bookDisplay.classList.toggle('vertical-mode',state.settings.writingMode==='vertical'); refs.bookDisplay.classList.toggle('horizontal-mode',state.settings.writingMode!=='vertical');
  refs.writingModeBtn.textContent='橫書'; refs.viewModeBtn.textContent='直書';
  const items=[['homework',refs.homeworkCard,refs.homeworkView,refs.homeworkInput],['test',refs.testCard,refs.testView,refs.testInput],['reminder',refs.reminderCard,refs.reminderView,refs.reminderInput],['note',refs.noteCard,refs.noteView,refs.noteInput],['teacher',refs.teacherCard,refs.teacherView,refs.teacherInput]];
  let any=false, visibleCount=0, nextNo=1; items.forEach(([k,card,view,input],order)=>{ const val=(b[k]||'').trim(); const lines=getBookLines(val); const weight=Math.max(1,lines.length); view.innerHTML=formatBookText(lines,nextNo); input.value=b[k]||''; card.style.order=order; card.style.setProperty('--card-weight',weight); card.dataset.lineCount=lines.length; card.style.display=lines.length?'':'none'; if(lines.length){ any=true; visibleCount++; nextNo+=lines.length; } });
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
function writeBookFromInputs(){ state.books[selectedDate]={homework:refs.homeworkInput.value,reminder:refs.reminderInput.value,test:refs.testInput.value,note:refs.noteInput.value,teacher:refs.teacherInput.value}; }
function updateCloudUi(message){
  const shareMode=!!cloud.parentShareId;
  document.body.classList.toggle('parent-share-mode',shareMode);
  refs.signInBtn.disabled=shareMode || !cloud.configured || !!cloud.user;
  refs.signOutBtn.disabled=shareMode || !cloud.user;
  refs.publishShareBtn.disabled=shareMode || !cloud.user;
  refs.copyShareBtn.disabled=shareMode || !cloud.user;
  if(refs.shareAttendanceToggle) refs.shareAttendanceToggle.disabled=shareMode || !cloud.user;
  if(shareMode){
    refs.cloudModeLabel.textContent='家長分享模式';
    refs.cloudHint.textContent=message || '正在讀取老師分享的聯絡簿。';
    refs.storageStatus.textContent='▣ 家長只讀分享頁';
    return;
  }
  if(!cloud.configured){
    refs.cloudModeLabel.textContent='本機模式';
    refs.cloudHint.textContent='請先填寫 firebase-config.js，資料目前只存在這台電腦。';
    refs.storageStatus.textContent='▣ 資料已自動儲存於本機';
    return;
  }
  if(cloud.user){
    refs.cloudModeLabel.textContent='教師雲端同步';
    refs.cloudHint.textContent=message || `已登入：${cloud.user.displayName || cloud.user.email || '教師帳號'}`;
    refs.storageStatus.textContent='▣ 資料已儲存在本機並同步到教師雲端';
    return;
  }
  refs.cloudModeLabel.textContent='雲端待登入';
  refs.cloudHint.textContent=message || 'Firebase 已設定，請用教師 Google 帳號登入。';
  refs.storageStatus.textContent='▣ 未登入時先儲存在本機';
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
    attendance:shareAttendance ? {[selectedDate]:state.attendance[selectedDate] || {}} : {},
    students:shareAttendance ? state.students.map(st=>({seat:st.seat,name:`${st.seat}號`})) : [],
    settings:{
      writingMode:state.settings.writingMode,
      fontScale:state.settings.fontScale,
      fontFamily:state.settings.fontFamily,
      textAlign:state.settings.textAlign
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
  updateLateTimeDisplay();
  applyLayout();
  renderAll();
  refs.lastSaved.textContent='最後同步：'+nowTime();
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
      attendance:data.attendance || {},
      settings:{...state.settings,...(data.settings||{})}
    });
    ensureDay(selectedDate);
    refs.lunarText.textContent=data.className || getClassName();
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
    const btn=document.createElement('button'); btn.className='student-btn '+(r?.status||'absent'); btn.innerHTML=`<div class="seat">${st.seat}</div>`; if(!cloud.parentShareId) btn.onclick=()=>studentClick(st.seat); refs.studentGrid.appendChild(btn); });
  refs.arrivedCount.textContent=on+late; refs.lateCount.textContent=late; refs.leaveCount.textContent=leave; refs.absentCount.textContent=state.students.length-on-late-leave;
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
function openStudent(seat){ selectedSeat=seat; const st=state.students.find(s=>s.seat===seat); const r=state.attendance[selectedDate][seat]; const stats=getStudentStats(seat); refs.studentTitle.textContent=`${seat}號 ${st?.name||''}`; refs.studentDetail.innerHTML=`<p>今天狀態：<b>${statusText(r)}</b></p><p>今日記錄時間：<b>${r?.time||'--'}</b></p><hr><p>累計準時：${stats.ontime} 次</p><p>累計遲到：${stats.late} 次</p><p>累計請假：${stats.leave} 次</p>`; refs.studentDialog.showModal(); }
function getStudentStats(seat){ const out={ontime:0,late:0,leave:0}; Object.values(state.attendance).forEach(day=>{ const r=day[seat]; if(r?.status&&out[r.status]!==undefined) out[r.status]++; }); return out; }
function studentsToText(){ return state.students.map(s=>`${s.seat},${s.name}`).join('\n'); }
function openNames(){ refs.namesInput.value=studentsToText(); refs.namesDialog.showModal(); }
function saveNames(){ const lines=refs.namesInput.value.split('\n').map(x=>x.trim()).filter(Boolean); const list=[]; for(const line of lines){ const [seat,...nameParts]=line.split(','); const s=String(seat||'').trim().padStart(2,'0'); const name=nameParts.join(',').trim()||`${Number(s)}號`; if(/^\d{2}$/.test(s)) list.push({seat:s,name}); } if(!list.length){ alert('名單格式錯誤'); return; } state.students=list.slice(0,60); refs.namesDialog.close(); renderAttendance(); save(); }
function exportCsv(){ const rows=[['日期','座號','姓名','狀態','時間']]; const rec=state.attendance[selectedDate]||{}; state.students.forEach(s=>{ const r=rec[s.seat]; rows.push([displayDate(selectedDate),s.seat,s.name,statusText(r),r?.time||'']); }); const csv='\ufeff'+rows.map(r=>r.map(v=>`"${String(v).replaceAll('"','""')}"`).join(',')).join('\n'); const blob=new Blob([csv],{type:'text/csv;charset=utf-8'}); const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=`簽到紀錄_${selectedDate}.csv`; a.click(); URL.revokeObjectURL(a.href); }
function showTodayStats(){ const rec=state.attendance[selectedDate]||{}; const absent=state.students.filter(s=>!rec[s.seat]); const late=state.students.filter(s=>rec[s.seat]?.status==='late'); const leave=state.students.filter(s=>rec[s.seat]?.status==='leave'); showInfo('今日統計',`<p><b>${displayDate(selectedDate)}</b></p><p>未到：${absent.map(s=>s.seat+' '+s.name).join('、')||'無'}</p><p>遲到：${late.map(s=>s.seat+' '+s.name+' '+rec[s.seat].time).join('、')||'無'}</p><p>請假：${leave.map(s=>s.seat+' '+s.name).join('、')||'無'}</p>`); }
function showRecords(){ const keys=Object.keys(state.attendance).sort().reverse(); let html='<table class="record-table"><tr><th>日期</th><th>已到</th><th>遲到</th><th>請假</th><th>未到</th></tr>'; keys.forEach(k=>{ const day=state.attendance[k]; let on=0,late=0,leave=0; Object.values(day).forEach(r=>{if(r.status==='ontime')on++; if(r.status==='late')late++; if(r.status==='leave')leave++;}); html+=`<tr><td>${displayDate(k)}</td><td>${on+late}</td><td>${late}</td><td>${leave}</td><td>${state.students.length-on-late-leave}</td></tr>`; }); html+='</table>'; showInfo('每日出缺席紀錄',html); }
function showInfo(title,html){ refs.infoTitle.textContent=title; refs.infoContent.innerHTML=html; refs.infoDialog.showModal(); }
init();
