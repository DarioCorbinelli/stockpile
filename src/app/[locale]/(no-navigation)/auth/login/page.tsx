import LoginForm from '@/components/auth/LoginForm'
import { buttonVariants } from '@/components/ui/Button'
import Link from 'next/link'
import { FC } from 'react'

interface pageProps {}

const page: FC<pageProps> = ({}) => {
  return (
    <>
      <h1 className='text-2xl font-semibold tracking-tighter'>Accedi al tuo account</h1>
      <p className='mt-2 text-sm text-base-500'>Inserisci la tua credenziali per accedere all'account parole parole parole</p>
      <LoginForm className='mt-6' />
      <p className='mt-6 text-sm leading-6 text-base-500'>
        Continuando, accetti i nostri{' '}
        <Link href='/terms-of-service' className='underline underline-offset-2'>
          Termini di servizio
        </Link>{' '}
        e{' '}
        <Link href='/privacy' className='underline underline-offset-2'>
          l'Informativa sulla privacy
        </Link>
        .
      </p>
      <Link href='/auth/register' className={buttonVariants({ variant: 'ghost', className: 'absolute right-5 top-5 lg:right-20 lg:top-10' })}>
        Crea account
      </Link>
    </>
  )
}

export default page
