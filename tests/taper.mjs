import assert from 'node:assert/strict';
import {DEFAULTS,RADIUS,PROJECTION,OUTER_WIDTH_MAX,TAPER_PROFILES,taperFactor,widthAt,sampleArm,armGeometry,exportSVG} from '../dist/geometry.mjs';
const close=(a,b,e=1e-7)=>assert.ok(Math.abs(a-b)<e,`${a} != ${b}`);
assert.equal(OUTER_WIDTH_MAX,200);
for(const taper of Object.keys(TAPER_PROFILES)){
 close(taperFactor(0,taper),0);close(taperFactor(1,taper),1);
 let last=-1;
 for(let i=0;i<=1000;i++){
  const f=taperFactor(i/1000,taper);assert(f>=last-1e-12&&f>=0&&f<=1);last=f;
  for(const [innerWidth,outerWidth] of [[0,200],[30,0],[30,30],[0,0]]){
   const w=widthAt(i/1000,{...DEFAULTS,innerWidth,outerWidth,taper});
   assert(w>=Math.min(innerWidth,outerWidth)-1e-10&&w<=Math.max(innerWidth,outerWidth)+1e-10);
  }
 }
}
assert.throws(()=>taperFactor(.5,'unknown'),RangeError);
close(taperFactor(.5,'late'),.25);close(taperFactor(.5,'early'),.75);
for(const profile of ['smooth','smoother']){
 const h=1e-6;assert(taperFactor(h,profile)/h<1e-4);assert((1-taperFactor(1-h,profile))/h<1e-4);
}
// A semicircle has a known arc length, and uniform angular sampling should
// produce uniform length progress independently of the radial parameter.
const circle=sampleArm({...DEFAULTS,model:'swept',curvature:90,endpoint:0});
close(circle.at(-1).length,Math.PI*RADIUS/2,.002);
close(circle[200].u,.5);close(circle[200].t,Math.SQRT1_2);
assert(widthAt(.5,{...DEFAULTS,innerWidth:0,outerWidth:200,taper:'linear'},Math.SQRT1_2)<widthAt(.5,{...DEFAULTS,innerWidth:0,outerWidth:200,taper:'radial'},Math.SQRT1_2));

for(const model of ['swept','golden'])for(const taper of Object.keys(TAPER_PROFILES)){
 const s={...DEFAULTS,armCount:5,innerWidth:0,outerWidth:200,model,taper};
 const samples=sampleArm(s),arm=armGeometry(0,s);
 const nums=arm.outline.match(/-?\d+\.\d+/g).map(Number),points=[];
 for(let i=0;i<nums.length;i+=2)points.push([nums[i],nums[i+1]]);
 assert.equal(points.length,2*samples.length);
 for(const i of [0,Math.floor(samples.length/4),Math.floor(samples.length/2),samples.length-1]){
  const a=points[i],b=points[points.length-1-i];
  close(Math.hypot(a[0]-b[0],(a[1]-b[1])/PROJECTION),widthAt(samples[i].u,s,samples[i].t),.004);
 }
 const coarse=sampleArm(s,0,200),dense=sampleArm(s,0,1600);
 assert(Math.abs(coarse.at(-1).length/dense.at(-1).length-1)<.001);
 for(const cap of ['flat','round','radial']){
  const svg=exportSVG({...s,cap}),bounds=svg.match(/viewBox="([^"]+)"/)[1].split(' ').map(Number);
  assert(svg.includes(`taper ${taper}`));assert.equal((svg.match(/<path/g)||[]).length,5);
  assert(!/NaN|Infinity/.test(svg));
  for(let j=0;j<s.armCount;j++){
   const coords=armGeometry(j,{...s,cap}).outline.match(/-?\d+\.\d+/g).map(Number);
   for(let i=0;i<coords.length;i+=2){assert(coords[i]>=bounds[0]&&coords[i]<=-bounds[0]);assert(coords[i+1]>=bounds[1]&&coords[i+1]<=-bounds[1]);}
  }
 }
}
console.log('PASS: six taper profiles, exact end widths, monotonic/reversed/zero widths, arc-length convergence, 200px outlines and SVG bounds for both curve modes and all caps.');
