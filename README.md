# CollegeSphere

A full-stack web application for managing inter-college events with role-based workflows for students, organizers, college admins, and super admins, powered by an intelligent dual-LLM AI Agent (`SphereAI`).

## 🚀 Live Demo

- 🌐 Frontend: [CollegeSphere App](https://college-sphere-three.vercel.app/)
- 🔗 Backend API: [API Base URL](https://collegesphere-server.onrender.com)

Note: The backend is hosted on a free tier (Render), the first request may take 30–60 seconds to wake up the server.

## Overview

CollegeSphere streamlines the complete college event lifecycle: event publishing, organizer approval, student registration, soft-deletion recovery, and platform governance. It provides 4 specialized role-based dashboards and protected APIs to support secure multi-tenant operations.

## Key Features

- **4-Role Permission System**: `student`, `organizer`, `admin` (College Admin), and `superadmin` (System Governance).
- **SphereAI Conversational Agent**: Dual-LLM function calling engine (Groq Llama 3.3 70B + Gemini 2.5 Flash) with Two-Phase Action Confirmation Cards.
- **Super Admin Governance Dashboard**: Multi-tenant college CRUD, user role promotion, trash bin recovery for soft-deleted events, and platform health diagnostics.
- **College Admin Scoping**: College Admins moderate organizers and events strictly bound to their assigned institution.
- **Event Lifecycle & Auto Soft-Deletion**: Automated soft-deletion (`isDeleted: true`) for passed events, remaining seat slot checks, and deadline validation.
- **OTP Verification & Google OAuth 2.0**: Email verification and single sign-on with role completion flow.
- **Transactional Email Workflows**: Automatic approval and welcome emails via Nodemailer/Resend.

## Tech Stack

### Frontend

- React 19
- Vite
- React Router DOM
- Axios
- Tailwind CSS
- ESLint

### Backend

- Node.js
- Express 5
- MongoDB + Mongoose
- JWT Authentication
- Passport.js (Google OAuth20)
- bcryptjs
- Multer + Cloudinary (poster upload)
- Nodemailer / Resend (email workflows)

## Architecture

CollegeSphere follows a layered full-stack architecture:

- **Presentation Layer (client):** React pages and routing for role-specific dashboards
- **API Layer (server/routes):** REST endpoints grouped by domain (`auth`, `event`, `registration`, `admin`, `college`)
- **Business Layer (server/controllers):** validation, approval logic, role checks, and orchestration
- **Data Layer (server/modals):** Mongoose schemas for users, events, registrations, OTP, and colleges
- **Infrastructure Layer (server/config + utils):** DB connection, cloud media uploads, email services

Authentication uses JWT middleware with role checks, and organizer access is gated until admin approval.

## Security Practices

- JWT-based stateless authentication
- Role-based route protection middleware
- Password hashing using bcrypt
- OTP expiration and verification logic
- Duplicate registration prevention
- Server-side validation for critical workflows

## Scalable Folder Structure

```text
CollegeSphere/
├── client/
│   ├── public/
│   ├── src/
│   │   ├── api/
│   │   │   └── axios.js
│   │   ├── pages/
│   │   ├── App.css
│   │   ├── App.jsx
│   │   ├── index.css
│   │   └── main.jsx
│   ├── eslint.config.js
│   ├── index.html
│   ├── package.json
│   ├── postcss.config.js
│   ├── README.md
│   ├── tailwind.config.js
│   └── vite.config.js
├── server/
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── modals/
│   ├── routes/
│   ├── utils/
│   ├── package.json
│   └── server.js
├── docs/
│   └── screenshots/
│       └── .gitkeep
└── README.md
```

## Installation

### Prerequisites

- Node.js (v18+ recommended)
- npm
- MongoDB database (local or Atlas)
- Cloudinary account (for poster upload)
- Email provider credentials (SMTP/Resend)

### 1) Clone repository

```bash
git clone <your-repo-url>
cd CollegeSphere
```

### 2) Install dependencies

```bash
cd server
npm install
cd ../client
npm install
```

### 3) Configure environment variables

Create `server/.env` and add:

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
RESEND_API_KEY=your_resend_key
EMAIL_USER=your_email_user
EMAIL_PASS=your_email_password
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback
CLIENT_URL=http://localhost:5173
GEMINI_API_KEY=your_gemini_api_key
GROQ_API_KEY=your_groq_api_key
```

### 4) Run the project

Open two terminals:

**Terminal 1 (Backend)**

```bash
cd server
npm run dev
```

**Terminal 2 (Frontend)**

```bash
cd client
npm run dev
```

Frontend default: `http://localhost:5173`  
Backend default: `http://localhost:5000`

## Usage

- Register as `student` or `organizer` using OTP verification
- Login and access role-based dashboard
- Organizer creates events (pending admin approval)
- Admin approves/rejects organizers and events
- Students browse approved events and register (solo/team)

## Sample Input / Output

### Sample API: Send OTP

**Request**

`POST /api/auth/send-otp`

```json
{
  "email": "student@example.com"
}
```

**Response (200)**

```json
{
  "msg": "OTP sent successfully to your email"
}
```

### Sample API: Login

**Request**

`POST /api/auth/login`

```json
{
  "email": "student@example.com",
  "password": "password123"
}
```

**Response (200)**

```json
{
  "msg": "Login successful",
  "token": "<jwt-token>",
  "user": {
    "id": "...",
    "name": "Student Name",
    "email": "student@example.com",
    "role": "student"
  }
}
```

## Future Enhancements

- Real-time notifications for approval status and event updates
- Advanced search, filters, and recommendation engine
- Payment integration for paid events
- Calendar sync (Google/Outlook)
- CI/CD pipeline, automated testing, and API documentation (OpenAPI)

## Author

- **Siva Surya P**
- LinkedIn: `https://www.linkedin.com/in/sivasurya-tech`
- Email: `sivatechie17@gmail.com`
