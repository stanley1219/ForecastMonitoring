# Wind Power Forecast & Reliability Analysis

**Data:** Elexon BMRS API — January 2025 to March 2026
**Dataset:** 21,223 actual records, 168,818 forecast records
**Horizon analysed:** 4 hours (primary), 1–48 hours (comparison)

---

## Part 1: Forecast Error Analysis

### How good is the model?

The model demonstrates reasonable baseline stability, with most predictions staying within a predictable range of error. On average, it captures the general trend of the data, which indicates that it has learned the underlying patterns to some extent. However, the presence of a consistent positive bias (~+1,290 MW) suggests that the model systematically overestimates generation rather than making purely random mistakes. This reduces its reliability in real-world scenarios, as the errors are not centered around zero. Additionally, while median errors may appear acceptable, the P99 error reveals occasional but significant deviations, indicating that the model is not robust under extreme or volatile conditions. Overall, the model is usable for broad directional insights but not yet dependable for precise operational decision-making.

---

### Where exactly does it fail and why?

The model's weaknesses are structured rather than random, which makes them both identifiable and correctable.

**Systematic Bias:** The consistent overestimation indicates a calibration issue. This could stem from imbalanced training data, improper loss optimization, or missing corrective mechanisms that align predictions with actual distributions.

**Forecast Horizon Degradation:** Errors increase as the forecast horizon extends. This suggests that the model struggles with error propagation, where small initial inaccuracies compound over time. It also indicates limited ability to capture long-term dependencies or evolving external factors.

**Time-of-Day Variability:** The model performs unevenly across different times of the day, likely due to unmodeled cyclical patterns or insufficient representation of temporal features such as demand cycles and environmental changes.

**Extreme Errors (Tail Risk):** The high P99 error highlights that the model is particularly unreliable during edge cases or high-variance scenarios. This suggests that rare events are either underrepresented in training data or not properly learned by the model.

In essence, the model is failing not because it lacks learning capability, but because it lacks calibration, temporal awareness, and robustness to variability.

---

### What should be done next?

**Bias Correction / Calibration:** Introduce a post-processing calibration layer or adjust the loss function to penalize systematic overestimation, bringing predictions closer to actual values.

**Horizon-Specific Modeling:** Consider training separate models or using multi-head architectures for different forecast horizons to reduce compounded error effects.

**Enhanced Temporal Features:** Incorporate richer time-based signals such as hour-of-day, seasonality, and lag features to better capture cyclical behaviour.

**Handling Extreme Cases:** Improve robustness by including more diverse training samples or using techniques like quantile regression or probabilistic forecasting, which better account for uncertainty and tail risks.

**Model Monitoring & Retraining:** Establish continuous evaluation pipelines to track drift and periodically recalibrate the model as new data becomes available.

**Final takeaway:** The model has a solid foundational understanding of the data but is currently miscalibrated and inconsistent under stress. With focused improvements in calibration, temporal modelling, and robustness, it has strong potential to evolve into a reliable forecasting system.

---

## Part 2: Wind Reliability Analysis

### What We Found

The BMRS wind power forecast, which grid operators rely on for 4-hour-ahead planning, is fundamentally broken in its current form. It systematically overestimates wind generation by an average of 1,290 MW. This isn't occasional error — it's persistent bias that occurs across every month, every season, and every generation level. The model's errors are also sticky: once it starts over-predicting, it continues doing so for hours or even days, with one error streak lasting 231 consecutive hours. Most damning, the forecast actually performs worse than the naive approach of simply assuming wind will stay at its current level. The model beats this persistence baseline only 20% of the time, meaning grid operators would literally be better off ignoring the forecast entirely and just looking at current output.

The reliability analysis tells a different but equally important story. Despite averaging 8,400 MW of generation and having roughly 30,000 MW of installed capacity, UK wind can only be counted on to deliver about 1,850 MW with 95% confidence. This firm capacity represents just 6% of installed capacity and 22% of average output. Low wind events are frequent and can be prolonged: generation fell below 2,000 MW on 77 separate occasions over 15 months, with the longest drought lasting 61 hours across three days in August 2025. These aren't rare tail events — they're a regular feature of wind generation that must be planned for.

---

### Recommendations

For the forecast system, the immediate priority should be bias correction. Subtracting 1,290 MW from every forecast would instantly improve accuracy, and generation-dependent scaling could address the tendency to over-predict more severely during high wind periods. Blending the model with persistence — giving significant weight to current actual generation — would also help, since persistence alone outperforms the model. Longer term, the forecast system needs regime-aware adjustments that recognize when weather conditions are likely to cause sustained errors, and it should trigger alerts when error streaks exceed a threshold.

For grid planning, operators should treat 1,800 to 1,900 MW as the firm capacity contribution from wind, not the 8,400 MW average that looks attractive on paper. Backup generation or storage must be available to cover roughly 500 hours per year when wind drops below this level, including events lasting 2–3 days. Wind's primary value should be understood as energy contribution — displacing fuel costs and emissions — rather than capacity contribution. It excels at the former and struggles at the latter.

---

### The Bigger Picture

Wind power in the UK isn't unreliable in the way critics suggest. It's statistically predictable and does exactly what physics dictates: generate power when the wind blows and not when it doesn't. The problem isn't wind itself but how we plan around it. Treating wind as firm capacity sets up inevitable disappointment. Treating it as valuable but variable energy — while maintaining adequate backup for calm periods — allows wind to play its proper role in decarbonizing the grid.

The forecast system's failures are fixable with straightforward statistical corrections. The reliability constraints are not fixable — they're inherent to wind as a resource. But they're also manageable, provided planners budget honestly for variability rather than hoping it away. UK wind is delivering roughly 8 GW of clean energy on average, which is a remarkable achievement. The task now is ensuring the surrounding systems — forecasts, backup generation, storage, and market structures — are designed to complement wind's strengths rather than expose its weaknesses.

---

*Full analysis with charts and code: see `notebooks/Forecast_Error_Analysis.ipynb` and `notebooks/Wind_Reliability_Analysis.ipynb`*
