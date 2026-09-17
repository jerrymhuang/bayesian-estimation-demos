# Beta Buds

An interactive beta-binomial teaching demo based on [`beta_binomial_complete.R`](beta_binomial_complete.R). Open [index.html](index.html) directly in a browser, or choose **Beta Buds** from the [project launcher](../../index.html). No installation, network access, or build step is required.

## Explore

- Edit prior shapes α and β from 0.5 to 100, or choose a preset: the R example, uniform, Jeffreys, high-success, or low-success prior.
- Set 0–1,000 trials and the number of successes. Add a success/failure one at a time, or clear observations to see the prior alone.
- Compare the prior and posterior densities. Shading marks posterior probability above an adjustable threshold.
- Inspect the binomial likelihood on its own probability scale, rather than treating it as a density over θ.
- See posterior means, standard deviations, 95% equal-tailed credible intervals, and predictive probabilities for 1–50 future trials.
- Reset to the original example: Beta(10, 10), 7 successes among 10 observations, giving Beta(17, 13).

The script’s original observations are `(1, 1, 0, 1, 1, 0, 0, 1, 1, 1)`. The app models their counts because observation order does not affect this update. The R source is unchanged.

## Model

Independent trials share an unknown success probability θ, with θ ∼ Beta(α, β) and Y | θ ∼ Binomial(n, θ). The posterior is Beta(α + y, β + n − y). With n = 0, the posterior equals the prior, the likelihood is constant at one, and the observed success fraction is undefined.

For the starting example:

- Posterior mean (and next-trial success probability): 17/30 ≈ 56.67%.
- 95% credible interval: approximately [38.94%, 73.55%].
- P(θ > 0.5 | data): approximately 77.09%.

For m future trials, the number of successes has a beta-binomial posterior predictive distribution. This integrates over uncertainty in θ; it is not a binomial distribution with θ fixed to the posterior mean.

The prior concentration α + β determines its weight relative to n in the posterior mean. It is not necessarily a count of real prior observations. Shapes below one yield infinite endpoint densities; the chart clips and labels those peaks. Probability and quantile calculations use the full distributions. Dots summarize observed proportions when there are more than 60 trials.

## Implementation and checks

`stats.js` implements the binomial likelihood and beta-binomial predictive PMF. Both teaching apps use [`../../shared/beta.js`](../../shared/beta.js) for beta PDF/CDF, quantiles, and supporting numerical routines. `app.js` handles controls and accessible SVG plots; `style.css` provides the responsive layout.

Run from the project root:

```sh
node apps/beta-binomial/tests/check.js
```

The tests use checked-in independent R reference values, cover endpoint shapes and 1,000-trial examples, verify predictive normalization/means, and exercise input validation, sequential observations, reset, no-data states, and chart generation through a DOM fixture.

Regenerate reference values with R and `jsonlite` installed:

```sh
Rscript apps/beta-binomial/tests/reference.R > apps/beta-binomial/tests/reference.json
```

Because the beta numerical routines are shared, also run the Achoo! checks after modifying them:

```sh
node apps/achoo/tests/check.js
```

[Back to the project overview](../../README.md)

## Conjugacy derivation

Open [derivation.html](derivation.html) for the Beta prior, binomial likelihood, Bayes update, evidence and normalizer, the Beta(17, 13) worked example, and the posterior predictive connection. The page links back to the interactive demo.

Equations are authored as LaTeX and rendered with local KaTeX 0.15.3 assets in `shared/vendor/katex/` (MIT license included), using HTML plus accessible MathML. It works offline and includes a print layout. Wide equations scroll horizontally on narrow screens. No user-supplied math is rendered.
