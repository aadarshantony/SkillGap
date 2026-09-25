import 'dotenv/config';
import mongoose from 'mongoose';
import { nanoid } from 'nanoid';
import bcrypt from 'bcryptjs';

import User from '../models/User.js';
import LearnerProfile from '../models/LearnerProfile.js';
import EmployerProfile from '../models/EmployerProfile.js';
import SkillTaxonomy from '../models/SkillTaxonomy.js';
import JobEmployer from '../models/JobEmployer.js';
import JobPublic from '../models/JobPublic.js';
import SkillDemandDaily from '../models/SkillDemandDaily.js';
import Credential from '../models/Credential.js';
import SkillTest from '../models/SkillTest.js';
import LearningPath from '../models/LearningPath.js';
import Application from '../models/Application.js';

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/skillgap';

// ─── Multi-Industry Skill Taxonomy ──────────────────────────────────────────
const SKILLS = [
  // Human Resources & Talent
  { name: 'HR Compliance', aliases: ['labor law', 'employment compliance', 'statutory compliance'], category: 'Human Resources', industry: ['Corporate', 'Healthcare', 'Retail', 'Technology'] },
  { name: 'Talent Acquisition', aliases: ['recruitment', 'hiring', 'talent sourcing'], category: 'Human Resources', industry: ['Corporate', 'Technology', 'Healthcare'] },
  { name: 'Performance Management', aliases: ['employee evaluation', 'KPI management', 'appraisals'], category: 'Human Resources', industry: ['Corporate'] },
  { name: 'Employee Relations', aliases: ['grievance handling', 'conflict resolution', 'workplace culture'], category: 'Human Resources', industry: ['Corporate'] },

  // Sales & Business Development
  { name: 'B2B Sales', aliases: ['business sales', 'corporate sales', 'account management'], category: 'Sales', industry: ['Corporate', 'Technology', 'Finance'] },
  { name: 'CRM Systems', aliases: ['Salesforce', 'HubSpot CRM', 'lead management'], category: 'Sales', industry: ['Corporate', 'Retail'] },
  { name: 'Sales Negotiation', aliases: ['deal closing', 'contract negotiation', 'client management'], category: 'Sales', industry: ['Corporate', 'Real Estate'] },

  // Legal & Corporate Compliance
  { name: 'Legal Writing & Contract Law', aliases: ['contract drafting', 'legal research', 'agreements'], category: 'Legal', industry: ['Legal', 'Corporate', 'Finance'] },
  { name: 'Corporate Compliance', aliases: ['regulatory compliance', 'ESG compliance', 'audit compliance'], category: 'Legal', industry: ['Legal', 'Banking', 'Healthcare'] },

  // Education & Pedagogy
  { name: 'Lesson Planning', aliases: ['curriculum planning', 'instructional design', 'pedagogy'], category: 'Education', industry: ['Education'] },
  { name: 'Classroom Management', aliases: ['student engagement', 'behavioral management'], category: 'Education', industry: ['Education'] },
  { name: 'Student Evaluation', aliases: ['assessment design', 'grading', 'rubrics'], category: 'Education', industry: ['Education'] },

  // Marketing & Media
  { name: 'Digital Marketing', aliases: ['SEO', 'SEM', 'social media marketing', 'PPC'], category: 'Marketing', industry: ['Retail', 'Media', 'Corporate'] },
  { name: 'Brand Strategy', aliases: ['brand positioning', 'marketing strategy', 'campaign management'], category: 'Marketing', industry: ['Retail', 'Corporate'] },
  { name: 'Content Writing', aliases: ['copywriting', 'content creation', 'SEO writing'], category: 'Marketing', industry: ['Media', 'Technology'] },

  // Finance & Accounting
  { name: 'Financial Accounting', aliases: ['bookkeeping', 'balance sheets', 'financial statements', 'Tally', 'QuickBooks'], category: 'Accounting', industry: ['Finance', 'Corporate', 'Retail'] },
  { name: 'Tax Compliance', aliases: ['GST filing', 'income tax', 'corporate taxation'], category: 'Accounting', industry: ['Finance', 'Corporate'] },
  { name: 'Financial Analysis', aliases: ['financial modelling', 'budgeting', 'forecasting'], category: 'Finance', industry: ['Finance', 'Banking'] },

  // Operations & Logistics
  { name: 'Supply Chain Optimization', aliases: ['SCM', 'logistics management', 'vendor coordination'], category: 'Operations', industry: ['Logistics', 'Retail', 'Manufacturing'] },
  { name: 'Inventory Management', aliases: ['stock control', 'warehouse management'], category: 'Operations', industry: ['Retail', 'Logistics'] },
  { name: 'Process Automation', aliases: ['SOP design', 'lean management', 'workflow optimization'], category: 'Operations', industry: ['Manufacturing', 'Corporate'] },

  // Customer Support & Experience
  { name: 'Customer Service', aliases: ['client support', 'helpdesk', 'customer satisfaction'], category: 'Customer Experience', industry: ['Retail', 'Hospitality', 'Technology', 'Healthcare'] },
  { name: 'De-escalation Techniques', aliases: ['complaint resolution', 'conflict management'], category: 'Customer Experience', industry: ['Hospitality', 'Retail', 'Healthcare'] },

  // Healthcare & Pharmacy
  { name: 'Clinical Pharmacology', aliases: ['pharmacy management', 'drug interactions', 'dispensing'], category: 'Healthcare', industry: ['Healthcare', 'Pharma'] },
  { name: 'Patient Safety & Care', aliases: ['clinical care', 'patient triage', 'nursing care'], category: 'Healthcare', industry: ['Healthcare'] },
  { name: 'Electronic Health Records', aliases: ['EHR', 'EMR', 'health info systems'], category: 'Healthcare', industry: ['Healthcare'] },

  // Software & Tech
  { name: 'JavaScript', aliases: ['JS', 'es6', 'javascript'], category: 'Programming', industry: ['Technology'] },
  { name: 'React', aliases: ['ReactJS', 'React.js'], category: 'Frontend', industry: ['Technology'] },
  { name: 'Python', aliases: ['py', 'python3'], category: 'Programming', industry: ['Technology', 'Data Science', 'Finance'] },
  { name: 'SQL', aliases: ['PostgreSQL', 'MySQL'], category: 'Data', industry: ['Technology', 'Finance'] },
  { name: 'Data Analysis', aliases: ['data analytics', 'Excel', 'Power BI'], category: 'Data', industry: ['Finance', 'Corporate', 'Technology'] },
];

// ─── Diverse Multi-Industry Employers ────────────────────────────────────────
const EMPLOYERS = [
  { name: 'Sunita Rao', email: 'sunita@apexcorp.com', company: 'Apex Global Enterprises', industry: 'Corporate', size: '500+', location: 'Mumbai, India' },
  { name: 'Vikram Mehta', email: 'vikram@horizonhealth.in', company: 'Horizon Healthcare & Hospitals', industry: 'Healthcare', size: '201-500', location: 'Bengaluru, India' },
  { name: 'Adv. Rajesh Sharma', email: 'rajesh@sharmalegal.in', company: 'Sharma & Associates Legal', industry: 'Legal', size: '11-50', location: 'New Delhi, India' },
  { name: 'Deepa Kulkarni', email: 'deepa@edushine.edu.in', company: 'Edushine International Schools', industry: 'Education', size: '51-200', location: 'Pune, India' },
  { name: 'Amitabh Verma', email: 'amitabh@logixpress.in', company: 'LogiXpress Logistics', industry: 'Logistics', size: '201-500', location: 'Chennai, India' },
  { name: 'Riya Sen', email: 'riya@pulsemedia.in', company: 'Pulse Marketing Agency', industry: 'Marketing', size: '11-50', location: 'Mumbai, India' },
  { name: 'Karan Malhotra', email: 'karan@techspark.io', company: 'TechSpark Systems', industry: 'Technology', size: '51-200', location: 'Bengaluru, India' },
];

// ─── Diverse Multi-Industry Learners ─────────────────────────────────────────
const LEARNERS = [
  {
    name: 'Ananya Varma', email: 'ananya.hr@email.com',
    headline: 'HR Specialist | Talent Acquisition & Employee Relations', location: 'Mumbai, India', industry: 'Human Resources',
    skills: [
      { skillName: 'Talent Acquisition', proficiency: 'advanced', verified: true, source: 'test' },
      { skillName: 'HR Compliance', proficiency: 'intermediate', verified: true, source: 'test' },
      { skillName: 'Employee Relations', proficiency: 'intermediate', verified: false, source: 'resume' },
      { skillName: 'Performance Management', proficiency: 'beginner', verified: false, source: 'manual' },
    ],
    resumeSource: 'upload',
  },
  {
    name: 'Vikram Sharma', email: 'vikram.sales@email.com',
    headline: 'B2B Sales Executive & Account Lead', location: 'Bengaluru, India', industry: 'Sales',
    skills: [
      { skillName: 'B2B Sales', proficiency: 'advanced', verified: true, source: 'test' },
      { skillName: 'CRM Systems', proficiency: 'advanced', verified: true, source: 'test' },
      { skillName: 'Sales Negotiation', proficiency: 'intermediate', verified: false, source: 'manual' },
    ],
    resumeSource: 'upload',
  },
  {
    name: 'Adv. Rahul Kapoor', email: 'rahul.law@email.com',
    headline: 'Corporate Legal Counsel & Contract Strategist', location: 'New Delhi, India', industry: 'Legal',
    skills: [
      { skillName: 'Legal Writing & Contract Law', proficiency: 'advanced', verified: true, source: 'test' },
      { skillName: 'Corporate Compliance', proficiency: 'intermediate', verified: true, source: 'test' },
    ],
    resumeSource: 'upload',
  },
  {
    name: 'Meenakshi Sundaram', email: 'meenakshi.edu@email.com',
    headline: 'Senior Pedagogy Educator & Lesson Coordinator', location: 'Chennai, India', industry: 'Education',
    skills: [
      { skillName: 'Lesson Planning', proficiency: 'advanced', verified: true, source: 'test' },
      { skillName: 'Classroom Management', proficiency: 'advanced', verified: true, source: 'test' },
      { skillName: 'Student Evaluation', proficiency: 'intermediate', verified: false, source: 'manual' },
    ],
    resumeSource: 'upload',
  },
  {
    name: 'Tanya Roy', email: 'tanya.mkt@email.com',
    headline: 'Digital Growth & Brand Strategist', location: 'Mumbai, India', industry: 'Marketing',
    skills: [
      { skillName: 'Digital Marketing', proficiency: 'advanced', verified: true, source: 'test' },
      { skillName: 'Brand Strategy', proficiency: 'intermediate', verified: false, source: 'manual' },
      { skillName: 'Content Writing', proficiency: 'intermediate', verified: true, source: 'test' },
    ],
    resumeSource: 'upload',
  },
  {
    name: 'Sneha Kulkarni', email: 'sneha.tax@email.com',
    headline: 'Senior Accountant & Tax Consultant', location: 'Pune, India', industry: 'Accounting',
    skills: [
      { skillName: 'Financial Accounting', proficiency: 'advanced', verified: true, source: 'test' },
      { skillName: 'Tax Compliance', proficiency: 'advanced', verified: true, source: 'test' },
      { skillName: 'Financial Analysis', proficiency: 'intermediate', verified: false, source: 'resume' },
    ],
    resumeSource: 'upload',
  },
  {
    name: 'Rajesh Gupta', email: 'rajesh.ops@email.com',
    headline: 'Operations & Supply Chain Manager', location: 'Ahmedabad, India', industry: 'Operations',
    skills: [
      { skillName: 'Supply Chain Optimization', proficiency: 'advanced', verified: true, source: 'test' },
      { skillName: 'Inventory Management', proficiency: 'advanced', verified: true, source: 'test' },
      { skillName: 'Process Automation', proficiency: 'intermediate', verified: false, source: 'manual' },
    ],
    resumeSource: 'upload',
  },
  {
    name: 'Dr. Arishta Das', email: 'arishta.pharma@email.com',
    headline: 'Clinical Pharmacist & Healthcare Lead', location: 'Kochi, India', industry: 'Healthcare',
    skills: [
      { skillName: 'Clinical Pharmacology', proficiency: 'advanced', verified: true, source: 'test' },
      { skillName: 'Patient Safety & Care', proficiency: 'advanced', verified: true, source: 'test' },
      { skillName: 'Electronic Health Records', proficiency: 'intermediate', verified: false, source: 'manual' },
    ],
    resumeSource: 'upload',
  },
  {
    name: 'Arjun Mehta', email: 'arjun.tech@email.com',
    headline: 'Full-Stack Developer | React & Python Specialist', location: 'Bengaluru, India', industry: 'Technology',
    skills: [
      { skillName: 'JavaScript', proficiency: 'advanced', verified: true, source: 'test' },
      { skillName: 'React', proficiency: 'intermediate', verified: true, source: 'test' },
      { skillName: 'Python', proficiency: 'beginner', verified: false, source: 'manual' },
    ],
    resumeSource: 'upload',
  },
];

// ─── Multi-Industry Employer Jobs ────────────────────────────────────────────
function makeJobs(skills) {
  const byName = (n) => skills.find(s => s.name === n);
  const req = (n, p, r = true) => ({ skillName: n, skillId: byName(n)?._id, proficiency: p, required: r });

  return [
    // Apex Global
    {
      companyName: 'Apex Global Enterprises',
      title: 'Senior HR Manager',
      description: 'Lead statutory HR compliance, oversee employee grievance mechanisms, and manage multi-region recruitment pipelines. Requires strong employment law grounding.',
      location: 'Mumbai, India', remote: false, industry: 'Corporate', jobType: 'full-time',
      requirements: [req('HR Compliance', 'advanced'), req('Talent Acquisition', 'advanced'), req('Employee Relations', 'intermediate'), req('Performance Management', 'intermediate', false)],
      salaryMin: 1200000, salaryMax: 1800000,
    },
    {
      companyName: 'Apex Global Enterprises',
      title: 'Corporate Sales Lead',
      description: 'Drive high-value B2B client acquisition, lead contract negotiations, and manage our enterprise CRM pipeline.',
      location: 'Mumbai, India', remote: true, industry: 'Corporate', jobType: 'full-time',
      requirements: [req('B2B Sales', 'advanced'), req('CRM Systems', 'intermediate'), req('Sales Negotiation', 'advanced')],
      salaryMin: 1000000, salaryMax: 1600000,
    },
    // Horizon Healthcare
    {
      companyName: 'Horizon Healthcare & Hospitals',
      title: 'Clinical Pharmacist',
      description: 'Supervise hospital medication management, review clinical drug interactions, and enforce clinical patient safety standards.',
      location: 'Bengaluru, India', remote: false, industry: 'Healthcare', jobType: 'full-time',
      requirements: [req('Clinical Pharmacology', 'advanced'), req('Patient Safety & Care', 'advanced'), req('Electronic Health Records', 'intermediate', false)],
      salaryMin: 800000, salaryMax: 1300000,
    },
    // Sharma & Associates Legal
    {
      companyName: 'Sharma & Associates Legal',
      title: 'Corporate Legal Counsel',
      description: 'Draft and review commercial contracts, advise corporate clients on regulatory compliance, and handle corporate governance filings.',
      location: 'New Delhi, India', remote: false, industry: 'Legal', jobType: 'full-time',
      requirements: [req('Legal Writing & Contract Law', 'advanced'), req('Corporate Compliance', 'intermediate')],
      salaryMin: 1400000, salaryMax: 2200000,
    },
    // Edushine International Schools
    {
      companyName: 'Edushine International Schools',
      title: 'Senior High School Teacher',
      description: 'Develop structured lesson plans, manage classroom environments, and conduct standardized student evaluations.',
      location: 'Pune, India', remote: false, industry: 'Education', jobType: 'full-time',
      requirements: [req('Lesson Planning', 'advanced'), req('Classroom Management', 'advanced'), req('Student Evaluation', 'intermediate')],
      salaryMin: 600000, salaryMax: 950000,
    },
    // LogiXpress Logistics
    {
      companyName: 'LogiXpress Logistics',
      title: 'Operations & Supply Chain Manager',
      description: 'Streamline warehouse inventory control, optimize regional freight routes, and automate logisitical workflows.',
      location: 'Chennai, India', remote: false, industry: 'Operations', jobType: 'full-time',
      requirements: [req('Supply Chain Optimization', 'advanced'), req('Inventory Management', 'advanced'), req('Process Automation', 'intermediate', false)],
      salaryMin: 900000, salaryMax: 1500000,
    },
    // Pulse Marketing Agency
    {
      companyName: 'Pulse Marketing Agency',
      title: 'Senior Marketing Executive',
      description: 'Plan multi-channel digital campaigns, define brand positioning, and oversee content creation for retail clients.',
      location: 'Mumbai, India', remote: true, industry: 'Marketing', jobType: 'full-time',
      requirements: [req('Digital Marketing', 'advanced'), req('Brand Strategy', 'intermediate'), req('Content Writing', 'intermediate', false)],
      salaryMin: 750000, salaryMax: 1250000,
    },
    // TechSpark Systems
    {
      companyName: 'TechSpark Systems',
      title: 'Senior Software Engineer',
      description: 'Architect scalable web services with React, JavaScript, and Python. Build resilient customer interfaces.',
      location: 'Bengaluru, India', remote: true, industry: 'Technology', jobType: 'full-time',
      requirements: [req('React', 'advanced'), req('JavaScript', 'advanced'), req('Python', 'intermediate', false)],
      salaryMin: 1500000, salaryMax: 2500000,
    },
  ];
}

// ─── Multi-Domain Public Job Fallbacks ───────────────────────────────────────
const PUBLIC_FALLBACK_JOBS = [
  {
    adzunaId: 'pub_hr_101',
    title: 'Assistant HR Manager',
    company: 'Nexus Corporate Services',
    location: 'Bengaluru, India',
    description: 'Manage onboarding, labor law compliance, and statutory benefits administration across regional offices.',
    salary: { min: 650000, max: 950000, currency: 'INR' },
    category: 'Human Resources',
    industry: 'Corporate',
    url: 'https://www.adzuna.in',
    fetchedAt: new Date(),
  },
  {
    adzunaId: 'pub_sales_102',
    title: 'B2B Sales Specialist',
    company: 'FinTech Solutions',
    location: 'Mumbai, India',
    description: 'Prospect commercial clients, demonstrate software products, and close enterprise SaaS subscriptions.',
    salary: { min: 800000, max: 1300000, currency: 'INR' },
    category: 'Sales',
    industry: 'Sales',
    url: 'https://www.adzuna.in',
    fetchedAt: new Date(),
  },
  {
    adzunaId: 'pub_legal_103',
    title: 'Legal Compliance Officer',
    company: 'Standard Chartered Financial',
    location: 'Mumbai, India',
    description: 'Monitor regulatory changes, ensure compliance with statutory norms, and audit legal documentation.',
    salary: { min: 1100000, max: 1700000, currency: 'INR' },
    category: 'Legal',
    industry: 'Legal',
    url: 'https://www.adzuna.in',
    fetchedAt: new Date(),
  },
  {
    adzunaId: 'pub_edu_104',
    title: 'STEM Educator / Science Teacher',
    company: 'Global Academy',
    location: 'Hyderabad, India',
    description: 'Deliver engaging science curriculum, oversee lab practicals, and track academic progress.',
    salary: { min: 500000, max: 800000, currency: 'INR' },
    category: 'Education',
    industry: 'Education',
    url: 'https://www.adzuna.in',
    fetchedAt: new Date(),
  },
  {
    adzunaId: 'pub_mkt_105',
    title: 'Social Media & Growth Lead',
    company: 'BrandVentures',
    location: 'Remote, India',
    description: 'Execute paid ad campaigns, design content calendars, and optimize conversion funnel metrics.',
    salary: { min: 700000, max: 1100000, currency: 'INR' },
    category: 'Marketing',
    industry: 'Marketing',
    url: 'https://www.adzuna.in',
    fetchedAt: new Date(),
  },
  {
    adzunaId: 'pub_acc_106',
    title: 'Senior Tax Accountant',
    company: 'KPMG India Alliance',
    location: 'New Delhi, India',
    description: 'Prepare GST returns, handle corporate income tax assessments, and perform financial audits.',
    salary: { min: 900000, max: 1400000, currency: 'INR' },
    category: 'Accounting',
    industry: 'Accounting',
    url: 'https://www.adzuna.in',
    fetchedAt: new Date(),
  },
  {
    adzunaId: 'pub_ops_107',
    title: 'Warehouse & Inventory Manager',
    company: 'Amazon Logistics Partner',
    location: 'Ahmedabad, India',
    description: 'Manage warehouse operations, maintain stock audit accuracy, and lead logistics teams.',
    salary: { min: 600000, max: 900000, currency: 'INR' },
    category: 'Operations',
    industry: 'Operations',
    url: 'https://www.adzuna.in',
    fetchedAt: new Date(),
  },
  {
    adzunaId: 'pub_pharma_108',
    title: 'Hospital Pharmacy Lead',
    company: 'Apollo Hospitals',
    location: 'Chennai, India',
    description: 'Ensure pharmaceutical compliance, supervise drug inventory, and counsel clinical staff.',
    salary: { min: 750000, max: 1150000, currency: 'INR' },
    category: 'Healthcare',
    industry: 'Healthcare',
    url: 'https://www.adzuna.in',
    fetchedAt: new Date(),
  },
];

export async function seedData() {
  await Promise.all([
    User.deleteMany({}), LearnerProfile.deleteMany({}), EmployerProfile.deleteMany({}),
    SkillTaxonomy.deleteMany({}), JobEmployer.deleteMany({}), JobPublic.deleteMany({}),
    SkillDemandDaily.deleteMany({}), Credential.deleteMany({}),
    SkillTest.deleteMany({}), LearningPath.deleteMany({}),
    Application.deleteMany({}),
  ]);
  console.log('🗑️  Cleared existing data');

  // 1. Skills
  const skills = await SkillTaxonomy.insertMany(SKILLS);
  console.log(`✅ Seeded ${skills.length} multi-industry skills`);

  // 2. Employer users + profiles
  const passwordHash = await bcrypt.hash('password123', 12);
  const employerUsers = await User.insertMany(
    EMPLOYERS.map(e => ({ email: e.email, passwordHash, role: 'employer', name: e.name }))
  );
  const employerProfiles = await EmployerProfile.insertMany(
    EMPLOYERS.map((e, i) => ({
      userId: employerUsers[i]._id,
      companyName: e.company, industry: e.industry, size: e.size, location: e.location, verified: true,
    }))
  );
  console.log(`✅ Seeded ${employerUsers.length} employer accounts`);

  // 3. Jobs
  const skillMap = Object.fromEntries(skills.map(s => [s.name, s._id]));
  const empMap = Object.fromEntries(EMPLOYERS.map((e, i) => [e.company, employerUsers[i]._id]));
  const rawJobs = makeJobs(skills);
  const jobs = await JobEmployer.insertMany(
    rawJobs.map(j => ({
      ...j,
      employerId: empMap[j.companyName] || employerUsers[0]._id,
      requirements: j.requirements.map(r => ({ ...r, skillId: skillMap[r.skillName] })),
    }))
  );
  console.log(`✅ Seeded ${jobs.length} employer jobs`);

  // 4. Public fallback jobs
  await JobPublic.insertMany(PUBLIC_FALLBACK_JOBS);
  console.log(`✅ Seeded ${PUBLIC_FALLBACK_JOBS.length} public fallback jobs`);

  // 5. Learner users + profiles
  const learnerUsers = await User.insertMany(
    LEARNERS.map(l => ({ email: l.email, passwordHash, role: 'learner', name: l.name }))
  );
  const learnerProfiles = await LearnerProfile.insertMany(
    LEARNERS.map((l, i) => ({
      userId: learnerUsers[i]._id,
      headline: l.headline,
      location: l.location,
      industry: l.industry,
      skills: l.skills.map(s => ({ ...s, skillId: skillMap[s.skillName] })),
      resumeSource: l.resumeSource,
      profileComplete: true,
      reviewedAt: new Date(),
    }))
  );
  console.log(`✅ Seeded ${learnerProfiles.length} learner profiles`);

  // 6. Pre-issued Credentials
  const issuedAt = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000);
  const credDefs = [
    { learnerIdx: 0, skillName: 'Talent Acquisition', proficiencyLevel: 'advanced', score: 92, jobIdx: 0 },
    { learnerIdx: 0, skillName: 'HR Compliance', proficiencyLevel: 'intermediate', score: 85, jobIdx: 0 },
    { learnerIdx: 1, skillName: 'B2B Sales', proficiencyLevel: 'advanced', score: 94, jobIdx: 1 },
    { learnerIdx: 2, skillName: 'Legal Writing & Contract Law', proficiencyLevel: 'advanced', score: 90, jobIdx: 3 },
    { learnerIdx: 3, skillName: 'Lesson Planning', proficiencyLevel: 'advanced', score: 88, jobIdx: 4 },
    { learnerIdx: 4, skillName: 'Digital Marketing', proficiencyLevel: 'advanced', score: 91, jobIdx: 6 },
    { learnerIdx: 5, skillName: 'Financial Accounting', proficiencyLevel: 'advanced', score: 95, jobIdx: 5 },
    { learnerIdx: 6, skillName: 'Supply Chain Optimization', proficiencyLevel: 'advanced', score: 89, jobIdx: 5 },
    { learnerIdx: 7, skillName: 'Clinical Pharmacology', proficiencyLevel: 'advanced', score: 96, jobIdx: 2 },
    { learnerIdx: 8, skillName: 'JavaScript', proficiencyLevel: 'advanced', score: 87, jobIdx: 7 },
  ];

  const credentials = await Credential.insertMany(
    credDefs.map(c => ({
      slug: nanoid(12),
      learnerId: learnerUsers[c.learnerIdx]._id,
      learnerName: LEARNERS[c.learnerIdx].name,
      skillId: skillMap[c.skillName],
      skillName: c.skillName,
      proficiencyLevel: c.proficiencyLevel,
      score: c.score,
      passingScore: 70,
      anchoredTo: {
        jobId: jobs[c.jobIdx]._id,
        jobType: 'employer',
        jobTitle: jobs[c.jobIdx].title,
        companyName: jobs[c.jobIdx].companyName,
        requirementSnapshot: jobs[c.jobIdx].requirements,
        snapshotDate: issuedAt,
      },
      issuedAt,
      expiresAt: new Date(issuedAt.getTime() + 365 * 24 * 60 * 60 * 1000),
      status: 'active',
      testDetails: {
        questionsAnswered: 8,
        correctAnswers: Math.round(8 * c.score / 100),
        timeTakenMinutes: 10,
        completedAt: issuedAt,
      },
    }))
  );
  console.log(`✅ Seeded ${credentials.length} credentials`);

  // 7. Applications
  const appliedAt = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
  const appDefs = [
    // Apex Global HR Manager
    { learnerIdx: 0, jobIdx: 0, status: 'submitted', matchScore: 92 },
    // Apex Global Corporate Sales Lead
    { learnerIdx: 1, jobIdx: 1, status: 'submitted', matchScore: 94 },
    // Horizon Clinical Pharmacist
    { learnerIdx: 7, jobIdx: 2, status: 'submitted', matchScore: 96 },
    // Sharma Legal Corporate Legal Counsel
    { learnerIdx: 2, jobIdx: 3, status: 'submitted', matchScore: 90 },
    // Edushine Senior Teacher
    { learnerIdx: 3, jobIdx: 4, status: 'submitted', matchScore: 88 },
    // LogiXpress Operations Manager
    { learnerIdx: 6, jobIdx: 5, status: 'submitted', matchScore: 92 },
    // Pulse Senior Marketing Exec
    { learnerIdx: 4, jobIdx: 6, status: 'submitted', matchScore: 90 },
    // TechSpark Senior Engineer
    { learnerIdx: 8, jobIdx: 7, status: 'submitted', matchScore: 87 },
  ];

  const applications = await Application.insertMany(
    appDefs.map(a => ({
      learnerId: learnerUsers[a.learnerIdx]._id,
      jobId: jobs[a.jobIdx]._id.toString(),
      jobType: 'employer',
      jobTitle: jobs[a.jobIdx].title,
      companyName: jobs[a.jobIdx].companyName,
      status: a.status,
      matchScore: a.matchScore,
      submittedAt: appliedAt,
      createdAt: appliedAt,
    }))
  );
  console.log(`✅ Seeded ${applications.length} applications`);

  // 8. SkillDemandDaily (30 days of market trend data per skill)
  const demandRecords = [];
  const now = Date.now();
  for (const s of SKILLS) {
    const baseCount = Math.floor(Math.random() * 150) + 120;
    const sId = skillMap[s.name] || skills[0]._id;
    for (let day = 30; day >= 0; day--) {
      const date = new Date(now - day * 24 * 60 * 60 * 1000);
      const randomNoise = Math.floor(Math.sin(day * 0.5) * 40) + Math.floor(Math.random() * 35);
      demandRecords.push({
        skillId: sId,
        skillName: s.name,
        date,
        count: Math.max(30, baseCount + randomNoise),
        industry: s.industry[0] || 'General',
      });
    }
  }
  await SkillDemandDaily.insertMany(demandRecords);
  console.log(`✅ Seeded ${demandRecords.length} daily skill demand trend records`);

  console.log('🎉 Multi-industry database seeding completed successfully.');
}

// If run directly via node
if (process.argv[1]?.endsWith('seed/index.js')) {
  import('../config/db.js').then(async ({ connectDB }) => {
    await connectDB();
    await mongoose.disconnect();
    process.exit(0);
  }).catch(err => {
    console.error('Seed script error:', err);
    process.exit(1);
  });
}
