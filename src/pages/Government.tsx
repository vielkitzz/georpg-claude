import { summarizeParliament } from '@/domain/politics'
import type { Nation } from '@/domain/types'
import { NationGate } from '@/ui/NationGate'
import { PageTitle, Panel } from '@/ui/Panel'

function Facts({ items }: { items: [string, string][] }) {
  return (
    <dl className="grid gap-x-8 gap-y-3 sm:grid-cols-2">
      {items.map(([term, value]) => (
        <div key={term}>
          <dt className="text-sm text-muted">{term}</dt>
          <dd className="subtitle">{value}</dd>
        </div>
      ))}
    </dl>
  )
}

function Cabinet({ nation }: { nation: Nation }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-96 text-left text-sm">
        <thead className="text-muted">
          <tr>
            <th className="py-2 pr-4 font-normal">Ministério</th>
            <th className="py-2 pr-4 font-normal">Ministro</th>
            <th className="py-2 font-normal">Aprovação</th>
          </tr>
        </thead>
        <tbody>
          {nation.ministries.map((minister) => (
            <tr key={minister.office} className="border-t border-line">
              <th scope="row" className="py-3 pr-4 font-medium">
                {minister.office}
              </th>
              <td className="py-3 pr-4">{minister.name}</td>
              <td className="py-3">
                <div className="flex items-center gap-3">
                  <span className="h-2 w-24 overflow-hidden rounded-full bg-raised" aria-hidden>
                    <span
                      className="block h-full bg-positive"
                      style={{ width: `${minister.approval}%` }}
                    />
                  </span>
                  <span>{minister.approval}%</span>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function Parliament({ nation }: { nation: Nation }) {
  const { parties } = nation.chamber
  const summary = summarizeParliament(parties)
  return (
    <div className="flex flex-col gap-4">
      <div
        role="img"
        aria-label={`Distribuição de ${summary.totalSeats} cadeiras entre ${parties.length} bancadas`}
        className="relative flex h-6 overflow-hidden rounded-sm"
      >
        {parties.map((party) => (
          <span
            key={party.name}
            style={{
              width: `${(party.seats / summary.totalSeats) * 100}%`,
              background: party.color,
            }}
          />
        ))}
        <span
          aria-hidden
          className="absolute inset-y-0 w-0.5 bg-[#071C2A]"
          style={{ left: `${(summary.majority / summary.totalSeats) * 100}%` }}
        />
      </div>
      <ul className="flex flex-col gap-2 text-sm">
        {parties.map((party) => (
          <li key={party.name} className="flex items-center gap-3">
            <span aria-hidden className="size-3 rounded-sm" style={{ background: party.color }} />
            <span className="flex-1">{party.name}</span>
            <span className="text-muted">{party.inGovernment ? 'Governo' : 'Oposição'}</span>
            <span className="w-8 text-right">{party.seats}</span>
          </li>
        ))}
      </ul>
      <p className="text-sm text-muted">
        O governo tem {summary.governmentSeats} de {summary.totalSeats} cadeiras. A maioria exige{' '}
        {summary.majority}, e a linha escura no gráfico marca esse ponto.
      </p>
    </div>
  )
}

function Government({ nation }: { nation: Nation }) {
  const { government, leadership } = nation
  return (
    <div className="mx-auto max-w-6xl">
      <PageTitle note="Instituições, liderança, gabinete e parlamento da sua nação. Dados de demonstração.">
        Governo e política
      </PageTitle>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Instituições">
          <Facts
            items={[
              ['Forma de governo', government.form],
              ['Regime', government.regime],
              ['Sistema de governo', government.system],
              ['Forma de Estado', government.stateForm],
              ['Primeiro nível', government.firstLevelDivision],
              ['Segundo nível', government.secondLevelDivision],
              ['Governantes locais', government.localLeaders],
            ]}
          />
        </Panel>

        <Panel title="Liderança">
          <Facts
            items={[
              [leadership.stateHead.title, leadership.stateHead.name],
              ['Base do cargo', leadership.stateHead.basis],
              ['Legitimidade', `${nation.legitimacy}%`],
            ]}
          />
        </Panel>

        <Panel title="Gabinete" className="lg:col-span-2">
          <Cabinet nation={nation} />
        </Panel>

        <Panel title={nation.chamber.name} className="lg:col-span-2">
          <Parliament nation={nation} />
        </Panel>
      </div>
    </div>
  )
}

export function GovernmentPage() {
  return <NationGate>{(nation) => <Government nation={nation} />}</NationGate>
}
