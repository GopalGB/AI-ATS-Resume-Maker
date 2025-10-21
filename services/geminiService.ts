// services/geminiService.ts
import { GoogleGenAI, Type } from "@google/genai";
import { TailoredResumeResponse } from "../types";

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

export const tailorResumeAndScore = async (resumeText: string, jobDescriptionText: string): Promise<TailoredResumeResponse> => {
    const prompt = `
You are an expert AI resume curator and career coach for a top-tier recruiting firm. Your standards are exceptionally high. Your task is to analyze a candidate's master resume and strategically tailor it for a specific job description.

**Candidate's Master Resume (may include many projects):**
---
${resumeText}
---

**Target Job Description:**
---
${jobDescriptionText}
---

**CRITICAL INSTRUCTIONS:**
1.  **SCORE THE ORIGINAL:** First, score the raw, untailored master resume against the job description from 0-100.
2.  **CURATE, DON'T JUST REWRITE:** Your primary job is to be a curator.
    *   **PROJECT SELECTION:** From the master resume, you MUST select only the 2-3 most relevant and impactful projects that directly align with the job description. If a project has a URL (like a GitHub link), you MUST extract and include it. Create a "KEY PROJECTS" section with your selections.
    *   **CONCISENESS IS KEY:** The final resume MUST be concise enough to fit on a single page. You have the authority to remove or condense less relevant bullet points from the work experience to achieve this. Prioritize impact over volume.
3.  **TAILOR THE CONTENT:** Rewrite the summary, experience bullet points, and skills to perfectly align with the job's language. Use strong action verbs and quantify achievements.
4.  **CATEGORIZE SKILLS:** Group the skills into logical categories (e.g., 'Programming', 'Databases', 'Cloud Technologies', 'BI Tools').
5.  **SCORE YOUR WORK:** After tailoring, provide a new, improved score for your curated version.
6.  **PROVIDE EXPERT FEEDBACK:** Briefly explain your strategic choices (e.g., why you selected certain projects and condensed certain experiences).
7.  **OFFER ACTIONABLE ADVICE:** Give 3-5 concrete suggestions for the candidate to improve their overall profile for this career path.

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