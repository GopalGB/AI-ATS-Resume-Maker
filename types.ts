// types.ts

export interface Project {
  name: string;
  description: string[];
  technologies?: string;
  link?: string;
}

export interface StructuredResume {
  name: string;
  contact: {
    email: string;
    phone: string;
    linkedin?: string;
    github?: string;
    portfolio?: string;
  };
  summary: string;
  experience: {
    job_title: string;
    company: string;
    location: string;
    start_date: string;
    end_date: string;
    responsibilities: string[];
  }[];
  projects?: Project[];
  education: {
    degree: string;
    university: string;
    location: string;
    graduation_date: string;
  }[];
  skills: {
    category: string;
    items: string[];
  }[];
}

export interface TailoredResumeResponse {
  original_score: number;
  tailored_score: number;
  tailored_resume_text: string;
  tailored_resume_structured: StructuredResume;
  feedback: string;
  suggested_improvements: string[];
}

// --- New types for ATS Friendliness Check ---

export interface ParsedAtsData {
    name?: string;
    email?: string;
    phone?: string;
    experience?: { job_title: string; company: string; dates: string; }[];
    skills?: string[];
    education?: { degree: string; university: string, graduation_date: string }[]
}

export interface AtsCheckResponse {
    ats_score: number;
    summary: string;
    strengths: string[];
    improvements: string[];
    parsed_data_summary: string;
}