# Manufacturing Complaint System

**ISO 9001 / IATF 16949 Complaint Handling Web App**  
Firebase Hosting (Frontend) + Cloud Run (Backend) + PostgreSQL (Cloud SQL)

---

## Architecture

```
[Browser]
    |
    v
[Firebase Hosting] --> React SPA
    |
    | (API calls via /api proxy or direct)
    v
[Cloud Run] --> Node.js/Express Backend
    |
    +---> [Cloud SQL PostgreSQL] (complaint-db, northamerica-northeast2)
    +---> [Cloud Storage] (complaint-attachments-mfg)
    +---> [Firebase Auth] (Email + Google)
```

## Features

- **ISO 9001 / IATF 16949 Workflow**: Complaint capture, classification, 8D root cause analysis, corrective actions
- **User Authentication**: Firebase Auth (Email/Password + Google Sign-In)
- **Role-Based Access**: Admin, Quality Engineer, Supervisor, Operator, Viewer
- **File Attachments**: Upload photos, PDFs, reports to Cloud Storage
- **8D Problem Solving**: Full D1-D8 workflow with team management
- **CAPA Management**: Corrective & Preventive Actions tracking
- **Dashboards**: KPI cards, trend charts, severity/type breakdowns
- **Audit Trail**: All changes tracked with timestamps

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18, React Router, Recharts |
| Backend | Node.js 18, Express 4, Sequelize ORM |
| Database | PostgreSQL 15 (Cloud SQL, Toronto) |
| Auth | Firebase Authentication |
| Hosting | Firebase Hosting |
| API Server | Google Cloud Run |
| Storage | Google Cloud Storage |
| CI/CD | Google Cloud Build |

---

## Deployment Guide

### Prerequisites

1. GCP Project: `manufacturing-complaint-system`
2. Firebase Project linked to GCP project
3. Cloud SQL instance: `complaint-db` (PostgreSQL, northamerica-northeast2)
4. Cloud Storage bucket: `complaint-attachments-mfg`
5. Node.js 18+ and npm installed locally
6. Google Cloud SDK (`gcloud`) installed
7. Firebase CLI installed: `npm install -g firebase-tools`

### Step 1: Configure Backend Environment

Create `backend/.env` from `backend/.env.example`:

```bash
cp backend/.env.example backend/.env
```

Fill in the values:
```
DB_HOST=/cloudsql/manufacturing-complaint-system:northamerica-northeast2:complaint-db
DB_NAME=complaint_db
DB_USER=complaint_app
DB_PASSWORD=<your-db-password>
FIREBASE_PROJECT_ID=manufacturing-complaint-system
GCS_BUCKET=complaint-attachments-mfg
JWT_SECRET=<generate-a-secure-random-string>
NODE_ENV=production
PORT=8080
```

### Step 2: Run Database Migration

```bash
cd backend
npm install
npm run migrate
```

Or connect via Cloud SQL Auth Proxy:
```bash
# Download Cloud SQL Auth Proxy
curl -o cloud-sql-proxy https://storage.googleapis.com/cloud-sql-connectors/cloud-sql-proxy/v2.7.0/cloud-sql-proxy.linux.amd64
chmod +x cloud-sql-proxy

# Start proxy
./cloud-sql-proxy manufacturing-complaint-system:northamerica-northeast2:complaint-db

# In another terminal, run migration
cd backend && npm run migrate
```

### Step 3: Deploy Backend to Cloud Run

```bash
# Build and push Docker image
gcloud builds submit --tag gcr.io/manufacturing-complaint-system/manufacturing-complaint-backend ./backend

# Deploy to Cloud Run
gcloud run deploy manufacturing-complaint-backend \
  --image gcr.io/manufacturing-complaint-system/manufacturing-complaint-backend \
  --region northamerica-northeast2 \
  --platform managed \
  --allow-unauthenticated \
  --set-env-vars NODE_ENV=production \
  --set-secrets DB_PASSWORD=db-password:latest \
  --add-cloudsql-instances manufacturing-complaint-system:northamerica-northeast2:complaint-db \
  --memory 512Mi \
  --port 8080

# Note the deployed URL (e.g., https://manufacturing-complaint-backend-xxxx-nn.a.run.app)
```

### Step 4: Configure Frontend

Update `frontend/src/firebase.js` with your Firebase config (already done).

Create `frontend/.env.production`:
```
REACT_APP_API_URL=https://manufacturing-complaint-backend-xxxx-nn.a.run.app
```

Update `frontend/package.json` proxy or configure Firebase rewrites in `firebase.json`:
```json
{
  "hosting": {
    "public": "frontend/build",
    "rewrites": [
      {
        "source": "/api/**",
        "run": {
          "serviceId": "manufacturing-complaint-backend",
          "region": "northamerica-northeast2"
        }
      },
      { "source": "**", "destination": "/index.html" }
    ]
  }
}
```

### Step 5: Deploy Frontend to Firebase Hosting

```bash
# Login to Firebase
firebase login

# Build React app
cd frontend
npm install
npm run build
cd ..

# Deploy to Firebase Hosting
firebase deploy --only hosting --project manufacturing-complaint-system
```

### Step 6: Set Up Automated CI/CD (Optional)

```bash
# Connect GitHub repo to Cloud Build
gcloud builds triggers create github \
  --repo-name=manufacturing-complaint-system \
  --repo-owner=vijaybg2023 \
  --branch-pattern='^main$' \
  --build-config=cloudbuild.yaml
```

---

## Local Development

### Backend
```bash
cd backend
npm install
cp .env.example .env  # Fill in local DB settings
npm run dev
# Runs on http://localhost:8080
```

### Frontend
```bash
cd frontend
npm install
npm start
# Runs on http://localhost:3000
# Proxies /api to http://localhost:8080
```

---

## GCP Resources

| Resource | Name | Region |
|----------|------|--------|
| GCP Project | manufacturing-complaint-system | - |
| Cloud Run | manufacturing-complaint-backend | northamerica-northeast2 |
| Cloud SQL | complaint-db (PostgreSQL 15) | northamerica-northeast2 |
| Cloud Storage | complaint-attachments-mfg | northamerica-northeast2 |
| Firebase Hosting | manufacturing-complaint-system | Global CDN |
| Firebase Auth | Email + Google | - |

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/register | Register new user |
| POST | /api/auth/login | Login with Firebase token |
| GET | /api/complaints | List complaints (with filters) |
| POST | /api/complaints | Create new complaint |
| GET | /api/complaints/:id | Get complaint details |
| PUT | /api/complaints/:id | Update complaint |
| GET | /api/8d/complaint/:id | Get 8D report for complaint |
| POST | /api/8d | Create 8D report |
| PUT | /api/8d/:id | Update 8D report |
| GET | /api/corrective-actions/complaint/:id | Get CAPAs for complaint |
| POST | /api/corrective-actions | Create CAPA |
| PUT | /api/corrective-actions/:id | Update CAPA |
| GET | /api/dashboard/summary | Dashboard KPI summary |
| GET | /api/attachments/:complaintId | List attachments |
| POST | /api/attachments/:complaintId | Upload attachment |
| GET | /api/users | List all users (admin) |
| PUT | /api/users/:id/role | Update user role (admin) |

---

## License

MIT
