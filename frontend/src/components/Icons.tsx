import type { ReactNode } from 'react'

type IconName = 'plus' | 'search' | 'chat' | 'folder' | 'file' | 'layers' | 'quote' | 'shield' | 'help' | 'arrow-up-right' | 'grid' | 'chevron' | 'down' | 'moon' | 'sun' | 'panel' | 'paperclip' | 'arrow-up' | 'close' | 'menu' | 'info'

const paths: Record<IconName, ReactNode> = {
  plus: <path d="M12 5v14M5 12h14" />,
  search: <><circle cx="10.8" cy="10.8" r="6.8" /><path d="m16 16 4.5 4.5" /></>,
  chat: <path d="M20 11.5a7.5 7.5 0 0 1-7.5 7.5H5l-3 3v-9.5A7.5 7.5 0 0 1 9.5 5H13a7 7 0 0 1 7 6.5Z" />,
  folder: <path d="M3 7a2 2 0 0 1 2-2h5l2 2h7a2 2 0 0 1 2 2v10H3V7Z" />,
  file: <><path d="M6 3h8l4 4v14H6V3Z" /><path d="M14 3v5h4M9 12h6M9 16h4" /></>,
  layers: <path d="m12 3 9 5-9 5-9-5 9-5ZM3 12l9 5 9-5M3 16l9 5 9-5" />,
  quote: <path d="M4 6h6v7H6c0 3 1 4 3 5M14 6h6v7h-4c0 3 1 4 3 5" />,
  shield: <><path d="m12 3 8 3v6c0 5-8 9-8 9s-8-4-8-9V6l8-3Z" /><path d="m8.5 12 2.5 2.5 4.5-5" /></>,
  help: <><circle cx="12" cy="12" r="9" /><path d="M9.5 9a2.5 2.5 0 0 1 5 0c0 2-2.5 2-2.5 4M12 16.5v.1" /></>,
  'arrow-up-right': <path d="M6 18 18 6M6 6h12v12" />,
  grid: <><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></>,
  chevron: <path d="m9 5 7 7-7 7" />,
  down: <path d="m6 9 6 6 6-6" />,
  moon: <path d="M20 14.2A8.5 8.5 0 0 1 9.8 4 8.5 8.5 0 1 0 20 14.2Z" />,
  sun: <><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5 19 19M5 19l1.5-1.5M17.5 6.5 19 5" /></>,
  panel: <><rect x="3" y="4" width="18" height="16" rx="3" /><path d="M14 4v16" /></>,
  paperclip: <path d="m9 12 5-5a3 3 0 0 1 4 4l-7 7a5 5 0 0 1-7-7l8-8" />,
  'arrow-up': <path d="M12 20V4M5 11l7-7 7 7" />,
  close: <path d="m6 6 12 12M6 18 18 6" />,
  menu: <path d="M4 6h16M4 12h16M4 18h16" />,
  info: <><circle cx="12" cy="12" r="9" /><path d="M12 11v6M12 7v.1" /></>,
}

export function Icon({ name }: { name: IconName }) {
  return <svg className="icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>
}

export function Spark() {
  return <svg viewBox="0 0 48 48" fill="none" aria-hidden="true"><path d="M36.8 10.8 28 23.4l7.3 13.8-13-8.1L9.6 37l8.1-13.1-6.6-12.7 12.6 7.2 13.1-7.6Z" fill="currentColor" /><path d="m36.8 10.8-15 18.3" stroke="white" strokeOpacity=".65" strokeWidth="1.3" /></svg>
}
