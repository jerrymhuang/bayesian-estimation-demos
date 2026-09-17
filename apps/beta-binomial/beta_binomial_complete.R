prior = function(theta, alpha=2.0, beta=1.0) {
  # Beta prior pdf evaluated at theta (vectorized)
  dbeta(theta, shape1 = alpha, shape2 = beta)
}

likelihood = function(y, theta, N=10) {
  # Binomial likelihood pmf p(y | theta; N), vectorized over theta
  dbinom(y, size = N, prob = theta)
}

posterior = function(theta, y, prior_alpha, prior_beta, N=10){
  # Conjugate Beta posterior pdf evaluated at theta
  # Posterior ~ Beta(prior_alpha + y, prior_beta + N - y)
  dbeta(theta, shape1 = prior_alpha + y, shape2 = prior_beta + (N - y))
}

# My prior hyperparameters
alpha = 10
beta  = 10

## Plot analytic posterior vs. prior

# Prepare Turing Test Data
N   = 10
obs = c(1, 1, 0, 1, 1, 0, 0, 1, 1, 1)
y   = sum(obs)

# Create a vector of thetas to evaluate density on
theta = seq(from = 0, to = 1, by = 1/1000)

# Compute prior and posterior density 
prior_density = prior(theta, alpha = alpha, beta = beta)
post_density  = posterior(theta, y = y, prior_alpha = alpha, prior_beta = beta, N = N)

# Visualize prior vs. posterior
plot(theta, post_density, lwd = 2, col = 'maroon',
     ylab = 'Density', xlab = 'Parameter (theta)', type = "l")
lines(theta, prior_density, col = 'blue', lwd = 2, lty = 2)
legend(0.0, 4, legend = c("Posterior", "Prior"),
       col = c("maroon", "blue"), lty = c(1, 2), lwd = 2, cex = 0.8)
