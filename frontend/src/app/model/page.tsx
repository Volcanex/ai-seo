'use client';

import React, { Suspense } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../../firebase';
import { useRouter, useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import Layout from '../../components/Layout/Layout';

const DynamicModel = dynamic(() => import('../../components/Model/Model'), {
    ssr: false,
    loading: () => <div>Loading Model Component...</div>
});

function ModelContent() {
    const [user, loading] = useAuthState(auth);
    const router = useRouter();
    const searchParams = useSearchParams();
    const id = searchParams.get('id');

    React.useEffect(() => {
        if (!user && !loading) {
            router.push('/');
        }
    }, [user, loading, router]);

    if (loading) {
        return <div>Loading...</div>;
    }

    if (!user || !id) {
        return null;
    }

    return <DynamicModel modelId={id} />;
}

export default function ModelPage() {
    return (
        <Suspense fallback={<div>Loading page...</div>}>

            <Layout><ModelContent /></Layout>
        </Suspense>
    );
}