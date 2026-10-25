'use client'

import { signOut } from 'next-auth/react'

export function SignOutButton() {
  return (
    <button type="button" onClick={() => signOut({ callbackUrl: '/' })} className="font-medium normal-case tracking-normal text-accent underline-offset-4 hover:underline">
      Sign out
    </button>
  )
}
