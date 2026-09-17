/* ============================================================
   Job in One Click — App Logic
   Vanilla JS SPA. Accounts, profiles, saved jobs and applications
   persist in this browser via localStorage (per-device, demo-grade
   auth — not a real backend). Job listings themselves are static
   sample data in data.js.
   ============================================================ */

const STORE_KEY = "jobInOneClick_store_v1";

const state = {
  user: null,            // {name, email} — the signed-in session
  profile: null,         // profile/resume object for the signed-in user
  users: [],             // registered accounts: {name, email, passHash, verified, createdAt}
  savedJobIds: new Set(),
  applications: [],      // {jobId, status, appliedDate, jobApplyType, lastUpdated}
  userLocation: null,    // {lat, lng, label}
  darkMode: false,
  filters: defaultFilters(),
  route: "#/home",
  toastTimer: null
};

function defaultFilters() {
  return {
    keyword: "", city: "", radiusKm: 2000, salaryMin: 0, salaryMax: 3000000,
    education: "Any", expMax: 15, jobTypes: [], workModes: [], categories: [], company: "",
    sort: "relevance"
  };
}

/* ---------------- Persistence (per-browser demo "database") ---------------- */
// NOT real security — a lightweight non-cryptographic hash just so passwords
// aren't stored as plain text in this demo. Do not reuse this pattern in production.
function demoHash(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) { h = (h * 31 + str.charCodeAt(i)) | 0; }
  return "d" + Math.abs(h).toString(36) + "_" + btoa(unescape(encodeURIComponent(str))).slice(0, 12);
}
function loadStore() {
  try { return JSON.parse(localStorage.getItem(STORE_KEY)) || {}; }
  catch (e) { return {}; }
}
function saveStore(store) {
  try { localStorage.setItem(STORE_KEY, JSON.stringify(store)); return true; }
  catch (e) { return false; }
}
function persist() {
  const store = loadStore();
  store.users = state.users;
  store.darkMode = state.darkMode;
  store.location = state.userLocation;
  store.sessionEmail = state.user ? state.user.email : null;
  if (state.user) {
    store.profiles = store.profiles || {};
    store.profiles[state.user.email] = state.profile;
    store.saved = store.saved || {};
    store.saved[state.user.email] = Array.from(state.savedJobIds);
    store.applications = store.applications || {};
    store.applications[state.user.email] = state.applications;
  }
  saveStore(store);
}
function hydrateFromStore() {
  const store = loadStore();
  state.users = store.users || [];
  state.darkMode = !!store.darkMode;
  state.userLocation = store.location || null;
  if (store.sessionEmail) {
    const u = state.users.find(u => u.email === store.sessionEmail);
    if (u) {
      state.user = { name: u.name, email: u.email };
      state.profile = (store.profiles || {})[u.email] || { name: u.name, email: u.email, skills: [], preferredCategories: [] };
      state.savedJobIds = new Set((store.saved || {})[u.email] || []);
      state.applications = (store.applications || {})[u.email] || [];
    }
  }
}

/* ---------------- Utilities ---------------- */
function haversine(lat1, lng1, lat2, lng2) {
  if ([lat1, lng1, lat2, lng2].some(v => v === null || v === undefined)) return null;
  const R = 6371, toRad = d => d * Math.PI / 180;
  const dLat = toRad(lat2 - lat1), dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat/2)**2 + Math.cos(toRad(lat1))*Math.cos(toRad(lat2))*Math.sin(dLng/2)**2;
  return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)));
}
function fmtSalary(min, max, unit) {
  const f = n => n >= 100000 ? (n/100000).toFixed(n % 100000 === 0 ? 0 : 1) + "L" : (n/1000) + "k";
  if (unit === "year") return `₹${f(min)} - ₹${f(max)} / yr`;
  return `₹${(min/1000)}k - ₹${(max/1000)}k / mo`;
}
function fmtDate(iso) {
  return new Date(iso + "T00:00:00").toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}
function daysUntil(iso) {
  const d1 = new Date(iso + "T00:00:00"), d0 = new Date();
  d0.setHours(0,0,0,0);
  return Math.round((d1 - d0) / 86400000);
}
function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
}
function el(id) { return document.getElementById(id); }
function qs(sel, root) { return (root||document).querySelector(sel); }
function qsa(sel, root) { return Array.from((root||document).querySelectorAll(sel)); }

/* ---------------- Toast ---------------- */
function toast(msg, icon) {
  const wrap = el("toastWrap");
  const t = document.createElement("div");
  t.className = "toast";
  t.innerHTML = `<span>${icon || "✓"}</span><span>${escapeHtml(msg)}</span>`;
  wrap.appendChild(t);
  setTimeout(() => t.remove(), 3600);
}

/* ---------------- Matching algorithm ---------------- */
function matchScore(job, profile) {
  if (!profile) return null;
  let score = 0, total = 0;
  // skills overlap (weight 45)
  total += 45;
  const pSkills = (profile.skills || []).map(s => s.toLowerCase());
  const jSkills = (job.skills || []).map(s => s.toLowerCase());
  if (jSkills.length) {
    const overlap = jSkills.filter(s => pSkills.includes(s)).length;
    score += 45 * (overlap / jSkills.length);
  } else { score += 30; }
  // category / interest overlap (weight 20)
  total += 20;
  const pCats = (profile.preferredCategories || []);
  const catOverlap = job.categories.filter(c => pCats.includes(c)).length;
  score += 20 * Math.min(1, catOverlap / 1);
  // experience fit (weight 20)
  total += 20;
  const exp = Number(profile.experienceYears || 0);
  if (exp >= job.expMin && exp <= job.expMax + 2) score += 20;
  else if (Math.abs(exp - job.expMin) <= 2) score += 10;
  // education fit (weight 15)
  total += 15;
  const eduOrder = ["12th Pass","Diploma","Undergraduate","Postgraduate","Doctorate"];
  const pIdx = eduOrder.indexOf(profile.education);
  const jIdx = eduOrder.indexOf(job.education);
  if (job.education === "Any" || pIdx === jIdx) score += 15;
  else if (pIdx > jIdx) score += 12;
  else if (pIdx >= 0 && jIdx >= 0 && Math.abs(pIdx - jIdx) === 1) score += 6;
  return Math.round(Math.min(100, (score / total) * 100));
}

/* ---------------- Distance for a job ---------------- */
function jobDistance(job) {
  if (!state.userLocation || state.userLocation.lat === null) return null;
  return haversine(state.userLocation.lat, state.userLocation.lng, job.lat, job.lng);
}
// Honest fallback: for demo employers we don't have (or fabricate) a real careers-page
// URL, so this optional link runs a live web search instead of pretending to know one.
function officialSearchUrl(job) {
  return "https://www.google.com/search?q=" + encodeURIComponent(job.company + " " + job.title + " careers apply");
}

/* ---------------- Filtering / sorting ---------------- */
function getFilteredJobs() {
  const f = state.filters;
  let list = JOBS.filter(j => {
    if (f.keyword) {
      const hay = (j.title + " " + j.company + " " + j.skills.join(" ")).toLowerCase();
      if (!hay.includes(f.keyword.toLowerCase())) return false;
    }
    if (f.company && !j.company.toLowerCase().includes(f.company.toLowerCase())) return false;
    if (f.education !== "Any" && j.education !== "Any" && j.education !== f.education) return false;
    if (j.expMin > f.expMax) return false;
    if (j.salaryMax < f.salaryMin || j.salaryMin > f.salaryMax) return false;
    if (f.jobTypes.length && !f.jobTypes.includes(j.jobType)) return false;
    if (f.workModes.length && !f.workModes.includes(j.workMode)) return false;
    if (f.categories.length && !f.categories.some(c => j.categories.includes(c))) return false;
    const dist = jobDistance(j);
    if (state.userLocation && state.userLocation.lat !== null && dist !== null && dist > f.radiusKm) return false;
    return true;
  });
  list = list.map(j => ({ job: j, dist: jobDistance(j), match: matchScore(j, state.profile) }));
  switch (f.sort) {
    case "distance": list.sort((a,b) => (a.dist ?? 1e9) - (b.dist ?? 1e9)); break;
    case "salary": list.sort((a,b) => b.job.salaryMax - a.job.salaryMax); break;
    case "date": list.sort((a,b) => new Date(b.job.posted) - new Date(a.job.posted)); break;
    default: list.sort((a,b) => (b.match ?? 0) - (a.match ?? 0));
  }
  return list;
}

/* ---------------- Templates ---------------- */
function matchClass(m) {
  if (m === null) return "match-low";
  if (m >= 70) return "match-high";
  if (m >= 45) return "match-mid";
  return "match-low";
}
function jobCardHtml({job, dist, match}) {
  const saved = state.savedJobIds.has(job.id);
  const dLeft = daysUntil(job.deadline);
  return `
  <article class="job-card" data-job="${job.id}">
    <div class="job-card-top">
      <div class="job-logo">${job.logo}</div>
      <div class="job-title-wrap">
        <h3><a href="#/job/${job.id}">${escapeHtml(job.title)}</a></h3>
        <div class="company">${escapeHtml(job.company)} · ${escapeHtml(job.city)}</div>
      </div>
      ${match !== null ? `<span class="match-badge ${matchClass(match)}">${match}% match</span>` : ""}
    </div>
    <div class="meta-row">
      <span class="meta-item">💰 ${fmtSalary(job.salaryMin, job.salaryMax, job.salaryUnit)}</span>
      <span class="meta-item">🎓 ${escapeHtml(job.education)}</span>
      <span class="meta-item">🧭 ${job.expMin}-${job.expMax === 0 ? 0 : job.expMax}+ yrs</span>
      ${dist !== null ? `<span class="meta-item">📍 ${dist} km away</span>` : `<span class="meta-item">📍 ${escapeHtml(job.city)}</span>`}
      <span class="meta-item">🗓 Posted ${fmtDate(job.posted)}</span>
    </div>
    <div class="tag-row">
      <span class="tag blue">${escapeHtml(job.jobType)}</span>
      <span class="tag blue">${escapeHtml(job.workMode)}</span>
      ${job.categories.slice(0,3).map(c => `<span class="tag">${escapeHtml(c)}</span>`).join("")}
    </div>
    <div class="job-card-footer">
      <span class="deadline-note">${dLeft >= 0 ? `Apply within ${dLeft} day${dLeft===1?"":"s"}` : "Deadline passed"}</span>
      <div class="card-actions">
        <button class="icon-btn ${saved ? "active" : ""}" title="Save job" data-action="save" data-id="${job.id}" aria-pressed="${saved}">${saved ? "★" : "☆"}</button>
        <a class="btn btn-outline btn-sm" href="#/job/${job.id}">Details</a>
        <button class="btn btn-primary btn-sm" data-action="apply" data-id="${job.id}">Apply Now</button>
      </div>
    </div>
  </article>`;
}

/* ---------------- Header / Nav ---------------- */
const NAV_LINKS = [
  { href: "#/dashboard", label: "Dashboard", icon: "🏠", auth: true },
  { href: "#/jobs", label: "Jobs", icon: "🔎", auth: false },
  { href: "#/saved", label: "Saved", icon: "★", auth: true },
  { href: "#/applications", label: "Applications", icon: "📄", auth: true },
  { href: "#/profile", label: "Profile", icon: "👤", auth: true }
];

function renderHeader() {
  const route = state.route;
  const links = NAV_LINKS.filter(l => !l.auth || state.user);
  el("mainNav").innerHTML = links.map(l =>
    `<a href="${l.href}" class="${route.startsWith(l.href) ? "active" : ""}">${escapeHtml(l.label)}</a>`
  ).join("");
  el("mobileNav").innerHTML = links.concat(state.user ? [] : [{href:"#/login", label:"Login", icon:"🔑"}]).map(l =>
    `<a href="${l.href}" class="${route.startsWith(l.href) ? "active" : ""}"><span aria-hidden="true">${l.icon}</span>${escapeHtml(l.label)}</a>`
  ).join("");

  const locChip = el("locationChip");
  if (state.userLocation) {
    locChip.classList.remove("hidden");
    locChip.innerHTML = `<span aria-hidden="true">📍</span><span>${escapeHtml(state.userLocation.label)}</span>`;
  } else {
    locChip.classList.remove("hidden");
    locChip.innerHTML = `<span aria-hidden="true">📍</span><span>Set location</span>`;
  }

  const authArea = el("headerAuthArea");
  if (state.user) {
    const initials = state.profile?.name ? state.profile.name.split(" ").map(w=>w[0]).slice(0,2).join("").toUpperCase() : "U";
    const u = state.users.find(u => u.email === state.user.email);
    authArea.innerHTML = `<a href="#/settings" class="avatar" title="${u?.verified ? "Verified account" : "Account"} — Settings">${initials}${u?.verified ? '<span aria-hidden="true" style="margin-left:1px">✓</span>' : ""}</a>`;
  } else {
    authArea.innerHTML = `<a href="#/login" class="btn btn-outline btn-sm">Log in</a><a href="#/register" class="btn btn-primary btn-sm">Get started</a>`;
  }
}

/* ---------------- Pages ---------------- */
function pageHome() {
  return `
  <section class="hero">
    <div class="container">
      <div>
        <div class="hero-eyebrow">JOB IN ONE CLICK</div>
        <h1>Find the right job. Near you. Apply in one click.</h1>
        <p class="lead">Build your profile once. We match you to internships, fresher roles, and experienced openings near your location — and apply instantly with your saved resume.</p>
        <div class="hero-cta">
          <a href="#/register" class="btn btn-primary">Create your free profile</a>
          <a href="#/jobs" class="btn btn-outline">Browse jobs</a>
        </div>
        <div class="hero-search">
          <div class="row">
            <input class="input" id="heroKeyword" placeholder="Job title, company or skill" aria-label="Keyword search">
            <select class="input" id="heroCity" aria-label="City">
              <option value="">Use my location</option>
              ${CITIES.map(c => `<option value="${escapeHtml(c.name)}">${escapeHtml(c.name)}</option>`).join("")}
            </select>
            <button class="btn btn-primary" id="heroSearchBtn">Search jobs</button>
          </div>
        </div>
        <div class="hero-stats">
          <div class="hero-stat"><b>${JOBS.length}+</b><span>Live sample openings</span></div>
          <div class="hero-stat"><b>15</b><span>Job categories</span></div>
          <div class="hero-stat"><b>1-click</b><span>Apply with saved resume</span></div>
        </div>
      </div>
      <div class="hero-visual" aria-hidden="true">
        <div class="mock-card">
          <div class="mock-row"><strong style="font-size:14px">Frontend Developer</strong><span class="match-pill">92% match</span></div>
          <div class="muted small">Flipmart Commerce · Mumbai · 2.3 km away</div>
        </div>
        <div class="mock-card">
          <div class="mock-row"><strong style="font-size:14px">Data Scientist II</strong><span class="match-pill">85% match</span></div>
          <div class="muted small">Vector Intelligence · Remote</div>
        </div>
        <div class="mock-card">
          <div class="mock-row"><strong style="font-size:14px">SEO &amp; Content Intern</strong><span class="match-pill">78% match</span></div>
          <div class="muted small">InkWell Media · Remote / Anywhere</div>
        </div>
      </div>
    </div>
  </section>

  <section class="page container">
    <div class="section-head"><h2>Browse by category</h2></div>
    <div class="category-chip-grid">
      ${CATEGORIES.map(c => `<a class="category-chip" href="#/jobs?cat=${encodeURIComponent(c)}">${escapeHtml(c)}</a>`).join("")}
    </div>

    <div class="section-head mt-24"><h2>How it works</h2></div>
    <div class="steps">
      <div class="step"><div class="n">Step 1</div><h4>Create your profile</h4><p class="muted small">Add your education, skills and experience once, and upload your resume.</p></div>
      <div class="step"><div class="n">Step 2</div><h4>Get matched nearby</h4><p class="muted small">Share your location or pick a city — see distance and a match % on every job.</p></div>
      <div class="step"><div class="n">Step 3</div><h4>Filter what fits</h4><p class="muted small">Narrow by salary, experience, education, job type and category.</p></div>
      <div class="step"><div class="n">Step 4</div><h4>Apply in one click</h4><p class="muted small">We submit supported applications instantly, or take you to the official portal for others.</p></div>
    </div>

    <div class="section-head mt-24"><h2>Eligibility</h2></div>
    <div class="card card-pad">
      <p class="muted" style="margin:0">Candidates can apply from anywhere — there's no location restriction on applying. Location and distance are shown to help you plan commutes and prioritise nearby opportunities, not to limit who can apply. Remote, government, and many full-time roles on this platform explicitly welcome applicants from any city or state.</p>
    </div>
  </section>`;
}

function pageLogin(mode) {
  return `
  <div class="auth-wrap">
    <div class="auth-card card card-pad">
      <div class="auth-tabs">
        <button data-tab="login" class="${mode !== "register" ? "active" : ""}">Log in</button>
        <button data-tab="register" class="${mode === "register" ? "active" : ""}">Register</button>
      </div>
      <div id="authFormArea"></div>
      <div class="mt-16 text-center">
        <button class="btn btn-outline btn-block" id="guestBtn">Continue with demo profile</button>
      </div>
      <p class="small muted text-center mt-16" style="margin-bottom:0">Demo authentication — accounts are stored only in this browser session.</p>
    </div>
  </div>`;
}
function authFormHtml(mode) {
  if (mode === "register") {
    return `
    <form id="authForm" class="form-grid" novalidate>
      <div class="field"><label for="regName">Full name</label><input class="input" id="regName" required></div>
      <div class="field"><label for="regEmail">Email</label><input class="input" type="email" id="regEmail" required></div>
      <div class="field"><label for="regPass">Password</label><input class="input" type="password" id="regPass" minlength="6" required></div>
      <div class="field"><label for="regPass2">Confirm password</label><input class="input" type="password" id="regPass2" minlength="6" required></div>
      <button class="btn btn-primary btn-block" type="submit">Create account</button>
    </form>`;
  }
  return `
    <form id="authForm" class="form-grid" novalidate>
      <div class="field"><label for="loginEmail">Email</label><input class="input" type="email" id="loginEmail" required></div>
      <div class="field"><label for="loginPass">Password</label><input class="input" type="password" id="loginPass" required></div>
      <button class="btn btn-primary btn-block" type="submit">Log in</button>
    </form>`;
}

function pageDashboard() {
  const applied = state.applications.length;
  const saved = state.savedJobIds.size;
  const completion = profileCompleteness();
  const appliedIds = new Set(state.applications.map(a => a.jobId));
  const recs = getFilteredJobs()
    .filter(x => x.match !== null && !appliedIds.has(x.job.id))
    .sort((a,b)=>b.match-a.match).slice(0,4);
  return `
  <div class="page container">
    <div class="section-head"><h2>Welcome back${state.profile?.name ? ", " + escapeHtml(state.profile.name.split(" ")[0]) : ""}</h2></div>
    <div class="grid cols-3">
      <div class="stat-card"><div class="num">${applied}</div><div class="lbl">Applications sent</div></div>
      <div class="stat-card"><div class="num">${saved}</div><div class="lbl">Saved jobs</div></div>
      <div class="stat-card"><div class="num">${completion}%</div><div class="lbl">Profile completeness</div></div>
    </div>

    ${completion < 100 ? `
    <div class="card card-pad mt-16">
      <div class="flex justify-between items-center gap-12" style="flex-wrap:wrap">
        <div>
          <strong>Your profile is ${completion}% complete</strong>
          <p class="muted small" style="margin:4px 0 0">Complete your profile and upload a resume to unlock accurate match % and one-click apply.</p>
        </div>
        <a href="#/profile" class="btn btn-primary btn-sm">Complete profile</a>
      </div>
    </div>` : ""}

    <div class="section-head mt-24"><h2>Recommended for you</h2><a href="#/jobs" class="small">See all jobs →</a></div>
    <p class="small muted" style="margin-top:-8px">Updates automatically as you edit your profile, save jobs or apply — jobs you've already applied to are removed from this list.</p>
    <div class="grid">
      ${recs.length ? recs.map(jobCardHtml).join("") : `<div class="empty-state card"><div class="glyph">🧭</div>${appliedIds.size ? "You've applied to all your top matches — check Jobs for more." : "Complete your profile to see personalised matches."}</div>`}
    </div>
  </div>`;
}

function profileCompleteness() {
  const p = state.profile;
  if (!p) return 0;
  const fields = [p.name, p.email, p.phone, p.education, p.experienceYears !== undefined, (p.skills||[]).length, p.resumeName, (p.preferredCategories||[]).length];
  const filled = fields.filter(Boolean).length;
  return Math.round((filled / fields.length) * 100);
}

function pageJobs(queryStr) {
  const params = new URLSearchParams(queryStr || "");
  if (params.get("cat") && !state.filters.categories.includes(params.get("cat"))) {
    state.filters.categories = [params.get("cat")];
  }
  const f = state.filters;
  const results = getFilteredJobs();
  return `
  <div class="page container">
    <div class="section-head"><h2>Jobs${f.categories.length ? " — " + escapeHtml(f.categories.join(", ")) : ""}</h2><span class="muted small">${results.length} results</span></div>
    <div class="search-row">
      <input class="input" id="kwInput" placeholder="Search title, company or skill" value="${escapeHtml(f.keyword)}">
      <select class="input" id="cityInput" style="max-width:200px">
        <option value="">${state.userLocation ? "My location" : "Select city"}</option>
        ${CITIES.map(c => `<option value="${escapeHtml(c.name)}" ${f.city===c.name?"selected":""}>${escapeHtml(c.name)}</option>`).join("")}
      </select>
      <button class="btn btn-outline" id="useGpsBtn">📍 Use GPS</button>
    </div>
    <div class="jobs-layout">
      <aside class="filters-panel" id="filtersPanel">
        ${filtersHtml(f)}
      </aside>
      <div>
        <div class="toolbar">
          <span class="muted small">${state.userLocation ? "Sorted for " + escapeHtml(state.userLocation.label) : "Set your location for distance-based results"}</span>
          <div class="toolbar-right">
            <label class="small muted" for="sortSel">Sort:</label>
            <select class="input" id="sortSel" style="width:auto">
              <option value="relevance" ${f.sort==="relevance"?"selected":""}>Best match</option>
              <option value="distance" ${f.sort==="distance"?"selected":""}>Nearest</option>
              <option value="salary" ${f.sort==="salary"?"selected":""}>Highest salary</option>
              <option value="date" ${f.sort==="date"?"selected":""}>Newest</option>
            </select>
          </div>
        </div>
        <div class="grid" id="jobsList">
          ${results.length ? results.map(jobCardHtml).join("") : `<div class="empty-state card"><div class="glyph">🔍</div>No jobs match your filters. Try widening your search radius or clearing filters.</div>`}
        </div>
      </div>
    </div>
  </div>`;
}

function filtersHtml(f) {
  return `
  <div class="filter-group">
    <h4>Distance</h4>
    <input type="range" id="radiusRange" min="5" max="2000" step="5" value="${f.radiusKm}" class="w-full">
    <div class="range-row"><span>Within</span><span id="radiusVal">${f.radiusKm >= 2000 ? "Any distance" : f.radiusKm + " km"}</span></div>
  </div>
  <div class="filter-group">
    <h4>Salary range (₹/yr equivalent)</h4>
    <input type="range" id="salaryRange" min="0" max="3000000" step="50000" value="${f.salaryMax}" class="w-full">
    <div class="range-row"><span>Up to</span><span id="salaryVal">₹${(f.salaryMax/100000).toFixed(1)}L</span></div>
  </div>
  <div class="filter-group">
    <h4>Experience (max years)</h4>
    <input type="range" id="expRange" min="0" max="15" step="1" value="${f.expMax}" class="w-full">
    <div class="range-row"><span>Up to</span><span id="expVal">${f.expMax}+ yrs</span></div>
  </div>
  <div class="filter-group">
    <h4>Education</h4>
    <select class="input" id="eduSel">
      ${EDUCATION_LEVELS.map(e => `<option value="${e}" ${f.education===e?"selected":""}>${e}</option>`).join("")}
    </select>
  </div>
  <div class="filter-group">
    <h4>Job type</h4>
    ${JOB_TYPES.map(t => `<label class="filter-opt"><input type="checkbox" data-group="jobTypes" value="${t}" ${f.jobTypes.includes(t)?"checked":""}> ${t}</label>`).join("")}
  </div>
  <div class="filter-group">
    <h4>Work mode</h4>
    ${WORK_MODES.map(t => `<label class="filter-opt"><input type="checkbox" data-group="workModes" value="${t}" ${f.workModes.includes(t)?"checked":""}> ${t}</label>`).join("")}
  </div>
  <div class="filter-group">
    <h4>Category</h4>
    ${CATEGORIES.map(t => `<label class="filter-opt"><input type="checkbox" data-group="categories" value="${t}" ${f.categories.includes(t)?"checked":""}> ${t}</label>`).join("")}
  </div>
  <div class="filter-group">
    <h4>Company</h4>
    <input class="input" id="companyInput" placeholder="e.g. Zenwave" value="${escapeHtml(f.company)}">
  </div>
  <button class="btn btn-outline btn-block" id="clearFiltersBtn">Clear all filters</button>
  `;
}

function pageJobDetails(id) {
  const job = JOBS.find(j => j.id === id);
  if (!job) return `<div class="page container"><div class="empty-state card">Job not found. <a href="#/jobs">Back to jobs</a></div></div>`;
  const dist = jobDistance(job);
  const match = matchScore(job, state.profile);
  const saved = state.savedJobIds.has(job.id);
  const dLeft = daysUntil(job.deadline);
  const similar = JOBS.filter(j => j.id !== job.id && j.categories.some(c => job.categories.includes(c))).slice(0,3);
  const breakdown = state.profile ? matchBreakdown(job, state.profile) : null;
  return `
  <div class="page container">
    <a href="#/jobs" class="small muted">← Back to jobs</a>
    <div class="detail-grid mt-16">
      <div>
        <div class="card card-pad">
          <div class="detail-header">
            <div class="job-logo">${job.logo}</div>
            <div style="flex:1;min-width:200px">
              <h2 style="margin-bottom:4px">${escapeHtml(job.title)}</h2>
              <p class="muted" style="margin:0">${escapeHtml(job.company)} · ${escapeHtml(job.city)}${dist!==null?` · ${dist} km away`:""}</p>
            </div>
            ${match !== null ? `<span class="match-badge ${matchClass(match)}" style="font-size:14px;padding:6px 14px">${match}% match</span>` : ""}
          </div>
          <div class="tag-row mt-16">
            <span class="tag blue">${escapeHtml(job.jobType)}</span>
            <span class="tag blue">${escapeHtml(job.workMode)}</span>
            ${job.categories.map(c=>`<span class="tag">${escapeHtml(c)}</span>`).join("")}
          </div>
          <div class="spec-grid">
            <div class="spec-item"><div class="k">Salary</div><div class="v">${fmtSalary(job.salaryMin,job.salaryMax,job.salaryUnit)}</div></div>
            <div class="spec-item"><div class="k">Experience</div><div class="v">${job.expMin}-${job.expMax} yrs</div></div>
            <div class="spec-item"><div class="k">Education</div><div class="v">${escapeHtml(job.education)}</div></div>
            <div class="spec-item"><div class="k">Posted</div><div class="v">${fmtDate(job.posted)}</div></div>
            <div class="spec-item"><div class="k">Deadline</div><div class="v">${fmtDate(job.deadline)} ${dLeft>=0?`(${dLeft}d left)`:"(closed)"}</div></div>
          </div>
          <h4>Job description</h4>
          <p class="muted">${escapeHtml(job.description)}</p>
          <h4>Required skills</h4>
          <div class="tag-row">${job.skills.map(s=>`<span class="tag">${escapeHtml(s)}</span>`).join("")}</div>
          <h4 class="mt-16">Eligibility</h4>
          <p class="muted" style="margin:0">${escapeHtml(job.eligibility)}</p>
        </div>

        ${similar.length ? `
        <div class="section-head mt-24"><h2>Similar jobs</h2></div>
        <div class="grid">${similar.map(j => jobCardHtml({job:j, dist: jobDistance(j), match: matchScore(j, state.profile)})).join("")}</div>` : ""}
      </div>

      <div>
        <div class="card card-pad">
          <button class="btn btn-primary btn-block" data-action="apply" data-id="${job.id}">Apply Now — ${job.applyType === "internal" ? "One-Click" : "Official Portal"}</button>
          <button class="btn btn-outline btn-block mt-8" data-action="save" data-id="${job.id}">${saved ? "★ Saved" : "☆ Save job"}</button>
          ${job.applyType === "external"
            ? `<a class="btn btn-outline btn-block mt-8" href="${job.applyUrl}" target="_blank" rel="noopener">Open official portal directly (optional) ↗</a>`
            : `<a class="btn btn-outline btn-block mt-8" href="${officialSearchUrl(job)}" target="_blank" rel="noopener">🔎 Look up this employer online (optional)</a>`}
          <p class="small muted mt-16" style="margin:0">
            ${job.applyType === "internal"
              ? "This employer accepts applications directly through Job in One Click using your saved profile and resume. The lookup link above is optional — only use it if you'd like to verify the employer independently."
              : "This employer's application is hosted on an external portal. \"Apply Now\" opens it with your details prefilled where the portal supports it; the direct link above skips prefill if you'd rather fill it in yourself. Either way, you'll complete and submit it on their site — not here."}
          </p>
        </div>
        ${breakdown ? `
        <div class="card card-pad mt-16">
          <h4 style="margin-bottom:12px">How your profile matches</h4>
          ${breakdown.map(b => `
            <div class="match-breakdown-row">
              <span style="width:90px;flex-shrink:0">${b.label}</span>
              <span class="bar-track"><span class="bar-fill" style="width:${b.pct}%"></span></span>
              <span style="width:34px;text-align:right;flex-shrink:0">${b.pct}%</span>
            </div>`).join("")}
        </div>` : `
        <div class="card card-pad mt-16">
          <p class="small muted" style="margin:0">Complete your <a href="#/profile">profile</a> to see a personalised match breakdown.</p>
        </div>`}
      </div>
    </div>
  </div>`;
}
function matchBreakdown(job, profile) {
  const pSkills = (profile.skills||[]).map(s=>s.toLowerCase());
  const jSkills = (job.skills||[]).map(s=>s.toLowerCase());
  const skillPct = jSkills.length ? Math.round(100 * jSkills.filter(s=>pSkills.includes(s)).length / jSkills.length) : 60;
  const catPct = job.categories.some(c => (profile.preferredCategories||[]).includes(c)) ? 100 : 20;
  const exp = Number(profile.experienceYears||0);
  const expPct = (exp >= job.expMin && exp <= job.expMax+2) ? 100 : (Math.abs(exp-job.expMin)<=2 ? 55 : 15);
  const eduOrder = ["12th Pass","Diploma","Undergraduate","Postgraduate","Doctorate"];
  const pIdx = eduOrder.indexOf(profile.education), jIdx = eduOrder.indexOf(job.education);
  const eduPct = (job.education==="Any"||pIdx===jIdx) ? 100 : (pIdx>jIdx ? 80 : 30);
  return [
    {label:"Skills", pct: skillPct}, {label:"Category", pct: catPct},
    {label:"Experience", pct: expPct}, {label:"Education", pct: eduPct}
  ];
}

function pageSaved() {
  const list = JOBS.filter(j => state.savedJobIds.has(j.id)).map(j => ({job:j, dist: jobDistance(j), match: matchScore(j, state.profile)}));
  return `
  <div class="page container">
    <div class="section-head"><h2>Saved jobs</h2></div>
    <div class="grid">
      ${list.length ? list.map(jobCardHtml).join("") : `<div class="empty-state card"><div class="glyph">☆</div>No saved jobs yet. Tap the star on any job to save it for later.<br><a href="#/jobs" class="btn btn-primary btn-sm mt-16" style="display:inline-flex">Browse jobs</a></div>`}
    </div>
  </div>`;
}

const ALL_STATUSES = [
  "Submitted", "Redirected — complete on portal", "Submitted on portal",
  "Under Review", "Interview Scheduled", "Offer Received", "Selected", "Rejected", "Withdrawn"
];
const STATUS_CLASS = {
  "Submitted":"status-submitted", "Redirected — complete on portal":"status-redirected",
  "Submitted on portal":"status-submitted",
  "Under Review":"status-review", "Interview Scheduled":"status-interview",
  "Offer Received":"status-interview", "Rejected":"status-rejected",
  "Selected":"status-selected", "Withdrawn":"status-redirected"
};
function appHistory(a) {
  return a.history && a.history.length ? a.history : [{ status: a.status, date: a.appliedDate }];
}
function pageApplications() {
  const apps = state.applications.slice().sort((a,b)=> new Date(b.appliedDate)-new Date(a.appliedDate));
  return `
  <div class="page container">
    <div class="section-head"><h2>Applications tracker</h2><span class="muted small">${apps.length} total</span></div>
    <div class="card card-pad" style="margin-bottom:16px">
      <p class="small muted" style="margin:0"><strong>Live, self-tracked status.</strong> Job in One Click has no access to any employer's hiring system, so we can't pull real-time updates automatically — nobody honestly can without that integration. Instead, set the status yourself as things happen (a call, an email, a portal update) and it's saved to your account instantly and reflected everywhere right away.</p>
    </div>
    <div class="app-list">
      ${apps.length ? apps.map(a => {
        const job = JOBS.find(j => j.id === a.jobId);
        if (!job) return "";
        const hist = appHistory(a);
        return `
        <div class="app-row">
          <div>
            <strong>${escapeHtml(job.title)}</strong>
            <div class="muted small">${escapeHtml(job.company)} · ${escapeHtml(job.city)}</div>
          </div>
          <div class="small"><span class="muted">Applied</span><br>${fmtDate(a.appliedDate)}</div>
          <div class="small"><span class="muted">Mode</span><br>${a.jobApplyType === "internal" ? "One-Click" : "External portal"}</div>
          <div>
            <select class="input" style="padding:6px 8px;font-size:12.5px" data-status-select="${job.id}" aria-label="Update status for ${escapeHtml(job.title)}">
              ${ALL_STATUSES.map(s => `<option value="${s}" ${a.status===s?"selected":""}>${s}</option>`).join("")}
            </select>
            <div class="small muted" style="margin-top:3px">Updated ${fmtDate(a.lastUpdated || a.appliedDate)}</div>
          </div>
          <div class="flex gap-8" style="flex-wrap:wrap">
            <a href="#/job/${job.id}" class="btn btn-outline btn-sm">View job</a>
            ${job.applyType === "external" && job.applyUrl ? `<a href="${job.applyUrl}" target="_blank" rel="noopener" class="btn btn-outline btn-sm">Open portal ↗</a>` : ""}
          </div>
        </div>
        ${hist.length > 1 ? `
        <details class="small muted" style="margin:-4px 4px 6px">
          <summary style="cursor:pointer">Status history (${hist.length})</summary>
          <ul style="margin:6px 0 0;padding-left:18px">
            ${hist.slice().reverse().map(h => `<li>${escapeHtml(h.status)} — ${fmtDate(h.date)}</li>`).join("")}
          </ul>
        </details>` : ""}`;
      }).join("") : `<div class="empty-state card"><div class="glyph">📄</div>You haven't applied to any jobs yet. Once you do, track their status here.</div>`}
    </div>
  </div>`;
}

function pageProfile() {
  const p = state.profile || {};
  const completion = profileCompleteness();
  return `
  <div class="page container">
    <div class="section-head"><h2>Profile &amp; resume</h2>${state.users.find(u=>u.email===state.user?.email)?.verified ? `<span class="tag" style="background:var(--success-tint);color:var(--success)">✓ Verified account</span>` : ""}</div>
    <div class="card card-pad mt-8" style="margin-bottom:18px">
      <div class="flex justify-between items-center gap-12" style="flex-wrap:wrap">
        <strong>Profile completeness</strong><span class="muted small">${completion}%</span>
      </div>
      <div class="progress-track mt-8"><div class="progress-fill" style="width:${completion}%"></div></div>
    </div>
    <form id="profileForm" class="card card-pad">
      <div class="form-grid two">
        <div class="field"><label for="pName">Full name</label><input class="input" id="pName" value="${escapeHtml(p.name||"")}" required></div>
        <div class="field"><label for="pEmail">Email</label><input class="input" type="email" id="pEmail" value="${escapeHtml(p.email||"")}" required></div>
        <div class="field"><label for="pPhone">Phone</label><input class="input" id="pPhone" value="${escapeHtml(p.phone||"")}" placeholder="+91 9xxxxxxxxx"></div>
        <div class="field"><label for="pEducation">Highest education</label>
          <select class="input" id="pEducation">${EDUCATION_LEVELS.filter(e=>e!=="Any").map(e=>`<option ${p.education===e?"selected":""}>${e}</option>`).join("")}</select>
        </div>
        <div class="field"><label for="pExp">Years of experience</label><input class="input" type="number" min="0" max="40" id="pExp" value="${p.experienceYears ?? 0}"></div>
        <div class="field"><label for="pCity">Home city</label>
          <select class="input" id="pCity">${CITIES.map(c=>`<option ${p.city===c.name?"selected":""}>${c.name}</option>`).join("")}</select>
        </div>
      </div>
      <div class="field mt-16">
        <label for="skillInput">Skills</label>
        <div class="tag-input" id="skillTagInput">
          ${(p.skills||[]).map(s => `<span class="tag-remove">${escapeHtml(s)}<button type="button" data-remove-skill="${escapeHtml(s)}" aria-label="Remove ${escapeHtml(s)}">×</button></span>`).join("")}
          <input id="skillInput" placeholder="Type a skill and press Enter">
        </div>
        <p class="hint">e.g. Python, React, Excel, Communication</p>
      </div>
      <div class="field mt-16">
        <label>Preferred categories</label>
        <div class="category-chip-grid">
          ${CATEGORIES.map(c => `<label class="filter-opt"><input type="checkbox" data-pref-cat value="${c}" ${(p.preferredCategories||[]).includes(c)?"checked":""}> ${c}</label>`).join("")}
        </div>
      </div>
      <div class="field mt-16">
        <label>Resume</label>
        <div class="upload-box ${p.resumeName ? "has-file" : ""}" id="uploadBox">
          <input type="file" id="resumeFile" accept=".pdf,.doc,.docx" class="sr-only">
          <p style="margin:0 0 8px"><label for="resumeFile" class="btn btn-outline btn-sm" style="cursor:pointer">${p.resumeName ? "Replace resume" : "Upload resume (PDF/DOC)"}</label></p>
          <p class="small" style="margin:0">${p.resumeName ? "📎 " + escapeHtml(p.resumeName) : "No file uploaded yet. This powers One-Click Apply."}</p>
        </div>
      </div>
      <button class="btn btn-primary mt-24" type="submit">Save profile</button>
    </form>
  </div>`;
}

function pageSettings() {
  const acct = state.users.find(u => u.email === state.user?.email);
  return `
  <div class="page container" style="max-width:640px">
    <div class="section-head"><h2>Settings</h2></div>
    <div class="card card-pad" style="margin-bottom:16px">
      <div class="flex justify-between items-center" style="flex-wrap:wrap;gap:10px">
        <div>
          <strong>Account status</strong>
          <p class="muted small" style="margin:2px 0 0">${escapeHtml(state.user?.email||"")} · registered ${acct ? fmtDate(acct.createdAt.slice(0,10)) : ""}</p>
        </div>
        ${acct?.verified ? `<span class="tag" style="background:var(--success-tint);color:var(--success)">✓ Verified account</span>` : ""}
      </div>
    </div>
    <div class="card card-pad">
      <div class="flex justify-between items-center">
        <div><strong>Dark mode</strong><p class="muted small" style="margin:2px 0 0">Switch between light and dark themes.</p></div>
        <button class="btn btn-outline btn-sm" id="toggleDarkBtn2">${state.darkMode ? "Switch to light" : "Switch to dark"}</button>
      </div>
    </div>
    <div class="card card-pad mt-16">
      <div class="flex justify-between items-center">
        <div><strong>Location access</strong><p class="muted small" style="margin:2px 0 0">${state.userLocation ? "Using: " + escapeHtml(state.userLocation.label) : "Not set"}</p></div>
        <button class="btn btn-outline btn-sm" id="reqGpsBtn">Update location</button>
      </div>
    </div>
    <div class="card card-pad mt-16">
      <div class="flex justify-between items-center">
        <div><strong>Email notifications</strong><p class="muted small" style="margin:2px 0 0">New matching jobs and application updates.</p></div>
        <label class="filter-opt"><input type="checkbox" checked> Enabled</label>
      </div>
    </div>
    <div class="card card-pad mt-16">
      <div class="flex justify-between items-center">
        <div><strong>Account</strong><p class="muted small" style="margin:2px 0 0">${escapeHtml(state.user?.email || "")}</p></div>
        <button class="btn btn-danger btn-sm" id="logoutBtn">Log out</button>
      </div>
    </div>
  </div>`;
}

/* ---------------- Router ---------------- */
function requireAuth(next) {
  if (!state.user) { location.hash = "#/login"; return false; }
  return true;
}
function render() {
  const [path, queryStr] = location.hash.replace(/^#/, "").split("?");
  state.route = "#" + (path || "/home");
  const main = el("app");
  const segs = (path || "/home").split("/").filter(Boolean);

  if (segs[0] === "job" && segs[1]) { main.innerHTML = pageJobDetails(segs[1]); }
  else if (path === "/home" || !path) { main.innerHTML = pageHome(); }
  else if (path === "/login") { main.innerHTML = pageLogin("login"); }
  else if (path === "/register") { main.innerHTML = pageLogin("register"); }
  else if (path === "/jobs") { main.innerHTML = pageJobs(queryStr); }
  else if (path === "/dashboard") { if (requireAuth()) main.innerHTML = pageDashboard(); }
  else if (path === "/saved") { if (requireAuth()) main.innerHTML = pageSaved(); }
  else if (path === "/applications") { if (requireAuth()) main.innerHTML = pageApplications(); }
  else if (path === "/profile") { if (requireAuth()) main.innerHTML = pageProfile(); }
  else if (path === "/settings") { if (requireAuth()) main.innerHTML = pageSettings(); }
  else { main.innerHTML = `<div class="page container"><div class="empty-state card">Page not found. <a href="#/home">Go home</a></div></div>`; }

  renderHeader();
  window.scrollTo(0,0);
  bindPageEvents();
}

/* ---------------- Event binding (delegated + per-page) ---------------- */
function bindGlobalActions() {
  document.body.addEventListener("click", (e) => {
    const saveBtn = e.target.closest("[data-action='save']");
    if (saveBtn) {
      if (!state.user) { location.hash = "#/login"; return; }
      const id = saveBtn.dataset.id;
      if (state.savedJobIds.has(id)) { state.savedJobIds.delete(id); toast("Removed from saved jobs", "☆"); }
      else { state.savedJobIds.add(id); toast("Job saved", "★"); }
      persist();
      render();
      return;
    }
    const applyBtn = e.target.closest("[data-action='apply']");
    if (applyBtn) { handleApply(applyBtn.dataset.id); return; }
  });

  el("darkToggle").addEventListener("click", () => { toggleDark(); persist(); });
}

function toggleDark() {
  state.darkMode = !state.darkMode;
  document.documentElement.classList.toggle("dark", state.darkMode);
  el("darkToggle").textContent = state.darkMode ? "☀️" : "🌙";
}

function bindPageEvents() {
  // Home hero search
  const heroBtn = el("heroSearchBtn");
  if (heroBtn) heroBtn.addEventListener("click", () => {
    state.filters.keyword = el("heroKeyword").value;
    const city = el("heroCity").value;
    if (city) setCityLocation(city); 
    location.hash = "#/jobs";
  });

  // Auth
  const authArea = el("authFormArea");
  if (authArea) {
    let mode = state.route === "#/register" ? "register" : "login";
    authArea.innerHTML = authFormHtml(mode);
    qsa(".auth-tabs button").forEach(b => b.addEventListener("click", () => {
      mode = b.dataset.tab; location.hash = mode === "register" ? "#/register" : "#/login";
    }));
    el("authForm").addEventListener("submit", (e) => {
      e.preventDefault();
      if (mode === "register") {
        const name = el("regName").value.trim(), emailRaw = el("regEmail").value.trim(), pass = el("regPass").value;
        const email = emailRaw.toLowerCase();
        const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
        if (!name || !emailOk) { toast("Enter your name and a valid email address", "⚠️"); return; }
        if (pass.length < 6) { toast("Password must be at least 6 characters", "⚠️"); return; }
        if (pass !== el("regPass2").value) { toast("Passwords don't match", "⚠️"); return; }
        if (state.users.find(u => u.email === email)) { toast("An account with this email already exists — try logging in", "⚠️"); return; }
        const newUser = { name, email, passHash: demoHash(pass), verified: true, createdAt: new Date().toISOString() };
        state.users.push(newUser);
        state.user = { name, email };
        state.profile = { name, email, skills: [], preferredCategories: [], experienceYears: 0, education: "Undergraduate" };
        state.savedJobIds = new Set(); state.applications = [];
        persist();
        toast("Account created and verified ✓ Welcome!", "🎉");
        location.hash = "#/profile";
      } else {
        const email = el("loginEmail").value.trim().toLowerCase(), pass = el("loginPass").value;
        const u = state.users.find(u => u.email === email);
        if (!u) { toast("No account found with that email. Try registering instead.", "⚠️"); return; }
        if (u.passHash !== demoHash(pass)) { toast("Incorrect password. Please try again.", "⚠️"); return; }
        state.user = { name: u.name, email: u.email };
        const store = loadStore();
        state.profile = (store.profiles || {})[u.email] || { name: u.name, email: u.email, skills: [], preferredCategories: [] };
        state.savedJobIds = new Set((store.saved || {})[u.email] || []);
        state.applications = (store.applications || {})[u.email] || [];
        persist();
        toast("Signed in — credentials verified ✓ Welcome back, " + u.name.split(" ")[0] + "!", "👋");
        location.hash = "#/dashboard";
      }
    });
  }
  const guestBtn = el("guestBtn");
  if (guestBtn) guestBtn.addEventListener("click", () => {
    const email = "demo@jobinoneclick.app";
    if (!state.users.find(u => u.email === email)) {
      state.users.push({ name: "Demo Candidate", email, passHash: demoHash("demo123"), verified: true, createdAt: new Date().toISOString() });
    }
    state.user = { name: "Demo Candidate", email };
    state.profile = {
      name: "Demo Candidate", email, phone: "+91 90000 00000",
      education: "Undergraduate", experienceYears: 1, city: "Hyderabad",
      skills: ["React", "JavaScript", "SQL", "Communication"],
      preferredCategories: ["IT/Software", "Fresher", "Internships"],
      resumeName: "demo_candidate_resume.pdf"
    };
    state.savedJobIds = new Set(); state.applications = [];
    setCityLocation("Hyderabad");
    persist();
    toast("Demo profile loaded and verified ✓", "🎉");
    location.hash = "#/dashboard";
  });

  // Jobs page filters
  const kw = el("kwInput");
  if (kw) {
    kw.addEventListener("input", debounce(() => { state.filters.keyword = kw.value; refreshJobsList(); }, 250));
    el("cityInput").addEventListener("change", (e) => { if (e.target.value) setCityLocation(e.target.value); refreshJobsList(); });
    el("useGpsBtn").addEventListener("click", requestGps);
    el("sortSel").addEventListener("change", (e) => { state.filters.sort = e.target.value; refreshJobsList(); });
    el("radiusRange").addEventListener("input", (e) => {
      state.filters.radiusKm = Number(e.target.value);
      el("radiusVal").textContent = state.filters.radiusKm >= 2000 ? "Any distance" : state.filters.radiusKm + " km";
      refreshJobsList();
    });
    el("salaryRange").addEventListener("input", (e) => {
      state.filters.salaryMax = Number(e.target.value);
      el("salaryVal").textContent = "₹" + (state.filters.salaryMax/100000).toFixed(1) + "L";
      refreshJobsList();
    });
    el("expRange").addEventListener("input", (e) => {
      state.filters.expMax = Number(e.target.value);
      el("expVal").textContent = state.filters.expMax + "+ yrs";
      refreshJobsList();
    });
    el("eduSel").addEventListener("change", (e) => { state.filters.education = e.target.value; refreshJobsList(); });
    el("companyInput").addEventListener("input", debounce((e) => { state.filters.company = e.target.value; refreshJobsList(); }, 250));
    qsa("[data-group]").forEach(cb => cb.addEventListener("change", () => {
      const group = cb.dataset.group;
      const val = cb.value;
      const arr = state.filters[group];
      if (cb.checked) { if (!arr.includes(val)) arr.push(val); }
      else { state.filters[group] = arr.filter(v => v !== val); }
      refreshJobsList();
    }));
    el("clearFiltersBtn").addEventListener("click", () => {
      const kwVal = state.filters.keyword;
      state.filters = defaultFilters(); state.filters.keyword = kwVal;
      render();
    });
  }

  // Profile form
  const pf = el("profileForm");
  if (pf) {
    pf.addEventListener("submit", (e) => {
      e.preventDefault();
      state.profile = {
        ...state.profile,
        name: el("pName").value.trim(), email: el("pEmail").value.trim(), phone: el("pPhone").value.trim(),
        education: el("pEducation").value, experienceYears: Number(el("pExp").value || 0), city: el("pCity").value,
      };
      persist();
      toast("Profile saved — your match % and recommendations just updated", "✅");
      render();
    });
    let skills = [...(state.profile?.skills || [])];
    const skillInput = el("skillInput");
    skillInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && skillInput.value.trim()) {
        e.preventDefault();
        skills.push(skillInput.value.trim());
        state.profile.skills = skills;
        persist();
        render();
      }
    });
    qsa("[data-remove-skill]").forEach(b => b.addEventListener("click", () => {
      state.profile.skills = (state.profile.skills || []).filter(s => s !== b.dataset.removeSkill);
      persist();
      render();
    }));
    qsa("[data-pref-cat]").forEach(cb => cb.addEventListener("change", () => {
      let cats = new Set(state.profile.preferredCategories || []);
      cb.checked ? cats.add(cb.value) : cats.delete(cb.value);
      state.profile.preferredCategories = Array.from(cats);
      persist();
    }));
    el("resumeFile").addEventListener("change", (e) => {
      const f = e.target.files[0];
      if (f) { state.profile.resumeName = f.name; persist(); toast("Resume attached: " + f.name, "📎"); render(); }
    });
  }

  // Settings
  const dk2 = el("toggleDarkBtn2");
  if (dk2) dk2.addEventListener("click", () => { toggleDark(); persist(); render(); });
  const gpsBtn = el("reqGpsBtn");
  if (gpsBtn) gpsBtn.addEventListener("click", requestGps);
  const logoutBtn = el("logoutBtn");
  if (logoutBtn) logoutBtn.addEventListener("click", () => {
    state.user = null; state.profile = null; state.savedJobIds = new Set(); state.applications = [];
    persist();
    toast("Logged out", "👋"); location.hash = "#/home";
  });
  const statusSelects = qsa("[data-status-select]");
  statusSelects.forEach(sel => sel.addEventListener("change", () => {
    const jobId = sel.dataset.statusSelect;
    const app = state.applications.find(a => a.jobId === jobId);
    if (!app) return;
    const newStatus = sel.value;
    const today = new Date().toISOString().slice(0,10);
    app.history = appHistory(app);
    app.history.push({ status: newStatus, date: today });
    app.status = newStatus;
    app.lastUpdated = today;
    persist();
    toast("Status updated to \"" + newStatus + "\"", "✅");
    render();
  }));
}

function refreshJobsList() {
  const list = el("jobsList");
  if (!list) return;
  const results = getFilteredJobs();
  list.innerHTML = results.length ? results.map(jobCardHtml).join("") : `<div class="empty-state card"><div class="glyph">🔍</div>No jobs match your filters. Try widening your search radius or clearing filters.</div>`;
  const head = qs(".section-head span");
  if (head) head.textContent = results.length + " results";
}

function debounce(fn, ms) { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; }

/* ---------------- Location ---------------- */
function setCityLocation(name) {
  const c = CITIES.find(c => c.name === name);
  if (!c) return;
  state.userLocation = { lat: c.lat, lng: c.lng, label: c.name };
  persist();
  renderHeader();
}
function requestGps() {
  if (!navigator.geolocation) { toast("Geolocation isn't supported on this device. Please pick a city instead.", "⚠️"); return; }
  toast("Requesting your location…", "📍");
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      state.userLocation = { lat: pos.coords.latitude, lng: pos.coords.longitude, label: "Current location" };
      persist();
      toast("Location found — showing jobs near you", "✅");
      render();
    },
    (err) => {
      toast("Location permission denied. Select a city manually instead.", "⚠️");
    },
    { enableHighAccuracy: false, timeout: 8000 }
  );
}

/* ---------------- Apply flow ---------------- */
function handleApply(jobId) {
  const job = JOBS.find(j => j.id === jobId);
  if (!job) return;
  if (!state.user) { toast("Please log in to apply", "🔒"); location.hash = "#/login"; return; }
  const already = state.applications.find(a => a.jobId === jobId);
  if (already) { toast("You've already applied to this job", "ℹ️"); return; }
  const completion = profileCompleteness();
  if (!state.profile?.resumeName || completion < 60) {
    showModal(`
      <h3>Complete your profile first</h3>
      <p class="muted">One-Click Apply uses your saved profile and resume. Please add your details and upload a resume before applying.</p>
      <div class="modal-actions">
        <button class="btn btn-outline" data-close-modal>Cancel</button>
        <a href="#/profile" class="btn btn-primary" data-close-modal>Go to profile</a>
      </div>`);
    return;
  }
  if (job.applyType === "internal") {
    const today = new Date().toISOString().slice(0,10);
    state.applications.push({ jobId, status: "Submitted", appliedDate: today, jobApplyType: "internal", lastUpdated: today, history: [{status:"Submitted", date: today}] });
    persist();
    toast("Application submitted using your saved profile ✅ — recommendations updated", "✅");
    render();
  } else {
    showModal(`
      <h3>You'll apply on ${escapeHtml(job.company)}'s official portal</h3>
      <p class="muted">Job in One Click doesn't submit this application for you. We'll open the official portal in a new tab and prefill your details where the portal supports it — you'll need to review and submit it there.</p>
      <div class="modal-actions">
        <button class="btn btn-outline" data-close-modal>Cancel</button>
        <button class="btn btn-primary" id="confirmExternalApply">Continue to portal</button>
      </div>`);
    el("confirmExternalApply").addEventListener("click", () => {
      const url = new URL(job.applyUrl);
      try {
        if (state.profile?.name) url.searchParams.set("name", state.profile.name);
        if (state.profile?.email) url.searchParams.set("email", state.profile.email);
      } catch(e) {}
      window.open(url.toString(), "_blank", "noopener");
      const today = new Date().toISOString().slice(0,10);
      state.applications.push({ jobId, status: "Redirected — complete on portal", appliedDate: today, jobApplyType: "external", lastUpdated: today, history: [{status:"Redirected — complete on portal", date: today}] });
      persist();
      closeModal();
      toast("Redirected to official portal — update your status once you've applied there", "↗️");
      render();
    });
  }
}

function showModal(innerHtml) {
  const overlay = document.createElement("div");
  overlay.className = "modal-overlay";
  overlay.innerHTML = `<div class="modal-box">${innerHtml}</div>`;
  document.body.appendChild(overlay);
  overlay.addEventListener("click", (e) => { if (e.target === overlay) closeModal(); });
  qsa("[data-close-modal]", overlay).forEach(b => b.addEventListener("click", closeModal));
}
function closeModal() { const o = qs(".modal-overlay"); if (o) o.remove(); }

/* ---------------- Init ---------------- */
window.addEventListener("hashchange", render);
window.addEventListener("DOMContentLoaded", () => {
  hydrateFromStore();
  document.documentElement.classList.toggle("dark", state.darkMode);
  const dt = el("darkToggle"); if (dt) dt.textContent = state.darkMode ? "☀️" : "🌙";
  bindGlobalActions();
  if (!location.hash) location.hash = state.user ? "#/dashboard" : "#/home";
  render();
});
