'use client';

import React from 'react';
import LoginManager from '../components/LoginManager/LoginManager';
import { useRouter } from 'next/navigation';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../firebase';

export default function Home() {
  const [user, loading] = useAuthState(auth);
  const router = useRouter();

  React.useEffect(() => {
    if (user) {
      router.push('/dashboard');
    }
  }, [user, router]);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <h1>Welcome to the File Management System</h1>
      <LoginManager />
    </div>
  );
}