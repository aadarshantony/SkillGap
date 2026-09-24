import 'dotenv/config';
import mongoose from 'mongoose';
import { nanoid } from 'nanoid';
import bcrypt from 'bcryptjs';

import User from '../models/User.js';
import LearnerProfile from '../models/LearnerProfile.js';
import EmployerProfile from '../models/EmployerProfile.js';
import SkillTaxonomy from '../models/SkillTaxonomy.js';
import JobEmployer from '../models/JobEmployer.js';
import SkillDemandDaily from '../models/SkillDemandDaily.js';
import Credential from '../models/Credential.js';
import SkillTest from '../models/SkillTest.js';
import LearningPath from '../models/LearningPath.js';

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/skillgap';

// ─── Skill Taxonomy ────────────────────────────────────────────────────────────
const SKILLS = [
  // Tech
  { name: 'JavaScript', aliases: ['JS', 'js', 'javascript'], category: 'Programming', industry: ['Technology', 'Digital Media'] },
  { name: 'React', aliases: ['ReactJS', 'React.js'], category: 'Frontend', industry: ['Technology'] },
  { name: 'Node.js', aliases: ['NodeJS', 'node', 'Node'], category: 'Backend', industry: ['Technology'] },
  { name: 'Python', aliases: ['py', 'python3'], category: 'Programming', industry: ['Technology', 'Data Science', 'Healthcare'] },
  { name: 'SQL', aliases: ['MySQL', 'PostgreSQL', 'Structured Query Language'], category: 'Data', industry: ['Technology', 'Finance', 'Retail'] },
  { name: 'Machine Learning', aliases: ['ML', 'machine-learning'], category: 'Data Science', industry: ['Technology', 'Healthcare', 'Finance'] },
  { name: 'Cloud Computing', aliases: ['AWS', 'Azure', 'GCP', 'cloud'], category: 'Infrastructure', industry: ['Technology'] },
  // Retail / Hospitality
  { name: 'Customer Service', aliases: ['customer support', 'client service'], category: 'Soft Skills', industry: ['Retail', 'Hospitality', 'Healthcare'] },
  { name: 'Inventory Management', aliases: ['stock management', 'inventory control'], category: 'Operations', industry: ['Retail', 'Logistics'] },
  { name: 'Point of Sale Systems', aliases: ['POS', 'cash register', 'billing software'], category: 'Retail Tech', industry: ['Retail', 'Hospitality'] },
  // Healthcare
  { name: 'Patient Care', aliases: ['patient management', 'clinical care'], category: 'Healthcare', industry: ['Healthcare'] },
  { name: 'Medical Coding', aliases: ['ICD coding', 'CPT coding', 'health coding'], category: 'Healthcare Admin', industry: ['Healthcare'] },
  // Skilled Trades
  { name: 'Electrical Wiring', aliases: ['wiring', 'electrical installation'], category: 'Skilled Trade', industry: ['Construction', 'Manufacturing'] },
  { name: 'Forklift Operation', aliases: ['forklift', 'pallet jack'], category: 'Logistics', industry: ['Logistics', 'Warehousing'] },
  // Business
  { name: 'Project Management', aliases: ['PM', 'project coordination', 'PMP'], category: 'Management', industry: ['Technology', 'Construction', 'Retail', 'Finance'] },
  { name: 'Data Analysis', aliases: ['data analytics', 'business intelligence'], category: 'Data', industry: ['Finance', 'Retail', 'Technology'] },
  { name: 'Digital Marketing', aliases: ['online marketing', 'SEO', 'SEM', 'social media marketing'], category: 'Marketing', industry: ['Retail', 'Technology', 'Media'] },
  { name: 'Communication Skills', aliases: ['verbal communication', 'presentation'], category: 'Soft Skills', industry: ['All'] },
  { name: 'Teamwork', aliases: ['collaboration', 'team player'], category: 'Soft Skills', industry: ['All'] },
  { name: 'Food Safety', aliases: ['HACCP', 'food hygiene', 'food handling'], category: 'Compliance', industry: ['Hospitality', 'Food Service'] },
];

// ─── Employer users/profiles ────────────────────────────────────────────────
const EMPLOYERS = [
  { name: 'Riya Sharma', email: 'riya@techcorp.in', company: 'TechCorp India', industry: 'Technology', size: '201-500', location: 'Bengaluru, India' },
  { name: 'Vikram Nair', email: 'vikram@retailmax.in', company: 'RetailMax', industry: 'Retail', size: '51-200', location: 'Mumbai, India' },
  { name: 'Ananya Patel', email: 'ananya@healthplus.in', company: 'HealthPlus Clinics', industry: 'Healthcare', size: '51-200', location: 'Ahmedabad, India' },
  { name: 'Siddharth Menon', email: 'sid@buildright.in', company: 'BuildRight Construction', industry: 'Construction', size: '11-50', location: 'Chennai, India' },
  { name: 'Priya Agarwal', email: 'priya@cloudspark.io', company: 'CloudSpark', industry: 'Technology', size: '1-10', location: 'Remote' },
];

// ─── Learner users/profiles ──────────────────────────────────────────────────
const LEARNERS = [
  {
    name: 'Arjun Mehta', email: 'arjun@email.com',
    headline: 'Aspiring Full-Stack Developer', location: 'Pune, India', industry: 'Technology',
    skills: [
      { skillName: 'JavaScript', proficiency: 'intermediate', verified: true, source: 'test' },
      { skillName: 'React', proficiency: 'beginner', verified: false, source: 'resume' },
      { skillName: 'SQL', proficiency: 'beginner', verified: false, source: 'manual' },
    ],
    resumeSource: 'upload',
  },
  {
    name: 'Meera Krishnan', email: 'meera@email.com',
    headline: 'Data Science Enthusiast', location: 'Hyderabad, India', industry: 'Technology',
    skills: [
      { skillName: 'Python', proficiency: 'advanced', verified: true, source: 'test' },
      { skillName: 'Machine Learning', proficiency: 'intermediate', verified: true, source: 'test' },
      { skillName: 'SQL', proficiency: 'intermediate', verified: false, source: 'resume' },
      { skillName: 'Data Analysis', proficiency: 'intermediate', verified: true, source: 'test' },
    ],
    resumeSource: 'upload',
  },
  {
    name: 'Raj Pillai', email: 'raj@email.com',
    headline: 'Retail Associate looking to grow', location: 'Kochi, India', industry: 'Retail',
    skills: [
      { skillName: 'Customer Service', proficiency: 'advanced', verified: true, source: 'test' },
      { skillName: 'Point of Sale Systems', proficiency: 'intermediate', verified: false, source: 'manual' },
      { skillName: 'Communication Skills', proficiency: 'intermediate', verified: false, source: 'manual' },
    ],
    resumeSource: 'manual',
  },
  {
    name: 'Divya Nambiar', email: 'divya@email.com',
    headline: 'Frontend Developer | React Specialist', location: 'Bengaluru, India', industry: 'Technology',
    skills: [
      { skillName: 'React', proficiency: 'advanced', verified: true, source: 'test' },
      { skillName: 'JavaScript', proficiency: 'advanced', verified: true, source: 'test' },
      { skillName: 'Node.js', proficiency: 'intermediate', verified: false, source: 'resume' },
      { skillName: 'Project Management', proficiency: 'beginner', verified: false, source: 'manual' },
    ],
    resumeSource: 'upload',
  },
  {
    name: 'Karan Verma', email: 'karan@email.com',
    headline: 'Healthcare Admin Professional', location: 'Delhi, India', industry: 'Healthcare',
    skills: [
      { skillName: 'Medical Coding', proficiency: 'advanced', verified: true, source: 'test' },
      { skillName: 'Patient Care', proficiency: 'intermediate', verified: false, source: 'resume' },
      { skillName: 'Communication Skills', proficiency: 'advanced', verified: false, source: 'manual' },
    ],
    resumeSource: 'upload',
  },
  {
    name: 'Smita Joshi', email: 'smita@email.com',
    headline: 'Full-Stack Dev & Cloud Enthusiast', location: 'Pune, India', industry: 'Technology',
    skills: [
      { skillName: 'JavaScript', proficiency: 'advanced', verified: true, source: 'test' },
      { skillName: 'Node.js', proficiency: 'advanced', verified: true, source: 'test' },
      { skillName: 'Cloud Computing', proficiency: 'intermediate', verified: true, source: 'test' },
      { skillName: 'Python', proficiency: 'beginner', verified: false, source: 'manual' },
    ],
    resumeSource: 'upload',
  },
  {
    name: 'Aditya Singh', email: 'aditya@email.com',
    headline: 'Logistics & Warehouse Operations', location: 'Mumbai, India', industry: 'Logistics',
    skills: [
      { skillName: 'Forklift Operation', proficiency: 'advanced', verified: true, source: 'test' },
      { skillName: 'Inventory Management', proficiency: 'advanced', verified: true, source: 'test' },
      { skillName: 'Teamwork', proficiency: 'intermediate', verified: false, source: 'manual' },
    ],
    resumeSource: 'manual',
  },
  {
    name: 'Neha Gupta', email: 'neha@email.com',
    headline: 'Digital Marketing Specialist', location: 'Noida, India', industry: 'Marketing',
    skills: [
      { skillName: 'Digital Marketing', proficiency: 'advanced', verified: true, source: 'test' },
      { skillName: 'Data Analysis', proficiency: 'beginner', verified: false, source: 'manual' },
      { skillName: 'Communication Skills', proficiency: 'advanced', verified: true, source: 'test' },
    ],
    resumeSource: 'upload',
  },
  {
    name: 'Rohit Tiwari', email: 'rohit@email.com',
    headline: 'Junior Developer — fresh grad', location: 'Jaipur, India', industry: 'Technology',
    skills: [
      { skillName: 'Python', proficiency: 'beginner', verified: false, source: 'manual' },
      { skillName: 'SQL', proficiency: 'beginner', verified: false, source: 'manual' },
    ],
    resumeSource: 'manual',
  },
  {
    name: 'Preeti Desai', email: 'preeti@email.com',
    headline: 'Hospitality Professional', location: 'Goa, India', industry: 'Hospitality',
    skills: [
      { skillName: 'Customer Service', proficiency: 'expert', verified: true, source: 'test' },
      { skillName: 'Food Safety', proficiency: 'advanced', verified: true, source: 'test' },
      { skillName: 'Communication Skills', proficiency: 'advanced', verified: true, source: 'test' },
      { skillName: 'Teamwork', proficiency: 'expert', verified: false, source: 'manual' },
    ],
    resumeSource: 'upload',
  },
];

// ─── Employer Job Postings ────────────────────────────────────────────────────
function makeJobs(employers, skills) {
  const byName = (n) => skills.find(s => s.name === n);
  const req = (n, p, r = true) => ({ skillName: n, skillId: byName(n)?._id, proficiency: p, required: r });

  return [
    {
      companyName: 'TechCorp India',
      title: 'Senior React Developer',
      description: 'Build and maintain customer-facing web applications using React and modern JS tooling.',
      location: 'Bengaluru, India',
      remote: true,
      industry: 'Technology',
      jobType: 'full-time',
      requirements: [req('React', 'advanced'), req('JavaScript', 'advanced'), req('Node.js', 'intermediate', false)],
      salaryMin: 1200000, salaryMax: 2000000, currency: 'INR',
    },
    {
      companyName: 'TechCorp India',
      title: 'Data Engineer',
      description: 'Design and build scalable data pipelines that power analytics platform. Python and SQL required.',
      location: 'Bengaluru, India',
      remote: false,
      industry: 'Technology',
      jobType: 'full-time',
      requirements: [req('Python', 'advanced'), req('SQL', 'advanced'), req('Cloud Computing', 'intermediate')],
      salaryMin: 1000000, salaryMax: 1800000, currency: 'INR',
    },
    {
      companyName: 'TechCorp India',
      title: 'ML Engineer',
      description: 'Deploy ML models into production environments.',
      location: 'Bengaluru, India',
      remote: true,
      industry: 'Technology',
      jobType: 'full-time',
      requirements: [req('Machine Learning', 'advanced'), req('Python', 'advanced'), req('Cloud Computing', 'intermediate', false)],
      salaryMin: 1500000, salaryMax: 2800000, currency: 'INR',
    },
    {
      companyName: 'RetailMax',
      title: 'Store Associate — Electronics',
      description: 'Assist customers in the electronics section, manage product inquiries, and handle billing.',
      location: 'Mumbai, India',
      remote: false,
      industry: 'Retail',
      jobType: 'full-time',
      requirements: [req('Customer Service', 'intermediate'), req('Point of Sale Systems', 'beginner'), req('Communication Skills', 'intermediate')],
      salaryMin: 240000, salaryMax: 360000, currency: 'INR',
    },
    {
      companyName: 'RetailMax',
      title: 'Inventory Controller',
      description: 'Manage stock levels across regional warehouses and conduct audits.',
      location: 'Mumbai, India',
      remote: false,
      industry: 'Retail',
      jobType: 'full-time',
      requirements: [req('Inventory Management', 'advanced'), req('Data Analysis', 'beginner', false), req('Communication Skills', 'intermediate')],
      salaryMin: 360000, salaryMax: 600000, currency: 'INR',
    },
    {
      companyName: 'RetailMax',
      title: 'E-Commerce Marketing Executive',
      description: 'Run digital marketing campaigns, manage SEO and social channels.',
      location: 'Mumbai, India',
      remote: true,
      industry: 'Retail',
      jobType: 'full-time',
      requirements: [req('Digital Marketing', 'intermediate'), req('Data Analysis', 'beginner'), req('Communication Skills', 'intermediate')],
      salaryMin: 420000, salaryMax: 720000, currency: 'INR',
    },
    {
      companyName: 'HealthPlus Clinics',
      title: 'Medical Coder',
      description: 'Accurately code patient records using ICD-10 and CPT systems.',
      location: 'Ahmedabad, India',
      remote: false,
      industry: 'Healthcare',
      jobType: 'full-time',
      requirements: [req('Medical Coding', 'advanced'), req('Patient Care', 'beginner', false)],
      salaryMin: 300000, salaryMax: 500000, currency: 'INR',
    },
    {
      companyName: 'HealthPlus Clinics',
      title: 'Healthcare Data Analyst',
      description: 'Analyse patient outcomes and operational data to drive clinical decisions.',
      location: 'Ahmedabad, India',
      remote: false,
      industry: 'Healthcare',
      jobType: 'full-time',
      requirements: [req('Data Analysis', 'intermediate'), req('Python', 'intermediate', false), req('SQL', 'intermediate')],
      salaryMin: 500000, salaryMax: 900000, currency: 'INR',
    },
    {
      companyName: 'HealthPlus Clinics',
      title: 'Patient Care Coordinator',
      description: 'Coordinate care plans between doctors, patients, and insurance providers.',
      location: 'Ahmedabad, India',
      remote: false,
      industry: 'Healthcare',
      jobType: 'full-time',
      requirements: [req('Patient Care', 'intermediate'), req('Communication Skills', 'advanced'), req('Medical Coding', 'beginner', false)],
      salaryMin: 280000, salaryMax: 420000, currency: 'INR',
    },
    {
      companyName: 'BuildRight Construction',
      title: 'Electrical Technician',
      description: 'Install and maintain electrical systems at construction sites.',
      location: 'Chennai, India',
      remote: false,
      industry: 'Construction',
      jobType: 'full-time',
      requirements: [req('Electrical Wiring', 'advanced'), req('Teamwork', 'intermediate')],
      salaryMin: 300000, salaryMax: 480000, currency: 'INR',
    },
    {
      companyName: 'CloudSpark',
      title: 'Full-Stack Engineer',
      description: 'Build SaaS features with React and Node.js.',
      location: 'Remote',
      remote: true,
      industry: 'Technology',
      jobType: 'full-time',
      requirements: [req('React', 'intermediate'), req('Node.js', 'intermediate'), req('JavaScript', 'advanced'), req('Cloud Computing', 'beginner', false)],
      salaryMin: 800000, salaryMax: 1600000, currency: 'INR',
    },
  ];
}

function generateDemandData(skills) {
  const records = [];
  const today = new Date();
  const baseCounts = {
    'JavaScript': 180, 'React': 150, 'Python': 200, 'Node.js': 110,
    'SQL': 140, 'Machine Learning': 90, 'Cloud Computing': 120,
    'Customer Service': 250, 'Inventory Management': 80, 'Project Management': 100,
    'Digital Marketing': 95, 'Data Analysis': 130, 'Communication Skills': 300,
    'Patient Care': 75, 'Medical Coding': 60, 'Teamwork': 200,
    'Electrical Wiring': 55, 'Forklift Operation': 45, 'Point of Sale Systems': 70,
    'Food Safety': 65,
  };
  const trends = {
    'JavaScript': 1.002, 'React': 1.004, 'Python': 1.006, 'Machine Learning': 1.008,
    'Cloud Computing': 1.005, 'Customer Service': 1.001, 'Digital Marketing': 1.003,
  };

  for (const skill of skills) {
    const base = baseCounts[skill.name] || 30;
    const trend = trends[skill.name] || 1.0;
    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      date.setHours(0, 0, 0, 0);
      const dayFactor = Math.pow(trend, 29 - i);
      const noise = 0.85 + Math.random() * 0.3;
      const count = Math.round(base * dayFactor * noise);
      records.push({
        skillId: skill._id,
        skillName: skill.name,
        date,
        count,
        sources: { adzuna: Math.round(count * 0.7), employer: Math.round(count * 0.3) },
        regions: [
          { region: 'Bengaluru', count: Math.round(count * 0.3) },
          { region: 'Mumbai', count: Math.round(count * 0.25) },
          { region: 'Hyderabad', count: Math.round(count * 0.2) },
        ],
      });
    }
  }
  return records;
}

function makeTests(skills) {
  const byName = (n) => skills.find(s => s.name === n);
  return [
    {
      skillId: byName('JavaScript')?._id, skillName: 'JavaScript',
      proficiencyLevel: 'intermediate', cacheKey: 'javascript_intermediate',
      passingScore: 70, timeLimit: 20,
      questions: [
        { text: 'What does "===" check in JavaScript?', options: ['Value only', 'Type only', 'Value and type', 'Reference'], correctIndex: 2, explanation: 'Strict equality checks both value and type.', difficulty: 'easy' },
        { text: 'Which method creates a new array by applying a function to each element?', options: ['forEach', 'filter', 'map', 'reduce'], correctIndex: 2, explanation: 'Array.map() transforms each element.', difficulty: 'easy' },
        { text: 'What is a closure in JavaScript?', options: ['A function with no return', 'A function that remembers its lexical scope', 'An IIFE', 'A callback function'], correctIndex: 1, explanation: 'Closures retain scope access.', difficulty: 'medium' },
        { text: 'What does Promise.all() return?', options: ['First resolved', 'All rejected', 'A promise resolving when all resolve', 'A promise resolving when any resolves'], correctIndex: 2, explanation: 'Resolves when all resolve.', difficulty: 'medium' },
        { text: 'Which statement about "let" vs "var" is correct?', options: ['Both are function-scoped', 'let is block-scoped, var is function-scoped', 'var is block-scoped, let is function-scoped', 'They are identical'], correctIndex: 1, explanation: 'let is block scoped.', difficulty: 'easy' },
      ],
    },
    {
      skillId: byName('React')?._id, skillName: 'React',
      proficiencyLevel: 'intermediate', cacheKey: 'react_intermediate',
      passingScore: 70, timeLimit: 20,
      questions: [
        { text: 'What is the Virtual DOM in React?', options: ['Actual browser DOM', 'Lightweight in-memory representation of DOM', 'CSS-in-JS', 'State management'], correctIndex: 1, explanation: 'In-memory DOM representation.', difficulty: 'easy' },
        { text: 'Which hook manages side effects?', options: ['useState', 'useContext', 'useEffect', 'useReducer'], correctIndex: 2, explanation: 'useEffect handles side effects.', difficulty: 'easy' },
        { text: 'What is the key prop used for in lists?', options: ['Styling', 'Accessibility', 'Identifying changed/added/removed items', 'Events'], correctIndex: 2, explanation: 'Helps React efficiently reconcile lists.', difficulty: 'medium' },
        { text: 'When does useEffect run by default without dependencies?', options: ['Only on mount', 'Only on unmount', 'After every render', 'Before render'], correctIndex: 2, explanation: 'Runs after every render.', difficulty: 'medium' },
        { text: 'What is the correct way to update state in React?', options: ['Directly mutate state', 'Use setState / setter', 'Use global var', 'Both A and C'], correctIndex: 1, explanation: 'Use state setter.', difficulty: 'easy' },
      ],
    },
    {
      skillId: byName('Customer Service')?._id, skillName: 'Customer Service',
      proficiencyLevel: 'intermediate', cacheKey: 'customerservice_intermediate',
      passingScore: 70, timeLimit: 15,
      questions: [
        { text: 'A customer is angry about a delayed order. What is the best first step?', options: ['Blame courier', 'Refund immediately', 'Acknowledge frustration and apologize', 'Transfer department'], correctIndex: 2, explanation: 'Empathy de-escalates.', difficulty: 'easy' },
        { text: 'What does active listening involve?', options: ['Talking more', 'Interrupting', 'Full attention and paraphrasing', 'Checking phone'], correctIndex: 2, explanation: 'Active listening is full attention.', difficulty: 'easy' },
        { text: 'Handling request outside authority?', options: ['Guess answer', 'Refuse', 'Escalate while keeping customer informed', 'Promise anything'], correctIndex: 2, explanation: 'Escalate properly.', difficulty: 'medium' },
        { text: 'Handling complaint about faulty product?', options: ['Deny', 'Acknowledge, apologize, offer fix', 'Contact manufacturer', 'Nothing can be done'], correctIndex: 1, explanation: 'Acknowledge and offer solution.', difficulty: 'medium' },
        { text: 'Goal of follow-up after complaint?', options: ['Upsell', 'Confirm resolution and rebuild trust', 'Document for HR', 'Not necessary'], correctIndex: 1, explanation: 'Rebuild trust.', difficulty: 'easy' },
      ],
    },
  ];
}

export async function seedData() {
  // Idempotent: clear existing seed data
  await Promise.all([
    User.deleteMany({}), LearnerProfile.deleteMany({}), EmployerProfile.deleteMany({}),
    SkillTaxonomy.deleteMany({}), JobEmployer.deleteMany({}),
    SkillDemandDaily.deleteMany({}), Credential.deleteMany({}),
    SkillTest.deleteMany({}), LearningPath.deleteMany({}),
  ]);
  console.log('🗑️  Cleared existing data');

  // 1. Skills
  const skills = await SkillTaxonomy.insertMany(SKILLS);
  console.log(`✅ Seeded ${skills.length} skills`);

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
  const rawJobs = makeJobs(employerProfiles, skills);
  const jobs = await JobEmployer.insertMany(
    rawJobs.map((j, i) => ({
      ...j,
      employerId: employerUsers[i % employerUsers.length]._id,
      requirements: j.requirements.map(r => ({ ...r, skillId: skillMap[r.skillName] })),
    }))
  );
  console.log(`✅ Seeded ${jobs.length} employer jobs`);

  // 4. Learner users + profiles
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

  // 5. Skill demand daily
  const demandRecords = generateDemandData(skills);
  await SkillDemandDaily.insertMany(demandRecords);
  console.log(`✅ Seeded ${demandRecords.length} skill demand records`);

  // 6. Skill tests
  const rawTests = makeTests(skills);
  const tests = await SkillTest.insertMany(rawTests);
  console.log(`✅ Seeded ${tests.length} skill tests`);

  // 7. Pre-issued credentials
  const credDefs = [
    { learnerIdx: 0, skillName: 'JavaScript', proficiencyLevel: 'intermediate', score: 82, jobIdx: 0 },
    { learnerIdx: 1, skillName: 'Python', proficiencyLevel: 'advanced', score: 91, jobIdx: 1 },
    { learnerIdx: 2, skillName: 'Customer Service', proficiencyLevel: 'intermediate', score: 88, jobIdx: 3 },
    { learnerIdx: 3, skillName: 'React', proficiencyLevel: 'advanced', score: 95, jobIdx: 0 },
    { learnerIdx: 4, skillName: 'Medical Coding', proficiencyLevel: 'advanced', score: 87, jobIdx: 6 },
  ];
  const issuedAt = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
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
        questionsAnswered: 5,
        correctAnswers: Math.round(5 * c.score / 100),
        timeTakenMinutes: 10,
        completedAt: issuedAt,
      },
    }))
  );
  console.log(`✅ Seeded ${credentials.length} credentials`);
  console.log('🎉 Database seeding completed successfully.');
}

// If run directly via node
if (process.argv[1]?.endsWith('seed/index.js')) {
  mongoose.connect(MONGO_URI).then(async () => {
    await seedData();
    await mongoose.disconnect();
    process.exit(0);
  }).catch(err => {
    console.error('Seed script error:', err);
    process.exit(1);
  });
}
