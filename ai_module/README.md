# 🤖 AI Module for Citizen Grievance Management System

## 📌 Overview

The AI Module is responsible for automating complaint processing in the Citizen Grievance Management System.

This module continuously monitors new complaints from MySQL, classifies them using Machine Learning, generates formal complaint letters using an LLM, creates professional PDF reports, stores AI-generated outputs in MongoDB, and updates complaint statuses automatically.

---

# 🚀 System Architecture

```text
Citizen Complaint
       │
       ▼
MySQL Database
(Status = SENT)
       │
       ▼
Python Worker
(Runs Every 5 Minutes)
       │
       ▼
ML Complaint Classification
       │
       ▼
LLM Complaint Generation
       │
       ▼
PDF Generation
       │
       ▼
MongoDB Update
(pdfLLM + complaintDescriptionLLM)
       │
       ▼
MySQL Status Update
(Status = IN_PROGRESS)
```

---

# ✨ Features

## Automated Complaint Processing

* Fetches complaints from MySQL automatically.
* Processes only complaints with status = `SENT`.
* Runs continuously every 5 minutes.
* Supports batch complaint processing.

---

## Machine Learning Classification

The AI model automatically classifies complaints into departments:

* Road Department
* Water Department
* Electricity Department
* Garbage Collection Department

The classifier generates:

* Department
* Category
* Priority

---

## LLM-Based Complaint Generation

Converts citizen-written complaints into formal government-style complaint letters.

### Example Input

```text
There is a large pothole near the bus stand causing accidents.
```

### Example Output

```text
Subject: Complaint Regarding Road Damage Near Bus Stand

Dear Sir/Madam,

I would like to bring to your attention a road safety issue...
```

---

## PDF Generation

Creates professional complaint reports containing:

* Complaint ID
* Citizen Details
* Complaint Information
* Location Information
* Original Complaint
* AI Generated Formal Complaint
* Generated Timestamp

---

## MongoDB Integration

Stores:

* Generated PDF as BSON Binary
* AI Generated Complaint Letter
* Complaint Metadata

---

## Status Workflow

```text
SENT
  │
  ▼
IN_PROGRESS
  │
  ▼
SOLVED
```

---

# 🛠️ Technology Stack

## Backend

* Python 3.x

## Databases

* MySQL
* MongoDB

## Machine Learning

* Scikit-Learn
* Joblib

## Large Language Model (LLM)

* TinyLlama
* Mistral API (Configurable)

## PDF Generation

* ReportLab

## Utilities

* Requests
* Geopy
* Threading

---

# 📂 Project Structure

```text
Ai_Module/

│
├── database/
│   └── mongo_service.py
│
├── llm/
│   └── complaint_llm.py
│
├── models/
│   ├── classifier_ml.py
│   ├── complaint_classifier.pkl
│   ├── complaint_dataset.csv
│   └── train_classifier.py
│
├── pdf_generator.py
├── mysql_service.py
├── worker.py
├── run_worker.py
├── location_service.py
├── speech_handler.py
│
├── requirements.txt
├── README.md
└── .gitignore
```

---

# 🗄️ MySQL Schema

```sql
CREATE TABLE complaintsmysql (
    complaint_id INT NOT NULL,
    complaints_in_words TEXT,
    date_time DATETIME,
    department VARCHAR(150),
    district VARCHAR(150),
    landmark VARCHAR(255),
    latitude DECIMAL(10,8),
    longitude DECIMAL(11,8),
    status ENUM('SENT','IN_PROGRESS','SOLVED'),
    user_id_fk INT,
    status_priority INT,
    PRIMARY KEY (complaint_id)
);
```

---

# 🍃 MongoDB Structure

## Database

```text
grievance_system
```

## Collection

```text
complaints
```

## Example Document

```json
{
  "_id": 14,
  "audioComplaint": "streetlight_issue_audio.mp3",
  "userImage": "streetlight_issue_image.jpg",
  "pdfLLM": "<Binary PDF>",
  "complaintDescriptionLLM": "Generated Formal Complaint",
  "dateTime": "2026-06-07T10:45:30"
}
```

---

# ⚙️ Installation Guide

## Clone Repository

```bash
git clone https://github.com/MeherSaiG/Ai_Module.git
cd Ai_Module
```

---

## Create Virtual Environment

```bash
python -m venv venv
```

---

## Activate Virtual Environment

### Windows

```bash
venv\Scripts\activate
```

### Linux / Mac

```bash
source venv/bin/activate
```

---

## Install Dependencies

```bash
pip install -r requirements.txt
```

---

# 🔧 Configuration

## MySQL Configuration

Update:

```text
mysql_service.py
```

Example:

```python
host="localhost"
user="root"
password="your_password"
database="Citizengrivance"
```

---

## MongoDB Configuration

Update:

```text
database/mongo_service.py
```

Example:

```python
MongoClient("mongodb://localhost:27017")
```

---

# ▶️ Running the Worker

Start the AI Worker:

```bash
python run_worker.py
```

### Expected Output

```text
Worker Started
Found 2 complaints
Processing 13
Completed 13
Processing 14
Completed 14
```

---

# 🧪 Testing

Insert a complaint into MySQL:

```sql
INSERT INTO complaintsmysql
(
    complaint_id,
    complaints_in_words,
    status
)
VALUES
(
    100,
    'Water leakage near bus stand',
    'SENT'
);
```

The worker should automatically:

1. Fetch the complaint.
2. Classify the complaint.
3. Generate a formal complaint.
4. Generate a PDF report.
5. Store AI output in MongoDB.
6. Update status to `IN_PROGRESS`.

---

# 👨‍💻 Author

**Meher Sai**

AI Module Developer – Citizen Grievance Management System

---

# 📜 License

This project is developed for educational and academic purposes as part of the Citizen Grievance Management System.
