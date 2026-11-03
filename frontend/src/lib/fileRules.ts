export const MAX_FILE_SIZE = 10 * 1024 * 1024
export function fileType(name: string) {
  const extension = name.split('.').pop()?.toLowerCase()
  if (extension === 'pdf') return 'application/pdf'
  if (extension === 'txt') return 'text/plain'
  if (extension === 'md') return 'text/markdown'
  throw new Error('Choose a PDF, TXT, or Markdown file.')
}
export function validateFile(name: string, size: number) {
  const type = fileType(name)
  if (size <= 0) throw new Error('Empty files cannot be uploaded.')
  if (size > MAX_FILE_SIZE) throw new Error('The file exceeds the 10 MB limit.')
  return type
}
export function safeFileName(name: string) {
  const extension = name.split('.').pop()!.toLowerCase()
  const base = name.slice(0, name.lastIndexOf('.')).normalize('NFKD').replace(/[^a-zA-Z0-9._ -]/g, '_').slice(0, 120)
  return `${base || 'document'}.${extension}`
}
