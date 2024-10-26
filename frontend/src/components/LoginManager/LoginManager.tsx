'use client';

import React from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth';
import { auth } from '../../firebase';
import { useRouter } from 'next/navigation';

const LoginManager: React.FC = () => {
  const [user, loading, error] = useAuthState(auth);
  const router = useRouter();

  const signIn = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      router.push('/dashboard');
    } catch (error) {
      console.error("Error signing in with Google", error);
    }
  };

  const logOut = async () => {
    try {
      await signOut(auth);
      router.push('/');
    } catch (error) {
      console.error("Error signing out", error);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error.message}</div>;
  }

  if (user) {
    return (
      <div>
        <img src={user.photoURL || undefined} alt="User" style={{ width: '30px', borderRadius: '50%' }} />
        <span>{user.displayName}</span>
        <button onClick={logOut}>Log out</button>
      </div>
    );
  }

  return <button onClick={signIn}>Log in with Google</button>;
};

export default LoginManager;