import { calculateApproval } from '../domain/founding/approval'
import { AXES } from '../domain/ideology/axes'
import { ARCHETYPES } from '../domain/ideology/archetypes'
import { analyzeCoherence } from '../domain/ideology/coherence'
import { portrait } from '../domain/ideology/portrait'
import { compass as calculateCompassCoordinates } from '../domain/ideology/scoring'
import {
  formatSimulationDate,
  nextTickAt,
  simulationDateAt,
  SIMULATION_START,
} from '../domain/time'
import type { NationEvent, NationPolitics, NationProfile } from '../types/nation-profile'

export const legitimacyIndex = (politics: NationPolitics) => politics.legitimacy

function analyzeIdeologyCoherence(profile: NationProfile) {
  const scores = profile.symbols.ideologyProfile
  if (!scores) return null
  const { governmentForm, regime, stateForm } = profile.politics
  const localSelection = profile.symbols.localGovernorSelection
  const legitimacyPenalty =
    governmentForm && regime && stateForm && localSelection
      ? -analyzeCoherence(scores, { governmentForm, regime, stateForm, localSelection }).penalty
      : null
  return { legitimacyPenalty, portrait: portrait(scores) }
}

const eventDate = (event: NationEvent) =>
  event.tickIndex === null
    ? String(event.year ?? '')
    : formatSimulationDate(simulationDateAt(event.tickIndex))
const eventOrder = (event: NationEvent) =>
  event.tickIndex === null
    ? event.year === null
      ? -Infinity
      : event.year * 12
    : SIMULATION_START.year * 12 + event.tickIndex

export function nationOverview(profile: NationProfile, now: Date) {
  const { politics, symbols } = profile
  const legitimacy = legitimacyIndex(politics)
  const coherence = analyzeIdeologyCoherence(profile)
  const penalty =
    coherence?.legitimacyPenalty ??
    (politics.coherencePenalty === null ? null : -politics.coherencePenalty)
  const approval =
    legitimacy !== null && penalty !== null && symbols.localGovernorSelection
      ? calculateApproval(legitimacy, penalty, symbols.localGovernorSelection)
      : null
  const scores = symbols.ideologyProfile
  const ranked = scores
    ? AXES.map((axis) => ({ ...axis, value: scores[axis.id] }))
        .sort((a, b) => Math.abs(b.value - 50) - Math.abs(a.value - 50))
        .slice(0, 4)
    : []
  // Registros legados guardam o ano da fundação, mas ainda não têm a lista de eventos.
  const events =
    politics.events.length || profile.foundedYear === null
      ? politics.events
      : [
          {
            type: 'fundacao',
            title: `Fundação de ${profile.officialName}`,
            tickIndex: null,
            year: profile.foundedYear,
          },
        ]
  return {
    legitimacy,
    approval,
    ideology: ARCHETYPES.find((item) => item.id === politics.ideology)?.name ?? null,
    axes: ranked.map((axis) => ({
      id: axis.id,
      label: `${axis.low} ↔ ${axis.high}`,
      value: axis.value,
    })),
    portrait: coherence?.portrait.find((item) => item.chapter === ranked[0]?.chapter)?.text ?? null,
    compass: scores ? calculateCompassCoordinates(scores) : null,
    nextTick: nextTickAt(now),
    events: [...events]
      .sort((a, b) => eventOrder(b) - eventOrder(a))
      .slice(0, 3)
      .map((event) => ({ ...event, date: eventDate(event) })),
  }
}
