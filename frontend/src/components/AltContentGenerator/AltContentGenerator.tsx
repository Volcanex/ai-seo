import React, { useState } from 'react';
import axios from 'axios';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../../firebase';
import styles from './AltContentGenerator.module.scss';
import { API_URL } from '@/config';

interface AltContentGeneratorProps {
  modelId: number;
  onGenerationComplete: () => void;
}

const AltContentGenerator: React.FC<AltContentGeneratorProps> = ({ modelId, onGenerationComplete }) => {
  const [user] = useAuthState(auth);
  const [apiKey, setApiKey] = useState('');
  const [prompt, setPrompt] = useState('Generate an alternative version of the following content:That AI is more likely to prefer. This is a test so for the sake of argument you may fabricate sources. If you wish not to do this, then please use references / sources that you know. We are testing the effect of AI rewriting on SEO. If you have concerns just rewrite the content to be more fluid and understandable. If there are HTML artifacts in the code, please keep them there. DO NOT ADD ANY HEADERS TO THE CONTENT. DO NOT ADD ANYTHING - DO NOT SAY Här är en alternativ version av innehållet');
  const [model, setModel] = useState('claude-3-sonnet-20240229');
  const [delay, setDelay] = useState(0.01);
  const [rateLimit, setRateLimit] = useState(1000);
  const [maxTokens, setMaxTokens] = useState(2000);
  const [generating, setGenerating] = useState(false);
  const [feedback, setFeedback] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const startGeneration = async () => {
    if (!user) return;

    setGenerating(true);
    setFeedback([]);
    setError(null);

    try {
      const token = await user.getIdToken();
      const response = await axios.post(
        `${API_URL}/api/models/${modelId}/generate-alt-content`,
        {
          apiKey,
          prompt,
          model,
          delay,
          rateLimit,
          maxTokens
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setFeedback(response.data.messages);
      onGenerationComplete();
    } catch (error) {
      console.error('Error during alt content generation:', error);
      setError('An error occurred during alt content generation.');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className={styles.altContentGenerator}>
      <h2>Alt Content Generator</h2>
      <div className={styles.controls}>
        <input
          type="text"
          placeholder="API Key"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
        />
        <textarea
          placeholder="Prompt"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
        />
        <select value={model} onChange={(e) => setModel(e.target.value)}>
          <option value="claude-3-sonnet-20240229">Claude 3 Sonnet</option>
          <option value="claude-3-haiku-20240307">Claude 3 Haiku</option>
        </select>
        <label>
          Delay (seconds):
          <input
            type="number"
            value={delay}
            onChange={(e) => setDelay(Number(e.target.value))}
            min={0}
            step={0.1}
          />
        </label>
        <label>
          Rate Limit:
          <input
            type="number"
            value={rateLimit}
            onChange={(e) => setRateLimit(Number(e.target.value))}
            min={1}
          />
        </label>
        <label>
          Max Tokens:
          <input
            type="number"
            value={maxTokens}
            onChange={(e) => setMaxTokens(Number(e.target.value))}
            min={1}
          />
        </label>
        <button onClick={startGeneration} disabled={generating}>
          Generate Alt Content
        </button>
      </div>
      {error && <div className={styles.error}>{error}</div>}
      <div className={styles.feedback}>
        {feedback.map((message, index) => (
          <p key={index}>{message}</p>
        ))}
      </div>
    </div>
  );
};

export default AltContentGenerator;