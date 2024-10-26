import React, { useState, useEffect } from 'react';
import styles from './ContentViewer.module.scss';

interface ContentViewerProps {
  modelData: any[];
}

const contentTypes = [
  { value: 'text_content', label: 'Original Content' },
  { value: 'alt-content-0', label: 'Alt Content 1' },
  { value: 'alt-content-1', label: 'Alt Content 2' },
  { value: 'alt-content-2', label: 'Alt Content 3' },
  { value: 'alt-content-3', label: 'Alt Content 4' },
];

const ContentViewer: React.FC<ContentViewerProps> = ({ modelData }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [leftContentType, setLeftContentType] = useState('text_content');
  const [rightContentType, setRightContentType] = useState('alt-content-0');

  const currentItem = modelData[currentIndex];

  const handlePrevious = () => {
    setCurrentIndex((prevIndex) => (prevIndex > 0 ? prevIndex - 1 : modelData.length - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prevIndex) => (prevIndex < modelData.length - 1 ? prevIndex + 1 : 0));
  };

  const renderContent = (contentType: string) => {
    const content = currentItem[contentType];
    const rating = currentItem[`${contentType}-rating`];

    return (
      <div className={styles.contentBox}>
        <h3>{contentTypes.find(type => type.value === contentType)?.label}</h3>
        <div className={styles.content}>{content}</div><br></br>
        {rating && <div className={styles.rating}>Rating: {rating}/100</div>}
        <br></br></div>
    );
  };

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
            {contentTypes.map((type) => (
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
            {contentTypes.map((type) => (
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