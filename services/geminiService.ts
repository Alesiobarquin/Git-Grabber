import { GoogleGenAI } from "@google/genai";
import { ContributionItem } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export async function generateContributionSummary(
  contributions: ContributionItem[],
  studentName: string
): Promise<string> {
  const model = "gemini-2.5-flash";

  if (contributions.length === 0) {
    return "No contributions found to summarize.";
  }

  // Prepare a condensed list for the prompt to save tokens
  const contribText = contributions
    .map((c) => `[${c.type}] ${c.date.split('T')[0]}: ${c.description}`)
    .join("\n");

  const prompt = `
    You are an academic assistant helping a student named ${studentName} write a "Final Contribution Summary" for a software engineering class.
    
    Here is the raw log of their contributions (Commits, Issues, Pull Requests) since the start of the semester:
    
    ${contribText}
    
    Please write a professional, concise paragraph (approx 100-150 words) summarizing their work. 
    - Group related tasks together (e.g., "focused heavily on UI implementation using Tailwind," or "refactored the backend authentication service").
    - Do NOT simply list the commits chronologically.
    - Highlight specific technical achievements based on the commit messages.
    - Use the first person ("I implemented...", "I fixed...").
    - This text will be pasted into the "Optional Comments" section of their submission.
  `;

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
    });
    return response.text || "Could not generate summary.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Error generating summary with AI. Please try again.";
  }
}