// services/geminiService.ts
import { GoogleGenAI, Type } from "@google/genai";
import { TailoredResumeResponse, AtsCheckResponse } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const responseSchema = {
    type: Type.OBJECT,
    properties: {
        original_score: { type: Type.NUMBER, description: "The match score of the original resume from 0 to 100." },
        tailored_score: { type: Type.NUMBER, description: "The match score of the tailored resume from 0 to 100." },
        tailored_resume_text: { type: Type.STRING, description: "The full tailored resume as a single string of text, formatted for readability." },
        tailored_resume_structured: {
            type: Type.OBJECT,
            description: "The tailored resume in a structured format.",
            properties: {
                name: { type: Type.STRING },
                contact: {
                    type: Type.OBJECT,
                    properties: {
                        email: { type: Type.STRING },
                        phone: { type: Type.STRING },
                        linkedin: { type: Type.STRING, description: "LinkedIn profile URL (optional)." },
                        github: { type: Type.STRING, description: "GitHub profile URL (optional)." },
                        portfolio: { type: Type.STRING, description: "Portfolio URL (optional)." },
                    },
                    required: ["email", "phone"]
                },
                summary: { type: Type.STRING, description: "A professional summary tailored to the job." },
                experience: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            job_title: { type: Type.STRING },
                            company: { type: Type.STRING },
                            location: { type: Type.STRING },
                            start_date: { type: Type.STRING },
                            end_date: { type: Type.STRING },
                            responsibilities: { type: Type.ARRAY, items: { type: Type.STRING } }
                        },
                        required: ["job_title", "company", "location", "start_date", "end_date", "responsibilities"]
                    }
                },
                projects: {
                    type: Type.ARRAY,
                    description: "An array of 2-3 projects most relevant to the job description.",
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            name: { type: Type.STRING },
                            description: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Bulleted list of responsibilities or achievements." },
                            technologies: { type: Type.STRING, description: "Comma-separated list of technologies used." },
                            link: { type: Type.STRING, description: "A URL for the project (e.g., GitHub, live demo), if available." }
                        },
                         required: ["name", "description"]
                    }
                },
                education: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            degree: { type: Type.STRING },
                            university: { type: Type.STRING },
                            location: { type: Type.STRING },
                            graduation_date: { type: Type.STRING }
                        },
                        required: ["degree", "university", "graduation_date"]
                    }
                },
                skills: { 
                    type: Type.ARRAY,
                    description: "Skills grouped by category.",
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        category: { type: Type.STRING, description: "e.g., Programming, Databases, Tools" },
                        items: { type: Type.ARRAY, items: { type: Type.STRING } }
                      },
                      required: ["category", "items"]
                    }
                 }
            },
            required: ["name", "contact", "summary", "experience", "education", "skills"]
        },
        feedback: { type: Type.STRING, description: "Constructive feedback on the original resume and the changes made." },
        suggested_improvements: { type: Type.ARRAY, items: { type: Type.STRING }, description: "A list of actionable suggestions for further improvement." }
    },
    required: ["original_score", "tailored_score", "tailored_resume_text", "tailored_resume_structured", "feedback", "suggested_improvements"]
};

export const tailorResumeAndScore = async (resumeText: string, jobDescriptionText: string, atsImprovements: string[]): Promise<TailoredResumeResponse> => {
    const prompt = `
You are an expert AI resume curator and career coach for a top-tier recruiting firm. Your standards are exceptionally high. Your task is to analyze a candidate's master resume, incorporate critical ATS feedback, and strategically tailor it for a specific job description.

**Candidate's Master Resume (may include many projects):**
---
${resumeText}
---

**Target Job Description:**
---
${jobDescriptionText}
---

**CRITICAL ATS FEEDBACK (MUST INCORPORATE):**
The original resume was analyzed by an ATS parser, which identified the following critical issues. You MUST fix these issues in the tailored version.
---
${atsImprovements.map(item => `- ${item}`).join('\n')}
---

**CRITICAL TAILORING INSTRUCTIONS:**
1.  **ADDRESS ATS FEEDBACK:** Your #1 priority is to resolve all the ATS feedback provided above. This includes fixing formatting, adding missing keywords, and ensuring standard section headers.
2.  **SCORE THE ORIGINAL:** First, score the raw, untailored master resume against the job description from 0-100.
3.  **CURATE, DON'T JUST REWRITE:**
    *   **PROJECT SELECTION:** From the master resume, you MUST select only the 2-3 most relevant and impactful projects that directly align with the job description. If a project has a URL (like a GitHub link), you MUST extract and include it.
    *   **CONCISENESS (ONE PAGE):** The final resume MUST be concise enough to fit on a single page. Remove or condense less relevant bullet points from work experience to achieve this. Prioritize impact over volume.
4.  **TAILOR THE CONTENT:** Rewrite the summary, experience bullet points, and skills to perfectly align with the job's language. Use strong action verbs and quantify achievements.
5.  **CATEGORIZE SKILLS:** Group the skills into logical categories (e.g., 'Programming', 'Databases', 'Cloud Technologies', 'BI Tools').
6.  **SCORE YOUR WORK:** After tailoring, provide a new, improved score for your curated version.
7.  **PROVIDE EXPERT FEEDBACK:** Briefly explain your strategic choices, including how you addressed the ATS feedback.
8.  **OFFER ACTIONABLE ADVICE:** Give 3-5 concrete suggestions for the candidate to improve their overall profile for this career path.

Produce the final output in the specified JSON format. Failure to follow these rules will result in a rejected application.
`;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-pro",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: responseSchema,
                temperature: 0.4,
            },
        });
        
        const responseText = response.text?.trim();
        if (!responseText) {
          throw new Error("The AI returned an empty response. Please check your inputs and try again.");
        }

        let result;
        try {
            result = JSON.parse(responseText);
        } catch (parseError) {
            console.error("Failed to parse AI response:", responseText);
            throw new Error("The AI returned a response that could not be understood. Please try again.");
        }

        if (!result.tailored_resume_structured || !result.tailored_score) {
            console.error("Invalid data structure in AI response:", result);
            throw new Error("The AI response was missing critical information. Please try again.");
        }

        return result as TailoredResumeResponse;
    } catch (error) {
        console.error("Error calling Gemini API:", error);
        if (error instanceof Error) {
            if (error.message.includes('API key not valid')) {
                 throw new Error("Authentication failed. Please ensure your API key is correctly configured.");
            }
            if (error.message.includes('deadline')) {
                 throw new Error("The request timed out. The server might be busy, please try again in a moment.");
            }
            // Use the specific error message if available, otherwise fall back
            throw new Error(error.message || "An error occurred while communicating with the AI model.");
        }
        throw new Error("An unknown error occurred while communicating with the AI model.");
    }
};

const atsCheckSchema = {
    type: Type.OBJECT,
    properties: {
        ats_score: { type: Type.NUMBER, description: "A critical score from 0-100 on how well the resume is optimized for ATS. 90+ is exceptional. Below 70 indicates significant parsing risks." },
        summary: { type: Type.STRING, description: "A brief, overall assessment of the resume's ATS compatibility." },
        strengths: { type: Type.ARRAY, items: { type: Type.STRING }, description: "A list of 2-4 things the resume does well from an ATS perspective." },
        improvements: { type: Type.ARRAY, items: { type: Type.STRING }, description: "A list of 2-4 specific, actionable recommendations to improve the ATS score." },
        parsed_data_summary: { type: Type.STRING, description: "A high-level summary of the key information you were able to parse, such as name, latest job title, and number of skills identified. Example: 'Successfully parsed John Doe's contact info, 3 past roles, and 15 skills.'" },
    },
    required: ["ats_score", "summary", "strengths", "improvements", "parsed_data_summary"]
};


export const checkAtsFriendliness = async (resumeText: string, jobDescriptionText: string): Promise<AtsCheckResponse> => {
     const prompt = `
You are a state-of-the-art Applicant Tracking System (ATS) parser used by major tech companies. Your sole purpose is to analyze a resume's text for machine-readability and keyword alignment. You do not judge the candidate's experience, only the resume's format and content structure.

**Resume Text:**
---
${resumeText}
---

**Job Description for Keyword Analysis:**
---
${jobDescriptionText}
---

**ATS ANALYSIS INSTRUCTIONS:**
1.  **SCORE CRITICALLY:** Provide a stringent ATS score from 0-100.
    *   **90-100 (Exceptional):** Near-perfect formatting. Uses standard sections, parsable dates, and strong keyword alignment.
    *   **70-89 (Good):** Generally well-formatted but has minor issues like non-standard date formats or suboptimal keyword usage that could be improved.
    *   **Below 70 (Risky):** Contains significant issues that will likely cause parsing errors in many ATS systems. This could include complex formatting, missing keywords, or unclear section headers.
2.  **IDENTIFY STRENGTHS:** What makes this resume ATS-friendly? (e.g., "Clear section headings like 'Professional Experience'", "Use of quantifiable results").
3.  **FIND IMPROVEMENTS:** What are the biggest risks to successful parsing? Be specific. (e.g., "The 'Skills' section uses a graphical chart which is unreadable; list skills as plain text.", "Date format 'Fall 2022' is ambiguous; use 'MM/YYYY' format.", "Lacks keywords from the job description such as 'CI/CD' and 'Agile'.").
4.  **SUMMARIZE PARSED DATA:** Briefly confirm what key information you were able to extract to show the user what a machine "sees". Do not regurgitate the whole resume.

Provide your analysis in the specified JSON format. Your evaluation must be objective and based purely on ATS compatibility standards.
`;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-pro",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: atsCheckSchema,
                temperature: 0.2,
            },
        });

        const responseText = response.text?.trim();
        if (!responseText) {
            throw new Error("The ATS analysis returned an empty response.");
        }
        
        const result = JSON.parse(responseText);
        if (!result.ats_score || !result.improvements) {
             throw new Error("The ATS analysis response was missing critical information.");
        }

        return result as AtsCheckResponse;

    } catch (error) {
        console.error("Error during ATS check:", error);
        if (error instanceof Error) {
            throw new Error(error.message || "An error occurred during the ATS friendliness check.");
        }
        throw new Error("An unknown error occurred during the ATS friendliness check.");
    }
}