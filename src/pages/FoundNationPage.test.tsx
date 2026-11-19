import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router'
import { FakeAuth } from '@/test/auth'
import { QUESTIONS } from '@/domain/ideology'
import { FoundNationPage } from './FoundNationPage'

const { invoke } = vi.hoisted(() => ({ invoke: vi.fn() }))
vi.mock('@/auth/supabase', () => ({
  getSupabase: () => ({
    functions: { invoke },
    from: () => ({
      select: async () => ({
        data: [{ territory_id: 2, nation_id: 'id', name: 'Ocupado', color: '#123456' }],
      }),
    }),
  }),
}))

function renderWizard(role: 'PLAYER' | 'ADMIN' = 'PLAYER') {
  render(
    <FakeAuth value={{ role }}>
      <MemoryRouter initialEntries={['/criar-pais']}>
        <Routes>
          <Route path="/criar-pais" element={<FoundNationPage />} />
          <Route path="/" element={<h1>Painel da nação</h1>} />
        </Routes>
      </MemoryRouter>
    </FakeAuth>,
  )
}
const click = (name: string | RegExp) => fireEvent.click(screen.getByRole('button', { name }))
const textField = (label: string, value: string) =>
  fireEvent.change(screen.getByLabelText(label), { target: { value } })
const radio = (label: string | RegExp) =>
  fireEvent.click(screen.getByRole('radio', { name: label }))
const next = () => click('Próxima')
const stage = (index: number, title: string) => {
  expect(screen.getByRole('heading', { name: title })).toBeInTheDocument()
  expect(screen.getByRole('progressbar', { name: 'Progresso da fundação' })).toHaveAttribute(
    'aria-valuenow',
    String(index),
  )
}

beforeEach(() => {
  invoke.mockReset()
  invoke.mockImplementation(async (_name, { body }) => {
    if (body.action === 'check') return { data: { available: true } }
    if (body.action === 'preview')
      return {
        data: {
          preview: {
            officialName: 'Reino da Aurora',
            year: 1920,
            population: 1_000_000,
            gdp: 265_000_000,
            approval: 57,
            legitimacy: 52,
            ministries: 10,
            chambers: 2,
            token: 'server-preview',
          },
        },
      }
    return { data: { nationId: '123' } }
  })
})

it('valida e percorre as 12 etapas, preserva respostas e confirma a prévia antes de abrir o painel', async () => {
  renderWizard()
  stage(1, 'Território')
  const territory = await screen.findByRole('combobox', { name: 'Escolher território' })
  expect(within(territory).getByRole('option', { name: /Território 2 .*ocupado/ })).toBeDisabled()
  next()
  expect(screen.getByRole('alert')).toHaveTextContent('Selecione um território livre')
  fireEvent.change(territory, { target: { value: '2' } })
  expect(territory).toHaveValue('')
  fireEvent.change(territory, { target: { value: '1' } })
  next()
  stage(2, 'Nome curto e artigo')
  textField('Nome curto', 'Admin')
  next()
  expect(screen.getByRole('alert')).toHaveTextContent('reservado')
  textField('Nome curto', 'Aurora')
  radio('da')
  next()
  await screen.findByRole('heading', { name: 'Capital e moeda' })
  stage(3, 'Capital e moeda')
  click('Anterior')
  expect(screen.getByLabelText('Nome curto')).toHaveValue('Aurora')
  expect(screen.getByRole('radio', { name: 'da' })).toBeChecked()
  next()
  await screen.findByRole('heading', { name: 'Capital e moeda' })
  next()
  expect(screen.getByRole('alert')).toHaveTextContent('capital')
  textField('Capital', 'Nova Aurora')
  textField('Nome da moeda', 'Áureo')
  const currencyField = screen.getByLabelText('Código monetário')
  for (const invalid of ['A', 'ABCDF', 'A U', 'AU1', 'AÇ']) {
    textField('Código monetário', invalid)
    next()
    expect(screen.getByRole('alert')).toHaveTextContent('2 a 4 letras')
    expect(currencyField).toHaveAttribute('aria-invalid', 'true')
  }
  const user = userEvent.setup()
  await user.clear(currencyField)
  await user.paste('   auro  ')
  expect(currencyField).toHaveValue('   auro  ')
  next()
  stage(4, 'Forma de governo')
  click('Anterior')
  expect(screen.getByLabelText('Código monetário')).toHaveValue('AURO')
  next()
  radio('Monarquia')
  expect(screen.getByRole('status')).toHaveTextContent('Sistema ajustado para Parlamentarismo')
  next()
  stage(5, 'Regime político')
  next()
  stage(6, 'Sistema de governo')
  expect(screen.getByRole('radio', { name: 'Presidencialismo' })).toBeDisabled()
  expect(screen.getByRole('radio', { name: 'Parlamentarismo' })).toBeChecked()
  next()
  stage(7, 'Forma de Estado')
  radio('Federal')
  next()
  stage(8, 'Divisão administrativa')
  expect(screen.getByRole('radio', { name: 'Estados' })).toBeChecked()
  expect(screen.getByRole('radio', { name: /Eleitos/ })).toBeChecked()
  radio('Comunas')
  next()
  stage(9, 'Liderança')
  next()
  expect(screen.getByRole('alert')).toHaveTextContent('chefe de Estado')
  textField('Título do chefe de Estado', 'Rainha')
  textField('Nome do chefe de Estado', 'Iara do Sol')
  textField('Título do chefe de Governo', 'Chanceler')
  textField('Nome do chefe de Governo', 'Rui do Vale')
  next()
  stage(10, 'Questionário ideológico')
  expect(screen.queryByRole('button', { name: /aleatoriamente/ })).not.toBeInTheDocument()
  fireEvent.keyDown(window, { key: '3' })
  click('Anterior')
  next()
  expect(screen.getByRole('heading', { name: QUESTIONS[1].text })).toBeInTheDocument()
  for (let index = 1; index < QUESTIONS.length - 1; index++) {
    fireEvent.keyDown(window, { key: '3' })
  }
  next()
  expect(screen.getByRole('alert')).toHaveTextContent(
    'Falta responder uma pergunta do questionário.',
  )
  fireEvent.keyDown(window, { key: '3' })
  expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  const wizardNav = screen.getByRole('navigation', { name: 'Etapas da fundação' })
  const resultButton = screen.getByRole('button', { name: 'Ver resultado' })
  expect(wizardNav).toContainElement(resultButton)
  fireEvent.click(resultButton)
  expect(screen.getByRole('heading', { name: 'Eixos por capítulo' })).toBeInTheDocument()
  expect(screen.getByRole('heading', { name: 'Análise de coerência' })).toBeInTheDocument()
  next()
  expect(screen.getByRole('alert')).toHaveTextContent('três ideologias')
  const choices = within(
    screen.getByRole('radiogroup', { name: 'Ideologia governante' }),
  ).getAllByRole('radio')
  expect(choices).toHaveLength(11)
  expect(choices[3]).toBeDisabled()
  fireEvent.click(choices[0])
  next()
  stage(11, 'Identidade simbólica')
  next()
  expect(screen.getByRole('alert')).toHaveTextContent('cor nacional')
  fireEvent.change(screen.getByLabelText('Cor nacional'), { target: { value: '#225588' } })
  textField('Lema', 'Terra e mar')
  textField('Descrição nacional', 'Um reino costeiro')
  textField('História nacional', 'A travessia fundou a nação.')
  next()
  stage(12, 'Revelação final')
  expect(await screen.findByRole('heading', { name: 'Reino da Aurora' })).toBeInTheDocument()
  expect(screen.getByText('1.000.000')).toBeInTheDocument()
  expect(screen.getByText('265.000.000 AURO')).toBeInTheDocument()
  expect(screen.getByText('1920')).toBeInTheDocument()
  expect(invoke).not.toHaveBeenCalledWith(
    'found-nation',
    expect.objectContaining({ body: expect.objectContaining({ action: 'confirm' }) }),
  )
  invoke.mockResolvedValueOnce({
    error: {
      context: new Response(JSON.stringify({ error: 'O mundo avançou.', code: 'preview' }), {
        status: 409,
      }),
    },
  })
  click('CONFIRMAR FUNDAÇÃO')
  expect(await screen.findByRole('alert')).toHaveTextContent('O mundo avançou.')
  expect(screen.getByRole('button', { name: 'CONFIRMAR FUNDAÇÃO' })).toBeDisabled()
  click('Atualizar prévia')
  expect(await screen.findByRole('heading', { name: 'Reino da Aurora' })).toBeInTheDocument()
  click('CONFIRMAR FUNDAÇÃO')
  expect(await screen.findByRole('heading', { name: 'Painel da nação' })).toBeInTheDocument()
  expect(invoke).toHaveBeenLastCalledWith('found-nation', {
    body: expect.objectContaining({
      action: 'confirm',
      token: 'server-preview',
      draft: expect.objectContaining({
        shortName: 'Aurora',
        article: 'da',
        territoryId: 1,
        capital: 'Nova Aurora',
        currencyCode: 'AURO',
        currencyName: 'Áureo',
        institutions: expect.objectContaining({
          system: 'parlamentarismo',
          localSelection: 'eleitos',
          secondLevel: 'Comunas',
          headOfGovernment: { title: 'Chanceler', name: 'Rui do Vale' },
        }),
        symbols: expect.objectContaining({ color: '#225588', motto: 'Terra e mar' }),
      }),
    }),
  })
}, 15_000)

it('exibe conflito do servidor ao validar nome e mantém a etapa para correção', async () => {
  renderWizard()
  const territory = await screen.findByRole('combobox', { name: 'Escolher território' })
  fireEvent.change(territory, { target: { value: '1' } })
  next()
  textField('Nome curto', 'Aurora')
  invoke.mockResolvedValueOnce({
    error: {
      context: new Response(
        JSON.stringify({ error: 'Já existe uma nação com esse nome.', code: 'name' }),
        { status: 409 },
      ),
    },
  })
  next()
  await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Já existe uma nação'))
  stage(2, 'Nome curto e artigo')
  expect(screen.getByLabelText('Nome curto')).toHaveAttribute('aria-invalid', 'true')
})

it('identifica a resposta da Edge Function antiga sem culpar o preenchimento', async () => {
  renderWizard()
  const territory = await screen.findByRole('combobox', { name: 'Escolher território' })
  fireEvent.change(territory, { target: { value: '1' } })
  next()
  textField('Nome curto', 'Aurora')
  invoke.mockResolvedValueOnce({
    error: {
      context: new Response(JSON.stringify({ error: 'Preencha todos os campos corretamente.' }), {
        status: 400,
      }),
    },
  })
  next()
  expect(await screen.findByRole('alert')).toHaveTextContent(
    'O servidor de fundação precisa ser atualizado para aceitar este formulário.',
  )
  expect(screen.getByLabelText('Nome curto')).toHaveValue('Aurora')
})
