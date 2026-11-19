import type { Party } from '@/domain/types'

export interface ParliamentSummary {
  totalSeats: number
  governmentSeats: number
  /** Menor número de cadeiras que forma maioria absoluta. */
  majority: number
  hasGovernmentMajority: boolean
}

export function summarizeParliament(parties: Party[]): ParliamentSummary {
  const totalSeats = parties.reduce((sum, party) => sum + party.seats, 0)
  const governmentSeats = parties
    .filter((party) => party.inGovernment)
    .reduce((sum, party) => sum + party.seats, 0)
  const majority = Math.floor(totalSeats / 2) + 1
  return {
    totalSeats,
    governmentSeats,
    majority,
    hasGovernmentMajority: governmentSeats >= majority,
  }
}
