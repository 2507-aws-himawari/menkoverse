'use server';

import { signOut } from '@/server/auth';

export async function signOutAction() {
  try {
    await signOut({ redirectTo: '/' });
  } catch (error) {
    console.error('Sign out error:', error);
    throw new Error('サインアウトに失敗しました');
  }
}
