# Luma — Document Intelligence

A document Q&A project built with React, TypeScript, Vite, and Supabase. The interface supports authentication, a document library, source viewing, and excerpt search. PDF extraction, embeddings, and AI-generated answers are planned next.

## Run locally

Install Node.js and npm, then:

```powershell
cd frontend
npm install
Copy-Item .env.example .env.local
```

Set your Supabase Project URL and publishable key in `frontend/.env.local`. Never place a service-role key, secret key, database password, or model API key in frontend variables.

```powershell
npm run dev -- --port 5173 --strictPort
```

Open http://localhost:5173/ and keep the terminal running. Configure your Supabase Site URL as `http://localhost:5173` and allow redirect URL `http://localhost:5173/`.

## Features and current status

- Email sign-up, confirmation, sign-in, password recovery, and sign-out.
- Responsive indigo/violet workspace with sample documents and source citations.
- Supabase Storage integration for private PDF/TXT/Markdown uploads, downloads, and deletion; apply the migration before using it on a new project.
- Text excerpt search for TXT/Markdown. PDFs are stored but not yet extracted or indexed.
- Conversations currently remain in memory and reset on refresh.

The storage migration was submitted to the development project, but its final result and live upload/ownership tests still need verification. Do not treat a passing frontend build as proof of cross-account isolation.

## Storage setup

Run `supabase/migrations/20261102_private_documents.sql` once in the Supabase SQL editor. It creates a private bucket, a 10 MB file limit, and owner-folder policies. Existing buckets are not overwritten. See [storage instructions](frontend/STORAGE_SETUP.md) for behavior and verification steps.

## Checks

```powershell
cd frontend
npm run build
node --test src/lib/fileRules.test.mjs
```

## Project files

- `frontend/`: website and Supabase client integration.
- `supabase/migrations/`: database/storage configuration.
- `deliverables/`: PRD and beginner architecture diagram.
- [Authentication setup](frontend/AUTH_SETUP.md)
- [Product requirements](deliverables/Document_Intelligence_PRD.md)

Local environment files, dependency folders, build outputs, runtime logs, and account-setup screenshots are excluded from version control.
