import assert from "node:assert/strict";
import { applyHorizonFilter } from "./filterForecasts.js";
import type { ActualDataPoint, ForecastDataPoint } from "../types/elexon.js";

type TestCase = {
  name: string;
  run: () => void;
};

function runTest(tc: TestCase) {
  try {
    tc.run();
    console.log(`PASS ${tc.name}`);
  } catch (err) {
    console.error(`FAIL ${tc.name}`);
    console.error(err);
  }
}

const tests: TestCase[] = [
  {
    name: "basic: one actual, one forecast within horizon",
    run: () => {
      const actuals: ActualDataPoint[] = [
        { time: "2025-01-01T12:00:00.000Z", generation: 100 }
      ];
      const forecasts: ForecastDataPoint[] = [
        {
          time: "2025-01-01T12:00:00.000Z",
          publishTime: "2025-01-01T10:00:00.000Z",
          generation: 90
        }
      ];

      const out = applyHorizonFilter(actuals, forecasts, 1);
      assert.deepEqual(out, [{ time: actuals[0]!.time, actual: 100, forecast: 90 }]);
    }
  },
  {
    name: "forecast too recent: publishTime > cutoff",
    run: () => {
      const actuals: ActualDataPoint[] = [
        { time: "2025-01-01T12:00:00.000Z", generation: 100 }
      ];
      const forecasts: ForecastDataPoint[] = [
        {
          time: "2025-01-01T12:00:00.000Z",
          publishTime: "2025-01-01T11:30:00.000Z",
          generation: 95
        }
      ];

      const out = applyHorizonFilter(actuals, forecasts, 1);
      assert.deepEqual(out, []);
    }
  },
  {
    name: "multiple forecasts: pick latest valid publishTime",
    run: () => {
      const actuals: ActualDataPoint[] = [
        { time: "2025-01-02T00:00:00.000Z", generation: 200 }
      ];
      const forecasts: ForecastDataPoint[] = [
        {
          time: "2025-01-02T00:00:00.000Z",
          publishTime: "2025-01-01T20:00:00.000Z",
          generation: 150
        },
        {
          time: "2025-01-02T00:00:00.000Z",
          publishTime: "2025-01-01T22:30:00.000Z",
          generation: 175
        },
        {
          time: "2025-01-02T00:00:00.000Z",
          publishTime: "2025-01-01T23:30:00.000Z",
          generation: 190
        }
      ];

      const out = applyHorizonFilter(actuals, forecasts, 1);
      assert.deepEqual(out, [{ time: actuals[0]!.time, actual: 200, forecast: 175 }]);
    }
  }
];

for (const tc of tests) runTest(tc);

