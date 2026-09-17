(function(root){
'use strict';
const B=typeof module!=='undefined'?require('../../shared/beta.js'):root.BetaMath;
const logBeta=(a,b)=>B.logGamma(a)+B.logGamma(b)-B.logGamma(a+b);
function likelihood(theta,n,y){
 if(theta===0)return y===0?1:0;
 if(theta===1)return y===n?1:0;
 return Math.exp(B.logGamma(n+1)-B.logGamma(y+1)-B.logGamma(n-y+1)+y*Math.log(theta)+(n-y)*Math.log1p(-theta));
}
function predictive(m,a,b){
 return Array.from({length:m+1},(_,k)=>Math.exp(B.logGamma(m+1)-B.logGamma(k+1)-B.logGamma(m-k+1)+logBeta(a+k,b+m-k)-logBeta(a,b)));
}
function summarize(a,b,n,y,threshold,m){
 const prior=B.beta(a,b),posterior=B.beta(a+y,b+n-y);
 const describe=p=>({mean:p.a/(p.a+p.b),sd:Math.sqrt(p.a*p.b/((p.a+p.b)**2*(p.a+p.b+1))),low:B.quantile(.025,p),high:B.quantile(.975,p)});
 // Use symmetry to avoid cancellation when the upper tail is very small.
 return {prior,posterior,priorSummary:describe(prior),postSummary:describe(posterior),above:B.cdf(1-threshold,B.beta(posterior.b,posterior.a)),predictive:predictive(m,posterior.a,posterior.b)};
}
const api={...B,likelihood,predictive,summarize};if(typeof module!=='undefined')module.exports=api;root.BetaBuds=api;
})(globalThis);
