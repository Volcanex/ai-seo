// components/DuplicatableContainer/DuplicatableContainer.tsx
import React, { useState } from 'react';
import styles from './DuplicatableContainer.module.scss';

interface DuplicatableContainerProps {
  children: React.ReactNode;
  maxInstances?: number;
}

const DuplicatableContainer: React.FC<DuplicatableContainerProps> = ({
  children,
  maxInstances = 3
}) => {
  const [instances, setInstances] = useState([0]);

  const addInstance = () => {
    if (instances.length < maxInstances) {
      setInstances([...instances, instances.length]);
    }
  };

  const removeInstance = (index: number) => {
    setInstances(instances.filter((_, i) => i !== index));
  };

  return (
    <div className={styles.container}>
      <button
        className={styles.addButton}
        onClick={addInstance}
        disabled={instances.length >= maxInstances}
      >
        + Add Comparison
      </button>
      <div className={styles.instancesContainer}>
        {instances.map((instanceId) => (
          <div key={instanceId} className={styles.instance}>
            {instances.length > 1 && (
              <button
                className={styles.removeButton}
                onClick={() => removeInstance(instanceId)}
              >
                ×
              </button>
            )}
            {children}
          </div>
        ))}
      </div>
    </div>
  );
};

export default DuplicatableContainer;