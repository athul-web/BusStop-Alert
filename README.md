# 🚌 BusStop Alert - Smart Transit Stop Alarm

A production-quality, mobile-first web application designed to help bus commuters, students, tourists, and daily transit passengers never miss their destination stop.

The app tracks the passenger's phone GPS location in real time, displays route progress on an interactive transit map, calculates remaining distance and ETA, and sounds a multi-sensory alarm (Web Audio synthesizer chime, native speech announcement, vibration, and system notifications) before arrival.

---

## 🌟 Key Features

1. **Route & Stop Selection**:
   - Search across bus routes by number, name, origin, or destination.
   - Sequential stop browser with distance from start and estimated travel times.
   - Quick one-tap re-ride for recent journeys.

2. **Mobile-First Real-Time GPS Tracking**:
   - Tracks phone position via `navigator.geolocation.watchPosition` with high accuracy.
   - Built-in GPS noise filter and Exponential Moving Average (EMA) coordinate smoothing to eliminate GPS jitter.
   - Visual indicator of GPS signal quality (High Lock, Moderate, Poor).

3. **Multi-Sensory Destination Alert**:
   - Configurable alert distance radius: **500 m, 300 m, 200 m, 100 m**.
   - **Synthesized Melodic Chime**: Built directly with the browser's Web Audio API (no external MP3 downloads or broken audio assets).
   - **Speech Synthesis Voice**: Announces `"Approaching [Stop Name]. Please prepare to get down."`
   - **Mobile Haptics**: Vibration API pulses on supported mobile devices.
   - **Browser Notifications**: Desktop and mobile background notifications.
   - **Latching Single-Trigger Logic**: Will **never** spam alarms on every GPS update.

4. **Screen Wake Lock API**:
   - Includes a `"Keep Screen Awake"` toggle using `navigator.wakeLock` to prevent mobile screens from sleeping while riding.

5. **Bus Ride Simulator (Demo Mode)**:
   - Test the entire journey tracking, real-time distance countdown, and 300m destination alert indoors or on a desktop/laptop without physically boarding a bus!
   - Features: "Play Ride", "Pause", "Jump Near (250m)", and "Restart".

6. **Interactive Transit Map**:
   - Powered by Leaflet & OpenStreetMap (works 100% out of the box with zero mandatory paid API keys).
   - Route polyline, numbered stop badges, pulsing user location beacon, and destination alert radius circle.
   - "Center on Me" and "Route Overview" map controls.

7. **Database Architecture & Fallback Bridge**:
   - Full Supabase integration for routes, stops, journeys, and favourites.
   - Embedded realistic transit dataset so the app functions out of the box even before remote database credentials are configured.

---

## 📂 Project Structure

```
BusAlert/
├── public/
│   └── icons/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── routes/
│   │   │   │   ├── route.ts            # GET /api/routes?query=...
│   │   │   │   └── [id]/route.ts       # GET /api/routes/[id] (stops & polyline)
│   │   │   ├── stops/route.ts          # GET /api/stops?query=...
│   │   │   └── journeys/route.ts       # POST /api/journeys
│   │   ├── journey/
│   │   │   └── page.tsx                # Active GPS tracking screen with alerts
│   │   ├── routes/
│   │   │   ├── page.tsx                # Browse & search all bus routes
│   │   │   └── [id]/page.tsx           # Route details & stop selector
│   │   ├── layout.tsx                  # Mobile responsive shell & navigation
│   │   ├── page.tsx                    # Home screen (search, recent, hero CTA)
│   │   └── globals.css                 # Transit theme, Leaflet dark map styles
│   ├── components/
│   │   ├── alerts/
│   │   │   └── DestinationAlertModal.tsx # Prominent destination alert modal
│   │   ├── common/
│   │   │   ├── Header.tsx              # Minimalist mobile transit header
│   │   │   ├── BottomNav.tsx           # Fixed mobile bottom navigation
│   │   │   └── WakeLockToggle.tsx      # Screen wake lock toggle
│   │   ├── journey/
│   │   │   ├── JourneyControls.tsx     # Threshold picker, mute, cancel journey
│   │   │   ├── JourneyProgress.tsx     # Large typography distance & ETA card
│   │   │   └── SimulatorControl.tsx    # Interactive bus ride simulator
│   │   ├── map/
│   │   │   ├── BusMap.tsx              # Client dynamic loader for Leaflet
│   │   │   └── LeafletMapCore.tsx      # Leaflet map, polyline, pulse markers
│   │   └── routes/
│   │       ├── RouteCard.tsx           # Transit route preview card
│   │       └── StopSelector.tsx        # Sequential stop list & destination picker
│   ├── lib/
│   │   ├── data/
│   │   │   └── mockTransitData.ts      # Pre-seeded realistic routes & stop coordinates
│   │   ├── geo/
│   │   │   ├── distance.ts             # Haversine distance, bearings, ETA
│   │   │   └── gpsFilter.ts            # Exponential smoothing & noise filter
│   │   ├── sound/
│   │   │   └── alertChime.ts           # Web Audio API chime & Speech synthesis
│   │   ├── supabase/
│   │   │   ├── client.ts               # Browser Supabase client
│   │   │   └── server.ts               # Server Supabase client
│   │   └── hooks/
│   │       ├── useGeolocation.ts       # Robust geolocation hook
│   │       └── useWakeLock.ts          # Screen wake lock hook
│   └── types/
│       └── transit.ts                  # TypeScript interfaces
├── supabase/
│   ├── schema.sql                      # Supabase schema with RLS and indexes
│   └── seed.sql                        # Sample SQL seed data
├── .env.example                        # Template environment variables
├── package.json
└── tailwind.config.ts
```

---

## 🚀 How to Run Locally

### Prerequisites
- Node.js 18+ or 20+
- npm

### Steps:
1. Clone or open the repository folder:
   ```bash
   cd BusAlert
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the development server:
   ```bash
   npm run dev
   ```
4. Open [http://localhost:3000](http://localhost:3000) on your browser or phone (via local network IP).

---

## 🗄️ Database Design & Supabase Connection

The database schema is organized into 5 relational tables:

1. `bus_routes`: Transit lines, route numbers, route names, colors, origin, destination, operating hours, and GeoJSON polyline.
2. `bus_stops`: Physical bus stops with names, unique codes, GPS latitude/longitude, and landmarks.
3. `route_stops`: Ordered junction table linking routes to their sequence of stops with `distance_from_start_km` and `avg_time_mins`.
4. `journeys`: Log of passenger journeys with starting coordinates, target stop, alert distance threshold, and completion status.
5. `favourite_routes`: Bookmarked routes for commuters.

### Connecting Supabase:
1. Create a free project at [supabase.com](https://supabase.com).
2. Go to the **SQL Editor** in your Supabase dashboard.
3. Paste and run `supabase/schema.sql` to create the tables, indexes, and Row-Level Security policies.
4. Paste and run `supabase/seed.sql` to populate sample routes and stops.
5. In your project settings, copy your **Project URL**, **Anon Key**, and **Service Role Key**.
6. Create a `.env.local` file in the root directory:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi...
   ```
7. Restart your development server (`npm run dev`). The app will immediately begin querying your Supabase instance.

---

## 🚢 How to Deploy to Vercel

1. Push this repository to GitHub or GitLab.
2. Log in to [Vercel](https://vercel.com) and click **"Add New Project"**.
3. Import your repository.
4. Under **Environment Variables**, add:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
5. Click **Deploy**. Vercel will build the production bundle and deploy your site globally.

---

## 📱 Mobile Browser Technical Limitations & How They Are Handled

1. **Background GPS Throttling**:
   - *Limitation*: Mobile operating systems (iOS Safari and Android Chrome) aggressively sleep background tabs and throttle GPS polling when the phone screen is locked or another app is opened.
   - *Mitigation*:
     - **Screen Wake Lock API**: We provide a 1-tap "Keep Screen On" toggle that prevents the phone from going to sleep while on the bus.
     - **Web Notifications API**: System notifications are dispatched so alerts surface even if the tab is momentarily in the background.
     - **High Accuracy Mode**: Requested with `maximumAge: 1000` to prevent stale cached positions.

2. **GPS Accuracy Fluctuations in Moving Vehicles**:
   - *Limitation*: Bus metal chassis can cause temporary GPS signal loss or 150m+ error margins.
   - *Mitigation*: Our `gpsFilter.ts` discards readings with accuracy circles > 120m and applies Exponential Moving Average (EMA) smoothing to eliminate erratic jumps.

3. **Audio Autoplay Restrictions**:
   - *Limitation*: Browsers block unprompted audio until user interaction.
   - *Mitigation*: The passenger selects a route and presses "Start Journey" (or touches the screen), creating the necessary user gesture to unlock the Web Audio API context and speech synthesis.
