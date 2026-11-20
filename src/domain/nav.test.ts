import { NAV_GROUPS, NAV_ITEMS } from './nav'

it('lista as onze páginas do jogo na ordem esperada, sem a fundação', () => {
  expect(NAV_ITEMS.map((item) => item.path)).toEqual([
    '/',
    '/mapa',
    '/historico',
    '/governo',
    '/economia',
    '/sociedade',
    '/infraestrutura',
    '/militar',
    '/tecnologia',
    '/diplomacia',
    '/imprensa',
  ])
  expect(new Set(NAV_ITEMS.map((item) => item.id)).size).toBe(11)
  expect(NAV_GROUPS.map((group) => group.title)).toEqual([
    'Nação',
    'Gestão',
    'Estratégia',
    'Relações',
  ])
})
