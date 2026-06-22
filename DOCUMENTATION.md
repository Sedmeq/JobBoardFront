# JobBoard Backend API Dokumentasyon

**Sürüm:** 1.0.0  
**Framework:** .NET 8  
**Database:** SQL Server  
**Authentication:** JWT (JSON Web Tokens)  
**API Format:** RESTful JSON  

---

## 📋 İçindəkilər

1. [Sistem Arxitekturası](#sistem-arxitekturası)
2. [Database Şeması](#database-şeması)
3. [API Endpoints](#api-endpoints)
4. [Authentication & Authorization](#authentication--authorization)
5. [Error Handling](#error-handling)
6. [Data Transfer Objects (DTOs)](#data-transfer-objects-dtos)
7. [Kurulum & Konfigürasyon](#kurulum--konfigürasyon)
8. [Frontend İnteqrasyon](#frontend-inteqrasyon)

---

## 🏗️ Sistem Arxitekturası

Backend 4 ana layerə bölünmüşdür:

```
JobBoard.API (Presentation Layer)
    ↓
JobBoard.Core (Domain Layer - Entities, Interfaces, DTOs)
    ↓
JobBoard.Infrastructure (Data Access Layer - Services, Database)
    ↓
JobBoard.Application (Business Logic Layer - Validators)
```

### Layerlərin Məsuliyyətləri

#### 1️⃣ **JobBoard.API** (Presentation)
- HTTP endpoints (Controllers)
- Request/Response işləməsi
- Middleware (Exception handling, Authentication)
- Rate limiting
- CORS policy

#### 2️⃣ **JobBoard.Core** (Domain)
- **Entities:** Database model'ləri
- **Interfaces:** Service kontraktları
- **DTOs:** Data transfer object'ləri
- **Settings:** Configuration class'ları
- **Exceptions:** Custom exception'lar

#### 3️⃣ **JobBoard.Infrastructure** (Data Access)
- **Services:** Business logic implementasiyası
- **Data:** Database context ve migrations
- **Migrations:** EF Core migrations

#### 4️⃣ **JobBoard.Application** (Business Logic)
- **Validators:** FluentValidation validators

---

## 📊 Database Şeması

### Əsas Entitylər

#### **1. User (Istifadəçi)**
```csharp
// Üç rol mövcuddur: candidate, employer, admin
Id              → Primary Key
FullName        → Ad-Soyad
Email           → Unikal email (soft-delete filter ilə)
PasswordHash    → BCrypt ilə hashlənmiş şifrə
Role            → candidate | employer | admin
AvatarUrl       → Profil şəkili
Phone           → Telefon nömrəsi
IsEmailVerified → Email doğrulanmışmı?
IsActive        → Aktiv hesab?
IsDeleted       → Soft delete flag
RefreshToken    → JWT refresh token'ı
CreatedAt       → Yaradılış tarixi
UpdatedAt       → Yenilənmə tarixi
```

**Related Entities:**
- `CandidateProfile` → Namizəd profili
- `Company` → Şirkət profili
- `SavedJob` → Yadda saxlanmış iş elanları
- `JobApplication` → İş müraciətləri
- `JobAlert` → İş bildirişləri
- `Transaction` → Ödəniş əməliyyatları

---

#### **2. Job (İş Elanı)**
```csharp
Id                  → Primary Key
CompanyId           → Şirkətin ID'si
CategoryId          → Kateqoriyanın ID'si
Title               → İş başlığı
Slug                → URL-friendly versiya (unikal)
Description         → Təsvir
Requirements        → Tələblər
Responsibilities    → Məsuliyyətlər
Benefits            → Üstünlüklər
Location            → Yerləşmə
IsRemote            → Uzaqdan iş?
JobType             → Full-time | Part-time | Contract | Internship
ExperienceLevel     → Junior | Mid | Senior
SalaryMin           → Minimum maaş
SalaryMax           → Maksimum maaş
SalaryCurrency      → Valyuta (USD, EUR, AZN...)
IsSalaryVisible     → Maaş göstərilsin mi?
Status              → active | closed | draft
IsFeatured          → Ön plana çıxarılmış?
IsUrgent            → Fövqəladı?
IsDeleted           → Soft delete flag
Deadline            → Son müraciət tarixi
ViewCount           → Baxış sayı
CreatedAt           → Yaradılış tarixi
UpdatedAt           → Yenilənmə tarixi
```

**Related Entities:**
- `Company` → İlanı yerləşdirən şirkət
- `Category` → İş kateqoriyası
- `JobSkill` → Tələb olunan bacarıqlar
- `JobApplication` → Müraciətlər
- `SavedJob` → Yadda saxlamalar

---

#### **3. Company (Şirkət)**
```csharp
Id                  → Primary Key
UserId              → Şirkət sahibinin User ID'si
Name                → Şirkət adı
LogoUrl             → Logo şəkili
CoverImageUrl       → Fon şəkili
Description         → Şirkət haqqında
Industry            → Sənaye sahəsi
CompanySize         → Şirkət ölçüsü (1-10, 11-50...)
Website             → Veb sayt
Location            → Əsas ofis yeri
Phone               → Telefon
Email               → Email
FoundedYear         → Təsisil tarixi
IsVerified          → Təsdiq olunmuş?
SocialFacebook      → Facebook link
SocialTwitter       → Twitter link
SocialLinkedIn      → LinkedIn link
CreatedAt           → Yaradılış tarixi
UpdatedAt           → Yenilənmə tarixi
```

**Related Entities:**
- `User` → Şirkət sahibi
- `Job` → Şirkətin iş elanları
- `CompanyReview` → Şirkət rəyləri

---

#### **4. CandidateProfile (Namizəd Profili)**
```csharp
Id                  → Primary Key
UserId              → Namizədin User ID'si
Headline            → Başlıq (məs: "Full Stack Developer")
Summary             → Xülasə/Bio
Location            → Yerləşmə
Website             → Şəxsi veb sayt
LinkedInUrl         → LinkedIn profili
GithubUrl           → GitHub profili
ExperienceYears     → Təcrübə illəri
CurrentPosition     → Cari mövqe
ExpectedSalary      → Gözlənilən maaş
IsAvailable         → İş axtarışında mı?
ResumeUrl           → CV/Resume faylı
VideoResumeUrl      → Video CV (opsional)
```

**Related Entities:**
- `User` → Namizəd
- `CandidateSkill` → Bacarıqlar
- `WorkExperience` → İş təcrübəsi
- `Education` → Təhsil
- `Portfolio` → Portfolio proyektləri
- `CandidateLanguage` → Dil biliyi

---

#### **5. JobApplication (İş Müraciəti)**
```csharp
Id                  → Primary Key
JobId               → İş elanının ID'si
CandidateId         → Namizədin User ID'si
ApplicantName       → Müraciətçinin adı
ApplicantEmail      → Müraciətçinin emaili
CoverLetter         → Müraciət məktubu
Resume              → CV/Resume
Status              → applied | reviewing | shortlisted | rejected | accepted | withdrawn
Rating              → Dəyərlendirmə (1-5)
Notes               → Qeydlər
CreatedAt           → Müraciət tarixi
UpdatedAt           → Yenilənmə tarixi
```

---

#### **6. BlogPost (Bloqun Məqaləsi)**
```csharp
Id                  → Primary Key
AuthorId            → Müəllifin User ID'si (admin)
Title               → Başlıq
Slug                → URL-friendly versiya
Content             → Məqalə mətni (HTML)
Summary             → Qısa xülasə
FeaturedImageUrl    → Ön şəkil
Category            → Kateqoriya
Tags                → Teqlər
ViewCount           → Baxış sayı
IsPublished         → Dərc olunmuş?
IsDeleted           → Soft delete flag
PublishedAt         → Dərc tarixi
CreatedAt           → Yaradılış tarixi
UpdatedAt           → Yenilənmə tarixi
```

---

#### **7. Transaction (Ödəniş Əməliyyatı)**
```csharp
Id                  → Primary Key
UserId              → İstifadəçinin User ID'si
PlanId              → Seçilən plan
Amount              → Məbləğ
Currency            → Valyuta
Status              → pending | processing | completed | failed | refunded
TransactionType     → job_posting | featured_job | premium_subscription
PaymentMethod       → card | bank_transfer
OrderId             → Sifariş ID'si (payment gateway'dən)
CardLast4           → Kartın son 4 rəqəmi
ExpiryMonth         → Kartın son işlənmə ayı
ExpiryYear          → Kartın son işlənmə ili
CreatedAt           → Yaradılış tarixi
UpdatedAt           → Yenilənmə tarixi
```

---

### Relational Diagram
```
User (1) ─── (1) CandidateProfile
       │       └─ WorkExperience
       │       └─ Education
       │       └─ CandidateSkill
       │       └─ Portfolio
       │
       ├─── (1) Company ─── (M) Job ─── (M) JobApplication
       │                          │           └─ Candidate
       │                          ├─ JobSkill
       │                          └─ SavedJob
       │
       ├─── (M) JobApplication
       │
       ├─── (M) SavedJob ───────────── Job
       │
       ├─── (M) JobAlert
       │
       ├─── (M) Transaction
       │
       └─── (M) BlogComment

BlogPost (1) ─── (M) BlogComment ─── User
```

---

## 🔌 API Endpoints

### Base URL
```
https://localhost:5001/api
```

---

### 🔐 **AUTH Endpoints** (`/api/auth`)

#### 1. Qeydiyyat (Register)
```http
POST /api/auth/register
Content-Type: application/json

{
  "fullName": "Hüseyn Hüseynov",
  "email": "huseyn@example.com",
  "password": "SecurePass123!",
  "confirmPassword": "SecurePass123!",
  "role": "candidate"  // veya "employer"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "message": "Doğrulama emaili göndərildi. Zəhmət olmasa emailinizi yoxlayın."
}
```

**Mümkün Hatalar:**
- `409` - Email artıq istifadə olunur
- `400` - Daxil edilən məlumatlar yanlış

---

#### 2. Giriş (Login)
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "huseyn@example.com",
  "password": "SecurePass123!",
  "rememberMe": false
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
    "expiresIn": 900,  // saniyə (15 dəqiqə)
    "user": {
      "id": 1,
      "fullName": "Hüseyn Hüseynov",
      "email": "huseyn@example.com",
      "role": "candidate",
      "avatarUrl": null
    }
  }
}
```

**Mümkün Hatalar:**
- `401` - Email/şifrə yanlış
- `401` - Email doğrulanmamış

---

#### 3. Token Yenilə (Refresh)
```http
POST /api/auth/refresh
Content-Type: application/json

{
  "refreshToken": "f47ac10b-58cc-4372-a567-0e02b2c3d479"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "a12bc34d-efgh-5678-ijkl-9mnopqrs1234",
    "expiresIn": 900
  }
}
```

---

#### 4. Email Doğrulama (Verify)
```http
GET /api/auth/verify-email?token=abc123def456
```

**Response:** Redirect ediir `http://localhost:3000/login?verified=true`

---

#### 5. Şifrə Sıfırlama İsteyi (Forgot Password)
```http
POST /api/auth/forgot-password
Content-Type: application/json

{
  "email": "huseyn@example.com"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Əgər bu email mövcuddursa, sıfırlama linki göndərildi."
}
```

---

#### 6. Şifrə Sıfırlama (Reset Password)
```http
POST /api/auth/reset-password
Content-Type: application/json
Authorization: Bearer {accessToken}

{
  "token": "reset-token",
  "newPassword": "NewSecurePass123!",
  "confirmPassword": "NewSecurePass123!"
}
```

---

#### 7. Çıxış (Logout)
```http
POST /api/auth/logout
Content-Type: application/json
Authorization: Bearer {accessToken}

{
  "refreshToken": "f47ac10b-58cc-4372-a567-0e02b2c3d479"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Uğurla çıxış edildi."
}
```

---

### 💼 **JOBS Endpoints** (`/api/jobs`)

#### 1. İş Elanları Siyahısı (Get All Jobs)
```http
GET /api/jobs?keyword=developer&location=Baku&categoryId=1&jobType=Full-time&salary_min=1000&salary_max=5000&isRemote=true&page=1&pageSize=10&sortBy=newest
```

**Query Parameters:**
| Parametr | Tip | Təsvir |
|----------|-----|--------|
| `keyword` | string | Axtarış sözü |
| `location` | string | Yerləşmə |
| `categoryId` | int | Kateqoriya ID'si |
| `jobType` | string | İş tipi (Full-time, Part-time...) |
| `experienceLevel` | string | Təcrübə səviyyəsi |
| `isRemote` | bool | Uzaqdan iş? |
| `isFeatured` | bool | Ön plana çıxarılmış? |
| `isUrgent` | bool | Fövqəladı? |
| `companyId` | int | Şirkət ID'si |
| `salary_min` | decimal | Minimum maaş |
| `salary_max` | decimal | Maksimum maaş |
| `sortBy` | string | newest, oldest, salary_asc, salary_desc |
| `page` | int | Səhifə nömrəsi (default: 1) |
| `pageSize` | int | Səhifə ölçüsü (max: 50) |

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": 1,
        "title": "Senior Full Stack Developer",
        "slug": "senior-full-stack-developer",
        "company": {
          "id": 1,
          "name": "TechCorp",
          "logoUrl": "https://..."
        },
        "category": {
          "id": 1,
          "name": "Software Development"
        },
        "location": "Bakı",
        "isRemote": true,
        "jobType": "Full-time",
        "experienceLevel": "Senior",
        "salaryMin": 3000,
        "salaryMax": 5000,
        "salaryCurrency": "USD",
        "isFeatured": true,
        "isUrgent": false,
        "viewCount": 150,
        "deadline": "2025-12-31T23:59:59Z",
        "createdAt": "2025-06-15T10:30:00Z",
        "isSaved": false  // Cari istifadəçi üçün
      }
      // ... daha çox iş elanı
    ],
    "totalCount": 45,
    "pageCount": 5,
    "hasNextPage": true
  }
}
```

---

#### 2. İş Elanı Detayları (Get Job By ID)
```http
GET /api/jobs/1
Authorization: Bearer {accessToken}  // Opsional
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "title": "Senior Full Stack Developer",
    "slug": "senior-full-stack-developer",
    "description": "Detailed job description...",
    "requirements": "Requirements list...",
    "responsibilities": "Responsibilities...",
    "benefits": "Benefits...",
    "company": {
      "id": 1,
      "name": "TechCorp",
      "logoUrl": "https://...",
      "description": "Company description...",
      "website": "https://techcorp.az",
      "location": "Bakı",
      "industry": "Technology",
      "isVerified": true
    },
    "category": {
      "id": 1,
      "name": "Software Development"
    },
    "location": "Bakı",
    "isRemote": true,
    "jobType": "Full-time",
    "experienceLevel": "Senior",
    "salaryMin": 3000,
    "salaryMax": 5000,
    "salaryCurrency": "USD",
    "isSalaryVisible": true,
    "status": "active",
    "isFeatured": true,
    "isUrgent": false,
    "viewCount": 150,
    "deadline": "2025-12-31T23:59:59Z",
    "requiredSkills": [
      {
        "id": 1,
        "skillName": "React"
      },
      {
        "id": 2,
        "skillName": "Node.js"
      }
    ],
    "applicationCount": 25,
    "isSaved": false,
    "hasApplied": false,
    "createdAt": "2025-06-15T10:30:00Z",
    "updatedAt": "2025-06-15T10:30:00Z"
  }
}
```

---

#### 3. İş Elanını Slug-a Görə Əldə Et (Get By Slug)
```http
GET /api/jobs/slug/senior-full-stack-developer
```

Response eyni ilə `GET /api/jobs/{id}`

---

#### 4. Ön Plana Çıxarılmış İş Elanları (Featured Jobs)
```http
GET /api/jobs/featured
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    // Max 10 ön plana çıxarılmış iş elanı
  ]
}
```

---

#### 5. İş Elanı Yaratma (Create Job) ⭐ Admin/Employer
```http
POST /api/jobs
Authorization: Bearer {accessToken}
Content-Type: application/json

{
  "title": "Junior Frontend Developer",
  "description": "Detailed job description...",
  "requirements": "Required skills...",
  "responsibilities": "Responsibilities...",
  "benefits": "Benefits...",
  "location": "Bakı",
  "isRemote": false,
  "jobType": "Full-time",
  "experienceLevel": "Junior",
  "categoryId": 1,
  "salaryMin": 1500,
  "salaryMax": 2500,
  "salaryCurrency": "USD",
  "salaryPeriod": "month",
  "isSalaryVisible": true,
  "isUrgent": false,
  "deadline": "2025-12-31T23:59:59Z",
  "requiredSkills": ["React", "JavaScript", "CSS"]
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "message": "İş elanı yaradıldı.",
  "data": {
    "id": 5,
    "title": "Junior Frontend Developer",
    // ... tam iş elanı detayları
  }
}
```

---

#### 6. İş Elanını Yenilə (Update Job) ⭐ Admin/Employer
```http
PUT /api/jobs/1
Authorization: Bearer {accessToken}
Content-Type: application/json

{
  // Eyni request body ilə Create endpoint'ində
}
```

---

#### 7. İş Elanını Sil (Delete Job) ⭐ Admin/Employer
```http
DELETE /api/jobs/1
Authorization: Bearer {accessToken}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "İş elanı silindi."
}
```

---

#### 8. İş Elanı Statusunu Dəyiş (Update Status) ⭐ Admin/Employer
```http
PATCH /api/jobs/1/status
Authorization: Bearer {accessToken}
Content-Type: application/json

{
  "status": "closed"  // active, closed, draft
}
```

---

#### 9. İş Elanını Ön Plana Çıxart (Featured) ⭐ Admin
```http
PATCH /api/jobs/1/featured
Authorization: Bearer {accessToken}
Content-Type: application/json

{
  "isFeatured": true
}
```

---

#### 10. Mənim İş Elanlarım (My Jobs) ⭐ Employer
```http
GET /api/jobs/my?status=active&page=1&pageSize=10
Authorization: Bearer {accessToken}
```

---

### 📋 **APPLICATIONS Endpoints** (`/api/applications`)

#### 1. Müraciət Yaratma (Apply for Job) ⭐ Candidate
```http
POST /api/applications
Authorization: Bearer {accessToken}
Content-Type: application/json

{
  "jobId": 1,
  "coverLetter": "I am interested in this position because..."
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "message": "Müraciətiniz göndərildi.",
  "data": {
    "id": 1,
    "jobId": 1,
    "jobTitle": "Senior Full Stack Developer",
    "candidateId": 5,
    "candidateName": "Hüseyn Hüseynov",
    "status": "applied",
    "createdAt": "2025-06-15T10:30:00Z"
  }
}
```

---

#### 2. Mənim Müraciətlərim (My Applications) ⭐ Candidate
```http
GET /api/applications/my?status=applied&page=1&pageSize=10
Authorization: Bearer {accessToken}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": 1,
        "jobId": 1,
        "jobTitle": "Senior Full Stack Developer",
        "company": {
          "id": 1,
          "name": "TechCorp",
          "logoUrl": "https://..."
        },
        "status": "applied",
        "createdAt": "2025-06-15T10:30:00Z"
      }
    ],
    "totalCount": 3,
    "pageCount": 1,
    "hasNextPage": false
  }
}
```

---

#### 3. Müraciət Detayları (Get Application)
```http
GET /api/applications/1
Authorization: Bearer {accessToken}
```

---

#### 4. Müraciət Statusunu Yenilə (Update Status) ⭐ Employer
```http
PATCH /api/applications/1/status
Authorization: Bearer {accessToken}
Content-Type: application/json

{
  "status": "shortlisted",  // applied, reviewing, shortlisted, rejected, accepted
  "notes": "Qualified candidate, schedule interview"
}
```

---

#### 5. Müraciəti Geri Çək (Withdraw) ⭐ Candidate
```http
PATCH /api/applications/1/withdraw
Authorization: Bearer {accessToken}
```

---

#### 6. Müraciət Statistikası (Stats) ⭐ Employer
```http
GET /api/applications/stats
Authorization: Bearer {accessToken}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "totalApplications": 150,
    "appliedCount": 50,
    "reviewingCount": 30,
    "shortlistedCount": 20,
    "acceptedCount": 10,
    "rejectedCount": 40,
    "withdrawnCount": 0
  }
}
```

---

### 👥 **CANDIDATES Endpoints** (`/api/candidates`)

#### 1. Namizədlər Siyahısı (Get Candidates) ⭐ Employer
```http
GET /api/candidates?keyword=developer&experience=5&page=1&pageSize=10
Authorization: Bearer {accessToken}
Roles: employer, admin
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": 1,
        "userId": 1,
        "fullName": "Hüseyn Hüseynov",
        "email": "huseyn@example.com",
        "headline": "Full Stack Developer",
        "location": "Bakı",
        "experienceYears": 5,
        "avatarUrl": "https://...",
        "currentPosition": "Senior Developer at TechCorp"
      }
    ],
    "totalCount": 45,
    "pageCount": 5,
    "hasNextPage": true
  }
}
```

---

#### 2. Namizəd Profili (Get Candidate Profile)
```http
GET /api/candidates/1
Authorization: Bearer {accessToken}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "userId": 1,
    "fullName": "Hüseyn Hüseynov",
    "email": "huseyn@example.com",
    "avatarUrl": "https://...",
    "headline": "Full Stack Developer",
    "summary": "Experienced developer with 5 years...",
    "location": "Bakı",
    "website": "https://huseyn.dev",
    "linkedInUrl": "https://linkedin.com/in/huseyn",
    "githubUrl": "https://github.com/huseyn",
    "experienceYears": 5,
    "currentPosition": "Senior Developer",
    "expectedSalary": "3000-5000",
    "isAvailable": true,
    "resumeUrl": "https://...",
    "videoResumeUrl": null,
    "skills": [
      {
        "id": 1,
        "name": "React",
        "endorsements": 15
      }
    ],
    "workExperiences": [
      {
        "id": 1,
        "company": "TechCorp",
        "position": "Senior Developer",
        "startDate": "2020-01-01T00:00:00Z",
        "endDate": null,
        "isCurrent": true,
        "description": "Lead frontend development..."
      }
    ],
    "educations": [
      {
        "id": 1,
        "institution": "Baku State University",
        "degree": "Bachelor",
        "fieldOfStudy": "Computer Science",
        "startDate": "2015-09-01T00:00:00Z",
        "endDate": "2019-06-01T00:00:00Z"
      }
    ]
  }
}
```

---

#### 3. Mənim Profilim (Get My Profile) ⭐ Candidate
```http
GET /api/candidates/me
Authorization: Bearer {accessToken}
```

---

#### 4. Profili Yenilə (Update Profile) ⭐ Candidate
```http
PUT /api/candidates/me
Authorization: Bearer {accessToken}
Content-Type: application/json

{
  "headline": "Senior Full Stack Developer",
  "summary": "Experienced developer...",
  "location": "Bakı",
  "website": "https://mysite.com",
  "linkedInUrl": "https://linkedin.com/in/me",
  "githubUrl": "https://github.com/me",
  "experienceYears": 5,
  "currentPosition": "Senior Developer",
  "expectedSalary": "4000-6000",
  "isAvailable": true
}
```

---

#### 5. İş Təcrübəsi Əlavə Et (Add Experience) ⭐ Candidate
```http
POST /api/candidates/me/experience
Authorization: Bearer {accessToken}
Content-Type: application/json

{
  "company": "TechCorp",
  "position": "Senior Developer",
  "startDate": "2020-01-01T00:00:00Z",
  "endDate": null,
  "isCurrent": true,
  "description": "Lead frontend development..."
}
```

---

#### 6. İş Təcrübəsini Yenilə (Update Experience) ⭐ Candidate
```http
PUT /api/candidates/me/experience/1
Authorization: Bearer {accessToken}
Content-Type: application/json

{
  // Eyni request body ilə əlavə endpoint'ində
}
```

---

#### 7. İş Təcrübəsini Sil (Delete Experience) ⭐ Candidate
```http
DELETE /api/candidates/me/experience/1
Authorization: Bearer {accessToken}
```

---

#### 8. Təhsil Əlavə Et (Add Education) ⭐ Candidate
```http
POST /api/candidates/me/education
Authorization: Bearer {accessToken}
Content-Type: application/json

{
  "institution": "Baku State University",
  "degree": "Bachelor",
  "fieldOfStudy": "Computer Science",
  "startDate": "2015-09-01T00:00:00Z",
  "endDate": "2019-06-01T00:00:00Z"
}
```

---

#### 9. Bacarıq Əlavə Et (Add Skill) ⭐ Candidate
```http
POST /api/candidates/me/skills
Authorization: Bearer {accessToken}
Content-Type: application/json

{
  "skillName": "React"
}
```

---

#### 10. Portfolio Əlavə Et (Add Portfolio) ⭐ Candidate
```http
POST /api/candidates/me/portfolio
Authorization: Bearer {accessToken}
Content-Type: application/json

{
  "title": "E-Commerce Platform",
  "description": "Full-stack project...",
  "projectUrl": "https://github.com/project",
  "imageUrl": "https://...",
  "technologies": ["React", "Node.js", "MongoDB"]
}
```

---

### 🏢 **COMPANIES Endpoints** (`/api/companies`)

#### 1. Şirkətlər Siyahısı (Get Companies)
```http
GET /api/companies?keyword=tech&industry=Technology&location=Baku&page=1&pageSize=10
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": 1,
        "name": "TechCorp",
        "logoUrl": "https://...",
        "location": "Bakı",
        "industry": "Technology",
        "companySize": "50-100",
        "website": "https://techcorp.az",
        "jobsCount": 15,
        "reviewsCount": 5,
        "avgRating": 4.5,
        "isVerified": true
      }
    ],
    "totalCount": 25,
    "pageCount": 3,
    "hasNextPage": true
  }
}
```

---

#### 2. Şirkət Profili (Get Company)
```http
GET /api/companies/1
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "TechCorp",
    "logoUrl": "https://...",
    "coverImageUrl": "https://...",
    "description": "Leading technology company...",
    "industry": "Technology",
    "companySize": "50-100",
    "website": "https://techcorp.az",
    "location": "Bakı",
    "phone": "+994 50 XXX XX XX",
    "email": "hr@techcorp.az",
    "foundedYear": "2010",
    "isVerified": true,
    "socialFacebook": "https://facebook.com/techcorp",
    "socialTwitter": "https://twitter.com/techcorp",
    "socialLinkedIn": "https://linkedin.com/company/techcorp",
    "activeJobsCount": 15,
    "totalJobsCount": 150,
    "reviews": [
      {
        "id": 1,
        "rating": 5,
        "title": "Great company to work for",
        "comment": "Amazing culture and benefits",
        "authorName": "John Doe",
        "createdAt": "2025-06-15T10:30:00Z"
      }
    ],
    "avgRating": 4.5
  }
}
```

---

#### 3. Mənim Şirkətim (My Company) ⭐ Employer
```http
GET /api/companies/me
Authorization: Bearer {accessToken}
```

---

#### 4. Şirkət Profili Yenilə (Update Company) ⭐ Employer
```http
PUT /api/companies/me
Authorization: Bearer {accessToken}
Content-Type: multipart/form-data

{
  "name": "TechCorp Inc.",
  "description": "Updated description...",
  "industry": "Technology",
  "companySize": "100-500",
  "website": "https://newtechcorp.az",
  "location": "Bakı",
  "phone": "+994 50 XXX XX XX",
  "email": "hr@newtechcorp.az",
  "foundedYear": "2010",
  "socialFacebook": "https://facebook.com/techcorp",
  "socialTwitter": "https://twitter.com/techcorp",
  "socialLinkedIn": "https://linkedin.com/company/techcorp",
  "logo": <file>,
  "coverImage": <file>
}
```

---

#### 5. Şirkət Rəyi Yaratma (Add Review) ⭐ Candidate
```http
POST /api/companies/1/reviews
Authorization: Bearer {accessToken}
Content-Type: application/json

{
  "rating": 5,
  "title": "Great company to work for",
  "comment": "Amazing culture and benefits"
}
```

---

### 📚 **BLOG Endpoints** (`/api/blog`)

#### 1. Məqalələr Siyahısı (Get Posts)
```http
GET /api/blog/posts?keyword=javascript&category=tutorial&page=1&pageSize=10
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": 1,
        "title": "Getting Started with React Hooks",
        "slug": "getting-started-with-react-hooks",
        "summary": "A beginner's guide to React Hooks...",
        "author": {
          "id": 1,
          "fullName": "Admin User"
        },
        "featuredImageUrl": "https://...",
        "category": "Tutorial",
        "tags": ["React", "JavaScript"],
        "viewCount": 500,
        "publishedAt": "2025-06-15T10:30:00Z"
      }
    ],
    "totalCount": 25,
    "pageCount": 3,
    "hasNextPage": true
  }
}
```

---

#### 2. Məqalə Detayları (Get Post By Slug)
```http
GET /api/blog/posts/getting-started-with-react-hooks
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "title": "Getting Started with React Hooks",
    "slug": "getting-started-with-react-hooks",
    "content": "<h1>Getting Started...</h1><p>Lorem ipsum...</p>",
    "summary": "A beginner's guide to React Hooks...",
    "author": {
      "id": 1,
      "fullName": "Admin User",
      "avatarUrl": "https://..."
    },
    "featuredImageUrl": "https://...",
    "category": "Tutorial",
    "tags": ["React", "JavaScript"],
    "viewCount": 500,
    "comments": [
      {
        "id": 1,
        "content": "Great article!",
        "author": {
          "id": 5,
          "fullName": "John Doe"
        },
        "createdAt": "2025-06-15T10:30:00Z"
      }
    ],
    "publishedAt": "2025-06-15T10:30:00Z",
    "createdAt": "2025-06-15T10:30:00Z"
  }
}
```

---

#### 3. Məqalə Yaratma (Create Post) ⭐ Admin
```http
POST /api/blog/posts
Authorization: Bearer {accessToken}
Content-Type: application/json

{
  "title": "Getting Started with React Hooks",
  "content": "<h1>Getting Started...</h1><p>Lorem ipsum...</p>",
  "summary": "A beginner's guide to React Hooks...",
  "category": "Tutorial",
  "tags": ["React", "JavaScript"],
  "featuredImageUrl": "https://..."
}
```

---

#### 4. Məqalə Yenilə (Update Post) ⭐ Admin
```http
PUT /api/blog/posts/1
Authorization: Bearer {accessToken}
Content-Type: application/json

{
  // Eyni request body ilə əlavə endpoint'ində
}
```

---

#### 5. Məqalə Sil (Delete Post) ⭐ Admin
```http
DELETE /api/blog/posts/1
Authorization: Bearer {accessToken}
```

---

#### 6. Şərh Əlavə Et (Add Comment) ⭐ Authenticated
```http
POST /api/blog/posts/1/comments
Authorization: Bearer {accessToken}
Content-Type: application/json

{
  "content": "Great article, thanks for sharing!"
}
```

---

#### 7. Şərh Sil (Delete Comment) ⭐ Authenticated
```http
DELETE /api/blog/comments/1
Authorization: Bearer {accessToken}
```

---

### 💳 **TRANSACTIONS Endpoints** (`/api/transactions`)

#### 1. Əməliyyatlar Siyahısı (Get Transactions) ⭐ Authenticated
```http
GET /api/transactions?status=completed&type=job_posting&page=1&pageSize=10
Authorization: Bearer {accessToken}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": 1,
        "amount": 49.99,
        "currency": "USD",
        "status": "completed",
        "transactionType": "featured_job",
        "paymentMethod": "card",
        "cardLast4": "4242",
        "createdAt": "2025-06-15T10:30:00Z"
      }
    ],
    "totalCount": 10,
    "pageCount": 1,
    "hasNextPage": false
  }
}
```

---

#### 2. Əməliyyat Detayları (Get Transaction)
```http
GET /api/transactions/1
Authorization: Bearer {accessToken}
```

---

#### 3. Ödəniş Edin (Create Transaction) ⭐ Employer
```http
POST /api/transactions
Authorization: Bearer {accessToken}
Content-Type: application/json

{
  "planId": 1,
  "cardNumber": "4242424242424242",
  "cardExpiry": "12/25",
  "cardCvv": "123",
  "cardName": "John Doe"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "message": "Ödəniş uğurla tamamlandı.",
  "data": {
    "id": 1,
    "amount": 49.99,
    "currency": "USD",
    "status": "completed",
    "orderId": "ORD-123456"
  }
}
```

---

#### 4. Faktura Əldə Et (Get Invoice) ⭐ Authenticated
```http
GET /api/transactions/1/invoice
Authorization: Bearer {accessToken}
```

**Response:** PDF/TXT faylı download edilir

---

#### 5. Planları Əldə Et (Get Plans)
```http
GET /api/transactions/plans
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Single Job Post",
      "description": "Post 1 job",
      "amount": 24.99,
      "currency": "USD",
      "duration": "30 days",
      "features": ["Post 1 job", "7-day featured option"]
    },
    {
      "id": 2,
      "name": "5 Job Posts",
      "description": "Post 5 jobs",
      "amount": 99.99,
      "currency": "USD",
      "duration": "90 days",
      "features": ["Post 5 jobs", "14-day featured option", "Priority support"]
    }
  ]
}
```

---

### ⚙️ **ADMIN Endpoints** (`/api/admin`)

#### 1. Admin Dashboard (Dashboard Stats) ⭐ Admin
```http
GET /api/admin/dashboard
Authorization: Bearer {accessToken}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "totalUsers": 150,
    "totalJobs": 250,
    "totalApplications": 500,
    "totalCompanies": 30,
    "newUsersThisMonth": 25,
    "newJobsThisMonth": 45,
    "revenueThisMonth": 5000.00,
    "jobsByStatus": {
      "active": 200,
      "closed": 40,
      "draft": 10
    },
    "topCategories": [
      {
        "name": "Software Development",
        "jobCount": 100
      }
    ]
  }
}
```

---

#### 2. Şirkətləri Yönetmə (Manage Companies) ⭐ Admin
```http
GET /api/admin/companies?page=1&pageSize=10
Authorization: Bearer {accessToken}
```

---

#### 3. İstifadəçiləri Yönetmə (Manage Users) ⭐ Admin
```http
GET /api/admin/users?role=employer&isActive=true&page=1&pageSize=10
Authorization: Bearer {accessToken}
```

---

#### 4. Əməliyyatları Yönetmə (Manage Transactions) ⭐ Admin
```http
GET /api/admin/transactions?status=completed&page=1&pageSize=10
Authorization: Bearer {accessToken}
```

---

#### 5. Kateqoriya Yaratma (Create Category) ⭐ Admin
```http
POST /api/admin/categories
Authorization: Bearer {accessToken}
Content-Type: application/json

{
  "name": "Data Science",
  "description": "Data Science and Analytics jobs",
  "icon": "📊"
}
```

---

## 🔐 Authentication & Authorization

### JWT Token Struktur
```
Header: { alg: "HS256", typ: "JWT" }

Payload: {
  sub: "1",              // User ID
  email: "user@test.com",
  role: "employer",      // candidate | employer | admin
  iat: 1623801600,
  exp: 1623802500       // 15 minutes later
}

Signature: HMACSHA256(header + "." + payload, SECRET)
```

### Token Müddəti
- **Access Token:** 15 dəqiqə
- **Refresh Token:** 7 gün (və ya "Remember Me" varsa 30 gün)

### Authorization Header
```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Rol Əsaslı Dəstək (Role-Based Access)
```
- candidate     → Namizəd (İş axtarışında)
- employer      → İşəgötürən (İş elanı yerləşdirər)
- admin         → Administator (Bütün funksiyalara dəstəy)
```

### Protected Routes Nümunələri
| Endpoint | Roller | İzah |
|----------|--------|------|
| `POST /api/jobs` | employer, admin | Yalnız işəgötürənlər iş yerləşdirə bilərlər |
| `POST /api/applications` | candidate | Yalnız namizədlər müraciət edə bilərlər |
| `GET /api/admin/*` | admin | Yalnız adminlər admin panelini görmə bilərlər |
| `PUT /api/candidates/me` | candidate | Namizədlər yalnız öz profilini redaktə edə bilərlər |

---

## ⚠️ Error Handling

### Error Response Format
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Daxil edilən məlumatlar yanlışdır.",
    "details": [
      {
        "field": "email",
        "message": "Email formatı yanlışdır"
      },
      {
        "field": "password",
        "message": "Şifrə ən azı 8 simvol olmalıdır"
      }
    ]
  }
}
```

### HTTP Status Kodları
| Kod | Məna | Nümunə |
|-----|------|--------|
| `200` | OK | Sorgulama uğurlu oldu |
| `201` | Created | Resurs yaradıldı |
| `204` | No Content | Silmə uğurlu |
| `400` | Bad Request | Yanlış daxil edilən məlumatlar |
| `401` | Unauthorized | Token'ı yoxdur və ya etibarsız |
| `403` | Forbidden | Bu əməliyyatı etməy icazəniz yoxdur |
| `404` | Not Found | Resurs tapılmadı |
| `409` | Conflict | Email artıq istifadə olunur |
| `422` | Unprocessable Entity | Dəyərləndirmə xətası |
| `429` | Too Many Requests | Rate limit aşıldı |
| `500` | Server Error | Internal server error |

### Mümkün Error Kodları
```
VALIDATION_ERROR       - Daxil edilən məlumatlar yanlış
NOT_FOUND             - Resurs tapılmadı
UNAUTHORIZED          - Giriş tələb olunur
FORBIDDEN             - Dəstəyi yoxdur
CONFLICT              - Eyni resurs artıq mövcuddur
INVALID_TOKEN         - Token etibarsız
EXPIRED_TOKEN         - Token müddəti bitib
RATE_LIMIT_EXCEEDED   - Çox sayda sorğu
SERVER_ERROR          - Daxili server xətası
```

### Rate Limiting
- **Login endpoint:** 5 sorğu / dəqiqə
- **General API:** 100 sorğu / dəqiqə
- **File upload:** 10 MB maksimum

---

## 📦 Data Transfer Objects (DTOs)

### Common DTOs

#### ApiResponse<T>
```csharp
{
  Success: bool,
  Data: T,
  Message: string,
  Error: ApiError
}
```

#### PagedResponse<T>
```csharp
{
  Items: List<T>,
  TotalCount: int,
  PageCount: int,
  HasNextPage: bool
}
```

#### ApiError
```csharp
{
  Code: string,
  Message: string,
  Details: List<FieldError>
}
```

### Auth DTOs

#### RegisterDto
```csharp
{
  FullName: string,
  Email: string,
  Password: string,
  ConfirmPassword: string,
  Role: string  // "candidate" | "employer"
}
```

#### LoginDto
```csharp
{
  Email: string,
  Password: string,
  RememberMe: bool
}
```

#### LoginResponseDto
```csharp
{
  AccessToken: string,
  RefreshToken: string,
  ExpiresIn: int,  // saniyə
  User: {
    Id: int,
    FullName: string,
    Email: string,
    Role: string,
    AvatarUrl: string
  }
}
```

---

## ⚙️ Kurulum & Konfigürasyon

### Prerequisites
- .NET 8 SDK
- SQL Server (Express yetərlidir)
- Visual Studio 2022 və ya VS Code

### Adımlar

#### 1. Repository Klonla
```bash
git clone https://github.com/Sedmeq/JobBoard.git
cd JobBoard
```

#### 2. Database Bağlantısını Ayarla
`JobBoard.API/appsettings.json` düzəlt:
```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=YOUR_SERVER;Database=JobBoardDb;Trusted_Connection=True;..."
  }
}
```

#### 3. NuGet Packages'ı Qur
```bash
dotnet restore
```

#### 4. Database Migration'larını Tətbiq Et
```bash
dotnet ef database update --project JobBoard.Infrastructure
```

#### 5. API'ni Başlat
```bash
cd JobBoard.API
dotnet run
```

API `https://localhost:5001` adresində başlanacaq.

### appsettings.json Konfigürasyon

#### JWT Settings
```json
"JwtSettings": {
  "Secret": "your-super-secret-key-minimum-32-characters-long!",
  "Issuer": "JobBoardAPI",
  "Audience": "JobBoardClient",
  "AccessTokenExpiryMinutes": 15,
  "RefreshTokenExpiryDays": 7
}
```

#### Email Settings (Gmail)
```json
"Email": {
  "FromEmail": "your-email@gmail.com",
  "FromName": "JobBoard",
  "SmtpHost": "smtp.gmail.com",
  "SmtpPort": 587,
  "SmtpUser": "your-email@gmail.com",
  "SmtpPass": "your-app-password"  // NOT regular password!
}
```

[Gmail App Password Qur](https://myaccount.google.com/apppasswords)

#### Storage Settings
```json
"Storage": {
  "Type": "Local",
  "LocalPath": "wwwroot/uploads",
  "BaseUrl": "https://localhost:5001"
}
```

#### CORS Settings
```json
"AllowedOrigins": "http://localhost:3000,http://localhost:5173"
```

---

## 🔌 Frontend İnteqrasyon

### 1. Giriş Alış
```typescript
const login = async (email: string, password: string) => {
  const response = await fetch('https://localhost:5001/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });

  const data = await response.json();
  if (data.success) {
    localStorage.setItem('accessToken', data.data.accessToken);
    localStorage.setItem('refreshToken', data.data.refreshToken);
    return data.data.user;
  }
  throw new Error(data.error.message);
};
```

### 2. Protected Request
```typescript
const getJobs = async () => {
  const token = localStorage.getItem('accessToken');
  const response = await fetch('https://localhost:5001/api/jobs', {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });

  const data = await response.json();
  if (!data.success) {
    // Handle error
    if (response.status === 401) {
      // Refresh token
      await refreshToken();
    }
  }
  return data.data;
};
```

### 3. Token Yenilə
```typescript
const refreshToken = async () => {
  const token = localStorage.getItem('refreshToken');
  const response = await fetch('https://localhost:5001/api/auth/refresh', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken: token })
  });

  const data = await response.json();
  if (data.success) {
    localStorage.setItem('accessToken', data.data.accessToken);
    localStorage.setItem('refreshToken', data.data.refreshToken);
  }
};
```

### 4. Axios Interceptor (React)
```typescript
import axios from 'axios';

const api = axios.create({
  baseURL: 'https://localhost:5001/api'
});

// Request interceptor
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await refreshToken();
      return api(error.config); // Retry request
    }
    return Promise.reject(error);
  }
);

export default api;
```

### 5. API Client Setup (React/Vue)
```typescript
// services/api.ts
export const JobBoardAPI = {
  // Auth
  auth: {
    register: (dto) => api.post('/auth/register', dto),
    login: (dto) => api.post('/auth/login', dto),
    logout: (dto) => api.post('/auth/logout', dto),
    refreshToken: (token) => api.post('/auth/refresh', { refreshToken: token })
  },

  // Jobs
  jobs: {
    getAll: (filter) => api.get('/jobs', { params: filter }),
    getById: (id) => api.get(`/jobs/${id}`),
    getBySlug: (slug) => api.get(`/jobs/slug/${slug}`),
    create: (dto) => api.post('/jobs', dto),
    update: (id, dto) => api.put(`/jobs/${id}`, dto),
    delete: (id) => api.delete(`/jobs/${id}`)
  },

  // Applications
  applications: {
    create: (dto) => api.post('/applications', dto),
    getMyApplications: (filter) => api.get('/applications/my', { params: filter }),
    getStats: () => api.get('/applications/stats'),
    updateStatus: (id, dto) => api.patch(`/applications/${id}/status`, dto)
  },

  // ... digər endpoints
};
```

### 6. Error Handling Pattern
```typescript
const handleApiError = (error: any) => {
  const response = error.response?.data;

  if (!response?.success) {
    const errorCode = response?.error?.code;
    const errorMsg = response?.error?.message;

    switch (errorCode) {
      case 'VALIDATION_ERROR':
        // Show field-level errors
        return response.error.details;
      case 'UNAUTHORIZED':
        // Redirect to login
        window.location.href = '/login';
        break;
      case 'NOT_FOUND':
        // Show not found message
        break;
      default:
        // Show generic error
        console.error(errorMsg);
    }
  }
};
```

### 7. File Upload
```typescript
const uploadResume = async (file: File) => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await api.post('/candidates/me/resume', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });

  return response.data.data.resumeUrl;
};
```

---

## 📝 Əlavə Qeydlər

### Soft Delete
Bəzi entitylər (User, Job, Company, BlogPost) soft delete'ə tələ edilir. Bu o deməkdir ki, `IsDeleted` flag'ı `true` olduqda, həmin record'lar avtomatik olaraq sorğudan filtrlənir.

### Slugification
İş elanları və bloqun məqalələri unikal slug'lara malikdir. Slug'lar otomatik olaraq başlıqdan yaradılır:
- Böyük hərflər kiçik hərflərə çevrilir
- Boşluqlar tireə çevrilir
- Xüsusi simvollar silinir

**Nümunə:** "Senior Full Stack Developer" → "senior-full-stack-developer"

### View Count
İş elanları göründükdə (GET endpoint'i ziyarət olduqda), baxış sayı avtomatik olaraq artırılır.

### Pagination
Siyahı endpoint'ləri `PagedResponse<T>` qaytarır. Varsayılan səhifə ölçüsü 10, maksimum 50.

### Image Upload
Profil şəkilləri, logo'lar və digər şəkillər lokal `wwwroot/uploads` qovluğuna saxlanılır.

### Email Templates
Email'ləri HTML template'ləri ilə göndərilir. Şablonlar:
- Email verification
- Password reset
- Application notification
- Payment receipt

---

## 🆘 Tez-tez Soruşulan Suallar

### Frontend'in API'y necə quraşdıracağını
Bax: [Frontend İnteqrasyon](#frontend-inteqrasyon) bölümü

### Yeni məqamları necə əlavə edəcəyi
1. `JobBoard.Core/Entities/` qovluğunda yeni Entity yaradın
2. `AppDbContext` üzərində DbSet əlavə edin
3. Migration yaradın: `dotnet ef migrations add "DescriptiveName"`
4. Migration'ı tətbiq edin: `dotnet ef database update`
5. DTO'lar yaradın və Service logic'i əlavə edin

### Xülləri necə custom edə biləcəyi
`JobBoard.API/Middleware/ExceptionMiddleware.cs` faylını redaktə edin. Orada bütün exception'ların işlənməsi baş verir.

### Rate limiting'i necə dəyişəcəyi
`JobBoard.API/Extensions/ServiceExtensions.cs` faylında `AddRateLimiting` metoduna baxın.

---

## 📞 Əlaqə & Dəstək

- **GitHub:** https://github.com/Sedmeq/JobBoard
- **Issues:** Hər hansı problem üçün GitHub issues açın

---

**Axırıncı Yeniləmə:** 2025-06-15  
**Versiya:** 1.0.0
