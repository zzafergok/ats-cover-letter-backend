# API Documentation

## Table of Contents

1. [Base Information](#base-information)
2. [Authentication](#authentication)
3. [User Profile Management](#user-profile-management)
4. [CV Upload Services](#cv-upload-services)
5. [CV Template Generation Services](#cv-template-generation-services)
6. [Cover Letter Services](#cover-letter-services)
7. [Template Services](#template-services)
8. [ATS Optimization Services](#ats-optimization-services)
9. [Salary Calculation Services](#salary-calculation-services)
10. [Contact Services](#contact-services)
11. [Data Services](#data-services)
12. [Error Handling](#error-handling)
13. [Data Models](#data-models)

## Base Information

**Base URL**: `https://your-api-domain.com/api`
**Content-Type**: `application/json`
**Authentication**: Bearer Token (JWT)

### Standard Response Format

All API responses follow this structure:

```json
{
  "success": boolean,
  "data": object | array | null,
  "message": string | null,
  "error": string | null
}
```

---

## Authentication

### 1. User Registration

**Endpoint**: `POST /auth/register`  
**Authentication**: None  
**Rate Limit**: Applied

**Request Body**:

```json
{
  "email": "user@example.com", // Valid email address for user registration
  "password": "StrongPass123", // Minimum 8 characters with letters and numbers
  "firstName": "John", // User's first name (2-50 characters)
  "lastName": "Doe", // User's last name (2-50 characters)
  "role": "USER" // User role (USER or ADMIN, defaults to USER)
}
```

**Success Response** (201):

```json
{
  "success": true,
  "data": {
    "message": "Kayıt başarılı. E-posta adresinizi doğrulayın.",
    "email": "user@example.com",
    "emailSent": true
  },
  "message": "Kullanıcı başarıyla kaydedildi"
}
```

**NOT**: Bu servis yeni kullanıcı kaydı için kullanılır. Kayıt sonrası email doğrulama gereklidir ve kullanıcı giriş yapabilmek için email adresini doğrulamalıdır.

### 2. User Login

**Endpoint**: `POST /auth/login`  
**Authentication**: None  
**Rate Limit**: Applied

**Request Body**:

```json
{
  "email": "user@example.com", // Registered user email address
  "password": "StrongPass123" // User password
}
```

**Success Response** (200):

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "USER",
      "emailVerified": true
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIs...", // JWT access token for API requests
    "refreshToken": "eyJhbGciOiJIUzI1NiIs...", // Refresh token for token renewal
    "expiresIn": 14400 // Access token expiration time in seconds (4 hours)
  }
}
```

**NOT**: Ana giriş servisi. Başarılı giriş sonrası access token ve refresh token alınır. Access token 4 saat, refresh token 7 gün geçerlidir.

### 3. Email Verification

**Endpoint**: `POST /auth/verify-email`  
**Authentication**: None

**Request Body**:

```json
{
  "token": "verification-token-from-email" // Email verification token sent to user's email
}
```

**NOT**: Email doğrulama servisi. Kullanıcı kayıt olduktan sonra gelen email'deki token ile hesabını aktif eder.

### 4. Refresh Token

**Endpoint**: `POST /auth/refresh`  
**Authentication**: None

**Request Body**:

```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..." // Valid refresh token
}
```

**NOT**: Access token yenilemek için kullanılır. Access token süresi dolduğunda bu servis ile yeni token alınır.

### 5. Logout

**Endpoint**: `POST /auth/logout`  
**Authentication**: Bearer Token Required

**NOT**: Kullanıcı çıkışı yapar ve mevcut session'ı sonlandırır. Güvenlik için önemlidir.

### 6. Forgot Password

**Endpoint**: `POST /auth/forgot-password`  
**Authentication**: None  
**Rate Limit**: Applied

**Request Body**:

```json
{
  "email": "user@example.com" // Registered user email for password reset
}
```

**NOT**: Şifre sıfırlama servisi. Kullanıcının email adresine şifre sıfırlama linki gönderir.

### 7. Reset Password

**Endpoint**: `POST /auth/reset-password`  
**Authentication**: None  
**Rate Limit**: Applied

**Request Body**:

```json
{
  "token": "reset-token-from-email", // Password reset token from email
  "newPassword": "NewStrongPass123", // New password (min 8 chars)
  "confirmPassword": "NewStrongPass123" // Password confirmation (must match)
}
```

**NOT**: Şifre sıfırlama işlemini tamamlar. Email'den gelen token ile yeni şifre belirlenir.

---

## User Profile Management

### 1. Get User Profile

**Endpoint**: `GET /user-profile`  
**Authentication**: Bearer Token Required

**Success Response** (200):

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "firstName": "John", // User's first name
    "lastName": "Doe", // User's last name
    "phone": "+1234567890", // Contact phone number
    "address": "123 Main St", // Physical address
    "city": "New York", // City of residence
    "github": "https://github.com/johndoe", // GitHub profile URL
    "linkedin": "https://linkedin.com/in/johndoe", // LinkedIn profile URL
    "portfolioWebsite": "https://johndoe.dev", // Personal website URL
    "aboutMe": "Experienced developer...", // Professional summary/bio
    "avatarColor": "#3B82F6", // Avatar background color
    "educations": [], // Array of education records
    "experiences": [], // Array of work experience records
    "courses": [], // Array of course/training records
    "certificates": [], // Array of certification records
    "hobbies": [], // Array of hobby/interest records
    "skills": [] // Array of skill records
  }
}
```

**NOT**: Kullanıcının tüm profil bilgilerini getirir. CV oluşturmak ve profil yönetimi için temel servistir.

### 2. Update User Profile

**Endpoint**: `PUT /user-profile`  
**Authentication**: Bearer Token Required

**Request Body**:

```json
{
  "firstName": "John", // Updated first name
  "lastName": "Doe", // Updated last name
  "phone": "+1234567890", // Updated phone number
  "address": "123 Main St", // Updated address
  "city": "New York", // Updated city
  "github": "https://github.com/johndoe", // Updated GitHub URL
  "linkedin": "https://linkedin.com/in/johndoe", // Updated LinkedIn URL
  "portfolioWebsite": "https://johndoe.dev", // Updated website URL
  "aboutMe": "Experienced developer with 5 years...", // Updated bio/summary
  "avatarColor": "#FF5733" // Updated avatar color
}
```

**NOT**: Kullanıcının temel profil bilgilerini günceller. Tüm alanlar opsiyoneldir, sadece değişen alanlar gönderilebilir.

### 3. Add Education

**Endpoint**: `POST /user-profile/education`  
**Authentication**: Bearer Token Required

**Request Body**:

```json
{
  "schoolName": "Stanford University", // Name of educational institution
  "degree": "Bachelor of Science", // Degree type obtained
  "fieldOfStudy": "Computer Science", // Field/major of study
  "educationType": "LISANS", // Education level type
  "grade": 3.8, // Grade/GPA achieved
  "gradeSystem": "GPA_4", // Grading system used
  "startYear": 2018, // Year education started
  "endYear": 2022, // Year education ended (optional if current)
  "isCurrent": false, // Whether currently studying
  "description": "Focused on software engineering..." // Additional details
}
```

**Education Types**: `LISE` (High School), `ONLISANS` (Associate), `LISANS` (Bachelor's), `YUKSEKLISANS` (Master's/PhD)

**NOT**: Kullanıcının eğitim geçmişi eklemek için kullanılır. CV oluşturmada eğitim bölümünü besler.

### 4. Add Experience

**Endpoint**: `POST /user-profile/experience`  
**Authentication**: Bearer Token Required

**Request Body**:

```json
{
  "companyName": "TechCorp Inc.", // Company name
  "position": "Senior Software Engineer", // Job title/position
  "employmentType": "FULL_TIME", // Type of employment
  "workMode": "REMOTE", // Work arrangement mode
  "location": "San Francisco, CA", // Work location
  "startMonth": 6, // Start month (1-12)
  "startYear": 2022, // Start year
  "endMonth": 12, // End month (optional if current)
  "endYear": 2023, // End year (optional if current)
  "isCurrent": false, // Whether currently working
  "description": "Led development of microservices...", // Job responsibilities
  "achievements": "Improved system performance by 40%..." // Key achievements
}
```

**Employment Types**: `FULL_TIME`, `PART_TIME`, `CONTRACT`, `FREELANCE`, `INTERNSHIP`, `TEMPORARY`  
**Work Modes**: `ONSITE`, `REMOTE`, `HYBRID`

**NOT**: İş deneyimi eklemek için kullanılır. CV'de deneyim bölümünü oluşturur ve ATS optimizasyonunda kritik rol oynar.

### 5. Add Skill

**Endpoint**: `POST /user-profile/skill`  
**Authentication**: Bearer Token Required

**Request Body**:

```json
{
  "name": "React.js", // Skill name
  "category": "TECHNICAL", // Skill category
  "level": "ADVANCED", // Proficiency level
  "yearsOfExperience": 3, // Years of experience with this skill
  "description": "Frontend development with React..." // Additional details
}
```

**Skill Categories**: `TECHNICAL`, `SOFT_SKILL`, `LANGUAGE`, `TOOL`, `FRAMEWORK`, `OTHER`  
**Skill Levels**: `BEGINNER`, `INTERMEDIATE`, `ADVANCED`, `EXPERT`

**NOT**: Beceri ekleme servisi. ATS optimizasyonunda anahtar kelime eşleştirmesi için kritik öneme sahiptir.

---

## CV Upload Services

### 1. Upload CV

**Endpoint**: `POST /cv-upload/upload`  
**Authentication**: Bearer Token Required  
**Content-Type**: `multipart/form-data`  
**Rate Limit**: Upload limiter applied

**Form Data**:

```
cvFile: <PDF file> // PDF format CV file (max 10MB)
```

**Success Response** (201):

```json
{
  "success": true,
  "data": {
    "id": "uuid", // Unique upload identifier
    "originalName": "john_doe_cv.pdf", // Original filename
    "fileName": "processed_filename.pdf", // System generated filename
    "size": 1024567, // File size in bytes
    "uploadedAt": "2024-01-01T00:00:00.000Z", // Upload timestamp
    "status": "PROCESSING" // Processing status
  },
  "message": "CV başarıyla yüklendi"
}
```

**File Requirements**:

- Format: PDF only
- Max size: 10MB
- Content must be extractable text

**NOT**: CV dosyası yükleme servisi. Yüklenen PDF'den metin çıkarımı yapılır ve ATS analizi için hazırlanır.

### 2. Get CV Uploads

**Endpoint**: `GET /cv-upload/uploads`  
**Authentication**: Bearer Token Required

**Success Response** (200):

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "originalName": "john_doe_cv.pdf",
      "fileName": "processed_filename.pdf",
      "size": 1024567,
      "uploadedAt": "2024-01-01T00:00:00.000Z",
      "status": "COMPLETED", // Processing completion status
      "extractedText": "John Doe\\nSoftware Engineer..." // Extracted text content
    }
  ]
}
```

**Status Values**: `PROCESSING`, `COMPLETED`, `FAILED`

**NOT**: Kullanıcının yüklediği CV'leri listeler. ATS analizi için CV seçiminde kullanılır.

---

## CV Template Generation Services

### 1. Get Available Templates

**Endpoint**: `GET /cv-generator/templates`  
**Authentication**: Bearer Token Required

**Success Response** (200):

```json
{
  "success": true,
  "data": [
    {
      "id": "basic_hr", // Template identifier
      "name": "Basic HR Resume", // Template display name
      "description": "Professional resume template suitable for HR and corporate positions", // Template description
      "language": "English" // Template language
    },
    {
      "id": "minimalist_turkish",
      "name": "Minimalist Turkish Resume",
      "description": "Clean minimalist design for Turkish job market",
      "language": "Turkish"
    }
  ]
}
```

**NOT**: Mevcut CV şablonlarını listeler. Kullanıcı şablon seçimi için kullanılır.

### 2. Generate CV from Template

**Endpoint**: `POST /cv-generator/generate`  
**Authentication**: Bearer Token Required  
**Rate Limit**: ATS Generation limiter applied

**Request Body**:

```json
{
  "templateType": "basic_hr", // Selected template identifier
  "data": {
    "personalInfo": {
      "fullName": "John Doe", // Full name for CV header
      "address": "123 Main St", // Address information
      "city": "New York", // City information
      "phone": "+1-555-0123", // Contact phone
      "email": "john.doe@example.com" // Contact email
    },
    "objective": "Experienced HR professional seeking challenging opportunities...", // Professional summary
    "experience": [
      {
        "jobTitle": "Senior HR Manager", // Position title
        "company": "Tech Corp", // Company name
        "location": "New York, NY", // Work location
        "startDate": "Jan 2020", // Start date
        "endDate": "Present", // End date or "Present"
        "description": "Led recruitment and talent management initiatives..." // Job description
      }
    ],
    "education": [
      {
        "degree": "Master of Business Administration", // Degree type
        "university": "Columbia University", // Institution name
        "location": "New York, NY", // Institution location
        "graduationDate": "May 2018", // Graduation date
        "details": "Concentration in Human Resources Management" // Additional details
      }
    ]
  }
}
```

**Template Types**:

- `basic_hr` - Basic HR Resume template
- `office_manager` - Office Manager Resume template
- `simple_classic` - Simple Classic Resume template
- `stylish_accounting` - Stylish Accounting Resume template
- `minimalist_turkish` - Minimalist Turkish Resume template

**NOT**: Seçilen şablon ile CV oluşturur. Kullanıcı profil verilerini PDF formatında şablona işler.

### 3. Download Generated CV PDF

**Endpoint**: `GET /cv-generator/:cvId/download`  
**Authentication**: Bearer Token Required  
**Response**: PDF file download

**NOT**: Oluşturulan CV'yi PDF formatında indirir. Kullanıcı CV'sini bilgisayarına kaydedebilir.

---

## Cover Letter Services

### 1. Create Cover Letter

**Endpoint**: `POST /cover-letter-basic`  
**Authentication**: Bearer Token Required

**Request Body**:

```json
{
  "cvUploadId": "uuid-of-uploaded-cv", // Reference to uploaded CV
  "positionTitle": "Senior Software Engineer", // Target job position
  "companyName": "TechCorp Inc.", // Target company name
  "jobDescription": "We are looking for a senior software engineer with experience in React, Node.js, and cloud technologies...", // Job posting description
  "language": "ENGLISH" // Cover letter language
}
```

**Languages**: `TURKISH`, `ENGLISH`

**Success Response** (201):

```json
{
  "success": true,
  "data": {
    "id": "uuid", // Cover letter identifier
    "content": "Dear Hiring Manager,\\n\\nI am writing to express my strong interest...", // Generated content
    "positionTitle": "Senior Software Engineer", // Position applied for
    "companyName": "TechCorp Inc.", // Company applied to
    "language": "ENGLISH", // Language used
    "createdAt": "2024-01-01T00:00:00.000Z" // Creation timestamp
  },
  "message": "Cover letter başarıyla oluşturuldu"
}
```

**NOT**: AI destekli otomatik kapak mektubu oluşturur. CV ve iş ilanı analiz edilerek kişiselleştirilmiş içerik üretir.

### 2. Create Detailed Cover Letter

**Endpoint**: `POST /cover-letter-detailed`  
**Authentication**: Bearer Token Required

**Request Body**:

```json
{
  "positionTitle": "Senior Software Engineer", // Target position
  "companyName": "TechCorp Inc.", // Target company
  "jobDescription": "We are looking for a senior software engineer...", // Job description
  "language": "ENGLISH", // Language preference
  "whyPosition": "I am passionate about software engineering and have 5 years of experience...", // Why interested in position
  "whyCompany": "TechCorp's innovative approach to solving complex problems aligns with my career goals...", // Why interested in company
  "workMotivation": "I am motivated by challenging projects and continuous learning opportunities..." // Work motivation
}
```

**NOT**: Detaylı kapak mektubu oluşturur. Kullanıcının motivasyon ve hedeflerini içeren daha kişiselleştirilmiş içerik üretir.

---

## ATS Optimization Services

### 1. Analyze Job Posting

**Endpoint**: `POST /ats/analyze-job-posting`  
**Authentication**: Bearer Token Required  
**Rate Limit**: ATS API limiter applied

**Request Body**:

```json
{
  "jobPostingText": "We are looking for a Senior Software Engineer with 5+ years of experience in React, Node.js, AWS...", // Job posting content text
  "jobPostingUrl": "https://company.com/careers/senior-engineer", // Alternative: job posting URL (optional)
  "companyName": "TechCorp Inc.", // Company name (optional, will be extracted if not provided)
  "positionTitle": "Senior Software Engineer" // Position title (optional, will be extracted if not provided)
}
```

**Success Response** (200):

```json
{
  "success": true,
  "data": {
    "jobAnalysis": {
      "id": "job_analysis_uuid", // Analysis identifier
      "userId": "user_uuid", // User who performed analysis
      "companyName": "TechCorp Inc.", // Extracted/provided company name
      "positionTitle": "Senior Software Engineer", // Extracted/provided position
      "requiredSkills": ["React", "Node.js", "AWS", "JavaScript", "TypeScript"], // Required technical skills
      "preferredSkills": ["Docker", "Kubernetes", "GraphQL"], // Preferred additional skills
      "requiredExperience": [
        {
          "skillArea": "Frontend Development", // Skill domain
          "minimumYears": 5, // Minimum experience required
          "isRequired": true, // Whether this experience is mandatory
          "description": "React and modern JavaScript frameworks" // Experience description
        }
      ],
      "keywords": [
        {
          "keyword": "React", // Important keyword for ATS
          "category": "TECHNICAL", // Keyword category
          "importance": "HIGH", // Keyword importance level
          "frequency": 3 // Number of times mentioned
        }
      ],
      "atsKeywords": ["software engineer", "react developer", "full stack"], // ATS-optimized keywords
      "seniorityLevel": "SENIOR", // Detected seniority level
      "industryType": "Technology", // Industry classification
      "analysisStatus": "COMPLETED", // Analysis completion status
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  },
  "message": "Job posting analyzed successfully"
}
```

**NOT**: İş ilanını analiz eder ve ATS optimizasyonu için gerekli anahtar kelimeleri, becerileri, deneyim gereksinimlerini çıkarır. ATS optimizasyon sürecinin ilk adımıdır.

### 2. Analyze CV-Job Match

**Endpoint**: `POST /ats/analyze-match/:jobAnalysisId`  
**Authentication**: Bearer Token Required  
**Rate Limit**: ATS API limiter applied

**Request Body**:

```json
{
  "useUserProfile": true, // Use current user profile data for analysis
  "cvData": null // Alternative: provide specific CV data object (optional if useUserProfile is true)
}
```

**Success Response** (200):

```json
{
  "success": true,
  "data": {
    "matchAnalysis": {
      "id": "match_analysis_uuid", // Match analysis identifier
      "userId": "user_uuid", // User identifier
      "jobAnalysisId": "job_analysis_uuid", // Reference to job analysis
      "overallScore": 75, // Overall match percentage (0-100)
      "skillsMatch": {
        "score": 80, // Skills match score (0-100)
        "totalRequired": 10, // Total required skills
        "matched": 8, // Number of matched skills
        "missing": ["Docker", "Kubernetes"], // Missing required skills
        "extra": ["Python", "Django"] // Additional skills user has
      },
      "experienceMatch": {
        "score": 70, // Experience match score (0-100)
        "totalYearsRequired": 5, // Total years experience required
        "totalYearsUser": 6, // User's total relevant experience
        "relevantExperiences": [
          {
            "company": "Previous Corp", // Company name
            "position": "Software Engineer", // Position held
            "relevanceScore": 0.9, // How relevant this experience is (0-1)
            "matchingSkills": ["React", "Node.js"] // Skills from this role that match job
          }
        ]
      },
      "keywordMatch": {
        "score": 65, // Keyword optimization score (0-100)
        "totalKeywords": 20, // Total important keywords in job
        "matchedKeywords": 13, // Keywords found in user's CV
        "missingHighPriority": ["AWS", "microservices"], // Missing high-priority keywords
        "missingMediumPriority": ["CI/CD", "agile"] // Missing medium-priority keywords
      },
      "missingSkills": ["Docker", "Kubernetes", "AWS"], // All missing skills
      "recommendations": [
        {
          "type": "SKILL_GAP", // Recommendation type
          "priority": "HIGH", // Priority level
          "title": "Add Missing Technical Skills", // Recommendation title
          "description": "Include Docker, Kubernetes in your skills section", // Detailed description
          "estimatedImpact": 15 // Expected score improvement
        }
      ],
      "matchStatus": "COMPLETED"
    }
  }
}
```

**NOT**: CV ile iş ilanını karşılaştırır ve uyum skorunu hesaplar. Eksik becerileri ve anahtar kelimeleri tespit eder, iyileştirme önerileri sunar.

### 3. Optimize CV

**Endpoint**: `POST /ats/optimize/:matchAnalysisId`  
**Authentication**: Bearer Token Required  
**Rate Limit**: ATS API limiter applied

**Request Body**:

```json
{
  "optimizationLevel": "ADVANCED", // Optimization intensity level
  "targetSections": [
    {
      "section": "SKILLS", // Section to optimize
      "priority": "HIGH" // Optimization priority for this section
    },
    {
      "section": "EXPERIENCE", // Experience section optimization
      "priority": "MEDIUM" // Priority level
    }
  ],
  "preserveOriginal": true // Whether to keep backup of original content
}
```

**Optimization Levels**:

- `BASIC` - Basic keyword optimization and skill additions
- `ADVANCED` - Enhanced descriptions with AI-generated content
- `COMPREHENSIVE` - Complete CV restructuring with ATS best practices

**Success Response** (200):

```json
{
  "success": true,
  "data": {
    "optimization": {
      "id": "optimization_uuid", // Optimization result identifier
      "userId": "user_uuid", // User identifier
      "matchAnalysisId": "match_analysis_uuid", // Reference to match analysis
      "beforeScore": 75, // Original match score
      "afterScore": 89, // Optimized match score
      "improvementPercentage": 19, // Percentage improvement
      "changes": [
        {
          "section": "skills", // Section that was changed
          "changeType": "ADDED", // Type of change made
          "newValue": "Docker, Kubernetes, AWS", // New content added
          "reason": "Added missing skills identified in job requirements", // Reason for change
          "keywords": ["Docker", "Kubernetes", "AWS"] // Keywords added
        }
      ],
      "atsCompliance": {
        "score": 92, // ATS compliance score (0-100)
        "passedChecks": ["Contact Information", "Keyword Optimization"], // Passed compliance checks
        "failedChecks": [], // Failed compliance checks
        "recommendations": [
          {
            "category": "Format Enhancement", // Recommendation category
            "recommendation": "Use consistent date formatting", // Specific recommendation
            "impact": "MEDIUM" // Expected impact level
          }
        ]
      },
      "optimizationStatus": "COMPLETED"
    }
  }
}
```

**NOT**: CV'yi iş ilanına göre optimize eder. Eksik anahtar kelimeleri ekler, deneyim açıklamalarını geliştirir ve ATS uyumluluğunu artırır.

### 4. Complete ATS Analysis

**Endpoint**: `POST /ats/complete-analysis`  
**Authentication**: Bearer Token Required  
**Rate Limit**: ATS API limiter applied

**Request Body**:

```json
{
  "jobPostingAnalysis": {
    "jobPostingText": "We are looking for a Senior Software Engineer...", // Job posting content
    "companyName": "TechCorp Inc.", // Company name
    "positionTitle": "Senior Software Engineer" // Position title
  },
  "optimizationLevel": "COMPREHENSIVE", // Desired optimization level
  "targetSections": [
    {
      "section": "OBJECTIVE", // Section to optimize
      "priority": "HIGH" // Priority level
    }
  ]
}
```

**Success Response** (200):

```json
{
  "success": true,
  "data": {
    "jobAnalysis": {}, // Complete job analysis result
    "matchAnalysis": {}, // Complete match analysis result
    "optimization": {} // Complete optimization result
  },
  "message": "Complete ATS analysis and optimization completed successfully"
}
```

**NOT**: Tam ATS analiz sürecini çalıştırır: İş ilanı analizi → CV eşleştirme → CV optimizasyonu. Tek istekle tüm süreci tamamlar.

### 5. Apply Optimization to Profile

**Endpoint**: `POST /ats/apply-optimization/:optimizationId`  
**Authentication**: Bearer Token Required

**Success Response** (200):

```json
{
  "success": true,
  "data": {
    "applied": true // Whether optimization was successfully applied
  },
  "message": "Optimization applied to user profile successfully"
}
```

**NOT**: Optimize edilmiş CV değişikliklerini kullanıcı profiline uygular. Optimizasyon sonuçlarını kalıcı hale getirir.

### 6. Get User ATS Analyses

**Endpoint**: `GET /ats/my-analyses`  
**Authentication**: Bearer Token Required

**Query Parameters**:

- `page=1` // Page number for pagination
- `limit=10` // Number of results per page
- `type=optimization` // Filter by analysis type (job_analysis, match_analysis, optimization)

**Success Response** (200):

```json
{
  "success": true,
  "data": {
    "analyses": [
      {
        "id": "analysis_uuid", // Analysis identifier
        "type": "optimization", // Analysis type
        "companyName": "TechCorp Inc.", // Company name
        "positionTitle": "Senior Software Engineer", // Position
        "score": 89, // Final score achieved
        "createdAt": "2024-01-01T00:00:00.000Z" // Analysis date
      }
    ],
    "pagination": {
      "page": 1, // Current page
      "limit": 10, // Results per page
      "total": 25, // Total number of analyses
      "totalPages": 3 // Total number of pages
    }
  }
}
```

**NOT**: Kullanıcının geçmiş ATS analiz ve optimizasyon geçmişini listeler. İlerleme takibi için kullanılır.

---

## Salary Calculation Services

### 1. Calculate Net Salary

**Endpoint**: `POST /salary/calculate`  
**Authentication**: Bearer Token Required

**Request Body**:

```json
{
  "grossSalary": 50000, // Gross annual salary amount
  "allowances": {
    "meal": 2000, // Monthly meal allowance
    "transportation": 1000, // Monthly transportation allowance
    "other": 500 // Other monthly allowances
  },
  "personalInfo": {
    "isMarried": false, // Marital status for tax calculation
    "dependentCount": 0, // Number of dependents
    "disabilityRate": 0 // Disability percentage (if applicable)
  },
  "year": 2024 // Tax year for calculation
}
```

**Success Response** (200):

```json
{
  "success": true,
  "data": {
    "grossSalary": 50000, // Input gross salary
    "totalAllowances": 3500, // Total monthly allowances
    "taxableIncome": 46500, // Income subject to tax
    "incomeTax": 6200, // Calculated income tax
    "socialSecurityTax": 4650, // Social security contributions
    "unemploymentTax": 465, // Unemployment insurance
    "netSalary": 42185, // Final net salary
    "monthlyNetSalary": 3515, // Monthly net salary
    "taxRate": 13.3, // Effective tax rate percentage
    "breakdown": {
      "grossAnnual": 50000, // Annual gross
      "grossMonthly": 4167, // Monthly gross
      "totalDeductions": 7815, // Total deductions
      "netAnnual": 42185, // Annual net
      "netMonthly": 3515 // Monthly net
    }
  }
}
```

**NOT**: Türkiye vergi sistemi kullanarak brüt maaştan net maaş hesaplama yapar. 2024 vergi oranları ve kesintileri uygulanır.

### 2. Calculate Gross from Net

**Endpoint**: `POST /salary/calculate-gross`  
**Authentication**: Bearer Token Required

**Request Body**:

```json
{
  "targetNetSalary": 35000, // Desired annual net salary
  "allowances": {
    "meal": 2000, // Monthly meal allowance
    "transportation": 1000 // Monthly transportation allowance
  },
  "personalInfo": {
    "isMarried": true, // Marital status
    "dependentCount": 2 // Number of dependents
  },
  "year": 2024 // Tax year
}
```

**NOT**: Hedef net maaşa ulaşmak için gerekli brüt maaşı hesaplar. Ters maaş hesaplama işlemi yapar.

### 3. Compare Salary Scenarios

**Endpoint**: `POST /salary/compare`  
**Authentication**: Bearer Token Required

**Request Body**:

```json
{
  "scenarios": [
    {
      "name": "Current Job", // Scenario name
      "grossSalary": 45000, // Gross salary for this scenario
      "allowances": { "meal": 1500 }, // Allowances
      "location": "Istanbul" // Work location
    },
    {
      "name": "New Job Offer",
      "grossSalary": 55000,
      "allowances": { "meal": 2000, "transportation": 1200 },
      "location": "Ankara"
    }
  ],
  "personalInfo": {
    "isMarried": false,
    "dependentCount": 0
  }
}
```

**NOT**: Farklı maaş tekliflerini karşılaştırır. Net maaş, vergi yükü ve toplam faydaları analiz eder.

---

## Template Services

### 1. Get All Templates

**Endpoint**: `GET /templates`  
**Authentication**: Bearer Token Required  
**Rate Limit**: Applied

**Query Parameters**:

- `industry=TECHNOLOGY` // Filter by industry type
- `category=SOFTWARE_DEVELOPER` // Filter by job category
- `language=ENGLISH` // Filter by language

**Success Response** (200):

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid", // Template identifier
      "title": "Software Developer Template", // Template title
      "content": "Dear Hiring Manager,\\n\\nI am writing to express my interest...", // Template content
      "category": "SOFTWARE_DEVELOPER", // Job category
      "language": "ENGLISH", // Template language
      "industry": "TECHNOLOGY", // Industry type
      "description": "General software developer position template" // Template description
    }
  ],
  "message": "Templates retrieved successfully"
}
```

**NOT**: Kapak mektubu şablonlarını listeler. Sektör, kategori ve dile göre filtreleme imkanı sunar.

### 2. Create Cover Letter from Template

**Endpoint**: `POST /templates/create-cover-letter`  
**Authentication**: Bearer Token Required

**Request Body**:

```json
{
  "templateId": "uuid-of-template", // Selected template ID
  "positionTitle": "Senior Software Engineer", // Target position
  "companyName": "TechCorp Inc.", // Target company
  "personalizations": {
    "whyPosition": "I am passionate about software engineering...", // Personal motivation
    "whyCompany": "TechCorp's innovative approach aligns with my goals...", // Company interest
    "additionalSkills": "React, Node.js, AWS, Docker" // Additional skills to highlight
  }
}
```

**NOT**: Seçilen şablondan kişiselleştirilmiş kapak mektubu oluşturur. Şablon içeriğini kullanıcı bilgileri ile birleştirir.

---

## Contact Services

### 1. Send Message

**Endpoint**: `POST /contact/send`  
**Authentication**: None  
**Validation**: Applied

**Request Body**:

```json
{
  "type": "CONTACT", // Message type
  "name": "John Doe", // Sender's name
  "email": "john@example.com", // Sender's email
  "subject": "Question about your service", // Message subject
  "message": "I would like to know more about your CV generation service..." // Message content
}
```

**Message Types**: `CONTACT`, `SUPPORT`

**NOT**: İletişim formu servisi. Kullanıcıların sistem hakkında soru sorması ve destek alması için kullanılır.

---

## Data Services

### High Schools Service

#### 1. Get All High Schools

**Endpoint**: `GET /high-schools`  
**Authentication**: None

**Success Response** (200):

```json
{
  "success": true,
  "data": [
    {
      "id": "1", // School identifier
      "name": "Akören Çok Programlı Lisesi", // School name
      "city": "ADANA", // City
      "district": "ALADAĞ", // District
      "type": "" // School type
    }
  ],
  "message": "Liseler başarıyla getirildi"
}
```

**NOT**: Türkiye'deki tüm liseleri listeler. Eğitim bilgisi girerken okul seçimi için kullanılır.

### Universities Service

#### 1. Get All Universities

**Endpoint**: `GET /universities`  
**Authentication**: None

**Success Response** (200):

```json
{
  "success": true,
  "data": [
    {
      "id": "1", // University identifier
      "name": "Adana Alparslan Türkeş Bilim ve Teknoloji Üniversitesi", // University name
      "city": "Adana", // City
      "type": "STATE" // University type
    }
  ],
  "message": "Üniversiteler başarıyla getirildi"
}
```

**University Types**: `STATE`, `FOUNDATION`, `PRIVATE`

**NOT**: Türkiye'deki tüm üniversiteleri listeler. Yükseköğretim bilgisi için kullanılır.

### Locations Service

#### 1. Get All Provinces

**Endpoint**: `GET /locations/provinces`  
**Authentication**: None

**NOT**: Türkiye'nin tüm illerini listeler. Adres ve lokasyon bilgileri için kullanılır.

---

## Error Handling

### Standard Error Response Format

```json
{
  "success": false,
  "error": "Error message", // Technical error message
  "message": "User-friendly message" // User-friendly error description
}
```

### Validation Error Response

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "email", // Field that failed validation
      "message": "Please provide a valid email address" // Validation error message
    }
  ]
}
```

### Common HTTP Status Codes

| Status Code | Meaning               | When Used                               |
| ----------- | --------------------- | --------------------------------------- |
| 200         | OK                    | Successful GET, PUT requests            |
| 201         | Created               | Successful POST requests                |
| 400         | Bad Request           | Invalid request data, validation errors |
| 401         | Unauthorized          | Missing or invalid authentication token |
| 403         | Forbidden             | User doesn't have permission            |
| 404         | Not Found             | Resource not found                      |
| 429         | Too Many Requests     | Rate limit exceeded                     |
| 500         | Internal Server Error | Server-side errors                      |

---

## Data Models

### ATS Job Analysis Model

```typescript
interface JobPostingAnalysisResult {
  id: string; // Unique analysis identifier
  userId: string; // User who performed analysis
  companyName: string; // Company name
  positionTitle: string; // Job position title
  requiredSkills: string[]; // Required technical skills
  preferredSkills: string[]; // Preferred additional skills
  requiredExperience: ExperienceRequirement[]; // Experience requirements
  educationRequirements: EducationRequirement[]; // Education requirements
  keywords: JobKeyword[]; // Important keywords for ATS
  atsKeywords: string[]; // ATS-optimized keywords
  seniorityLevel: 'ENTRY' | 'JUNIOR' | 'MID' | 'SENIOR' | 'LEAD' | 'EXECUTIVE'; // Job seniority level
  industryType: string; // Industry classification
  analysisStatus: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED'; // Analysis status
  createdAt: string; // Analysis creation date
}
```

### ATS Match Analysis Model

```typescript
interface CVJobMatchResult {
  id: string; // Match analysis identifier
  userId: string; // User identifier
  jobAnalysisId: string; // Reference to job analysis
  overallScore: number; // Overall match percentage (0-100)
  skillsMatch: SkillsMatchAnalysis; // Skills matching analysis
  experienceMatch: ExperienceMatchAnalysis; // Experience matching analysis
  educationMatch: EducationMatchAnalysis; // Education matching analysis
  keywordMatch: KeywordMatchAnalysis; // Keyword matching analysis
  missingSkills: string[]; // Skills missing from user's profile
  missingKeywords: string[]; // Keywords missing from user's CV
  recommendations: OptimizationRecommendation[]; // Improvement recommendations
  matchStatus: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED'; // Analysis status
  createdAt: string; // Analysis creation date
}
```

### ATS Optimization Model

```typescript
interface ATSOptimizationResult {
  id: string; // Optimization identifier
  userId: string; // User identifier
  matchAnalysisId: string; // Reference to match analysis
  beforeScore: number; // Original match score
  afterScore: number; // Optimized match score
  improvementPercentage: number; // Percentage improvement
  changes: OptimizationChange[]; // List of changes made
  atsCompliance: ATSComplianceCheck; // ATS compliance analysis
  optimizationStatus: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED'; // Optimization status
  createdAt: string; // Optimization creation date
}
```

### Salary Calculation Model

```typescript
interface SalaryCalculationResult {
  grossSalary: number; // Gross annual salary
  totalAllowances: number; // Total monthly allowances
  taxableIncome: number; // Income subject to taxation
  incomeTax: number; // Calculated income tax
  socialSecurityTax: number; // Social security contributions
  unemploymentTax: number; // Unemployment insurance
  netSalary: number; // Final net salary
  monthlyNetSalary: number; // Monthly net salary
  taxRate: number; // Effective tax rate percentage
  breakdown: SalaryBreakdown; // Detailed salary breakdown
}
```

---

## Development Notes

### ATS Optimization Features

- **3-Level Optimization**: Basic, Advanced, Comprehensive optimization levels
- **AI-Powered Analysis**: Claude AI integration for intelligent content enhancement
- **Real-time Scoring**: 0-100 scoring system for job-CV matching
- **Keyword Optimization**: Automatic ATS keyword integration
- **Compliance Checking**: ATS format compliance validation

### Salary Calculation Features

- **Turkish Tax System**: 2024 tax rates and deductions
- **Comprehensive Calculations**: Income tax, social security, unemployment insurance
- **Allowance Support**: Meal, transportation, and other allowances
- **Scenario Comparison**: Multiple salary offer comparison
- **Personal Factors**: Marital status, dependents, disability considerations

### Security Features

- **Rate Limiting**: API endpoint specific rate limits
- **Authentication**: JWT-based authentication system
- **Data Validation**: Comprehensive input validation
- **Error Handling**: Structured error responses
- **CORS Protection**: Cross-origin request security

### Template System

- **31 Professional Templates**: Pre-written cover letter templates
- **5 CV Templates**: Professional PDF generation templates
- **Multi-language Support**: Turkish and English templates
- **Industry-Specific**: Technology, Finance, Healthcare, Education, Marketing
- **AI Enhancement**: Template content optimization
