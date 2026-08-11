# 🎓 CollegeSphere - Inter-College Event Management & SphereAI Assistant

CollegeSphere is a full-stack, multi-tenant enterprise event management platform powered by an intelligent dual-LLM function-calling AI Agent (`SphereAI`). It streamlines event publishing, organizer approvals, student registrations, soft-deletion recovery, and platform governance across 4 dedicated role-based workflows.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![React](https://img.shields.io/badge/React-19-cyan.svg)
![Node.js](https://img.shields.io/badge/Node.js-20+-green.svg)
![Express](https://img.shields.io/badge/Express-5.0-lightgrey.svg)
![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-green.svg)
![Groq](https://img.shields.io/badge/Groq-Llama%203.3%2070B-orange.svg)
![Gemini](https://img.shields.io/badge/Gemini-2.5%20Flash-blue.svg)

---

## 🚀 Live Demo

- 🌐 **Frontend Application**: [CollegeSphere App](https://college-sphere-three.vercel.app/)
- 🔗 **Backend API Base**: [Collegesphere Server API](https://collegesphere-server.onrender.com)

> **Note**: The backend is hosted on a free Render tier. If cold-started, the initial API request may take 30–60 seconds to spin up.

---

## 📋 Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [SphereAI Engine](#sphereai-engine)
- [Role Permission Matrix](#role-permission-matrix)
- [Technology Stack](#technology-stack)
- [Architecture & Database Schema](#architecture--database-schema)
- [Data Security & Validation](#data-security--validation)
- [Installation & Quick Start](#installation--quick-start)
- [Environment Variables](#environment-variables)
- [API Endpoints Specification](#api-endpoints-specification)
- [Project Structure](#project-structure)
- [License & Author](#license--author)


---

## 🎯 Overview

**CollegeSphere** eliminates fragmented Google Forms, scattered WhatsApp announcements, and manual spreadsheets used by colleges to run inter-college fests, hackathons, workshops, and sports tournaments. 

### The Problem We Solve
- **Fragmented Event Discovery**: Students miss events hosted by neighboring institutions.
- **Unverified Organizers**: Fraudulent or unapproved event listings.
- **Seat Overbooking & Deadline Chaos**: Lack of automated capacity and deadline checks.
- **Lack of Governance**: College admins lack tools to moderate events and manage institution-wide roles.

### Our Solution
CollegeSphere centralizes the entire event lifecycle into a single platform:
1. **Multi-Tenant Onboarding**: Verify colleges and approve student event organizers.
2. **AI-Powered Event Discovery & Registration**: Intelligent conversational agent (`SphereAI`) that finds events, answers queries, and registers students with interactive confirmation cards.
3. **Automated Expiration & Trash Bin**: Automatic soft-deletion of passed events with a Super Admin recovery trash bin.
4. **4-Role Governance**: Tailored dashboards for Students, Organizers, College Admins, and Super Admins.

---

## ✨ Key Features

### 👑 4-Role Access Control
* **Student (`student`)**: Browse events by category/deadline, check remaining seat capacity, register (solo/team), manage bookings.
* **Organizer (`organizer`)**: Draft events, generate AI descriptions and rules, manage attendee lists, track registration statistics.
* **College Admin (`admin`)**: Scoped strictly to their `collegeId`. Approve/reject organizers and events belonging to their assigned institution.
* **System Super Admin (`superadmin`)**: Global system maintainer. Create/delete colleges, assign user roles, recover soft-deleted events (Trash Bin), and inspect platform health diagnostics.

### 🤖 SphereAI Agent (Dual-LLM Function Calling)
* **Dual Engine Fallback**: Primary Groq (`llama-3.3-70b-versatile`) + Secondary Gemini (`gemini-2.5-flash`) + Zero-Key Smart Fallback.
* **Two-Phase Action Confirmation Protocol**: Intercepts mutating actions (e.g. event registration, cancellation, event creation, role changes) and renders interactive `<ConfirmationCard />` widgets before modifying the database.
* **Strict Permission Guards**: Enforces role boundaries directly in prompt generation and server tool execution.

### ⏰ Event Lifecycle & Soft-Deletion
* **Remaining Seat Validation**: Prevents overbooking past `event.maxSlots`.
* **Registration Deadline Enforcement**: Automatically blocks registration once `event.deadline` passes.
* **Auto Soft-Deletion**: Automatically marks `isDeleted: true` when `event.date < current_date`, keeping student feeds clean.

### 🔐 Authentication & Onboarding
* **OTP Verification**: Email verification via Nodemailer / Resend.
* **Google OAuth 2.0**: Single Sign-On with role selection and profile completion flow.
* **JWT Authorization**: 3-hour expiration with protected API endpoints.

---

## 🤖 SphereAI Engine

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          SPHERE AI AGENT PIPELINE                           │
└─────────────────────────────────────────────────────────────────────────────┘

  User Query ──▶ AIChatWidget ──▶ POST /api/ai/chat ──▶ Groq Llama 3.3 70B
                                                               │
                                                  Tool Call Triggered?
                                                   │                 │
                                                 YES                 NO
                                                  │                  │
                                                  ▼                  ▼
                                        executeTool(fn, args)    Direct Text
                                                  │                 Reply
                                      Requires Confirmation?
                                       │                  │
                                     YES                  NO
                                      │                   │
                                      ▼                   ▼
                              ConfirmationCard        Return JSON
                               (User Approve)         Data Loop
```

---

## 🔑 Role Permission Matrix

| Feature / Action | Student (`student`) | Organizer (`organizer`) | College Admin (`admin`) | Super Admin (`superadmin`) |
| :--- | :---: | :---: | :---: | :---: |
| **Search & View Events** | ✅ | ✅ | ✅ | ✅ |
| **Register / Cancel Event** | ✅ | ❌ | ❌ | ❌ |
| **Create Event Drafts** | ❌ | ✅ (If Approved) | ✅ | ✅ |
| **View Event Registrations** | ❌ | ✅ (Their Events) | ✅ | ✅ |
| **Approve / Reject Organizers** | ❌ | ❌ | ✅ (Their College) | ✅ (Global) |
| **Approve / Reject Events** | ❌ | ❌ | ✅ (Their College) | ✅ (Global) |
| **Manage Colleges (CRUD)** | ❌ | ❌ | ❌ | ✅ |
| **Assign User Roles** | ❌ | ❌ | ❌ | ✅ |
| **Trash Bin Recovery** | ❌ | ❌ | ❌ | ✅ |

---

## 🛠️ Technology Stack

### Frontend
- **React 19** & **Vite**
- **Tailwind CSS** (Cosmic dark glassmorphism design system)
- **Lucide React** (Modern iconography)
- **Axios** (JWT interceptors & error handler)
- **React Router DOM v7**

### Backend
- **Node.js** & **Express 5**
- **MongoDB Atlas** + **Mongoose 8**
- **JWT (jsonwebtoken)** & **bcryptjs**
- **Passport.js** (Google OAuth 2.0 Strategy)
- **Nodemailer / Resend** (Transactional emails)

### AI Infrastructure
- **Groq SDK** (`llama-3.3-70b-versatile`)
- **Google Gen AI SDK** (`gemini-2.5-flash`)
- Custom **Two-Phase Action Confirmation Protocol**

---

## 🏗️ Architecture & Database Schema

### System Architecture

```
┌────────────────────────────────────────────────────────────────────────────┐
│                             CLIENT LAYER (Vite)                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │   Student    │  │  Organizer   │  │College Admin │  │ Super Admin  │  │
│  │  Dashboard   │  │  Dashboard   │  │  Dashboard   │  │  Dashboard   │  │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  │
│         └─────────────────┼─────────────────┼─────────────────┘         │
│                           ▼                                             │
│                 Floating AIChatWidget & ConfirmationCard                │
└───────────────────────────┬────────────────────────────────────────────────┘
                            │ REST API / JWT
                            ▼
┌────────────────────────────────────────────────────────────────────────────┐
│                            BACKEND LAYER (Express)                         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  │
│  │ Auth Router │  │ Event Router│  │Admin Router │  │ SuperAdmin  │  │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘  │
│                           │                                             │
│                           ▼                                             │
│              AI Orchestration Engine (ai.service.js)                    │
│             ┌───────────────────┬───────────────────┐                   │
│             ▼                   ▼                   ▼                   │
│         Groq Llama          Gemini 2.5           Fallback               │
│          3.3 70B              Flash               Engine                │
└───────────────────────────┬────────────────────────────────────────────────┘
                            │ Mongoose ORM
                            ▼
┌────────────────────────────────────────────────────────────────────────────┐
│                            DATABASE (MongoDB Atlas)                        │
└────────────────────────────────────────────────────────────────────────────┘
```

### Database Entity Relationships

```
┌──────────────────┐        ┌──────────────────┐        ┌──────────────────┐
│      USERS       │        │     COLLEGES     │        │      EVENTS      │
├──────────────────┤        ├──────────────────┤        ├──────────────────┤
│ _id (ObjectId)   │───────►│ _id (ObjectId)   │◄───────│ _id (ObjectId)   │
│ email            │        │ name             │        │ title            │
│ password         │        │ location         │        │ collegeId (FK)   │
│ role (enum)      │        │ emailDomain      │        │ createdBy (FK)   │
│ collegeId (FK)   │        │ isVerified       │        │ maxSlots         │
│ isApproved       │        └──────────────────┘        │ isApproved       │
└────────┬─────────┘                                    │ isDeleted        │
         │                                              └────────┬─────────┘
         │                                                       │
         └──────────────────────┐       ┌────────────────────────┘
                                ▼       ▼
                      ┌──────────────────┐
                      │  REGISTRATIONS   │
                      ├──────────────────┤
                      │ _id (ObjectId)   │
                      │ user (FK)        │
                      │ event (FK)       │
                      │ isTeamRegistration│
                      │ registrationAt   │
                      └──────────────────┘
```

---

## 🔒 Data Security & Validation

- **Password Hashing**: Bcrypt with 10 salt rounds.
- **JWT Protection**: Signed token verification with role authorization rules (`protect(['superadmin'])`).
- **Input Sanitization**: Regex queries escaped for MongoDB safety.
- **No Secret Leaks**: `.env` files strictly ignored via `.gitignore`; templates provided in `.env.example`.

---

## 🚀 Installation & Quick Start

### Prerequisites
- Node.js 20+
- MongoDB Atlas database connection string

### 1. Clone the Repository
```bash
git clone https://github.com/Siva-2517/CollegeSphere.git
cd CollegeSphere
```

### 2. Backend Setup
```bash
cd server
npm install
cp .env.example .env
# Edit .env with your MONGO_URI, JWT_SECRET, GROQ_API_KEY, GEMINI_API_KEY
npm run dev
```

### 3. Frontend Setup
```bash
cd ../client
npm install
cp .env.example .env
# Edit .env with VITE_API_URL=http://localhost:5000
npm run dev
```

---

## 📡 Environment Variables

### Backend (`server/.env`)
```env
PORT=5000
CLIENT_URL=http://localhost:5173
MONGO_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/CollegeSphere
JWT_SECRET=your_jwt_secret_key_here

# AI Agent API Keys
GROQ_API_KEY=gsk_your_groq_api_key
GEMINI_API_KEY=AIzaSy_your_gemini_api_key
```

### Frontend (`client/.env`)
```env
VITE_API_URL=http://localhost:5000
```

---

## 📡 API Endpoints Specification

### Authentication (`/api/auth`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/api/auth/send-otp` | Public | Send verification OTP to email |
| POST | `/api/auth/register` | Public | Register new student or organizer |
| POST | `/api/auth/login` | Public | Authenticate user & get token |
| GET | `/api/auth/google` | Public | Initiate Google OAuth 2.0 flow |
| GET | `/api/auth/profile` | Protected | Get current user profile details |
| PUT | `/api/auth/profile` | Protected | Update profile name and password |

### Event Registrations (`/api/registration`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/api/registration/register` | Student | Register student for an event (solo/team) |
| GET | `/api/registration/my-registrations` | Student | List all bookings for current student |
| DELETE | `/api/registration/cancel/:id` | Student | Cancel student registration |

### Events Management (`/api/event`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/api/event/all` | Public | List all approved, non-deleted events |
| GET | `/api/event/college/:collegeId` | Public | List events by college ID |
| POST | `/api/event/create` | Organizer/Admin | Create a new event draft |
| DELETE | `/api/event/:eventId` | Organizer/Admin | Soft-delete an event |

### College Admin (`/api/admin`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/api/admin/organizers/pending` | College Admin | List pending organizers for college |
| PUT | `/api/admin/organizers/:id/approve` | College Admin | Approve organizer account |
| PUT | `/api/admin/organizers/:id/reject` | College Admin | Reject organizer account |
| GET | `/api/admin/events/pending` | College Admin | List pending events for college |
| PUT | `/api/admin/events/:id/approve` | College Admin | Approve & publish event |
| DELETE | `/api/admin/events/:id/reject` | College Admin | Reject event draft |

### System Super Admin (`/api/superadmin`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/api/superadmin/stats` | SuperAdmin | System-wide health & DB metrics |
| GET | `/api/superadmin/users` | SuperAdmin | List all platform users across roles |
| PUT | `/api/superadmin/users/:id/role` | SuperAdmin | Assign or change user role |
| POST | `/api/superadmin/colleges` | SuperAdmin | Create new college institution |
| PUT | `/api/superadmin/colleges/:id/verify` | SuperAdmin | Toggle college verification status |
| DELETE | `/api/superadmin/colleges/:id` | SuperAdmin | Delete college institution |
| GET | `/api/superadmin/events/deleted` | SuperAdmin | List soft-deleted events (Trash Bin) |
| PUT | `/api/superadmin/events/:id/restore` | SuperAdmin | Restore soft-deleted event |
| DELETE | `/api/superadmin/events/:id/permanent` | SuperAdmin | Permanently delete event record |

### SphereAI Agent (`/api/ai`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/api/ai/chat` | Protected | Interactive LLM chat with tool calling & confirmation cards |


---

## 📁 Project Structure

```
CollegeSphere/
├── server/
│   ├── config/              # Database & Passport OAuth setup
│   ├── controllers/         # Auth, Event, Admin, SuperAdmin, AI controllers
│   ├── middleware/          # JWT Protection & Role Authorization
│   ├── modals/              # Mongoose Schemas (User, Event, College, Registration)
│   ├── routes/              # Express Routers (/api/auth, /api/event, /api/superadmin, /api/ai)
│   ├── services/            # ai.service.js (Groq, Gemini, Fallback Engine)
│   ├── tools/               # ai.tools.js (Role-based Tool Handlers)
│   ├── server.js            # Express Entry Point
│   └── .env.example
│
├── client/
│   ├── src/
│   │   ├── api/             # Axios instance & Interceptors
│   │   ├── components/      # AIChatWidget, ConfirmationCard, UI Components
│   │   ├── pages/           # Student, Organizer, Admin, SuperAdmin Dashboards, Landing, Login, Register
│   │   ├── App.jsx          # Router & Dashboard Routes
│   │   └── main.jsx
│   └── .env.example
│
└── README.md
```

---

## 📄 License & Author

Distributed under the **MIT License**.

**Author**: [Siva](https://github.com/Siva-2517)

<p align="center">
  Built with ❤️ for Seamless College Event Governance
</p>
