# SpeedCap

SpeedCap finds the mobile network that works best where you are. It ranks MTN, Airtel, Glo and 9mobile using
speed tests that people run and share from their phones, scored by download speed, response time, upload and
stability.

It starts with sample readings for 15 Port Harcourt areas, clearly labelled in the app, and real shared tests
replace them over time.

## Features

- **Best network near me**: use your GPS location or pick an area, and see every network ranked with a score out of 100, a breakdown of the score, and a map of the search area.
- **Speed test**: measures response time, jitter, download and upload against the SpeedCap server, then lets you share the result for your location.
- **Areas**: every Port Harcourt neighbourhood with its best network and how the others compare.
- **Privacy first**: no accounts, no IP addresses stored, and shared locations rounded to about 100 m.

## How the score works

| What's measured          | Counts for | Full marks at    |
| ------------------------ | ---------- | ---------------- |
| Download speed           | 40%        | 50 Mbps or more  |
| Response time (latency)  | 25%        | 20 ms or less    |
| Upload speed             | 20%        | 20 Mbps or more  |
| Stability (jitter)       | 15%        | 5 ms or less     |

A reading counts half as much after 30 days. SpeedCap first looks within 2 km and widens the search to 4, 8 and
then 15 km if there aren't enough readings. The logic is in `backend/src/scoring.js`.

## Project structure

```text
speedcap/
├── backend/                 Node.js API, no npm dependencies
│   ├── src/
│   │   ├── server.js        HTTP routes
│   │   ├── db.js            SQLite storage (built into Node 22) and sample data
│   │   ├── scoring.js       Score calculation
│   │   ├── geo.js           Distances and place names (OpenStreetMap)
│   │   └── networks.js      Networks and Port Harcourt areas
│   ├── test/                Unit tests (npm test)
│   └── Dockerfile
├── frontend/                React + Vite web app
│   └── src/
│       ├── pages/           Home, Results, SpeedTest, Areas, About
│       ├── components/      Gauge, Rankings, MapView, LocationPicker
│       ├── speedtest.js     Speed-test measurements
│       └── api.js           API calls
├── render.yaml              One-click backend deploy on Render
└── .github/workflows/       GitHub Pages deploy and backend tests
```

## Run it locally

You need Node.js 22.13 or newer.

```bash
# 1. Start the API (http://localhost:8080)
cd backend
npm start

# 2. In a second terminal, start the web app (http://localhost:5173)
cd frontend
cp .env.example .env
npm install
npm run dev
```

Run the backend tests with `npm test` inside `backend`.

## Deploy

The web app goes on GitHub Pages and the API goes on Render, both free.

### 1. Deploy the API on Render

1. Sign in at [render.com](https://render.com) with GitHub.
2. Click **New**, then **Blueprint**, and choose this repository. Render reads `render.yaml`.
3. When it's live, copy the address, for example `https://speedcap-api.onrender.com`.
4. Open `https://<your-api>/api/health` to check it says `"ok": true`.

On Render's free plan the API sleeps after 15 minutes without visitors, so the first visit after that takes
about a minute. Shared results are also cleared when the service restarts. To keep them, use a paid plan with
a disk (see the comments in `render.yaml`) or run the Docker image anywhere with a volume mounted at `/data`.

### 2. Deploy the web app on GitHub Pages

1. In this repo on GitHub, go to **Settings > Secrets and variables > Actions > Variables** and add a variable named `VITE_API_URL` with your Render address.
2. Go to **Settings > Pages** and set **Source** to **GitHub Actions**.
3. Go to **Actions**, open **Deploy frontend to GitHub Pages**, and click **Run workflow**. After that it redeploys on every push to `main`.
4. Your site will be at `https://<your-username>.github.io/speedcap/`.

Once the site is live, set `ALLOWED_ORIGINS` on Render to your Pages address (for example
`https://ihejirika.github.io`) so only your site can call the API.

## API

| Method | Path                        | What it does                                         |
| ------ | --------------------------- | ---------------------------------------------------- |
| GET    | `/api/recommend?lat=&lng=`  | Networks ranked for a location                       |
| GET    | `/api/areas`                | Rankings for every Port Harcourt area                |
| GET    | `/api/stats`                | Totals per network and the latest shared results     |
| GET    | `/api/networks`             | Networks and scoring weights                         |
| GET    | `/api/geocode?lat=&lng=`    | Place name for a location                            |
| POST   | `/api/readings`             | Share a speed-test result                            |
| GET    | `/api/ping`                 | Used to measure response time                        |
| GET    | `/api/speedtest/download`   | Sends random data to measure download speed          |
| POST   | `/api/speedtest/upload`     | Receives data to measure upload speed                |
| GET    | `/api/health`               | Health check                                         |

Example body for `POST /api/readings`:

```json
{ "network": "mtn", "lat": 4.86, "lng": 7.02, "download": 22.4, "upload": 6.1, "latency": 48, "jitter": 7 }
```

### Settings (environment variables)

| Name               | Default                | Meaning                                         |
| ------------------ | ---------------------- | ----------------------------------------------- |
| `PORT`             | `8080`                 | Port the API listens on                         |
| `DATABASE_PATH`    | `./data/speedcap.db`   | Where the SQLite file is stored                 |
| `ALLOWED_ORIGINS`  | `*`                    | Comma-separated sites allowed to call the API   |
| `SEED_SAMPLE_DATA` | `true`                 | Add Port Harcourt sample readings on first run  |

## Notes

- Area coordinates are approximate.
- Speed results depend on the distance to the server, so host the API close to your users (Render's Frankfurt region is the nearest free option to Nigeria).
- SpeedCap isn't affiliated with any mobile network.
