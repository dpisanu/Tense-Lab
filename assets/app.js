/* TENSE LAB — no frameworks, no analytics, no cookies, no browser storage. */
'use strict';

const TRACKS = [
  { id:'simple', title:'Simple', tint:'#eef1fd', accent:'#4569e5' },
  { id:'continuous', title:'Continuous', tint:'#e9f5f1', accent:'#1a967e' },
  { id:'perfect', title:'Perfect', tint:'#f1edfa', accent:'#8f72c9' },
  { id:'perfect-continuous', title:'Perfect Continuous', tint:'#fbece9', accent:'#cf626c' }
];
const ERAS = [
  {id:'present', title:'Present', sub:'Gegenwart'},
  {id:'past', title:'Past', sub:'Vergangenheit'},
  {id:'future', title:'Future', sub:'Zukunft'}
];
const LEVELS = {easy:'Easy',medium:'Medium',hard:'Hard',difficult:'Difficult'};
const PALETTE = {present:'#1a967e',past:'#e58b4d',future:'#4569e5'};
const $ = (selector, context=document) => context.querySelector(selector);
const $$ = (selector, context=document) => [...context.querySelectorAll(selector)];
const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const byId = id => tenses.find(item => item.id === id);
const tone = t => `--accent:${PALETTE[t.era]};--tint:${TRACKS.find(x=>x.id===t.track).tint};`;
const shuffle = arr => {const a = [...arr]; for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;};

let tenses = [], cards = [], toastTimer, drag = null;
const state = {
  page:'overview', schoolOnly:true, columns:new Set(['simple','continuous','perfect']),
  selected:new Set(), level:'easy', deck:[], index:0, results:[], gameTenses:[], gameLevel:'easy'
};

async function boot() {
  try {
    // Fetch files when the page loads. A refresh starts an entirely new session.
    const [tensesResponse, cardsResponse] = await Promise.all([
      fetch('./data/tenses.json', {cache:'no-store'}),
      fetch('./data/cards.json', {cache:'no-store'})
    ]);
    if (!tensesResponse.ok || !cardsResponse.ok) throw new Error('Die JSON-Dateien konnten nicht geladen werden.');
    [tenses,cards] = await Promise.all([tensesResponse.json(),cardsResponse.json()]);
    if (!Array.isArray(tenses) || !Array.isArray(cards) || !tenses.length) throw new Error('Keine Zeitformen gefunden.');
    state.selected = new Set(tenses.filter(t=>t.school).map(t=>t.id));
    renderColumnFilters(); renderOverview(); renderChoices();
    buildGame();
    bindEvents();
  } catch(error) {
    console.error('Tense Lab startup error:',error);
    const msg = 'Daten konnten nicht geladen werden. Bitte über einen lokalen Webserver oder GitHub Pages starten (nicht per Doppelklick auf index.html).';
    $('#tenseMatrix').innerHTML = `<p class="loading" role="alert">${esc(msg)}</p>`;
    $('#deck').innerHTML = `<p class="loading" role="alert">${esc(msg)}</p>`;
  }
}

function bindEvents() {
  document.addEventListener('click', e => {
    const tab = e.target.closest('[data-tab]');
    if(tab){switchTab(tab.dataset.tab); return;}
    const openTense = e.target.closest('[data-tense-open]');
    if(openTense){showTense(openTense.dataset.tenseOpen);return;}
    const report = e.target.closest('[data-report]');
    if(report){showReport(report.dataset.report);return;}
    const zoneButton = e.target.closest('[data-zone]');
    if(zoneButton){dropCard(zoneButton.dataset.zone);return;}
    const close = e.target.closest('[data-close]');
    if(close){const dialog=close.closest('dialog');if(dialog)dialog.close();return;}
  });
  $$('#tenseDialog, #reportDialog').forEach(dialog => {
    dialog.addEventListener('click', e => {if(e.target===dialog)dialog.close();});
  });
  $('#schoolOnly').addEventListener('change', e=>{state.schoolOnly=e.target.checked;renderOverview();});
  $('#columnFilters').addEventListener('change', e => {
    if(!e.target.matches('input[data-column]'))return;
    const id=e.target.dataset.column;
    if(e.target.checked) state.columns.add(id); else state.columns.delete(id);
    if(state.columns.size===0){state.columns.add(id);e.target.checked=true;showToast('Mindestens eine Spalte muss sichtbar bleiben.');}
    renderOverview();
  });
  $('#tenseChoices').addEventListener('change', e => {
    if(!e.target.matches('input[data-choice]'))return;
    if(e.target.checked)state.selected.add(e.target.value);else state.selected.delete(e.target.value);
    updateChoiceClasses();
  });
  $('#selectSchool').addEventListener('click',()=>setChoices(tenses.filter(t=>t.school).map(t=>t.id)));
  $('#selectAll').addEventListener('click',()=>setChoices(tenses.map(t=>t.id)));
  $('#selectNone').addEventListener('click',()=>setChoices([]));
  $$('input[name="difficulty"]').forEach(radio=>radio.addEventListener('change',e=>{if(e.target.checked)state.level=e.target.value;}));
  $('#startGame').addEventListener('click',buildGame);
  // Tap the zone to sort, or drag the top card to the zone on phones/tablets/desktop.
  const deckEl=$('#deck');
  deckEl.addEventListener('pointerdown',startDrag);
  deckEl.addEventListener('pointermove',moveDrag);
  deckEl.addEventListener('pointerup',endDrag);
  deckEl.addEventListener('pointercancel',cancelDrag);
  document.addEventListener('keydown',e=>{
    if(e.key==='Escape') cancelDrag();
  });
}

function switchTab(name){
  if(name!=='overview'&&name!=='practice')return;
  state.page=name;
  $$('.page').forEach(page=>{const active=page.id===`page-${name}`;page.hidden=!active;page.classList.toggle('is-active',active);});
  $$('.tab').forEach(tab=>{const active=tab.dataset.tab===name;tab.classList.toggle('is-active',active);if(active)tab.setAttribute('aria-current','page');else tab.removeAttribute('aria-current');});
  window.scrollTo({top:0,behavior:'instant'});
}

function renderColumnFilters(){
  $('#columnFilters').innerHTML = `<legend>Spalten anzeigen</legend>` + TRACKS.map(t=>`<label class="column-toggle"><input type="checkbox" data-column="${t.id}" ${state.columns.has(t.id)?'checked':''}><span>${esc(t.title)}</span></label>`).join('');
}
function renderOverview(){
  const columns=TRACKS.filter(x=>state.columns.has(x.id));
  const parts=[`<div class="matrix-axis">TIME ↘</div>`,...columns.map(c=>`<div class="matrix-col-heading" style="--accent:${c.accent}">${esc(c.title)}</div>`)];
  for(const era of ERAS){
    parts.push(`<div class="matrix-row-heading" style="border-left:3px solid ${PALETTE[era.id]}">${esc(era.title)}<small>${esc(era.sub)}</small></div>`);
    for(const col of columns){
      const cell=tenses.filter(t=>t.era===era.id && t.track===col.id && (!state.schoolOnly||t.school));
      if(!cell.length){parts.push(`<div class="matrix-cell is-later"><strong>Not yet.</strong><span>${state.schoolOnly?'Noch kein Schulstoff':'Keine Zeitform'}</span></div>`);continue;}
      parts.push(`<div class="matrix-cell ${cell.length>1?'cell-with-two':''}">${cell.map(t=>`<button type="button" class="tense-tile ${cell.length>1?'tiny':''}" data-tense-open="${esc(t.id)}" style="${tone(t)}" aria-label="${esc(t.name)}: Regeln und Beispiele anzeigen"><div class="tile-top"><strong>${esc(t.name)}</strong><span class="tile-arrow" aria-hidden="true">↗</span></div><span class="tile-formula">${esc(t.formula)}</span><span class="tile-when">${esc(t.short)}</span>${cell.length>1?'':`<span class="tile-example">${esc(t.examples.positive)}</span>`}<span class="tile-tag">${t.school?'KLASSE 7':'EXTRA'}</span></button>`).join('')}</div>`);
    }
  }
  const el=$('#tenseMatrix');el.style.setProperty('--grid-columns',columns.length);el.innerHTML=parts.join('');
  el.style.minWidth=`${106+columns.length*220+columns.length*10}px`;
}

function renderChoices(){
  // School content goes first; advanced forms are optional.
  const ordered=[...tenses.filter(t=>t.school),...tenses.filter(t=>!t.school)];
  $('#tenseChoices').innerHTML=ordered.map(t=>`<label class="choice ${state.selected.has(t.id)?'is-checked':''} ${t.school?'':'is-advanced'}"><input type="checkbox" data-choice="1" value="${esc(t.id)}" ${state.selected.has(t.id)?'checked':''}><span><strong>${esc(t.name)}</strong><small>${esc(t.de)}${t.school?'':' · Extra'}</small></span></label>`).join('');
}
function updateChoiceClasses(){
  $$('.choice',$('#tenseChoices')).forEach(label=>label.classList.toggle('is-checked',$('input',label).checked));
}
function setChoices(ids){state.selected=new Set(ids);renderChoices();}

function buildGame(){
  const chosen=tenses.filter(t=>state.selected.has(t.id));
  if(!chosen.length){$('#settingsError').hidden=false;$('#tenseChoices').scrollIntoView({behavior:'smooth',block:'center'});return;}
  $('#settingsError').hidden=true;
  state.gameTenses=chosen.map(t=>t.id);state.gameLevel=state.level;
  // Fairly distribute up to three cards per selected tense, then shuffle the combined stack.
  const picked=chosen.flatMap(t=>shuffle(cards.filter(card=>card.tense===t.id&&card.difficulty===state.gameLevel)).slice(0,3));
  state.deck=shuffle(picked);state.results=[];state.index=0;
  renderZones();renderDeck();$('#finished').hidden=true;
  if(state.page==='practice')showToast(`${state.deck.length} Karten bereit. Los geht’s!`);
}
function renderSentence(card){
  const phrase=card.focus;
  if(typeof phrase!=='string'||!phrase)return esc(card.sentence);
  const i=card.sentence.indexOf(phrase);
  if(i<0)return esc(card.sentence);
  return esc(card.sentence.slice(0,i)) + `<mark class="focus-highlight">${esc(phrase)}</mark>` + esc(card.sentence.slice(i+phrase.length));
}
function renderDeck(){
  const total=state.deck.length,done=state.index;
  $('#progressLabel').textContent=`${done} / ${total} Karten`;
  $('#progressBar').style.width=total?`${100*done/total}%`:'0%';
  if(done>=total){
    $('#deck').innerHTML='<div class="deck-empty"><strong>Stack cleared ✓</strong><span>Alle Karten wurden zugeordnet.</span></div>';
    if(total>0)finishGame();
    return;
  }
  const current=state.deck[done];
  $('#deck').innerHTML=`${total-done>=3?'<div class="postit back-two" aria-hidden="true"></div>':''}${total-done>=2?'<div class="postit back-one" aria-hidden="true"></div>':''}<button type="button" class="postit current" aria-label="Karte ${done+1} von ${total}: ${esc(current.sentence)}. Ziehe sie in die richtige Zeitform oder tippe unten auf ein Feld."><span class="postit-number">CARD ${String(done+1).padStart(2,'0')} / ${String(total).padStart(2,'0')}</span><span class="postit-sentence">${renderSentence(current)}</span><span class="postit-foot"><span>${esc(LEVELS[state.gameLevel])} MODE</span><span>DRAG ME ↗</span></span></button>`;
}
function renderZones(){
  $('#dropZones').innerHTML=state.gameTenses.map(id=>{
    const t=byId(id);const results=state.results.filter(x=>x.guessed===id);
    const good=results.filter(x=>x.correct).length,bad=results.length-good;
    return `<div class="drop-zone" data-dropzone="${esc(id)}" style="--accent:${PALETTE[t.era]}"><button type="button" class="zone-target" data-zone="${esc(id)}" aria-label="Karte zu ${esc(t.name)} zuordnen"><div class="zone-head"><span class="zone-swatch"></span><span class="zone-swatch" style="opacity:.2"></span></div><div class="zone-name">${esc(t.name)}</div><div class="zone-formula">${esc(t.formula)}</div></button><div class="zone-bottom"><div class="score-row" aria-label="${good} richtig, ${bad} falsch"><span class="score-good">✓ ${good}</span><span class="score-bad">✕ ${bad}</span></div><button type="button" class="report-btn" data-report="${esc(id)}" aria-label="Auswertung für ${esc(t.name)} anzeigen">Show me ↗</button></div></div>`;
  }).join('');
}
function dropCard(id){
  if(state.index>=state.deck.length)return;
  if(!state.gameTenses.includes(id))return;
  const card=state.deck[state.index];
  state.results.push({sentence:card.sentence,correct:card.tense===id,guessed:id,actual:card.tense,focus:card.focus||null});
  state.index++;renderZones();renderDeck();
}
function finishGame(){
  const correct=state.results.filter(r=>r.correct).length,total=state.deck.length;
  $('#finished').hidden=false;
  $('#finished').innerHTML=`<h3>Set complete<span class="period">.</span></h3><div class="finished-stats">${correct} / ${total} richtig zugeordnet</div><p>Gut gemacht – auch aus Fehlern lernt man. Öffne <strong>Show me</strong> unter den Feldern und schau dir die Begründungen an. Ein neues Set mischt die Karten neu.</p><div class="finished-actions"><button type="button" class="btn btn-accent" id="againBtn">Noch eine Runde ↗</button><button type="button" class="btn btn-dark" id="overviewBtn">Zum Spickzettel</button></div>`;
  $('#againBtn').addEventListener('click',buildGame);
  $('#overviewBtn').addEventListener('click',()=>switchTab('overview'));
}

function showTense(id){
  const t=byId(id);if(!t)return;
  $('#tenseDialogContent').innerHTML=`<header class="modal-header" style="${tone(t)}"><span class="modal-eyebrow">${t.school?'CLASS 7 / MUST KNOW':'EXTRA / LEVEL UP'} · ${esc(t.era.toUpperCase())}</span><button type="button" class="close-modal" data-close aria-label="Schließen">×</button><h2 id="tenseDialogTitle">${esc(t.name)}</h2><p class="modal-subtitle">${esc(t.de)}</p></header><div class="modal-body"><p class="modal-intro"><strong>Wann?</strong> ${esc(t.when)}</p><div class="formula-box"><small>DIE FORMEL</small><strong>${esc(t.formula)}</strong></div><div class="formula-parts">${t.parts.map(p=>`<div class="formula-part"><span>${esc(p.label)}</span><strong>${esc(p.value)}</strong></div>`).join('')}</div><h3 class="modal-subheading">So sieht die Form aus</h3><div class="conjugation">${t.conjugation.map(line=>`<div>${esc(line)}</div>`).join('')}</div><h3 class="modal-subheading">Beispiele</h3><div class="example-list"><div class="example"><span class="example-label pos">+</span><span>${esc(t.examples.positive)}</span></div><div class="example"><span class="example-label neg">−</span><span>${esc(t.examples.negative)}</span></div><div class="example"><span class="example-label que">?</span><span>${esc(t.examples.question)}</span></div></div><h3 class="modal-subheading">Typische Signalwörter</h3><p class="signal">${esc(t.signal)}</p><div class="tip-block"><strong>Wichtig:</strong> ${esc(t.tip)}</div><div class="modal-close-footer"><button class="btn btn-dark" type="button" data-close>Verstanden ✓</button></div></div>`;
  $('#tenseDialog').showModal();
}

function showReport(id){
  const tense=byId(id);if(!tense)return;
  const items=state.results.filter(r=>r.guessed===id);
  const wrong=items.filter(r=>!r.correct),right=items.filter(r=>r.correct);
  const itemMarkup=(r,bad)=>{
    const actual=byId(r.actual);
    return `<div class="report-item ${bad?'error':'correct'}"><strong>${esc(r.sentence)}</strong>${bad?`<p><span class="actual">Hier abgelegt: ${esc(tense.name)}.</span> <span class="expected">Richtig wäre: ${esc(actual.name)}.</span></p><p><strong>Warum?</strong> ${esc(actual.recognition)} Bei ${esc(tense.name)} wäre die Form <em>${esc(tense.formula)}</em>.</p>`:`<p>Richtig: ${esc(tense.name)} · ${esc(tense.recognition)}</p>`}</div>`;
  };
  $('#reportDialogContent').innerHTML=`<header class="modal-header" style="${tone(tense)}"><span class="modal-eyebrow">RESULTS / DEIN LERNREPORT</span><button type="button" class="close-modal" data-close aria-label="Schließen">×</button><h2 id="reportDialogTitle">${esc(tense.name)}</h2><p class="modal-subtitle">So hast du die Karten in diesem Feld einsortiert.</p></header><div class="modal-body"><div class="report-stats"><div class="report-stat"><strong>${items.length}</strong><span>abgelegt</span></div><div class="report-stat good"><strong>${right.length}</strong><span>richtig</span></div><div class="report-stat bad"><strong>${wrong.length}</strong><span>falsch</span></div></div>${!items.length?'<div class="report-empty">Hier liegen noch keine Karten. Probier es aus!</div>':`${wrong.length?`<h3 class="report-section-heading">Noch mal anschauen (${wrong.length})</h3><div class="report-list">${wrong.map(r=>itemMarkup(r,true)).join('')}</div>`:'<div class="report-empty">Bisher keine Fehler in diesem Feld. Nice.</div>'}${right.length?`<h3 class="report-section-heading">Richtig zugeordnet (${right.length})</h3><div class="report-list">${right.map(r=>itemMarkup(r,false)).join('')}</div>`:''}`}<div class="modal-close-footer"><button class="btn btn-dark" type="button" data-close>Zurück zum Test ↗</button></div></div>`;
  $('#reportDialog').showModal();
}

// Pointer Events work on mouse and touch. No HTML5-only drag API needed.
function startDrag(e){
  const el=e.target.closest('.postit.current');
  if(!el||state.index>=state.deck.length||e.button!==0)return;
  drag={el,pointerId:e.pointerId,startX:e.clientX,startY:e.clientY,dragging:false,ghost:null};
  try{el.setPointerCapture(e.pointerId);}catch(_error){}
}
function moveDrag(e){
  if(!drag||e.pointerId!==drag.pointerId)return;
  if(!drag.dragging&&Math.hypot(e.clientX-drag.startX,e.clientY-drag.startY)>10){
    drag.dragging=true;
    drag.ghost=drag.el.cloneNode(true);
    drag.ghost.classList.add('drag-ghost');
    drag.ghost.classList.remove('current');
    drag.ghost.setAttribute('aria-hidden','true');
    drag.ghost.style.cssText='position:fixed;z-index:90;inset:auto;width:min(400px,75vw);height:190px;min-height:0;pointer-events:none;transform:translate(-50%,-50%) rotate(2deg);opacity:.96;';
    document.body.appendChild(drag.ghost);
    drag.el.style.opacity='.35';
  }
  if(!drag.dragging)return;
  if(e.cancelable)e.preventDefault();
  drag.ghost.style.left=`${e.clientX}px`;
  drag.ghost.style.top=`${e.clientY}px`;
  $$('.drop-zone.is-over').forEach(el=>el.classList.remove('is-over'));
  const target=document.elementFromPoint(e.clientX,e.clientY)?.closest('.drop-zone');
  if(target)target.classList.add('is-over');
}
function endDrag(e){
  if(!drag||e.pointerId!==drag.pointerId)return;
  const active=drag.dragging;
  const id=active?document.elementFromPoint(e.clientX,e.clientY)?.closest('.drop-zone')?.dataset.dropzone:null;
  cancelDrag();
  if(id)dropCard(id);
}
function cancelDrag(){
  if(!drag)return;
  if(drag.ghost)drag.ghost.remove();
  if(drag.el?.isConnected)drag.el.style.opacity='';
  $$('.drop-zone.is-over').forEach(el=>el.classList.remove('is-over'));
  drag=null;
}
function showToast(text){
  const toast=$('#toast');toast.textContent=text;toast.classList.add('is-visible');
  clearTimeout(toastTimer);toastTimer=setTimeout(()=>toast.classList.remove('is-visible'),2300);
}

boot();
