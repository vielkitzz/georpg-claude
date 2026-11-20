import { formatInteger, formatPercent } from '@/domain/format'
import { summarizeParliament } from '@/domain/politics'
import type { Chamber, Nation } from '@/domain/types'
import { EmptySection, Facts, IndicatorCards, NationPage } from '@/ui/NationPage'
import { Panel } from '@/ui/Panel'

function Cabinet({ ministers }: { ministers: Nation['ministries'] }) {
  if (!ministers.length)
    return (
      <EmptySection>A composição do gabinete ministerial ainda não foi registrada.</EmptySection>
    )
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-88 text-left text-sm">
        <caption className="sr-only">Composição do gabinete ministerial</caption>
        <thead className="text-muted">
          <tr>
            <th scope="col" className="py-2 pr-4 font-normal">
              Ministério
            </th>
            <th scope="col" className="py-2 pr-4 font-normal">
              Ministro
            </th>
            <th scope="col" className="py-2 font-normal">
              Aprovação
            </th>
          </tr>
        </thead>
        <tbody>
          {ministers.map((minister) => (
            <tr key={minister.office} className="border-t border-line">
              <th scope="row" className="py-3 pr-4 font-medium">
                {minister.office}
              </th>
              <td className="py-3 pr-4">{minister.name || 'Sem registro'}</td>
              <td className="py-3">
                {minister.approval === null ? 'Sem registro' : formatPercent(minister.approval)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function Legislature({ chamber }: { chamber: Chamber }) {
  const { parties, elected, seats, name } = chamber
  const summary = summarizeParliament(parties)
  return (
    <article className="space-y-3 rounded-md border border-line bg-bg/45 p-4">
      <h3 className="subtitle text-lg">{name || 'Câmara legislativa'}</h3>
      {(elected !== null || seats !== null) && (
        <p className="text-sm text-muted">
          {[
            elected === null ? '' : elected ? 'Composição eleita' : 'Composição designada',
            seats === null ? '' : `${formatInteger(seats)} cadeiras`,
          ]
            .filter(Boolean)
            .join(' · ')}
        </p>
      )}
      {parties.length === 0 ? (
        <EmptySection>
          {elected === false
            ? 'A composição designada desta câmara não tem bancadas partidárias registradas.'
            : 'A composição partidária desta câmara ainda não está registrada.'}
        </EmptySection>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full min-w-80 text-left text-sm">
              <caption className="sr-only">Composição partidária de {name}</caption>
              <thead className="text-muted">
                <tr>
                  <th scope="col" className="py-2 pr-4 font-normal">
                    Partido
                  </th>
                  <th scope="col" className="py-2 pr-4 font-normal">
                    Posição
                  </th>
                  <th scope="col" className="py-2 text-right font-normal">
                    Cadeiras
                  </th>
                </tr>
              </thead>
              <tbody>
                {parties.map((party) => (
                  <tr key={party.name} className="border-t border-line">
                    <th scope="row" className="py-2 pr-4 font-medium">
                      {party.name}
                    </th>
                    <td className="py-2 pr-4">{party.inGovernment ? 'Governo' : 'Oposição'}</td>
                    <td className="py-2 text-right">{formatInteger(party.seats)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {summary.totalSeats > 0 && (
            <p className="text-sm text-muted">
              O governo tem {summary.governmentSeats} de {summary.totalSeats} cadeiras registradas.
              {seats === null || seats === summary.totalSeats
                ? ` A maioria exige ${summary.majority}.`
                : ''}
            </p>
          )}
        </>
      )}
    </article>
  )
}

function Government({ nation }: { nation: Nation }) {
  const { government, leadership } = nation
  const approval = nation.approvalHistory.at(-1)
  const indicators = [
    ...(approval === undefined
      ? []
      : [{ label: 'Aprovação do governo', value: formatPercent(approval) }]),
    ...(nation.legitimacy === null
      ? []
      : [{ label: 'Legitimidade', value: `${nation.legitimacy}/100` }]),
  ]
  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <Panel title="Instituições políticas">
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
      <div className="grid content-start gap-5">
        <Panel title="Chefia de Estado">
          <Facts
            items={[
              ['Título', leadership.stateHead.title],
              ['Titular', leadership.stateHead.name],
              ['Base do cargo', leadership.stateHead.basis],
            ]}
          />
        </Panel>
        {leadership.governmentHead && (
          <Panel title="Chefia de Governo">
            <Facts
              items={[
                ['Título', leadership.governmentHead.title],
                ['Titular', leadership.governmentHead.name],
              ]}
            />
          </Panel>
        )}
      </div>
      <Panel title="Aprovação e legitimidade" className="lg:col-span-2">
        <IndicatorCards
          indicators={indicators}
          empty="A aprovação e a legitimidade ainda não foram registradas."
        />
      </Panel>
      <Panel title="Gabinete ministerial" className="lg:col-span-2">
        <Cabinet ministers={nation.ministries} />
      </Panel>
      <Panel title="Parlamento" className="lg:col-span-2">
        {nation.chambers.length > 0 ? (
          <div className="grid gap-4">
            {nation.chambers.map((chamber, index) => (
              <Legislature chamber={chamber} key={`${chamber.name}-${index}`} />
            ))}
          </div>
        ) : (
          <EmptySection>A estrutura legislativa ainda não está registrada.</EmptySection>
        )}
      </Panel>
    </div>
  )
}

export function GovernmentPage() {
  return (
    <NationPage title="Governo e Política">{(nation) => <Government nation={nation} />}</NationPage>
  )
}
