import { queryOptions } from '@tanstack/react-query'
import { getSupabase } from '@/auth/supabase'
import type { NationProfile } from '@/types/nation-profile'

export async function getMyNationProfile(signal?: AbortSignal): Promise<NationProfile | null> {
  const client = getSupabase()
  if (!client) throw new Error('Supabase não configurado')
  const { data, error } = await client.functions.invoke<NationProfile>('my-nation-profile', {
    method: 'GET',
    signal,
  })
  if (error) throw error
  return data
}

export const myNationProfileQuery = queryOptions({
  queryKey: ['my-nation-profile'],
  queryFn: ({ signal }) => getMyNationProfile(signal),
  staleTime: 60_000,
  retry: false,
})
