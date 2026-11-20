import type {
  GovernmentForm,
  GovernmentSystem,
  Leader,
  LeadershipBasis,
  LocalSelection,
  Regime,
  StateForm,
} from '../domain/founding/options.ts'
import type { ArchetypeId } from '../domain/ideology/archetypes.ts'
import type { AxisScores } from '../domain/ideology/axes.ts'
import type { Answers } from '../domain/ideology/scoring.ts'

export interface NationEvent {
  title: string
  type: string
  tickIndex: number | null
  year: number | null
}

export interface NationPolitics {
  governmentForm: GovernmentForm | null
  regime: Regime | null
  system: GovernmentSystem | null
  stateForm: StateForm | null
  leadershipBasis: LeadershipBasis | null
  headOfState: Leader | null
  headOfGovernment: Leader | null
  ideology: ArchetypeId | null
  legitimacy: number | null
  coherencePenalty: number | null
  events: NationEvent[]
}

export interface NationProfile {
  id: string
  officialName: string
  shortName: string
  capital: string
  territoryId: number | null
  foundedYear: number | null
  currency: { name: string; code: string }
  motto: string
  anthem: string
  description: string
  history: string
  symbols: {
    flag: string
    coatOfArms: string
    nationalColor: string | null
    nationalSymbol: string
    subdivisionNames: { firstLevel: string; secondLevel: string }
    localGovernorSelection: LocalSelection | null
    ideologyAnswers: Answers
    ideologyProfile: AxisScores | null
  }
  politics: NationPolitics
}
