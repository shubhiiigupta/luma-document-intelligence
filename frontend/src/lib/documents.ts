import { supabase } from './supabase'
import type { WorkspaceDocument } from '../data/sampleDocuments'
import { fileType, safeFileName, validateFile } from './fileRules'

const BUCKET = 'luma-documents'
function storage() {
  if (!supabase) throw new Error('Storage is not configured.')
  return supabase.storage.from(BUCKET)
}
function fromObject(path: string, id: string, size: number): WorkspaceDocument {
  const storedName = path.split('/').pop()!
  const name = storedName.slice(38) || storedName
  return { id, path, name, sample: false, content: '', size: `${Math.max(1, Math.ceil(size / 1024))} KB`,
    description: name.toLowerCase().endsWith('.pdf') ? 'Saved privately · PDF search coming next' : 'Saved privately · text search available' }
}
export async function listDocuments(userId: string) {
  const documents: WorkspaceDocument[] = []
  for (let offset = 0; ; offset += 100) {
    const { data, error } = await storage().list(userId, { limit: 100, offset, sortBy: { column: 'name', order: 'asc' } })
    if (error) throw error
    for (const object of data) if (object.id) documents.push(fromObject(`${userId}/${object.name}`, object.id, Number(object.metadata?.size ?? 0)))
    if (data.length < 100) return documents
  }
}
export async function uploadDocument(userId: string, file: File) {
  const type = validateFile(file.name, file.size)
  const path = `${userId}/${crypto.randomUUID()}--${safeFileName(file.name)}`
  const { data, error } = await storage().upload(path, file, { contentType: type, upsert: false })
  if (error) throw error
  return fromObject(path, data.id, file.size)
}
export async function readDocument(document: WorkspaceDocument) {
  if (!document.path || document.content || fileType(document.name) === 'application/pdf') return document
  const { data, error } = await storage().download(document.path)
  if (error) throw error
  return { ...document, content: await data.text() }
}
export async function downloadDocument(document: WorkspaceDocument) {
  if (!document.path) return
  const { data, error } = await storage().download(document.path)
  if (error) throw error
  const url = URL.createObjectURL(data)
  const anchor = window.document.createElement('a')
  anchor.href = url; anchor.download = document.name; anchor.click()
  window.setTimeout(() => URL.revokeObjectURL(url), 10000)
}
export async function deleteDocument(document: WorkspaceDocument) {
  if (!document.path) return
  const { data, error } = await storage().remove([document.path])
  if (error) throw error
  if (!data.length) throw new Error('The file was not deleted. Refresh and try again.')
}
