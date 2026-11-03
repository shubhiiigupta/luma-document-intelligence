export type WorkspaceDocument = {
  id: string
  name: string
  description: string
  content: string
  sample: boolean
  size: string
  path?: string
}

// Real text fixtures for the preview. This local search does not call a model.
export const sampleDocuments: WorkspaceDocument[] = [
  { id: 'sample-handbook', name: 'Product handbook.md', description: 'The essentials of your document workspace.', sample: true, size: 'Sample · 4 passages', content: '# Product handbook\n\nUpload text-based PDFs, TXT files, or Markdown documents into a private workspace. The first release focuses on English documents.\n\nAsk questions across selected documents. Search finds relevant passages, and an AI model will use those passages to write a supported answer once the backend is connected.\n\nEvery factual answer should include citations to the supporting document and its source location. If the sources do not contain the answer, the application should clearly say so.\n\nThe first release includes a document library, processing progress, document questions, source viewing, and deletion.' },
  { id: 'sample-security', name: 'Privacy & security.md', description: 'How document access and deletion should work.', sample: true, size: 'Sample · 4 passages', content: '# Privacy and security\n\nDocuments belong to the user who uploaded them. Both search and source viewing must check ownership before returning any content.\n\nDeleted documents must stop appearing in new searches immediately. The planned backend should remove original files and their indexed passages from live storage within 24 hours. Backup retention will depend on the hosting policy.\n\nDocument text is untrusted content. Instructions found inside a document must not override application rules or authorize access to other documents.\n\nUploaded files are saved in private storage. Text search runs in the browser after authenticated downloads. Conversation history is temporary. AI model calls are not connected yet.' },
  { id: 'sample-research', name: 'Research notes.md', description: 'A practical introduction to reliable retrieval.', sample: true, size: 'Sample · 4 passages', content: '# Research notes\n\nRAG means retrieval-augmented generation. The application first finds relevant source passages and then gives those passages to a language model to help it answer a question.\n\nHybrid search combines keyword matching with semantic search. Keywords help locate exact names and codes; semantic search helps locate related meanings and paraphrased questions.\n\nCitations should point to evidence that genuinely supports the answer. A valid source link alone does not prove that a claim is correct.\n\nEvaluate retrieval, answer correctness, citation support, refusal behavior, response time, and cost. Keep a final set of verified questions separate from the questions used to improve the system.' },
]

const stopWords = new Set(['a', 'an', 'the', 'is', 'are', 'and', 'or', 'to', 'of', 'in', 'on', 'for', 'it', 'do', 'does', 'these', 'this', 'what', 'how', 'about', 'say', 'says', 'with', 'from', 'my', 'your'])

export function searchDocuments(question: string, documents: WorkspaceDocument[]) {
  const terms = question.toLowerCase().match(/[a-z0-9]+/g)?.filter((word) => !stopWords.has(word)) ?? []
  const summarize = /summari[sz]e|summary|key points|overview/.test(question.toLowerCase())
  const titleMatches = documents.filter((document) => terms.some((term) => document.name.toLowerCase().includes(term)))
  const scope = summarize && titleMatches.length ? titleMatches : documents
  const passages = scope.flatMap((document) => document.content.split('\n').flatMap((text, index) => {
    if (!text.trim() || text.startsWith('#')) return []
    const words = new Set(text.toLowerCase().match(/[a-z0-9]+/g)?.map((word) => word.replace(/s$/, '')) ?? [])
    const score = terms.reduce((sum, term) => sum + (words.has(term.replace(/s$/, '')) ? 1 : 0), 0)
    return [{ document, text, line: index + 1, score }]
  }))
  return passages.filter((passage) => summarize || passage.score > 0).sort((a, b) => b.score - a.score).slice(0, 3)
}
