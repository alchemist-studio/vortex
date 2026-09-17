import assert from 'node:assert/strict';
import {DEFAULTS,RADIUS,PHI,PROJECTION,goldenGuideGeometry,armGeometry} from '../dist/geometry.mjs';
const close=(a,b)=>assert.ok(Math.abs(a-b)<1e-7,`${a} != ${b}`);
for(const model of ['golden','swept'])for(const endpoint of [-90,-37,0,54,90])for(const armCount of [4,5,8,16]){
 const s={...DEFAULTS,model,endpoint,armCount};
 const guide=goldenGuideGeometry(s),arm=armGeometry(0,s);
 assert.equal(guide.aligned,model==='golden');
 close(guide.tip[0],arm.tip[0]);close(guide.tip[1],arm.tip[1]);
 for(let i=0;i<guide.checkpoints.length;i++){
  const p=guide.checkpoints[i],radius=RADIUS/PHI**i,angle=endpoint*Math.PI/180-i*Math.PI/2;
  close(p.point[0],radius*Math.cos(angle));close(p.point[1],radius*Math.sin(angle)*PROJECTION);
 }
 if(model==='golden')assert.equal(guide.center,arm.center);
 else assert.notEqual(guide.center,arm.center);
}
console.log('PASS: guide follows positive/negative endpoint rotation; golden centerline matches; φ checkpoints advance by quarter-turns; circular mode stays a true golden comparison.');
