/* brms 2.22.0 default Bernoulli-logit model for Disease ~ Group.
 * Integrate over etaA, etaB; centered intercept = (1-w)*etaA + w*etaB.
 * The constant Jacobian from (Intercept, GroupB) to (etaA, etaB) is one.
 * The flat slope prior contributes no factor; the t(3,0,2.5) kernel is
 * (1 + intercept^2 / 18.75)^-2. No MCMC or finite logit cutoff is used.
 */
(function(root){
'use strict';
const logistic=x=>x>=0?1/(1+Math.exp(-x)):Math.exp(x)/(1+Math.exp(x));
const logit=p=>Math.log(p)-Math.log1p(-p);
const softplus=x=>Math.max(x,0)+Math.log1p(Math.exp(-Math.abs(x)));
function axis(n,y,size){
 const center=logit((y+.5)/(n+1)),scale=y>0&&y<n?Math.sqrt(1/y+1/(n-y)):4;
 const peak=y>0&&y<n?y*Math.log(y/n)+(n-y)*Math.log1p(-y/n):0;
 const logLikelihood=eta=>-y*softplus(-eta)-(n-y)*softplus(eta)-peak;
 const rows=Array.from({length:size+1},(_,i)=>{
  if(i===0||i===size)return {eta:i===0?-Infinity:Infinity,p:i===0?0:1,jac:0,lik:0};
  const t=Math.PI*(i/size-.5),eta=center+scale*Math.tan(t);
  return {eta,p:logistic(eta),jac:scale*Math.PI/Math.cos(t)**2,lik:Math.exp(logLikelihood(eta))};
 });
 return {rows,center,scale,logLikelihood,toU:eta=>.5+Math.atan((eta-center)/scale)/Math.PI};
}
function fit(nA,yA,nB,yB,size=512){
 if((yA===0&&yB===nB)||(yA===nA&&yB===0))return {available:false,reason:'The flat treatment-coefficient prior gives an improper posterior for completely separated groups (all cases in one group, none in the other). Posterior probabilities are undefined. MacKay’s proper priors still give a valid posterior.'};
 const A=axis(nA,yA,size),B=axis(nB,yB,size),w=nB/(nA+nB),h=1/size;
 const prior=(a,b)=>1/(1+((1-w)*a+w*b)**2/18.75)**2;
 const marginalA=new Float64Array(size+1),marginalB=new Float64Array(size+1),tails=[];
 let norm=0;
 for(let i=1;i<size;i++){
  const a=A.rows[i],row=new Float64Array(size+1),tail=new Float64Array(size+1);
  for(let j=1;j<size;j++){
   const b=B.rows[j];row[j]=a.lik*a.jac*b.lik*b.jac*prior(a.eta,b.eta);
   marginalB[j]+=row[j]*h;
  }
  for(let j=size-1;j>=0;j--)tail[j]=tail[j+1]+h*(row[j]+row[j+1])/2;
  marginalA[i]=tail[0];norm+=tail[0]*h;tails[i]={row,tail};
 }
 if(!Number.isFinite(norm)||norm<=0)return {available:false,reason:'Numerical integration could not resolve this posterior.'};
 function summary(ax,marginal){
  let mean=0;const cdf=new Float64Array(size+1);
  for(let i=1;i<=size;i++){cdf[i]=cdf[i-1]+h*(marginal[i-1]+marginal[i])/(2*norm);mean+=ax.rows[i].p*marginal[i]*h/norm;}
  function quantile(q){let i=1;while(i<size&&cdf[i]<q)i++;const frac=(q-cdf[i-1])/(cdf[i]-cdf[i-1]||1);const u=(i-1+frac)*h;return logistic(ax.center+ax.scale*Math.tan(Math.PI*(u-.5)));}
  return {mean,low:quantile(.025),high:quantile(.975),quantile};
 }
 const summaries=[summary(A,marginalA),summary(B,marginalB)];
 function probability(k){
  let sum=0;
  for(let i=1;i<size;i++){
   const eta=A.rows[i].eta;
   if(k>1&&eta>=-Math.log(k-1))continue;
   const cutoffEta=k===1?eta:Math.log(k)+eta-Math.log1p(-(k-1)*Math.exp(eta));
   const u=B.toU(cutoffEta);
   const pos=Math.max(0,Math.min(size,u*size)),j=Math.min(size-1,Math.floor(pos)),f=pos-j;
   const {row,tail}=tails[i];
   // Integrate the linearly interpolated density over the partial grid cell.
   sum+=h*(tail[j]-h*(row[j]*f+(row[j+1]-row[j])*f*f/2));
  }
  return Math.max(0,Math.min(1,sum/norm));
 }
 function density(k,xs){
  return xs.map(x=>{
   let sum=0;
   for(let i=1;i<size;i++){
    const a=A.rows[i],b=x+k*a.p;if(b<=0||b>=1)continue;
    const etaB=logit(b);
    sum+=a.lik*a.jac*Math.exp(B.logLikelihood(etaB))*prior(a.eta,etaB)/(b*(1-b));
   }
   return [x,sum*h/norm];
  });
 }
 return {available:true,summaries,probability,density,size,norm};
}
const api={fit};if(typeof module!=='undefined')module.exports=api;root.AchooBrms=api;
})(globalThis);
