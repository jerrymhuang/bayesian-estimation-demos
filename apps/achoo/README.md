# Achoo!

An offline browser demo of the disease problem inspired by MacKay §37.1. All Bayesian results use the **brms logistic-regression model** from `disease_problem.R`. There is no prior-model selector or alternative Bayesian model.

Open [index.html](index.html), or select Achoo! from the [project launcher](../../index.html). No installation or server is required. To serve the whole project locally, run `python3 -m http.server 8000` from the project root.

## Controls and results

Edit group sizes and disease counts, up to 1,000 participants total, and the risk multiplier from 1 to 20. The total slider uses a 3:1 allocation and preserves rates from the most recent manual edit/reset, subject to integer rounding. Reset restores A: 1/30 and B: 3/10.

The app shows frequentist tests, posterior probabilities P(pB > pA | data) and P(pB > k pA | data), posterior risk means with 95% equal-tailed credible intervals, and density plots of pB − pA and pB − k pA. The positive region is shaded in each plot. “k times better” means the disease-risk ratio pB/pA exceeds k.

For the original trial, the brms posterior gives approximately:

- P(pB > pA): **98.6570%**.
- P(pB > 5 pA): **70.1329%**.
- Mean disease risk A: **4.3502%**; B: **31.0169%**.

## Bayesian model

Priors were verified with `get_prior()` and `make_stancode()` for `Disease ~ Group`, Bernoulli-logit, in installed brms 2.22.0:

- Centered intercept: Student-t(df = 3, location = 0, scale = 2.5).
- GroupB coefficient: improper flat prior on the real line.

Let ηA = logit(pA), ηB = logit(pB), and w = nB/(nA+nB). The centered intercept is (1−w)ηA + wηB, and GroupB = ηB−ηA. The prior kernel in these logit coordinates is `(1 + ((1-w)*etaA + w*etaB)^2 / 18.75)^-2`, with constant coordinate-transformation Jacobian one. Changing the allocation changes how this prior acts on the risks. See the [brms prior documentation](https://paulbuerkner.com/brms/reference/set_prior.html).

The browser uses deterministic numerical integration of the posterior targeted by the R script, not MCMC or exported draws. `brms.js` integrates unbounded logit axes using a tangent transformation, with 512 intervals per axis for interior counts. Boundary counts use 1,024 intervals and compare the normalizer against 512; relative disagreement above 0.2% withholds results. This is a convergence check, not a formal error bound.

Completely separated groups (all cases in one, none in the other) give an improper posterior with these priors. Such results are explicitly unavailable. Very diffuse, unresolved posteriors are also withheld. Boundary density plots are omitted even when summaries are resolved because endpoint concentration is difficult to display reliably. There is no fallback model. Returning to supported counts restores the plots and summaries.

Density plots show the central posterior range; extreme tails can lie outside the axes. Probabilities integrate the full domain.

## Frequentist calculations

The conditional Pearson test enumerates the fixed-margin reference distribution estimated by the script’s `chisq.test(..., simulate.p.value = TRUE)`. This is not the asymptotic uncorrected χ² test or Fisher’s probability-ordered exact test. The original data give p ≈ 0.04169; Yates correction gives p ≈ 0.06789. Logistic regression uses the two-sided Wald test for GroupB. Tests use α = 0.05; undefined tests and small expected counts are labeled.

## Files and checks

- `app.js`: controls, summaries, and SVG plots.
- `brms.js`: Bayesian posterior integration.
- `stats.js`: frequentist tests, using log-gamma from `../../shared/beta.js`.
- `index.html` and `style.css`: page content and layout.
- `disease_problem.R`: unchanged original R example.
- `tests/`: R references and regression checks.

From the project root, run `node apps/achoo/tests/check.js` with Node and R installed. Tests check independent R posterior references, frequentist results, density normalization and shaded probability, input controls, reset, and improper/unresolved posterior states.

Regenerate the brms fixture from this folder with `Rscript tests/brms-reference.R > tests/brms-reference.json` (requires `jsonlite`). Shared reading: [MacKay’s book](../../references/book.pdf).
