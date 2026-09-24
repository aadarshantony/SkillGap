import LearnerProfile from '../models/LearnerProfile.js';
import SkillTaxonomy from '../models/SkillTaxonomy.js';
import JobEmployer from '../models/JobEmployer.js';
import Credential from '../models/Credential.js';
import Application from '../models/Application.js';

const PROFICIENCY_RANK = { beginner: 1, intermediate: 2, advanced: 3, expert: 4 };

export const TARGET_ROLE_DEFINITIONS = [
  {
    roleId: 'hr_manager',
    title: 'Senior HR Manager',
    category: 'Human Resources',
    industry: 'Corporate',
    averageSalary: '₹12L - ₹18L',
    requiredSkills: [
      { name: 'HR Compliance', proficiency: 'advanced', required: true },
      { name: 'Talent Acquisition', proficiency: 'advanced', required: true },
      { name: 'Employee Relations', proficiency: 'intermediate', required: true },
      { name: 'Performance Management', proficiency: 'intermediate', required: false },
    ],
    description: 'Oversee statutory HR compliance, employee relations, grievance handling, and talent acquisition pipelines.',
  },
  {
    roleId: 'b2b_sales_lead',
    title: 'Corporate Sales Lead',
    category: 'Sales',
    industry: 'Corporate',
    averageSalary: '₹10L - ₹16L',
    requiredSkills: [
      { name: 'B2B Sales', proficiency: 'advanced', required: true },
      { name: 'CRM Systems', proficiency: 'intermediate', required: true },
      { name: 'Sales Negotiation', proficiency: 'advanced', required: true },
    ],
    description: 'Drive strategic B2B revenue, corporate client acquisition, and high-value deal closing.',
  },
  {
    roleId: 'corporate_lawyer',
    title: 'Corporate Legal Counsel',
    category: 'Legal',
    industry: 'Legal',
    averageSalary: '₹14L - ₹22L',
    requiredSkills: [
      { name: 'Legal Writing & Contract Law', proficiency: 'advanced', required: true },
      { name: 'Corporate Compliance', proficiency: 'intermediate', required: true },
    ],
    description: 'Draft commercial contracts, advise on regulatory compliance, and mitigate legal risk.',
  },
  {
    roleId: 'senior_educator',
    title: 'Senior Educator & Pedagogy Lead',
    category: 'Education',
    industry: 'Education',
    averageSalary: '₹6L - ₹10L',
    requiredSkills: [
      { name: 'Lesson Planning', proficiency: 'advanced', required: true },
      { name: 'Classroom Management', proficiency: 'advanced', required: true },
      { name: 'Student Evaluation', proficiency: 'intermediate', required: false },
    ],
    description: 'Lead curriculum design, classroom instruction strategies, and student outcome evaluations.',
  },
  {
    roleId: 'digital_mkt_lead',
    title: 'Digital Marketing & Growth Lead',
    category: 'Marketing',
    industry: 'Marketing',
    averageSalary: '₹8L - ₹14L',
    requiredSkills: [
      { name: 'Digital Marketing', proficiency: 'advanced', required: true },
      { name: 'Brand Strategy', proficiency: 'intermediate', required: true },
      { name: 'Content Writing', proficiency: 'intermediate', required: false },
    ],
    description: 'Execute multi-channel digital acquisition, SEO/SEM campaigns, and brand growth strategy.',
  },
  {
    roleId: 'financial_accountant',
    title: 'Senior Financial Accountant',
    category: 'Accounting',
    industry: 'Finance',
    averageSalary: '₹9L - ₹15L',
    requiredSkills: [
      { name: 'Financial Accounting', proficiency: 'advanced', required: true },
      { name: 'Tax Compliance', proficiency: 'advanced', required: true },
      { name: 'Financial Analysis', proficiency: 'intermediate', required: false },
    ],
    description: 'Manage corporate financial reporting, GST/Income Tax compliance, and audit preparation.',
  },
  {
    roleId: 'supply_chain_manager',
    title: 'Supply Chain & Operations Manager',
    category: 'Operations',
    industry: 'Logistics',
    averageSalary: '₹11L - ₹17L',
    requiredSkills: [
      { name: 'Supply Chain Optimization', proficiency: 'advanced', required: true },
      { name: 'Inventory Management', proficiency: 'advanced', required: true },
      { name: 'Process Automation', proficiency: 'intermediate', required: false },
    ],
    description: 'Optimize end-to-end logistics, inventory turnover, warehouse workflows, and vendor operations.',
  },
  {
    roleId: 'clinical_pharmacist',
    title: 'Clinical Pharmacist & Healthcare Manager',
    category: 'Healthcare',
    industry: 'Healthcare',
    averageSalary: '₹8L - ₹13L',
    requiredSkills: [
      { name: 'Clinical Pharmacology', proficiency: 'advanced', required: true },
      { name: 'Patient Safety & Care', proficiency: 'advanced', required: true },
      { name: 'Electronic Health Records', proficiency: 'intermediate', required: false },
    ],
    description: 'Oversee clinical drug dispensing, patient safety protocols, and health record management.',
  },
  {
    roleId: 'fullstack_dev',
    title: 'Full-Stack Software Engineer',
    category: 'Programming',
    industry: 'Technology',
    averageSalary: '₹12L - ₹20L',
    requiredSkills: [
      { name: 'JavaScript', proficiency: 'advanced', required: true },
      { name: 'React', proficiency: 'intermediate', required: true },
      { name: 'Python', proficiency: 'intermediate', required: false },
      { name: 'SQL', proficiency: 'intermediate', required: false },
    ],
    description: 'Build robust web applications, REST APIs, responsive React interfaces, and database backends.',
  },
];

export async function getLearnerRoleRecommendations(userId) {
  const profile = await LearnerProfile.findOne({ userId });
  const credentials = await Credential.find({ learnerId: userId, status: 'active' });
  const learnerSkills = profile?.skills || [];
  const learnerMap = new Map(learnerSkills.map(s => [s.skillName.toLowerCase(), s]));

  // Attach credentials info
  const credMap = new Map(credentials.map(c => [c.skillName.toLowerCase(), c]));

  // Fetch active employer jobs count per skill to calculate real-time demand score
  const jobs = await JobEmployer.find({ active: true });
  const jobSkillCounts = {};
  for (const j of jobs) {
    for (const r of j.requirements || []) {
      const k = r.skillName.toLowerCase();
      jobSkillCounts[k] = (jobSkillCounts[k] || 0) + 1;
    }
  }

  const today = new Date().toISOString().slice(0, 10);

  const recommendations = TARGET_ROLE_DEFINITIONS.map(role => {
    let earnedWeight = 0;
    let totalWeight = 0;
    const missingSkills = [];
    const satisfiedSkills = [];

    for (const req of role.requiredSkills) {
      const weight = req.required ? 2 : 1;
      totalWeight += weight;

      const userSkill = learnerMap.get(req.name.toLowerCase());
      const cred = credMap.get(req.name.toLowerCase());
      const isVerified = Boolean(cred || userSkill?.verified);

      const userRank = PROFICIENCY_RANK[userSkill?.proficiency] || 0;
      const targetRank = PROFICIENCY_RANK[req.proficiency] || 2;

      let skillScore = Math.min(1, userRank / targetRank);
      if (isVerified) skillScore = Math.min(1, skillScore * 1.25);

      earnedWeight += skillScore * weight;

      if (skillScore >= 0.8) {
        satisfiedSkills.push({
          skillName: req.name,
          proficiency: userSkill?.proficiency || req.proficiency,
          verified: isVerified,
          score: cred?.score || (isVerified ? 85 : 60),
        });
      } else {
        missingSkills.push({
          skillName: req.name,
          requiredProficiency: req.proficiency,
          currentProficiency: userSkill?.proficiency || 'none',
          gapType: userSkill ? 'insufficient' : 'missing',
          isVerified,
        });
      }
    }

    const matchScore = Math.round((earnedWeight / totalWeight) * 100);

    // Calculate market demand score based on job listings
    let roleDemandCount = 0;
    for (const req of role.requiredSkills) {
      roleDemandCount += jobSkillCounts[req.name.toLowerCase()] || 0;
    }

    // Daily dynamic trend calculation based on date hash + verified credentials
    const seedHash = (userId.toString().charCodeAt(0) + role.roleId.charCodeAt(0) + new Date().getDate()) % 15;
    const dailyGrowthPct = 5 + seedHash + (credentials.length * 2);

    let dailyActionTip = '';
    if (matchScore >= 85) {
      dailyActionTip = `🎉 Top Match! You are highly qualified for ${role.title}. Apply now to open roles!`;
    } else if (missingSkills.length > 0) {
      const nextSkill = missingSkills[0].skillName;
      dailyActionTip = `⚡ Take the 5-min ${nextSkill} skill assessment to boost your match to ${Math.min(98, matchScore + 20)}%!`;
    } else {
      dailyActionTip = `Complete active learning paths to unlock verified credentials for ${role.title}.`;
    }

    return {
      roleId: role.roleId,
      title: role.title,
      category: role.category,
      industry: role.industry,
      averageSalary: role.averageSalary,
      description: role.description,
      matchScore,
      satisfiedSkills,
      missingSkills,
      openJobsCount: Math.max(1, roleDemandCount),
      dailyGrowthPct,
      dailyActionTip,
      isPrimaryIndustry: profile?.industry?.toLowerCase() === role.industry.toLowerCase(),
    };
  });

  // Sort by matchScore desc, then openJobsCount desc
  recommendations.sort((a, b) => b.matchScore - a.matchScore || b.openJobsCount - a.openJobsCount);

  return {
    lastUpdated: today,
    userId,
    userIndustry: profile?.industry || 'General',
    totalVerifiedSkills: credentials.length,
    recommendations,
  };
}
