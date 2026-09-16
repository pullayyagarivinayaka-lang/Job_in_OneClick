# Job in One Click 💼

Find the right job. Near you. Apply in one click.

A modern, mobile-first job-search platform for undergrads, freshers, interns and experienced candidates — built with plain HTML/CSS/JavaScript (no build step, no framework).

## Features
- Profile + resume built once, reused everywhere (One-Click Apply)
- GPS location or manual city selection, distance-based sorting
- Keyword search + filters: salary, education, experience, job type, work mode, category, company
- 15 categories: internships, fresher, undergraduate, graduate, part-time, full-time, remote, IT/software, data science, analytics, finance, marketing, design, customer support, government jobs
- Job cards with title, company, location, distance, salary, experience, education, posted date, deadline, match %, Save + Apply
- One-Click Apply: submits instantly for supported employers, redirects to the official portal (with best-effort prefill) for external ones — never claims a submission that didn't happen
- Dashboard, Jobs, Job Details, Saved Jobs, Applications Tracker, Profile/Resume, Login/Register, Settings
- Light/dark mode, responsive, keyboard-accessible

## Run it
No build tools needed.
```
git clone <this-repo>
cd job-in-one-click
# open index.html directly, or serve locally:
python3 -m http.server 8000
```
Then visit `http://localhost:8000`.

## Deploy free (GitHub Pages)
1. Push these files to a GitHub repo.
2. Repo → **Settings → Pages → Source: main branch, / (root)**.
3. Your live URL appears at `https://<username>.github.io/<repo>/`.

## Files
- `index.html` — app shell, header/footer, page mount point
- `style.css` — design tokens, layout, light/dark themes
- `data.js` — sample job listings and reference lists (cities, categories)
- `app.js` — routing, state, matching, filters, GPS, apply flow

## Important notes (please read)
- **This is a front-end demo.** There is no backend/database, so accounts, saved jobs and applications live only in memory for the current browser tab and reset on reload. To make it production-ready, connect it to a backend (auth, database, file storage) and swap `app.js`'s in-memory `state` object for real API calls.
- **Job data is illustrative**, not a live feed. Replace `data.js` with a real jobs API/database for production use.
- **One-Click Apply is honest by design**: it only marks a job "Submitted" for employers flagged `applyType: "internal"` (i.e., ones your backend actually integrates with). For `applyType: "external"` jobs, it opens the real employer/government portal in a new tab and only records "Redirected — complete on portal," since the app cannot legally or technically submit on a third-party site.
- **Eligibility**: jobs are open to applicants from any location — distance is shown for planning convenience only and never blocks an application.

## License
MIT — do anything you like with it.

---
Made with ❤️ by **Pullayyagari Vinayaka**
