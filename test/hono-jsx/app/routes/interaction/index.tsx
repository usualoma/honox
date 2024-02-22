import Counter, { NamedCounter } from '../../islands/Counter'

export default function Interaction() {
  return (
    <>
      <Counter initial={5} id='default' />
      <NamedCounter initial={10} id='named' />
    </>
  )
}
