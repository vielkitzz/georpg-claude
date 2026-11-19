import { useEffect, useState } from 'react'
import { getSupabase } from '@/auth/supabase'
import { geography } from '@/data/gauzoland'
import type { TerritoryClaim } from '@/domain/types'
import { WorldMap } from '@/ui/map/WorldMap'

type Status = 'loading' | 'ready' | 'error'

/** Reads actual claims, never demo data. Server must revalidate when founding. */
export function TerritoryPicker({ selectedId, onSelect, onAvailability }: {
  selectedId: number | null
  onSelect: (id: number | null) => void
  onAvailability: (available: boolean) => void
}) {
  const [status, setStatus] = useState<Status>('loading')
  const [claims, setClaims] = useState<TerritoryClaim[]>([])
  const [retry, setRetry] = useState(0)

  useEffect(() => {
    const client = getSupabase()
    if (!client) { setStatus('error'); return }
    let active = true
    client.from('territory_claims').select('territory_id,nation_id,name,color').then(({ data, error }) => {
      if (!active) return
      if (error || !data) {
        setStatus('error')
        return
      }
      setClaims(data.map(row => ({
        territoryId: row.territory_id as number,
        nationId: row.nation_id as string,
        name: row.name as string,
        color: row.color as string,
      })))
      setStatus('ready')
    })
    return () => { active = false }
  }, [retry])

  const claimed = new Set(claims.map(claim => claim.territoryId))
  const selected = geography.states.find(state => state.id === selectedId)
  const available = status === 'ready' && !!selected && !claimed.has(selected.id)

  useEffect(() => { onAvailability(available) }, [available, onAvailability])

  return <div className="space-y-4">
    <p className="text-sm text-muted">Escolha um território livre no mapa ou na lista. Territórios ocupados não estão disponíveis.</p>
    {status === 'loading' && <p role="status">Carregando territórios…</p>}
    {status === 'error' && <div role="alert">
      <p>Não foi possível verificar a disponibilidade. A seleção está bloqueada.</p>
      <button type="button" className="underline" onClick={() => { setStatus('loading'); setRetry(n => n + 1) }}>Tentar novamente</button>
    </div>}
    {status === 'ready' && <>
      <WorldMap claims={claims} selectedId={selectedId} onSelect={onSelect} />
      <label className="block space-y-2 text-sm">
        <span>Territórios disponíveis</span>
        <select aria-label="Escolher território" className="w-full rounded-md border border-line bg-bg px-3 py-2" value={selectedId ?? ''} onChange={e => onSelect(e.target.value ? Number(e.target.value) : null)}>
          <option value="">Selecione um território</option>
          {geography.states.map(state => <option key={state.id} value={state.id} disabled={claimed.has(state.id)}>
            Território {state.id} ({claimed.has(state.id) ? 'ocupado' : 'livre'}) · {state.provinceIds.length} províncias
          </option>)}
        </select>
      </label>
      {selected && <p role="status" className={available ? 'text-positive' : 'text-warning'}>
        Território {selected.id}: {available ? 'livre' : 'ocupado'} · {selected.provinceIds.length} províncias
      </p>}
      <p className="text-xs text-muted">A disponibilidade será validada novamente pelo servidor no momento da fundação.</p>
    </>}
  </div>
}
