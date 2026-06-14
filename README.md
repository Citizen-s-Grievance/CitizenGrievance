# 🏛️ Citizen Grievance Management System

An AI-powered full-stack platform that automates the entire civic grievance lifecycle — from voice-based complaint submission to real-time district-wise tracking and automated resolution.

---

## 📌 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [System Architecture](#system-architecture)
- [Modules](#modules)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [API Endpoints](#api-endpoints)
- [Status Workflow](#status-workflow)
- [Screenshots](#screenshots)
- [Team](#team)

---

## 📖 Overview

Citizens across Telangana face difficulties in filing formal complaints due to complex portals and language barriers. This system allows citizens to **speak their complaint in plain language**, and the system handles everything else — transcription, formalization, classification, PDF generation, and live tracking — fully automated.

---

## ✨ Features

- 🎙️ **Voice Input** — Citizens submit complaints via voice; speech-to-text converts it automatically
- 🤖 **LLM-Based Formalization** — TinyLlama/Mistral converts informal text into formal government-style complaint letters (92% accuracy)
- 🧠 **ML Auto-Classification** — Scikit-Learn model routes complaints to the correct department automatically
- 📄 **PDF Report Generation** — Professional complaint PDFs with complaint ID, citizen details, location, and timestamp
- 🗺️ **Real-Time District Map** — WebSocket-powered live map showing complaint data across all Telangana districts
- 🔐 **JWT Authentication** — Stateless token-based auth stored in HttpOnly cookies (XSS protected)
- 📧 **Spring AOP Email Verification** — Cross-cutting email verification aspect triggered automatically on registration
- 🧵 **Multithreaded DB Cleanup** — Auto-deletes unverified accounts after 5 minutes using a scheduled thread
- 📊 **Dual Database Architecture** — MySQL for structured data + MongoDB for AI outputs and binary files
- 🔄 **Automated Status Lifecycle** — SENT → IN_PROGRESS → SOLVED with zero manual intervention

---

## 🛠️ Tech Stack

### Frontend
| Technology | Purpose |
|---|---|
| React.js | UI and interactive district map |
| SockJS + STOMP | WebSocket client for real-time updates |
| Axios | REST API communication |

### Backend
| Technology | Purpose |
|---|---|
| Spring Boot | Core backend framework |
| Spring Security | Authentication and authorization |
| Spring AOP | Email verification as cross-cutting concern |
| JWT (JSON Web Token) | Stateless user authorization |
| Java Multithreading | Scheduled DB cleanup every 5 minutes |
| WebSocket (STOMP) | Bidirectional real-time communication |

### Databases
| Database | Purpose |
|---|---|
| MySQL | Structured complaint records, user data, status tracking |
| MongoDB | AI-generated PDFs (BSON Binary), complaint letters, metadata |

### AI / ML Layer (Python Worker)
| Technology | Purpose |
|---|---|
| TinyLlama / Mistral API | Formal complaint letter generation |
| Scikit-Learn + Joblib | ML-based complaint classification |
| Python Worker | Runs every 5 minutes, processes new complaints |

---

## 🏗️ System Architecture

```
Citizen (Voice Input)
        │
        ▼
React Frontend (SockJS/STOMP WebSocket + REST)
        │
        ▼
Spring Boot Backend
(JWT Auth · Spring AOP · WebSocket Broker · Multithreading)
        │
   ┌────┴────┐
   ▼         ▼
MySQL     Python AI Worker (every 5 min)
(Status)      │
           ┌──┴──┐
           ▼     ▼
      ML Model  LLM Generation
      (classify) (92% accuracy)
           │
           ▼
        MongoDB
   (PDF + AI Letter + Metadata)
```

---

## 📦 Modules

### 1. Registration & Email Verification
- User registers → password BCrypt hashed → temporary record saved in MySQL
- UUID verification token generated (valid **5 minutes only**)
- Spring AOP `@AfterReturning` aspect intercepts and sends verification email automatically
- Multithreaded scheduler deletes unverified records after 5 minutes
- On email click → account activated permanently

### 2. JWT Authentication
- Login validates credentials via Spring Security + BCrypt
- JWT token generated with userId, role, and expiry
- Stored in **HttpOnly cookie** — JavaScript cannot access it (XSS protected)
- `JwtAuthenticationFilter` validates token on every request before reaching any secured endpoint
- Role-based access: `CITIZEN` vs `ADMIN` routes separated

### 3. Complaint Submission (Voice → PDF)
- Citizen speaks complaint → speech-to-text → stored in MySQL (status: SENT)
- Python worker polls MySQL every 5 minutes for new SENT complaints
- ML model classifies complaint into department/category
- LLM generates formal government-style complaint letter
- PDF report generated with all complaint details
- PDF + AI letter stored in MongoDB as BSON Binary
- MySQL status updated to IN_PROGRESS

### 4. Real-Time District Map (WebSocket)
- Frontend opens SockJS/STOMP connection on load
- Subscribes to `/topic/complaints/district`
- On new complaint → Spring Boot broadcasts district ID, count, and status to all subscribers
- React re-renders district pins on Telangana map in real time — no page refresh needed

### 5. Admin Resolution
- Admin logs in and views complaints for their district + department
- Can update status and upload resolution proof image
- Image stored in MongoDB via `MongoTemplate.updateFirst()`
- MySQL status updated to SOLVED
- Citizen notified via email

---

## 🚀 Getting Started

### Prerequisites
Make sure the following are installed on your machine before starting:

- Java 17+
- Node.js 18+
- MySQL 8+
- MongoDB 6+
- Python 3.x
- A Google account (for Google Colab)

### Repository Structure

```
citizen-grievance-system/
├── backend/              → Spring Boot application
├── frontend/             → React application
├── ai_module/            → Python AI worker (local)
│   ├── mongo_service.py  → Configure your MongoDB connection
│   ├── mysql_service.py  → Configure your MySQL connection
│   ├── complaint_llm.py  → Paste your Colab tunnel URL here
│   └── run_worker.py     → Entry point to run the AI worker
└── googlecolabAIModule/  → Import and run this in Google Colab
```

---

## 📋 Step-by-Step Setup Guide

### ✅ Step 1 — Clone the Repository

```bash
git clone https://github.com/yourusername/citizen-grievance-system.git
cd citizen-grievance-system
```

---

### ✅ Step 2 — Setup MySQL Database

1. Open MySQL and create a database:
```sql
CREATE DATABASE CitizenGrievance;
```
2. Note down your MySQL `host`, `username`, and `password` — you'll need them in Step 3 and Step 5.

---

### ✅ Step 3 — Setup Backend (Spring Boot)

1. Navigate to the `backend/` folder and open it in IntelliJ IDEA or any IDE.

2. Open `src/main/resources/application.properties` and configure:
```properties
spring.datasource.url=jdbc:mysql://localhost:3306/CitizenGrievance
spring.datasource.username=YOUR_MYSQL_USERNAME
spring.datasource.password=YOUR_MYSQL_PASSWORD

spring.data.mongodb.host=localhost
spring.data.mongodb.port=27017
spring.data.mongodb.database=CitizenGrievanceDB

spring.mail.username=YOUR_GMAIL_ADDRESS
spring.mail.password=YOUR_GMAIL_APP_PASSWORD
```

> ⚠️ For Gmail, use an **App Password** — not your regular Google password.
> Generate one at: Google Account → Security → 2-Step Verification → App Passwords

3. Run the Spring Boot application:
```bash
./mvnw spring-boot:run
```
Backend starts at: `http://localhost:8080`

---

### ✅ Step 4 — Setup Frontend (React)

1. Navigate to the `frontend/` folder:
```bash
cd frontend
npm install
npm start
```
Frontend starts at: `http://localhost:3000`

---

### ✅ Step 5 — Setup Google Colab AI Module (LLM)

> This step generates the LLM server tunnel URL needed by the AI worker.

1. Open [Google Colab](https://colab.research.google.com/)

2. Upload the notebook from `googlecolabAIModule/` folder to Colab

3. Run each cell **one by one** from top to bottom

4. The last cell will run a Cloudflare tunnel and generate a public URL like:
```
https://industrial-briefly-kept-inspector.trycloudflare.com
```

5. **Copy only the base URL** (before `/generate`) — for example:
```
https://industrial-briefly-kept-inspector.trycloudflare.com
```

6. Open `ai_module/complaint_llm.py` and paste it here:
```python
# In complaint_llm.py
URL = "https://your-tunnel-url.trycloudflare.com/generate"
#                                                  ^^^^^^^^^ keep /generate at the end
```

> ⚠️ The Colab tunnel URL changes every time you restart the notebook. You must update `complaint_llm.py` each time.

---

### ✅ Step 6 — Configure AI Module (Python Worker)

1. Open `ai_module/mysql_service.py` and update:
```python
conn = mysql.connector.connect(
    host="localhost",
    user="YOUR_MYSQL_USERNAME",
    password="YOUR_MYSQL_PASSWORD",
    database="CitizenGrievance"
)
```

2. Open `ai_module/mongo_service.py` and update:
```python
client = MongoClient("mongodb://localhost:27017")
```
> If your MongoDB has auth enabled, use:
> `MongoClient("mongodb://username:password@localhost:27017")`

3. Install Python dependencies:
```bash
cd ai_module
pip install -r requirements.txt
```

4. Run the AI worker:
```bash
python run_worker.py
```
> The worker polls MySQL every 5 minutes for new `SENT` complaints and processes them automatically.

---

### ✅ Step 7 — Verify Everything is Running

| Service | URL / Status |
|---|---|
| Spring Boot Backend | `http://localhost:8080` |
| React Frontend | `http://localhost:3000` |
| MongoDB | `mongodb://localhost:27017` |
| MySQL | `localhost:3306` |
| Google Colab LLM | Tunnel URL in `complaint_llm.py` |
| Python AI Worker | Running in terminal |

---

### ⚠️ Important Notes

- **Colab tunnel URL expires** every time the Colab session ends. Always re-run the Colab notebook and update `complaint_llm.py` with the new URL before starting the worker.
- **Google Colab must stay open and running** while using the LLM feature — closing the tab stops the tunnel.
- **Run services in this order**: MySQL → MongoDB → Spring Boot → React → Colab → Python Worker

---

## 🔐 Environment Variables

Create environment variables in your IDE or system. Never hardcode these values.

| Variable | Description |
|---|---|
| `DB_URL` | MySQL JDBC URL (e.g. `jdbc:mysql://localhost:3306/citizengrievance`) |
| `DB_USERNAME` | MySQL username |
| `DB_PASSWORD` | MySQL password |
| `MONGO_HOST` | MongoDB host (e.g. `localhost`) |
| `MONGO_PORT` | MongoDB port (e.g. `27017`) |
| `MONGO_DB` | MongoDB database name |
| `JWT_SECRET` | Secret key for signing JWT tokens |
| `MAIL_USERNAME` | Gmail address for sending emails |
| `MAIL_PASSWORD` | Gmail app password (not your Google password) |

In `application.properties`:

```properties
spring.datasource.url=${DB_URL}
spring.datasource.username=${DB_USERNAME}
spring.datasource.password=${DB_PASSWORD}
spring.data.mongodb.host=${MONGO_HOST}
spring.data.mongodb.port=${MONGO_PORT}
spring.data.mongodb.database=${MONGO_DB}
jwt.secret=${JWT_SECRET}
spring.mail.username=${MAIL_USERNAME}
spring.mail.password=${MAIL_PASSWORD}
```

---

## 📡 API Endpoints

### Auth
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Register new citizen |
| GET | `/api/auth/verify?token=` | Email verification |
| POST | `/api/auth/login` | Login and receive JWT cookie |
| POST | `/api/auth/logout` | Clear JWT cookie |

### Citizen
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/complaint/submit` | Submit new complaint (voice/text) |
| GET | `/api/complaint/my` | View own complaints with status |
| GET | `/api/complaint/{id}/pdf` | Download complaint PDF |

### Admin
| Method | Endpoint | Description |
|---|---|---|
| GET | `/admin/complaints` | View complaints by district + department |
| PUT | `/admin/complaint/resolve/{id}` | Update status + upload resolution image |

### WebSocket
| Endpoint | Description |
|---|---|
| `/ws` | WebSocket connection endpoint |
| `/topic/complaints/district` | Subscribe for live district updates |

---

## 🔄 Status Workflow

```
SENT
  │   (Python worker picks up complaint)
  ▼
IN_PROGRESS
  │   (Admin resolves + uploads proof)
  ▼
SOLVED
```

---

## 👥 Team

| Name | Role | Contribution |
|---|---|---|
| **Satwikesh** | Full Stack Developer | Spring Boot Backend · REST APIs · JWT Auth · Spring AOP · WebSocket · React Frontend |
| **Mehar Sai** | AI/ML Engineer | Python Worker · LLM Integration · PDF Generation · ML Classification · MongoDB Integration |
| **Charan** | Frontend Developer & QA | Live Telangana District Map Integration · End-to-End API Testing |

---

## 📄 License

This project is built for academic and demonstration purposes.
