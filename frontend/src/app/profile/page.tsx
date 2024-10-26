'use client';

import React from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../../firebase'; // Adjust this path as needed
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';

const DynamicProfile = dynamic(() => import('../../components/Profile/Profile'), { ssr: false });

export default function ProfilePage() {
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

    return <DynamicProfile />;

}