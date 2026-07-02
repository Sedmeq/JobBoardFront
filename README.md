<div align="center">

# 🧑‍💼 JobBoard — Frontend

**A feature-rich Job Portal built with Vanilla JavaScript, jQuery & SignalR**

[![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/HTML)
[![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/CSS)
[![JavaScript](https://img.shields.io/badge/JavaScript-ES6-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![jQuery](https://img.shields.io/badge/jQuery-3.x-0769AD?style=for-the-badge&logo=jquery)](https://jquery.com/)
[![SignalR](https://img.shields.io/badge/SignalR-Real--time-00AFF0?style=for-the-badge)](https://dotnet.microsoft.com/apps/aspnet/signalr)
[![Stripe](https://img.shields.io/badge/Stripe-Payments-008CDD?style=for-the-badge&logo=stripe)](https://stripe.com/)
[![Google OAuth](https://img.shields.io/badge/Google-OAuth_2.0-4285F4?style=for-the-badge&logo=google)](https://developers.google.com/identity)

[![Backend Repo](https://img.shields.io/badge/Backend-JobBoard.Core-6366f1?style=for-the-badge&logo=github)](https://github.com/Sedmeq/JobBoard)

</div>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Project Structure](#-project-structure)
- [Pages & Features](#-pages--features)
- [Architecture](#-architecture)
- [Getting Started](#-getting-started)
- [Configuration](#-configuration)
- [Key Technical Details](#-key-technical-details)

---

## 🌐 Overview

JobBoard Frontend is a multi-page application (MPA) for a full-featured job portal. It connects to the [JobBoard REST API](https://github.com/Sedmeq/JobBoard.Core) and covers three complete user dashboards — **Candidate**, **Employer**, and **Admin** — along with a public-facing site with job browsing, company listings, blog, and more.

Built without a frontend framework, the project uses a centralized **API Client** with automatic JWT token refresh, **SignalR** for real-time notifications and chat, and **Google OAuth 2.0** for social login.

---

## 📁 Project Structure

```
xhtml/
├── index.html                    # Homepage
│
├── 🔐 Auth
│   ├── login-3.html
│   ├── register-3.html
│   └── reset-password.html
│
├── 💼 Jobs
│   ├── browse-job-grid.html       # Grid view with filters
│   ├── browse-job-list.html       # List view with filters
│   ├── browse-job-filter-grid.html
│   ├── browse-job-filter-list.html
│   ├── job-detail.html            # Single job page
│   ├── category-jobs.html         # Jobs by category
│   ├── category-location-jobs.html
│   └── category-skill-jobs.html
│
├── 🧑 Candidate Dashboard
│   ├── jobs-profile.html          # Profile settings
│   ├── jobs-my-resume.html        # Resume editor
│   ├── jobs-cv-manager.html       # CV file upload
│   ├── jobs-applied-job.html      # Applied jobs
│   ├── jobs-saved-jobs.html       # Saved/bookmarked jobs
│   ├── jobs-alerts.html           # Job alerts management
│   ├── jobs-change-password.html
│   ├── cv-analyzer.html           # AI CV Analyzer (paid)
│   └── cv-view.html               # Public CV view
│
├── 🏢 Employer Dashboard
│   ├── company-profile.html       # Company profile editor
│   ├── company-post-jobs.html     # Post / edit a job
│   ├── company-manage-job.html    # Manage posted jobs
│   ├── company-applicants.html    # View applicants
│   ├── company-resume.html        # View candidate resume
│   ├── company-transactions.html  # Payment history
│   └── chat.html                  # Chat with candidates
│
├── 🛡 Admin Panel
│   ├── admin-dashboard.html       # Stats overview
│   ├── admin-users.html           # User management
│   ├── admin-companies.html       # Company verification
│   ├── admin-jobs.html            # Job moderation
│   ├── admin-blog.html            # Blog CMS
│   ├── admin-categories.html      # Job categories
│   ├── admin-transactions.html    # Transactions
│   ├── admin-messages.html        # Contact inbox
│   ├── admin-partners.html        # Homepage partners
│   ├── admin-testimonials.html    # Testimonials
│   └── admin-settings.html        # Site settings
│
├── 🌍 Public Pages
│   ├── companies.html             # Company directory
│   ├── company-profile.html       # Company public profile
│   ├── browse-candidates.html     # Candidate directory
│   ├── blog-classic.html          # Blog listing
│   ├── blog-details.html          # Blog post
│   ├── about-us.html
│   ├── contact.html
│   ├── free-job-alerts.html
│   └── error-404.html
│
├── 📦 Assets
│   ├── css/                       # Stylesheets
│   ├── js/
│   │   ├── custom.js              # UI interactions
│   │   ├── headerAndFooter.js     # Header/footer loader
│   │   └── script/                # Per-page feature scripts
│   ├── components/
│   │   ├── header.html            # Shared header (loaded dynamically)
│   │   └── footer.html            # Shared footer
│   ├── images/
│   └── plugins/
```

---

## 📄 Pages & Features

### 🔐 Authentication

| Page | File | Features |
|------|------|---------|
| Login | `login-3.html` | Email/password login, Google OAuth, forgot password, "Remember me", role-based redirect, session expiry notice |
| Register | `register-3.html` | Candidate/Employer registration, real-time password strength meter, confirm password match, field-level validation, email verification flow |
| Reset Password | `reset-password.html` | Token-based password reset via email link |

**Auth flow:**
- On login, `accessToken` + `refreshToken` + `user` object are saved to `localStorage`
- Role-based redirect: `admin` → dashboard, `employer` → company profile, `candidate` → homepage
- `api-client.js` automatically intercepts `401` responses and silently refreshes the access token
- Session expiry redirects to `login-3.html?expired=true`

---

### 💼 Job Browsing

| Page | Features |
|------|---------|
| `browse-job-grid.html` | Filter by keyword, location, category, type, salary range; pagination; save/unsave jobs |
| `browse-job-list.html` | Same as grid, list layout |
| `job-detail.html` | Full job info, required skills, company snippet, apply button, save toggle, related jobs |
| `category-jobs.html` | Jobs filtered by category slug |
| `category-location-jobs.html` | Jobs filtered by location |
| `category-skill-jobs.html` | Jobs filtered by skill |

---

### 🧑 Candidate Dashboard

| Page | Features |
|------|---------|
| `jobs-profile.html` | Edit name, avatar, headline, location, summary, skills, languages, work experience, education |
| `jobs-my-resume.html` | Full resume editor (experience, education, skills, languages, portfolio) |
| `jobs-cv-manager.html` | Upload / replace / delete CV file (PDF, DOCX) |
| `jobs-applied-job.html` | View all applications with status badges (pending, shortlisted, interview, offered, rejected), withdraw option |
| `jobs-saved-jobs.html` | Bookmarked jobs with unsave action |
| `jobs-alerts.html` | Create/edit/delete job alert saved searches, toggle active/inactive |
| `cv-analyzer.html` | **AI-powered CV analysis** (see below) |
| `cv-view.html` | Public view of the candidate's generated CV |

---

### 🤖 AI CV Analyzer

The `cv-analyzer.html` page is the most complex feature on the frontend:

- Checks access status via `GET /api/cv-analyzer/status`
- **Free** for admins, **paid** ($4.99 one-time) for candidates/employers
- If no access → shows Stripe Checkout paywall button
- After payment, Stripe redirects back with `?session_id=...` → frontend calls `/confirm` → unlocks access
- If access granted:
  - Auto-prefills CV text from the candidate's profile data
  - Supports manual text entry in the textarea
  - Supports **file upload** (PDF, DOCX, TXT — max 10 MB)
  - Returns a structured AI analysis with score, weaknesses, and recommendations
  - Analysis renders in a dedicated result panel with scroll animation

---

### 🏢 Employer Dashboard

| Page | Features |
|------|---------|
| `company-profile.html` | Edit company name, description, industry, size, website, logo & cover image upload |
| `company-post-jobs.html` | Create new job or edit existing (title, description, requirements, salary, type, category, skills) |
| `company-manage-job.html` | List all posted jobs, change status (active/closed/draft), delete |
| `company-applicants.html` | View all applicants across all jobs, filter by status, update application status, open chat |
| `company-resume.html` | View a specific candidate's full resume/profile |
| `company-transactions.html` | View payment/transaction history |
| `chat.html` | Real-time chat with candidates (see below) |

---

### 💬 Real-time Chat

The `chat.html` page provides a WhatsApp-style chat interface:

- Left panel: conversation list with avatar, last message, and unread badge
- Right panel: message bubbles (mine / theirs), timestamps
- Messages sent via `POST /api/chats/{id}/messages`
- **SignalR** events: `ReceiveChatMessage` (instant delivery), `ChatClosed` (status update)
- Employer can end a conversation with the "End Chat" button
- Closed conversations disable the input field and show a notice
- Mobile-responsive: tapping a conversation slides in the message panel; back button returns to list

---

### 🔔 Real-time Notifications

Notifications are available on **every page** via the shared header:

- Bell icon with unread count badge
- Dropdown panel with notification list, timestamps, and "Mark all as read"
- Uses **SignalR** (`ReceiveNotification` event) for instant push delivery
- Falls back gracefully if SignalR connection fails
- Clicking a notification marks it as read and navigates to `actionUrl` if set
- Hidden automatically for unauthenticated users

---

### 🛡 Admin Panel

| Page | Features |
|------|---------|
| `admin-dashboard.html` | Total users, jobs, applications, companies, new users this month, monthly revenue, jobs by status chart, top categories |
| `admin-users.html` | List/filter users, activate/deactivate, ban/unban |
| `admin-companies.html` | List companies, verify (triggers email to employer + notification) |
| `admin-jobs.html` | Browse all jobs, toggle featured, soft-delete |
| `admin-blog.html` | Create/edit/delete blog posts with image upload, manage comments |
| `admin-categories.html` | Add/edit/delete job categories |
| `admin-transactions.html` | View all platform transactions |
| `admin-messages.html` | Contact inbox, mark as read, reply (sends email to user) |
| `admin-partners.html` | Manage homepage partner logos |
| `admin-testimonials.html` | Manage homepage testimonials |
| `admin-settings.html` | Update site-wide key-value settings |

---

### 🌍 Public Pages

| Page | Features |
|------|---------|
| `companies.html` | Company directory with search and filter |
| `company-profile.html` | Public company page with jobs, reviews, stats |
| `browse-candidates.html` | Candidate directory for employers |
| `blog-classic.html` / `blog-details.html` | Blog listing and detailed post with threaded comments |
| `contact.html` | Contact form with Google reCAPTCHA v2, newsletter subscribe |
| `free-job-alerts.html` | Newsletter subscription landing page |
| `index.html` | Homepage: featured jobs, top categories, partner logos, testimonials, stats |

---

## 🏗 Architecture

### Centralized API Client (`api-client.js`)

All HTTP requests go through a single `apiFetch()` function:

```javascript
apiFetch('/jobs', { method: 'GET' })
apiFetch('/applications', { method: 'POST', body: JSON.stringify(data) })
```

It automatically:
1. Prepends `API_BASE_URL` to relative paths
2. Injects the `Authorization: Bearer <token>` header
3. Sets `Content-Type: application/json` (skips for `FormData`)
4. On `401` — silently calls `/auth/refresh`, saves new tokens, and retries the original request
5. On failed refresh — clears `localStorage` and redirects to `login-3.html?expired=true`

### Shared Header & Footer

`headerAndFooter.js` dynamically fetches and injects `components/header.html` and `components/footer.html` into every page. The notification system (`notifications.js`) initializes inside the shared header automatically.

### Token Storage

| Key | Value |
|-----|-------|
| `accessToken` | JWT access token (15-min expiry) |
| `refreshToken` | Refresh token (7-day expiry) |
| `user` | `{ id, fullName, email, role, avatarUrl }` |
| `rememberMe` | `"true"` if checked at login |

---

## 🚀 Getting Started

### Prerequisites

- Any static file server (VS Code **Live Server** extension recommended)
- The [JobBoard API](https://github.com/Sedmeq/JobBoard.Core) running locally

### 1. Clone the repository

```bash
git clone https://github.com/Sedmeq/JobBoardFront.git
cd JobBoardFront
```

### 2. Configure the API URL

Open `js/script/api-client.js` and set your backend address:

```javascript
var API_BASE_URL = 'https://localhost:7135/api';
```

### 3. Configure Google OAuth

Copy the sample config and fill in your Client ID:

```bash
cp js/script/google-config.sample.js js/script/google-config.js
```

Edit `google-config.js`:

```javascript
var GOOGLE_CLIENT_ID = "your-client-id.apps.googleusercontent.com";
```

> ⚠️ `google-config.js` is in `.gitignore` and will not be committed.

### 4. Serve the project

Using VS Code Live Server:
1. Right-click `index.html` → **Open with Live Server**
2. Site will be available at `http://127.0.0.1:5500`

Or any other static server:
```bash
npx serve .
# or
python -m http.server 5500
```

### 5. Default accounts (after backend seed)

| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@jobboard.com` | *(see backend .env)* |

---

## ⚙️ Configuration

| File | Purpose |
|------|---------|
| `js/script/api-client.js` | `API_BASE_URL` — backend base URL |
| `js/script/google-config.js` | `GOOGLE_CLIENT_ID` — Google OAuth client ID |

Both files are the only configuration needed. Everything else (JWT handling, token refresh, SignalR hub URL) is derived automatically from `API_BASE_URL`.

**SignalR hub URL** is derived automatically:
```javascript
// api-client.js → API_BASE_URL = 'https://localhost:7135/api'
// SignalR hub   → 'https://localhost:7135/hubs/notifications'
```

---

## 🔑 Key Technical Details

### Password Validation (Register)
Client-side enforces the same rules as the backend:
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one digit
- At least one special character (`!@#$%^&*...`)

Real-time strength bar (weak / medium / strong) provides visual feedback.

### Role-based UI
After login, the `user.role` from `localStorage` controls:
- Which navigation items are visible
- Which pages redirect away if accessed without correct role
- Admin badge / free CV analyzer access

### File Uploads
Uses `FormData` — the API client automatically skips the `Content-Type` header so the browser sets it with the correct multipart boundary.

### SignalR Authentication
SignalR hub connection passes the JWT via query string (WebSocket headers are not supported by browsers):
```javascript
new signalR.HubConnectionBuilder()
    .withUrl(hubUrl, {
        accessTokenFactory: () => localStorage.getItem('accessToken')
    })
    .withAutomaticReconnect()
    .build();
```

---

<div align="center">

Built with ❤️ using **Vanilla JS** · **jQuery** · **SignalR** · **Stripe** · **Google OAuth**

🔗 **Backend API:** [github.com/Sedmeq/JobBoard.Core](https://github.com/Sedmeq/JobBoard)

</div>
