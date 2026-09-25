# SkillGap — AI-Powered Skill Analytics & Talent Verification Engine

SkillGap is a next-generation platform connecting job seekers and employers through real-time AI skill gap diagnostics, adaptive learning paths, non-repetitive skill assessments, cryptographically verifiable credentials, and an intelligent employer hiring suite.

---

## 🚀 Key Features

### 👨‍💻 For Candidates & Job Seekers
- **AI Skill Gap Diagnostic**: Compares your candidate profile against active market job requirements across 31+ multi-industry taxonomies (Technology, HR, Sales, Legal, Healthcare, Education, Accounting, Logistics).
- **Adaptive Learning Paths**: Step-by-step curated learning modules with direct links to verified resources (W3Schools, GeeksForGeeks, Coursera, freeCodeCamp) with automated progression tracking.
- **Non-Repetitive AI Skill Assessments**: Dynamic, non-generic question banks tailored to your target domain and proficiency level.
- **Automatic Skill Test Exemption**: Once you pass a skill assessment and earn a badge, future job applications on SkillGap matching that skill automatically skip redundant testing.
- **Verifiable Micro-Credentials**: Cryptographically hash-anchored credentials with public URL verification (`/verify/:slug`).
- **Real-Time Market Pulse Analytics**: 30-day demand line/bar trend charts with real-time demand indicators.

### 🏢 For Employers & Recruiters
- **AI JD Quality & Requirement Analyzer**: Evaluates job descriptions (0–100 score), detects unrealistic requirements, and generates higher-converting structured JDs.
- **Applicant Rejection Insights**: Uncovers pipeline leakages and pinpoint drop-off causes across evaluation stages.
- **Real-Time Interview Calendar Grid**: 35/42-cell visual monthly calendar grid synced with candidate applications, Google Calendar 1-click sync, and downloadable `.ics` exports.
- **Pre-Verified Talent Search**: Filter and invite candidates by verified skill badges to eliminate test fatigue.
- **Structured Applicant Tracking**: Post jobs with requirement-bound skill proficiencies and review candidate match scores.

---

## 🛠️ Technology Stack

### Frontend
- **Core**: React 19, Vite 8, React Router v7
- **State Management**: Zustand (Auth state, persistent tokens)
- **Data Fetching & Caching**: TanStack React Query v5
- **Styling**: Vanilla CSS (Custom tokens, responsive grid layouts, glassmorphism dark theme)
- **Data Visualization**: Recharts v3
- **Icons & UI Feedback**: Lucide React, React Hot Toast
- **Date Utilities**: `date-fns` v4

### Backend
- **Runtime**: Node.js (ES Modules)
- **Web Framework**: Express v4
- **Database & ORM**: MongoDB, Mongoose v8
- **Authentication**: JWT (JSON Web Tokens), `bcryptjs` password hashing
- **Resume & Document Processing**: `pdf-parse`, `mammoth` (DOCX parsing)
- **Integrations & Utilities**: Adzuna Job Search API, `nanoid` (cryptographic hash generation), `cors`, `dotenv`

---

## 📂 Project Structure

```
Nexyra/
├── backend/
│   ├── src/
│   │   ├── config/          # Database configuration
│   │   ├── middleware/      # Auth & role verification middleware
│   │   ├── models/          # Mongoose schemas (User, LearnerProfile, JobEmployer, etc.)
│   │   ├── routes/          # Express route handlers (/auth, /profile, /jobs, /skills, /paths, /employer)
│   │   ├── seed/            # Multi-industry database seed script
│   │   ├── services/        # AI parsing, JD analyzer, credential issuer, recommendation engines
│   │   └── index.js         # Backend Express server entry point
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── api/             # Axios API client & endpoints
│   │   ├── assets/          # Static assets
│   │   ├── components/      # UI Layout (Sidebar, AppLayout, Charts)
│   │   ├── pages/           # Application views (Landing, Learner Suite, Employer Suite, Auth)
│   │   ├── store/           # Zustand state store (authStore)
│   │   ├── App.jsx          # Router & Route declarations
│   │   ├── main.jsx         # App bootstrap with QueryClient
│   │   └── index.css        # Core design system & utilities
│   └── package.json
│
└── README.md
```

---

## ⚙️ Getting Started

### Prerequisites
- **Node.js** (v18+ recommended)
- **MongoDB** (Local instance or MongoDB Atlas connection URI)

### 1. Backend Setup

```bash
# Navigate to the backend directory
cd backend

# Install dependencies
npm install

# Create environment file (.env)
cp .env.example .env

# Start the development server
npm run dev
```

*Default backend server port: `http://localhost:5000`*

### 2. Seed Database (Optional)

To seed initial multi-industry skills, employers, job listings, and sample candidate profiles:

```bash
cd backend
npm run seed
```

### 3. Frontend Setup

```bash
# Navigate to the frontend directory
cd frontend

# Install dependencies
npm install

# Start the Vite development server
npm run dev
```

*Default frontend URL: `http://localhost:5173`*

---

## 📋 Environment Variables

### Backend (`backend/.env`)
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/skillgap
JWT_SECRET=skillgap_dev_secret_key
JWT_EXPIRES_IN=7d
```

---

## 🔄 Core Workflows

### Candidate Journey
1. **Sign Up / Onboarding**: Upload resume or build profile manually. AI parses skills and education.
2. **Diagnostic & Gap Detection**: View personalized skill gaps ranked by market demand and job openings.
3. **Adaptive Learning**: Click **Start Path** to generate a step-by-step module tailored to missing skills.
4. **Skill Assessment & Badge**: Complete the checkpoint test to earn a verified credential badge.
5. **Job Exemption Application**: Apply for matching jobs on SkillGap with automatic test bypass.

### Employer Journey
1. **Employer Onboarding**: Create account and company profile.
2. **AI JD Analyzer**: Paste or generate high-converting job descriptions with realistic skill requirements.
3. **Post Job**: Specify required skills and proficiency levels.
4. **Applicant Evaluation & Interview Grid**: Screen pre-verified candidates and schedule interview dates on the visual calendar grid with 1-click Google Calendar sync.
5. **Rejection Insights**: Analyze applicant fall-off metrics to refine requirements.

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).
