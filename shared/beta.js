/* Shared beta-distribution numerics. No runtime dependencies. */
(function(root){
'use strict';
function logGamma(z) {
  const c=[676.5203681218851,-1259.1392167224028,771.32342877765313,-176.6150291621406,12.507343278686905,-.13857109526572012,9.984369578019572e-6,1.5056327351493116e-7];
  if(z<.5)return Math.log(Math.PI)-Math.log(Math.sin(Math.PI*z))-logGamma(1-z);
  z--;let x=.99999999999980993;for(let i=0;i<c.length;i++)x+=c[i]/(z+i+1);
  const t=z+7.5;return .9189385332046727+(z+.5)*Math.log(t)-t+Math.log(x);
}
function beta(a,b){return {a,b,logNorm:logGamma(a+b)-logGamma(a)-logGamma(b)};}
function pdf(x,p){if(x<0||x>1)return 0;if(x===0)return p.a<1?Infinity:p.a===1?p.b:0;if(x===1)return p.b<1?Infinity:p.b===1?p.a:0;return Math.exp(p.logNorm+(p.a-1)*Math.log(x)+(p.b-1)*Math.log1p(-x));}
function fraction(a,b,x){
 let c=1,d=1-(a+b)*x/(a+1);if(Math.abs(d)<1e-300)d=1e-300;d=1/d;let h=d;
 for(let m=1;m<=300;m++) {const m2=2*m;let aa=m*(b-m)*x/((a+m2-1)*(a+m2));d=1+aa*d;if(Math.abs(d)<1e-300)d=1e-300;c=1+aa/c;if(Math.abs(c)<1e-300)c=1e-300;d=1/d;h*=d*c;aa=-(a+m)*(a+b+m)*x/((a+m2)*(a+m2+1));d=1+aa*d;if(Math.abs(d)<1e-300)d=1e-300;c=1+aa/c;if(Math.abs(c)<1e-300)c=1e-300;d=1/d;const delta=d*c;h*=delta;if(Math.abs(delta-1)<3e-14)break;}
 return h;
}
function cdf(x,p){if(x<=0)return 0;if(x>=1)return 1;const bt=Math.exp(p.logNorm+p.a*Math.log(x)+p.b*Math.log1p(-x));return x<(p.a+1)/(p.a+p.b+2)?bt*fraction(p.a,p.b,x)/p.a:1-bt*fraction(p.b,p.a,1-x)/p.b;}
function quantile(q,p){let lo=0,hi=1;for(let i=0;i<48;i++){const m=(lo+hi)/2;if(cdf(m,p)<q)lo=m;else hi=m;}return (lo+hi)/2;}
function integrate(f,lo,hi,n=4096){if(hi<=lo)return 0;const h=(hi-lo)/n;let sum=f(lo)+f(hi);for(let i=1;i<n;i++)sum+=(i%2?4:2)*f(lo+i*h);return sum*h/3;}
const api={logGamma,beta,pdf,cdf,quantile,integrate};
if(typeof module!=="undefined")module.exports=api;root.BetaMath=api;
})(globalThis);
