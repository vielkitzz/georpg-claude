import { summarizeParliament } from './politics'

const party = (seats: number, inGovernment: boolean) => ({
  name: 'P',
  seats,
  color: '#fff',
  inGovernment,
})

describe('summarizeParliament', () => {
  it('soma cadeiras e calcula a maioria absoluta', () => {
    const result = summarizeParliament([
      party(41, true),
      party(33, false),
      party(19, true),
      party(7, false),
    ])
    expect(result).toEqual({
      totalSeats: 100,
      governmentSeats: 60,
      majority: 51,
      hasGovernmentMajority: true,
    })
  })

  it('metade exata não é maioria', () => {
    const result = summarizeParliament([party(50, true), party(50, false)])
    expect(result.majority).toBe(51)
    expect(result.hasGovernmentMajority).toBe(false)
  })

  it('funciona sem partidos', () => {
    expect(summarizeParliament([]).hasGovernmentMajority).toBe(false)
  })
})
