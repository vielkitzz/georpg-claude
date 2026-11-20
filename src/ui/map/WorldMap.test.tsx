import { fireEvent, render, screen } from '@testing-library/react'
import { useState } from 'react'
import { geography } from '@/data/gauzoland'
import type { TerritoryClaim } from '@/domain/types'
import { TerritoryList } from './TerritoryList'
import { MAP_UNOWNED, WorldMap } from './WorldMap'

const claims: TerritoryClaim[] = [
  { territoryId: 3, nationId: 'demo', name: 'Teste', color: '#F98B87' },
]

function Harness({ initial = null }: { initial?: number | null }) {
  const [selected, setSelected] = useState<number | null>(initial)
  return (
    <>
      <WorldMap claims={claims} selectedId={selected} onSelect={setSelected} />
      <TerritoryList
        territories={geography.states}
        claims={claims}
        selectedId={selected}
        onSelect={setSelected}
      />
    </>
  )
}

const territoryPath = (container: HTMLElement, id: number) =>
  container.querySelector(`path[data-territory="${id}"]`) as SVGPathElement

describe('WorldMap', () => {
  it('território sem dono usa #132134 e não tem rótulo de nome', () => {
    const { container } = render(<Harness />)
    expect(territoryPath(container, 1).getAttribute('fill')).toBe(MAP_UNOWNED)
    expect(MAP_UNOWNED).toBe('#132134')
    expect(container.querySelector('[data-label="1"]')).toBeNull()
  })

  it('território com dono usa a cor e o nome do dono', () => {
    const { container } = render(<Harness />)
    expect(territoryPath(container, 3).getAttribute('fill')).toBe('#F98B87')
    expect(container.querySelector('[data-label="3"]')?.textContent).toBe('Teste')
  })

  it('fronteiras entre estados usam a cor do fundo', () => {
    const { container } = render(<Harness />)
    expect(territoryPath(container, 1).getAttribute('stroke')).toBe('#03111a')
  })

  it('traços não escalam com o zoom', () => {
    const { container } = render(<Harness />)
    expect(territoryPath(container, 1).getAttribute('vector-effect')).toBe('non-scaling-stroke')
  })

  it('não desenha linhas de rios', () => {
    const { container } = render(<Harness />)
    expect(container.querySelector('[data-river]')).toBeNull()
  })

  it('províncias só aparecem com um estado selecionado', () => {
    const { container } = render(<Harness />)
    expect(container.querySelectorAll('path[data-province]')).toHaveLength(0)

    fireEvent.click(screen.getByRole('button', { name: /Território 1\b/ }))
    const expected = geography.provinces.filter((p) => p.stateId === 1).length
    expect(expected).toBeGreaterThan(0)
    expect(container.querySelectorAll('path[data-province]')).toHaveLength(expected)

    fireEvent.click(screen.getByRole('button', { name: /Território 1\b/ }))
    expect(container.querySelectorAll('path[data-province]')).toHaveLength(0)
  })

  it('a lista mostra "Sem nome" quando o território não tem nome', () => {
    render(<Harness />)
    const row = screen.getByRole('button', { name: /Território 1\b/ })
    expect(row).toHaveTextContent('Sem nome')
    expect(screen.getByRole('button', { name: /Território 3\b/ })).toHaveTextContent('Teste')
  })

  it('o painel de detalhes mostra número, províncias e dono', () => {
    render(<Harness initial={1} />)
    expect(screen.getByText('Território nº 1')).toBeInTheDocument()
    expect(screen.getByText('Sem dono')).toBeInTheDocument()
  })

  it('os botões de zoom existem e são nomeados', () => {
    render(<Harness />)
    for (const name of ['Aproximar', 'Afastar', 'Restaurar enquadramento']) {
      expect(screen.getByRole('button', { name })).toBeInTheDocument()
    }
  })
})
