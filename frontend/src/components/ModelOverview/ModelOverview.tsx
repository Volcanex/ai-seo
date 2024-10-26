import React from 'react';
import styles from './ModelOverview.module.scss';

interface ModelOverviewProps {
  model: {
    id: number;
    name: string;
    base_url: string;
    url_column: string;
    created_at: string;
    data: any[]; // Define a more specific type if possible
  };
}

const ModelOverview: React.FC<ModelOverviewProps> = ({ model }) => {
  return (
    <div className={styles.modeloverview}>
      <h2>Model Overview</h2>
      <p>Name: {model.name}</p>
      <p>Base URL: {model.base_url || 'N/A'}</p>
      <p>URL Column: {model.url_column}</p>
      <p>Created At: {new Date(model.created_at).toLocaleString()}</p>
      <p>Number of URLs: {model.data.length}</p>
      {/* Add more overview information as needed */}
    </div>
  );
};

export default ModelOverview;