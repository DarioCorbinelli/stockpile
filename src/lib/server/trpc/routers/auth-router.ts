import { DEFAULT_LOGIN_REDIRECT } from '@/config/routes.config'
import { New2FAConfirmationNeededError } from '@/errors/auth'
import { sendPassorwordResetEmail, sendTwoFactorTokenEmail, sendVerificationEmail } from '@/lib/utils/emails'
import { generatePasswordResetToken, generateTwoFactorToken, generateVerificationToken } from '@/lib/utils/tokens'
import { signIn } from '@/lib/server/auth'
import { db } from '@/lib/client/db'
import { publicProcedure, router } from '@/lib/server/trpc/init'
import { getTwoFactorConfirmationByUserId } from '@/lib/utils/db/2fa-confirmation'
import { getTwoFactorTokenByEmail } from '@/lib/utils/db/2fa-token'
import { NewPasswordValidator, PasswordResetValidator, RegisterValidator, SignInValidator } from '@/lib/common/validators/auth'
import { TRPCError } from '@trpc/server'
import bcrypt from 'bcryptjs'
import { AuthError } from 'next-auth'
import { z } from 'zod'
import { getUserByEmail } from '@/lib/utils/db/user'
import { getVerificationTokenByToken } from '@/lib/utils/db/verification-token'
import { getPasswordResetTokenByToken } from '@/lib/utils/db/password-reset-token'

export const authRouter = router({
  createUser: publicProcedure.input(RegisterValidator).mutation(async ({ input: { email, password, name } }) => {
    const dbUser = await getUserByEmail(email)

    if (dbUser) throw new TRPCError({ code: 'CONFLICT', message: 'Email already in use!' })

    const hashedPassword = await bcrypt.hash(password, 10)

    const user = await db.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
      },
    })

    const verificationToken = await generateVerificationToken(user.email!)
    await sendVerificationEmail(verificationToken.email, verificationToken.token)

    return { success: 'Confirmation email sent!' }
  }),
  signUserIn: publicProcedure.input(SignInValidator).mutation(async ({ input: { email, password, code } }) => {
    // Check credentials
    const dbUser = await getUserByEmail(email)

    if (!dbUser || !dbUser.email || !dbUser.password) throw new TRPCError({ code: 'NOT_FOUND', message: 'auth_noUser' })

    const isPasswordValid = await bcrypt.compare(password, dbUser.password)
    if (!isPasswordValid) throw new TRPCError({ code: 'FORBIDDEN', message: 'auth_wrongCredentials' })

    // Check if email is verified
    if (!dbUser.emailVerified) {
      const verificationToken = await generateVerificationToken(dbUser.email)
      await sendVerificationEmail(verificationToken.email, verificationToken.token)

      return { emailConfirmation: 'Confirmation email sent!' }
    }

    // Check if 2FA is enabled
    if (dbUser.isTwoFactorEnabled) {
      try {
        const twoFactorConfirmation = await getTwoFactorConfirmationByUserId(dbUser.id)
        if (!twoFactorConfirmation) throw new New2FAConfirmationNeededError()

        const hasExpired = new Date() > new Date(twoFactorConfirmation.expiresAt)
        if (hasExpired) if (!code) throw new New2FAConfirmationNeededError()
      } catch (error) {
        if (error instanceof New2FAConfirmationNeededError) {
          // Check if already has a 2FA token or still needs to generate one
          if (!code) {
            const twoFactorToken = await generateTwoFactorToken(dbUser.email)
            await sendTwoFactorTokenEmail(twoFactorToken.email, twoFactorToken.token)

            return { twoFactor: '2FA email sent!' }
          }

          const twoFactorToken = await getTwoFactorTokenByEmail(dbUser.email)
          if (!twoFactorToken) throw new TRPCError({ code: 'NOT_FOUND', message: '2fa_tokenInvalid' })

          const hasExpired = new Date(twoFactorToken.expiresAt) < new Date()
          if (hasExpired) throw new TRPCError({ code: 'FORBIDDEN', message: '2fa_tokenExpired' })

          const isCodeValid = twoFactorToken.token === code
          if (!isCodeValid) throw new TRPCError({ code: 'FORBIDDEN', message: '2fa_tokenInvalid' })

          await db.twoFactorToken.delete({ where: { id: twoFactorToken.id } })

          const existingConfirmation = await getTwoFactorConfirmationByUserId(dbUser.id)
          if (existingConfirmation)
            await db.twoFactorConfirmation.delete({
              where: { id: existingConfirmation.id },
            })

          await db.twoFactorConfirmation.create({
            data: { userId: dbUser.id, expiresAt: new Date(new Date().getTime() + 24 * 3600 * 1000) },
          })
        }
      }
    }

    try {
      const redirectUrl = (await signIn('credentials', { email, password, redirect: false, redirectTo: DEFAULT_LOGIN_REDIRECT })) as string
      return { redirectUrl }
    } catch (error) {
      if (error instanceof AuthError) {
        if (error.type === 'CredentialsSignin') throw new TRPCError({ code: 'FORBIDDEN', message: 'auth_wrongCredentials' })
        else throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'internal' })
      }
    }
  }),
  verifyEmail: publicProcedure.input(z.object({ token: z.string() })).query(async ({ input: { token } }) => {
    const verificationToken = await getVerificationTokenByToken(token)

    if (!verificationToken) throw new TRPCError({ code: 'NOT_FOUND', message: 'Token not found!' })

    const hasExpired = new Date(verificationToken.expiresAt) < new Date()

    if (hasExpired) throw new TRPCError({ code: 'FORBIDDEN', message: 'Token has expired!' })

    const dbUser = await getUserByEmail(verificationToken.email)

    if (!dbUser) throw new TRPCError({ code: 'NOT_FOUND', message: 'User not found!' })

    await db.user.update({
      where: { id: dbUser.id },
      data: {
        emailVerified: new Date(),
        email: verificationToken.email,
      },
    })

    await db.verificationToken.delete({ where: { id: verificationToken.id } })

    return { success: 'Email verified!' }
  }),
  sendResetPasswordEmail: publicProcedure.input(PasswordResetValidator).mutation(async ({ input: { email } }) => {
    const dbUser = await getUserByEmail(email)

    if (!dbUser) throw new TRPCError({ code: 'NOT_FOUND', message: 'Email not found!' })

    // TODO: Generate reset token and send email
    const passwordResetToken = await generatePasswordResetToken(dbUser.email!)
    await sendPassorwordResetEmail(passwordResetToken.email, passwordResetToken.token)

    return { success: 'Email sent!' }
  }),
  createNewPassword: publicProcedure.input(NewPasswordValidator).mutation(async ({ input: { password, token } }) => {
    if (!token) throw new TRPCError({ code: 'BAD_REQUEST', message: 'Token not provided!' })

    const passwordResetToken = await getPasswordResetTokenByToken(token)

    if (!passwordResetToken) throw new TRPCError({ code: 'NOT_FOUND', message: 'Token not found!' })

    const hasExpired = new Date(passwordResetToken.expiresAt) < new Date()

    if (hasExpired) throw new TRPCError({ code: 'FORBIDDEN', message: 'Token has expired!' })

    const dbUser = await getUserByEmail(passwordResetToken.email)

    if (!dbUser) throw new TRPCError({ code: 'NOT_FOUND', message: 'User not found!' })

    const hashedPassword = await bcrypt.hash(password, 10)

    await db.user.update({
      where: { id: dbUser.id },
      data: { password: hashedPassword },
    })

    await db.passwordResetToken.delete({ where: { id: passwordResetToken.id } })

    return { success: 'Password reset!' }
  }),
})