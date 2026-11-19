import { INITIAL_POPULATION, generateInitialConditions, type GeneratorInput } from './generator'

const base: GeneratorInput = {
  seed: 'republica de valeria:12',
  governmentForm: 'republica',
  regime: 'democratico',
  system: 'presidencialismo',
  stateForm: 'unitario',
  ideology: 'liberal_classico',
  legitimacy: 55,
}

describe('generateInitialConditions', () => {
  it('é determinístico: mesma entrada, mesmo resultado', () => {
    expect(generateInitialConditions(base)).toEqual(generateInitialConditions({ ...base }))
  })

  it('sementes diferentes dão países diferentes', () => {
    const a = generateInitialConditions(base)
    const b = generateInitialConditions({ ...base, seed: 'outra' })
    expect(a).not.toEqual(b)
  })

  it('população fixa de 1 milhão e PIB = população × PIB per capita', () => {
    const result = generateInitialConditions(base)
    expect(result.population).toBe(1_000_000)
    expect(INITIAL_POPULATION).toBe(1_000_000)
    expect(result.gdp).toBe(result.population * result.gdpPerCapita)
  })

  it('indicadores ficam em faixas plausíveis', () => {
    for (let i = 0; i < 40; i++) {
      const r = generateInitialConditions({ ...base, seed: `s${i}` })
      expect(r.approval).toBeGreaterThanOrEqual(30)
      expect(r.approval).toBeLessThanOrEqual(80)
      expect(r.inflation).toBeGreaterThanOrEqual(2)
      expect(r.inflation).toBeLessThanOrEqual(6)
      expect(r.unemployment).toBeGreaterThanOrEqual(4)
      expect(r.unemployment).toBeLessThanOrEqual(10)
      expect(r.treasury).toBeGreaterThan(0)
    }
  })

  it('legitimidade maior puxa a aprovação para cima', () => {
    const low = generateInitialConditions({ ...base, legitimacy: 20 })
    const high = generateInitialConditions({ ...base, legitimacy: 90 })
    expect(high.approval).toBeGreaterThan(low.approval)
  })

  it('o número de ministérios depende do sistema de governo', () => {
    const count = (
      system: GeneratorInput['system'],
      regime: GeneratorInput['regime'] = 'autoritario',
    ) => generateInitialConditions({ ...base, regime, system }).ministries.length
    expect(count('concentracao')).toBe(6)
    expect(count('diretorial')).toBe(7)
    expect(count('presidencialismo')).toBe(8)
    expect(count('semipresidencialismo')).toBe(9)
    expect(count('parlamentarismo')).toBe(10)
  })

  it('ministros têm nomes únicos e aprovação válida', () => {
    const { ministries } = generateInitialConditions({ ...base, system: 'parlamentarismo' })
    expect(new Set(ministries.map((m) => m.name)).size).toBe(ministries.length)
    for (const m of ministries) {
      expect(m.approval).toBeGreaterThanOrEqual(30)
      expect(m.approval).toBeLessThanOrEqual(85)
    }
  })
})

describe('câmaras', () => {
  const chambers = (over: Partial<GeneratorInput>) =>
    generateInitialConditions({ ...base, ...over }).chambers

  it('república unitária: uma câmara eleita de 100 cadeiras', () => {
    const result = chambers({})
    expect(result).toHaveLength(1)
    expect(result[0]).toMatchObject({ name: 'Câmara dos Deputados', seats: 100, elected: true })
  })

  it('federal: duas câmaras eleitas (Câmara e Senado)', () => {
    expect(chambers({ stateForm: 'federal' }).map((c) => c.name)).toEqual([
      'Câmara dos Deputados',
      'Senado',
    ])
  })

  it('confederada: dieta única', () => {
    expect(chambers({ stateForm: 'confederado' }).map((c) => c.name)).toEqual(['Dieta Confederal'])
  })

  it('monarquia: câmara eleita e câmara alta nomeada', () => {
    const result = chambers({ governmentForm: 'monarquia', system: 'parlamentarismo' })
    expect(result.map((c) => c.elected)).toEqual([true, false])
  })

  it('absolutismo e totalitarismo: só um conselho não eleito, sem partidos', () => {
    const absolute = chambers({
      governmentForm: 'monarquia',
      regime: 'absolutista',
      system: 'concentracao',
    })
    expect(absolute).toHaveLength(1)
    expect(absolute[0]).toMatchObject({ name: 'Conselho do Reino', elected: false, parties: [] })
    expect(chambers({ regime: 'totalitario', system: 'concentracao' })[0].name).toBe(
      'Comitê Central',
    )
    expect(chambers({ regime: 'colonial' })[0].name).toBe('Conselho Colonial')
  })

  it('teocracia tem conselho religioso', () => {
    const result = chambers({ governmentForm: 'teocracia', regime: 'autoritario' })
    expect(result.map((c) => c.name)).toEqual(['Conselho Religioso'])
  })

  it('cadeiras dos partidos somam exatamente as da câmara', () => {
    for (let i = 0; i < 30; i++) {
      for (const chamber of chambers({ seed: `x${i}`, stateForm: 'federal' })) {
        expect(chamber.parties.reduce((s, p) => s + p.seats, 0)).toBe(chamber.seats)
      }
    }
  })

  it('o partido da ideologia governante tem a maior bancada e está no governo', () => {
    for (let i = 0; i < 30; i++) {
      const [chamber] = chambers({ seed: `y${i}`, ideology: 'social_democrata' })
      const top = chamber.parties[0]
      expect(top.name).toBe('Aliança Trabalhista')
      expect(top.inGovernment).toBe(true)
    }
  })

  it('o governo sempre alcança a maioria absoluta', () => {
    for (let i = 0; i < 40; i++) {
      for (const chamber of chambers({ seed: `z${i}`, stateForm: 'federal' })) {
        const government = chamber.parties
          .filter((p) => p.inGovernment)
          .reduce((s, p) => s + p.seats, 0)
        expect(government).toBeGreaterThanOrEqual(Math.floor(chamber.seats / 2) + 1)
      }
    }
  })

  it('não repete partidos na mesma câmara', () => {
    const [chamber] = chambers({ seed: 'dup' })
    expect(new Set(chamber.parties.map((p) => p.name)).size).toBe(chamber.parties.length)
  })
})
