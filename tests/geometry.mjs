import assert from 'node:assert/strict';
import {DEFAULTS,PROJECTION,PHI,TAU,RADIUS,centerline,armGeometry,gridGeometry,exportSVG,getArmCount} from '../dist/geometry.mjs';
const close=(a,b,e=1e-7)=>assert.ok(Math.abs(a-b)<e,`${a} != ${b}`);
const rotate=([x,y],a)=>[x*Math.cos(a)-y*Math.sin(a),x*Math.sin(a)+y*Math.cos(a)];

// Regression: the four diagonal tips must reach the same outer ellipse as the
// four main tips. The old diamond constraint incorrectly reduced their radius.
for(const armCount of [2,3,4,5,6,7,8,12,16])for(const model of ['swept','golden']){
 const s={...DEFAULTS,armCount,model};
 for(let i=0;i<armCount;i++){
  const phase=i*TAU/armCount,tip=centerline(1,phase,s);
  close(Math.hypot(...tip),RADIUS);
  close(Math.hypot(...centerline(0,phase,s)),0);
  for(const t of [.01,.1,.25,.5,.70710678,.9,1]){
   const p=centerline(t,phase,s),base=rotate(centerline(t,0,s),phase);
   close(p[0],base[0]);close(p[1],base[1]);
   close(Math.hypot(...p),RADIUS*t);
  }
 }
 const svg=exportSVG(s);
 assert.equal((svg.match(/<path/g)||[]).length,armCount);
 assert(svg.includes(`${armCount}-arm isometric construct`));
 assert(!svg.includes('<image'));
}

// Preserve the four primary circular curves, independent of added arms.
for(const phase of [0,Math.PI/2,Math.PI,Math.PI*1.5])for(const t of [.1,.25,.5,.9]){
 const p=centerline(t,phase,DEFAULTS),x=p[0]*Math.cos(phase)+p[1]*Math.sin(phase),y=-p[0]*Math.sin(phase)+p[1]*Math.cos(phase);
 close((x-RADIUS/2)**2+y*y,(RADIUS/2)**2,1e-6);
}

// With a shared radius function, arms have a constant angular separation at
// each radius, so their centerlines cannot intersect away from the center.
for(const model of ['swept','golden'])for(const armCount of [4,5,6,8,16])for(const endpoint of [-90,0,90]){
 const s={...DEFAULTS,model,armCount,endpoint};
 for(const t of [.02,.25,.7,1]){
  const a=centerline(t,0,s),b=centerline(t,TAU/armCount,s);
  close((a[0]*b[0]+a[1]*b[1])/(RADIUS*t)**2,Math.cos(TAU/armCount));
  close((a[0]*b[1]-a[1]*b[0])/(RADIUS*t)**2,Math.sin(TAU/armCount));
 }
}

const gold={...DEFAULTS,model:'golden'};
const p1=centerline(.8,0,gold),p2=centerline(.8/PHI,0,gold);
close(Math.hypot(...p1)/Math.hypot(...p2),PHI);
close(p1[0]*p2[0]+p1[1]*p2[1],0,1e-6);
for(const model of ['swept','golden'])for(const cap of ['flat','round','radial'])for(const curvature of [0,90,240]){
 const s={...DEFAULTS,armCount:5,model,cap,curvature,endpoint:90,innerWidth:30,outerWidth:40};
 for(let i=0;i<s.armCount;i++){
  const a=armGeometry(i,s);assert(!/NaN|Infinity/.test(a.outline));assert(a.outline.endsWith('Z'));
  const nums=a.outline.match(/-?\d+\.\d+/g).map(Number);
  for(let j=0;j<nums.length;j+=2){assert(Math.abs(nums[j])<=319);assert(Math.abs(nums[j+1])<=319*PROJECTION);}
 }
}
for(const armCount of [0,1,3.5,17,NaN,Infinity,'4'])assert.throws(()=>getArmCount({...DEFAULTS,armCount}),RangeError);
const grid=gridGeometry(),lines=grid.lines.split('M').filter(Boolean);assert.equal(new Set(lines).size,74);
for(const [x,y] of grid.dots)close((y-x*PROJECTION)/(2*43.4*PROJECTION),Math.round((y-x*PROJECTION)/(2*43.4*PROJECTION)),1e-6);
assert(exportSVG(DEFAULTS).includes('fill-opacity="0.92"'));
assert(exportSVG({...DEFAULTS,fill:false,stroke:false}).includes('fill="none"'));
assert(exportSVG({...DEFAULTS,referenceSource:'close'}).includes('transform="scale(0.436'));
console.log('PASS: equal reach, preserved primary curves, 2–16 arm spacing, nonintersecting centerlines, golden ratio, cap extremes, invalid counts, grid and SVG export.');
