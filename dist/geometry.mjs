export const TAU=Math.PI*2;
export const PHI=(1+Math.sqrt(5))/2;
export const DEFAULTS=Object.freeze({armCount:8,curvature:90,endpoint:0,innerWidth:2,outerWidth:9,taper:'late',cap:'flat',fill:true,fillAlpha:92,stroke:true,strokeAlpha:100,grid:true,dots:true,frame:true,reference:false,referenceAlpha:48,referenceSource:'wide',golden:false,model:'swept',zoom:100});
export const CALIBRATION=Object.freeze({wide:{cx:503,cy:334,radius:298,width:974,height:637,step:43.4,gridX:1.14,gridY:21.34},close:{cx:512,cy:352,radius:130,width:1043,height:704,step:43.4,gridX:.72,gridY:21.01}});
export const PROJECTION=1/Math.sqrt(3);
export const RADIUS=298;
export const OUTER_WIDTH_MAX=200;
export const TAPER_PROFILES=Object.freeze({
 linear:{label:'Linear',description:'Even width change along the length of the arm.'},
 smooth:{label:'Smoothstep',description:'Eases gently away from the inner width and into the outer width.'},
 smoother:{label:'Smootherstep',description:'An even softer start and finish, with more change in the middle.'},
 late:{label:'Late flare',description:'Changes slowly near the center, then more quickly toward the tip.'},
 early:{label:'Early flare',description:'Makes most of the width change near the center, then eases into the tip.'},
 radial:{label:'Linear (original)',description:'The original taper, based on distance from the vortex center.'}
});
export function taperFactor(u,profile){
 const x=Math.max(0,Math.min(1,u));
 switch(profile){
  case 'linear':case 'radial':return x;
  case 'smooth':return x*x*(3-2*x);
  case 'smoother':return x*x*x*(x*(6*x-15)+10);
  case 'late':return x*x;
  case 'early':return 1-(1-x)*(1-x);
  default:throw new RangeError('Unknown taper profile.');
 }
}
export function widthAt(u,s,radialProgress=u){
 const profile=s.taper??'radial';
 const f=taperFactor(profile==='radial'?radialProgress:u,profile);
 return s.innerWidth+(s.outerWidth-s.innerWidth)*f;
}
function samplingRadius(u,s){
 return s.model==='golden'?(u===0?0:Math.exp(Math.log(.0005)*(1-u))):Math.sin(u*Math.PI/2);
}
export function sampleArm(s,phase=0,segments=s.model==='golden'?600:400){
 const samples=[];let length=0;
 for(let i=0;i<=segments;i++){
  const parameter=i/segments,t=samplingRadius(parameter,s),point=centerline(t,phase,s);
  if(i){const prev=samples[i-1].point;length+=Math.hypot(point[0]-prev[0],point[1]-prev[1]);}
  samples.push({parameter,t,point,length});
 }
 return samples.map(p=>({...p,u:p.length/length}));
}

export const ARM_LIMITS=Object.freeze({min:2,max:16});
export function getArmCount(s){
 if(!Number.isInteger(s.armCount)||s.armCount<ARM_LIMITS.min||s.armCount>ARM_LIMITS.max)throw new RangeError('Arm count must be an integer from 2 to 16.');
 return s.armCount;
}
export function centerline(t,phase,s){
 // Every arm is a rotated copy of the same curve. A diamond boundary would
 // shorten alternate arms and place their tips inside adjacent curves.
 const radius=RADIUS;
 const bend=s.curvature*Math.PI/180;
 const twist=s.endpoint*Math.PI/180;
 const theta=phase+(s.model==='golden'?Math.log(Math.max(t,.0005))/(Math.log(PHI)/(Math.PI/2)):-bend*Math.acos(t)/(Math.PI/2))+twist*(s.model==='golden'?1:t*t);
 return [Math.cos(theta)*t*radius,Math.sin(theta)*t*radius];
}
const project=p=>[p[0],p[1]*PROJECTION];
const add=(a,b,n=1)=>[a[0]+b[0]*n,a[1]+b[1]*n];
const path=ps=>ps.map((p,i)=>(i?'L':'M')+p.map(x=>x.toFixed(3)).join(',')).join('');
export function armGeometry(index,s){
 const phase=index*TAU/getArmCount(s);
 const samples=sampleArm(s,phase),n=samples.length-1,left=[],right=[],centers=[];
 let startNormal,endNormal,endTangent;
 for(let i=0;i<=n;i++){
  const {parameter,t,point:p,u}=samples[i];
  // Differentiate the well-spaced sampling parameter rather than radius;
  // the circular model has a singular d(theta)/d(radius) at the outer tip.
  const p0=centerline(samplingRadius(Math.max(0,parameter-.00001),s),phase,s);
  const p1=centerline(samplingRadius(Math.min(1,parameter+.00001),s),phase,s);
  const dx=p1[0]-p0[0],dy=p1[1]-p0[1],len=Math.hypot(dx,dy)||1;
  let normal=[-dy/len,dx/len];
  if(i===n&&s.cap==='radial')normal=[-Math.sin(phase+s.endpoint*Math.PI/180),Math.cos(phase+s.endpoint*Math.PI/180)];
  const width=widthAt(u,s,t)/2;
  left.push(add(p,normal,width));right.push(add(p,normal,-width));centers.push(project(p));
  if(i===0)startNormal=normal;
  if(i===n){endNormal=normal;endTangent=[normal[1],-normal[0]];}
 }
 let points=[...left];
 if(s.cap==='round'){
  const end=centerline(1,phase,s);
  for(let j=1;j<25;j++){const a=j*Math.PI/24;points.push(add(add(end,endNormal,Math.cos(a)*s.outerWidth/2),endTangent,Math.sin(a)*s.outerWidth/2));}
 }
 points.push(...right.reverse());
 if(s.cap==='round'){
  for(let j=1;j<25;j++){const a=j*Math.PI/24;points.push(add(add([0,0],startNormal,-Math.cos(a)*s.innerWidth/2),[-startNormal[1],startNormal[0]],Math.sin(a)*s.innerWidth/2));}
 }
 return {outline:path(points.map(project))+'Z',center:path(centers),tip:project(centerline(1,phase,s))};
}
// A true golden reference follows the same rotation, origin and projection as
// arm zero. In golden mode its centerline is exactly the artwork centerline.
export function goldenGuideGeometry(s){
 const guideState={...s,model:'golden'};
 const arm=armGeometry(0,guideState);
 const checkpoints=Array.from({length:4},(_,i)=>{
  const t=PHI**(-i);
  return {point:project(centerline(t,0,guideState)),radius:RADIUS*t,label:i===0?'Arm 1 · φ⁰':`φ${['','⁻¹','⁻²','⁻³'][i]}`};
 });
 return {center:arm.center,tip:arm.tip,checkpoints,aligned:s.model==='golden'};
}

export function gridGeometry(){
 const lines=[],dots=[];const step=43.4,dy=step*PROJECTION;
 for(let i=-18;i<=18;i++){
  const b=i*2*dy;
  lines.push(`M-1100,${b-1100*PROJECTION}L1100,${b+1100*PROJECTION}`);
  lines.push(`M-1100,${b+1100*PROJECTION}L1100,${b-1100*PROJECTION}`);
 }
 for(let i=-22;i<=22;i++)for(let j=-22;j<=22;j++){
  const x=(i+j)*step,y=(i-j)*dy;
  if(Math.abs(x)<1100&&Math.abs(y)<800)dots.push([x,y]);
 }
 return {lines:lines.join(''),dots};
}
export function artworkMarkup(s){return Array.from({length:getArmCount(s)},(_,i)=>{const a=armGeometry(i,s);return `<path d="${a.outline}" fill="${s.fill?'#4895ff':'none'}" fill-opacity="${s.fillAlpha/100}" stroke="${s.stroke?'#8abfff':'none'}" stroke-opacity="${s.strokeAlpha/100}" stroke-width="0.85" stroke-linejoin="round"/>`;}).join('');}
export function exportSVG(s){
 // Include room for widths and projected round caps at every endpoint.
 const scale=s.referenceSource==='close'?130/298:1;
 const pad=Math.max(s.innerWidth,s.outerWidth)/2+5,w=2*(298+pad)*scale,h=2*(298+pad)*PROJECTION*scale;
 return `<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" width="${w.toFixed(3)}" height="${h.toFixed(3)}" viewBox="${(-w/2).toFixed(3)} ${(-h/2).toFixed(3)} ${w.toFixed(3)} ${h.toFixed(3)}"><title>Vortex — ${getArmCount(s)}-arm isometric construct</title><desc>${getArmCount(s)} equally spaced arms with a common outer radius. 30 degree isometric projection. Curvature ${s.curvature} degrees; endpoint rotation ${s.endpoint} degrees; inner width ${s.innerWidth}; outer width ${s.outerWidth}; cap ${s.cap}; model ${s.model}; taper ${s.taper??'radial'}. Transparent background, vector outlines.</desc>${scale!==1?`<g transform="scale(${scale})">`:""}${artworkMarkup(s)}${scale!==1?"</g>":""}</svg>`;
}
