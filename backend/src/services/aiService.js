/**
 * AI Service — Ollama only
 * Used for: resume parsing, skill extraction, path generation, test question generation
 */
import axios from 'axios';

const OLLAMA_URL = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'llama3.2';

async function generate(prompt) {
  try {
    const res = await axios.post(
      `${OLLAMA_URL}/api/generate`,
      { model: OLLAMA_MODEL, prompt, stream: false, format: 'json' },
      { timeout: 90000 }
    );
    return res.data.response;
  } catch (err) {
    throw new Error(`Ollama is unavailable (${OLLAMA_URL}). Make sure Ollama is running with: ollama serve. Original error: ${err.message}`);
  }
}

function safeParseJson(raw) {
  try {
    // Sometimes the model wraps in ```json ... ```
    const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    return JSON.parse(cleaned);
  } catch {
    return null;
  }
}

// ─── Resume Parsing ──────────────────────────────────────────────────────────
export async function parseResume(resumeText) {
  const prompt = `
You are a resume parsing AI. Extract structured information from the resume text below.
Return ONLY a JSON object with this exact shape (no extra text):
{
  "name": "Full Name",
  "email": "email@example.com",
  "phone": "phone number or null",
  "location": "City, Country or null",
  "headline": "Professional headline (infer from experience) or null",
  "education": [{"institution": "", "degree": "", "field": "", "year": null}],
  "workHistory": [{"title": "", "company": "", "duration": "", "description": ""}],
  "skills": [{"skillName": "", "proficiency": "beginner|intermediate|advanced|expert"}],
  "industry": "primary industry or null",
  "confidence": 0.0
}
proficiency must be one of: beginner, intermediate, advanced, expert
confidence: 0-1 float representing how complete/readable the resume is.
Resume text:
---
${resumeText.slice(0, 6000)}
---`;
  const raw = await generate(prompt);
  return safeParseJson(raw) || { skills: [], confidence: 0.3 };
}

// ─── Skill Extraction from Job Text ─────────────────────────────────────────
export async function extractJobSkills(jobText) {
  const prompt = `
You are a job requirement extraction AI. Extract required skills from the job posting below.
Return ONLY a JSON object:
{
  "skills": [
    {"skillName": "skill name", "proficiency": "beginner|intermediate|advanced|expert", "required": true}
  ],
  "industry": "inferred industry"
}
Job posting:
---
${jobText.slice(0, 4000)}
---`;
  const raw = await generate(prompt);
  return safeParseJson(raw) || { skills: [] };
}

// ─── Learning Path Generation ─────────────────────────────────────────────────
export async function generateLearningPath(skillName, currentProficiency, targetProficiency, jobContext) {
  const prompt = `
You are a learning path designer. Create a structured, bite-sized learning path to help someone go from
${currentProficiency || 'no'} proficiency to ${targetProficiency} proficiency in "${skillName}".
Context: This is for a role: "${jobContext?.jobTitle || 'general'}" at "${jobContext?.companyName || 'a company'}".

Return ONLY a JSON object:
{
  "steps": [
    {
      "order": 1,
      "title": "Step title",
      "description": "What to learn/do and why it matters",
      "type": "read|watch|practice|project|checkpoint",
      "resourceUrl": "https://... or null",
      "estimatedMinutes": 30
    }
  ],
  "totalEstimatedHours": 2.5,
  "rationale": "Why this path closes the gap"
}
Keep it to 5-8 steps. The last step must be type "checkpoint" (the skill test).
Make steps actionable and concrete, not vague.`;
  const raw = await generate(prompt);
  return safeParseJson(raw) || { steps: [] };
}

// ─── Skill Test Question Generation ──────────────────────────────────────────
export async function generateSkillTest(skillName, proficiencyLevel) {
  const prompt = `
You are an expert quiz designer. Generate 8 multiple-choice questions to assess "${skillName}" at ${proficiencyLevel} level.
Return ONLY a JSON object:
{
  "questions": [
    {
      "text": "Question text",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctIndex": 0,
      "explanation": "Why this is correct",
      "difficulty": "easy|medium|hard"
    }
  ]
}
Questions must be realistic and specific to ${skillName}. No trick questions.
Distribute difficulty: 3 easy, 3 medium, 2 hard for intermediate level.`;
  const raw = await generate(prompt);
  return safeParseJson(raw) || { questions: [] };
}
