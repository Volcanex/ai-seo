import React, { useState } from 'react';
import styles from './JSONExplorer.module.scss';

interface JSONExplorerProps {
  data: any;
}

const JSONExplorer: React.FC<JSONExplorerProps> = ({ data }) => {
  const [expandedKeys, setExpandedKeys] = useState<Set<string>>(new Set());

  const toggleExpand = (key: string) => {
    const newExpandedKeys = new Set(expandedKeys);
    if (newExpandedKeys.has(key)) {
      newExpandedKeys.delete(key);
    } else {
      newExpandedKeys.add(key);
    }
    setExpandedKeys(newExpandedKeys);
  };

  const renderValue = (value: any, key: string, path: string) => {
    if (typeof value === 'object' && value !== null) {
      return (
        <div key={key}>
          <span
            className={styles.key}
            onClick={() => toggleExpand(path)}
          >
            {key} {expandedKeys.has(path) ? '▼' : '►'}
          </span>
          {expandedKeys.has(path) && (
            <div className={styles.nested}>
              {Object.entries(value).map(([k, v]) =>
                renderValue(v, k, `${path}.${k}`)
              )}
            </div>
          )}
        </div>
      );
    } else {
      return (
        <div key={key}>
          <span className={styles.key}>{key}:</span>{' '}
          <span className={styles.value}>{JSON.stringify(value)}</span>
        </div>
      );
    }
  };

  return (
    <div className={styles.jsonExplorer}>
      {Object.entries(data).map(([key, value]) =>
        renderValue(value, key, key)
      )}
    </div>
  );
};

export default JSONExplorer;