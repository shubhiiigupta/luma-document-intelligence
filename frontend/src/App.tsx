import { useEffect, useRef, useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import { Icon, Spark } from './components/Icons'
import { sampleDocuments, searchDocuments } from './data/sampleDocuments'
import type { WorkspaceDocument } from './data/sampleDocuments'
import { listDocuments, uploadDocument, readDocument, downloadDocument, deleteDocument } from './lib/documents'
import './App.css'

type Conversation = { id: string; question: string; sourceIds: string[] }
type Panel = 'source' | 'help' | 'search' | null

function App({ userId, email, onSignOut, signingOut }: { userId: string; email: string; onSignOut: () => Promise<void>; signingOut: boolean }) {
  const [documents, setDocuments] = useState<WorkspaceDocument[]>(sampleDocuments)
  const [selectedIds, setSelectedIds] = useState(sampleDocuments.map((document) => document.id))
  const [question, setQuestion] = useState('')
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const [view, setView] = useState<'chat' | 'documents'>('chat')
  const [panel, setPanel] = useState<Panel>(null)
  const [sourceId, setSourceId] = useState(sampleDocuments[0].id)
  const [scopeOpen, setScopeOpen] = useState(false)
  const [mobileNav, setMobileNav] = useState(false)
  const [lightMode, setLightMode] = useState(false)
  const [search, setSearch] = useState('')
  const [notice, setNotice] = useState('')
  const [fileBusy, setFileBusy] = useState(false)
  const [loadingFiles, setLoadingFiles] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [reloadFiles, setReloadFiles] = useState(0)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const dialogRef = useRef<HTMLDialogElement>(null)

  const activeConversation = conversations.find((item) => item.id === activeId)
  const results = activeConversation ? searchDocuments(activeConversation.question, documents.filter((document) => activeConversation.sourceIds.includes(document.id))) : []
  const source = documents.find((document) => document.id === sourceId)
  const searchResults = documents.filter((document) => document.name.toLowerCase().includes(search.toLowerCase()))
  const readableCount = documents.filter((document) => document.content).length

  useEffect(() => {
    let active = true
    setLoadingFiles(true); setLoadError('')
    listDocuments(userId).then((saved) => {
      if (!active) return
      setDocuments([...sampleDocuments, ...saved])
      setSelectedIds([...sampleDocuments.map((item) => item.id), ...saved.map((item) => item.id)])
    }).catch(() => { if (active) setLoadError('Could not load your saved files. Check your connection and storage setup, then retry.') })
      .finally(() => { if (active) setLoadingFiles(false) })
    return () => { active = false }
  }, [userId, reloadFiles])

  useEffect(() => {
    if (panel) dialogRef.current?.showModal()
    else dialogRef.current?.close()
  }, [panel])

  useEffect(() => {
    function handleKey(event: KeyboardEvent) {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setPanel('search')
      }
      if (event.key === 'Escape') { setScopeOpen(false); setMobileNav(false) }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [])

  function newChat() {
    setActiveId(null); setQuestion(''); setView('chat'); setMobileNav(false); setNotice('')
    inputRef.current?.focus()
  }

  async function ask(event: FormEvent) {
    event.preventDefault()
    if (!question.trim() || fileBusy || loadingFiles) return
    if (!selectedIds.length) { setNotice('Select at least one document using the selector below.'); return }
    if (selectedIds.length > 20) { setNotice('Select up to 20 documents for text search.'); return }
    setFileBusy(true)
    try {
      const loaded = await Promise.all(documents.filter((item) => selectedIds.includes(item.id)).map(readDocument))
      setDocuments((previous) => previous.map((item) => loaded.find((entry) => entry.id === item.id) ?? item))
    } catch { setNotice('Could not read a selected file. Check your connection and try again.'); return }
    finally { setFileBusy(false) }
    const conversation = { id: crypto.randomUUID(), question: question.trim(), sourceIds: [...selectedIds] }
    setConversations((previous) => [conversation, ...previous])
    setActiveId(conversation.id); setQuestion(''); setNotice(''); setScopeOpen(false); setView('chat')
  }

  async function addFiles(event: ChangeEvent<HTMLInputElement>) {
    const input = event.currentTarget
    const files = Array.from(input.files ?? [])
    input.value = ''
    if (fileBusy || loadingFiles) return
    setFileBusy(true); setNotice('Uploading files…')
    let saved = 0
    const failures: string[] = []
    try {
      for (const file of files) {
        try {
          const document = await uploadDocument(userId, file)
          setDocuments((previous) => [...previous, document])
          setSelectedIds((previous) => [...previous, document.id])
          saved++
        } catch (error) { failures.push(`${file.name}: ${error instanceof Error ? error.message : 'Upload failed. Please retry.'}`) }
      }
      setNotice([saved ? `${saved} file(s) saved privately to your account.` : '', ...failures].filter(Boolean).join(' '))
    } finally { setFileBusy(false) }
  }

  async function showSource(id: string) {
    const document = documents.find((item) => item.id === id)
    if (!document || fileBusy) return
    setFileBusy(true)
    try {
      const loaded = await readDocument(document)
      setDocuments((previous) => previous.map((item) => item.id === id ? loaded : item))
      setSourceId(id); setPanel('source')
    } catch { setNotice('Could not open this file. Check your connection and retry.') }
    finally { setFileBusy(false) }
  }
  async function saveCopy(document: WorkspaceDocument) {
    setFileBusy(true)
    try { await downloadDocument(document) }
    catch { setNotice('Download failed. Please try again.') }
    finally { setFileBusy(false) }
  }
  async function removeFile(document: WorkspaceDocument) {
    if (!window.confirm(`Permanently delete "${document.name}" from your account? This cannot be undone.`)) return
    setFileBusy(true)
    try {
      await deleteDocument(document)
      setDocuments((previous) => previous.filter((item) => item.id !== document.id))
      setSelectedIds((previous) => previous.filter((id) => id !== document.id))
      setConversations((previous) => previous.filter((item) => !item.sourceIds.includes(document.id)))
      setActiveId(null)
      if (sourceId === document.id) setPanel(null)
      setNotice('Document deleted from your storage.')
    } catch { setNotice('Could not delete this document. Refresh the library and try again.') }
    finally { setFileBusy(false) }
  }

  function toggleDocument(id: string) { setSelectedIds((previous) => previous.includes(id) ? previous.filter((item) => item !== id) : [...previous, id]) }

  const prompts = [
    { icon: 'file' as const, title: 'Find the key points', description: 'Get to the heart of a document.', prompt: 'Summarize the product handbook.' },
    { icon: 'layers' as const, title: 'Connect the dots', description: 'Explore ideas across your sources.', prompt: 'What do these documents say about citations?' },
    { icon: 'quote' as const, title: 'Find the exact detail', description: 'An answer. A source to back it up.', prompt: 'How long are deleted files retained?' },
  ]

  return (
    <div className={`app-shell${lightMode ? ' light-mode' : ''}`}>
      <a className="skip-link" href="#workspace">Skip to workspace</a>
      {mobileNav && <button className="nav-scrim" aria-label="Close navigation" onClick={() => setMobileNav(false)} />}
      <aside className={`sidebar${mobileNav ? ' is-open' : ''}`} aria-label="Main navigation">
        <button className="brand" onClick={newChat} aria-label="Luma home"><span className="brand-mark"><Spark /></span><span>luma<span className="brand-period">.</span></span><span className="brand-label">WORKSPACE</span></button>
        <button className="new-chat-button" onClick={newChat}><Icon name="plus" />New conversation<span>↗</span></button>
        <button className="search-button" onClick={() => setPanel('search')}><Icon name="search" /><span>Search workspace</span><kbd>Ctrl K</kbd></button>
        <nav className="primary-nav" aria-label="Workspace views">
          <button className={`nav-item${view === 'chat' ? ' active' : ''}`} onClick={() => { setView('chat'); setMobileNav(false) }}><Icon name="chat" />Ask your documents</button>
          <button className={`nav-item${view === 'documents' ? ' active' : ''}`} onClick={() => { setView('documents'); setMobileNav(false) }}><Icon name="folder" />Documents<span className="count-badge">{documents.length}</span></button>
        </nav>
        <div className="sidebar-section">
          <div className="section-caption"><span>YOUR SOURCES</span><button className="mini-icon-button" aria-label="Add a document" disabled={fileBusy || loadingFiles || !!loadError} onClick={() => fileRef.current?.click()}><Icon name="plus" /></button></div>
          <div className="sidebar-documents">{documents.slice(0, 5).map((document) => <button key={document.id} className="sidebar-document" onClick={() => showSource(document.id)}><span className="file-icon"><Icon name="file" /></span><span className="document-label"><span>{document.name}</span><small>{document.sample ? 'Sample document' : document.name.toLowerCase().endsWith('.pdf') ? 'Saved PDF' : 'Saved text file'}</small></span></button>)}</div>
          {documents.length > 5 && <button className="text-button" onClick={() => setView('documents')}>View all {documents.length} documents</button>}
        </div>
        <div className="sidebar-section recent-section"><div className="section-caption">RECENT CONVERSATIONS</div>{conversations.length ? conversations.slice(0, 4).map((item) => <button className={`recent-chat${activeId === item.id ? ' selected' : ''}`} key={item.id} onClick={() => { setActiveId(item.id); setView('chat'); setMobileNav(false) }}><Icon name="chat" /><span>{item.question}</span></button>) : <p className="sidebar-empty">A little curiosity starts here.<br />Your conversations will appear here.</p>}</div>
        <div className="sidebar-bottom">
          <div className="sample-note"><Icon name="shield" /><div><strong>A space to explore</strong><p>Try the included sample sources.<br />Your uploads are saved privately.</p></div></div>
          <button className="help-button" onClick={() => setPanel('help')}><Icon name="help" />Getting started<Icon name="arrow-up-right" /></button>
          <div className="profile"><span className="avatar">{email[0].toUpperCase()}</span><div className="account-details"><strong title={email}>{email}</strong><span>Signed in · private files</span></div><button className="account-signout" disabled={signingOut} onClick={() => void onSignOut()}>{signingOut ? 'Leaving…' : 'Sign out'}</button></div>
        </div>
      </aside>

      <main className="workspace" id="workspace">
        <header className="topbar"><div className="breadcrumb"><button className="icon-button mobile-menu" aria-label="Open navigation" onClick={() => setMobileNav(true)}><Icon name="menu" /></button><Icon name="grid" /><span>Personal workspace</span><Icon name="chevron" /><strong>{view === 'chat' ? activeConversation ? 'Conversation' : 'New conversation' : 'Documents'}</strong></div><div className="header-actions"><span className="preview-badge"><span />Private workspace</span><span className="header-divider" /><button className="icon-button" aria-label={lightMode ? 'Switch to dark theme' : 'Switch to light theme'} onClick={() => setLightMode((previous) => !previous)}><Icon name={lightMode ? 'sun' : 'moon'} /></button><button className="icon-button" aria-label="Open source library" onClick={() => setView('documents')}><Icon name="panel" /></button></div></header>
        <div className="main-content">
          {loadingFiles && <p className="notice" role="status">Loading your saved documents…</p>}
          {loadError && <p className="notice" role="alert">{loadError}<button className="text-button" onClick={() => setReloadFiles((value) => value + 1)}>Retry</button></p>}
          {fileBusy && <p className="notice" role="status">Working with your files…</p>}
          {view === 'documents' ? <section className="library-view">
            <div className="library-heading"><div><span className="eyebrow">YOUR KNOWLEDGE LIBRARY</span><h1>A place for your documents.</h1><p>Add a source. Find a little more clarity.</p></div><button className="primary-button" disabled={fileBusy || loadingFiles || !!loadError} onClick={() => fileRef.current?.click()}><Icon name="plus" />Add documents</button></div>
            <p className="library-disclaimer">Uploads are saved privately to your account. PDF, TXT, and Markdown files up to 10 MB. Text search is available; PDF processing and AI answers are coming next.</p>
            <div className="document-grid">{documents.map((document) => <article className="document-card" key={document.id}><div className="document-card-top"><span className="large-file-icon"><Icon name="file" /></span><span className="document-type">{document.sample ? 'SAMPLE' : document.name.toLowerCase().endsWith('.pdf') ? 'PDF' : 'SAVED TEXT'}</span></div><h2>{document.name}</h2><p>{document.description}</p><div className="document-card-footer"><span>{document.size}</span><button onClick={() => showSource(document.id)}>View source<Icon name="arrow-up-right" /></button></div>{!document.sample && <div className="stored-file-actions"><button className="text-button" disabled={fileBusy} onClick={() => void saveCopy(document)}>Download</button><button className="text-button" disabled={fileBusy} onClick={() => void removeFile(document)}>Delete</button></div>}<label className="document-checkbox"><input type="checkbox" checked={selectedIds.includes(document.id)} onChange={() => toggleDocument(document.id)} />Include in questions</label></article>)}</div>
          </section> : <>
            {!activeConversation ? <section className="welcome" aria-labelledby="welcome-title">
              <div className="hero-symbol" aria-hidden="true"><div className="symbol-back" /><div className="symbol-front"><Spark /></div><span className="orbit-spark spark-one">✦</span><span className="orbit-spark spark-two">✧</span></div>
              <span className="eyebrow welcome-eyebrow">A LITTLE CURIOUS? YOU’RE IN THE RIGHT PLACE.</span>
              <h1 id="welcome-title">Your documents.<br /><span>Clear answers.</span></h1>
              <p className="welcome-description">Find the insight in your information.<br />Ask a question, explore an idea, follow the source.</p>
              <div className="prompt-grid">{prompts.map((card) => <button className="prompt-card" key={card.title} onClick={() => { setQuestion(card.prompt); inputRef.current?.focus() }}><span className="prompt-card-icon"><Icon name={card.icon} /></span><strong>{card.title}<Icon name="arrow-up-right" /></strong><span>{card.description}</span></button>)}</div>
              <div className="source-context"><span className="stacked-sources"><Icon name="file" /><Icon name="file" /><Icon name="file" /></span><span><strong>{readableCount} {readableCount === 1 ? 'source' : 'sources'}</strong> ready to explore</span><span className="context-dot" /><button onClick={() => setView('documents')}>View documents<Icon name="chevron" /></button></div>
            </section> : <section className="conversation-view" aria-live="polite"><div className="conversation-heading"><span className="eyebrow">YOUR CONVERSATION</span><button className="text-button" onClick={newChat}><Icon name="plus" />Start fresh</button></div><h1>{activeConversation.question}</h1>
              <article className="answer"><div className="answer-heading"><span className="answer-symbol"><Spark /></span><strong>From your sources</strong><span className="answer-mode">Local excerpt search</span></div>
                {results.length ? <><p className="answer-intro">Here are the relevant passages from your selected documents.</p>{results.map((result, index) => <div className="answer-passage" key={`${result.document.id}-${result.line}`}><p>{result.text}</p><button className="citation" onClick={() => showSource(result.document.id)}><span>{index + 1}</span>{result.document.name} · line {result.line}<Icon name="arrow-up-right" /></button></div>)}</> : <div className="no-evidence"><Icon name="search" /><h2>No matching evidence found</h2><p>Try wording from a selected text document. PDF processing and AI-generated answers will be connected when the backend is built.</p></div>}
                <div className="answer-footnote"><Icon name="info" /><span>This preview shows matching text, not an AI-generated answer. Open a citation to check the original source.</span></div>
              </article>
            </section>}
            <section className="composer-section" aria-label="Ask your documents">
              {notice && <p className="notice" role="status"><Icon name="info" /><span>{notice}</span><button className="mini-icon-button" aria-label="Dismiss notification" onClick={() => setNotice('')}><Icon name="close" /></button></p>}
              <form className="composer" onSubmit={ask}><label className="sr-only" htmlFor="question">Ask a question about your documents</label><textarea id="question" ref={inputRef} value={question} maxLength={2000} rows={2} placeholder={activeConversation ? 'Ask another question…' : 'Ask anything about your documents…'} onChange={(event) => setQuestion(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) { event.preventDefault(); event.currentTarget.form?.requestSubmit() } }} />
                <div className="composer-toolbar"><div className="composer-tools"><button className="attach-button" type="button" aria-label="Attach documents" disabled={fileBusy || loadingFiles || !!loadError} onClick={() => fileRef.current?.click()}><Icon name="paperclip" /></button><span className="toolbar-divider" /><div className="scope-control"><button className={`scope-button${scopeOpen ? ' is-active' : ''}`} type="button" aria-expanded={scopeOpen} aria-controls="document-scope" onClick={() => setScopeOpen((previous) => !previous)}><Icon name="layers" />{selectedIds.length === documents.length ? 'All documents' : `${selectedIds.length} selected`}<Icon name="down" /></button>{scopeOpen && <div className="scope-menu" id="document-scope"><strong>Search these documents</strong>{documents.map((document) => <label key={document.id}><input type="checkbox" checked={selectedIds.includes(document.id)} onChange={() => toggleDocument(document.id)} /><span>{document.name}</span></label>)}</div>}</div></div><div className="send-tools"><span>Enter to ask</span><button className="send-button" type="submit" aria-label="Send question" disabled={!question.trim() || fileBusy || loadingFiles}><Icon name="arrow-up" /></button></div></div>
              </form><div className="composer-caption"><span><Icon name="shield" />Grounded in your sources. Built for your curiosity.</span><span className="preview-caption">Text search · no AI connected</span></div>
            </section>
          </>}
          {view === 'documents' && notice && <p className="notice" role="status"><Icon name="info" />{notice}</p>}
        </div>
        <footer className="workspace-footer"><span>LESS SEARCHING. MORE UNDERSTANDING.</span><button onClick={() => setPanel('help')}>How it works<Icon name="arrow-up-right" /></button></footer>
      </main>

      <input className="sr-only" type="file" ref={fileRef} multiple accept=".pdf,.txt,.md" aria-label="Choose documents" onChange={addFiles} />
      <dialog ref={dialogRef} className={`workspace-dialog${panel === 'source' ? ' source-dialog' : ''}`} onCancel={() => setPanel(null)} onClick={(event) => { if (event.target === event.currentTarget) setPanel(null) }} aria-labelledby="dialog-title">
        <div className="dialog-heading"><span className="eyebrow">{panel === 'source' ? 'SOURCE LIBRARY' : panel === 'search' ? 'YOUR WORKSPACE' : 'WELCOME TO LUMA'}</span><button className="icon-button" aria-label="Close dialog" onClick={() => setPanel(null)}><Icon name="close" /></button></div>
        {panel === 'source' && source ? <><h2 id="dialog-title">{source.name}</h2><p className="dialog-subtitle">{source.sample ? 'Included sample · available to explore' : 'Private file · saved to your account'}</p><div className="source-text">{source.content ? source.content.split('\n').map((line, index) => <div className="source-line" key={index}><span>{index + 1}</span><p>{line || '\u00a0'}</p></div>) : <p>This file is saved privately. PDF text extraction is coming next. Use Download in the document library to read the original. Empty text files have no passages to display.</p>}</div><div className="dialog-actions"><button className="secondary-button" onClick={() => { setPanel(null); setView('documents') }}>View all documents</button><button className="primary-button" disabled={!source.content} onClick={() => { setSelectedIds([source.id]); setPanel(null); setView('chat') }}>Ask about this source<Icon name="arrow-up-right" /></button></div></> : panel === 'search' ? <><h2 id="dialog-title">Find a document</h2><div className="workspace-search"><Icon name="search" /><input autoFocus value={search} onChange={(event) => setSearch(event.target.value)} aria-label="Search document names" placeholder="Search document names…" /></div><div className="search-results">{searchResults.length ? searchResults.map((document) => <button key={document.id} onClick={() => showSource(document.id)}><Icon name="file" /><span>{document.name}<small>{document.sample ? 'Sample document' : 'Private file'}</small></span><Icon name="arrow-up-right" /></button>) : <p>No documents match “{search}”.</p>}</div></> : <><h2 id="dialog-title">A little guidance to get started.</h2><p className="dialog-subtitle">Your private document workspace, with sample sources to explore.</p><ol className="help-steps"><li><strong>Explore a source</strong><span>Three sample Markdown documents are included. Open one from the sidebar.</span></li><li><strong>Ask a question</strong><span>Choose a suggested prompt or use words from a source. The preview finds matching excerpts and their line references.</span></li><li><strong>Make it your own</strong><span>Upload PDF, TXT, or Markdown files. Your files remain after refresh. Conversations are still temporary.</span></li></ol><p className="help-note">Next build step: PDF processing, semantic search, and AI answers. Current search shows matching text excerpts.</p><button className="primary-button" onClick={() => setPanel(null)}>Let’s explore<Icon name="arrow-up-right" /></button></>}
      </dialog>
    </div>
  )
}

export default App
