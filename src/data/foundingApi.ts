import { getSupabase } from '@/auth/supabase'
import type { FoundingDraft, FoundingPreview } from '@/domain/founding/draft'
import type { Answers } from '@/domain/ideology'

interface Failure {
  error: string
  code?: string
}

type Action =
  | { action: 'check' | 'preview'; draft: FoundingDraft }
  | { action: 'confirm'; draft: FoundingDraft; token: string }
  | { action: 'randomQuiz' }

export async function foundNation<T>(body: Action): Promise<T | Failure> {
  const client = getSupabase()
  if (!client) return { error: 'Supabase não configurado.' }
  try {
    const { data, error } = await client.functions.invoke<T>('found-nation', { body })
    if (!error && data) return data
    const context = error && 'context' in error ? error.context : null
    const response = context instanceof Response ? await context.json().catch(() => null) : null
    return {
      error: response?.error ?? 'Não foi possível concluir a operação. Tente novamente.',
      code: response?.code,
    }
  } catch {
    return { error: 'Não foi possível conectar ao servidor. Tente novamente.' }
  }
}

export const checkFounding = (draft: FoundingDraft) =>
  foundNation<{ available: true }>({ action: 'check', draft })
export const previewFounding = (draft: FoundingDraft) =>
  foundNation<{ preview: FoundingPreview }>({ action: 'preview', draft })
export const confirmFounding = (draft: FoundingDraft, token: string) =>
  foundNation<{ nationId: string }>({ action: 'confirm', draft, token })
export const drawQuiz = () => foundNation<{ answers: Answers }>({ action: 'randomQuiz' })
