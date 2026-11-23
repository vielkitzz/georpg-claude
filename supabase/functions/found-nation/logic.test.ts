// @vitest-environment node
import { nameKey } from '../../../src/domain/founding/name'
import type { FoundingDraft } from '../../../src/domain/founding/draft'
import { QUESTIONS, analyzeCoherence, scoreQuiz, topThree } from '../../../src/domain/ideology'
import { decodeSymbolImage, symbolPath } from './images'
import {
  makePreviewToken,
  matchesPreview,
  prepareFounding,
  randomQuizForRole,
  setupError,
} from './logic'

const png =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR4nGNQCu34DwADmwH/RyECiQAAAABJRU5ErkJggg=='

function draft(): FoundingDraft {
  const answers = Object.fromEntries(
    QUESTIONS.map(({ id, polarity, axis }) => [
      id,
      axis === 'democratico_autocratico' && polarity === -1 ? 1 : 5,
    ]),
  ) as FoundingDraft['answers']
  return {
    territoryId: 1,
    shortName: 'Valdris',
    article: 'de',
    capital: 'Nova Aurora',
    currencyCode: 'VL',
    currencyName: 'Valdor',
    answers,
    ideology: topThree(scoreQuiz(answers))[0].archetype.id,
    institutions: {
      governmentForm: 'republica',
      regime: 'democratico',
      system: 'parlamentarismo',
      stateForm: 'federal',
      firstLevel: 'Estados',
      secondLevel: 'Comunas',
      localSelection: 'eleitos',
      leadershipBasis: 'eleito_indireto',
      headOfState: { title: 'Cônsul', name: 'Iara Aurora' },
      headOfGovernment: { title: 'Chanceler', name: 'Rui Valdor' },
    },
    symbols: {
      flag: '',
      coatOfArms: '',
      color: '#122abc',
      anthem: 'Rio azul',
      emblem: 'Ipê',
      motto: 'Paz e mar',
      description: 'Povo costeiro',
      history: 'Fundada no litoral.',
    },
  }
}

function prepared(draftInput = draft(), tick = 0) {
  const result = prepareFounding(draftInput, tick)
  if ('error' in result) throw new Error(result.error)
  return result
}

it('usa as mesmas condições determinísticas, legitimidade e identidade na prévia e no RPC', () => {
  const input = draft()
  const { preview, fields } = prepared(input)
  expect(prepared(input)).toEqual({ preview, fields })
  expect(preview.officialName).toBe('República Federativa de Valdris')
  expect(preview.year).toBe(1920)
  expect(prepared(input, 12).preview.year).toBe(1921)
  expect(preview).toEqual({
    officialName: fields.p_name,
    year: fields.p_founded_year,
    population: fields.p_economy.population,
    gdp: fields.p_economy.gdp,
    approval: fields.p_society.approval,
    legitimacy: fields.p_politics.legitimacy,
    ministries: fields.p_politics.ministries.length,
    chambers: fields.p_politics.chambers.length,
  })
  expect(preview.population).toBe(1_000_000)
  expect(fields.p_name_key).toBe(nameKey(preview.officialName))
  expect(fields.p_politics.coherencePenalty).toBe(
    analyzeCoherence(scoreQuiz(input.answers), input.institutions).penalty,
  )
  expect(preview.legitimacy).toBe(55 + 5 - fields.p_politics.coherencePenalty)
  expect(fields).toMatchObject({
    p_currency_code: 'VL',
    p_currency_name: 'Valdor',
    p_color: '#122ABC',
    p_anthem: 'Rio azul',
    p_motto: 'Paz e mar',
    p_description: 'Povo costeiro',
    p_history: 'Fundada no litoral.',
    p_symbols: { emblem: 'Ipê' },
    p_politics: { headOfState: { title: 'Cônsul' }, headOfGovernment: { title: 'Chanceler' } },
  })
})

it('vincula a confirmação aos dados, ao jogador e ao tick apresentados', async () => {
  const { fields } = prepared()
  const token = await makePreviewToken('segredo-de-teste', 'jogador-a', fields)
  const verify = (owner: string, data: object, signature: unknown = token) =>
    matchesPreview('segredo-de-teste', owner, data, signature)
  await expect(verify('jogador-a', fields)).resolves.toBe(true)
  await expect(verify('jogador-b', fields)).resolves.toBe(false)
  await expect(verify('jogador-a', { ...fields, p_world_tick: 1 })).resolves.toBe(false)
  await expect(verify('jogador-a', { ...fields, p_currency_code: 'GEO' })).resolves.toBe(false)
  await expect(verify('jogador-a', fields, 'token-inválido')).resolves.toBe(false)
})

it('recusa campos manipulados ou incompletos antes de gerar dados', () => {
  const input = draft()
  expect(setupError({ ...input, shortName: 'Admin' })).toMatch(/reservado/)
  expect(setupError({ ...input, territoryId: 51 })).toMatch(/território/)
  expect(prepareFounding({ ...input, currencyCode: 'vl' }, 0)).toMatchObject({
    error: expect.stringMatching(/maiúsculas/),
  })
  expect(prepareFounding({ ...input, answers: {} }, 0)).toMatchObject({
    error: expect.stringMatching(/36/),
  })
  expect(prepareFounding({ ...input, ideology: null }, 0)).toMatchObject({
    error: expect.stringMatching(/três/),
  })
  expect(
    prepareFounding(
      { ...input, institutions: { ...input.institutions, system: 'concentracao' } },
      0,
    ),
  ).toMatchObject({ error: expect.stringMatching(/sistema/) })
  expect(
    prepareFounding({ ...input, institutions: { ...input.institutions, headOfState: null } }, 0),
  ).toMatchObject({ error: expect.stringMatching(/chefe de Estado/) })
  expect(
    prepareFounding({ ...input, symbols: { ...input.symbols, history: '' } }, 0),
  ).toMatchObject({ error: expect.stringMatching(/História/) })
})

it('permite o sorteio somente ao papel ADMIN e produz 36 respostas válidas', () => {
  for (const role of [undefined, null, 'PLAYER', 'admin'])
    expect(randomQuizForRole(role)).toBeNull()
  const answers = randomQuizForRole('ADMIN')!
  expect(Object.keys(answers)).toHaveLength(36)
  expect(() => scoreQuiz(answers)).not.toThrow()
})

it('valida PNGs e gera endereços de armazenamento estáveis por proprietário e conteúdo', async () => {
  await expect(decodeSymbolImage(btoa('<svg onload="alert(1)"/>'))).resolves.toBeNull()
  await expect(decodeSymbolImage(png.slice(0, -8))).resolves.toBeNull()
  const image = await decodeSymbolImage(png)
  expect(image).not.toBeNull()
  if (!image) throw new Error('PNG inválido no teste')
  const path = await symbolPath('owner', image)
  expect(path).toMatch(/^owner\/[a-f0-9]{64}\.png$/)
  await expect(symbolPath('owner', image)).resolves.toBe(path)
  await expect(symbolPath('other', image)).resolves.not.toBe(path)
})
