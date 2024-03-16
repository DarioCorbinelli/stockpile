import { Icons } from '@/components/icons/Icons'
import Link from 'next/link'
import { FC, PropsWithChildren } from 'react'

interface layoutProps extends PropsWithChildren {}

const layout: FC<layoutProps> = ({ children }) => {
  return (
    <main className='flex min-h-screen items-stretch justify-between'>
      <div className='hidden max-w-3xl flex-1 flex-col justify-between bg-primary p-10 text-primary-foreground xl:flex'>
        <Link href='/' className='flex items-center gap-4'>
          <Icons.logo className='h-8 w-8 fill-primary-foreground' />
          <strong className='text-2xl font-semibold'>Stockpile</strong>
        </Link>
        <p className='text-lg'>Gestione del magazzino per piccole e medie imprese: semplice, efficace, conveniente.</p>
      </div>
      <div className='flex flex-1 items-center justify-center p-8'>
        <div className='mx-auto flex max-w-sm flex-col items-center pb-10 pt-20 text-center'>
          <Link href='/' className='flex items-center gap-4'>
            <Icons.logo className='mb-2 h-14 w-14 fill-primary' />
          </Link>

          {children}
        </div>
      </div>
    </main>
  )
}

export default layout
