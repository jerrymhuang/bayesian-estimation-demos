# Independent reference calculations using R's distribution functions.
library(jsonlite)
cases <- list(c(10,10,10,7,.5,10),c(.5,.5,0,0,.5,50),c(.5,.5,1000,0,.01,50),c(1,1,1000,1000,.99,50),c(100,.5,1000,300,.3,1),c(2,8,10,7,0,20),c(8,2,0,0,1,10))
results <- lapply(cases,function(v){
 a=v[1];b=v[2];n=v[3];y=v[4];t=v[5];m=v[6];ap=a+y;bp=b+n-y
 list(input=v,interval=qbeta(c(.025,.975),ap,bp),above=pbeta(t,ap,bp,lower.tail=FALSE),density=dbeta(c(.001,.1,.5,.9,.999),a,b),likelihood=dbinom(y,n,c(0,.1,.5,.9,1)),predictive=exp(lchoose(m,0:m)+lbeta(ap+0:m,bp+m-0:m)-lbeta(ap,bp)))
})
cat(toJSON(results,auto_unbox=TRUE,digits=15))
