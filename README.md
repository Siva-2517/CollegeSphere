# CollegeSphere

A full-stack web application for managing inter-college events with role-based workflows for students, organizers, and admins.

## 🚀 Live Demo

- 🌐 Frontend: [CollegeSphere App](https://college-sphere-three.vercel.app/)
- 🔗 Backend API: [API Base URL](https://collegesphere-server.onrender.com)

Note: The backend is hosted on a free tier (Render), the first request may take 30–60 seconds to wake up the server.

## Overview

CollegeSphere streamlines the complete college event lifecycle: event publishing, organizer approval, student registration, and admin moderation. It provides separate dashboards and protected APIs to support secure, role-based operations.

## Problem Statement

Many colleges still manage events through scattered forms, chats, and manual spreadsheets, which causes missed deadlines, duplicate entries, and poor visibility.

CollegeSphere centralizes discovery, approvals, and registrations in one platform so students can register faster, organizers can manage events efficiently, and admins maintain governance.

## Key Features

- Role-based authentication for `student`, `organizer`, and `admin`
- OTP-based registration flow with email verification
- Organizer onboarding with admin approval workflow
- Event creation, update, deletion, and approval lifecycle
- Public and college-wise event listing APIs
- Solo and team event registration with validation rules
- Registration deadline enforcement and duplicate registration prevention
- Transactional emails for OTP, account updates, and registration confirmations
- Dashboards for Admin, Organizer, and Student workflows

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
│   │   ├── components/          # recommended reusable UI components
│   │   ├── hooks/               # recommended custom hooks
│   │   ├── layouts/             # recommended route/layout wrappers
│   │   ├── utils/               # recommended client-side helpers
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── package.json
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


