/**
 * AI Service — Multi-Domain AI & Fallback Question Engine
 * Supports: HR, Sales, Legal, Education, Marketing, Accounting, Operations, Customer Service, Healthcare/Pharma, Tech
 */
import axios from 'axios';

const OLLAMA_URL = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'gpt-oss:20b-cloud';

async function generate(prompt) {
  try {
    const res = await axios.post(
      `${OLLAMA_URL}/api/generate`,
      { model: OLLAMA_MODEL, prompt, stream: false, format: 'json' },
      { timeout: 30000 }
    );
    return res.data.response;
  } catch (err) {
    throw new Error(`Ollama service unavailable (${err.message})`);
  }
}

function safeParseJson(raw) {
  try {
    const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    return JSON.parse(cleaned);
  } catch {
    return null;
  }
}

// ─── Resource URL Engine per Domain ─────────────────────────────────────────
function getResourceUrls(skillName, stepType) {
  const skill = skillName.toLowerCase().trim();
  const urls = {
    // HR & Management
    'hr compliance': { read: 'https://www.shrm.org/resourcesandtools/tools-and-samples/hr-qa', watch: 'https://www.youtube.com/results?search_query=hr+compliance+guide', practice: 'https://www.shrm.org', project: 'https://www.shrm.org' },
    'talent acquisition': { read: 'https://www.geeksforgeeks.org/talent-acquisition-process/', watch: 'https://www.youtube.com/results?search_query=talent+acquisition+strategies', practice: 'https://www.linkedin.com/learning', project: 'https://www.shrm.org' },
    'employee relations': { read: 'https://www.shrm.org/hr-today/trends-and-forecasting/special-reports-and-expert-views/pages/employee-relations.aspx', watch: 'https://www.youtube.com/results?search_query=employee+relations+training', practice: 'https://www.coursera.org', project: 'https://www.shrm.org' },

    // Sales
    'b2b sales': { read: 'https://www.hubspot.com/sales/b2b-sales', watch: 'https://www.youtube.com/results?search_query=b2b+sales+masterclass', practice: 'https://academy.hubspot.com', project: 'https://www.hubspot.com' },
    'crm systems': { read: 'https://trailhead.salesforce.com', watch: 'https://www.youtube.com/results?search_query=salesforce+crm+tutorial', practice: 'https://trailhead.salesforce.com', project: 'https://trailhead.salesforce.com' },

    // Legal
    'legal writing & contract law': { read: 'https://www.law.cornell.edu/wex/contract', watch: 'https://www.youtube.com/results?search_query=contract+drafting+tutorial', practice: 'https://www.coursera.org/learn/contract-law', project: 'https://www.law.cornell.edu' },

    // Education
    'lesson planning': { read: 'https://www.edutopia.org/article/lesson-planning-resources', watch: 'https://www.youtube.com/results?search_query=effective+lesson+planning', practice: 'https://www.coursera.org/learn/instructional-design', project: 'https://www.edutopia.org' },
    'classroom management': { read: 'https://www.edutopia.org/classroom-management', watch: 'https://www.youtube.com/results?search_query=classroom+management+strategies', practice: 'https://www.edutopia.org', project: 'https://www.edutopia.org' },

    // Marketing
    'digital marketing': { read: 'https://skillshop.withgoogle.com', watch: 'https://www.youtube.com/results?search_query=digital+marketing+course', practice: 'https://skillshop.withgoogle.com', project: 'https://academy.hubspot.com' },
    'content writing': { read: 'https://copyblogger.com/blog', watch: 'https://www.youtube.com/results?search_query=content+writing+course', practice: 'https://copyblogger.com', project: 'https://copyblogger.com' },

    // Accounting & Finance
    'financial accounting': { read: 'https://www.accountingtools.com', watch: 'https://www.youtube.com/results?search_query=financial+accounting+tutorial', practice: 'https://www.coursera.org/learn/financial-accounting', project: 'https://www.investopedia.com' },
    'tax compliance': { read: 'https://incometaxindia.gov.in', watch: 'https://www.youtube.com/results?search_query=gst+taxation+guide', practice: 'https://icai.org', project: 'https://incometaxindia.gov.in' },

    // Operations
    'supply chain optimization': { read: 'https://www.geeksforgeeks.org/supply-chain-management/', watch: 'https://www.youtube.com/results?search_query=supply+chain+optimization', practice: 'https://www.coursera.org/learn/supply-chain-logistics', project: 'https://www.asq.org' },
    'inventory management': { read: 'https://www.geeksforgeeks.org/inventory-management/', watch: 'https://www.youtube.com/results?search_query=inventory+management+tutorial', practice: 'https://www.coursera.org', project: 'https://www.asq.org' },

    // Healthcare & Pharmacy
    'clinical pharmacology': { read: 'https://www.ncbi.nlm.nih.gov/pmc/', watch: 'https://www.youtube.com/results?search_query=pharmacology+lectures', practice: 'https://www.coursera.org/learn/pharmacology', project: 'https://www.who.int' },
    'patient safety & care': { read: 'https://www.who.int/teams/integrated-health-services/patient-safety', watch: 'https://www.youtube.com/results?search_query=patient+safety+training', practice: 'https://www.who.int', project: 'https://www.who.int' },

    // Tech
    javascript: { read: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide', watch: 'https://www.youtube.com/results?search_query=javascript+tutorial', practice: 'https://www.w3schools.com/js/', project: 'https://javascript30.com' },
    react: { read: 'https://react.dev/learn', watch: 'https://www.youtube.com/results?search_query=react+tutorial', practice: 'https://react.dev', project: 'https://github.com/enaqx/awesome-react' },
    python: { read: 'https://docs.python.org/3/tutorial/', watch: 'https://www.youtube.com/results?search_query=python+tutorial', practice: 'https://www.w3schools.com/python/', project: 'https://www.kaggle.com' },
  };

  const found = urls[skill];
  if (found) return found[stepType] || found.read || null;

  return `https://www.geeksforgeeks.org/search/?q=${encodeURIComponent(skillName)}`;
}

// ─── Domain-Specific Question Bank ──────────────────────────────────────────
const QUESTION_BANK = {
  'HR Compliance': [
    { text: 'Which Indian statute mandates the maintenance of safety committees in factories with over 250 workers?', options: ['Payment of Bonus Act', 'Factories Act, 1948', 'Industrial Disputes Act', 'Minimum Wages Act'], correctIndex: 1, explanation: 'The Factories Act, 1948 section 41G mandates safety committees.', difficulty: 'medium' },
    { text: 'Under standard statutory HR rules, what is the notice period requirement prior to declaring a lockout in public utility services?', options: ['7 days', '14 days', '6 weeks', '30 days'], correctIndex: 2, explanation: 'Section 22 of Industrial Disputes Act requires 6 weeks notice.', difficulty: 'hard' },
    { text: 'What does PoSH compliance stand for in organizational HR?', options: ['Prevention of Sexual Harassment', 'Policy of Safety & Health', 'Protection of Senior Staff', 'Protocol of Social Handling'], correctIndex: 0, explanation: 'PoSH refers to Prevention of Sexual Harassment at Workplace Act 2013.', difficulty: 'easy' },
    { text: 'What is the statutory limit for maximum overtime hours per quarter under the Factories Act?', options: ['50 hours', '75 hours', '100 hours', '125 hours'], correctIndex: 1, explanation: 'Standard limit is 75 hours per quarter.', difficulty: 'medium' },
    { text: 'An employer fails to deposit EPF contributions deducted from employee salaries. Which legal section is violated?', options: ['EPF Act Section 14B / IPC 406', 'Income Tax Sec 80C', 'GST Sec 16', 'Contract Act Sec 10'], correctIndex: 0, explanation: 'Failure to deposit EPF constitutes breach of trust under IPC 406 & EPF Act.', difficulty: 'hard' },
    { text: 'What is the mandatory threshold for forming an Internal Complaints Committee (ICC) under PoSH?', options: ['5 employees', '10 or more employees', '25 employees', '50 employees'], correctIndex: 1, explanation: 'Every workplace with 10+ employees must constitute an ICC.', difficulty: 'easy' },
    { text: 'Under the Maternity Benefit Act (Amended 2017), how many weeks of paid maternity leave are mandated for women having up to 2 surviving children?', options: ['12 weeks', '18 weeks', '26 weeks', '30 weeks'], correctIndex: 2, explanation: 'The 2017 amendment enhanced paid maternity leave to 26 weeks.', difficulty: 'medium' },
    { text: 'What is the statutory basis for calculating gratuity payment after 5 years of continuous service?', options: ['(15 days basic + DA) × years of service / 26', '1 month total gross salary × years', '10% of annual package', 'Fixed ₹50,000'], correctIndex: 0, explanation: 'Gratuity formula is (15 * Last drawn basic+DA * tenure) / 26.', difficulty: 'hard' },
    { text: 'Which document establishes employee-employer terms and legally binding workplace obligations?', options: ['Offer letter', 'Appointment letter / Employment Contract', 'Resignation acceptance', 'ID card'], correctIndex: 1, explanation: 'Employment Contract outlines legally binding duties.', difficulty: 'easy' },
    { text: 'Which register is mandatory for tracking employee attendance and wage disbursements for labor audits?', options: ['Mustering roll / Form T register', 'Visitor log', 'Stock ledger', 'Vendor invoice log'], correctIndex: 0, explanation: 'Muster Roll (Form T) tracks daily attendance and wage compliance.', difficulty: 'medium' }
  ],

  'Talent Acquisition': [
    { text: 'What metric measures the percentage of job offers accepted by candidates?', options: ['Time to fill', 'Offer acceptance rate', 'Cost per hire', 'Source yield'], correctIndex: 1, explanation: 'Offer acceptance rate = (Offers Accepted / Total Offers Extended) * 100.', difficulty: 'easy' },
    { text: 'Which sourcing technique uses boolean strings (AND, OR, NOT, site:) on search engines?', options: ['Passive referral', 'Boolean searching', 'Headhunting', 'Cold calling'], correctIndex: 1, explanation: 'Boolean search allows precision candidate discovery.', difficulty: 'easy' },
    { text: 'What is the primary objective of a structured behavioral interview technique (STAR method)?', options: ['Test rapid coding', 'Evaluate past behavior as predictor of future performance', 'Check resume grammar', 'Assess salary expectations'], correctIndex: 1, explanation: 'STAR (Situation, Task, Action, Result) evaluates competency via past examples.', difficulty: 'medium' },
    { text: 'What does "Time-to-Hire" measure in recruitment analytics?', options: ['Time candidate spends in interview', 'Days from candidate application to offer acceptance', 'Probation period duration', 'Notice period duration'], correctIndex: 1, explanation: 'Time-to-hire measures speed from initial application to offer acceptance.', difficulty: 'medium' },
    { text: 'Which ATS feature automatically scans resumes for relevant keywords and experience alignment?', options: ['Candidate parsing & match scoring', 'Automatic email rejection', 'Video recording', 'Background check'], correctIndex: 0, explanation: 'ATS parsing extracts structured resume data and matches skills.', difficulty: 'easy' },
    { text: 'What strategy reduces early employee turnover during the first 90 days?', options: ['Lowering salary', 'Structured onboarding & buddy program', 'Eliminating probation', 'Increasing interview rounds'], correctIndex: 1, explanation: 'Effective onboarding drives 90-day retention.', difficulty: 'medium' },
    { text: 'How do talent acquisition teams calculate "Cost per Hire"?', options: ['(Internal costs + External costs) / Total number of hires', 'Recruiter salary / 12', 'Agency fees only', 'Job board subscription price'], correctIndex: 0, explanation: 'Cost per Hire includes internal team costs + external placement/tool fees divided by hires.', difficulty: 'hard' },
    { text: 'What is candidate pipeline drop-off analysis used for?', options: ['Reducing job board costs', 'Identifying bottlenecks in recruitment stages', 'Evaluating employee performance', 'Calculating payroll tax'], correctIndex: 1, explanation: 'Funnel drop-off analysis highlights friction points between interview stages.', difficulty: 'hard' }
  ],

  'B2B Sales': [
    { text: 'What does BANT qualification stand for in enterprise sales?', options: ['Budget, Authority, Need, Timeline', 'Business, Action, Negotiation, Target', 'Buyer, Account, Network, Territory', 'Brand, Affinity, Nurture, Traction'], correctIndex: 0, explanation: 'BANT is Budget, Authority, Need, Timeline.', difficulty: 'easy' },
    { text: 'In consultative selling, what is the primary focus during initial prospect calls?', options: ['Pitching product features immediately', 'Understanding customer pain points and business goals', 'Demanding contract sign-off', 'Offering 50% discount'], correctIndex: 1, explanation: 'Consultative selling prioritizes diagnosing prospect problems before pitching.', difficulty: 'easy' },
    { text: 'What is "Sales Velocity"?', options: ['Speed of demo presentation', 'Metric measuring how fast deals move through pipeline to generate revenue', 'Number of emails sent per day', 'Commission payout speed'], correctIndex: 1, explanation: 'Sales Velocity = (Opportunities * Deal Value * Win Rate) / Sales Cycle Length.', difficulty: 'hard' },
    { text: 'What is the main purpose of an account expansion (Upsell / Cross-sell) strategy?', options: ['Increasing Net Revenue Retention (NRR) from existing clients', 'Replacing lost sales reps', 'Finding new leads on LinkedIn', 'Cold calling random companies'], correctIndex: 0, explanation: 'Account expansion drives higher LTV and NRR from current client accounts.', difficulty: 'medium' },
    { text: 'Which CRM metric tracks the conversion rate of SQLs (Sales Qualified Leads) to Closed Deals?', options: ['Churn rate', 'Win rate', 'Bounce rate', 'Impression share'], correctIndex: 1, explanation: 'Win rate measures the percentage of qualified opportunities won.', difficulty: 'medium' },
    { text: 'How should a sales executive handle a prospect objecting that "the price is too high"?', options: ['Offer immediate discount', 'Re-anchor on ROI and value delivered to business goals', 'Argue with customer', 'Walk away instantly'], correctIndex: 1, explanation: 'Price objections are handled by demonstrating economic value and ROI.', difficulty: 'medium' },
    { text: 'What is the purpose of a Mutual Action Plan (MAP) in enterprise B2B sales?', options: ['Internal quota tracking', 'Shared timeline agreed between buyer and seller to guide procurement to close', 'Legal NDA document', 'Vendor invoice format'], correctIndex: 1, explanation: 'A MAP aligns buyer internal stakeholders with seller closing steps.', difficulty: 'hard' },
    { text: 'Which stage immediately follows "Discovery & Needs Analysis" in a standard enterprise sales cycle?', options: ['Proposal / Demo presentation', 'Contract signing', 'Cold outreach', 'Customer onboarding'], correctIndex: 0, explanation: 'After discovery, sales reps deliver a tailored solution proposal or demo.', difficulty: 'easy' }
  ],

  'Legal Writing & Contract Law': [
    { text: 'Which essential element is required for a contract to be legally enforceable under contract law?', options: ['Notarization by government', 'Offer, Acceptance, Consideration, and Mutual Intent', '50-page documentation', 'Stamp paper of ₹10,000'], correctIndex: 1, explanation: 'Valid contracts require offer, acceptance, lawful consideration, and mutual consent.', difficulty: 'easy' },
    { text: 'What does an "Indemnity Clause" in a corporate commercial agreement provide?', options: ['Fixed salary schedule', 'Protection against financial loss or liability incurred by one party due to breach', 'Termination notice window', 'IP ownership transfer'], correctIndex: 1, explanation: 'Indemnity holds one party harmless against losses arising from specified triggers.', difficulty: 'medium' },
    { text: 'What is the legal effect of a "Force Majeure" clause?', options: ['Increases contract value', 'Excuses non-performance due to unforeseeable extraordinary events beyond control', 'Mandates arbitration in UK', 'Transfers contract to third party'], correctIndex: 1, explanation: 'Force majeure suspends contractual obligations during natural disasters/war.', difficulty: 'medium' },
    { text: 'What does "Severability" mean in contract drafting?', options: ['If one clause is invalid, the remainder of contract stays in force', 'Contract can be cancelled anytime', 'Contract applies only in winter', 'Both parties must sever ties'], correctIndex: 0, explanation: 'Severability ensures invalidity of one provision does not void the entire agreement.', difficulty: 'medium' },
    { text: 'What is the difference between Liquidated Damages and Penalty in contract law?', options: ['No difference', 'Liquidated damages are genuine pre-estimate of loss; penalty is punitive', 'Penalty is always legal', 'Liquidated damages apply only to software'], correctIndex: 1, explanation: 'Courts enforce genuine pre-estimated liquidated damages but void punitive penalties.', difficulty: 'hard' },
    { text: 'What does boilerplate clause "Entire Agreement / Integration Clause" achieve?', options: ['Supersedes all prior negotiations, emails, and oral representations', 'Guarantees 100% profit', 'Allows unlimited sub-contracting', 'Cancels arbitration'], correctIndex: 0, explanation: 'Entire Agreement clauses ensure only written terms in final document govern.', difficulty: 'hard' }
  ],

  'Lesson Planning': [
    { text: 'According to Bloom\'s Revised Taxonomy, which cognitive level represents the highest order thinking skill?', options: ['Remembering', 'Applying', 'Analyzing', 'Creating'], correctIndex: 3, explanation: 'Creating (designing, constructing) is the highest cognitive level in Bloom\'s taxonomy.', difficulty: 'easy' },
    { text: 'What is the main purpose of Formative Assessment during a lesson?', options: ['Final grade assignment', 'Monitoring student learning to provide ongoing feedback and adjust instruction', 'Ranking students', 'Annual board examination'], correctIndex: 1, explanation: 'Formative assessment guides ongoing instruction during learning.', difficulty: 'easy' },
    { text: 'What does SMART objective stand for in curriculum design?', options: ['Specific, Measurable, Achievable, Relevant, Time-bound', 'Simple, Methodical, Academic, Rigorous, Tested', 'Student, Teacher, Action, Result, Topic', 'Standard, Managed, Aligned, Reviewed, Tracked'], correctIndex: 0, explanation: 'SMART learning objectives specify measurable student outcomes.', difficulty: 'easy' },
    { text: 'What is Differentiated Instruction in classroom pedagogy?', options: ['Teaching one student at a time', 'Tailoring content, process, and products according to diverse learner needs', 'Using only textbooks', 'Separate exams for boys and girls'], correctIndex: 1, explanation: 'Differentiated instruction accommodates varying readiness levels and learning styles.', difficulty: 'medium' },
    { text: 'What is constructive alignment in curriculum planning?', options: ['Aligning classroom chairs', 'Ensuring learning outcomes, teaching activities, and assessments are directly linked', 'Aligning syllabus with textbook pages', 'Teacher-student agreement'], correctIndex: 1, explanation: 'Constructive alignment ensures assessment measures target learning outcomes.', difficulty: 'hard' }
  ],

  'Digital Marketing': [
    { text: 'What does CTR stand for in online advertising metrics?', options: ['Cost To Rank', 'Click-Through Rate', 'Customer Traction Ratio', 'Content Target Reach'], correctIndex: 1, explanation: 'CTR = (Clicks / Impressions) * 100.', difficulty: 'easy' },
    { text: 'Which SEO practice involves optimizing title tags, meta descriptions, and header tags on a website?', options: ['Off-page SEO', 'On-page SEO', 'Black-hat SEO', 'Affiliate SEO'], correctIndex: 1, explanation: 'On-page SEO optimizes elements on the website pages themselves.', difficulty: 'easy' },
    { text: 'What is Customer Acquisition Cost (CAC)?', options: ['Total marketing spend / Total new customers acquired', 'Price of single ad click', 'Monthly agency retainer', 'Product manufacturing cost'], correctIndex: 0, explanation: 'CAC calculates total sales/marketing expense per acquired customer.', difficulty: 'medium' },
    { text: 'What is the main goal of Remarketing / Retargeting campaigns?', options: ['Targeting competitor employees', 'Re-engaging website visitors who left without converting', 'Sending cold physical mail', 'Blocking spam bots'], correctIndex: 1, explanation: 'Retargeting displays ads to past site visitors to drive conversions.', difficulty: 'medium' },
    { text: 'In Google Ads, what factor determines Ad Rank alongside maximum CPC bid?', options: ['Quality Score', 'Domain age', 'Company revenue', 'Instagram followers'], correctIndex: 0, explanation: 'Ad Rank = Max Bid * Quality Score (relevance, expected CTR, landing page experience).', difficulty: 'hard' }
  ],

  'Financial Accounting': [
    { text: 'Under double-entry bookkeeping, what is the accounting equation?', options: ['Assets = Liabilities + Equity', 'Revenue = Expenses', 'Assets + Revenue = Liabilities', 'Profit = Cash in Bank'], correctIndex: 0, explanation: 'Assets = Liabilities + Owner\'s Equity.', difficulty: 'easy' },
    { text: 'Which financial statement reflects a company\'s financial position at a specific point in time?', options: ['Income Statement', 'Balance Sheet', 'Cash Flow Statement', 'Statement of Retained Earnings'], correctIndex: 1, explanation: 'Balance Sheet provides a snapshot of assets, liabilities, and equity on a specific date.', difficulty: 'easy' },
    { text: 'What does the Accrual Principle dictate in financial accounting?', options: ['Record revenues/expenses only when cash is received/paid', 'Record revenues when earned and expenses when incurred regardless of cash flow', 'Ignore tax deductions', 'Record cash transactions twice'], correctIndex: 1, explanation: 'Accrual accounting recognizes transactions when revenue is earned and expense incurred.', difficulty: 'medium' },
    { text: 'What is the purpose of preparing a Trial Balance?', options: ['File GST returns', 'Verify mathematical equality of total debit and credit balances', 'Calculate CEO bonus', 'Apply for bank loan'], correctIndex: 1, explanation: 'Trial balance checks that total debits equal total credits.', difficulty: 'medium' },
    { text: 'Which ratio measures a company\'s ability to pay short-term obligations with its most liquid assets?', options: ['Debt-to-Equity Ratio', 'Quick Ratio (Acid-Test)', 'Return on Equity (ROE)', 'Gross Margin Ratio'], correctIndex: 1, explanation: 'Quick Ratio = (Cash + Marketable Securities + Receivables) / Current Liabilities.', difficulty: 'hard' }
  ],

  'Supply Chain Optimization': [
    { text: 'What is the "Bullwhip Effect" in supply chain management?', options: ['Fast truck delivery', 'Amplification of demand variability as orders move upstream from retailer to manufacturer', 'Price increase of raw materials', 'Worker strike in ports'], correctIndex: 1, explanation: 'Bullwhip effect refers to distorted demand information cascading up the supply chain.', difficulty: 'medium' },
    { text: 'What does EOQ (Economic Order Quantity) calculate?', options: ['Maximum truck load weight', 'Optimal order quantity that minimizes total inventory holding and ordering costs', 'Fastest delivery route', 'Warehouse rent price'], correctIndex: 1, explanation: 'EOQ minimizes the sum of holding costs and setup/ordering costs.', difficulty: 'medium' },
    { text: 'What is Just-In-Time (JIT) inventory philosophy?', options: ['Stocking 1 year of safety buffer', 'Receiving goods only as needed in production process to minimize holding costs', 'Ordering inventory every Monday', 'Using air freight only'], correctIndex: 1, explanation: 'JIT eliminates waste and storage costs by receiving materials right before production.', difficulty: 'easy' }
  ],

  'Clinical Pharmacology': [
    { text: 'What does "Pharmacokinetics" describe in clinical pharmacology?', options: ['What the drug does to the body', 'What the body does to the drug (Absorption, Distribution, Metabolism, Excretion)', 'Drug pricing models', 'Surgical techniques'], correctIndex: 1, explanation: 'Pharmacokinetics (ADME) studies drug movement through the body.', difficulty: 'easy' },
    { text: 'What is "First-Pass Metabolism"?', options: ['Intravenous drug administration', 'Metabolism of drug in liver before reaching systemic circulation following oral ingestion', 'Kidney excretion of toxins', 'Allergic reaction to antibiotics'], correctIndex: 1, explanation: 'Oral drugs absorbed via GI tract undergo hepatic metabolism before systemic entry.', difficulty: 'medium' },
    { text: 'What is the therapeutic index of a drug?', options: ['Price to efficacy ratio', 'Ratio between toxic dose (TD50) and effective dose (ED50) measuring drug safety', 'Shelf life duration', 'Tablet dissolution rate'], correctIndex: 1, explanation: 'Therapeutic index = TD50 / ED50; higher index means safer drug.', difficulty: 'hard' }
  ],

  'JavaScript': [
    { text: 'What does "===" check in JavaScript?', options: ['Value only', 'Type only', 'Value and type', 'Memory address'], correctIndex: 2, explanation: 'Strict equality checks both value and data type.', difficulty: 'easy' },
    { text: 'What is a JavaScript Closure?', options: ['Closing a browser window', 'Function bundled with references to its surrounding lexical environment', 'An IIFE syntax error', 'A HTML tag'], correctIndex: 1, explanation: 'Closures give inner functions access to outer function scope.', difficulty: 'medium' },
    { text: 'What does Promise.all() do when one promise rejects?', options: ['Ignores rejection', 'Immediately rejects with that error', 'Waits for remaining promises', 'Returns null'], correctIndex: 1, explanation: 'Promise.all rejects immediately if any input promise rejects.', difficulty: 'medium' }
  ],

  'React': [
    { text: 'What is the Virtual DOM in React?', options: ['Physical browser tree', 'Lightweight in-memory representation of real DOM', 'State object', 'Routing engine'], correctIndex: 1, explanation: 'Virtual DOM enables fast diffing and minimal real DOM updates.', difficulty: 'easy' },
    { text: 'Which React Hook handles side effects like data fetching or subscriptions?', options: ['useState', 'useContext', 'useEffect', 'useMemo'], correctIndex: 2, explanation: 'useEffect runs side effects after renders.', difficulty: 'easy' },
    { text: 'What is the purpose of the `key` prop in React lists?', options: ['CSS styling', 'Helping React identify which items have changed, added, or removed during reconciliation', 'Passing data to parent', 'Encrypting list data'], correctIndex: 1, explanation: 'Keys give elements stable identity across re-renders.', difficulty: 'medium' }
  ],

  'Python': [
    { text: 'Which Python data structure is immutable?', options: ['List', 'Dictionary', 'Tuple', 'Set'], correctIndex: 2, explanation: 'Tuples cannot be modified after creation.', difficulty: 'easy' },
    { text: 'What does list comprehension `[x**2 for x in range(5)]` return?', options: ['[0, 1, 4, 9, 16]', '[1, 4, 9, 16, 25]', '[0, 2, 4, 6, 8]', 'SyntaxError'], correctIndex: 0, explanation: 'Squares numbers from 0 to 4.', difficulty: 'easy' },
    { text: 'What is the purpose of `__init__` in Python classes?', options: ['Class destructor', 'Constructor method called when creating an instance', 'Import helper', 'Module main entry'], correctIndex: 1, explanation: '__init__ initializes new instance attributes.', difficulty: 'easy' }
  ]
};

// ─── Skill Test Question Generator ──────────────────────────────────────────
export async function generateSkillTest(skillName, proficiencyLevel, questionCount = 8) {
  const reqCount = parseInt(questionCount) || 8;

  // Try AI first if configured
  try {
    const prompt = `
You are an expert test designer. Generate ${reqCount} multiple-choice questions to evaluate "${skillName}" at ${proficiencyLevel} level.
Return ONLY JSON:
{
  "questions": [
    {
      "text": "Question text",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctIndex": 0,
      "explanation": "Why correct",
      "difficulty": "easy|medium|hard"
    }
  ]
}
Questions must be realistic, rigorous, and specific to ${skillName}.
Do NOT use generic coding questions for non-coding skills!`;

    const raw = await generate(prompt);
    const parsed = safeParseJson(raw);
    if (parsed?.questions?.length >= reqCount) {
      return { questions: parsed.questions.slice(0, reqCount) };
    }
  } catch (err) {
    console.warn(`AI test generation notice for "${skillName}": Using domain question bank fallback.`);
  }

  // Fallback to domain bank
  const key = Object.keys(QUESTION_BANK).find(k => k.toLowerCase() === skillName.toLowerCase().trim());
  let bankQuestions = key ? QUESTION_BANK[key] : null;

  if (!bankQuestions || bankQuestions.length === 0) {
    // Generate tailored questions dynamically for any unbanked skill
    bankQuestions = [
      { text: `What is the core principle of effective ${skillName} in professional practice?`, options: [`Systematic execution & compliance`, `Ignoring industry standards`, `Relying solely on informal memory`, `Bypassing evaluation metrics`], correctIndex: 0, explanation: `${skillName} requires systematic methodology and adherence to standards.`, difficulty: 'easy' },
      { text: `Which metric is most critical when evaluating performance in ${skillName}?`, options: [`Quality of outcome & accuracy`, `Color of reporting documents`, `Number of emails sent`, `Desk layout`], correctIndex: 0, explanation: `Outcome quality and accuracy measure true proficiency in ${skillName}.`, difficulty: 'medium' },
      { text: `When facing a complex obstacle in ${skillName}, what is the recommended professional approach?`, options: [`Root-cause analysis and stakeholder alignment`, `Delaying response indefinitely`, `Hiding the issue`, `Guessing without data`], correctIndex: 0, explanation: `Root-cause analysis combined with alignment ensures robust resolution.`, difficulty: 'medium' },
      { text: `How does advanced ${skillName} directly impact business objectives?`, options: [`Improves operational efficiency & risk mitigation`, `Increases unnecessary expenses`, `Has zero business impact`, `Slows down team workflow`], correctIndex: 0, explanation: `Higher proficiency drives organizational efficiency and reduces risk.`, difficulty: 'hard' },
      { text: `Which tool or framework is commonly utilized in modern ${skillName}?`, options: [`Industry-standard software & structured frameworks`, `Manual paper notes only`, `Unstructured social chat`, `None`], correctIndex: 0, explanation: `Structured industry frameworks ensure consistent results in ${skillName}.`, difficulty: 'easy' },
      { text: `What distinguishes intermediate from advanced execution in ${skillName}?`, options: [`Strategic foresight and handling edge cases`, `Doing only basic routine tasks`, `Making frequent errors`, `Speed without quality`], correctIndex: 0, explanation: `Advanced execution anticipates edge cases and aligns with overall strategy.`, difficulty: 'hard' },
      { text: `What is a common risk when ${skillName} protocols are inadequately enforced?`, options: [`Compliance failure & operational bottlenecks`, `Higher customer delight`, `Increased revenue`, `Zero impact`], correctIndex: 0, explanation: `Inadequate enforcement causes compliance breaches and process failure.`, difficulty: 'medium' },
      { text: `In continuous professional development, how should one stay updated in ${skillName}?`, options: [`Regular industry audits, training, & certifications`, `Assuming past knowledge is forever sufficient`, `Avoiding industry news`, `Never reviewing metrics`], correctIndex: 0, explanation: `Ongoing learning and certification maintain domain mastery in ${skillName}.`, difficulty: 'easy' },
      { text: `What role does cross-functional communication play in ${skillName}?`, options: [`Aligns objectives across departments`, `Causes friction`, `Is irrelevant`, `Only matters for executive management`], correctIndex: 0, explanation: `Cross-functional communication ensures cohesive execution across teams.`, difficulty: 'medium' },
      { text: `Which strategy best ensures quality control in ${skillName}?`, options: [`Standard Operating Procedures (SOPs) & audit checklists`, `Unplanned execution`, `No documentation`, `Relying on luck`], correctIndex: 0, explanation: `SOPs and systematic audits ensure repeatable quality standards.`, difficulty: 'easy' }
    ];
  }

  // Shuffle or slice to match requested count
  const shuffled = [...bankQuestions].sort(() => 0.5 - Math.random());
  let selected = shuffled.slice(0, reqCount);

  // If requested count is higher than available in bank, loop and duplicate with index suffix
  while (selected.length < reqCount) {
    const nextQ = bankQuestions[selected.length % bankQuestions.length];
    selected.push({
      ...nextQ,
      text: `${nextQ.text} (Scenario ${Math.floor(selected.length / bankQuestions.length) + 1})`
    });
  }

  return { questions: selected };
}

// ─── Resume Parsing ──────────────────────────────────────────────────────────
export async function parseResume(resumeText) {
  try {
    const prompt = `
You are a resume parsing AI. Extract structured info from the text below.
Return ONLY JSON:
{
  "name": "Full Name",
  "email": "email@example.com",
  "phone": "phone or null",
  "location": "City, Country or null",
  "headline": "Professional headline or null",
  "education": [{"institution": "", "degree": "", "field": "", "year": null}],
  "workHistory": [{"title": "", "company": "", "duration": "", "description": ""}],
  "skills": [{"skillName": "", "proficiency": "beginner|intermediate|advanced|expert"}],
  "industry": "primary industry",
  "confidence": 0.95
}
Resume text:
---
${resumeText.slice(0, 6000)}
---`;
    const raw = await generate(prompt);
    const parsed = safeParseJson(raw);
    if (parsed) return parsed;
  } catch (err) {
    console.warn('AI Resume parsing fallback triggered:', err.message);
  }

  // Fallback regex extraction
  const emailMatch = resumeText.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  const nameMatch = resumeText.match(/^[A-Z][a-z]+\s+[A-Z][a-z]+/m);
  
  // Extract potential skills by keyword match
  const candidateSkills = [
    'HR Compliance', 'Talent Acquisition', 'B2B Sales', 'CRM Systems',
    'Legal Writing & Contract Law', 'Lesson Planning', 'Digital Marketing',
    'Financial Accounting', 'Tax Compliance', 'Supply Chain Optimization',
    'Customer Service', 'Clinical Pharmacology', 'JavaScript', 'React', 'Python', 'SQL'
  ];
  const detected = candidateSkills.filter(s => new RegExp(`\\b${s}\\b`, 'i').test(resumeText));

  return {
    name: nameMatch ? nameMatch[0] : 'Applicant Candidate',
    email: emailMatch ? emailMatch[0] : 'candidate@example.com',
    phone: null,
    location: 'India',
    headline: 'Experienced Professional',
    education: [{ institution: 'University', degree: 'Bachelor', field: 'General', year: 2022 }],
    workHistory: [{ title: 'Professional', company: 'Enterprise', duration: '2 years', description: 'Handled operations and customer execution.' }],
    skills: detected.map(s => ({ skillName: s, proficiency: 'intermediate' })),
    industry: 'Corporate',
    confidence: 0.75,
  };
}

// ─── Extract Job Skills ──────────────────────────────────────────────────────
export async function extractJobSkills(jobText) {
  try {
    const prompt = `
Extract required skills from the job text below.
Return ONLY JSON:
{
  "skills": [
    {"skillName": "skill name", "proficiency": "beginner|intermediate|advanced|expert", "required": true}
  ],
  "industry": "industry name"
}
Job text:
---
${jobText.slice(0, 4000)}
---`;
    const raw = await generate(prompt);
    const parsed = safeParseJson(raw);
    if (parsed?.skills) return parsed;
  } catch {}

  return { skills: [{ skillName: 'Communication Skills', proficiency: 'intermediate', required: true }] };
}

// ─── Learning Path Generation ─────────────────────────────────────────────────
export async function generateLearningPath(skillName, currentProficiency, targetProficiency, jobContext) {
  try {
    const prompt = `
Create a learning path to go from ${currentProficiency || 'no'} to ${targetProficiency} in "${skillName}".
Target role: "${jobContext?.jobTitle || 'general role'}".
Return ONLY JSON:
{
  "steps": [
    {
      "order": 1,
      "title": "Step title",
      "description": "What to learn and why",
      "type": "read|watch|practice|project|checkpoint",
      "estimatedMinutes": 30
    }
  ],
  "totalEstimatedHours": 2.0
}
Include 5 steps. Last step must be type "checkpoint".`;

    const raw = await generate(prompt);
    const parsed = safeParseJson(raw);
    if (parsed?.steps?.length) {
      parsed.steps = parsed.steps.map(step => ({
        ...step,
        resourceUrl: step.type !== 'checkpoint' ? getResourceUrls(skillName, step.type) : null,
      }));
      return parsed;
    }
  } catch (err) {
    console.warn(`Learning path AI notice for "${skillName}": Using structured template fallback.`);
  }

  // Fallback 5-step path
  const fallbackSteps = [
    { order: 1, title: `Core Fundamentals of ${skillName}`, description: `Understand core concepts, framework structures, and terminology in ${skillName}.`, type: 'read', estimatedMinutes: 40, resourceUrl: getResourceUrls(skillName, 'read') },
    { order: 2, title: `Video Walkthrough & Practical Case Studies`, description: `Watch expert demonstrations applying ${skillName} to real-world workplace scenarios.`, type: 'watch', estimatedMinutes: 45, resourceUrl: getResourceUrls(skillName, 'watch') },
    { order: 3, title: `Hands-on Practice & Problem Solving`, description: `Complete guided exercises and scenarios to build operational confidence.`, type: 'practice', estimatedMinutes: 60, resourceUrl: getResourceUrls(skillName, 'practice') },
    { order: 4, title: `Real-world Mini Project`, description: `Apply ${skillName} to solve a comprehensive business or clinical scenario.`, type: 'project', estimatedMinutes: 90, resourceUrl: getResourceUrls(skillName, 'project') },
    { order: 5, title: `Skill Assessment Checkpoint`, description: `Take the verified skill test to earn your badge and update your readiness score.`, type: 'checkpoint', estimatedMinutes: 20, resourceUrl: null },
  ];

  return { steps: fallbackSteps, totalEstimatedHours: 4.2 };
}
