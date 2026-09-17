# Independent adaptive quadrature reference for the browser's brms model.
# Uses unbounded logit axes, not the browser's transformed uniform grids.
library(jsonlite)
softplus <- function(x) pmax(x, 0) + log1p(exp(-abs(x)))
reference <- function(nA,yA,nB,yB,k) {
  w <- nB/(nA+nB)
  peak <- function(n,y) if(y>0 && y<n) y*log(y/n)+(n-y)*log1p(-y/n) else 0
  kernel <- function(a,b) exp(-yA*softplus(-a)-(nA-yA)*softplus(a)-peak(nA,yA)-yB*softplus(-b)-(nB-yB)*softplus(b)-peak(nB,yB)) * dt(((1-w)*a+w*b)/2.5,df=3)/2.5
  integral <- function(kind) {
    outer <- Vectorize(function(a) {
      lower <- -Inf
      if(kind %in% c('one','times')) {
        mult <- if(kind=='one') 1 else k
        if(mult>1 && a>=-log(mult-1)) return(0)
        lower <- if(mult==1) a else log(mult)+a-log1p(-(mult-1)*exp(a))
      }
      f <- function(b) kernel(a,b) * if(kind=='meanA') plogis(a) else if(kind=='meanB') plogis(b) else 1
      int <- function(lo,hi) integrate(f,lo,hi,rel.tol=1e-8,abs.tol=1e-12,subdivisions=1000)$value
      # Subtract the left tail for negative thresholds: an enormous negative
      # lower bound otherwise makes adaptive integration miss the likelihood peak.
      if(lower < 0) int(-Inf,0)+int(0,Inf)-if(is.finite(lower)) int(-Inf,lower) else 0 else int(lower,Inf)
    })
    integrate(outer,-Inf,Inf,rel.tol=1e-7,abs.tol=1e-9,subdivisions=1000)$value
  }
  z <- integral('norm')
  c(one=integral('one')/z,times=integral('times')/z,meanA=integral('meanA')/z,meanB=integral('meanB')/z)
}
cases <- list(c(30,1,10,3,5),c(10,3,30,1,5),c(30,0,10,3,5),c(40,20,40,20,2))
cat(toJSON(lapply(cases,function(v) list(input=v,expected=do.call(reference,as.list(v)))),auto_unbox=TRUE,digits=15))
