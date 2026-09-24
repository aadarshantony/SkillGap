import JobEmployer from '../models/JobEmployer.js';
import Application from '../models/Application.js';
import LearnerProfile from '../models/LearnerProfile.js';
import SkillTaxonomy from '../models/SkillTaxonomy.js';
import Credential from '../models/Credential.js';

export async function analyzeJdQuality({ title = '', description = '', requirements = [], salaryMin, salaryMax, location = '', jobType = '' }) {
  let score = 50;
  const strengths = [];
  const improvements = [];

  // Title check
  if (title.length > 5) {
    score += 10;
    strengths.push('Clear and concise job title provided.');
  } else {
    improvements.push('Job title is too short or vague. Use standard industry titles.');
  }

  // Description length & detail check
  const wordCount = description.trim().split(/\s+/).length;
  if (wordCount >= 80) {
    score += 15;
    strengths.push(`Comprehensive job description (${wordCount} words).`);
  } else if (wordCount >= 40) {
    score += 8;
    improvements.push('Job description is brief. Add more context about day-to-day responsibilities and team culture.');
  } else {
    score -= 10;
    improvements.push('Job description is very sparse (<40 words). Candidates prefer detailed role expectations.');
  }

  // Requirements check
  if (requirements.length >= 3) {
    score += 15;
    strengths.push(`Structured skill requirements specified (${requirements.length} skills).`);
  } else if (requirements.length >= 1) {
    score += 5;
    improvements.push('Add at least 3 specific skill requirements to maximize verified match accuracy.');
  } else {
    score -= 15;
    improvements.push('No skill requirements attached! Adding skills enables automated candidate verification.');
  }

  // Mandatory vs Optional mix
  const reqCount = requirements.filter(r => r.required).length;
  if (reqCount > 0 && reqCount < requirements.length) {
    score += 5;
    strengths.push('Good balance of required mandatory skills vs optional nice-to-haves.');
  } else if (reqCount === requirements.length && requirements.length > 4) {
    improvements.push('All skills are marked as mandatory. Consider making 1-2 skills optional to attract broader talent.');
  }

  // Salary transparency check
  if (salaryMin && salaryMax) {
    score += 10;
    strengths.push('Salary transparency: Provided explicit salary range.');
  } else {
    improvements.push('Missing salary range. Listings with salary transparency receive 1.8x more qualified applicants.');
  }

  // Location check
  if (location.length > 2) {
    score += 5;
    strengths.push(`Location specified (${location}).`);
  }

  score = Math.max(10, Math.min(100, score));

  let grade = 'B';
  if (score >= 90) grade = 'A+';
  else if (score >= 78) grade = 'A';
  else if (score >= 65) grade = 'B';
  else if (score >= 50) grade = 'C';
  else grade = 'Needs Work';

  return {
    qualityScore: score,
    grade,
    wordCount,
    strengths,
    improvements,
    summary: `Your JD scored ${score}/100 (${grade}). ${improvements.length === 0 ? 'Excellent, market-aligned posting!' : 'Follow the suggestions below to optimize candidate quality.'}`,
  };
}

export async function detectJdRequirements({ title = '', description = '', requirements = [] }) {
  const detectedSkills = [];
  const redFlags = [];

  const textToScan = `${title} ${description}`.toLowerCase();

  // Search taxonomy for matches
  const taxonomy = await SkillTaxonomy.find({});
  for (const skill of taxonomy) {
    const sName = skill.name.toLowerCase();
    const isMentioned = textToScan.includes(sName) || (skill.aliases || []).some(a => textToScan.includes(a.toLowerCase()));
    if (isMentioned) {
      detectedSkills.push({
        skillName: skill.name,
        category: skill.category,
        suggestedProficiency: textToScan.includes('senior') || textToScan.includes('lead') || textToScan.includes('expert') ? 'advanced' : 'intermediate',
        alreadyAdded: requirements.some(r => r.skillName.toLowerCase() === skill.name.toLowerCase()),
      });
    }
  }

  // Check for AI / Unrealistic red flags
  const aiBuzzwords = ['synergy', 'rockstar', 'ninja', 'game-changer', 'paradigm shift', 'world-class', 'guru', '10x engineer'];
  const foundBuzzwords = aiBuzzwords.filter(bw => textToScan.includes(bw));
  if (foundBuzzwords.length >= 2) {
    redFlags.push({
      type: 'ai_fluff',
      title: 'Heavy Buzzword Padding Detected',
      description: `Found cliché buzzwords: "${foundBuzzwords.join('", "')}". Replace with concrete responsibilities to sound authentic.`,
    });
  }

  // Experience contradiction check
  const expMatch = textToScan.match(/(\d+)\+?\s*years?/i);
  if (expMatch) {
    const yrs = parseInt(expMatch[1]);
    if (yrs >= 8 && (textToScan.includes('junior') || textToScan.includes('associate') || textToScan.includes('intern'))) {
      redFlags.push({
        type: 'unrealistic_experience',
        title: 'Unrealistic Experience Requirement',
        description: `Demanding ${yrs}+ years of experience for a Junior/Associate title creates candidate friction.`,
      });
    }
    if (yrs >= 10 && requirements.length <= 1) {
      redFlags.push({
        type: 'missing_technical_depth',
        title: 'High Experience with Undefined Skills',
        description: `Asking for ${yrs}+ years experience but specifying very few concrete skill benchmarks.`,
      });
    }
  }

  // Assess overall realism
  let realismStatus = 'Realistic & Genuine';
  if (redFlags.length >= 2) realismStatus = 'Unrealistic / AI-Generated Fluff';
  else if (redFlags.length === 1) realismStatus = 'Needs Tuning';

  // Generate structured optimized JD template
  const formattedSkillsList = (requirements.length > 0 ? requirements : detectedSkills.slice(0, 4)).map(s => `• ${s.skillName || s} (${s.proficiency || 'intermediate'})`).join('\n');
  const betterJd = `### Role Overview\nWe are looking for a skilled **${title || 'Professional'}** to join our team. You will drive core deliverables, collaborate with cross-functional partners, and uphold industry best practices.\n\n### Key Responsibilities\n• Take ownership of daily domain operations and key project milestones.\n• Uphold statutory standards, performance KPIs, and quality benchmarks.\n• Collaborate with internal leads to optimize team workflows.\n\n### Core Skills & Benchmarks\n${formattedSkillsList || '• Relevant domain expertise\n• Analytical problem solving'}\n\n### Qualifications\n• Proven track record in equivalent role or verified skill credentials.\n• Strong communication and organizational capabilities.`;

  return {
    realismStatus,
    redFlags,
    detectedSkills,
    betterJd,
  };
}

export async function getEmployerRejectionInsights(employerId) {
  const jobs = await JobEmployer.find({ employerId });
  const jobIds = jobs.map(j => j._id.toString());

  const applications = await Application.find({ jobId: { $in: jobIds }, jobType: 'employer' });
  const totalApps = applications.length;

  if (totalApps === 0) {
    return {
      totalApplications: 0,
      rejectionFunnel: [
        { stage: 'Applied', count: 0, percentage: 0 },
        { stage: 'Pending Skill Assessment', count: 0, percentage: 0 },
        { stage: 'Assessment Failed (<70%)', count: 0, percentage: 0 },
        { stage: 'Verified & Submitted', count: 0, percentage: 0 },
      ],
      topMissingSkills: [],
      insightsAdvice: ['Post listings with clear skill requirements to gather applicant rejection analytics.'],
    };
  }

  const pendingTestCount = applications.filter(a => a.status === 'pending_test').length;
  const submittedCount = applications.filter(a => a.status === 'submitted').length;
  const lowMatchCount = applications.filter(a => (a.matchScore || 0) < 60).length;

  // Aggregate missing skills across applications
  const learnerIds = applications.map(a => a.learnerId);
  const profiles = await LearnerProfile.find({ userId: { $in: learnerIds } });
  const credentials = await Credential.find({ learnerId: { $in: learnerIds }, status: 'active' });

  const profileMap = new Map(profiles.map(p => [p.userId.toString(), p]));
  const credMap = new Map();
  for (const c of credentials) {
    const k = c.learnerId.toString();
    if (!credMap.has(k)) credMap.set(k, []);
    credMap.get(k).push(c);
  }

  const missingSkillCounts = {};
  for (const app of applications) {
    const job = jobs.find(j => j._id.toString() === app.jobId);
    if (!job) continue;
    const profile = profileMap.get(app.learnerId.toString());
    const learnerSkills = new Set((profile?.skills || []).map(s => s.skillName.toLowerCase()));

    for (const req of job.requirements || []) {
      if (req.required && !learnerSkills.has(req.skillName.toLowerCase())) {
        missingSkillCounts[req.skillName] = (missingSkillCounts[req.skillName] || 0) + 1;
      }
    }
  }

  const topMissingSkills = Object.entries(missingSkillCounts)
    .map(([skillName, count]) => ({ skillName, count, percentage: Math.round((count / totalApps) * 100) }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const rejectionFunnel = [
    { stage: 'Total Candidates Applied', count: totalApps, percentage: 100 },
    { stage: 'Pending Skill Assessment', count: pendingTestCount, percentage: Math.round((pendingTestCount / totalApps) * 100) },
    { stage: 'Low Match Score (<60%)', count: lowMatchCount, percentage: Math.round((lowMatchCount / totalApps) * 100) },
    { stage: 'Fully Verified & Submitted', count: submittedCount, percentage: Math.round((submittedCount / totalApps) * 100) },
  ];

  const insightsAdvice = [];
  if (pendingTestCount > 0) {
    insightsAdvice.push(`${pendingTestCount} candidate(s) are currently taking the required skill assessment. Standard completion window is 48 hours.`);
  }
  if (topMissingSkills[0]) {
    insightsAdvice.push(`Most common skill gap among applicants: "${topMissingSkills[0].skillName}" (missing in ${topMissingSkills[0].percentage}% of candidates).`);
  }
  if (lowMatchCount > 0) {
    insightsAdvice.push(`Consider lowering proficiency level or marking non-essential skills as optional to increase candidate flow.`);
  }

  return {
    totalApplications: totalApps,
    rejectionFunnel,
    topMissingSkills,
    insightsAdvice,
  };
}
