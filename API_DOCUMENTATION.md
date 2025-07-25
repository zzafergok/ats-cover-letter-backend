# API Documentation

## Table of Contents

1. [Base Information](#base-information)
2. [Authentication](#authentication)
3. [User Profile Management](#user-profile-management)
4. [CV Management](#cv-management)
5. [ATS CV Services](#ats-cv-services)
6. [ATS Validation Services](#ats-validation-services)
7. [CV Optimization Services](#cv-optimization-services)
8. [DOCX Export Services](#docx-export-services)
9. [Cover Letter Services](#cover-letter-services)
10. [Template Services](#template-services)
11. [Contact Services](#contact-services)
12. [Data Services](#data-services)
13. [PDF Test Services](#pdf-test-services)
14. [Error Handling](#error-handling)
15. [Data Models](#data-models)

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
  "role": "USER" // Optional, defaults to USER
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

### Education Type Values

**Education Types**: `LISE` (High School), `ONLISANS` (Associate Degree), `LISANS` (Bachelor's Degree), `YUKSEKLISANS` (Master's/PhD)

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

**Success Response** (200):

```json
{
  "success": true,
  "message": "E-posta başarıyla doğrulandı"
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

**Success Response** (200):

```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
    "expiresIn": 14400
  }
}
```

### 6. Logout

**Endpoint**: `POST /auth/logout`  
**Authentication**: Bearer Token Required

**Headers**:

```
Authorization: Bearer <access-token>
```

**Success Response** (200):

```json
{
  "success": true,
  "message": "Başarıyla çıkış yapıldı"
}
```

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

**Success Response** (200):

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "USER",
    "emailVerified": true,
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

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

**Request Body**:

```json
{
  "courseName": "Advanced React Development",
  "provider": "Udemy",
  "startMonth": 3,
  "startYear": 2023,
  "endMonth": 4,
  "endYear": 2023,
  "duration": "40 hours",
  "description": "Comprehensive React course..."
}
```

### 10. Update Course

**Endpoint**: `PUT /user-profile/course/:id`  
**Authentication**: Bearer Token Required

### 11. Delete Course

**Endpoint**: `DELETE /user-profile/course/:id`  
**Authentication**: Bearer Token Required

### 12. Add Certificate

**Endpoint**: `POST /user-profile/certificate`  
**Authentication**: Bearer Token Required

**Request Body**:

```json
{
  "certificateName": "AWS Solutions Architect",
  "issuer": "Amazon Web Services",
  "issueMonth": 6,
  "issueYear": 2023,
  "expiryMonth": 6,
  "expiryYear": 2026,
  "credentialId": "AWS-123456789",
  "credentialUrl": "https://aws.amazon.com/verification/123456789",
  "description": "Cloud architecture certification..."
}
```

### 13. Update Certificate

**Endpoint**: `PUT /user-profile/certificate/:id`  
**Authentication**: Bearer Token Required

### 14. Delete Certificate

**Endpoint**: `DELETE /user-profile/certificate/:id`  
**Authentication**: Bearer Token Required

### 15. Add Hobby

**Endpoint**: `POST /user-profile/hobby`  
**Authentication**: Bearer Token Required

**Request Body**:

```json
{
  "name": "Photography",
  "description": "Landscape and portrait photography..."
}
```

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

## CV Management

### 1. Upload CV

**Endpoint**: `POST /cv/upload`  
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

**Endpoint**: `GET /cv/uploads`  
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
      "extractedText": "John Doe\nSoftware Engineer..."
    }
  ]
}
```

**Status Values**: `PROCESSING`, `COMPLETED`, `FAILED`

### 3. Get CV Upload Status

**Endpoint**: `GET /cv/upload/status/:id`  
**Authentication**: Bearer Token Required

### 4. Delete CV Upload

**Endpoint**: `DELETE /cv/uploads/:id`  
**Authentication**: Bearer Token Required

### 5. Generate CV (Upload-based)

**Endpoint**: `POST /cv/generate`  
**Authentication**: Bearer Token Required

**Request Body**:

```json
{
  "positionTitle": "Senior Software Engineer",
  "companyName": "TechCorp Inc.",
  "cvType": "ATS_OPTIMIZED",
  "jobDescription": "We are looking for a senior software engineer...",
  "additionalRequirements": "Experience with microservices...",
  "targetKeywords": ["React", "Node.js", "AWS", "Docker"]
}
```

**CV Types**: `ATS_OPTIMIZED`, `CREATIVE`, `TECHNICAL`

### 6. Save CV

**Endpoint**: `POST /cv/save`  
**Authentication**: Bearer Token Required

**Request Body**:

```json
{
  "title": "Software Engineer CV - TechCorp",
  "content": "JOHN DOE\nSoftware Engineer\n...",
  "cvType": "ATS_OPTIMIZED"
}
```

### 7. Get Saved CVs

**Endpoint**: `GET /cv/saved`  
**Authentication**: Bearer Token Required

**Success Response** (200):

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "title": "Software Engineer CV - TechCorp",
      "content": "JOHN DOE\nSoftware Engineer\n...",
      "cvType": "ATS_OPTIMIZED",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

### 8. Delete Saved CV

**Endpoint**: `DELETE /cv/saved/:id`  
**Authentication**: Bearer Token Required

### 9. Download CV

**Endpoint**: `GET /cv/download/:id`  
**Authentication**: Bearer Token Required  
**Response**: PDF file download

### 10. Upload CV (Updated Route)

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

### 11. Get CV Uploads (Updated Route)

**Endpoint**: `GET /cv-upload/uploads`  
**Authentication**: Bearer Token Required

### 12. Get CV Upload Status (Updated Route)

**Endpoint**: `GET /cv-upload/upload/status/:id`  
**Authentication**: Bearer Token Required

### 13. Delete CV Upload (Updated Route)

**Endpoint**: `DELETE /cv-upload/uploads/:id`  
**Authentication**: Bearer Token Required

### 14. Generate Detailed CV (Profile-based)

**Endpoint**: `POST /cv/generate-detailed`  
**Authentication**: Bearer Token Required

**Note**: Detailed CVs are stored using the same SavedCv model as regular saved CVs, with enhanced content generation based on user profile data.

**Request Body**:

```json
{
  "jobDescription": "We are looking for a senior software engineer...",
  "language": "ENGLISH"
}
```

**Languages**: `TURKISH`, `ENGLISH`

### 15. Get User Detailed CVs

**Endpoint**: `GET /cv/detailed`  
**Authentication**: Bearer Token Required

### 16. Get Detailed CV

**Endpoint**: `GET /cv/detailed/:id`  
**Authentication**: Bearer Token Required

### 17. Delete Detailed CV

**Endpoint**: `DELETE /cv/detailed/:id`  
**Authentication**: Bearer Token Required

### 18. Download Detailed CV PDF

**Endpoint**: `GET /cv/detailed/:id/download/pdf`  
**Authentication**: Bearer Token Required  
**Response**: PDF file download

---

## ATS CV Services

### 1. Generate ATS CV

**Endpoint**: `POST /ats-cv/generate`  
**Authentication**: Bearer Token Required  
**Rate Limit**: ATS Generation limiter applied

**Request Body**:

```json
{
  "personalInfo": {
    "fullName": "John Doe",
    "email": "john.doe@example.com",
    "phone": "+1-555-0123",
    "location": "New York, NY",
    "linkedin": "https://linkedin.com/in/johndoe",
    "portfolio": "https://johndoe.dev"
  },
  "professionalSummary": "Experienced software engineer with 5+ years...",
  "workExperience": [
    {
      "title": "Senior Software Engineer",
      "company": "Tech Corp",
      "location": "New York, NY",
      "startDate": "2020-01",
      "endDate": "2023-12",
      "current": false,
      "achievements": [
        "Led development of microservices architecture",
        "Improved system performance by 40%"
      ]
    }
  ],
  "education": [
    {
      "degree": "Bachelor of Science",
      "field": "Computer Science",
      "school": "University of Technology",
      "graduationDate": "2018-05",
      "gpa": "3.8"
    }
  ],
  "skills": {
    "technical": ["JavaScript", "React", "Node.js", "Python"],
    "soft": ["Team Leadership", "Problem Solving"]
  },
  "certifications": [
    {
      "name": "AWS Certified Solutions Architect",
      "issuer": "Amazon Web Services",
      "date": "2023-06",
      "credentialId": "AWS-123456789"
    }
  ]
}
```

**Success Response** (200):

```json
{
  "success": true,
  "data": {
    "cvId": "uuid",
    "pdfUrl": "/api/ats-cv/download/uuid",
    "atsScore": 95,
    "generatedAt": "2024-01-01T00:00:00.000Z",
    "recommendations": [
      "Consider adding more quantified achievements",
      "Include industry-specific keywords"
    ]
  },
  "message": "ATS CV başarıyla oluşturuldu"
}
```

### 2. Generate Test ATS CV

**Endpoint**: `GET /ats-cv/test`  
**Authentication**: Bearer Token Required

**Success Response** (200):

```json
{
  "success": true,
  "data": {
    "pdfUrl": "/api/ats-cv/download/test-uuid",
    "sampleData": {
      "personalInfo": {...},
      "professionalSummary": "...",
      "workExperience": [...]
    }
  },
  "message": "Test ATS CV oluşturuldu"
}
```

### 3. Get ATS Schema

**Endpoint**: `GET /ats-cv/schema`  
**Authentication**: None

**Success Response** (200):

```json
{
  "success": true,
  "data": {
    "schema": {
      "personalInfo": {
        "required": ["fullName", "email", "phone"],
        "optional": ["location", "linkedin", "portfolio"]
      },
      "professionalSummary": {
        "maxLength": 300,
        "recommendations": ["Include key skills", "Quantify achievements"]
      }
    }
  }
}
```

### 4. Get ATS Validation Tips

**Endpoint**: `GET /ats-cv/validation-tips`  
**Authentication**: None

**Success Response** (200):

```json
{
  "success": true,
  "data": {
    "tips": [
      {
        "category": "Formatting",
        "tip": "Use standard section headers",
        "importance": "high"
      },
      {
        "category": "Keywords",
        "tip": "Include job-relevant keywords naturally",
        "importance": "critical"
      }
    ]
  }
}
```

---

## ATS Validation Services

### 1. Validate CV for ATS Compliance

**Endpoint**: `POST /ats-validation/validate`  
**Authentication**: Bearer Token Required  
**Rate Limit**: API limiter applied

**Request Body**:

```json
{
  "cvData": {
    "personalInfo": {...},
    "professionalSummary": "...",
    "workExperience": [...],
    "education": [...],
    "skills": {...}
  },
  "jobDescription": "We are looking for a senior software engineer with 5+ years of experience..."
}
```

**Success Response** (200):

```json
{
  "success": true,
  "data": {
    "overallScore": 85,
    "sectionScores": {
      "formatting": 90,
      "keywords": 80,
      "structure": 95,
      "content": 75
    },
    "recommendations": [
      {
        "section": "professionalSummary",
        "issue": "Missing relevant keywords",
        "suggestion": "Include 'microservices', 'cloud architecture'",
        "priority": "high"
      }
    ],
    "matchedKeywords": ["JavaScript", "React", "Node.js"],
    "missingKeywords": ["AWS", "Docker", "Kubernetes"]
  }
}
```

### 2. Get Validation Analysis

**Endpoint**: `GET /ats-validation/analysis/:score`  
**Authentication**: Bearer Token Required

**Success Response** (200):

```json
{
  "success": true,
  "data": {
    "scoreRange": "80-89",
    "level": "Good",
    "description": "Your CV has strong ATS compatibility with room for improvement",
    "commonIssues": [
      "Keyword density could be improved",
      "Consider adding more quantified results"
    ],
    "nextSteps": [
      "Review job description for missing keywords",
      "Add specific metrics to achievements"
    ]
  }
}
```

### 3. Get ATS Best Practices

**Endpoint**: `GET /ats-validation/best-practices`  
**Authentication**: None

### 4. Get Common ATS Issues

**Endpoint**: `GET /ats-validation/common-issues`  
**Authentication**: None

---

## CV Optimization Services

### 1. Optimize CV

**Endpoint**: `POST /cv-optimization/optimize`  
**Authentication**: Bearer Token Required  
**Rate Limit**: ATS Generation limiter applied

**Request Body**:

```json
{
  "cvData": {
    "personalInfo": {...},
    "professionalSummary": "...",
    "workExperience": [...],
    "skills": {...}
  },
  "jobDescription": "We are seeking a senior software engineer..."
}
```

**Success Response** (200):

```json
{
  "success": true,
  "data": {
    "optimizedCV": {
      "personalInfo": {...},
      "professionalSummary": "Optimized summary with relevant keywords...",
      "workExperience": [...]
    },
    "optimizationReport": {
      "improvementScore": 15,
      "keywordMatchImprovement": 25,
      "changes": [
        {
          "section": "professionalSummary",
          "change": "Added 'cloud architecture' keyword",
          "impact": "high"
        }
      ]
    }
  }
}
```

### 2. Get Keyword Suggestions

**Endpoint**: `POST /cv-optimization/keyword-suggestions`  
**Authentication**: Bearer Token Required  
**Rate Limit**: API limiter applied

**Request Body**:

```json
{
  "jobDescription": "We are looking for a senior software engineer...",
  "targetPosition": "Senior Software Engineer"
}
```

**Success Response** (200):

```json
{
  "success": true,
  "data": {
    "keywords": {
      "critical": ["JavaScript", "React", "Node.js"],
      "important": ["AWS", "Docker", "Kubernetes"],
      "recommended": ["Agile", "Scrum", "CI/CD"]
    },
    "phrases": [
      "full-stack development",
      "microservices architecture",
      "cloud deployment"
    ]
  }
}
```

### 3. Get Section Optimization Tips

**Endpoint**: `GET /cv-optimization/section-tips/:section`  
**Authentication**: None

### 4. Analyze Keywords

**Endpoint**: `POST /cv-optimization/analyze-keywords`  
**Authentication**: Bearer Token Required  
**Rate Limit**: API limiter applied

**Request Body**:

```json
{
  "content": "Experienced software engineer with React and Node.js expertise...",
  "jobDescription": "We need a senior developer with React, Node.js, and AWS experience..."
}
```

**Success Response** (200):

```json
{
  "success": true,
  "data": {
    "matchScore": 70,
    "matchedKeywords": ["React", "Node.js"],
    "missingKeywords": ["AWS", "senior"],
    "keywordDensity": {
      "React": 2,
      "Node.js": 1
    },
    "suggestions": [
      "Include 'AWS' in your experience description",
      "Use 'senior' to match the job level"
    ]
  }
}
```

---

## DOCX Export Services

### 1. Generate DOCX CV

**Endpoint**: `POST /docx/generate`  
**Authentication**: Bearer Token Required  
**Rate Limit**: General limiter applied

**Request Body**:

```json
{
  "cvData": {
    "personalInfo": {...},
    "professionalSummary": "...",
    "workExperience": [...]
  },
  "options": {
    "template": "professional",
    "fontSize": 11,
    "fontFamily": "Calibri",
    "margins": "normal",
    "includePhoto": false
  }
}
```

**Success Response** (200):

```json
{
  "success": true,
  "data": {
    "downloadUrl": "/api/docx/download/uuid",
    "fileName": "john_doe_cv.docx",
    "fileSize": 45678,
    "generatedAt": "2024-01-01T00:00:00.000Z"
  },
  "message": "DOCX CV başarıyla oluşturuldu"
}
```

### 2. Preview DOCX Generation

**Endpoint**: `POST /docx/preview`  
**Authentication**: Bearer Token Required  
**Rate Limit**: General limiter applied

### 3. Validate DOCX Options

**Endpoint**: `POST /docx/validate-options`  
**Authentication**: Bearer Token Required  
**Rate Limit**: General limiter applied

### 4. Get DOCX Best Practices

**Endpoint**: `GET /docx/best-practices`  
**Authentication**: Bearer Token Required  
**Rate Limit**: General limiter applied

### 5. Get DOCX vs PDF Comparison

**Endpoint**: `GET /docx/vs-pdf`  
**Authentication**: Bearer Token Required  
**Rate Limit**: General limiter applied

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
    "content": "Dear Hiring Manager,\n\nI am writing to express my strong interest...",
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
  "updatedContent": "Dear Hiring Manager,\n\nI am writing to express my strong interest in the Senior Software Engineer position..."
}
```

### 4. Get User Cover Letters

**Endpoint**: `GET /cover-letter-basic`  
**Authentication**: Bearer Token Required

**Success Response** (200):

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "content": "Dear Hiring Manager...",
      "positionTitle": "Senior Software Engineer",
      "companyName": "TechCorp Inc.",
      "language": "ENGLISH",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

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

**Languages**: `TURKISH`, `ENGLISH`

### 2. Get Detailed Cover Letter

**Endpoint**: `GET /cover-letter-detailed/:id`  
**Authentication**: Bearer Token Required

### 3. Update Detailed Cover Letter

**Endpoint**: `PUT /cover-letter-detailed/:id`  
**Authentication**: Bearer Token Required

**Request Body**:

```json
{
  "updatedContent": "Dear Hiring Manager,\n\nI am writing to express my strong interest..."
}
```

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
      "content": "Dear Hiring Manager,\n\nI am writing to express my interest...",
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

**Success Response** (200):

```json
{
  "success": true,
  "data": {
    "TECHNOLOGY": [
      "SOFTWARE_DEVELOPER",
      "FRONTEND_DEVELOPER", 
      "BACKEND_DEVELOPER",
      "FULLSTACK_DEVELOPER",
      "DATA_SCIENTIST"
    ],
    "FINANCE": [
      "FINANCIAL_ANALYST",
      "INVESTMENT_BANKER",
      "FINANCIAL_ADVISOR", 
      "ACCOUNTING_SPECIALIST",
      "RISK_ANALYST"
    ],
    "HEALTHCARE": [
      "NURSE",
      "DOCTOR",
      "PHARMACIST"
    ],
    "EDUCATION": [
      "TEACHER",
      "ACADEMIC_ADMINISTRATOR"
    ],
    "MARKETING": [
      "MARKETING_SPECIALIST"
    ]
  },
  "message": "Template categories retrieved successfully"
}
```

### 3. Get Templates by Industry

**Endpoint**: `GET /templates/industry/:industry`  
**Authentication**: Bearer Token Required

**Path Parameters**:

- `industry`: `TECHNOLOGY` | `FINANCE` | `HEALTHCARE` | `EDUCATION` | `MARKETING`

**Example**: `GET /templates/industry/TECHNOLOGY`

### 4. Get Template by ID

**Endpoint**: `GET /templates/:templateId`  
**Authentication**: Bearer Token Required

**Success Response** (200):

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "title": "Software Developer Template",
    "content": "Dear Hiring Manager,\n\nI am writing to express my interest in the [POSITION_TITLE] position at [COMPANY_NAME]...",
    "category": "SOFTWARE_DEVELOPER",
    "language": "ENGLISH",
    "industry": "TECHNOLOGY", 
    "description": "General software developer position template"
  },
  "message": "Template retrieved successfully"
}
```

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

**Success Response** (200):

```json
{
  "success": true,
  "data": {
    "content": "Dear Hiring Manager,\n\nI am writing to express my interest in the Senior Software Engineer position at TechCorp Inc...",
    "templateId": "uuid-of-template",
    "positionTitle": "Senior Software Engineer",
    "companyName": "TechCorp Inc."
  },
  "message": "Cover letter created from template successfully"
}
```

**Template Placeholders**:

- `[POSITION_TITLE]` - Replaced with positionTitle
- `[COMPANY_NAME]` - Replaced with companyName  
- `[WHY_POSITION]` - Replaced with personalizations.whyPosition
- `[WHY_COMPANY]` - Replaced with personalizations.whyCompany
- `[ADDITIONAL_SKILLS]` - Replaced with personalizations.additionalSkills
- `[İsim]` / `[Name]` - Replaced with user's first and last name (from authenticated user)

### 6. Initialize Templates (Admin Only)

**Endpoint**: `POST /templates/initialize`  
**Authentication**: Bearer Token Required (Admin Role)

**Success Response** (200):

```json
{
  "success": true,
  "message": "Templates initialized successfully"
}
```

**Template Categories**:

**Technology Industry:**
- `SOFTWARE_DEVELOPER` - General software development positions
- `FRONTEND_DEVELOPER` - Frontend/React specialized positions  
- `BACKEND_DEVELOPER` - Backend/API development positions
- `FULLSTACK_DEVELOPER` - Full-stack development positions
- `DATA_SCIENTIST` - Data science and analytics positions

**Finance Industry:**
- `FINANCIAL_ANALYST` - Financial analysis and reporting positions
- `INVESTMENT_BANKER` - Investment banking and M&A positions
- `FINANCIAL_ADVISOR` - Financial advisory and planning positions
- `ACCOUNTING_SPECIALIST` - Accounting and bookkeeping positions  
- `RISK_ANALYST` - Risk management and compliance positions

**Healthcare Industry:**
- `NURSE` - Registered nurse and specialized nursing positions
- `DOCTOR` - Medical doctor and physician positions
- `PHARMACIST` - Pharmacy and pharmaceutical positions

**Education Industry:**
- `TEACHER` - Teaching and educational positions
- `ACADEMIC_ADMINISTRATOR` - Academic management positions

**Marketing Industry:**
- `MARKETING_SPECIALIST` - Digital marketing and content marketing positions

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

**Validation Requirements**:

- Name: 2-100 characters
- Email: Valid email format, max 255 characters
- Subject: 3-200 characters
- Message: 10-2000 characters

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

**Success Response** (200):

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "type": "CONTACT",
      "name": "John Doe",
      "email": "john@example.com",
      "subject": "Question about your service",
      "message": "I would like to know more...",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "isRead": false
    }
  ]
}
```

### 3. Check Contact Limit

**Endpoint**: `GET /contact/limit`  
**Authentication**: None

**Success Response** (200):

```json
{
  "success": true,
  "data": {
    "remainingRequests": 5,
    "resetTime": "2024-01-01T01:00:00.000Z"
  }
}
```

---

## Data Services

### High Schools Service

#### 1. Get All High Schools

**Endpoint**: `GET /high-schools`  
**Authentication**: None

**Note**: This service contains hardcoded Turkish high school data with caching mechanism for optimal performance.

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

**Example**: `GET /high-schools/search?q=İstanbul`

#### 3. Get High Schools by City

**Endpoint**: `GET /high-schools/city/:city`  
**Authentication**: None

**Example**: `GET /high-schools/city/ADANA`

#### 4. Get High School by ID

**Endpoint**: `GET /high-schools/:id`  
**Authentication**: None

#### 5. Get High Schools Statistics

**Endpoint**: `GET /high-schools/stats`  
**Authentication**: None

**Success Response** (200):

```json
{
  "success": true,
  "data": {
    "total": 3250,
    "cities": 81,
    "isLoaded": true
  },
  "message": "İstatistikler başarıyla getirildi"
}
```

#### 6. Reload High Schools Data

**Endpoint**: `POST /high-schools/reload`  
**Authentication**: None

### Universities Service

#### 1. Get All Universities

**Endpoint**: `GET /universities`  
**Authentication**: None

**Note**: This service contains hardcoded Turkish university data with caching mechanism for optimal performance.

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

**Query Parameters**:

- `q` (required): Search term

**Example**: `GET /universities/search?q=İstanbul`

#### 3. Get Universities by City

**Endpoint**: `GET /universities/city/:city`  
**Authentication**: None

**Example**: `GET /universities/city/İstanbul`

#### 4. Get Universities by Type

**Endpoint**: `GET /universities/type/:type`  
**Authentication**: None

**Available Types**: `STATE`, `FOUNDATION`, `PRIVATE`

**Example**: `GET /universities/type/STATE`

#### 5. Get University by ID

**Endpoint**: `GET /universities/:id`  
**Authentication**: None

#### 6. Get Universities Statistics

**Endpoint**: `GET /universities/stats`  
**Authentication**: None

**Success Response** (200):

```json
{
  "success": true,
  "data": {
    "total": 160,
    "state": 112,
    "foundation": 48,
    "private": 0,
    "cities": 14,
    "isLoaded": true,
    "lastUpdated": "2025-07-23T14:53:23.673Z"
  },
  "message": "İstatistikler başarıyla getirildi"
}
```

#### 7. Force Refresh Universities Data

**Endpoint**: `POST /universities/refresh`  
**Authentication**: None

### Locations Service (Provinces & Districts)

#### 1. Get All Provinces

**Endpoint**: `GET /locations/provinces`  
**Authentication**: None

**Success Response** (200):

```json
{
  "success": true,
  "data": [
    {
      "id": "1",
      "code": "01",
      "name": "Adana",
      "districts": [
        {
          "id": "01-1",
          "name": "Aladağ",
          "provinceCode": "01"
        }
      ]
    }
  ],
  "message": "İller başarıyla getirildi"
}
```

#### 2. Search Provinces

**Endpoint**: `GET /locations/provinces/search`  
**Authentication**: None

**Query Parameters**:

- `q` (required): Search term

**Example**: `GET /locations/provinces/search?q=istan`

#### 3. Get Province by Code

**Endpoint**: `GET /locations/provinces/code/:code`  
**Authentication**: None

**Example**: `GET /locations/provinces/code/34`

#### 4. Get Province by Name

**Endpoint**: `GET /locations/provinces/name/:name`  
**Authentication**: None

**Example**: `GET /locations/provinces/name/İstanbul`

#### 5. Get Districts by Province Code

**Endpoint**: `GET /locations/districts/province-code/:code`  
**Authentication**: None

**Example**: `GET /locations/districts/province-code/34`

#### 6. Get Districts by Province Name

**Endpoint**: `GET /locations/districts/province-name/:name`  
**Authentication**: None

**Example**: `GET /locations/districts/province-name/İstanbul`

#### 7. Search Districts

**Endpoint**: `GET /locations/districts/search`  
**Authentication**: None

**Query Parameters**:

- `q` (required): Search term
- `provinceCode` (optional): Filter by province code

**Examples**:

- `GET /locations/districts/search?q=merkez`
- `GET /locations/districts/search?q=merkez&provinceCode=06`

#### 8. Get Locations Statistics

**Endpoint**: `GET /locations/stats`  
**Authentication**: None

**Success Response** (200):

```json
{
  "success": true,
  "data": {
    "totalProvinces": 81,
    "totalDistricts": 972,
    "isLoaded": true
  },
  "message": "İstatistikler başarıyla getirildi"
}
```

---

## PDF Test Services

### 1. Test Turkish Character PDF

**Endpoint**: `GET /pdf-test/turkish-characters`  
**Authentication**: None  
**Response**: PDF file download

**Description**: Generates a test PDF with Turkish characters to verify font rendering and encoding support.

**Success Response**: Direct PDF file download with proper Turkish character encoding.

**Use Case**: Testing and validation of PDF generation with Turkish language support for cover letters and CVs.

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

### Authentication Errors

- **401 Unauthorized**: Token missing, invalid, or expired
- **403 Forbidden**: User doesn't have required role/permissions

### Rate Limiting

- **429 Too Many Requests**: API rate limit exceeded
- Different endpoints have different rate limits:
  - Auth endpoints: Stricter limits
  - Upload endpoints: File size and frequency limits
  - General API endpoints: Standard limits

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

### Course Model

```typescript
interface Course {
  id: string;
  courseName: string;
  provider?: string;
  startMonth?: number;
  startYear?: number;
  endMonth?: number;
  endYear?: number;
  duration?: string;
  description?: string;
}
```

### Certificate Model

```typescript
interface Certificate {
  id: string;
  certificateName: string;
  issuer?: string;
  issueMonth?: number;
  issueYear?: number;
  expiryMonth?: number;
  expiryYear?: number;
  credentialId?: string;
  credentialUrl?: string;
  description?: string;
}
```

### Hobby Model

```typescript
interface Hobby {
  id: string;
  name: string;
  description?: string;
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

### Contact Message Model

```typescript
interface ContactMessage {
  id: string;
  type: 'CONTACT' | 'SUPPORT';
  name: string;
  email: string;
  subject: string;
  message: string;
  createdAt: string;
  isRead: boolean;
}
```

### High School Model

```typescript
interface HighSchool {
  id: string;
  name: string;
  city?: string;
  district?: string;
  type?: string;
}
```

### University Model

```typescript
interface University {
  id: string;
  name: string;
  city?: string;
  type: 'STATE' | 'PRIVATE' | 'FOUNDATION';
  website?: string;
}
```

### Province Model

```typescript
interface Province {
  id: string;
  code: string;
  name: string;
  districts: District[];
}
```

### District Model

```typescript
interface District {
  id: string;
  name: string;
  provinceCode: string;
}
```

### Cover Letter Template Model

```typescript
interface CoverLetterTemplate {
  id: string;
  title: string;
  content: string;
  category: 
    | 'SOFTWARE_DEVELOPER'
    | 'FRONTEND_DEVELOPER'
    | 'BACKEND_DEVELOPER'
    | 'FULLSTACK_DEVELOPER'
    | 'DATA_SCIENTIST'
    | 'FINANCIAL_ANALYST'
    | 'INVESTMENT_BANKER'
    | 'FINANCIAL_ADVISOR'
    | 'ACCOUNTING_SPECIALIST'
    | 'RISK_ANALYST'
    | 'NURSE'
    | 'DOCTOR'
    | 'PHARMACIST'
    | 'TEACHER'
    | 'ACADEMIC_ADMINISTRATOR'
    | 'MARKETING_SPECIALIST';
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

### Session Management

- JWT tokens are tied to user sessions
- Sessions are stored server-side
- Multiple device login supported
- Session extension on activity

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

- 31 pre-written professional templates (no AI dependency)
- 16 categories across 5 industries: Technology, Finance, Healthcare, Education, Marketing
- Multi-language support (Turkish & English)
- Dynamic placeholder replacement system
- Template initialization via admin endpoint
- Public access for browsing templates

### Security Features

- CORS protection
- Helmet security headers
- Request size limits (10MB)
- Input validation and sanitization
- Password hashing with bcrypt
- JWT token expiration
- Session-based authentication
