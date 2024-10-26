'use client';

import React, { useState, useEffect, Suspense } from 'react';
import axios from 'axios';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../../firebase';
import styles from './Model.module.scss';
import { API_URL } from '@/config';
import dynamic from 'next/dynamic';

// Dynamically import components to reduce initial bundle size
const ModelOverview = dynamic(() => import('../ModelOverview/ModelOverview'));
const Actions = dynamic(() => import('../Actions/Actions'));
const JSONExplorer = dynamic(() => import('../JSONExplorer/JSONExplorer'));
const Scraper = dynamic(() => import('../Scraper/Scraper'));
const AltContentGenerator = dynamic(() => import('../AltContentGenerator/AltContentGenerator'));
const ContentRater = dynamic(() => import('../ContentRater/ContentRater'));
const ContentViewer = dynamic(() => import('../ContentViewer/ContentViewer'));
const Testing = dynamic(() => import('../Testing/Testing'));

interface ModelData {
  id: number;
  name: string;
  base_url: string;
  url_column: string;
  created_at: string;
  data: any[];
}

interface ModelProps {
  modelId: string;
}

type MainAreaComponent = 'actions' | 'jsonExplorer' | 'scraper' | 'altContentGenerator' | 'contentRater' | 'contentViewer' | 'testing';

const Model: React.FC<ModelProps> = ({ modelId }) => {
  const [user] = useAuthState(auth);
  const [model, setModel] = useState<ModelData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mainArea, setMainArea] = useState<MainAreaComponent>('actions');
  const [isLoading, setIsLoading] = useState(true);

  const handleAltContentGenerationComplete = () => {
    fetchModel();
  };

  const handleRatingComplete = () => {
    fetchModel();
  };

  const fetchModel = async () => {
    if (!user || !modelId) return;
    try {
      setIsLoading(true);
      const token = await user.getIdToken();
      const response = await axios.get<ModelData>(`${API_URL}/api/models/${modelId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setModel(response.data);
    } catch (error) {
      console.error('Error fetching model:', error);
      setError('Failed to fetch model');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddToModel = async (url: string) => {
    if (!user) return;
    try {
      const token = await user.getIdToken();
      await axios.post(
        `${API_URL}/api/models/${modelId}/add-url`,
        { url },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      await fetchModel();
    } catch (error) {
      console.error('Error adding URL to model:', error);
    }
  };

  useEffect(() => {
    fetchModel();
  }, [user, modelId]);

  const handleScrapeComplete = () => {
    fetchModel();
  };

  if (error) {
    return <div className={styles.error}>{error}</div>;
  }

  if (isLoading || !model) {
    return <div>Loading...</div>;
  }

  return (
    <div className={styles.model}>
      <h1>{model.name}</h1>
      <Suspense fallback={<div>Loading overview...</div>}>
        <ModelOverview model={model} />
      </Suspense>

      <div className={styles.controls}>
        <button onClick={() => setMainArea('actions')}>Actions</button>
        <button onClick={() => setMainArea('jsonExplorer')}>JSON Explorer</button>
        <button onClick={() => setMainArea('scraper')}>Scraper</button>
        <button onClick={() => setMainArea('altContentGenerator')}>Alt Content Generator</button>
        <button onClick={() => setMainArea('contentRater')}>Content Rater</button>
        <button onClick={() => setMainArea('contentViewer')}>Content Viewer</button>
        <button onClick={() => setMainArea('testing')}>Testing</button>
      </div>

      <Suspense fallback={<div>Loading content...</div>}>
        <div className={styles.mainArea}>
          {mainArea === 'actions' && <Actions model={model} />}
          {mainArea === 'jsonExplorer' && <JSONExplorer data={model} />}
          {mainArea === 'scraper' &&
            <Scraper modelId={model.id} onScrapeComplete={handleScrapeComplete} />
          }
          {mainArea === 'altContentGenerator' && (
            <AltContentGenerator
              modelId={model.id}
              onGenerationComplete={handleAltContentGenerationComplete}
            />
          )}
          {mainArea === 'contentRater' && (
            <ContentRater
              modelId={model.id}
              onRatingComplete={handleRatingComplete}
            />
          )}
          {mainArea === 'contentViewer' && (
            <ContentViewer modelData={model.data} />
          )}
          {mainArea === 'testing' && (
            <Testing
              modelId={model.id}
              modelData={model.data}
              onAddToModel={handleAddToModel}
            />
          )}
        </div>
      </Suspense>
    </div>
  );
};

export default Model;