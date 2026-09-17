/* Dependency-free statistical routines, shared by the browser and Node checks. */
(function(root) {
'use strict';
const {logGamma}=typeof module!=='undefined'?require('../../shared/beta.js'):root.BetaMath;
function erfc(x){const z=Math.abs(x),t=1/(1+.5*z);const r=t*Math.exp(-z*z-1.26551223+t*(1.00002368+t*(.37409196+t*(.09678418+t*(-.18628806+t*(.27886807+t*(-1.13520398+t*(1.48851587+t*(-.82215223+t*.17087277)))))))));return x>=0?r:2-r;}
function logChoose(n,k){return logGamma(n+1)-logGamma(k+1)-logGamma(n-k+1);}
function frequentist(nA,yA,nB,yB){
 const N=nA+nB,s=yA+yB, cells=[yA,nA-yA,yB,nB-yB],expected=[nA*s/N,nA*(N-s)/N,nB*s/N,nB*(N-s)/N];
 const warn=expected.some(x=>x<5);
 let chi=null,corrected=null,exact=null;
 if(s>0&&s<N){
  chi=cells.reduce((v,o,i)=>v+(o-expected[i])**2/expected[i],0);
  const correction=Math.min(.5,...cells.map((o,i)=>Math.abs(o-expected[i])));
  corrected=cells.reduce((v,o,i)=>v+(Math.abs(o-expected[i])-correction)**2/expected[i],0);
  exact=0;for(let a=Math.max(0,s-nB);a<=Math.min(nA,s);a++) {const t=N*(a*nB-(s-a)*nA)**2/(nA*nB*s*(N-s));if(t>=chi-1e-9)exact+=Math.exp(logChoose(nA,a)+logChoose(nB,s-a)-logChoose(N,s));}exact=Math.min(1,exact);
 }
 let z=null;if(cells.every(x=>x>0))z=(Math.log(yB/(nB-yB))-Math.log(yA/(nA-yA)))/Math.sqrt(cells.reduce((v,x)=>v+1/x,0));
 return {chi,corrected,exact,correctedP:corrected===null?null:erfc(Math.sqrt(corrected/2)),z,logisticP:z===null?null:erfc(Math.abs(z)/Math.SQRT2),warn};
}
const api={frequentist};if(typeof module!=='undefined')module.exports=api;root.AchooStats=api;
})(globalThis);
