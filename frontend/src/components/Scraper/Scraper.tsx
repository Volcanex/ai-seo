import React, { useState } from 'react';
import axios from 'axios';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../../firebase';
import styles from './Scraper.module.scss';
import { API_URL } from '@/config';

interface ScraperProps {
  modelId: number;
  onScrapeComplete: () => void;
}

const Scraper: React.FC<ScraperProps> = ({ modelId, onScrapeComplete }) => {
  const [user] = useAuthState(auth);
  const [scraping, setScraping] = useState(false);
  const [feedback, setFeedback] = useState<string[]>([]);
  const [lastScrapedId, setLastScrapedId] = useState<number | null>(null);
  const [scrapeLimit, setScrapeLimit] = useState(10);
  const [scrapeDelay, setScrapeDelay] = useState(1);

  const startScraping = async (rescrape: boolean = false) => {
    if (!user) return;

    setScraping(true);
    setFeedback([]);

    try {
      const token = await user.getIdToken();
      const response = await axios.post(
        `${API_URL}/api/models/${modelId}/scrape`,
        { rescrape, limit: scrapeLimit, delay: scrapeDelay },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setFeedback(response.data.messages);
      setLastScrapedId(response.data.last_scraped_id);
      onScrapeComplete();
    } catch (error) {
      console.error('Error during scraping:', error);
      if (axios.isAxiosError(error) && error.response) {
        setFeedback([`An error occurred during scraping: ${error.response.data.error}`]);
      } else {
        setFeedback(['An unknown error occurred during scraping.']);
      }
    } finally {
      setScraping(false);
    }
  };

  return (
    <div className={styles.scraper}>
      <h2>Scraper</h2>
      <div className={styles.controls}>
        <label>
          Scrape Limit:
          <input
            type="number"
            value={scrapeLimit}
            onChange={(e) => setScrapeLimit(Number(e.target.value))}
            min={1}
          />
        </label>
        <label>
          Scrape Delay (seconds):
          <input
            type="number"
            value={scrapeDelay}
            onChange={(e) => setScrapeDelay(Number(e.target.value))}
            min={0}
            step={0.1}
          />
        </label>
        <button onClick={() => startScraping(false)} disabled={scraping}>
          Start Scraping
        </button>
        <button onClick={() => startScraping(true)} disabled={scraping}>
          Rescrape All
        </button>
      </div>
      {lastScrapedId !== null && (
        <p>Last scraped ID: {lastScrapedId}</p>
      )}
      <div className={styles.feedback}>
        {feedback.map((message, index) => (
          <p key={index} className={message.startsWith('Failed') ? styles.error : styles.success}>
            {message}
          </p>
        ))}
      </div>
    </div>

  );
};

export default Scraper;