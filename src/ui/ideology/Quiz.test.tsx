import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { QUESTIONS, scoreQuiz, type Answer, type Answers } from '@/domain/ideology'
import { Quiz } from './Quiz'

function Harness({ admin = false }: { admin?: boolean }) {
  const [answers, setAnswers] = useState<Answers>({})
  const [done, setDone] = useState(false)
  if (done) return <p>concluído: {String(Object.keys(scoreQuiz(answers)).length)} eixos</p>
  return (
    <Quiz
      answers={answers}
      onAnswer={(id: string, answer: Answer) => setAnswers((a) => ({ ...a, [id]: answer }))}
      onFinish={() => setDone(true)}
      onRandomFill={
        admin
          ? () => setAnswers(Object.fromEntries(QUESTIONS.map((q) => [q.id, 3 as Answer])))
          : undefined
      }
    />
  )
}

const progress = () => screen.getByRole('progressbar')

describe('Quiz', () => {
  it('mostra uma pergunta por vez, com progresso 1/36 e 5 respostas', () => {
    render(<Harness />)
    expect(screen.getByText('1/36')).toBeInTheDocument()
    expect(progress()).toHaveAttribute('aria-valuenow', '1')
    expect(screen.getByRole('heading', { name: QUESTIONS[0].text })).toBeInTheDocument()
    const options = screen.getAllByRole('radio')
    expect(options).toHaveLength(5)
    expect(options[0]).toHaveTextContent('Discordo totalmente')
    expect(options[4]).toHaveTextContent('Concordo totalmente')
  })

  it('clicar numa resposta avança para a próxima pergunta', async () => {
    render(<Harness />)
    await userEvent.click(screen.getByRole('radio', { name: /Concordo totalmente/ }))
    expect(screen.getByText('2/36')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: QUESTIONS[1].text })).toBeInTheDocument()
  })

  it('as teclas 1 a 5 respondem e avançam', async () => {
    render(<Harness />)
    await userEvent.keyboard('4')
    await userEvent.keyboard('2')
    expect(screen.getByText('3/36')).toBeInTheDocument()
  })

  it('o botão voltar mostra a pergunta anterior com a resposta marcada', async () => {
    render(<Harness />)
    const back = screen.getByRole('button', { name: 'Voltar à pergunta anterior' })
    expect(back).toBeDisabled()
    await userEvent.keyboard('5')
    await userEvent.click(back)
    expect(screen.getByText('1/36')).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: /Concordo totalmente/ })).toHaveAttribute(
      'aria-checked',
      'true',
    )
  })

  it('não oferece o resultado enquanto faltam respostas', () => {
    render(<Harness />)
    expect(screen.queryByRole('button', { name: 'Ver resultado' })).toBeNull()
    expect(screen.getByRole('status')).toHaveTextContent('Faltam 36 resposta(s)')
  })

  it('responder as 36 libera "Ver resultado"', async () => {
    render(<Harness />)
    await userEvent.keyboard('3'.repeat(36))
    await userEvent.click(screen.getByRole('button', { name: 'Ver resultado' }))
    expect(screen.getByText('concluído: 12 eixos')).toBeInTheDocument()
  })

  it('preenchimento aleatório só existe para admin', async () => {
    const { unmount } = render(<Harness />)
    expect(screen.queryByRole('button', { name: /aleatoriamente/ })).toBeNull()
    unmount()
    render(<Harness admin />)
    await userEvent.click(screen.getByRole('button', { name: /aleatoriamente/ }))
    expect(screen.getByRole('button', { name: 'Ver resultado' })).toBeInTheDocument()
  })
})
