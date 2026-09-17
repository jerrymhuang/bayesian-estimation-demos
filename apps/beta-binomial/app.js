'use strict';
const $=id=>document.getElementById(id),S=BetaBuds;
const initial={alpha:10,beta:10,n:10,y:7,threshold:.5,future:10};
const state={...initial};
const pct=x=>(100*x).toFixed(1)+'%',fmt=x=>Number(x.toFixed(1)).toString();
const probability=x=>x===0?'0%':x===1?'100%':x<.0005?'< 0.1%':x>.9995?'> 99.9%':pct(x);
function chartFrame(W,H,maxY,yLabel,xLabel){
 const L=46,R=14,T=22,B=40,x=v=>L+v*(W-L-R),y=v=>H-B-v/maxY*(H-T-B);
 let svg=`<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${xLabel}: ${yLabel}"><title>${xLabel}: ${yLabel}</title>`;
 for(let i=0;i<=4;i++){const v=maxY*i/4;svg+=`<line x1="${L}" x2="${W-R}" y1="${y(v)}" y2="${y(v)}" stroke="#e5e7db"/><text x="${L-7}" y="${y(v)+4}" text-anchor="end">${v<1?v.toFixed(2):v.toFixed(1)}</text>`;}
 svg+=`<text x="${L}" y="12">${yLabel}</text><text x="${(L+W-R)/2}" y="${H-3}" text-anchor="middle">${xLabel}</text>`;
 return {svg,x,y,base:H-B,W,H};
}
function ticks(c){let s='';for(let i=0;i<=4;i++)s+=`<text x="${c.x(i/4)}" y="${c.base+18}" text-anchor="middle">${(i/4).toFixed(2)}</text>`;return s;}
function curve(points,c,max){return points.map(([x,y],i)=>`${i?'L':'M'}${c.x(x).toFixed(2)},${c.y(Math.min(max,y)).toFixed(2)}`).join(' ');}
function densityPlot(result){
 const {prior,posterior}=result;
 const modes=[prior,posterior].filter(p=>p.a>1&&p.b>1).map(p=>(p.a-1)/(p.a+p.b-2));
 const xs=Array.from(new Set([...Array.from({length:1001},(_,i)=>i/1000),state.threshold,...modes])).sort((a,b)=>a-b);
 const priorPoints=xs.map(x=>[x,S.pdf(x,prior)]),postPoints=xs.map(x=>[x,S.pdf(x,posterior)]);
 const singular=prior.a<1||prior.b<1||posterior.a<1||posterior.b<1;
 const max=Math.max(...[[prior,priorPoints],[posterior,postPoints]].flatMap(([p,ps])=>ps.filter(([x,v])=>Number.isFinite(v)&&(p.a>=1||x>=.005)&&(p.b>=1||x<=.995)).map(point=>point[1])))*1.12;
 const narrow=typeof window!=='undefined'&&window.innerWidth<650;
 const c=chartFrame(narrow?420:780,narrow?260:300,max,'Density','Success probability θ');let svg=c.svg;
 const above=postPoints.filter(p=>p[0]>=state.threshold);
 svg+=`<path d="${curve(above,c,max)} L${c.x(1)},${c.base} L${c.x(state.threshold)},${c.base} Z" fill="#b69b64" opacity=".25"/>`;
 svg+=`<path d="${curve(priorPoints,c,max)}" stroke="#6683a0" stroke-dasharray="7 5" stroke-width="2.5" fill="none"/><path d="${curve(postPoints,c,max)}" stroke="#927040" stroke-width="3" fill="none"/>`;
 svg+=`<line x1="${c.x(state.threshold)}" x2="${c.x(state.threshold)}" y1="22" y2="${c.base}" stroke="#626b62" stroke-dasharray="3 4"/>`;
 for(const side of [0,1])if([prior,posterior].some(p=>side===0?p.a<1:p.b<1))svg+=`<text x="${c.x(side)+(side===0?8:-8)}" y="34" text-anchor="${side===0?'start':'end'}">↑ ∞</text>`;
 $('density-plot').innerHTML=svg+ticks(c)+'</svg>';
 $('density-note').textContent=`Shading shows posterior probability above θ = ${state.threshold.toFixed(2)}; the dashed vertical line marks that threshold.${singular?' Infinite endpoint peaks are clipped and marked ↑ ∞; the full distribution is used for all probabilities.':''}`;
}
function likelihoodPlot(){
 const xs=Array.from(new Set([...Array.from({length:601},(_,i)=>i/600),state.n?state.y/state.n:.5])).sort((a,b)=>a-b);
 const points=xs.map(x=>[x,S.likelihood(x,state.n,state.y)]),max=Math.max(...points.map(p=>p[1]))*1.12;
 const c=chartFrame(420,245,max,'P(observed count | θ)','Success probability θ');
 $('likelihood-plot').innerHTML=c.svg+`<path d="${curve(points,c,max)} L${c.x(1)},${c.base} L${c.x(0)},${c.base} Z" fill="#50785e" opacity=".12"/><path d="${curve(points,c,max)}" fill="none" stroke="#50785e" stroke-width="2.5"/>`+ticks(c)+'</svg>';
}
function predictivePlot(probs){
 const m=state.future,max=Math.max(...probs)*1.15,c=chartFrame(420,245,max,'Probability','Number of future successes');let svg=c.svg;
 const width=(c.x(1)-c.x(0))/(m+1);
 probs.forEach((p,k)=>{const xpos=c.x(0)+width*k;svg+=`<rect x="${xpos+width*.12}" y="${c.y(p)}" width="${width*.76}" height="${c.base-c.y(p)}" rx="2" fill="#927040" opacity=".75"><title>${k} successes: ${pct(p)}</title></rect>`;if(m<=10||k%Math.ceil(m/5)===0||k===m)svg+=`<text x="${xpos+width/2}" y="${c.base+18}" text-anchor="middle">${k}</text>`;});
 $('predictive-plot').innerHTML=svg+'</svg>';
 $('predictive-table').innerHTML=probs.map((p,k)=>`<tr><td>${k}</td><td>${probability(p)}</td></tr>`).join('');
}
function update(){
 const {alpha,beta,n,y,threshold,future}=state,r=S.summarize(alpha,beta,n,y,threshold,future),post=r.postSummary;
 for(const key of Object.keys(initial))$(key).value=state[key];$('y').max=n;$('successes').max=n;$('successes').value=y;$('successes').disabled=n===0;
 $('add-success').disabled=$('add-failure').disabled=n>=1000;
 $('threshold-value').textContent=threshold.toFixed(2);$('future-value').textContent=future;
 $('prior-formula').textContent=`Beta(${fmt(alpha)}, ${fmt(beta)})`;$('data-formula').textContent=`${y} successes, ${n-y} failures`;$('posterior-formula').textContent=`Beta(${fmt(alpha+y)}, ${fmt(beta+n-y)})`;
 $('posterior-mean').textContent=pct(post.mean);$('credible-interval').textContent=`${pct(post.low)} – ${pct(post.high)}`;
 $('probability-question').textContent=`P(θ > ${threshold.toFixed(2)} | data)`;$('above-probability').textContent=probability(r.above);
 const weight=(alpha+beta)/(alpha+beta+n);
 $('weight-note').textContent=n?`Posterior mean = ${pct(weight)} × prior mean (${pct(r.priorSummary.mean)}) + ${pct(1-weight)} × observed rate (${pct(y/n)}). Try adding data to see the prior’s weight decrease.`:'No observations yet: posterior = prior. The likelihood is constant at 1, so it supplies no information about θ.';
 const dots=Math.min(60,n),filled=n?Math.round(y/n*dots):0;
 $('observations').innerHTML=Array.from({length:dots},(_,i)=>`<span class="seed ${i<filled?'success':''}"></span>`).join('');
 $('observation-caption').textContent=`${y} successes · ${n-y} failures.${n>60?' Dots summarize proportions.':' Filled dots are successes.'}`;
 $('summary-table').innerHTML=[['Prior',r.prior,r.priorSummary],['Posterior',r.posterior,post]].map(([name,p,d])=>`<tr><td>${name}</td><td>${fmt(p.a)}</td><td>${fmt(p.b)}</td><td>${pct(d.mean)}</td><td>${d.sd.toFixed(3)}</td><td>${pct(d.low)} – ${pct(d.high)}</td></tr>`).join('');
 $('observed-rate').textContent=n?`Data: ${y} / ${n} = ${pct(y/n)} observed successes. These observations update the prior; they are not themselves a distribution for θ.`:'Observed rate is undefined with zero trials.';
 $('predictive-title').textContent=`The next ${future} trial${future===1?'':'s'}`;$('predictive-note').textContent=`Expected successes: ${(future*post.mean).toFixed(2)} out of ${future}. This distribution includes uncertainty about θ as well as variation in future outcomes.`;
 densityPlot(r);likelihoodPlot();predictivePlot(r.predictive);
}
let frame;function schedule(){cancelAnimationFrame(frame);frame=requestAnimationFrame(update);}
for(const key of ['alpha','beta','n','y'])$(key).addEventListener('change',e=>{
 const raw=e.target.value,value=Number(raw);if(raw.trim()===''||!Number.isFinite(value)){update();return;}
 state[key]=key==='alpha'||key==='beta'?Math.max(.5,Math.min(100,Math.round(value*10)/10)):Math.max(0,Math.min(key==='n'?1000:state.n,Math.round(value)));
 if(key==='n')state.y=Math.min(state.y,state.n);if(key==='alpha'||key==='beta')$('preset').value='custom';schedule();
});
for(const key of ['threshold','future'])$(key).addEventListener('input',e=>{state[key]=Number(e.target.value);schedule();});
$('successes').addEventListener('input',e=>{state.y=Number(e.target.value);schedule();});
$('preset').addEventListener('change',e=>{const p={script:[10,10],uniform:[1,1],jeffreys:[.5,.5],optimistic:[8,2],pessimistic:[2,8]}[e.target.value];if(p){[state.alpha,state.beta]=p;schedule();}});
$('add-success').addEventListener('click',()=>{if(state.n<1000){state.n++;state.y++;schedule();}});
$('add-failure').addEventListener('click',()=>{if(state.n<1000){state.n++;schedule();}});
$('clear').addEventListener('click',()=>{state.n=0;state.y=0;schedule();});
$('reset').addEventListener('click',()=>{cancelAnimationFrame(frame);Object.assign(state,initial);$('preset').value='script';update();});
update();

if(typeof window!=='undefined')window.addEventListener('resize',schedule);
