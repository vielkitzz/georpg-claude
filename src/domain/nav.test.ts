import { NAV_ITEMS } from './nav'

const officialTree = {
  '/nacao': [],
  '/mapa-mundial': [],
  '/indicadores': [],
  '/governo': [
    'executivo',
    'congresso',
    'partidos',
    'leis',
    'orcamento',
    'eleicoes',
    'administracao',
  ],
  '/economia': [
    'politica-economica',
    'tributacao',
    'banco-central',
    'divida-publica',
    'setores-produtivos',
    'comercio-exterior',
  ],
  '/sociedade': [
    'saude',
    'educacao',
    'trabalho',
    'previdencia',
    'habitacao',
    'seguranca-publica',
    'meio-ambiente',
  ],
  '/infraestrutura': ['transportes', 'energia', 'saneamento', 'telecomunicacoes', 'obras'],
  '/diplomacia': ['relacoes', 'tratados', 'organizacoes', 'embaixadas', 'sancoes'],
  '/defesa': ['forcas-armadas', 'organizacao', 'equipamentos', 'operacoes', 'inteligencia'],
  '/historico': ['acontecimentos', 'decisoes', 'turnos', 'relatorios'],
}

it('segue a ordem e a hierarquia oficiais, com dez itens e 39 subpáginas', () => {
  expect(NAV_ITEMS.map((item) => item.path)).toEqual(Object.keys(officialTree))
  expect(
    Object.fromEntries(
      NAV_ITEMS.map((item) => [item.path, item.children?.map((child) => child.id) ?? []]),
    ),
  ).toEqual(officialTree)
  expect(NAV_ITEMS.flatMap((item) => item.children ?? [])).toHaveLength(39)
})
