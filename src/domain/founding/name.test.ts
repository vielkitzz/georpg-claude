import {
  composeOfficialCountryName,
  nameKey,
  slugify,
  validateNationName,
  validateShortName,
} from './name'

const base = { article: 'de' as const, shortName: 'Valéria' }

describe('composeOfficialCountryName', () => {
  it('monarquia → Reino', () => {
    expect(
      composeOfficialCountryName({ ...base, governmentForm: 'monarquia', stateForm: 'unitario' }),
    ).toBe('Reino de Valéria')
  })

  it('teocracia → Estado Teocrático', () => {
    expect(
      composeOfficialCountryName({
        ...base,
        article: 'da',
        governmentForm: 'teocracia',
        stateForm: 'unitario',
      }),
    ).toBe('Estado Teocrático da Valéria')
  })

  it('república federal → República Federativa', () => {
    expect(
      composeOfficialCountryName({
        ...base,
        article: 'do',
        governmentForm: 'republica',
        stateForm: 'federal',
      }),
    ).toBe('República Federativa do Valéria')
  })

  it('república confederada → Confederação', () => {
    expect(
      composeOfficialCountryName({
        ...base,
        governmentForm: 'republica',
        stateForm: 'confederado',
      }),
    ).toBe('Confederação de Valéria')
  })

  it('demais repúblicas → República', () => {
    expect(
      composeOfficialCountryName({ ...base, governmentForm: 'republica', stateForm: 'unitario' }),
    ).toBe('República de Valéria')
  })

  it('monarquia e teocracia ignoram a forma de Estado', () => {
    expect(
      composeOfficialCountryName({ ...base, governmentForm: 'monarquia', stateForm: 'federal' }),
    ).toBe('Reino de Valéria')
  })

  it('apara espaços do nome curto', () => {
    expect(
      composeOfficialCountryName({
        ...base,
        shortName: '  Valéria ',
        governmentForm: 'republica',
        stateForm: 'unitario',
      }),
    ).toBe('República de Valéria')
  })
})

describe('nameKey e slugify', () => {
  it('ignora acento, caixa e pontuação', () => {
    expect(nameKey('República de VALÉRIA')).toBe('republica de valeria')
    expect(nameKey("Côte d'Or")).toBe('cote d or')
  })

  it('slug usa hífens', () => {
    expect(slugify('República do São-Paulo')).toBe('republica-do-sao-paulo')
  })
})

describe('validateShortName', () => {
  it('aceita nomes comuns, com acento, hífen e apóstrofo', () => {
    for (const ok of ['Valéria', 'Nova Aurora', 'Saint-Loup', "D'Arc", 'Ål']) {
      expect(validateShortName(ok)).toBeNull()
    }
  })

  it('recusa curto demais, longo demais e caracteres estranhos', () => {
    expect(validateShortName('A')).not.toBeNull()
    expect(validateShortName('x'.repeat(41))).not.toBeNull()
    expect(validateShortName('Rei<script>')).not.toBeNull()
    expect(validateShortName('123 Terra')).not.toBeNull()
    expect(validateShortName('Dois  espaços')).not.toBeNull()
  })

  it('recusa nomes reservados, mesmo com acento ou caixa diferentes', () => {
    expect(validateShortName('Teste')).toBe('Esse nome é reservado.')
    expect(validateShortName('GEORPG')).toBe('Esse nome é reservado.')
    expect(validateShortName('Administração')).toBe('Esse nome é reservado.')
  })
})

describe('validateNationName', () => {
  const input = { ...base, governmentForm: 'republica' as const, stateForm: 'unitario' as const }

  it('devolve nome oficial, chave e slug', () => {
    const result = validateNationName(input, new Set())
    expect(result).toEqual({
      error: null,
      officialName: 'República de Valéria',
      key: 'republica de valeria',
      slug: 'republica-de-valeria',
    })
  })

  it('recusa nome já usado', () => {
    expect(validateNationName(input, new Set(['republica de valeria'])).error).toBe(
      'Já existe uma nação com esse nome.',
    )
  })

  it('o mesmo nome curto em outra forma de governo não colide', () => {
    const taken = new Set(['republica de valeria'])
    expect(validateNationName({ ...input, governmentForm: 'monarquia' }, taken).error).toBeNull()
  })
})
