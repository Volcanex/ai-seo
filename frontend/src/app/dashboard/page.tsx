'use client';

import React from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../../firebase';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';

const DynamicDashboard = dynamic(() => import('../../components/Dashboard/Dashboard'), { ssr: false });

export default function DashboardPage() {
  const [user, loading] = useAuthState(auth);
  const router = useRouter();

  React.useEffect(() => {
    if (!user && !loading) {
      router.push('/');
    }
  }, [user, loading, router]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return null; // This will prevent a flash of content before redirect
  }

  return <DynamicDashboard />;
}