# API Documentation

## Table of Contents

1. [Base Information](#base-information)
2. [Authentication](#authentication)
3. [User Profile Management](#user-profile-management)
4. [CV Upload Services](#cv-upload-services)
5. [CV Template Generation Services](#cv-template-generation-services)
6. [Cover Letter Services](#cover-letter-services)
7. [Template Services](#template-services)
8. [Contact Services](#contact-services)
9. [Data Services](#data-services)
10. [Error Handling](#error-handling)
11. [Data Models](#data-models)

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
  "email": "user@example.com",
  "password": "StrongPass123",
  "name": "John Doe",
  "role": "USER"
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

**Validation Requirements**:

- Email: Valid email format
- Password: Minimum 8 characters, at least one letter and one number
- Name: 2-50 characters (full name)

### 2. User Login

**Endpoint**: `POST /auth/login`  
**Authentication**: None  
**Rate Limit**: Applied

**Request Body**:

```json
{
  "email": "user@example.com",
  "password": "StrongPass123"
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
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
    "expiresIn": 14400
  }
}
```

### 3. Email Verification

**Endpoint**: `POST /auth/verify-email`  
**Authentication**: None

**Request Body**:

```json
{
  "token": "verification-token-from-email"
}
```

### 4. Resend Email Verification

**Endpoint**: `POST /auth/resend-verification`  
**Authentication**: None  
**Rate Limit**: Applied

**Request Body**:

```json
{
  "email": "user@example.com"
}
```

### 5. Refresh Token

**Endpoint**: `POST /auth/refresh`  
**Authentication**: None

**Request Body**:

```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

### 6. Logout

**Endpoint**: `POST /auth/logout`  
**Authentication**: Bearer Token Required

### 7. Logout All Sessions

**Endpoint**: `POST /auth/logout-all`  
**Authentication**: Bearer Token Required

### 8. Forgot Password

**Endpoint**: `POST /auth/forgot-password`  
**Authentication**: None  
**Rate Limit**: Applied

**Request Body**:

```json
{
  "email": "user@example.com"
}
```

### 9. Reset Password

**Endpoint**: `POST /auth/reset-password`  
**Authentication**: None  
**Rate Limit**: Applied

**Request Body**:

```json
{
  "token": "reset-token-from-email",
  "newPassword": "NewStrongPass123",
  "confirmPassword": "NewStrongPass123"
}
```

### 10. Get Current User

**Endpoint**: `GET /auth/me`  
**Authentication**: Bearer Token Required

### 11. Update User Profile (Auth)

**Endpoint**: `PUT /auth/profile`  
**Authentication**: Bearer Token Required

**Request Body**:

```json
{
  "name": "John Doe",
  "email": "john.doe@example.com"
}
```

### 12. Change Password

**Endpoint**: `PUT /auth/change-password`  
**Authentication**: Bearer Token Required

**Request Body**:

```json
{
  "currentPassword": "OldPass123",
  "newPassword": "NewPass123",
  "confirmPassword": "NewPass123"
}
```

### 13. Get User Sessions

**Endpoint**: `GET /auth/sessions`  
**Authentication**: Bearer Token Required

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
    "firstName": "John",
    "lastName": "Doe",
    "phone": "+1234567890",
    "address": "123 Main St",
    "city": "New York",
    "github": "https://github.com/johndoe",
    "linkedin": "https://linkedin.com/in/johndoe",
    "portfolioWebsite": "https://johndoe.dev",
    "aboutMe": "Experienced developer...",
    "avatarColor": "#3B82F6",
    "education": [],
    "experience": [],
    "courses": [],
    "certificates": [],
    "hobbies": [],
    "skills": []
  }
}
```

### 2. Update User Profile

**Endpoint**: `PUT /user-profile`  
**Authentication**: Bearer Token Required

**Request Body**:

```json
{
  "firstName": "John",
  "lastName": "Doe",
  "phone": "+1234567890",
  "address": "123 Main St",
  "city": "New York",
  "github": "https://github.com/johndoe",
  "linkedin": "https://linkedin.com/in/johndoe",
  "portfolioWebsite": "https://johndoe.dev",
  "aboutMe": "Experienced developer with 5 years...",
  "avatarColor": "#FF5733"
}
```

### 3. Add Education

**Endpoint**: `POST /user-profile/education`  
**Authentication**: Bearer Token Required

**Request Body**:

```json
{
  "schoolName": "Stanford University",
  "degree": "Bachelor of Science",
  "fieldOfStudy": "Computer Science",
  "educationType": "LISANS",
  "grade": 3.8,
  "gradeSystem": "GPA_4",
  "startYear": 2018,
  "endYear": 2022,
  "isCurrent": false,
  "description": "Focused on software engineering..."
}
```

**Education Types**: `LISE` (High School), `ONLISANS` (Associate), `LISANS` (Bachelor's), `YUKSEKLISANS` (Master's/PhD)

### 4. Update Education

**Endpoint**: `PUT /user-profile/education/:id`  
**Authentication**: Bearer Token Required

### 5. Delete Education

**Endpoint**: `DELETE /user-profile/education/:id`  
**Authentication**: Bearer Token Required

### 6. Add Experience

**Endpoint**: `POST /user-profile/experience`  
**Authentication**: Bearer Token Required

**Request Body**:

```json
{
  "companyName": "TechCorp Inc.",
  "position": "Senior Software Engineer",
  "employmentType": "FULL_TIME",
  "workMode": "REMOTE",
  "location": "San Francisco, CA",
  "startMonth": 6,
  "startYear": 2022,
  "endMonth": 12,
  "endYear": 2023,
  "isCurrent": false,
  "description": "Led development of microservices...",
  "achievements": "Improved system performance by 40%..."
}
```

**Employment Types**: `FULL_TIME`, `PART_TIME`, `CONTRACT`, `FREELANCE`, `INTERNSHIP`, `TEMPORARY`  
**Work Modes**: `ONSITE`, `REMOTE`, `HYBRID`

### 7. Update Experience

**Endpoint**: `PUT /user-profile/experience/:id`  
**Authentication**: Bearer Token Required

### 8. Delete Experience

**Endpoint**: `DELETE /user-profile/experience/:id`  
**Authentication**: Bearer Token Required

### 9. Add Course

**Endpoint**: `POST /user-profile/course`  
**Authentication**: Bearer Token Required

### 10. Update Course

**Endpoint**: `PUT /user-profile/course/:id`  
**Authentication**: Bearer Token Required

### 11. Delete Course

**Endpoint**: `DELETE /user-profile/course/:id`  
**Authentication**: Bearer Token Required

### 12. Add Certificate

**Endpoint**: `POST /user-profile/certificate`  
**Authentication**: Bearer Token Required

### 13. Update Certificate

**Endpoint**: `PUT /user-profile/certificate/:id`  
**Authentication**: Bearer Token Required

### 14. Delete Certificate

**Endpoint**: `DELETE /user-profile/certificate/:id`  
**Authentication**: Bearer Token Required

### 15. Add Hobby

**Endpoint**: `POST /user-profile/hobby`  
**Authentication**: Bearer Token Required

### 16. Update Hobby

**Endpoint**: `PUT /user-profile/hobby/:id`  
**Authentication**: Bearer Token Required

### 17. Delete Hobby

**Endpoint**: `DELETE /user-profile/hobby/:id`  
**Authentication**: Bearer Token Required

### 18. Add Skill

**Endpoint**: `POST /user-profile/skill`  
**Authentication**: Bearer Token Required

**Request Body**:

```json
{
  "name": "React.js",
  "category": "TECHNICAL",
  "level": "ADVANCED",
  "yearsOfExperience": 3,
  "description": "Frontend development with React..."
}
```

**Skill Categories**: `TECHNICAL`, `SOFT_SKILL`, `LANGUAGE`, `TOOL`, `FRAMEWORK`, `OTHER`  
**Skill Levels**: `BEGINNER`, `INTERMEDIATE`, `ADVANCED`, `EXPERT`

### 19. Update Skill

**Endpoint**: `PUT /user-profile/skill/:id`  
**Authentication**: Bearer Token Required

### 20. Delete Skill

**Endpoint**: `DELETE /user-profile/skill/:id`  
**Authentication**: Bearer Token Required

---

## CV Upload Services

### 1. Upload CV

**Endpoint**: `POST /cv-upload/upload`  
**Authentication**: Bearer Token Required  
**Content-Type**: `multipart/form-data`  
**Rate Limit**: Upload limiter applied

**Form Data**:

```
cvFile: <PDF file>
```

**Success Response** (201):

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "originalName": "john_doe_cv.pdf",
    "fileName": "processed_filename.pdf",
    "size": 1024567,
    "uploadedAt": "2024-01-01T00:00:00.000Z",
    "status": "PROCESSING"
  },
  "message": "CV başarıyla yüklendi"
}
```

**File Requirements**:

- Format: PDF only
- Max size: 10MB
- Content must be extractable text

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
      "status": "COMPLETED",
      "extractedText": "John Doe\\nSoftware Engineer..."
    }
  ]
}
```

**Status Values**: `PROCESSING`, `COMPLETED`, `FAILED`

### 3. Get CV Upload Status

**Endpoint**: `GET /cv-upload/upload/status/:id`  
**Authentication**: Bearer Token Required

### 4. Delete CV Upload

**Endpoint**: `DELETE /cv-upload/uploads/:id`  
**Authentication**: Bearer Token Required

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
      "id": "basic_hr",
      "name": "Basic HR Resume",
      "description": "Professional resume template suitable for HR and corporate positions",
      "language": "English"
    },
    {
      "id": "office_manager",
      "name": "Office Manager Resume",
      "description": "Template designed for office management and administrative roles",
      "language": "English"
    },
    {
      "id": "simple_classic",
      "name": "Simple Classic Resume",
      "description": "Clean and traditional resume format",
      "language": "English"
    },
    {
      "id": "stylish_accounting",
      "name": "Stylish Accounting Resume",
      "description": "Modern template for accounting and finance professionals",
      "language": "English"
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

### 2. Generate CV from Template

**Endpoint**: `POST /cv-generator/generate`  
**Authentication**: Bearer Token Required  
**Rate Limit**: ATS Generation limiter applied

**Request Body**:

```json
{
  "templateType": "basic_hr",
  "data": {
    "personalInfo": {
      "fullName": "John Doe",
      "address": "123 Main St",
      "city": "New York",
      "state": "NY",
      "zipCode": "10001",
      "phone": "+1-555-0123",
      "email": "john.doe@example.com"
    },
    "objective": "Experienced HR professional seeking challenging opportunities...",
    "experience": [
      {
        "jobTitle": "Senior HR Manager",
        "company": "Tech Corp",
        "location": "New York, NY",
        "startDate": "Jan 2020",
        "endDate": "Present",
        "description": "Led recruitment and talent management initiatives..."
      }
    ],
    "education": [
      {
        "degree": "Master of Business Administration",
        "university": "Columbia University",
        "location": "New York, NY",
        "graduationDate": "May 2018",
        "details": "Concentration in Human Resources Management"
      }
    ],
    "communication": "Excellent verbal and written communication skills...",
    "leadership": "Proven track record of leading cross-functional teams...",
    "references": [
      {
        "name": "Jane Smith",
        "company": "Previous Company Inc.",
        "contact": "jane.smith@example.com | +1-555-0456"
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

**Success Response** (201):

```json
{
  "success": true,
  "message": "CV generated successfully",
  "data": {
    "id": "uuid",
    "templateType": "basic_hr",
    "generationStatus": "COMPLETED",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### 3. Get User's Generated CVs

**Endpoint**: `GET /cv-generator`  
**Authentication**: Bearer Token Required

**Success Response** (200):

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "templateType": "basic_hr",
      "generationStatus": "COMPLETED",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "limitInfo": {
    "current": 2,
    "maximum": 10,
    "canCreate": true,
    "type": "generatedCvs"
  }
}
```

### 4. Get Specific Generated CV

**Endpoint**: `GET /cv-generator/:cvId`  
**Authentication**: Bearer Token Required

### 5. Download Generated CV PDF

**Endpoint**: `GET /cv-generator/:cvId/download`  
**Authentication**: Bearer Token Required  
**Response**: PDF file download

**Success Response**: Direct PDF file download with filename format: `cv_{templateType}_{cvId}.pdf`

### 6. Regenerate CV

**Endpoint**: `POST /cv-generator/:cvId/regenerate`  
**Authentication**: Bearer Token Required  
**Rate Limit**: ATS Generation limiter applied

### 7. Delete Generated CV

**Endpoint**: `DELETE /cv-generator/:cvId`  
**Authentication**: Bearer Token Required

---

## Cover Letter Services

### Basic Cover Letters

### 1. Create Cover Letter

**Endpoint**: `POST /cover-letter-basic`  
**Authentication**: Bearer Token Required

**Request Body**:

```json
{
  "cvUploadId": "uuid-of-uploaded-cv",
  "positionTitle": "Senior Software Engineer",
  "companyName": "TechCorp Inc.",
  "jobDescription": "We are looking for a senior software engineer with experience in React, Node.js, and cloud technologies...",
  "language": "ENGLISH"
}
```

**Languages**: `TURKISH`, `ENGLISH`

**Success Response** (201):

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "content": "Dear Hiring Manager,\\n\\nI am writing to express my strong interest...",
    "positionTitle": "Senior Software Engineer",
    "companyName": "TechCorp Inc.",
    "language": "ENGLISH",
    "createdAt": "2024-01-01T00:00:00.000Z"
  },
  "message": "Cover letter başarıyla oluşturuldu"
}
```

### 2. Get Cover Letter

**Endpoint**: `GET /cover-letter-basic/:id`  
**Authentication**: Bearer Token Required

### 3. Update Cover Letter

**Endpoint**: `PUT /cover-letter-basic/:id`  
**Authentication**: Bearer Token Required

**Request Body**:

```json
{
  "updatedContent": "Dear Hiring Manager,\\n\\nI am writing to express my strong interest in the Senior Software Engineer position..."
}
```

### 4. Get User Cover Letters

**Endpoint**: `GET /cover-letter-basic`  
**Authentication**: Bearer Token Required

### 5. Delete Cover Letter

**Endpoint**: `DELETE /cover-letter-basic/:id`  
**Authentication**: Bearer Token Required

### 6. Download Cover Letter PDF

**Endpoint**: `GET /cover-letter-basic/:id/download/pdf`  
**Authentication**: Bearer Token Required  
**Response**: PDF file download

### Detailed Cover Letters

### 1. Create Detailed Cover Letter

**Endpoint**: `POST /cover-letter-detailed`  
**Authentication**: Bearer Token Required

**Request Body**:

```json
{
  "positionTitle": "Senior Software Engineer",
  "companyName": "TechCorp Inc.",
  "jobDescription": "We are looking for a senior software engineer with experience in React, Node.js, and cloud technologies...",
  "language": "ENGLISH",
  "whyPosition": "I am passionate about software engineering and have 5 years of experience...",
  "whyCompany": "TechCorp's innovative approach to solving complex problems aligns with my career goals...",
  "workMotivation": "I am motivated by challenging projects and continuous learning opportunities..."
}
```

### 2. Get Detailed Cover Letter

**Endpoint**: `GET /cover-letter-detailed/:id`  
**Authentication**: Bearer Token Required

### 3. Update Detailed Cover Letter

**Endpoint**: `PUT /cover-letter-detailed/:id`  
**Authentication**: Bearer Token Required

### 4. Get User Detailed Cover Letters

**Endpoint**: `GET /cover-letter-detailed`  
**Authentication**: Bearer Token Required

### 5. Delete Detailed Cover Letter

**Endpoint**: `DELETE /cover-letter-detailed/:id`  
**Authentication**: Bearer Token Required

### 6. Download Detailed Cover Letter PDF

**Endpoint**: `GET /cover-letter-detailed/:id/download/pdf`  
**Authentication**: Bearer Token Required  
**Response**: PDF file download

---

## Template Services

### 1. Get All Templates

**Endpoint**: `GET /templates`  
**Authentication**: Bearer Token Required  
**Rate Limit**: Applied

**Query Parameters**:

- `industry` (optional): Filter by industry (`TECHNOLOGY` | `FINANCE` | `HEALTHCARE` | `EDUCATION` | `MARKETING`)
- `category` (optional): Filter by category
- `language` (optional): Filter by language (`TURKISH` | `ENGLISH`)

**Example**: `GET /templates?industry=TECHNOLOGY&language=ENGLISH`

**Success Response** (200):

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "title": "Software Developer Template",
      "content": "Dear Hiring Manager,\\n\\nI am writing to express my interest...",
      "category": "SOFTWARE_DEVELOPER",
      "language": "ENGLISH",
      "industry": "TECHNOLOGY",
      "description": "General software developer position template"
    }
  ],
  "message": "Templates retrieved successfully"
}
```

### 2. Get Template Categories

**Endpoint**: `GET /templates/categories`  
**Authentication**: Bearer Token Required

### 3. Get Templates by Industry

**Endpoint**: `GET /templates/industry/:industry`  
**Authentication**: Bearer Token Required

### 4. Get Template by ID

**Endpoint**: `GET /templates/:templateId`  
**Authentication**: Bearer Token Required

### 5. Create Cover Letter from Template

**Endpoint**: `POST /templates/create-cover-letter`  
**Authentication**: Bearer Token Required

**Request Body**:

```json
{
  "templateId": "uuid-of-template",
  "positionTitle": "Senior Software Engineer",
  "companyName": "TechCorp Inc.",
  "personalizations": {
    "whyPosition": "I am passionate about software engineering...",
    "whyCompany": "TechCorp's innovative approach aligns with my goals...",
    "additionalSkills": "React, Node.js, AWS, Docker"
  }
}
```

### 6. Initialize Templates (Admin Only)

**Endpoint**: `POST /templates/initialize`  
**Authentication**: Bearer Token Required (Admin Role)

---

## Contact Services

### 1. Send Message

**Endpoint**: `POST /contact/send`  
**Authentication**: None  
**Validation**: Applied

**Request Body**:

```json
{
  "type": "CONTACT",
  "name": "John Doe",
  "email": "john@example.com",
  "subject": "Question about your service",
  "message": "I would like to know more about your CV generation service..."
}
```

**Message Types**: `CONTACT`, `SUPPORT`

**Success Response** (200):

```json
{
  "success": true,
  "message": "Mesajınız başarıyla gönderildi"
}
```

### 2. Get Messages (Admin)

**Endpoint**: `GET /contact/messages`  
**Authentication**: Bearer Token Required

### 3. Check Contact Limit

**Endpoint**: `GET /contact/limit`  
**Authentication**: None

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
      "id": "1",
      "name": "Akören Çok Programlı Lisesi",
      "city": "ADANA",
      "district": "ALADAĞ",
      "type": ""
    }
  ],
  "message": "Liseler başarıyla getirildi"
}
```

#### 2. Search High Schools

**Endpoint**: `GET /high-schools/search`  
**Authentication**: None

**Query Parameters**:

- `q` (required): Search term

#### 3. Get High Schools by City

**Endpoint**: `GET /high-schools/city/:city`  
**Authentication**: None

#### 4. Get High School by ID

**Endpoint**: `GET /high-schools/:id`  
**Authentication**: None

#### 5. Get High Schools Statistics

**Endpoint**: `GET /high-schools/stats`  
**Authentication**: None

#### 6. Reload High Schools Data

**Endpoint**: `POST /high-schools/reload`  
**Authentication**: None

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
      "id": "1",
      "name": "Adana Alparslan Türkeş Bilim ve Teknoloji Üniversitesi",
      "city": "Adana",
      "type": "STATE"
    }
  ],
  "message": "Üniversiteler başarıyla getirildi"
}
```

**University Types**: `STATE`, `FOUNDATION`, `PRIVATE`

#### 2. Search Universities

**Endpoint**: `GET /universities/search`  
**Authentication**: None

#### 3. Get Universities by City

**Endpoint**: `GET /universities/city/:city`  
**Authentication**: None

#### 4. Get Universities by Type

**Endpoint**: `GET /universities/type/:type`  
**Authentication**: None

#### 5. Get University by ID

**Endpoint**: `GET /universities/:id`  
**Authentication**: None

#### 6. Get Universities Statistics

**Endpoint**: `GET /universities/stats`  
**Authentication**: None

#### 7. Force Refresh Universities Data

**Endpoint**: `POST /universities/refresh`  
**Authentication**: None

### Locations Service (Provinces & Districts)

#### 1. Get All Provinces

**Endpoint**: `GET /locations/provinces`  
**Authentication**: None

#### 2. Search Provinces

**Endpoint**: `GET /locations/provinces/search`  
**Authentication**: None

#### 3. Get Province by Code

**Endpoint**: `GET /locations/provinces/code/:code`  
**Authentication**: None

#### 4. Get Province by Name

**Endpoint**: `GET /locations/provinces/name/:name`  
**Authentication**: None

#### 5. Get Districts by Province Code

**Endpoint**: `GET /locations/districts/province-code/:code`  
**Authentication**: None

#### 6. Get Districts by Province Name

**Endpoint**: `GET /locations/districts/province-name/:name`  
**Authentication**: None

#### 7. Search Districts

**Endpoint**: `GET /locations/districts/search`  
**Authentication**: None

#### 8. Get Locations Statistics

**Endpoint**: `GET /locations/stats`  
**Authentication**: None

---

## Error Handling

### Standard Error Response Format

```json
{
  "success": false,
  "error": "Error message",
  "message": "User-friendly message"
}
```

### Validation Error Response

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "email",
      "message": "Please provide a valid email address"
    },
    {
      "field": "password",
      "message": "Password must be at least 8 characters"
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

### User Model

```typescript
interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'USER' | 'ADMIN';
  isEmailVerified: boolean;
  createdAt: string;
  updatedAt: string;
}
```

### User Profile Model

```typescript
interface UserProfile {
  id: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  address?: string;
  city?: string;
  github?: string;
  linkedin?: string;
  portfolioWebsite?: string;
  aboutMe?: string;
  avatarColor?: string;
  education: Education[];
  experience: Experience[];
  courses: Course[];
  certificates: Certificate[];
  hobbies: Hobby[];
  skills: Skill[];
}
```

### CV Upload Model

```typescript
interface CVUpload {
  id: string;
  originalName: string;
  fileName: string;
  size: number;
  uploadedAt: string;
  status: 'PROCESSING' | 'COMPLETED' | 'FAILED';
  extractedText?: string;
}
```

### Generated CV Model

```typescript
interface GeneratedCv {
  id: string;
  userId: string;
  templateType:
    | 'basic_hr'
    | 'office_manager'
    | 'simple_classic'
    | 'stylish_accounting'
    | 'minimalist_turkish';
  templateData: string;
  pdfData?: Buffer;
  generationStatus: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  createdAt: string;
  updatedAt: string;
}
```

### Cover Letter Model

```typescript
interface CoverLetter {
  id: string;
  content: string;
  positionTitle: string;
  companyName: string;
  language: 'TURKISH' | 'ENGLISH';
  createdAt: string;
  updatedAt: string;
}
```

### Education Model

```typescript
interface Education {
  id: string;
  schoolName: string;
  degree?: string;
  fieldOfStudy?: string;
  educationType?: 'LISE' | 'ONLISANS' | 'LISANS' | 'YUKSEKLISANS';
  grade?: number;
  gradeSystem: 'PERCENTAGE' | 'GPA_4';
  startYear: number;
  endYear?: number;
  isCurrent: boolean;
  description?: string;
}
```

### Experience Model

```typescript
interface Experience {
  id: string;
  companyName: string;
  position: string;
  employmentType:
    | 'FULL_TIME'
    | 'PART_TIME'
    | 'CONTRACT'
    | 'FREELANCE'
    | 'INTERNSHIP'
    | 'TEMPORARY';
  workMode: 'ONSITE' | 'REMOTE' | 'HYBRID';
  location?: string;
  startMonth: number;
  startYear: number;
  endMonth?: number;
  endYear?: number;
  isCurrent: boolean;
  description?: string;
  achievements?: string;
}
```

### Skill Model

```typescript
interface Skill {
  id: string;
  name: string;
  category?:
    | 'TECHNICAL'
    | 'SOFT_SKILL'
    | 'LANGUAGE'
    | 'TOOL'
    | 'FRAMEWORK'
    | 'OTHER';
  level?: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'EXPERT';
  yearsOfExperience?: number;
  description?: string;
}
```

### Cover Letter Template Model

```typescript
interface CoverLetterTemplate {
  id: string;
  title: string;
  content: string;
  category: string;
  language: 'TURKISH' | 'ENGLISH';
  industry: 'TECHNOLOGY' | 'FINANCE' | 'HEALTHCARE' | 'EDUCATION' | 'MARKETING';
  description?: string;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}
```

---

## Development Notes

### Authentication Flow

1. User registers → Email verification required
2. User verifies email → Account activated
3. User logs in → Receives access token and refresh token
4. Access token expires (4 hours) → Use refresh token to get new access token
5. Refresh token expires (7 days) → User must log in again

### Token Expiration Times

- **Access Token**: 4 hours (14400 seconds)
- **Refresh Token**: 7 days
- **Email Verification Token**: 24 hours
- **Password Reset Token**: 1 hour

### File Upload Notes

- CV files must be PDF format
- Maximum file size: 10MB
- Files are processed asynchronously
- Status checking endpoint available for processing updates

### Rate Limiting

- Authentication endpoints have stricter rate limits
- Upload endpoints have special file-based limits
- Contact form has per-IP rate limits
- General API endpoints have standard rate limits

### Template System

- 31 pre-written professional cover letter templates
- 16 categories across 5 industries: Technology, Finance, Healthcare, Education, Marketing
- Multi-language support (Turkish & English)
- Dynamic placeholder replacement system

### CV Template Generation System

- 5 professional PDF templates for direct CV generation
- Templates: Basic HR, Office Manager, Simple Classic, Stylish Accounting, Minimalist Turkish
- Each template has its own optimized data structure
- PDF generation using PDFKit library with custom fonts
- Binary PDF storage in database
- User limits enforced based on role
- Template validation to ensure data integrity
- Support for Turkish characters and localization

### Security Features

- CORS protection
- Helmet security headers
- Request size limits (10MB)
- Input validation and sanitization
- Password hashing with bcrypt
- JWT token expiration
- Session-based authentication
