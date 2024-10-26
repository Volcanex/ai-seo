import React, { useState } from 'react';
import axios from 'axios';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../../firebase';
import styles from './ContentRater.module.scss';
import { API_URL } from '@/config';

interface ContentRaterProps {
  modelId: number;
  onRatingComplete: () => void;
}

const ContentRater: React.FC<ContentRaterProps> = ({ modelId, onRatingComplete }) => {
  const [user] = useAuthState(auth);
  const [apiKey, setApiKey] = useState('');
  const [contentType, setContentType] = useState('text_content');
  const [ratingMethod, setRatingMethod] = useState('claude');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string[]>([]);
  const [totalRated, setTotalRated] = useState<number | null>(null);

  const rateContent = async () => {
    if (!user) return;

    setLoading(true);
    setError(null);
    setFeedback([]);
    setTotalRated(null);

    try {
      const token = await user.getIdToken();
      const response = await axios.post(
        `${API_URL}/api/models/${modelId}/rate-content`,
        {
          apiKey,
          contentType,
          ratingMethod
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setFeedback(response.data.messages);
      setTotalRated(response.data.total_rated);
      onRatingComplete();
    } catch (error) {
      console.error('Error during content rating:', error);
      setError('An error occurred during content rating.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.contentRater}>
      <h2>Content Rater</h2>
      <div className={styles.controls}>
        <input
          type="text"
          placeholder="API Key"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
        />
        <select value={contentType} onChange={(e) => setContentType(e.target.value)}>
          <option value="text_content">Original Content</option>
          <option value="alt-content-0">Alt Content 1</option>
          <option value="alt-content-1">Alt Content 2</option>
          <option value="alt-content-2">Alt Content 3</option>
        </select>
        <select value={ratingMethod} onChange={(e) => setRatingMethod(e.target.value)}>
          <option value="claude">Claude</option>
        </select>
        <button onClick={rateContent} disabled={loading}>
          Rate Content
        </button>
      </div>
      {error && <div className={styles.error}>{error}</div>}
      {totalRated !== null && (
        <div className={styles.summary}>
          <h3>Total items rated: {totalRated}</h3>
        </div>
      )}
      <div className={styles.feedback}>
        {feedback.map((message, index) => (
          <p key={index}>{message}</p>
        ))}
      </div>
    </div>
  );
};

export default ContentRater;