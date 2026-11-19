import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {
  ARCHETYPES,
  AXIS_IDS,
  QUESTIONS,
  scoreQuiz,
  topThree,
  type Answer,
  type AxisScores,
} from '@/domain/ideology'
import { Report } from './Report'

const neutral = scoreQuiz(Object.fromEntries(QUESTIONS.map((q) => [q.id, 3 as Answer])))
const institutions = {
  governmentForm: 'republica' as const,
  regime: 'democratico' as const,
  stateForm: 'federal' as const,
  localSelection: 'eleitos' as const,
}

describe('Report', () => {
  it('lista os 12 eixos, agrupados em 4 capítulos', () => {
    render(<Report scores={neutral} selectedIdeology={null} onSelectIdeology={() => {}} />)
    expect(screen.getAllByRole('img', { name: /contra .*: 50 de 100/ })).toHaveLength(
      AXIS_IDS.length,
    )
    for (const chapter of ['Governamental', 'Diplomático', 'Econômico', 'Societal']) {
      expect(screen.getAllByRole('heading', { name: chapter }).length).toBeGreaterThan(0)
    }
  })

  it('mostra as 11 ideologias e só permite escolher entre as 3 primeiras', async () => {
    const onSelect = vi.fn()
    render(<Report scores={neutral} selectedIdeology={null} onSelectIdeology={onSelect} />)
    const radios = screen.getAllByRole('radio')
    expect(radios).toHaveLength(ARCHETYPES.length)
    expect(radios.filter((r) => !(r as HTMLButtonElement).disabled)).toHaveLength(3)
    await userEvent.click(radios[0])
    expect(onSelect).toHaveBeenCalledWith(topThree(neutral)[0].archetype.id)
    await userEvent.click(radios[5])
    expect(onSelect).toHaveBeenCalledTimes(1)
  })

  it('a ideologia selecionada aparece marcada', () => {
    const first = topThree(neutral)[0].archetype.id
    render(<Report scores={neutral} selectedIdeology={first} onSelectIdeology={() => {}} />)
    expect(
      screen.getAllByRole('radio').filter((r) => r.getAttribute('aria-checked') === 'true'),
    ).toHaveLength(1)
  })

  it('a bússola tem descrição acessível com os valores', () => {
    render(<Report scores={neutral} selectedIdeology={null} onSelectIdeology={() => {}} />)
    expect(
      screen.getByRole('img', { name: /Bússola política: economia 50 de 100/ }),
    ).toBeInTheDocument()
  })

  it('sem instituições, não mostra a análise de coerência', () => {
    render(<Report scores={neutral} selectedIdeology={null} onSelectIdeology={() => {}} />)
    expect(screen.queryByRole('heading', { name: 'Análise de coerência' })).toBeNull()
  })

  it('perfil coerente: sem penalidade e legitimidade 60 (eleitos)', () => {
    render(
      <Report
        scores={neutral}
        institutions={institutions}
        selectedIdeology={null}
        onSelectIdeology={() => {}}
      />,
    )
    const panel = screen.getByRole('heading', { name: 'Análise de coerência' }).closest('section')!
    expect(within(panel).getByText(/Nenhuma penalidade/)).toBeInTheDocument()
    expect(within(panel).getByText('60')).toBeInTheDocument()
  })

  it('perfil em tensão lista a causa e desconta a legitimidade', () => {
    const centralist: AxisScores = { ...neutral, federal_unitario: 100 }
    render(
      <Report
        scores={centralist}
        institutions={institutions}
        selectedIdeology={null}
        onSelectIdeology={() => {}}
      />,
    )
    const panel = screen.getByRole('heading', { name: 'Análise de coerência' }).closest('section')!
    expect(
      within(panel).getByText(/governo central forte, mas você fundou um Estado federal/),
    ).toBeInTheDocument()
    expect(within(panel).getByText('55')).toBeInTheDocument()
  })
})
