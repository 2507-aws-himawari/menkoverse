'use client';

import { signOutAction } from '@/app/actions/auth';
import { useTransition } from 'react';

export function SignOut() {
  const [isPending, startTransition] = useTransition();

  return (
    <form action={signOutAction}>
      <button type="submit" disabled={isPending}>
        {isPending ? 'サインアウト中...' : 'サインアウト'}
      </button>
    </form>
  );
}
