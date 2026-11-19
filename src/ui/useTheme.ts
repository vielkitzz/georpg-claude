import { useState } from 'react'

export type Theme = 'dark' | 'light'

const STORAGE_KEY = 'georpg-theme'

function readTheme(): Theme {
  return document.documentElement.dataset.theme === 'light' ? 'light' : 'dark'
}

/** Tema escuro por padrão; o claro é opcional e fica em `data-theme` no <html>. */
export function useTheme() {
  const [theme, setTheme] = useState<Theme>(readTheme)

  const apply = (next: Theme) => {
    document.documentElement.dataset.theme = next
    try {
      localStorage.setItem(STORAGE_KEY, next)
    } catch {
      /* sem armazenamento: o tema vale só nesta sessão */
    }
    setTheme(next)
  }

  return { theme, toggle: () => apply(theme === 'dark' ? 'light' : 'dark') }
}
