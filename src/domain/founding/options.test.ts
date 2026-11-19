import {
  firstLevelDivisions,
  localSelectionLegitimacy,
  requiresHeadOfGovernment,
  suggestedLocalSelection,
  validLeadershipBases,
  validSystems,
  validateInstitutions,
  type InstitutionsInput,
} from './options'

describe('validSystems', () => {
  it('absolutismo só admite concentração de poderes', () => {
    expect(validSystems('monarquia', 'absolutista')).toEqual(['concentracao'])
    expect(validSystems('republica', 'absolutista')).toEqual(['concentracao'])
  })

  it('monarquia democrática só admite parlamentarismo', () => {
    expect(validSystems('monarquia', 'democratico')).toEqual(['parlamentarismo'])
  })

  it('democracia nunca usa concentração de poderes', () => {
    for (const form of ['republica', 'teocracia', 'monarquia'] as const) {
      expect(validSystems(form, 'democratico')).not.toContain('concentracao')
    }
  })

  it('república democrática tem as quatro opções restantes', () => {
    expect(validSystems('republica', 'democratico')).toEqual([
      'parlamentarismo',
      'presidencialismo',
      'semipresidencialismo',
      'diretorial',
    ])
  })

  it('regimes não democráticos admitem todos os cinco', () => {
    expect(validSystems('republica', 'autoritario')).toHaveLength(5)
  })
})

describe('validLeadershipBases', () => {
  it('monarquia é sempre hereditária', () => {
    expect(validLeadershipBases('monarquia', 'democratico')).toEqual(['hereditario'])
    expect(validLeadershipBases('monarquia', 'absolutista')).toEqual(['hereditario'])
  })

  it('teocracia é divina ou nomeada', () => {
    expect(validLeadershipBases('teocracia', 'autoritario')).toEqual(['divino', 'nomeado'])
  })

  it('república democrática é eleita (direta ou indireta)', () => {
    expect(validLeadershipBases('republica', 'democratico')).toEqual([
      'eleito_direto',
      'eleito_indireto',
    ])
  })

  it('demais repúblicas: indireta, nomeada ou autoproclamada', () => {
    expect(validLeadershipBases('republica', 'totalitario')).toEqual([
      'eleito_indireto',
      'nomeado',
      'autoproclamado',
    ])
  })
})

describe('divisões e governantes locais', () => {
  it('"Estados" só existe na forma federal', () => {
    expect(firstLevelDivisions('federal')).toEqual(['Estados'])
    expect(firstLevelDivisions('unitario')).not.toContain('Estados')
    expect(firstLevelDivisions('confederado')).toContain('Províncias')
  })

  it('federal sugere eleitos; os demais, nomeados', () => {
    expect(suggestedLocalSelection('federal')).toBe('eleitos')
    expect(suggestedLocalSelection('unitario')).toBe('nomeados')
    expect(suggestedLocalSelection('confederado')).toBe('nomeados')
  })

  it('eleitos +5 e nomeados −5 de legitimidade inicial', () => {
    expect(localSelectionLegitimacy('eleitos')).toBe(5)
    expect(localSelectionLegitimacy('nomeados')).toBe(-5)
    expect(localSelectionLegitimacy('misto')).toBe(0)
  })

  it('parlamentarismo e semipresidencialismo pedem chefe de Governo', () => {
    expect(requiresHeadOfGovernment('parlamentarismo')).toBe(true)
    expect(requiresHeadOfGovernment('semipresidencialismo')).toBe(true)
    expect(requiresHeadOfGovernment('presidencialismo')).toBe(false)
  })
})

const valid: InstitutionsInput = {
  governmentForm: 'republica',
  regime: 'democratico',
  system: 'presidencialismo',
  stateForm: 'unitario',
  firstLevel: 'Províncias',
  secondLevel: 'Municípios',
  localSelection: 'nomeados',
  leadershipBasis: 'eleito_direto',
  headOfState: { title: 'Presidente', name: 'Álvaro Mendonça' },
}

describe('validateInstitutions', () => {
  it('aceita um conjunto coerente', () => {
    expect(validateInstitutions(valid)).toEqual([])
  })

  it('recusa sistema fora das combinações válidas', () => {
    expect(validateInstitutions({ ...valid, system: 'concentracao' })).toHaveLength(1)
  })

  it('recusa base do cargo incompatível', () => {
    expect(validateInstitutions({ ...valid, leadershipBasis: 'hereditario' })).toHaveLength(1)
  })

  it('recusa "Estados" em país não federal e "Províncias" em federal', () => {
    expect(validateInstitutions({ ...valid, firstLevel: 'Estados' })).toHaveLength(1)
    expect(validateInstitutions({ ...valid, stateForm: 'federal' })).toHaveLength(1)
  })

  it('exige chefe de Governo no parlamentarismo e o recusa fora dele', () => {
    const parl = { ...valid, system: 'parlamentarismo' as const }
    expect(validateInstitutions(parl)).toHaveLength(1)
    expect(
      validateInstitutions({
        ...parl,
        headOfGovernment: { title: 'Primeiro-ministro', name: 'Dante Villaça' },
      }),
    ).toEqual([])
    expect(
      validateInstitutions({
        ...valid,
        headOfGovernment: { title: 'Primeiro-ministro', name: 'Dante Villaça' },
      }),
    ).toHaveLength(1)
  })

  it('recusa valores fora das listas (nunca confia no navegador)', () => {
    expect(validateInstitutions({ ...valid, regime: 'anarquico' as never }).length).toBeGreaterThan(
      0,
    )
  })

  it('recusa nomes de líderes vazios', () => {
    expect(validateInstitutions({ ...valid, headOfState: { title: '', name: 'X' } })).toHaveLength(
      1,
    )
  })
})
