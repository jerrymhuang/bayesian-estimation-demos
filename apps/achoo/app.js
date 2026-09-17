'use strict';
const $=id=>document.getElementById(id), S=AchooStats;
const state={nA:30,yA:1,nB:10,yB:3,k:5};
const pct=x=>(100*x).toFixed(1)+'%';
const prob=x=>x>.9995?'> 99.9%':x<.0005?'< 0.1%':pct(x);
const pval=x=>x===null?'—':x<.0001?'< 0.0001':x.toFixed(4);
function draw(id,points,color,label){
 const W=420,H=238,L=43,R=12,T=18,B=40,lo=points[0][0],hi=points.at(-1)[0],max=Math.max(...points.map(p=>p[1]))*1.1;
 const x=v=>L+(v-lo)/(hi-lo)*(W-L-R),y=v=>H-B-v/max*(H-T-B);
 const path=ps=>ps.map((p,i)=>(i?'L':'M')+x(p[0]).toFixed(2)+','+y(p[1]).toFixed(2)).join(' ');
 const positive=points.filter(p=>p[0]>=0);
 let svg=`<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${label}"><title>${label}</title>`;
 for(let i=0;i<=3;i++){const v=max*i/3;svg+=`<line x1="${L}" x2="${W-R}" y1="${y(v)}" y2="${y(v)}" stroke="#e9e9e0"/><text x="${L-8}" y="${y(v)+4}" text-anchor="end">${v.toFixed(v>=10?0:1)}</text>`;}
 svg+=`<path d="${path(points)} L${x(points.at(-1)[0])},${H-B} L${x(points[0][0])},${H-B} Z" fill="${color}" opacity=".08"/>`;
 if(positive.length)svg+=`<path d="${path(positive)} L${x(positive.at(-1)[0])},${H-B} L${x(positive[0][0])},${H-B} Z" fill="${color}" opacity=".35"/>`;
 svg+=`<path d="${path(points)}" fill="none" stroke="${color}" stroke-width="2.5"/>`;
 if(lo<=0&&hi>=0)svg+=`<line x1="${x(0)}" x2="${x(0)}" y1="${T}" y2="${H-B}" stroke="#46564b" stroke-dasharray="4 4"/><text x="${x(0)+5}" y="${T+9}">zero</text>`;
 for(let i=0;i<=4;i++){const v=lo+(hi-lo)*i/4;svg+=`<text x="${x(v)}" y="${H-B+19}" text-anchor="middle">${v.toFixed(2)}</text>`;}
 svg+=`<text x="${L}" y="10">Density</text><text x="${(W+L-R)/2}" y="${H-3}" text-anchor="middle">Difference in disease risk</text></svg>`;$(id).innerHTML=svg;
}
let brmsCache;
function getBrms(nA,yA,nB,yB){
 const key=[nA,yA,nB,yB].join(',');if(brmsCache?.key===key)return brmsCache.fit;
 const boundary=yA===0||yA===nA||yB===0||yB===nB;
 let fit=AchooBrms.fit(nA,yA,nB,yB,boundary?1024:512);
 if(boundary&&fit.available){
  const coarse=AchooBrms.fit(nA,yA,nB,yB,512);
  if(Math.abs(coarse.norm/fit.norm-1)>.002)fit={available:false,reason:'This posterior is too diffuse for reliable browser quadrature at these counts. brms summaries are withheld; use a carefully diagnosed R fit or a proper treatment-coefficient prior.'};
 }
 fit.boundary=boundary;brmsCache={key,fit};return fit;
}
function update(){
 const {nA,yA,nB,yB,k}=state,N=nA+nB,f=S.frequentist(nA,yA,nB,yB);
 const brms=getBrms(nA,yA,nB,yB);
 const selected=brms.available?brms.summaries:null;
 const selectedProbs=brms.available?[brms.probability(1),brms.probability(k)]:[null,null];
 $('brms-note').textContent=!brms.available?brms.reason:brms.boundary?'Posterior summaries are available, but density plots are omitted for boundary counts where mass can concentrate extremely close to risk 0 or 1.':'';
 for(const key of ['nA','yA','nB','yB','k'])$(key).value=state[key];$('nA').max=1000-nB;$('nB').max=1000-nA;$('yA').max=nA;$('yB').max=nB;$('total').min=2;$('total').value=N;$('total-value').textContent=N;$('k-value').textContent=k+'×';$('question-k').textContent=k;
 $('trial-size').textContent=N+' participants';$('answer-better').textContent=selectedProbs[0]===null?'Unavailable':prob(selectedProbs[0]);$('answer-times').textContent=selectedProbs[1]===null?'Unavailable':prob(selectedProbs[1]);$('times-formula').innerHTML=`P(p<sub>B</sub> &gt; ${k} p<sub>A</sub> | data)`;
 $('answer-test').textContent=f.exact===null?'Test undefined':f.exact<.05?(yA/nA<yB/nB?'Evidence favors A':'Evidence favors B'):'Inconclusive';
 $('test-description').textContent=f.exact===null?'No variation in observed outcomes.':`Conditional Pearson p = ${pval(f.exact)}. ${f.exact<.05?'Reject equal risks at α = 0.05.':'Do not reject equal risks at α = 0.05.'}`;
 $('counts').innerHTML=[['A',nA,yA,'a'],['B',nB,yB,'b']].map(([name,n,c,cls],i)=>`<tr><td><span class="dot ${cls}"></span>${name}</td><td>${c}</td><td>${n-c}</td><td>${n}</td><td>${pct(c/n)}</td><td>${selected?`${pct(selected[i].mean)} [${pct(selected[i].low)}, ${pct(selected[i].high)}]`:'Unavailable'}</td></tr>`).join('');
 $('tests').innerHTML=[['Conditional Pearson χ² (exact)',f.chi,f.exact],['Yates-corrected χ²',f.corrected,f.correctedP],['Logistic regression · Group B',f.z,f.logisticP]].map(([name,t,p])=>`<tr><td>${name}</td><td>${t===null?'—':t.toFixed(3)}</td><td>${pval(p)}</td><td>${p===null?'Not defined':p<.05?'Reject equal risks':'Do not reject'}</td></tr>`).join('');
 $('test-warning').textContent=[f.warn?'Some expected counts are below 5; the χ² approximation may be unreliable.':'',f.z===null?'A zero cell makes the ordinary logistic coefficient/Wald test undefined (separation).':''].filter(Boolean).join(' ');
 for(const [id,n,c] of [['people-a',nA,yA],['people-b',nB,yB]]){const dots=Math.min(n,60),filled=Math.round(c/n*dots);$(id).innerHTML=Array.from({length:dots},(_,i)=>`<span class="person ${i<filled?'sick':''}"></span>`).join('');}
 $('multiplier-title').textContent=`A ${k}× improvement?`;$('multiplier-subtitle').innerHTML=`Posterior density of p<sub>B</sub> − ${k} p<sub>A</sub>`;
 function density(multiplier){
  const [a,b]=brms.summaries,lo=b.quantile(.0005)-multiplier*a.quantile(.9995),hi=b.quantile(.9995)-multiplier*a.quantile(.0005);
  const xs=Array.from({length:321},(_,i)=>lo+(hi-lo)*i/320);
  if(lo<0&&hi>0)xs.push(0);
  return brms.density(multiplier,xs.sort((a,b)=>a-b));
 }
 if(brms.available&&!brms.boundary){
  draw('difference-plot',density(1),'#287e73','brms posterior density of B minus A disease risk; shaded above zero');
  draw('multiplier-plot',density(k),'#a14e6b',`brms posterior density of B minus ${k} times A disease risk; shaded above zero`);
 }else{
  const message=brms.available?'Density plot omitted: disease risk is concentrated near an endpoint. See the posterior summaries above.':'Posterior density unavailable. See the model status above.';
  for(const id of ['difference-plot','multiplier-plot'])$(id).textContent=message;
 }

}
let frame;function schedule(){cancelAnimationFrame(frame);frame=requestAnimationFrame(update);}
let resizeRates=[state.yA/state.nA,state.yB/state.nB];
$('total').addEventListener('input',e=>{const N=Number(e.target.value);state.nA=Math.min(N-1,Math.max(1,Math.round(N*.75)));state.nB=N-state.nA;state.yA=Math.round(resizeRates[0]*state.nA);state.yB=Math.round(resizeRates[1]*state.nB);schedule();});
for(const key of ['nA','nB','yA','yB'])$(key).addEventListener('change',e=>{let v=Number(e.target.value);if(!Number.isFinite(v)||e.target.value===''){update();return;}v=Math.round(v);if(key[0]==='n'){const other=key==='nA'?'nB':'nA';state[key]=Math.min(1000-state[other],Math.max(1,v));state['y'+key[1]]=Math.min(state['y'+key[1]],state[key]);}else state[key]=Math.min(state['n'+key[1]],Math.max(0,v));resizeRates=[state.yA/state.nA,state.yB/state.nB];schedule();});
$('k').addEventListener('input',e=>{state.k=Number(e.target.value);schedule();});
$('reset').addEventListener('click',()=>{Object.assign(state,{nA:30,yA:1,nB:10,yB:3,k:5});resizeRates=[1/30,3/10];update();});
update();
