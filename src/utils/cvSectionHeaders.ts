export function getSectionHeaders(language: 'turkish' | 'english') {
  if (language === 'turkish') {
    return {
      objective: 'HEDEF',
      experience: 'DENEYİM',
      education: 'EĞİTİM',
      technicalSkills: 'TEKNİK BECERİLER',
      projects: 'PROJELER',
      certificates: 'SERTİFİKALAR',
      languages: 'DİLLER',
      communication: 'İLETİŞİM',
      leadership: 'LİDERLİK',
      references: 'REFERANSLAR',
    };
  } else {
    return {
      objective: 'OBJECTIVE',
      experience: 'EXPERIENCE',
      education: 'EDUCATION',
      technicalSkills: 'TECHNICAL SKILLS',
      projects: 'PROJECTS',
      certificates: 'CERTIFICATES',
      languages: 'LANGUAGES',
      communication: 'COMMUNICATION',
      leadership: 'LEADERSHIP',
      skills: 'SKILLS',
      references: 'REFERENCES',
    };
  }
}