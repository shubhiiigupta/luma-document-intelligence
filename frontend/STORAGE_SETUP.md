# Luma private storage

## Database setup

Apply `supabase/migrations/20261102_private_documents.sql` once in the project's SQL editor. It creates a private `luma-documents` bucket with a 10 MB per-file limit and owner-folder access policies. It does not delete existing data or change unrelated buckets. If the bucket already exists, the transaction fails rather than silently replacing its configuration.

Only authenticated users can upload, list, read, or delete files in their own UUID folder. No public bucket, service-role key, or server secret is used by the frontend. File overwrite/update has no permissive policy.

Storage already records file IDs, paths, sizes, creation dates and ownership in `storage.objects`. This milestone uses those records directly, avoiding inconsistent copies in a second table. A processing/jobs table will be added with PDF extraction and indexing.

## Application behavior

- Upload PDF, TXT, or Markdown, up to 10 MB; empty files are rejected.
- Filenames are normalized for safe storage paths, prefixed with a unique UUID to prevent collisions.
- Files remain after refresh/sign-out. Sample documents remain clearly marked.
- TXT/Markdown content downloads only when opened or searched. Search is limited to 20 selected sources per question.
- PDFs can be stored and downloaded; they are not parsed or indexed yet.
- Delete asks for confirmation, removes the stored file, and clears related in-memory conversations. Deletion cannot be undone in Luma.
- Conversations are still temporary. Upload failures are displayed per file; successful uploads remain saved.

## Verification checklist

1. Upload a harmless TXT, MD and PDF. Refresh; check names and sizes persist.
2. Open a TXT/MD source, ask about its content, and download a copy.
3. Cancel deletion and verify the file remains; confirm deletion only for a disposable test file, then refresh.
4. Sign in with a second test account: the first account's files must not appear.
5. With the second account's session, attempts to download/delete/upload into the first account's folder must be denied by Storage policies. Signed-out downloads must also be denied.
6. Check invalid file types, empty files and files above 10 MB are rejected. Test a network interruption and retry.

Local file validation tests: `node --test src/lib/fileRules.test.mjs` from `frontend`.
Build: `npm run build`.

Real storage and cross-account tests require the migration to be applied and appropriate signed-in test sessions. A passing build does not verify the deployed policies.
