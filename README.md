# PlantCare AI — AI-Powered Plant Disease Detection

An intelligent, accessible web application designed to help farmers, agronomists, and home gardeners identify plant diseases early by simply uploading a photograph of an affected plant or leaf.

---

## 🌟 Key Features

- **Instant AI Diagnosis**: Upload or capture plant photos to identify plant species, affected tissue, disease pathogen, severity, and confidence.
- **Actionable Treatment Plans**: Prioritizes cultural controls, organic methods, and sanitation tips before chemical interventions.
- **Multilingual Support**: Real-time toggle between **English** and **Malayalam (മലയാളം)** for regional accessibility.
- **Farmer Dashboard & Historical Analytics**: Track diagnostic history over time, view disease and crop breakdown charts, and search/filter historical reports.
- **Export & Print**: One-click printable reports and PDF exports with standardized layout for field use.
- **Strict Architecture Compliance**:
  - **Frontend**: 100% Vanilla HTML5, modern CSS3 (responsive flex/grid, CSS custom properties, glassmorphism), and Vanilla JavaScript (ES6+). Zero build tools or heavy JS frameworks.
  - **Backend**: FastAPI with SQLite database, thread-safe session management, secure bcrypt password hashing, and Google Gemini multimodal AI integration.

---

## 🏗️ Project Architecture

```
plantcare-ai/
├── backend/
│   ├── app/
│   │   ├── routes/
│   │   │   ├── analysis.py      # Image upload, validation & AI analysis
│   │   │   ├── auth.py          # User registration, login, JWT cookies
│   │   │   └── reports.py       # CRUD reports and dashboard statistics
│   │   ├── services/
│   │   │   └── gemini_service.py # Gemini 2.5 Flash multimodal vision & structured schema
│   │   ├── config.py            # Environment configuration & path settings
│   │   ├── database.py          # SQLite connection and table initialization
│   │   ├── schemas.py           # Pydantic models for request/response validation
│   │   └── main.py              # FastAPI app initialization, CORS & router mounting
│   ├── .env                     # Environment variables (GEMINI_API_KEY, SECRET_KEY, etc.)
│   ├── .env.example             # Template for environment configuration
│   └── requirements.txt         # Python dependencies
│
└── frontend/
    ├── css/
    │   ├── style.css            # Design tokens, components, cards, charts, typography
    │   └── responsive.css       # Mobile-first adaptive media queries
    ├── js/
    │   ├── api.js               # Centralized fetch client for backend communication
    │   ├── main.js              # Navbar, toast notifications, auth state, i18n
    │   ├── upload.js            # Drag & drop, camera capture, file validation
    │   ├── analysis.js          # Form submission & loading overlay
    │   ├── results.js           # Diagnosis display, confidence meter & print handling
    │   ├── auth.js              # Login and registration validation
    │   └── dashboard.js         # Stats cards, distribution charts, search & filter
    ├── index.html               # Landing page with hero, features, workflow, supported crops
    ├── detect.html              # Plant photo upload, camera capture, crop selection
    ├── results.html             # Detailed diagnostic assessment & recommendations
    ├── dashboard.html           # Historical reports, trends & visual analytics
    ├── login.html               # Sign in and account registration
    └── about.html               # Mission, AI workings, photo guide, FAQ & disclaimer
```

---

## 🚀 Quickstart Guide

### Option A: One-Command Start (Recommended)

From the project root directory, simply run:
```bash
./start.sh
```
This automatically manages ports, activates the backend venv, starts FastAPI on `http://localhost:8000`, and serves the frontend on `http://localhost:8080`. Press `Ctrl+C` at any time to shut down both servers cleanly.

---

### Option B: Run in Separate Terminals

#### 1. Backend (Terminal 1)
```bash
cd backend
source venv/bin/activate
uvicorn app.main:app --reload --port 8000
```
- Backend API: `http://localhost:8000`
- Interactive Swagger Docs: `http://localhost:8000/docs`

#### 2. Frontend (Terminal 2)
In a second terminal window or tab:
```bash
cd frontend
python3 -m http.server 8080
```
- Web Application: `http://localhost:8080`


---

## 🧪 Testing the Application

1. **Homepage (`http://localhost:8080/index.html`)**: Review the features, supported crops, and click **"Analyze Your Plant"**.
2. **Detection Page (`http://localhost:8080/detect.html`)**:
   - Drag & drop a plant photo or click **"Use Camera"**.
   - Select crop type (e.g., Tomato, Banana, Rice, etc.).
   - Switch language between **English** and **മലയാളം**.
   - Click **"Analyze Plant"**.
3. **Results Page (`http://localhost:8080/results.html`)**:
   - Review the identified disease, confidence rating, observed symptoms, recommended actions, and prevention tips.
   - Click **"Print / PDF"** to generate a printable diagnostic sheet.
   - Click **"Save Report"** to store in your account.
4. **Account & Dashboard (`http://localhost:8080/dashboard.html`)**:
   - Register a free user account via `login.html`.
   - View visual distribution charts of analyzed crops and diseases.
   - Filter and search past diagnostic reports.

---

## 🛡️ Agricultural Advisory & Disclaimer

PlantCare AI provides preliminary visual assessments powered by computer vision and artificial intelligence. Results are assistive decision-support indications and do not replace laboratory testing or in-person evaluation by a certified agronomist or local agricultural extension officer. Always verify local pesticide safety guidelines and manufacturer recommendations before applying chemical treatments.
