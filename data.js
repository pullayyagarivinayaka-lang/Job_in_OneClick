/* ============================================================
   Job in One Click — Sample Data
   All data below is illustrative/demo data, not live listings.
   ============================================================ */

const CITIES = [
  { name: "Hyderabad", lat: 17.3850, lng: 78.4867 },
  { name: "Bengaluru", lat: 12.9716, lng: 77.5946 },
  { name: "Mumbai", lat: 19.0760, lng: 72.8777 },
  { name: "Pune", lat: 18.5204, lng: 73.8567 },
  { name: "Delhi NCR", lat: 28.6139, lng: 77.2090 },
  { name: "Chennai", lat: 13.0827, lng: 80.2707 },
  { name: "Kolkata", lat: 22.5726, lng: 88.3639 },
  { name: "Ahmedabad", lat: 23.0225, lng: 72.5714 },
  { name: "Kochi", lat: 9.9312, lng: 76.2673 },
  { name: "Chandigarh", lat: 30.7333, lng: 76.7794 },
  { name: "Remote / Anywhere", lat: null, lng: null }
];

const CATEGORIES = [
  "Internships", "Fresher", "Undergraduate", "Graduate", "Part-time",
  "Full-time", "Remote", "IT/Software", "Data Science", "Analytics",
  "Finance", "Marketing", "Design", "Customer Support", "Government Jobs"
];

const EDUCATION_LEVELS = ["Any", "12th Pass", "Diploma", "Undergraduate", "Postgraduate", "Doctorate"];

const JOB_TYPES = ["Full-time", "Part-time", "Internship", "Contract"];
const WORK_MODES = ["Remote", "On-site", "Hybrid"];

function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}
function daysFromNow(n) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

/* applyType: 'internal' -> One-Click Apply submits within the app using saved profile
   applyType: 'external' -> redirects to the official company/govt portal (no auto-submit claim) */

const JOBS = [
  {
    id: "j1", title: "Software Engineer Intern", company: "Zenwave Technologies",
    city: "Hyderabad", categories: ["Internships", "IT/Software", "Undergraduate"],
    jobType: "Internship", workMode: "Hybrid", salaryMin: 15000, salaryMax: 25000, salaryUnit: "month",
    expMin: 0, expMax: 0, education: "Undergraduate",
    skills: ["JavaScript", "React", "Git", "Problem Solving"],
    posted: daysAgo(2), deadline: daysFromNow(20),
    description: "Work with our product engineering team building customer-facing web features. Great for students in their pre-final or final year looking for hands-on experience with modern web stacks.",
    eligibility: "Open to students from any college, anywhere in the country.",
    applyType: "internal", logo: "ZW"
  },
  {
    id: "j2", title: "Graduate Trainee — Data Analytics", company: "Nimbus Analytics",
    city: "Bengaluru", categories: ["Fresher", "Graduate", "Data Science", "Analytics"],
    jobType: "Full-time", workMode: "On-site", salaryMin: 450000, salaryMax: 600000, salaryUnit: "year",
    expMin: 0, expMax: 1, education: "Undergraduate",
    skills: ["SQL", "Python", "Excel", "Statistics"],
    posted: daysAgo(1), deadline: daysFromNow(25),
    description: "A structured 6-month training program for fresh graduates, followed by a full-time analyst role. You'll learn dashboarding, data pipelines and stakeholder reporting.",
    eligibility: "Open to 2025/2026 graduates from any city in India.",
    applyType: "internal", logo: "NA"
  },
  {
    id: "j3", title: "Frontend Developer", company: "Flipmart Commerce",
    city: "Mumbai", categories: ["IT/Software", "Full-time", "Graduate"],
    jobType: "Full-time", workMode: "Hybrid", salaryMin: 800000, salaryMax: 1400000, salaryUnit: "year",
    expMin: 1, expMax: 3, education: "Undergraduate",
    skills: ["React", "TypeScript", "CSS", "REST APIs"],
    posted: daysAgo(4), deadline: daysFromNow(15),
    description: "Build and ship consumer-facing shopping experiences used by millions. You'll partner closely with design and backend teams.",
    eligibility: "Open nationwide; relocation assistance available.",
    applyType: "external", applyUrl: "https://www.linkedin.com/jobs/", logo: "FM"
  },
  {
    id: "j4", title: "Part-time Content Writer", company: "InkWell Media",
    city: "Remote / Anywhere", categories: ["Part-time", "Remote", "Marketing", "Undergraduate"],
    jobType: "Part-time", workMode: "Remote", salaryMin: 8000, salaryMax: 15000, salaryUnit: "month",
    expMin: 0, expMax: 1, education: "12th Pass",
    skills: ["Writing", "SEO Basics", "Research"],
    posted: daysAgo(3), deadline: daysFromNow(10),
    description: "Write blog posts and product copy for a fast-growing D2C brand. Flexible hours, fully remote — great alongside college.",
    eligibility: "Applicants can apply from anywhere; fully remote role.",
    applyType: "internal", logo: "IW"
  },
  {
    id: "j5", title: "Junior Financial Analyst", company: "Suvidha Capital",
    city: "Delhi NCR", categories: ["Finance", "Fresher", "Graduate"],
    jobType: "Full-time", workMode: "On-site", salaryMin: 500000, salaryMax: 700000, salaryUnit: "year",
    expMin: 0, expMax: 2, education: "Postgraduate",
    skills: ["Financial Modelling", "Excel", "Valuation"],
    posted: daysAgo(6), deadline: daysFromNow(12),
    description: "Support the investment research team with company financials, sector notes and valuation models.",
    eligibility: "MBA/M.Com/CA-Inter candidates from any institute.",
    applyType: "external", applyUrl: "https://www.naukri.com/", logo: "SC"
  },
  {
    id: "j6", title: "UI/UX Design Intern", company: "Studio Aster",
    city: "Pune", categories: ["Internships", "Design", "Undergraduate"],
    jobType: "Internship", workMode: "Hybrid", salaryMin: 10000, salaryMax: 18000, salaryUnit: "month",
    expMin: 0, expMax: 0, education: "Undergraduate",
    skills: ["Figma", "Wireframing", "User Research"],
    posted: daysAgo(5), deadline: daysFromNow(18),
    description: "Assist senior designers on mobile app redesigns for fintech clients. Portfolio review required.",
    eligibility: "Design/HCI/any-discipline students, any city.",
    applyType: "internal", logo: "SA"
  },
  {
    id: "j7", title: "Customer Support Associate", company: "HelpDesk360",
    city: "Chennai", categories: ["Customer Support", "Fresher", "Full-time"],
    jobType: "Full-time", workMode: "On-site", salaryMin: 220000, salaryMax: 320000, salaryUnit: "year",
    expMin: 0, expMax: 1, education: "12th Pass",
    skills: ["Communication", "Ticketing Tools", "Patience"],
    posted: daysAgo(2), deadline: daysFromNow(22),
    description: "Handle inbound customer queries via chat and voice for an e-commerce platform. Training provided.",
    eligibility: "12th pass or above, from any state.",
    applyType: "internal", logo: "HD"
  },
  {
    id: "j8", title: "Data Scientist II", company: "Vector Intelligence",
    city: "Bengaluru", categories: ["Data Science", "Analytics", "IT/Software", "Full-time"],
    jobType: "Full-time", workMode: "Remote", salaryMin: 1600000, salaryMax: 2400000, salaryUnit: "year",
    expMin: 3, expMax: 6, education: "Postgraduate",
    skills: ["Python", "Machine Learning", "MLOps", "SQL"],
    posted: daysAgo(1), deadline: daysFromNow(30),
    description: "Own the lifecycle of ML models used in fraud detection — from experimentation to production monitoring.",
    eligibility: "Fully remote, open to candidates anywhere in India.",
    applyType: "external", applyUrl: "https://www.linkedin.com/jobs/", logo: "VI"
  },
  {
    id: "j9", title: "SSC CGL — Tax Assistant", company: "Govt. of India — SSC",
    city: "Delhi NCR", categories: ["Government Jobs", "Graduate", "Fresher"],
    jobType: "Full-time", workMode: "On-site", salaryMin: 350000, salaryMax: 450000, salaryUnit: "year",
    expMin: 0, expMax: 0, education: "Undergraduate",
    skills: ["General Awareness", "Quantitative Aptitude", "Reasoning"],
    posted: daysAgo(10), deadline: daysFromNow(35),
    description: "Recruitment for Tax Assistant posts under the Combined Graduate Level exam. Includes tier I/II exams and document verification.",
    eligibility: "Indian citizens, graduates, age limit as per SSC norms — apply from anywhere.",
    applyType: "external", applyUrl: "https://ssc.nic.in/", logo: "GI"
  },
  {
    id: "j10", title: "Digital Marketing Executive", company: "Brandloom",
    city: "Ahmedabad", categories: ["Marketing", "Fresher", "Full-time"],
    jobType: "Full-time", workMode: "Hybrid", salaryMin: 300000, salaryMax: 450000, salaryUnit: "year",
    expMin: 0, expMax: 2, education: "Undergraduate",
    skills: ["SEO", "Google Ads", "Social Media", "Analytics"],
    posted: daysAgo(3), deadline: daysFromNow(14),
    description: "Plan and run performance campaigns for D2C clients across search and social platforms.",
    eligibility: "Any graduate, from any city.",
    applyType: "internal", logo: "BL"
  },
  {
    id: "j11", title: "Backend Engineer (Node.js)", company: "Coreloop Systems",
    city: "Hyderabad", categories: ["IT/Software", "Full-time", "Graduate"],
    jobType: "Full-time", workMode: "On-site", salaryMin: 900000, salaryMax: 1600000, salaryUnit: "year",
    expMin: 2, expMax: 5, education: "Undergraduate",
    skills: ["Node.js", "PostgreSQL", "Docker", "System Design"],
    posted: daysAgo(7), deadline: daysFromNow(9),
    description: "Design and scale backend services powering our logistics platform used across 200+ cities.",
    eligibility: "Open nationwide; on-site role with relocation support.",
    applyType: "external", applyUrl: "https://www.indeed.com/", logo: "CL"
  },
  {
    id: "j12", title: "Business Analyst Intern", company: "MetricEdge Consulting",
    city: "Mumbai", categories: ["Internships", "Analytics", "Undergraduate", "Finance"],
    jobType: "Internship", workMode: "Remote", salaryMin: 12000, salaryMax: 20000, salaryUnit: "month",
    expMin: 0, expMax: 0, education: "Undergraduate",
    skills: ["Excel", "PowerPoint", "Analytical Thinking"],
    posted: daysAgo(2), deadline: daysFromNow(16),
    description: "Support consulting engagements with data gathering, market research and client-ready decks.",
    eligibility: "Remote internship, open to students anywhere.",
    applyType: "internal", logo: "ME"
  },
  {
    id: "j13", title: "Graphic Designer", company: "Studio Aster",
    city: "Pune", categories: ["Design", "Full-time", "Fresher"],
    jobType: "Full-time", workMode: "Hybrid", salaryMin: 350000, salaryMax: 550000, salaryUnit: "year",
    expMin: 0, expMax: 2, education: "Undergraduate",
    skills: ["Illustrator", "Photoshop", "Branding"],
    posted: daysAgo(9), deadline: daysFromNow(6),
    description: "Create brand assets, packaging and social creatives for a growing portfolio of consumer brands.",
    eligibility: "Any design background, any city — portfolio required.",
    applyType: "internal", logo: "SA"
  },
  {
    id: "j14", title: "Part-time Data Entry Operator", company: "RecordKeep Pvt Ltd",
    city: "Kolkata", categories: ["Part-time", "Undergraduate", "Fresher"],
    jobType: "Part-time", workMode: "Remote", salaryMin: 6000, salaryMax: 10000, salaryUnit: "month",
    expMin: 0, expMax: 0, education: "12th Pass",
    skills: ["Typing Speed", "MS Excel", "Attention to Detail"],
    posted: daysAgo(1), deadline: daysFromNow(25),
    description: "Digitize and validate scanned records for a document management client. Flexible hours.",
    eligibility: "Fully remote — apply from anywhere in India.",
    applyType: "internal", logo: "RK"
  },
  {
    id: "j15", title: "Machine Learning Intern", company: "Vector Intelligence",
    city: "Bengaluru", categories: ["Internships", "Data Science", "IT/Software"],
    jobType: "Internship", workMode: "Remote", salaryMin: 20000, salaryMax: 30000, salaryUnit: "month",
    expMin: 0, expMax: 0, education: "Undergraduate",
    skills: ["Python", "NumPy", "Pandas", "ML Basics"],
    posted: daysAgo(4), deadline: daysFromNow(20),
    description: "Contribute to model experimentation notebooks and help build evaluation pipelines under mentorship.",
    eligibility: "Final-year students, remote — apply from anywhere.",
    applyType: "internal", logo: "VI"
  },
  {
    id: "j16", title: "Bank PO (Probationary Officer)", company: "Govt. Sector Bank",
    city: "Chandigarh", categories: ["Government Jobs", "Graduate", "Fresher", "Finance"],
    jobType: "Full-time", workMode: "On-site", salaryMin: 480000, salaryMax: 600000, salaryUnit: "year",
    expMin: 0, expMax: 0, education: "Undergraduate",
    skills: ["Reasoning", "Quantitative Aptitude", "Banking Awareness"],
    posted: daysAgo(12), deadline: daysFromNow(40),
    description: "IBPS-pattern recruitment for Probationary Officers across public sector bank branches nationwide.",
    eligibility: "Any graduate, age 20–30, apply from anywhere in India.",
    applyType: "external", applyUrl: "https://www.ibps.in/", logo: "GB"
  },
  {
    id: "j17", title: "SEO & Content Intern", company: "InkWell Media",
    city: "Remote / Anywhere", categories: ["Internships", "Marketing", "Remote", "Undergraduate"],
    jobType: "Internship", workMode: "Remote", salaryMin: 8000, salaryMax: 12000, salaryUnit: "month",
    expMin: 0, expMax: 0, education: "12th Pass",
    skills: ["SEO Basics", "Content Writing", "Keyword Research"],
    posted: daysAgo(3), deadline: daysFromNow(21),
    description: "Research keywords, optimize existing articles, and assist with editorial calendars.",
    eligibility: "Remote — open to students and freshers from anywhere.",
    applyType: "internal", logo: "IW"
  },
  {
    id: "j18", title: "Full Stack Developer", company: "Coreloop Systems",
    city: "Hyderabad", categories: ["IT/Software", "Full-time", "Graduate"],
    jobType: "Full-time", workMode: "Hybrid", salaryMin: 1000000, salaryMax: 1800000, salaryUnit: "year",
    expMin: 2, expMax: 6, education: "Undergraduate",
    skills: ["React", "Node.js", "MongoDB", "AWS"],
    posted: daysAgo(0), deadline: daysFromNow(28),
    description: "Own features end-to-end across our web app, from database schema to polished UI.",
    eligibility: "Open nationwide, hybrid role with 2 office days/week.",
    applyType: "internal", logo: "CL"
  },
  {
    id: "j19", title: "HR & Recruitment Intern", company: "Nimbus Analytics",
    city: "Bengaluru", categories: ["Internships", "Undergraduate"],
    jobType: "Internship", workMode: "On-site", salaryMin: 10000, salaryMax: 15000, salaryUnit: "month",
    expMin: 0, expMax: 0, education: "Undergraduate",
    skills: ["Communication", "Screening", "MS Office"],
    posted: daysAgo(6), deadline: daysFromNow(11),
    description: "Support campus hiring drives, resume screening and interview scheduling.",
    eligibility: "Students from any stream, any college.",
    applyType: "internal", logo: "NA"
  },
  {
    id: "j20", title: "Investment Banking Analyst", company: "Suvidha Capital",
    city: "Mumbai", categories: ["Finance", "Graduate", "Full-time"],
    jobType: "Full-time", workMode: "On-site", salaryMin: 1200000, salaryMax: 2000000, salaryUnit: "year",
    expMin: 1, expMax: 3, education: "Postgraduate",
    skills: ["Valuation", "Excel Modelling", "Pitch Decks"],
    posted: daysAgo(8), deadline: daysFromNow(5),
    description: "Support deal teams on M&A and capital markets transactions across sectors.",
    eligibility: "MBA/CA/CFA candidates, open nationwide.",
    applyType: "external", applyUrl: "https://www.naukri.com/", logo: "SC"
  },
  {
    id: "j21", title: "Technical Support Executive", company: "HelpDesk360",
    city: "Kochi", categories: ["Customer Support", "IT/Software", "Fresher"],
    jobType: "Full-time", workMode: "Hybrid", salaryMin: 280000, salaryMax: 380000, salaryUnit: "year",
    expMin: 0, expMax: 2, education: "Undergraduate",
    skills: ["Troubleshooting", "Networking Basics", "Communication"],
    posted: daysAgo(5), deadline: daysFromNow(19),
    description: "Resolve tier-1/2 technical issues for SaaS customers via chat, email and calls.",
    eligibility: "Any graduate, any city — training provided.",
    applyType: "internal", logo: "HD"
  },
  {
    id: "j22", title: "Data Analyst — Remote", company: "Vector Intelligence",
    city: "Remote / Anywhere", categories: ["Data Science", "Analytics", "Remote", "Fresher"],
    jobType: "Full-time", workMode: "Remote", salaryMin: 500000, salaryMax: 750000, salaryUnit: "year",
    expMin: 0, expMax: 2, education: "Undergraduate",
    skills: ["SQL", "Python", "Tableau", "Data Cleaning"],
    posted: daysAgo(1), deadline: daysFromNow(26),
    description: "Turn raw product data into dashboards and insights used by cross-functional teams.",
    eligibility: "Fully remote — apply from anywhere in the country.",
    applyType: "internal", logo: "VI"
  },
  {
    id: "j23", title: "Railway Recruitment — Junior Clerk", company: "Govt. of India — Railways",
    city: "Chennai", categories: ["Government Jobs", "12th Pass".replace("12th Pass","Undergraduate"), "Fresher"],
    jobType: "Full-time", workMode: "On-site", salaryMin: 250000, salaryMax: 350000, salaryUnit: "year",
    expMin: 0, expMax: 0, education: "12th Pass",
    skills: ["General Knowledge", "Basic Computers", "Reasoning"],
    posted: daysAgo(15), deadline: daysFromNow(45),
    description: "Clerical and administrative recruitment across Indian Railways zonal offices.",
    eligibility: "12th pass, Indian citizen, apply from anywhere.",
    applyType: "external", applyUrl: "https://www.rrbcdg.gov.in/", logo: "GR"
  },
  {
    id: "j24", title: "Product Design Intern", company: "Zenwave Technologies",
    city: "Hyderabad", categories: ["Internships", "Design", "Undergraduate"],
    jobType: "Internship", workMode: "Remote", salaryMin: 12000, salaryMax: 18000, salaryUnit: "month",
    expMin: 0, expMax: 0, education: "Undergraduate",
    skills: ["Figma", "Prototyping", "Design Systems"],
    posted: daysAgo(2), deadline: daysFromNow(17),
    description: "Help evolve our design system and prototype new product flows with the design team.",
    eligibility: "Remote — open to students anywhere in India.",
    applyType: "internal", logo: "ZW"
  }
];

// attach lat/lng to jobs from city list for distance calc
JOBS.forEach(j => {
  const c = CITIES.find(c => c.name === j.city);
  j.lat = c ? c.lat : null;
  j.lng = c ? c.lng : null;
});
