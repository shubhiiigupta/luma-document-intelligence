-- Run once in the Supabase SQL editor. No existing files or policies are deleted.
begin;
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('luma-documents', 'luma-documents', false, 10485760,
  array['application/pdf','text/plain','text/markdown']);

create policy "luma_read_own_files" on storage.objects for select to authenticated
using (bucket_id = 'luma-documents' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "luma_upload_own_files" on storage.objects for insert to authenticated
with check (bucket_id = 'luma-documents' and (storage.foldername(name))[1] = (select auth.uid())::text
  and lower(storage.extension(name)) in ('pdf','txt','md'));
create policy "luma_delete_own_files" on storage.objects for delete to authenticated
using (bucket_id = 'luma-documents' and (storage.foldername(name))[1] = (select auth.uid())::text);

-- Defense against an unrelated permissive policy accidentally exposing this bucket.
create policy "luma_owner_boundary" on storage.objects as restrictive for all to public
using (bucket_id <> 'luma-documents' or (storage.foldername(name))[1] = (select auth.uid())::text)
with check (bucket_id <> 'luma-documents' or (storage.foldername(name))[1] = (select auth.uid())::text);
commit;
