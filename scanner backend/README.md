# H2S Strip Reader — trained model + dataset

## Files

- **h2s_strip_model.json** — the trained model. A small neural network
  (2 inputs → 12 → 6 → 1) that predicts exposure-time-equivalent from two
  features measured off a strip photo. Standardize inputs with
  `(x - featureMean) / featureStd`, apply ReLU after layers 1 and 2, and
  leave layer 3's output linear. Output is `log10(seconds)`; take `10^output`
  to get seconds. Validation RMSE (in log10-seconds) is included in the file
  — about ±0.62, i.e. predictions are typically within a factor of ~4x.

- **synthetic_training_dataset.csv** — the 4,500 synthetic samples used to
  train it. Columns: `orange_area_fraction`, `deltaE_from_background`
  (both computed the same way the live app computes them from a photo),
  `log10_seconds` (the training target), `seconds` (same value, unlogged).

- **generate_synthetic_dataset.py** — regenerates the dataset. Starts from
  16 real color measurements taken off the published reference image
  (`work/ref.png` — not included here, ask if you need it), fits a smooth
  ground-truth growth curve through them, then renders thousands of
  synthetic strip images at random points along that curve with randomized
  spot position/size, paper-batch tint, camera brightness/contrast/white
  balance, and sensor noise. Needs numpy only.

- **train_model.py** — trains the model on the CSV above using
  scikit-learn's `MLPRegressor`, and exports it to the JSON format described
  above. Needs numpy + scikit-learn.

## Known limitations (worth keeping in mind)

- All training data is synthetic, generated from a single published
  reference curve (fixed H2S concentration, varying exposure time) — not
  real photos of real badges, and not a validated ppm dose curve.
- The ~4x typical error reflects that limitation plus realistic photo
  noise — it should get meaningfully tighter once real labeled photos
  are swapped in for the synthetic ones.
- Retraining is quick (a few seconds) if you want to try different
  architectures, feature sets, or noise assumptions in
  `generate_synthetic_dataset.py`.
