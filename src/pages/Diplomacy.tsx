import { useTerritoryClaims } from '@/data/hooks'
import { EmptySection, Facts, NationPage } from '@/ui/NationPage'
import { Panel } from '@/ui/Panel'

export function KnownCountries({ nationId }: { nationId: string }) {
  const claims = useTerritoryClaims()
  if (claims.status === 'loading')
    return (
      <p role="status" className="text-muted">
        Carregando países do mapa…
      </p>
    )
  if (claims.status === 'error')
    return (
      <p role="alert" className="text-warning">
        Não foi possível consultar os países do mapa.
      </p>
    )
  const countries = claims.data
    .filter((claim) => claim.nationId !== nationId)
    .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'))
  if (!countries.length)
    return <EmptySection>Nenhum outro país tem território registrado no mapa.</EmptySection>
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <caption className="sr-only">Países com território registrado no mapa mundial</caption>
        <thead className="text-muted">
          <tr>
            <th scope="col" className="py-2 font-normal">
              País
            </th>
            <th scope="col" className="py-2 text-right font-normal">
              Território
            </th>
          </tr>
        </thead>
        <tbody>
          {countries.map((country) => (
            <tr key={country.territoryId} className="border-t border-line">
              <th scope="row" className="py-3 pr-4 font-medium">
                {country.name}
              </th>
              <td className="py-3 text-right">{country.territoryId}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function DiplomacyPage() {
  return (
    <NationPage
      title="Diplomacia"
      note="Relações internacionais e países com presença registrada no mapa."
    >
      {(nation) => (
        <div className="grid gap-5 lg:grid-cols-2">
          <Panel title="Países conhecidos">
            <KnownCountries nationId={nation.id} />
          </Panel>
          <Panel title="Relações internacionais">
            <Facts
              items={[
                ['Relações bilaterais', 'Sem posições diplomáticas registradas'],
                ['Tratados', 'Sem registro de acordos'],
                ['Organizações internacionais', 'Sem cadastro de filiações'],
                ['Comunicações diplomáticas', 'Sem registros de mensagens oficiais'],
              ]}
            />
          </Panel>
        </div>
      )}
    </NationPage>
  )
}
