# Bayesian estimation demos

Interactive teaching apps with their original R examples. Each demo lives in its own folder; shared reading material lives in `references/`.

## Open the demos

Open [index.html](index.html) in a browser to choose a demo. The apps work offline, without installation or a build step.

For local HTTP serving, run this from the project root:

```sh
python3 -m http.server 8000
```

Then visit http://localhost:8000.

| Demo | Status | Files |
| --- | --- | --- |
| **Achoo!** — disease problem, frequentist tests, and Bayesian logistic regression | Ready | [Open app](apps/achoo/index.html) · [Notes](apps/achoo/README.md) · [R source](apps/achoo/disease_problem.R) |
| **Beta Buds** — beta-binomial updating and prediction | Ready | [Open app](apps/beta-binomial/index.html) · [Notes](apps/beta-binomial/README.md) · [R source](apps/beta-binomial/beta_binomial_complete.R) |

## Folder layout

```text
index.html                      Demo launcher
README.md                       Project overview
apps/
  achoo/
    index.html                  Achoo! browser entry point
    style.css                   App styles
    app.js                      Controls and plots
    stats.js                    Frequentist calculations
    brms.js                     brms posterior integration
    disease_problem.R           Original teaching example
    README.md                   Model details and app instructions
    tests/                      Numerical and UI checks; R references
  beta-binomial/
    index.html                  Beta Buds browser entry point
    style.css                   App styles
    app.js                      Controls and plots
    stats.js                    Likelihood and predictive calculations
    beta_binomial_complete.R    Original teaching example
    README.md                   Model details and app instructions
    tests/                      Numerical and UI checks; R references
shared/
  beta.js                       Beta-distribution numerics for both apps
  vendor/katex/                 Offline LaTeX rendering and fonts
references/
  book.pdf                      MacKay textbook
```

Keep each app’s assets, source example, tests, and documentation together. Add a link to the root launcher when a new app is ready. The beta-distribution routines in `shared/beta.js` are used by both apps.

## Run the checks

With Node and R (`Rscript`) installed, run from the project root:

```sh
node apps/achoo/tests/check.js
node apps/beta-binomial/tests/check.js
```

See [Achoo!’s notes](apps/achoo/README.md) for statistical assumptions, validation details, and instructions for regenerating its R reference values.

The Beta Buds checks run with Node alone and use checked-in R reference values. See [Beta Buds’ notes](apps/beta-binomial/README.md) for details.

Beta Buds includes a [step-by-step conjugacy derivation](apps/beta-binomial/derivation.html) with offline LaTeX rendering.
