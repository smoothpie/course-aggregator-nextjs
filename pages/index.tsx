import Link from 'next/link'
import s from './Home.module.scss'

export default function Home() {
  return (
    <main className={s.main}>
      <header className={s.header}>
        <h1>Coding School</h1>
        <p>Searchable collection of some random coding courses. Created during a Next.js, MongoDB, Prisma and Clerk tutorial</p>
        <Link href="/courses">
          <button>Browse courses</button>
        </Link>
      </header>
    </main>
  )
}
