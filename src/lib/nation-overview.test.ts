import { calculateApproval } from '@/domain/founding/approval'
import { generateInitialConditions } from '@/domain/founding/generator'
import { AXIS_IDS, type AxisScores } from '@/domain/ideology/axes'
import { analyzeCoherence, initialLegitimacy } from '@/domain/ideology/coherence'
import { profileFixture } from '@/test/nation-profile'
import { nationOverview } from './nation-overview'

const scores = {
  ...Object.fromEntries(AXIS_IDS.map((id) => [id, 50])),
  democratico_autocratico: 99,
  progressista_tradicional: 2,
  aceleracao_cautela: 92,
  protecionismo_livrecomercio: 11,
} as AxisScores
const institutions = {
  governmentForm: 'republica',
  regime: 'democratico',
  stateForm: 'unitario',
  localSelection: 'eleitos',
} as const
const penalty = analyzeCoherence(scores, institutions).penalty
const legitimacy = initialLegitimacy(institutions.localSelection, penalty)
const profile = {
  ...profileFixture,
  symbols: {
    ...profileFixture.symbols,
    ideologyProfile: scores,
    localGovernorSelection: institutions.localSelection,
  },
  politics: { ...profileFixture.politics, ...institutions, legitimacy, coherencePenalty: penalty },
}
const overview = (at: string) => nationOverview(profile, new Date(at))

it('usa no painel o mesmo cálculo de aprovação do gerador', () => {
  const initial = generateInitialConditions({
    ...institutions,
    seed: 'nacao:3',
    system: 'presidencialismo',
    ideology: 'liberal_classico',
    legitimacy,
    legitimacyPenalty: -penalty,
  })
  expect(overview('2026-11-20T10:59:00Z').approval).toBe(initial.approval)
  expect(initial.approval).toBe(legitimacy - penalty + 5)
  expect(calculateApproval(99, 0, 'eleitos')).toBe(100)
  expect(calculateApproval(4, -10, 'nomeados')).toBe(0)
})

it('ordena os quatro eixos pela distância do centro e produz retrato e bússola', () => {
  const result = overview('2026-11-20T10:59:00Z')
  expect(result.axes.map((axis) => axis.value)).toEqual([99, 2, 92, 11])
  expect(result.axes[0].label).toBe('Democrático ↔ Autocrático')
  expect(result.portrait).toContain('decisões rápidas')
  expect(result.compass).not.toBeNull()
})

it.each([
  ['2026-11-20T10:59:59Z', '2026-11-20T11:00:00.000Z'],
  ['2026-11-20T11:00:00Z', '2026-11-21T11:00:00.000Z'],
  ['2026-11-20T11:00:01Z', '2026-11-21T11:00:00.000Z'],
])('calcula o próximo tick após %s', (now, expected) => {
  expect(overview(now).nextTick.toISOString()).toBe(expected)
})

it('exibe os três eventos mais recentes pela data do mundo', () => {
  const events = [0, 9, 3, 12].map((tickIndex) => ({
    title: String(tickIndex),
    tickIndex,
    type: 'politica',
    year: null,
  }))
  const result = nationOverview(
    { ...profile, politics: { ...profile.politics, events } },
    new Date(0),
  )
  expect(result.events.map((event) => event.title)).toEqual(['12', '9', '3'])
  expect(result.events[0].date).toBe('Janeiro de 1921')
})
