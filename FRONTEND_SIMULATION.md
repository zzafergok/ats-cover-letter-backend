# Frontend Implementation Simulation
## Microsoft ATS Template Kullanımı ve Claude Optimization

### 1. Template Selection Component

```typescript
// components/TemplateSelector.tsx
import React, { useState, useEffect } from 'react';

interface Template {
  id: string;
  name: string;
  description: string;
  category?: string;
  targetRoles?: string[];
  language?: string;
}

export const TemplateSelector: React.FC = () => {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  
  useEffect(() => {
    // Backend'den template'leri al
    fetch('/api/docx-template-pdf/templates', {
      headers: { 'Authorization': `Bearer ${getToken()}` }
    })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        setTemplates(data.data.templates);
      }
    });
  }, []);

  const microsoftTemplates = templates.filter(t => t.category === 'microsoft-ats');

  return (
    <div className="template-selector">
      <h3>Microsoft ATS-Optimized Templates</h3>
      <div className="template-grid">
        {microsoftTemplates.map(template => (
          <div 
            key={template.id}
            className={`template-card ${selectedTemplate === template.id ? 'selected' : ''}`}
            onClick={() => setSelectedTemplate(template.id)}
          >
            <h4>{template.name}</h4>
            <p>{template.description}</p>
            {template.targetRoles && (
              <div className="target-roles">
                <strong>Best for:</strong> {template.targetRoles.join(', ')}
              </div>
            )}
            {template.language === 'turkish' && (
              <span className="turkish-badge">🇹🇷 Türkçe</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
```

### 2. Job Description Input Component

```typescript
// components/JobDescriptionInput.tsx
import React, { useState } from 'react';

interface JobDescriptionInputProps {
  onJobDescriptionChange: (jobDesc: string, targetCompany: string) => void;
  useClaudeOptimization: boolean;
  onOptimizationToggle: (enabled: boolean) => void;
}

export const JobDescriptionInput: React.FC<JobDescriptionInputProps> = ({
  onJobDescriptionChange,
  useClaudeOptimization,
  onOptimizationToggle
}) => {
  const [jobDescription, setJobDescription] = useState('');
  const [targetCompany, setTargetCompany] = useState('');

  const handleJobDescChange = (value: string) => {
    setJobDescription(value);
    onJobDescriptionChange(value, targetCompany);
  };

  const handleCompanyChange = (value: string) => {
    setTargetCompany(value);
    onJobDescriptionChange(jobDescription, value);
  };

  return (
    <div className="job-description-input">
      <div className="optimization-toggle">
        <label>
          <input
            type="checkbox"
            checked={useClaudeOptimization}
            onChange={(e) => onOptimizationToggle(e.target.checked)}
          />
          🤖 Claude AI ile ATS Optimizasyonu
        </label>
        <p className="optimization-info">
          CV içeriğiniz iş tanımına göre AI ile optimize edilir ve ATS uyumluluğu artırılır.
        </p>
      </div>

      {useClaudeOptimization && (
        <div className="optimization-inputs">
          <div className="form-group">
            <label htmlFor="targetCompany">Hedef Şirket (Opsiyonel)</label>
            <input
              id="targetCompany"
              type="text"
              value={targetCompany}
              onChange={(e) => handleCompanyChange(e.target.value)}
              placeholder="Örn: Microsoft, Google, Amazon"
              className="form-control"
            />
          </div>

          <div className="form-group">
            <label htmlFor="jobDescription">İş Tanımı *</label>
            <textarea
              id="jobDescription"
              value={jobDescription}
              onChange={(e) => handleJobDescChange(e.target.value)}
              placeholder="İş tanımını buraya yapıştırın. AI, CV'nizi bu iş tanımına göre optimize edecek..."
              rows={8}
              className="form-control"
              required={useClaudeOptimization}
            />
            <div className="char-count">
              {jobDescription.length} karakter
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
```

### 3. Main CV Generation Form

```typescript
// components/ATSCVGenerationForm.tsx
import React, { useState } from 'react';

interface CVData {
  personalInfo: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    address: { city: string; country: string; };
    // ... other fields
  };
  // ... other sections
  configuration: {
    language: 'TURKISH' | 'ENGLISH';
    cvType: 'ATS_OPTIMIZED' | 'TECHNICAL' | 'EXECUTIVE';
    templateStyle: 'MINIMAL' | 'PROFESSIONAL' | 'MODERN';
    jobDescription?: string;
    targetCompany?: string;
    useAI: boolean;
  };
}

export const ATSCVGenerationForm: React.FC = () => {
  const [cvData, setCvData] = useState<CVData>({} as CVData);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('office-manager');
  const [useClaudeOptimization, setUseClaudeOptimization] = useState<boolean>(false);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generationResult, setGenerationResult] = useState<any>(null);

  const handleGenerate = async () => {
    setIsGenerating(true);
    
    try {
      const requestBody = {
        ...cvData,
        useDocxTemplate: true,
        docxTemplateId: selectedTemplate,
        useClaudeOptimization: useClaudeOptimization,
        configuration: {
          ...cvData.configuration,
          useAI: useClaudeOptimization
        }
      };

      const response = await fetch('/api/ats-cv/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getToken()}`
        },
        body: JSON.stringify(requestBody)
      });

      const result = await response.json();
      
      if (result.success) {
        setGenerationResult(result.data);
        // Success notification
        showNotification('CV başarıyla oluşturuldu!', 'success');
      } else {
        throw new Error(result.message || 'CV oluşturulamadı');
      }
      
    } catch (error) {
      console.error('CV Generation failed:', error);
      showNotification(
        error.message || 'CV oluşturulurken bir hata oluştu', 
        'error'
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const handleJobDescriptionChange = (jobDesc: string, targetCompany: string) => {
    setCvData(prev => ({
      ...prev,
      configuration: {
        ...prev.configuration,
        jobDescription: jobDesc,
        targetCompany: targetCompany
      }
    }));
  };

  return (
    <div className="ats-cv-generation-form">
      <h2>ATS Uyumlu CV Oluştur</h2>
      
      {/* Template Selection */}
      <section className="form-section">
        <TemplateSelector 
          selectedTemplate={selectedTemplate}
          onTemplateSelect={setSelectedTemplate}
        />
      </section>

      {/* Job Description & Claude Optimization */}
      <section className="form-section">
        <JobDescriptionInput
          onJobDescriptionChange={handleJobDescriptionChange}
          useClaudeOptimization={useClaudeOptimization}
          onOptimizationToggle={setUseClaudeOptimization}
        />
      </section>

      {/* CV Data Form Sections */}
      <section className="form-section">
        <PersonalInfoForm 
          data={cvData.personalInfo}
          onChange={(data) => setCvData(prev => ({...prev, personalInfo: data}))}
        />
      </section>

      <section className="form-section">
        <WorkExperienceForm 
          data={cvData.workExperience}
          onChange={(data) => setCvData(prev => ({...prev, workExperience: data}))}
        />
      </section>

      <section className="form-section">
        <EducationForm 
          data={cvData.education}
          onChange={(data) => setCvData(prev => ({...prev, education: data}))}
        />
      </section>

      <section className="form-section">
        <SkillsForm 
          data={cvData.skills}
          onChange={(data) => setCvData(prev => ({...prev, skills: data}))}
        />
      </section>

      {/* Generation Controls */}
      <section className="form-actions">
        <div className="generation-info">
          {useClaudeOptimization && (
            <div className="claude-info">
              <h4>🤖 Claude AI Optimization Aktif</h4>
              <ul>
                <li>✅ İş tanımına göre keyword optimizasyonu</li>
                <li>✅ ATS uyumlu içerik geliştirme</li>
                <li>✅ Başarıları sayısal metriklerle güçlendirme</li>
                <li>✅ Template'e özel optimizasyon</li>
              </ul>
            </div>
          )}
        </div>

        <button
          className={`generate-btn ${isGenerating ? 'generating' : ''}`}
          onClick={handleGenerate}
          disabled={isGenerating || !validateFormData(cvData)}
        >
          {isGenerating ? (
            <>
              <span className="spinner"></span>
              {useClaudeOptimization ? 'AI ile Optimize Ediliyor...' : 'CV Oluşturuluyor...'}
            </>
          ) : (
            `${useClaudeOptimization ? '🤖 AI ile ' : ''}CV Oluştur`
          )}
        </button>
      </section>

      {/* Results */}
      {generationResult && (
        <section className="generation-result">
          <h3>✅ CV Başarıyla Oluşturuldu!</h3>
          <div className="result-info">
            <p><strong>Dosya:</strong> {generationResult.fileName}</p>
            <p><strong>Boyut:</strong> {formatFileSize(generationResult.fileSize)}</p>
            <p><strong>Template:</strong> {selectedTemplate}</p>
            {useClaudeOptimization && (
              <p><strong>AI Optimizasyon:</strong> ✅ Aktif</p>
            )}
          </div>
          <div className="result-actions">
            <a 
              href={generationResult.downloadUrl}
              className="btn btn-primary"
              target="_blank"
              rel="noopener noreferrer"
            >
              📄 CV'yi İndir
            </a>
            <button 
              className="btn btn-secondary"
              onClick={() => window.open(`/api/docx-template-pdf/preview/${selectedTemplate}`, '_blank')}
            >
              👁️ Template Önizle
            </button>
          </div>
        </section>
      )}
    </div>
  );
};
```

### 4. Template Preview Component

```typescript
// components/TemplatePreview.tsx
import React, { useState } from 'react';

interface TemplatePreviewProps {
  templateId: string;
}

export const TemplatePreview: React.FC<TemplatePreviewProps> = ({ templateId }) => {
  const [isLoading, setIsLoading] = useState(false);

  const openPreview = async () => {
    setIsLoading(true);
    try {
      // Backend'den preview al
      const response = await fetch(`/api/docx-template-pdf/preview/${templateId}`, {
        headers: { 'Authorization': `Bearer ${getToken()}` }
      });
      
      if (response.ok) {
        // PDF'i yeni sekmede aç
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank');
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      } else {
        throw new Error('Preview oluşturulamadı');
      }
    } catch (error) {
      showNotification('Template önizlemesi yüklenemedi', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button 
      className="preview-btn"
      onClick={openPreview}
      disabled={isLoading}
    >
      {isLoading ? '⏳ Yükleniyor...' : '👁️ Önizle'}
    </button>
  );
};
```

### 5. Usage Example in Main App

```typescript
// pages/CreateCV.tsx
import React from 'react';
import { ATSCVGenerationForm } from '../components/ATSCVGenerationForm';

export const CreateCVPage: React.FC = () => {
  return (
    <div className="create-cv-page">
      <div className="container">
        <header className="page-header">
          <h1>ATS Uyumlu CV Oluşturucu</h1>
          <p>Microsoft template'leri ve Claude AI ile profesyonel CV'nizi oluşturun</p>
        </header>

        <div className="page-content">
          <ATSCVGenerationForm />
        </div>
      </div>
    </div>
  );
};
```

### 6. API Response Handler

```typescript
// utils/api.ts
export interface CVGenerationResponse {
  success: boolean;
  message: string;
  data?: {
    cvId: string;
    fileName: string;
    fileSize: number;
    generationStatus: 'COMPLETED' | 'PROCESSING' | 'FAILED';
    downloadUrl: string;
    createdAt: string;
    applicantName: string;
    targetPosition: string;
    language: string;
    useAI: boolean;
  };
  errors?: Array<{ message: string }>;
}

export const generateATSCV = async (cvData: any): Promise<CVGenerationResponse> => {
  const response = await fetch('/api/ats-cv/generate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${getToken()}`
    },
    body: JSON.stringify(cvData)
  });

  return await response.json();
};
```

### 7. CSS Styling Example

```css
/* styles/cv-generation.css */
.template-selector .template-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1rem;
  margin: 1rem 0;
}

.template-card {
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  padding: 1rem;
  cursor: pointer;
  transition: all 0.3s ease;
}

.template-card:hover {
  border-color: #007bff;
  box-shadow: 0 4px 8px rgba(0,123,255,0.1);
}

.template-card.selected {
  border-color: #007bff;
  background-color: rgba(0,123,255,0.05);
}

.claude-info {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 1rem;
  border-radius: 8px;
  margin: 1rem 0;
}

.claude-info ul {
  margin: 0.5rem 0 0 0;
  padding-left: 1rem;
}

.generate-btn {
  background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
  color: white;
  border: none;
  padding: 1rem 2rem;
  border-radius: 6px;
  font-size: 1.1rem;
  cursor: pointer;
  transition: all 0.3s ease;
}

.generate-btn.generating {
  background: #6c757d;
  cursor: not-allowed;
}

.spinner {
  display: inline-block;
  width: 1rem;
  height: 1rem;
  border: 2px solid transparent;
  border-top: 2px solid white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-right: 0.5rem;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
```

## Kullanım Akışı:

1. **Template Seçimi**: Kullanıcı Microsoft ATS template'lerinden birini seçer
2. **AI Optimizasyon**: Claude optimizasyonu açar, iş tanımı girer
3. **CV Bilgileri**: Kişisel bilgiler, deneyim, eğitim vs. doldurur
4. **Generate**: Backend'e istek gönderir
5. **AI Processing**: Claude API ile içerik optimize edilir
6. **PDF Generation**: DOCX template kullanılarak PDF oluşturulur
7. **Download**: Optimize edilmiş ATS uyumlu CV indirilir

Bu sistem sayesinde kullanıcılar Microsoft'un profesyonel template'lerini kullanarak, Claude AI ile optimize edilmiş, iş tanımına özel ATS uyumlu CV'ler oluşturabilir! 🚀