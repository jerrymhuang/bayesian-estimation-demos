const assert = require('node:assert/strict');
const {execFileSync} = require('node:child_process');
const fs = require('node:fs');
const vm = require('node:vm');
const S = require('../stats.js');
const Brms = require('../brms.js');
const close=(a,b,t=1e-6)=>assert.ok(Math.abs(a-b)<t,`${a} != ${b}`);
// Compare numerical integration, intervals, and tests against independent R routines.
const cases=[[30,1,10,3,5],[500,0,500,0,5],[750,750,250,250,20],[750,1,250,249,20],[1,0,999,500,1],[450,135,550,160,3],[1,1,1,0,1]];
const rows=execFileSync('Rscript',['-e',`
options(digits=17)
for(v in list(${cases.map(v=>'c('+v.join(',')+')').join(',')})) {
 nA=v[1];yA=v[2];nB=v[3];yB=v[4];k=v[5]
 d=matrix(c(yA,nA-yA,yB,nB-yB),2,byrow=T)
 chi=suppressWarnings(chisq.test(d,correct=T))$p.value
 z=if(all(d>0)) {fit=glm(cbind(c(yA,yB),c(nA-yA,nB-yB))~c(0,1),family=binomial());coef(summary(fit))[2,4]} else NA
 cat(chi,z,"\\n")
}`],{encoding:'utf8'}).trim().split('\n').map(x=>x.trim().split(/\s+/).map(Number));
cases.forEach(([nA,yA,nB,yB],i)=>{const f=S.frequentist(nA,yA,nB,yB),[chi,z]=rows[i];if(Number.isFinite(chi))close(f.correctedP,chi);if(Number.isFinite(z))close(f.logisticP,z);});
close(S.frequentist(30,1,10,3).exact, .0416894627420943,1e-12);
// Exercise the actual DOM event handlers, including validation and resizing.
const elements={};for(const match of fs.readFileSync(require.resolve('../index.html'),'utf8').matchAll(/id="([^"]+)"/g))elements[match[1]]={value:'',innerHTML:'',textContent:'',handlers:{},addEventListener(name,fn){this.handlers[name]=fn;}};
let queued;const context={AchooStats:S,AchooBrms:Brms,document:{getElementById:id=>{assert.ok(elements[id],id);return elements[id];}},requestAnimationFrame:fn=>{queued=fn;return 1;},cancelAnimationFrame(){}};
vm.createContext(context);vm.runInContext(fs.readFileSync(require.resolve('../app.js'),'utf8'),context);
function event(id,type,value){elements[id].value=value;elements[id].handlers[type]({target:elements[id]});if(queued){queued();queued=null;}}
assert.equal(elements['answer-better'].textContent,'98.7%');
event('total','input','1000');assert.equal(+elements.nA.value+ +elements.nB.value,1000);assert.equal(+elements.yA.value,25);
event('total','input','40');assert.equal(+elements.yA.value,1);assert.equal(+elements.yB.value,3);
event('yA','change','9999');assert.equal(+elements.yA.value,30);
event('nB','change','9999');assert.equal(+elements.nB.value,970);
event('nA','change','-4');assert.equal(+elements.nA.value,1);assert.equal(+elements.yA.value,1);
event('reset','click','');event('k','input','1');assert.equal(elements['answer-times'].textContent,elements['answer-better'].textContent);
event('yA','change','0');event('yB','change','0');assert.equal(elements['answer-test'].textContent,'Test undefined');assert.ok(elements.tests.innerHTML.includes('Not defined'));
assert.ok(!elements['difference-plot'].innerHTML.includes('NaN'));
// Reference values come from independent adaptive integration in R.
for(const {input,expected} of require('./brms-reference.json')){
 const [nA,yA,nB,yB,k]=input,b=Brms.fit(nA,yA,nB,yB);
 const actual=[b.probability(1),b.probability(k),b.summaries[0].mean,b.summaries[1].mean];
 actual.forEach((v,i)=>close(v,expected[i],3e-5));
}
assert.equal(Brms.fit(30,0,10,10).available,false);
assert.equal(Brms.fit(30,30,10,0).available,false);
close(Brms.fit(500,500,500,500).probability(1),.5,1e-10);
// The density integrates to the same probability as the conditional integral.
const fitted=Brms.fit(30,1,10,3);
for(const k of [1,5]){
 const points=fitted.density(k,Array.from({length:6001},(_,i)=>-k+(k+1)*i/6000));
 let area=0,positive=0;
 for(let i=1;i<points.length;i++){const mass=(points[i][0]-points[i-1][0])*(points[i][1]+points[i-1][1])/2;area+=mass;if(points[i-1][0]>=0)positive+=mass;}
 close(area,1,1e-4);close(positive,fitted.probability(k),1e-4);
}
event('reset','click','');
assert.equal(elements['answer-times'].textContent,'70.1%');
assert.equal(elements.model,undefined);assert.equal(elements['prior-comparison'],undefined);
assert.ok(elements['difference-plot'].innerHTML.includes('<svg'));
assert.ok(!elements['difference-plot'].innerHTML.includes('stroke-dasharray="7 4"'));
assert.ok(elements.counts.innerHTML.includes('4.4%'));assert.ok(elements.counts.innerHTML.includes('31.0%'));
event('yA','change','0');assert.notEqual(elements['answer-times'].textContent,'Unavailable');assert.ok(elements['difference-plot'].textContent.includes('omitted'));
event('yB','change','10');assert.equal(elements['answer-times'].textContent,'Unavailable');assert.ok(elements['brms-note'].textContent.includes('improper posterior'));assert.ok(elements['difference-plot'].textContent.includes('unavailable'));
event('reset','click','');assert.equal(elements['answer-times'].textContent,'70.1%');assert.equal(elements['brms-note'].textContent,'');
event('nA','change','1');event('yA','change','0');event('nB','change','999');event('yB','change','500');assert.equal(elements['answer-times'].textContent,'Unavailable');assert.ok(elements['brms-note'].textContent.includes('too diffuse'));
console.log('PASS: R reference comparisons, brms-only summaries and plots, input controls, and unavailable posterior states.');
