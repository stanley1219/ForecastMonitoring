# UK Wind Power Forecast Monitor

A full-stack web application for monitoring UK national wind power forecast accuracy. Compares actual generation data against forecasted values using the [Elexon BMRS API](https://bmrs.elexon.co.uk/api-documentation), with configurable forecast horizons and a suite of accuracy analytics.

**Live app:** https://forecast-monitoring-kappa.vercel.app/

**GitHub:** https://github.com/stanley1219/ForecastMonitoring

> **AI tooling disclosure:** This project was implemented using Claude (Anthropic) and Cursor for code generation and analysis execution. The author was responsible for defining the problem, structuring the analytical approach, directing the methodology, and shaping the final outputs. AI tools were used to carry out the implementation and computations under this guidance.

---

## Features

### Core
- Actual vs forecasted wind generation chart for any date range from January 2025
- Configurable forecast horizon (1–48 hours) via slider
- Horizon filter logic: for each target time T, finds the latest forecast published before T minus horizonHours
- X-axis shows timestamps with date labels only when the date changes
- Y-axis labelled "Power (MW)", X-axis labelled "Target End Time (UTC)"

### Controls
- Quick-select buttons: Today, Yesterday, Last 7 days, Last 30 days
- Live mode: sets a rolling 24-hour window and auto-refreshes every 15 minutes
- Manual date pickers with validation
- Fully responsive — single row on desktop, stacked on mobile

### Analytics
- **Forecast accuracy panel:** MAE, Mean Error (Bias), P99 Absolute Error — always visible
- **Advanced metrics (expandable):** RMSE, Median Absolute Error, MAE as % of mean actual, Mean % Error, Std of Error
- **Generation summary:** Peak generation, Total energy (MWh via trapezoidal integration), Capacity factor vs 28 GW UK installed capacity

### Comparison mode
- Compare two forecast horizons side-by-side on the same chart
- Three lines: Actual (green), Horizon A (blue), Horizon B (orange)
- Independent sliders for each horizon

### Export
- CSV download of chart data (actual + forecast columns)
- PNG export of the chart area

### UX
- Skeleton loaders while data is fetching
- Actionable error states with retry button
- Random wind energy quote on every page load
- Fully mobile responsive with dark theme

### Backend
- In-memory LRU cache: 5-minute TTL for today's data, 60-minute TTL for historical data
- Request validation with clear 400 error messages
- 10-second timeout on all Elexon API calls with structured error responses
- Cache-Control headers on all responses

---

## Repository structure

```
ForecastMonitoringApp/
├── frontend/                          # Next.js 14 app
│   ├── app/
│   │   ├── page.tsx                   # Main page — state, fetch, render
│   │   ├── layout.tsx                 # Root layout
│   │   └── globals.css
│   ├── components/
│   │   ├── GenerationChart.tsx        # Recharts line chart
│   │   ├── Controls.tsx               # Date pickers, horizon sliders, quick-select
│   │   ├── AccuracyPanel.tsx          # MAE, bias, P99 + advanced metrics
│   │   ├── SummaryStatsPanel.tsx      # Peak, MWh, capacity factor
│   │   └── ExportBar.tsx              # CSV and PNG export buttons
│   ├── lib/
│   │   ├── api.ts                     # fetchGeneration()
│   │   └── metrics.ts                 # computeMetrics(), computeSummaryStats()
│   └── types/
│       └── generation.ts              # TypeScript interfaces
│
├── backend/                           # Fastify API server
│   └── src/
│       ├── index.ts                   # Server entry point
│       ├── routes/
│       │   └── generation.ts          # /api/actuals, /api/forecasts, /api/generation
│       ├── services/
│       │   └── elexonService.ts       # Elexon API calls with caching and timeouts
│       ├── utils/
│       │   ├── cache.ts               # LRU cache instance and helpers
│       │   ├── filterForecasts.ts     # Horizon filter logic
│       │   └── filterForecasts.test.ts
│       └── types/
│           └── elexon.ts
│
├── notebooks/
│   ├── Forecast_Error_Analysis.ipynb  # Forecast error characteristics analysis
│   └── Wind_Reliability_Analysis.ipynb # Wind reliability and capacity recommendation
│
└── README.md
```

---

## Tech stack

**Frontend**
- Next.js 14 (App Router)
- TypeScript (strict)
- Tailwind CSS
- Recharts
- react-datepicker
- html2canvas (PNG export)

**Backend**
- Node.js ≥ 20
- Fastify v5
- TypeScript (NodeNext module resolution)
- lru-cache
- tsx (runtime)

**Deployment**
- Frontend → Vercel (auto-deploy on push to main)
- Backend → Railway (auto-deploy on push to main)

---

## API reference

Base URL (production): `https://forecastmonitoring-production.up.railway.app`

| Endpoint | Params | Description |
|---|---|---|
| `GET /health` | — | Health check |
| `GET /api/actuals` | `from`, `to` (YYYY-MM-DD) | Raw actual wind generation |
| `GET /api/forecasts` | `from`, `to` (ISO) | Raw forecast data |
| `GET /api/generation` | `from`, `to` (YYYY-MM-DD), `horizonHours` (1–48) | Merged actuals + horizon-filtered forecasts |

---

## Running locally

**Prerequisites:** Node.js ≥ 20, npm, Python 3.x

**Backend**
```bash
cd backend
npm install
npx tsx src/index.ts
# Runs on http://localhost:3001
```

**Frontend**
```bash
cd frontend
npm install
# Create .env.local with:
# NEXT_PUBLIC_API_URL=http://localhost:3001
npm run dev
# Runs on http://localhost:3000
```

**Notebooks**
```bash
source venv/bin/activate
pip install jupyter pandas numpy matplotlib seaborn requests python-dateutil
jupyter notebook
# Open notebooks/ directory
```

**Kill port 3001 if needed**
```bash
lsof -ti:3001 | xargs kill -9
```

---

## Deployment

| Service | Platform | Trigger |
|---|---|---|
| Frontend | Vercel | Auto-deploy on push to `main` (root dir: `frontend`) |
| Backend | Railway | Auto-deploy on push to `main` (root dir: `backend`) |

Environment variables:
- Vercel: `NEXT_PUBLIC_API_URL=https://forecastmonitoring-production.up.railway.app`
- Railway: `PORT` set automatically

---

## Data sources

- **Actuals:** [FUELHH stream](https://data.elexon.co.uk/bmrs/api/v1/datasets/FUELHH/stream) — 30-minute settlement period wind generation, filtered to `fuelType === "WIND"`
- **Forecasts:** [WINDFOR stream](https://data.elexon.co.uk/bmrs/api/v1/datasets/WINDFOR/stream) — wind generation forecasts with publish timestamps, January 2025 onwards, 0–48h horizon

Note: Elexon actuals have approximately a 1–2 hour publishing lag, so today's data will be sparse near the current time.

---

## Author

**stanley1219** — https://github.com/stanley1219
