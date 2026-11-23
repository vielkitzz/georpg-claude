import type { ReactNode } from 'react'
import { useWorldState } from '@/data/hooks'
import { formatInteger } from '@/domain/format'
import type { NavChild } from '@/domain/nav'
import { formatSimulationDate, simulationDateAt } from '@/domain/time'
import type { Nation } from '@/domain/types'
import { EmptySection, Facts, IndicatorCards, NationPage } from '@/ui/NationPage'
import { Panel } from '@/ui/Panel'
import { KnownCountries } from './Diplomacy'
import { CabinetPanel, InstitutionsPanel, LeadershipPanels, LegislaturePanel } from './Government'
import { FoundationTimeline } from './NationalHistory'
import { NationalPublications } from './Press'

interface Detail {
  note: string
  empty?: readonly [section: string, message: string]
  body?: (nation: Nation) => ReactNode
}

function EconomyReadings({
  nation,
  title,
  labels,
}: {
  nation: Nation
  title: string
  labels: string[]
}) {
  return (
    <Panel title={title}>
      <IndicatorCards
        indicators={nation.indicators.filter((item) => labels.includes(item.label))}
        empty="As medições correspondentes ainda não foram registradas."
      />
    </Panel>
  )
}

function CurrentTurn() {
  const world = useWorldState()
  if (world.status === 'loading') return <p role="status">Consultando o estado da simulação…</p>
  if (world.status === 'error')
    return (
      <p role="alert" className="text-warning">
        Não foi possível consultar o turno atual.
      </p>
    )
  return (
    <Facts
      items={[
        ['Turno registrado', formatInteger(world.data.tickIndex)],
        ['Data da simulação', formatSimulationDate(simulationDateAt(world.data.tickIndex))],
      ]}
    />
  )
}

const details: Record<NavChild['id'], Detail> = {
  executivo: {
    note: 'Titulares da chefia de Estado e de Governo e composição ministerial.',
    body: (nation) => (
      <div className="grid gap-5 lg:grid-cols-2">
        <LeadershipPanels nation={nation} />
        <CabinetPanel nation={nation} />
      </div>
    ),
  },
  congresso: {
    note: 'Câmaras legislativas, cadeiras e composição registradas para o sistema de governo da nação.',
    body: (nation) => <LegislaturePanel nation={nation} />,
  },
  partidos: {
    note: 'Partidos representados nas câmaras e suas posições no governo ou na oposição.',
    body: (nation) => <LegislaturePanel nation={nation} partiesOnly />,
  },
  leis: {
    note: 'Consulta da legislação nacional e dos atos promulgados.',
    empty: [
      'Legislação e atos',
      'Ainda não há um registro de leis vigentes, propostas ou atos publicados.',
    ],
  },
  orcamento: {
    note: 'Finanças do governo, dotações e execução das despesas públicas.',
    body: (nation) => (
      <EconomyReadings nation={nation} title="Saldo do tesouro" labels={['Tesouro nacional']} />
    ),
    empty: [
      'Dotações e execução',
      'A distribuição das despesas por órgão e a execução orçamentária ainda não são registradas.',
    ],
  },
  eleicoes: {
    note: 'Calendário eleitoral, candidaturas, votação e resultados.',
    empty: [
      'Calendário eleitoral',
      'O sistema de eleições será disponibilizado em uma etapa futura do desenvolvimento.',
    ],
  },
  administracao: {
    note: 'Organização institucional da nação e regras de administração dos níveis territoriais.',
    body: (nation) => <InstitutionsPanel nation={nation} />,
  },
  'politica-economica': {
    note: 'Acompanhamento da atividade econômica e das medidas adotadas pelo governo.',
    body: (nation) => (
      <EconomyReadings
        nation={nation}
        title="Atividade econômica"
        labels={['PIB', 'Inflação', 'Desemprego']}
      />
    ),
    empty: [
      'Medidas econômicas',
      'O sistema ainda não registra medidas econômicas, metas ou decisões de política fiscal.',
    ],
  },
  tributacao: {
    note: 'Tributos, alíquotas e arrecadação nacional.',
    empty: [
      'Receitas tributárias',
      'As bases de incidência, as alíquotas e a arrecadação por tributo ainda não são registradas.',
    ],
  },
  'banco-central': {
    note: 'Moeda nacional, inflação e instrumentos monetários.',
    body: (nation) => (
      <>
        <Panel title="Moeda nacional">
          <Facts
            items={[
              ['Nome da moeda', nation.currency.name],
              ['Código monetário', nation.currency.code],
            ]}
          />
        </Panel>
        <EconomyReadings nation={nation} title="Inflação" labels={['Inflação']} />
      </>
    ),
    empty: [
      'Instrumentos monetários',
      'Ainda não há registros de taxas de referência, reservas ou atas do banco central.',
    ],
  },
  'divida-publica': {
    note: 'Contratos, credores e calendário dos compromissos financeiros do Estado.',
    empty: [
      'Passivos e vencimentos',
      'A simulação ainda não disponibiliza o estoque da dívida pública, seus encargos ou vencimentos.',
    ],
  },
  'setores-produtivos': {
    note: 'Composição da produção entre atividades econômicas.',
    body: (nation) => (
      <EconomyReadings
        nation={nation}
        title="Produção agregada"
        labels={['PIB', 'PIB per capita']}
      />
    ),
    empty: [
      'Composição setorial',
      'Os dados disponíveis são agregados. Ainda não há medições separadas para agricultura, indústria e serviços.',
    ],
  },
  'comercio-exterior': {
    note: 'Fluxos comerciais, parceiros e composição da pauta externa.',
    empty: [
      'Fluxos comerciais',
      'Ainda não há registros de exportações, importações ou saldos por parceiro comercial.',
    ],
  },
  saude: {
    note: 'Rede assistencial, cobertura e indicadores sanitários.',
    empty: [
      'Cobertura assistencial',
      'A simulação ainda não mede acesso à saúde, capacidade hospitalar ou cobertura sanitária.',
    ],
  },
  educacao: {
    note: 'Matrículas, rede escolar e alfabetização.',
    empty: [
      'Acesso à educação',
      'Ainda não há medições de matrículas, alfabetização ou capacidade das escolas.',
    ],
  },
  trabalho: {
    note: 'Mercado de trabalho, emprego e condições de ocupação.',
    body: (nation) => (
      <EconomyReadings nation={nation} title="Situação do emprego" labels={['Desemprego']} />
    ),
    empty: [
      'Ocupações e vínculos',
      'Ainda não há registros de vínculos, salários ou ocupações por atividade.',
    ],
  },
  previdencia: {
    note: 'Proteção previdenciária, benefícios e contribuições.',
    empty: [
      'Cobertura previdenciária',
      'Beneficiários, contribuições e benefícios previdenciários ainda não são registrados.',
    ],
  },
  habitacao: {
    note: 'Moradia, oferta de domicílios e políticas habitacionais.',
    empty: [
      'Condições de moradia',
      'Ainda não há registros de domicílios, condições habitacionais ou programas de moradia.',
    ],
  },
  'seguranca-publica': {
    note: 'Segurança civil, ocorrências e serviços de atendimento à população.',
    empty: [
      'Segurança civil',
      'O sistema ainda não disponibiliza ocorrências, efetivos policiais ou cobertura dos serviços.',
    ],
  },
  'meio-ambiente': {
    note: 'Conservação, qualidade ambiental e acompanhamento de impactos.',
    empty: [
      'Monitoramento ambiental',
      'Ainda não existem medições de poluição, conservação ou uso de recursos naturais.',
    ],
  },
  transportes: {
    note: 'Rede de circulação e integração entre cidades e regiões.',
    empty: [
      'Rede de transportes',
      'Ainda não há inventário nacional de estradas, ferrovias, portos ou terminais.',
    ],
  },
  energia: {
    note: 'Capacidade de geração, matriz de oferta e distribuição de energia.',
    empty: [
      'Geração e redes',
      'Usinas, redes de distribuição e cobertura de energia ainda não são registradas.',
    ],
  },
  saneamento: {
    note: 'Abastecimento de água, esgotamento sanitário e resíduos.',
    empty: [
      'Cobertura de serviços',
      'Ainda não existem medições de cobertura de água, esgoto ou coleta de resíduos.',
    ],
  },
  telecomunicacoes: {
    note: 'Infraestrutura e cobertura das redes de comunicação.',
    empty: [
      'Redes e cobertura',
      'Ainda não há inventário de redes telefônicas, telegráficas ou de radiocomunicação.',
    ],
  },
  obras: {
    note: 'Projetos de infraestrutura, investimentos e acompanhamento de execução.',
    empty: [
      'Carteira de obras',
      'Projetos, recursos investidos e etapas de execução aparecerão quando houver um registro de obras.',
    ],
  },
  relacoes: {
    note: 'Países conhecidos e posições diplomáticas bilaterais.',
    body: (nation) => (
      <Panel title="Países conhecidos">
        <KnownCountries nationId={nation.id} />
      </Panel>
    ),
    empty: [
      'Posições bilaterais',
      'A presença no mapa identifica outros países. As posições diplomáticas ainda não são registradas.',
    ],
  },
  tratados: {
    note: 'Acordos internacionais e compromissos firmados pela nação.',
    empty: [
      'Acordos e vigência',
      'Ainda não há cadastro de tratados, signatários ou datas de vigência.',
    ],
  },
  organizacoes: {
    note: 'Organizações internacionais e participação da nação.',
    empty: [
      'Filiações internacionais',
      'Organizações, filiações e representações em organismos multilaterais ainda não são registradas.',
    ],
  },
  embaixadas: {
    note: 'Missões diplomáticas, representações e seus titulares.',
    empty: [
      'Missões diplomáticas',
      'Ainda não há cadastro de embaixadas, consulados ou representantes diplomáticos.',
    ],
  },
  sancoes: {
    note: 'Restrições internacionais aplicadas ou recebidas pela nação.',
    empty: [
      'Medidas restritivas',
      'Ainda não há registros de sanções, países envolvidos ou prazos de aplicação.',
    ],
  },
  'forcas-armadas': {
    note: 'Ramos de defesa e seus efetivos registrados.',
    body: () => (
      <Panel title="Ramos militares">
        <Facts
          items={[
            ['Exército', 'Sem registro de unidades terrestres'],
            ['Marinha', 'Sem registro de frotas ou bases navais'],
            ['Força Aérea', 'Sem registro de esquadrões ou bases aéreas'],
          ]}
        />
      </Panel>
    ),
    empty: [
      'Efetivos',
      'O módulo de defesa ainda não disponibiliza registros de pessoal por ramo.',
    ],
  },
  organizacao: {
    note: 'Cadeia de comando, estruturas administrativas e unidades de defesa.',
    empty: [
      'Comandos e unidades',
      'Hierarquias militares, divisões administrativas e lotações ainda não têm cadastro.',
    ],
  },
  equipamentos: {
    note: 'Inventário e distribuição de recursos materiais das forças armadas.',
    empty: [
      'Inventário de defesa',
      'Ainda não existem registros de veículos, meios navais, aeronaves ou equipamentos atribuídos.',
    ],
  },
  operacoes: {
    note: 'Consulta a missões e operações militares registradas.',
    empty: [
      'Registro de operações',
      'A simulação ainda não oferece registros de missões planejadas, em andamento ou encerradas.',
    ],
  },
  inteligencia: {
    note: 'Panorama institucional e registros de inteligência de defesa.',
    empty: [
      'Registros de inteligência',
      'Ainda não existem registros de órgãos, avaliações ou informes de inteligência.',
    ],
  },
  acontecimentos: {
    note: 'Linha do tempo dos acontecimentos efetivamente registrados para a nação.',
    body: (nation) => (
      <Panel title="Linha do tempo">
        <FoundationTimeline nation={nation} />
      </Panel>
    ),
    empty: [
      'Outros acontecimentos',
      'O histórico ainda não tem eventos além da fundação registrada.',
    ],
  },
  decisoes: {
    note: 'Consulta às decisões governamentais e mudanças institucionais registradas.',
    empty: ['Atos e decisões', 'Ainda não há um diário de decisões com autoria, data e efeitos.'],
  },
  turnos: {
    note: 'Posição atual da simulação e registros de turnos anteriores.',
    body: () => (
      <Panel title="Turno atual">
        <CurrentTurn />
      </Panel>
    ),
    empty: [
      'Turnos anteriores',
      'A simulação disponibiliza o turno atual. O histórico de processamento dos turnos ainda não está disponível.',
    ],
  },
  relatorios: {
    note: 'Publicações nacionais, boletins e relatórios consolidados da simulação.',
    body: (nation) => <NationalPublications news={nation.news} />,
    empty: [
      'Relatórios da simulação',
      'A simulação ainda não publica relatórios consolidados dos turnos.',
    ],
  },
}

export function SectionDetailPage({ page }: { page: NavChild }) {
  const { note, empty, body } = details[page.id]
  return (
    <NationPage title={page.label} note={note}>
      {(nation) => (
        <div className="grid gap-5">
          {body?.(nation)}
          {empty && (
            <Panel title={empty[0]}>
              <EmptySection>{empty[1]}</EmptySection>
            </Panel>
          )}
        </div>
      )}
    </NationPage>
  )
}
