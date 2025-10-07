# 🛡️ Campus Security: AI-Powered Monitoring & Prediction Platform

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js)](https://nextjs.org/)
[![Python](https://img.shields.io/badge/Python-3.10-blue?logo=python)](https://www.python.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-blue?logo=postgresql)](https://www.postgresql.org/)
[![Drizzle ORM](https://img.shields.io/badge/Drizzle-ORM-brightgreen?logo=drizzle)](https://orm.drizzle.team/)

> **An advanced, multimodal data fusion platform designed to enhance campus safety through intelligent timeline generation, predictive analytics, and explainable AI.**

This platform empowers campus security personnel with a unified dashboard to monitor, analyze, and predict student and staff activity by integrating multiple data sources into a single, chronological timeline.
It leverages machine learning for **entity resolution**, **location prediction**, and **proactive inactivity alerts**, all accompanied by **human-readable explanations**.

---

## ⚠️ **IMPORTANT NOTE**

**Default Login Credentials:**

* **Email:** `testuser@gmail.com`
* **Password:** `testuser@123`
* **OTP:** `886274`

> ⚠️ These credentials are for demo/testing purposes only. Please change them before deployment.

---

## ✨ Core Features

### 🔗 Multi-Modal Data Fusion

Aggregates and correlates data from diverse campus systems into a unified stream:

* 💳 **Card Swipes:** Door access and entry gate logs
* 🌐 **Wi-Fi Connections:** Association logs from access points
* 🗓️ **Room Bookings:** Scheduled use of labs, seminar halls, etc.
* 📚 **Library Checkouts:** Asset and resource usage records

### 🕓 Intelligent Timeline Generation

Visualizes a user’s activity in a **chronological timeline**, providing a clear, interactive narrative of movements and system interactions.

### 🤖 Predictive Monitoring & Explainable AI (XAI)

* **Location Prediction:**
  Fills gaps in a user's timeline by predicting their most likely location using historical patterns. Each prediction includes **confidence scores** and **explanations**.
* **Entity Resolution:**
  Uses a logistic regression model to identify owners of unassigned campus cards by analyzing contextual evidence (Wi-Fi, CCTV, room bookings). Each match includes confidence levels and evidence trails.

### 🚨 Proactive Inactivity Alerts

Automatically flags users who show no activity across all monitored systems for a configurable period (e.g., 12 h or 24 h).

### 🔍 Dynamic Filtering & Search

Operators can quickly **search** for any user and **filter** their activity by date and time range.

---

## 🔧 Tech Stack

| Layer                     | Technology                                                              |
| :------------------------ | :---------------------------------------------------------------------- |
| **Frontend & Bridge API** | Next.js 14 (App Router), React, TypeScript, Tailwind CSS, Framer Motion |
| **ML Service**            | Python, Flask, Scikit-learn, Pandas                                     |
| **Database**              | PostgreSQL                                                              |
| **ORM**                   | Drizzle ORM                                                             |
| **Authentication**        | NextAuth.js                                                             |

---

## 🎗️ System Architecture

The platform follows a **microservices-oriented architecture** for scalability and separation of concerns:

1. **Next.js Application (Frontend + Bridge API)**

   * Hosts the user dashboard.
   * Acts as a “Bridge API” that aggregates raw data from PostgreSQL and sends it to the ML service for prediction.

2. **Python ML Service (Backend)**

   * Flask-based API hosting trained machine-learning models.
   * Performs feature engineering, prediction, and returns confidence-weighted, explainable results.

3. **PostgreSQL Database**

   * Centralized store for user profiles, device data, and activity logs from multiple campus systems.

---

## 🚀 Getting Started

### ✅ Prerequisites

* Node.js (v18 or later)
* Python (v3.10 or later)
* PostgreSQL

---

### 🧩 Installation & Setup

1. **Clone the repository**

   ```bash
   git clone https://github.com/nilotpal-n7/ethos-security.git
   cd ethos-security
   ```

2. **Set up the Next.js App**

   ```bash
   npm install
   cp .env.example .env.local
   # Add your database URL and secrets to .env.local
   npm run db:push
   ```

3. **Set up the Python ML Service**

   ```bash
   cd ml_models
   pip install -r requirements.txt
   # Train your model with the dataset
   python predict_owner.py train
   ```

4. **Run the Application**

   ```bash
   # Start the Next.js server
   npm run dev
   ```

   In another terminal:

   ```bash
   # Start the Flask ML API
   python ml_models/predict_owner.py run
   ```

   Now open [http://localhost:3000](http://localhost:3000) 🚀

---

## 🗁 Project Structure

```text
├── datasets/              # Raw and processed datasets
├── ml_models/             # Python ML Service for predictions
│   ├── predict_owner.py   # Owner prediction model and Flask API
│   └── predict_location.py# Location prediction model and Flask API
│── model_artifacts/       # Saved models (.pkl) and scalers
├── node_modules/          # Installed npm dependencies
├── public/                # Static assets (images, icons, etc.)
├── src/                   # Source directory
│   ├── app/               # Next.js App Router pages and routes
│   │   ├── (app)/         # Main application routes
│   │   ├── (auth)/        # Authentication routes
│   │   └── api/           # API route handlers
│   ├── components/        # Reusable UI components
│   ├── context/           # React Context providers
│   ├── database/          # Drizzle ORM schema & migrations
│   ├── helpers/           # Utility helper functions
│   ├── lib/               # Shared utilities
│   ├── models/            # Data and ML-related models
│   ├── schemas/           # Validation and schema definitions
│   ├── server/            # Server-side logic or middlewares
│   ├── types/             # TypeScript type definitions
│   ├── utils/             # Utility functions
│   └── middleware.ts      # Next.js middleware
└── package.json           # Project dependencies and scripts
                # TypeScript type definitions
```

---

## 📜 License

This project is licensed under the [MIT License](https://opensource.org/licenses/MIT).
