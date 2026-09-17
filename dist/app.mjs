import {DEFAULTS,PROJECTION,gridGeometry,artworkMarkup,armGeometry,exportSVG,CALIBRATION,ARM_LIMITS,getArmCount,OUTER_WIDTH_MAX,TAPER_PROFILES,sampleArm,widthAt,goldenGuideGeometry} from './geometry.mjs';
let state={...DEFAULTS};
const $=id=>document.getElementById(id);
const grid=gridGeometry();
const slider=(key,label,min,max,unit='',step=1,ends=true)=>`<div class="range-control" data-control="${key}"><div class="range-head"><label for="${key}">${label}</label><span class="value-box"><input type="number" id="${key}-number" data-number="${key}" aria-label="${label}, numeric value" min="${min}" max="${max}" step="${step}" value="${state[key]}"><span>${unit}</span></span></div><input id="${key}" type="range" data-range="${key}" min="${min}" max="${max}" step="${step}" value="${state[key]}" aria-label="${label}">${ends?`<div class="range-ends"><span>${min}${unit}</span><span>${max}${unit}</span></div>`:''}</div>`;
const toggle=(key,label)=>`<div class="field-row"><label id="${key}-label" for="${key}">${label}</label><button type="button" class="switch" id="${key}" data-toggle="${key}" role="switch" aria-labelledby="${key}-label" aria-checked="${state[key]}"></button></div>`;
function controls(){
 $('controls').innerHTML=`<section class="control-section"><h3 class="section-heading">Geometry <span class="section-number">01</span></h3>${slider('armCount','Number of arms',ARM_LIMITS.min,ARM_LIMITS.max)}<div class="arm-presets" role="group" aria-label="Quick arm counts">${[4,5,6,8].map(n=>`<button type="button" data-count="${n}" aria-pressed="${state.armCount===n}" aria-label="${n} arms">${n}</button>`).join('')}</div><div class="field-row"><label for="model">Curve model</label><select id="model" data-select="model"><option value="swept">Circular sweep</option><option value="golden">Golden spiral</option></select></div>${slider('curvature','Curvature',0,240,'°')}${slider('endpoint','Endpoint rotation',-90,90,'°')}<div class="field-row"><label for="cap">End treatment</label><select id="cap" data-select="cap"><option value="flat">Normal cut</option><option value="round">Round</option><option value="radial">Radial cut</option></select></div></section><section class="control-section"><h3 class="section-heading">Stroke profile <span class="section-number">02</span></h3>${slider('innerWidth','Inner width',0,30,'px',.5)}${slider('outerWidth','Outer width',0,OUTER_WIDTH_MAX,'px',.5)}<div class="field-row"><label for="taper">Taper</label><select id="taper" data-select="taper" aria-describedby="taper-note">${Object.entries(TAPER_PROFILES).map(([value,p])=>`<option value="${value}">${p.label}</option>`).join('')}</select></div><div class="taper-preview"><svg id="taper-preview" viewBox="0 0 252 60" role="img" aria-label="Width profile from center to tip"></svg><div><span>Center</span><span>Tip</span></div></div><p class="muted-note" id="taper-note"></p><div class="appearance-group">${toggle('fill','Fill')}${slider('fillAlpha','Fill opacity',0,100,'%',1,false)}</div><div class="appearance-group">${toggle('stroke','Outline stroke')}${slider('strokeAlpha','Stroke opacity',0,100,'%',1,false)}</div></section><section class="control-section"><h3 class="section-heading">Reference & guides <span class="section-number">03</span></h3>${toggle('reference','Reference image')}<div id="reference-options"><div class="field-row"><label for="referenceSource">Sketch</label><select id="referenceSource" data-select="referenceSource"><option value="wide">Wide construct</option><option value="close">Small construct</option></select></div>${slider('referenceAlpha','Reference opacity',0,100,'%',1,false)}</div>${toggle('golden','Golden spiral guide')}<p class="muted-note" id="math-note">All arms share one outer ellipse. At 90° curvature, each arm is a circular arc before projection.</p><p class="muted-note golden-info" id="golden-note" hidden><span id="golden-description">Tracks the centerline of arm 1.</span> <a href="https://mathworld.wolfram.com/GoldenSpiral.html" target="_blank" rel="noreferrer">About the golden spiral ↗</a></p></section>`;
 sync();
}
function sync(preserveNumber){
 for(const el of document.querySelectorAll('[data-range]')){el.value=state[el.dataset.range];el.style.setProperty('--pct',`${100*(el.value-el.min)/(el.max-el.min)}%`);}
 for(const el of document.querySelectorAll('[data-number]'))if(el.dataset.number!==preserveNumber)el.value=state[el.dataset.number];
 for(const el of document.querySelectorAll('[data-count]'))el.setAttribute('aria-pressed',Number(el.dataset.count)===state.armCount);
 $('arm-badge').textContent=`${state.armCount} arms`;
 $('drawing').setAttribute('aria-label',`${state.armCount} equally spaced vortex arms on an isometric grid`);
 for(const el of document.querySelectorAll('[data-toggle]'))el.setAttribute('aria-checked',state[el.dataset.toggle]);
 for(const el of document.querySelectorAll('[data-select]'))el.value=state[el.dataset.select];
 for(const key of ['grid','dots','frame','reference'])$(key+'-quick').setAttribute('aria-pressed',state[key]);
 $('zoom-fit').textContent=state.zoom+'%';
 $('reference-options').hidden=!state.reference;
 $('golden-note').hidden=!state.golden&&state.model!=='golden';
 $('golden-description').textContent=state.model==='golden'?'Tracks the centerline of arm 1, including its rotation and scale. Markers show a φ change in radius every quarter-turn.':'Golden comparison aligned to arm 1’s outer tip. Circular sweeps do not follow golden-spiral proportions.';
 for(const [k,disabled] of [['fillAlpha',!state.fill],['strokeAlpha',!state.stroke],['curvature',state.model==='golden']]){
  const el=document.querySelector(`[data-control="${k}"]`);el.classList.toggle('disabled',disabled);el.querySelectorAll('input').forEach(e=>e.disabled=disabled);
 }
 $('status-model').textContent=state.model==='golden'?'Golden spiral':'Circular sweep';
 $('workspace-detail').innerHTML=`30° / 60° <span>·</span> ${state.armCount} arms <span>·</span> ${(360/state.armCount).toLocaleString('en',{maximumFractionDigits:1})}° spacing`;
 $('math-note').textContent=state.model==='golden'?'Radius grows by φ every 90°. The spiral is sampled down to the central join.':'All arms share one outer ellipse and are evenly spaced before projection. At 90° curvature, each arm is a circular arc.';
 $('status-info').innerHTML=!state.fill&&!state.stroke?'Fill and stroke hidden':`${state.armCount} paths <span>·</span> SVG ready`;
}
function drawTaperPreview(){
 const samples=sampleArm(state),maxWidth=Math.max(state.innerWidth,state.outerWidth,1);
 const edge=sign=>samples.map(p=>[8+p.u*236,30+sign*23*widthAt(p.u,state,p.t)/maxWidth]);
 const points=[...edge(-1),...edge(1).reverse()];
 $('taper-preview').innerHTML=`<path d="M8,30H244M8,5V55M126,5V55M244,5V55" fill="none" stroke="#3a465a" stroke-dasharray="2 4"/><path d="${points.map((p,i)=>(i?'L':'M')+p.map(v=>v.toFixed(2)).join(',')).join('')}Z" fill="#77aaff" fill-opacity=".28" stroke="#97bdf5" stroke-width="1"/>`;
 $('taper-preview').setAttribute('aria-label',`${TAPER_PROFILES[state.taper].label} width profile, ${state.innerWidth} pixels at the center to ${state.outerWidth} pixels at the tip`);
 $('taper-note').textContent=TAPER_PROFILES[state.taper].description;
}
function draw(){
 drawTaperPreview();
 const s=state, c=CALIBRATION[s.referenceSource];
 
 const gridMarkup=`<g transform="translate(${c.gridX},${c.gridY})">${s.grid?`<path d="${grid.lines}" fill="none" stroke="#7c8ba9" stroke-opacity=".2" stroke-width=".8"/>`:''}${s.dots?`<g fill="#92a9d0" opacity=".32">${grid.dots.map(([x,y])=>`<circle cx="${x}" cy="${y}" r="1.2"/>`).join('')}</g>`:''}</g>`;
 const frame=`<g fill="none"><path d="M0,-275.6L477.4,0L0,275.6L-477.4,0Z" stroke="#547bb4" stroke-width="1" opacity=".42"/><path d="M-515,0H515M0,-310V310" stroke="#6383b4" stroke-width=".75" stroke-dasharray="3 5" opacity=".4"/><circle r="5" stroke="#8aaddd" opacity=".7"/></g><text x="484" y="-10" class="canvas-label">X</text><text x="10" y="-283" class="canvas-label">Y</text><text x="11" y="21" class="guide-label">0, 0</text>`;
 const golden=goldenGuideGeometry(s);
 const goldenMarkup=`<g id="golden-guide" data-aligned="${golden.aligned}" pointer-events="none" fill="none" stroke="#e4bd76">
  ${golden.checkpoints.map(p=>`<ellipse rx="${p.radius}" ry="${p.radius*PROJECTION}" stroke-opacity=".3" stroke-width=".75"/>`).join('')}
  <path d="${golden.center}" stroke="#141820" stroke-opacity=".7" stroke-width="3.5"/>
  <path data-guide-path="true" d="${golden.center}" stroke-width="1.7" stroke-dasharray="5 4"/>
  ${golden.checkpoints.map((p,i)=>`<circle data-guide-marker="${i}" cx="${p.point[0]}" cy="${p.point[1]}" r="3" fill="#171b23" stroke-width="1.3"/><text x="${p.point[0]+8}" y="${p.point[1]-8}" fill="#e9c981" stroke="#13161b" stroke-width="3" stroke-linejoin="round" paint-order="stroke" font-size="12">${p.label}</text>`).join('')}
 </g>`;
 const tips=Array.from({length:getArmCount(s)},(_,i)=>{const a=armGeometry(i,s);return `<circle class="tip" cx="${a.tip[0]}" cy="${a.tip[1]}" r="3.1"/>`;}).join('');
 // References retain native pixels: the origin and grid step are calibrated independently of the art radius.
 const ref=`<image href="./assets/reference-${s.referenceSource}.png" x="${-c.cx}" y="${-c.cy}" width="${c.width}" height="${c.height}" opacity="${s.referenceAlpha/100}"/>`;
 const artScale=s.referenceSource==='close'?c.radius/298:1;
 $('scene').innerHTML=`<g transform="scale(${s.zoom/100})">${s.reference?ref:''}${gridMarkup}${s.frame?frame:''}<g transform="scale(${artScale})">${s.frame?`<ellipse rx="298" ry="${298*PROJECTION}" class="guide"/>`:''}${artworkMarkup(s)}${s.frame?tips:''}${s.golden?goldenMarkup:''}</g></g>`;
}
function update(key,value){state[key]=key==='armCount'?Math.round(value):value;sync();draw();}
$('controls').addEventListener('input',e=>{const k=e.target.dataset.range,n=e.target.dataset.number;if(k)update(k,Number(e.target.value));if(n&&e.target.value!==''){const v=Number(e.target.value);if(Number.isFinite(v)&&v>=Number(e.target.min)&&v<=Number(e.target.max)){state[n]=n==='armCount'?Math.round(v):v;sync(n);draw();}}});
$('controls').addEventListener('focusout',e=>{const k=e.target.dataset.number;if(k){const v=Number(e.target.value);update(k,e.target.value!==''&&Number.isFinite(v)?Math.max(Number(e.target.min),Math.min(Number(e.target.max),v)):state[k]);}});
$('controls').addEventListener('change',e=>{const n=e.target.dataset.number,k=e.target.dataset.select;if(n){const v=Number(e.target.value);update(n,e.target.value!==''&&Number.isFinite(v)?Math.min(Number(e.target.max),Math.max(Number(e.target.min),v)):state[n]);}if(k)update(k,e.target.value);});
$('controls').addEventListener('click',e=>{const el=e.target.closest('[data-toggle]');if(el)update(el.dataset.toggle,!state[el.dataset.toggle]);const preset=e.target.closest('[data-count]');if(preset)update('armCount',Number(preset.dataset.count));});
for(const key of ['grid','dots','frame','reference'])$(key+'-quick').addEventListener('click',()=>update(key,!state[key]));
$('zoom-in').onclick=()=>update('zoom',Math.min(180,state.zoom+10));$('zoom-out').onclick=()=>update('zoom',Math.max(50,state.zoom-10));$('zoom-fit').onclick=()=>update('zoom',100);
$('reset').onclick=()=>{state={...DEFAULTS};sync();draw();toast('Original geometry restored');};
let toastTimer;function toast(message){$('toast').textContent=message;$('toast').classList.add('visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').classList.remove('visible'),2600);}
function download(){const blob=new Blob([exportSVG(state)],{type:'image/svg+xml'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='vortex.svg';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);toast('Vortex exported as SVG');}
$('export').onclick=download;
controls();draw();

// The same state is available to browser assistants when the browser supports WebMCP.
const numericRules={armCount:[ARM_LIMITS.min,ARM_LIMITS.max],curvature:[0,240],endpoint:[-90,90],innerWidth:[0,30],outerWidth:[0,OUTER_WIDTH_MAX],fillAlpha:[0,100],strokeAlpha:[0,100],referenceAlpha:[0,100],zoom:[50,180]};
const enums={taper:Object.keys(TAPER_PROFILES),cap:['flat','round','radial'],model:['swept','golden'],referenceSource:['wide','close']};
const booleans=['fill','stroke','grid','dots','frame','reference','golden'];
const properties=Object.fromEntries([...Object.entries(numericRules).map(([k,[min,max]])=>[k,{type:k==='armCount'?'integer':'number',minimum:min,maximum:max}]),...Object.entries(enums).map(([k,values])=>[k,{type:'string',enum:values}]),...booleans.map(k=>[k,{type:'boolean'}])]);
function validateSettings(input){
 if(!input||typeof input!=='object'||Array.isArray(input))throw new Error('Settings must be an object.');
 const next={...state};
 for(const [k,v] of Object.entries(input)){
  if(!Object.hasOwn(properties,k))throw new Error(`Unknown setting: ${k}`);
  if(numericRules[k]&&!(typeof v==='number'&&Number.isFinite(v)&&v>=numericRules[k][0]&&v<=numericRules[k][1]))throw new Error(`Invalid value for ${k}`);
  if(k==='armCount'&&!Number.isInteger(v))throw new Error('Arm count must be an integer.');
  if(enums[k]&&!enums[k].includes(v))throw new Error(`Invalid option for ${k}`);
  if(booleans.includes(k)&&typeof v!=='boolean')throw new Error(`Expected a boolean for ${k}`);
  next[k]=v;
 }
 return next;
}
const context=document.modelContext;
if(context?.registerTool){
 const lifecycle=new AbortController();
 const tools=[
  {name:'get_vortex_settings',title:'Read vortex settings',description:'Read all current controls for the visible vortex.',inputSchema:{type:'object',properties:{},additionalProperties:false},annotations:{readOnlyHint:true},execute:()=>({...state})},
  {name:'set_vortex_settings',title:'Adjust vortex geometry',description:'Update vortex controls and redraw the visible workspace. Does not export or publish anything.',inputSchema:{type:'object',properties,additionalProperties:false},annotations:{readOnlyHint:false},execute:input=>{state=validateSettings(input);sync();draw();return {...state};}},
  {name:'get_vortex_svg',title:'Read vortex SVG',description:'Return a standalone transparent SVG of the current construct, excluding guides and reference images.',inputSchema:{type:'object',properties:{},additionalProperties:false},annotations:{readOnlyHint:true},execute:()=>({filename:'vortex.svg',svg:exportSVG(state)})}
 ];
 for(const tool of tools){try{Promise.resolve(context.registerTool(tool,{signal:lifecycle.signal})).catch(()=>{});}catch{}}
 addEventListener('pagehide',()=>lifecycle.abort(),{once:true});
}
