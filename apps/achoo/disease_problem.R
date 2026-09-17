library(brms)
library(tidyverse)


# Represent data
data = data.frame(
  Group=rep(c('A', 'B'), c(30, 10)), 
  Disease=c(rep(c(0, 1), c(29, 1)), rep( c(0, 1), c(7, 3)))
) %>%
  mutate(Group=factor(Group))

data_as_matrix = matrix(c(29, 1, 7, 3), nrow = 2, byrow = T)


# Frequentist explorations

## Chi-Square (uncorrected)
results_sim_p = chisq.test(data_as_matrix, simulate.p.value = T, B = 100000)
print(results_sim_p)


## Chi-Square (corrected)
results_corrected_p = chisq.test(data_as_matrix, correct = T)
print(results_corrected_p)


## Frequentist logistic Regression
fit = glm(formula = Disease ~ Group, family='binomial', data=data)
summary(fit)

# Extract coefficients of the logistic reg
beta0 = coefficients(fit)[1]
beta1 = coefficients(fit)[2]

# Compute rate estimates
rate_est_A = 1 / (1 + exp(-beta0))
rate_est_B = 1 / (1 + exp(-beta0 - beta1))
paste('Contraction rate group A:', round(rate_est_A, 3))
paste('Contraction rate group B:', round(rate_est_B, 3))


# The Bayesian way (via Bayesian logistic regression)
fit_b = brm(
  formula = Disease ~ Group, 
  family='bernoulli', 
  data=data, 
  warmup = 1000, 
  iter = 5000, 
  cores = 4, 
  chains = 4
)

plot(fit_b)
summary(fit_b)


# Compute posterior rate estimates
posterior_draws = as.data.frame(fit_b)
beta0 = posterior_draws$b_Intercept
beta1 = posterior_draws$b_GroupB
rate_est_A_post = 1 / (1 + exp(-beta0))
rate_est_B_post = 1 / (1 + exp(-beta0 - beta1))
paste('Contraction rate group A:', round(mean(rate_est_A_post), 3))
paste('Contraction rate group B:', round(mean(rate_est_B_post), 3))


# Hypothesis 1 - is the contraction rate in control larger than in experimental group 
ggplot(data = data.frame(x = rate_est_B_post - rate_est_A_post)) + 
  geom_density(aes(x=x), fill='maroon', color='black', alpha=0.5) + 
  geom_vline(xintercept = 0.0, linetype='dashed', lwd=1) + 
  scale_x_continuous(expand = c(0, 0)) +
  scale_y_continuous(expand = c(0, 0)) +
  labs(x='Rate Difference (B-A)', y='Posterior density') + 
  theme_bw()

fml_hyp = "1 / (1 + exp(-Intercept - GroupB)) > 1 / (1 + exp(-Intercept))"
hypothesis(fit_b, fml_hyp)


# Hypothesis 2 - is the contraction rate in control 5 times larger than in experimental group
ggplot(data = data.frame(x = rate_est_B_post - 5*rate_est_A_post)) + 
  geom_density(aes(x=x), fill='maroon', color='black', alpha=0.5) + 
  geom_vline(xintercept = 0.0, linetype='dashed', lwd=1) + 
  scale_x_continuous(expand = c(0, 0)) +
  scale_y_continuous(expand = c(0, 0)) +
  labs(x='Rate difference (B-A)', y='Posterior density') + 
  theme_bw()


fml_hyp2 = "1 / (1 + exp(-Intercept - GroupB)) > 5 * (1 / (1 + exp(-Intercept)))"
hypothesis(fit_b, fml_hyp2)

