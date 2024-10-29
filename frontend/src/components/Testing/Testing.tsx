import React, { useState, useEffect } from 'react';
import axios from 'axios';
import styles from './Testing.module.scss';
import { useAuthState } from 'react-firebase-hooks/auth';
import { API_URL } from '@/config';
import { auth } from '../../firebase';

interface ModelDataItem {
  url: string;
  [key: string]: any;
}

interface ModelData {
  data: ModelDataItem[];
  queries: Array<{
    query: string;
    results: SearchResult[];
    method: string;
    timestamp: string;
    parameters: {
      max_return: number;
      max_highlight_search: number;
      highlighted_url: string | null;
    };
  }>;
}

interface TestingProps {
  modelId: number;
  modelData: ModelData | ModelDataItem[]; // Accept both new and old formats
  onAddToModel: (url: string) => void;
}

interface SearchResult {
  title: string;
  url: string;
  rank?: number | string;
}

const Testing: React.FC<TestingProps> = ({ modelId, modelData, onAddToModel }) => {
  const [user] = useAuthState(auth);
  const [query, setQuery] = useState('');
  const [testingMetric, setTestingMetric] = useState('google');
  const [maxReturn, setMaxReturn] = useState(5);
  const [maxHighlightSearch, setMaxHighlightSearch] = useState(50);
  const [highlightedUrl, setHighlightedUrl] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [gptApiKey, setGptApiKey] = useState('');
  const [resultsPerPage, setResultsPerPage] = useState(5);
  const [currentPage, setCurrentPage] = useState(1);
  const [isAddingUrl, setIsAddingUrl] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSearch = async () => {
    setError(null);
    setIsLoading(true);
    try {
      if (!user) {
        throw new Error("User not authenticated");
      }
      const token = await user.getIdToken();
      console.log('Sending search request...'); // Debug log
      const response = await axios.post(`${API_URL}/api/models/${modelId}/test`,
        {
          query,
          testMethod: testingMetric,
          maxReturn,
          maxHighlightSearch,
          highlightedUrl
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      console.log('Search response:', response.data); // Debug log
      setResults(response.data || []);
    } catch (err) {
      console.error('Error during search:', err);
      setError('An error occurred during the search. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const getModelUrls = () => {
    if (!modelData) return [];

    // Handle new format
    if ('data' in modelData && Array.isArray(modelData.data)) {
      return modelData.data;
    }

    // Handle old format
    if (Array.isArray(modelData)) {
      return modelData;
    }

    return [];
  };

  const isUrlInModel = (url: string) => {
    const modelUrls = getModelUrls();
    return modelUrls.some(item => {
      const modelUrl = item?.url || '';
      return normalizeUrl(modelUrl) === normalizeUrl(url);
    });
  };

  const normalizeUrl = (url: string) => {
    if (!url) return '';
    let normalized = url.toLowerCase();
    normalized = normalized.replace(/^https?:\/\/(www\.)?/, '');
    normalized = normalized.replace(/\/$/, '');
    return normalized;
  };

  const getUrlClass = (url: string) => {
    if (url === highlightedUrl) return styles.highlightedUrl;
    if (isUrlInModel(url)) return styles.existingUrl;
    return styles.newUrl;
  };

  const handleAddToModel = async (url: string) => {
    if (isAddingUrl) return;
    setIsAddingUrl(true);
    setError(null);

    try {
      if (!user) {
        throw new Error("User not authenticated");
      }
      const token = await user.getIdToken();
      console.log('Adding URL:', url); // Debug log
      await onAddToModel(url);
    } catch (err) {
      console.error('Error adding URL:', err);
      setError('Failed to add URL to model. Please try again.');
    } finally {
      setIsAddingUrl(false);
    }
  };

  const renderResults = () => {
    if (isLoading) {
      return <div className={styles.loading}>Loading results...</div>;
    }

    if (!results.length) {
      return <div className={styles.noResults}>No results found</div>;
    }

    const startIndex = (currentPage - 1) * resultsPerPage;
    const endIndex = startIndex + resultsPerPage;
    const pageResults = results.slice(startIndex, endIndex);

    return (
      <div className={styles.resultsContainer}>
        {pageResults.map((result, index) => {
          const absoluteIndex = startIndex + index + 1;
          const inModel = isUrlInModel(result.url);

          return (
            <div key={index} className={`${styles.resultCard} ${getUrlClass(result.url)}`}>
              <div className={styles.resultRankBadge}>#{absoluteIndex}</div>
              <div className={styles.resultHeader}>
                <span className={styles.resultTitle}>{result.title}</span>
              </div>
              <div className={styles.resultContent}>
                <span className={styles.resultUrl}>{result.url}</span>
                {result.rank && <span className={styles.resultRank}>Rank: {result.rank}</span>}
              </div>
              <div className={styles.resultActions}>
                {!inModel ? (
                  <button
                    onClick={() => handleAddToModel(result.url)}
                    className={styles.addToModelBtn}
                    disabled={isAddingUrl}
                  >
                    {isAddingUrl ? '...' : '+'}
                  </button>
                ) : (
                  <span className={styles.inModelTag}>In Model</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className={styles.testing}>
      <h2>Testing Component</h2>
      <div className={styles.controls}>
        <div className={styles.controlGroup}>
          <label>Search Query</label>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Enter your query"
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
        </div>

        <div className={styles.controlGroup}>
          <label>Search Method</label>
          <select
            value={testingMetric}
            onChange={(e) => setTestingMetric(e.target.value)}
          >
            <option value="google">Google</option>
            <option value="gpt">GPT</option>
          </select>
        </div>

        {testingMetric === 'gpt' && (
          <div className={styles.controlGroup}>
            <label>GPT API Key</label>
            <input
              type="text"
              value={gptApiKey}
              onChange={(e) => setGptApiKey(e.target.value)}
              placeholder="Enter GPT API Key"
            />
          </div>
        )}

        <div className={styles.controlGroup}>
          <label>Max Results</label>
          <input
            type="number"
            value={maxReturn}
            onChange={(e) => setMaxReturn(Number(e.target.value))}
            placeholder="Max Return"
          />
        </div>

        <div className={styles.controlGroup}>
          <label>Max Highlight Search</label>
          <input
            type="number"
            value={maxHighlightSearch}
            onChange={(e) => setMaxHighlightSearch(Number(e.target.value))}
            placeholder="Max Highlight Search"
          />
        </div>

        <div className={styles.controlGroup}>
          <label>Highlighted URL</label>
          <input
            type="text"
            value={highlightedUrl}
            onChange={(e) => setHighlightedUrl(e.target.value)}
            placeholder="Enter URL to highlight"
          />
        </div>

        <button
          onClick={handleSearch}
          disabled={isLoading}
        >
          {isLoading ? 'Searching...' : 'Search'}
        </button>
      </div>

      {error && <div className={styles.error}>{error}</div>}

      <div className={styles.results}>
        {renderResults()}
      </div>

      {results.length > 0 && (
        <div className={styles.pagination}>
          <button
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
          >
            Previous
          </button>
          <span>Page {currentPage}</span>
          <button
            onClick={() => setCurrentPage(prev => prev + 1)}
            disabled={currentPage * resultsPerPage >= results.length}
          >
            Next
          </button>
          <div className={styles.resultsPerPage}>
            <span>Results per page: {resultsPerPage}</span>
            <input
              type="range"
              min="1"
              max="10"
              value={resultsPerPage}
              onChange={(e) => setResultsPerPage(Number(e.target.value))}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default Testing;