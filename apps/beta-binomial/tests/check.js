const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const S=require('../stats.js');
const close=(a,b,t=1e-8)=>assert.ok(Math.abs(a-b)<t,`${a} != ${b}`);
for(const {input,interval,above,density,likelihood,predictive} of require('./reference.json')){
 const [a,b,n,y,t,m]=input,r=S.summarize(a,b,n,y,t,m);
 close(r.postSummary.low,interval[0]);close(r.postSummary.high,interval[1]);close(r.above,above);
 [.001,.1,.5,.9,.999].forEach((x,i)=>close(S.pdf(x,r.prior),density[i],1e-7));
 [0,.1,.5,.9,1].forEach((x,i)=>close(S.likelihood(x,n,y),likelihood[i]));
 r.predictive.forEach((p,i)=>close(p,predictive[i]));close(r.predictive.reduce((a,b)=>a+b,0),1);
 close(r.predictive.reduce((sum,p,k)=>sum+p*k,0),m*r.postSummary.mean);
}
assert.equal(S.pdf(0,S.beta(.5,.5)),Infinity);assert.equal(S.pdf(1,S.beta(.5,.5)),Infinity);
close(S.summarize(10,10,10,7,.5,10).postSummary.mean,17/30);
// Exercise controls and rendered chart coordinates using the actual app code.
const elements={};for(const m of fs.readFileSync(require.resolve('../index.html'),'utf8').matchAll(/id="([^"]+)"/g))elements[m[1]]={value:'',textContent:'',innerHTML:'',handlers:{},addEventListener(e,f){this.handlers[e]=f;}};
let queued;const context={BetaBuds:S,document:{getElementById:id=>{assert.ok(elements[id],id);return elements[id];}},requestAnimationFrame:f=>{queued=f;return 1;},cancelAnimationFrame:()=>{queued=null;}};
vm.createContext(context);vm.runInContext(fs.readFileSync(require.resolve('../app.js'),'utf8'),context);
function event(id,type,value=''){elements[id].value=value;elements[id].handlers[type]({target:elements[id]});if(queued){const f=queued;queued=null;f();}}
function charts(){for(const id of ['density-plot','likelihood-plot','predictive-plot']){assert.ok(elements[id].innerHTML.includes('<svg'));assert.ok(!/NaN|Infinity/.test(elements[id].innerHTML),id);}}
assert.equal(elements['posterior-formula'].textContent,'Beta(17, 13)');assert.equal(elements['posterior-mean'].textContent,'56.7%');charts();
event('clear','click');assert.equal(+elements.n.value,0);assert.equal(+elements.y.value,0);assert.equal(elements['posterior-mean'].textContent,'50.0%');assert.equal(elements.successes.disabled,true);charts();
event('preset','change','jeffreys');assert.ok(elements['density-note'].textContent.includes('Infinite'));charts();
event('add-success','click');assert.equal(+elements.n.value,1);assert.equal(+elements.y.value,1);assert.equal(elements['posterior-mean'].textContent,'75.0%');
event('add-failure','click');assert.equal(+elements.n.value,2);assert.equal(elements['posterior-mean'].textContent,'50.0%');
event('n','change','5000');assert.equal(+elements.n.value,1000);assert.equal(elements['add-success'].disabled,true);
event('y','change','5000');assert.equal(+elements.y.value,1000);charts();
event('n','change','-1');assert.equal(+elements.n.value,0);assert.equal(+elements.y.value,0);
event('alpha','change','0');assert.equal(+elements.alpha.value,.5);
event('beta','change','999');assert.equal(+elements.beta.value,100);
event('alpha','change','');assert.equal(+elements.alpha.value,.5);
event('threshold','input','0');assert.equal(elements['above-probability'].textContent,'100%');
event('threshold','input','1');assert.equal(elements['above-probability'].textContent,'0%');charts();
event('future','input','50');assert.equal((elements['predictive-table'].innerHTML.match(/<tr>/g)||[]).length,51);
event('reset','click');assert.equal(elements.preset.value,'script');assert.equal(elements['posterior-formula'].textContent,'Beta(17, 13)');charts();
console.log('PASS: R reference comparisons, predictive normalization, controls, bounds, no-data updates, and finite chart coordinates.');
