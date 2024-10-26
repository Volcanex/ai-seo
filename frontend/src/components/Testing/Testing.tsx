import React, { useState, useEffect } from 'react';
import axios from 'axios';
import styles from './Testing.module.scss';
import { useAuthState } from 'react-firebase-hooks/auth';
import { API_URL } from '@/config';
import { auth } from '../../firebase';

interface TestingProps {
  modelId: number;
  modelData: any[];
  onAddToModel: (url: string) => void;
}

interface SearchResult {
  title: string;
  url: string;
  rank?: number | string;
}

const Testing: React.FC<TestingProps> = ({ modelId, modelData, onAddToModel }) => {
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
  const [user] = useAuthState(auth);

  const handleSearch = async () => {
    setError(null);
    try {
      if (!user) {
        throw new Error("User not authenticated");
      }
      const token = await user.getIdToken();
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
      setResults(response.data);
    } catch (err) {
      console.error('Error during search:', err);
      setError('An error occurred during the search. Please try again.');
    }
  };

  const isUrlInModel = (url: string) => {
    return modelData.some(item => item.url === url);
  };

  const getUrlClass = (url: string) => {
    if (url === highlightedUrl) return styles.highlightedUrl;
    if (isUrlInModel(url)) return styles.existingUrl;
    return styles.newUrl;
  };

  const handleAddToModel = async (url: string) => {
    try {
      await onAddToModel(url);
    } catch (err) {
      setError('Failed to add URL to model. Please try again.');
    }
  };

  const renderResults = () => {
    const startIndex = (currentPage - 1) * resultsPerPage;
    const endIndex = startIndex + resultsPerPage;
    const pageResults = results.slice(startIndex, endIndex);

    return pageResults.map((result, index) => (
      <div key={index} className={`${styles.resultCard} ${getUrlClass(result.url)}`}>
        <span className={styles.resultTitle}>{result.title}</span>
        <span className={styles.resultUrl}>{result.url}</span>
        {result.rank && <span className={styles.resultRank}>Rank: {result.rank}</span>}
        {!isUrlInModel(result.url) && (
          <button onClick={() => handleAddToModel(result.url)} className={styles.addToModelBtn}>+</button>
        )}
      </div>
    ));
  };

  return (
    <div className={styles.testing}>
      <h2>Testing Component</h2>
      <div className={styles.controls}>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Enter your query"
        />
        <select
          value={testingMetric}
          onChange={(e) => setTestingMetric(e.target.value)}
        >
          <option value="google">Google</option>
          <option value="gpt">GPT</option>
        </select>
        {testingMetric === 'gpt' && (
          <input
            type="text"
            value={gptApiKey}
            onChange={(e) => setGptApiKey(e.target.value)}
            placeholder="Enter GPT API Key"
          />
        )}
        <input
          type="number"
          value={maxReturn}
          onChange={(e) => setMaxReturn(Number(e.target.value))}
          placeholder="Max Return"
        />
        <input
          type="number"
          value={maxHighlightSearch}
          onChange={(e) => setMaxHighlightSearch(Number(e.target.value))}
          placeholder="Max Highlight Search"
        />
        <input
          type="text"
          value={highlightedUrl}
          onChange={(e) => setHighlightedUrl(e.target.value)}
          placeholder="Highlighted URL"
        />
        <button onClick={handleSearch}>Search</button>
      </div>
      {error && <div className={styles.error}>{error}</div>}
      <div className={styles.results}>
        {renderResults()}
      </div>
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
        <input
          type="range"
          min="1"
          max="10"
          value={resultsPerPage}
          onChange={(e) => setResultsPerPage(Number(e.target.value))}
        />
        <span>Results per page: {resultsPerPage}</span>
      </div>
    </div>
  );
};

export default Testing;