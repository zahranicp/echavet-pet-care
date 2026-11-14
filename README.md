# EchaVet / PawTalk

A veterinary clinic website prototype built with HTML, CSS, and vanilla JavaScript, with Supabase integration for authentication and clinic data. The interface is primarily in Indonesian, with some bilingual login content.

## Features

- Public clinic information, appointment booking, and pet hotel pages.
- Pawrent registration, login, password recovery, and a pet care portal.
- Staff and doctor portals for appointments, walk-in visits, inpatient care, monitoring, inventory, and visit history.
- Consultation messaging, doctor schedules, and room monitoring interfaces.
- Browser webcam previews and local browser storage for some prototype flows.

Some screens mix demonstration data with Supabase-backed functionality. This repository is a source-code snapshot, not a production-ready clinical system. Read [SECURITY.md](SECURITY.md) before connecting real users or records.

## Technology

- Static HTML, CSS, and JavaScript; no frontend build step.
- Supabase JavaScript client v2 loaded from a CDN.
- PostgreSQL schema and migration scripts in `supabase/`.
- An optional local development server using Node.js built-in modules; no npm dependencies.

## Run locally

1. Install Node.js if you want to use the included server.
2. Create your local configuration:

   ```powershell
   Copy-Item config.example.js config.js
   ```

3. Edit `config.js` with your own Supabase project URL and publishable/anon key. Leave both values empty to browse the unconfigured prototype; database-dependent features will be unavailable.
4. Start the server from this repository's directory:

   ```sh
   node local-server.js
   ```

5. Open http://localhost:8000/login.html for the main entry page, or http://localhost:8000/clinic-login.html for clinical sign-in.

The server currently opens `clinic-visit-history.html` at `/`. An alternative is VS Code Live Server. Use localhost or HTTPS for browser camera access. The included server is for local development only.

## Supabase setup

Use a separate development project with synthetic data. This export intentionally omits the original project's `config.js` and all database contents.

The SQL directory contains historical schema alternatives and incremental changes, not a single automated migration chain. Do not execute every file blindly:

- `schema.sql` is an earlier base schema.
- `echavet_history.sql` defines an alternative history-oriented base and overlaps with `schema.sql`.
- `echavet_history_migration.sql` adapts an existing older schema; it is not a standalone fresh database setup.
- `appointments.sql` depends on the history schema; `appointments_staff.sql` extends it.
- `clinic_workflow.sql` extends appointments and adds inpatient and walk-in workflows.
- Other scripts add profile fields, inventory, care details, recovery functions, and booking guards. Read each script's prerequisites before use.
- `backfill_booking_contacts.sql` updates existing records; it does not contain an exported contact list.

Choose the appropriate base for your database, review the incremental scripts, and resolve the security findings in [SECURITY.md](SECURITY.md). The full setup has not been tested against a fresh Supabase project in this export.

Configure authentication providers, redirect URLs, email delivery, profile creation, clinical roles, and Realtime subscriptions as required by the flows you use. Assign staff and doctor roles only through a trusted administrative process.

## Repository layout

```text
assets/                 Website illustrations
supabase/               SQL schema and migration source files
*.html                  Public, Pawrent, and clinic pages
*.js                    Browser logic and the local development server
portal.css              Shared portal styling
*.png                   Logos and interface images
manifest.webmanifest    Existing web app manifest
config.example.js       Empty configuration template
.gitignore              Local and sensitive file exclusions
README.md               Project overview and setup
SECURITY.md             Findings and publication precautions
```

## Publishing to GitHub

Upload the contents of this folder as the repository root. Include `.gitignore`, the configuration template, source code, SQL scripts, images, and documentation. Keep `config.js`, secrets, real clinical records, database exports, backups, and private camera information out of the repository.

A `.gitignore` rule does not remove a file already tracked by Git or erase its history. Review the staged changes before pushing. If a real secret was previously committed, revoke or rotate it and address the repository history.

GitHub source hosting and website deployment are separate steps. This snapshot has no `index.html`; the manifest also references that missing page. Static hosting requires an entry page or redirect and a deployment-time `config.js` containing only browser-safe settings. Frontend configuration is visible to website visitors even when excluded from Git.

## Limitations

- Browser role flags and monitoring codes are not sufficient authorization controls.
- Webcam previews do not provide secure cross-device video streaming.
- Some screens render dynamic content as HTML and need an input/output security review.
- No end-to-end database, authentication, or deployment validation was performed for this export.

## License and assets

No open-source license has been added. Choose a license before inviting reuse, and confirm that you have permission to publish the EchaVet branding, illustrations, and other assets. Public visibility alone does not grant an open-source license.
