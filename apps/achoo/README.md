# Achoo!

An interactive, dependency-free browser demo of the disease problem in MacKay’s *Information Theory, Inference, and Learning Algorithms*, §37.1.

Open this folder’s `index.html` directly in a browser. From the project root, use `apps/achoo/index.html` or choose Achoo! from the root launcher. No installation, server, network connection, or R runtime is needed to use the app. For local HTTP serving, run `python3 -m http.server 8000` in this directory and visit http://localhost:8000.

Adjust the total number of participants (2–1,000), individual group sizes and disease counts, and the risk multiplier (1–20). The total slider uses a 3:1 allocation and preserves the disease rates from the most recent manual edit or reset, subject to integer rounding. Manual group sizes can use any allocation, subject to a combined maximum of 1,000. Reset restores the original A: 1/30 and B: 3/10 trial.

The demo shows:

- A two-sided conditional Pearson test, Yates-corrected χ² test, and logistic regression Wald test.
- P(pB > pA | data) and P(pB > k × pA | data).
- A prior-model selector, a side-by-side posterior comparison table, and overlaid curves (MacKay solid/shaded, brms dashed).
- Observed counts, observed risks, posterior means, and 95% equal-tailed credible intervals under the selected model.
- Posterior density plots of pB − pA and pB − k × pA, with the positive region shaded.

## Model and relationship to the R script

The browser follows the book’s independent uniform Beta(1, 1) priors on disease risks. With y disease cases among n participants, each posterior is Beta(y + 1, n − y + 1). Numerical integration gives deterministic results, including about **98.7431%** for A having lower risk and **58.1360%** for B having more than five times A’s risk in the original trial.

The **brms defaults** option integrates the posterior targeted by `disease_problem.R`, with priors verified using `get_prior()` and `make_stancode()` in installed brms 2.22.0:

- Centered intercept: Student-t(df = 3, location = 0, scale = 2.5).
- Treatment coefficient `GroupB`: improper flat prior on the real line.

Writing ηA = logit(pA), ηB = logit(pB), and w = nB/(nA+nB), the centered intercept is (1−w)ηA + wηB, and GroupB = ηB−ηA. The prior kernel in logit coordinates is `(1 + ((1-w)*etaA + w*etaB)^2 / 18.75)^-2`. The coordinate transformation has constant Jacobian one. This is **not** a Student-t prior on A’s uncentered log-odds. Changing the allocation changes the centered-intercept definition. The [brms documentation](https://paulbuerkner.com/brms/reference/set_prior.html) describes this convention.

For the original trial, independent R integration gives:

| Quantity | MacKay | brms defaults |
| --- | ---: | ---: |
| P(pB > pA) | 98.7431% | 98.6570% |
| P(pB > 5 pA) | 58.1360% | 70.1329% |
| Mean risk A | 6.2500% | 4.3502% |
| Mean risk B | 33.3333% | 31.0169% |

The browser uses deterministic quadrature, not MCMC, and does not claim to reproduce individual draws or MCMC diagnostics. The original R files are unchanged.

The flat slope prior cannot be normalized, so it does not define a normalized joint prior on risks or a prior-predictive distribution. Completely separated groups (all cases in one, none in the other) give an improper posterior with these priors; the app explicitly withholds brms results. Other boundary counts can give proper but very diffuse posteriors.

`brms.js` integrates each logit using `eta = center + scale * tan(pi * (u - 0.5))`, covering the real line without a finite cutoff. The joint posterior includes the transformation Jacobians. Interior counts use 512 intervals per axis. Boundary counts use 1,024 and compare normalization with 512; a relative disagreement above 0.2% withholds results as numerically unresolved. This is a convergence check, not a formal error bound. Tail probabilities interpolate the conditional integrand within grid cells, and marginal CDFs give credible intervals. Boundary brms curves are omitted because their endpoint concentration makes simple density plots unreliable, even when summaries are resolved. MacKay remains available in every supported trial.

The conditional Pearson calculation enumerates the fixed-margin reference distribution that `chisq.test(..., simulate.p.value = TRUE)` estimates by simulation. It is not the asymptotic uncorrected χ² p-value or Fisher’s probability-ordered exact test. With the original data, it gives p ≈ 0.04169; Yates gives p ≈ 0.06789. A p-value is not a posterior probability. The app uses α = 0.05 and labels unidentifiable tests in degenerate tables.

The density curves use numerical convolution and focus on the central posterior range. Extreme tails may lie outside the visible axes; displayed probabilities integrate the full parameter domain. “k times better” specifically means a disease-risk ratio pB/pA > k, not an odds ratio or a difference in recovery probabilities.

## Checks

From this folder, run `node tests/check.js` (or `node apps/achoo/tests/check.js` from the project root) with Node and base R (`Rscript`) installed. Checks compare probabilities, credible intervals, and frequentist results with R reference calculations, cover zero/all-case and very unbalanced trials, and exercise input handlers and SVG generation through a minimal DOM fixture. Additional checks compare brms probabilities and means with independent adaptive R quadrature, check density normalization and shaded probability, exercise model switching, and verify handling of improper or unresolved posteriors. Regenerate the reference fixture with `Rscript tests/brms-reference.R > tests/brms-reference.json` (requires `jsonlite`). These are not automated browser layout tests.

Files: `index.html` (content), `style.css` (responsive styling), `stats.js` (MacKay and frequentist math), `brms.js` (logistic-posterior integration), `app.js` (controls and SVG charts).

The original R source is alongside the app in [`disease_problem.R`](disease_problem.R). The shared book is in [`../../references/book.pdf`](../../references/book.pdf). Return to the [project overview](../../README.md).

Beta PDF/CDF, quantile, and supporting routines are shared with Beta Buds in [`../../shared/beta.js`](../../shared/beta.js). Keep this relative folder layout when copying or serving the app.
