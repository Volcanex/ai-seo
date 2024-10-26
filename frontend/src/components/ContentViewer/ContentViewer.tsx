import React, { useState, useEffect } from 'react';
import styles from './ContentViewer.module.scss';

interface ContentViewerProps {
  modelData: any[];
}

const ContentViewer: React.FC<ContentViewerProps> = ({ modelData }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [leftContentType, setLeftContentType] = useState('text_content');
  const [rightContentType, setRightContentType] = useState('alt-content-0');
  const [availableContentTypes, setAvailableContentTypes] = useState<Array<{ value: string, label: string }>>([
    { value: 'text_content', label: 'Original Content' }
  ]);

  // Safe access to current item
  const currentItem = Array.isArray(modelData) && modelData.length > currentIndex
    ? modelData[currentIndex]
    : null;

  // Determine available content types based on current item
  useEffect(() => {
    if (!currentItem) return;

    const types = [{ value: 'text_content', label: 'Original Content' }];
    let altContentIndex = 0;

    // Keep checking for alt-content-N until we don't find one
    while (currentItem[`alt-content-${altContentIndex}`] !== undefined) {
      types.push({
        value: `alt-content-${altContentIndex}`,
        label: `Alt Content ${altContentIndex + 1}`
      });
      altContentIndex++;
    }

    setAvailableContentTypes(types);

    // If current selection isn't available, reset to default
    if (!types.find(t => t.value === leftContentType)) {
      setLeftContentType('text_content');
    }
    if (!types.find(t => t.value === rightContentType)) {
      setRightContentType(types[1]?.value || 'text_content');
    }
  }, [currentIndex, currentItem]);

  const handlePrevious = () => {
    if (!Array.isArray(modelData) || modelData.length === 0) return;
    setCurrentIndex((prevIndex) => (prevIndex > 0 ? prevIndex - 1 : modelData.length - 1));
  };

  const handleNext = () => {
    if (!Array.isArray(modelData) || modelData.length === 0) return;
    setCurrentIndex((prevIndex) => (prevIndex < modelData.length - 1 ? prevIndex + 1 : 0));
  };

  const renderContent = (contentType: string) => {
    if (!currentItem) return null;

    const content = currentItem[contentType];
    const rating = currentItem[`${contentType}-rating`];

    if (content === undefined) return null;

    return (
      <div className={styles.contentBox}>
        <h3>{availableContentTypes.find(type => type.value === contentType)?.label}</h3>
        <div className={styles.content}>{content}</div>
        {rating && (
          <>
            <br />
            <div className={styles.rating}>Rating: {rating}/100</div>
          </>
        )}
        <br />
      </div>
    );
  };

  if (!Array.isArray(modelData) || modelData.length === 0) {
    return <div className={styles.contentViewer}>No data available</div>;
  }

  return (
    <div className={styles.contentViewer}>
      <div className={styles.controls}>
        <button onClick={handlePrevious}>&lt; Previous</button>
        <select
          value={currentIndex}
          onChange={(e) => setCurrentIndex(Number(e.target.value))}
        >
          {modelData.map((item, index) => (
            <option key={index} value={index}>
              {item.url}
            </option>
          ))}
        </select>
        <button onClick={handleNext}>Next &gt;</button>
      </div>
      <div className={styles.contentArea}>
        <div className={styles.contentColumn}>
          <select
            value={leftContentType}
            onChange={(e) => setLeftContentType(e.target.value)}
          >
            {availableContentTypes.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
          {renderContent(leftContentType)}
        </div>
        <div className={styles.contentColumn}>
          <select
            value={rightContentType}
            onChange={(e) => setRightContentType(e.target.value)}
          >
            {availableContentTypes.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
          {renderContent(rightContentType)}
        </div>
      </div>
    </div>
  );
};

export default ContentViewer;