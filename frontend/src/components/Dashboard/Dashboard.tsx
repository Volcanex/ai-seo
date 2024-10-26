import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../../firebase';
import styles from '../Dashboard/Dashboard.module.scss';
import { API_URL } from '@/config';
import CsvManager from '../CsvManager/CsvManager';
import Link from 'next/link';

interface CSV {
  id: number;
  filename: string;
  uploaded_at: string;
}

interface Model {
  id: number;
  name: string;
  created_at: string;
}

const Dashboard: React.FC = () => {
  const [user] = useAuthState(auth);
  const [csvs, setCsvs] = useState<CSV[]>([]);
  const [models, setModels] = useState<Model[]>([]);
  const [selectedCsvId, setSelectedCsvId] = useState<number | null>(null);
  const [urlColumn, setUrlColumn] = useState('');
  const [baseUrl, setBaseUrl] = useState('');
  const [modelName, setModelName] = useState('');
  const [selectedModel, setSelectedModel] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [showCsvManager, setShowCsvManager] = useState(false);

  // New state for Start Analysing section
  const [analysisUrl, setAnalysisUrl] = useState('');
  const [analysisModelName, setAnalysisModelName] = useState('');
  const [urlError, setUrlError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchCsvs();
      fetchModels();
    }
  }, [user]);

  // Validate URL format
  const isValidUrl = (urlString: string): boolean => {
    try {
      new URL(urlString);
      return true;
    } catch (e) {
      return false;
    }
  };

  // Handle URL input change
  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value;
    setAnalysisUrl(url);
    if (url && !isValidUrl(url)) {
      setUrlError('Please enter a valid URL');
    } else {
      setUrlError(null);
      // Auto-generate model name from URL if none is set
      if (!analysisModelName) {
        try {
          const urlObj = new URL(url);
          setAnalysisModelName(urlObj.hostname);
        } catch (e) {
          // Invalid URL, don't set model name
        }
      }
    }
  };

  // Handle URL submission
  const handleUrlSubmit = async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
    }

    if (!analysisUrl || !isValidUrl(analysisUrl)) {
      setUrlError('Please enter a valid URL');
      return;
    }

    try {
      const token = await user?.getIdToken();
      const response = await axios.post(
        `${API_URL}/api/models`,
        {
          url: analysisUrl,
          model_name: analysisModelName || new URL(analysisUrl).hostname
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      await fetchModels();
      setAnalysisUrl('');
      setAnalysisModelName('');
      setUrlError(null);
    } catch (error) {
      console.error('Error creating model:', error);
      setUrlError('Failed to create model from URL');
    }
  };

  const fetchCsvs = async () => {
    try {
      const token = await user?.getIdToken();
      const response = await axios.get<CSV[]>(`${API_URL}/api/csvs`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCsvs(response.data);
    } catch (error) {
      console.error('Error fetching CSVs:', error);
      setError('Failed to fetch CSVs');
    }
  };

  const fetchModels = async () => {
    try {
      const token = await user?.getIdToken();
      const response = await axios.get<Model[]>(`${API_URL}/api/models`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setModels(response.data);
    } catch (error) {
      console.error('Error fetching models:', error);
      setError('Failed to fetch models');
    }
  };


  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      const token = await user.getIdToken();
      const response = await axios.post<{ id: number }>(`${API_URL}/api/csvs`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`
        }
      });
      console.log("CSV uploaded:", response.data);
      await fetchCsvs();  // Refresh the CSV list
      setSelectedCsvId(response.data.id);  // Automatically select the newly uploaded CSV
    } catch (error) {
      console.error('Error uploading CSV:', error);
      setError('Failed to upload CSV');
    }
  };


  const handleModelCreation = async () => {
    if (!selectedCsvId || !urlColumn || !modelName || !user) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      const token = await user.getIdToken();
      const response = await axios.post<{ id: number }>(`${API_URL}/api/models`, {
        csv_id: selectedCsvId,
        url_column: urlColumn,
        base_url: baseUrl,
        model_name: modelName
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log("Model created:", response.data);
      alert(`Model created with ID: ${response.data.id}`);
      fetchModels();  // Refresh the model list
      // Reset form
      setSelectedCsvId(null);
      setUrlColumn('');
      setBaseUrl('');
      setModelName('');
    } catch (error) {
      console.error('Error creating model:', error);
      setError('Failed to create model');
    }
  };

  const handleModelSelect = async (modelId: number) => {
    try {
      const token = await user?.getIdToken();
      const response = await axios.get(`${API_URL}/api/models/${modelId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSelectedModel(response.data);
    } catch (error) {
      console.error('Error fetching model details:', error);
      setError('Failed to fetch model details');
    }
  };

  const handleModelDelete = async (modelId: number) => {
    if (window.confirm('Are you sure you want to delete this model?')) {
      try {
        const token = await user?.getIdToken();
        await axios.delete(`${API_URL}/api/models/${modelId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        alert('Model deleted successfully');
        fetchModels();  // Refresh the model list
        if (selectedModel && selectedModel.id === modelId) {
          setSelectedModel(null);
        }
      } catch (error) {
        console.error('Error deleting model:', error);
        setError('Failed to delete model');
      }
    }
  };

  const handleCsvDelete = (csvId: number) => {
    // This is a placeholder function. Implement the actual delete logic when you're ready to work on the backend.
    console.log(`Delete CSV with ID: ${csvId}`);
  };

  const handleCsvRename = (csvId: number, newName: string) => {
    // This is a placeholder function. Implement the actual rename logic when you're ready to work on the backend.
    console.log(`Rename CSV with ID: ${csvId} to ${newName}`);
  };

  return (
    <div className={styles.dashboard}>
      <h1>Dashboard</h1>

      {/* New Start Analysing Section */}
      <div className={styles.createModelSection}>
        <h2>Start Analysing</h2>
        <form onSubmit={handleUrlSubmit}>
          <div className={styles.inputGroup}>
            <input
              type="text"
              placeholder="Enter a URL to start analysis"
              value={analysisUrl}
              onChange={handleUrlChange}
              onKeyDown={(e) => e.key === 'Enter' && handleUrlSubmit()}
            />
            <div className={styles.inputSubtitle}>
              Enter a URL to start analysis
            </div>
          </div>
          <input
            type="text"
            placeholder="Model Name (optional)"
            value={analysisModelName}
            onChange={(e) => setAnalysisModelName(e.target.value)}
          />
          {urlError && <div className={styles.error}>{urlError}</div>}
          <button
            type="submit"
            disabled={!analysisUrl || !!urlError}
          >
            Create Model
          </button>
        </form>
      </div>

      {/* Renamed Create Model Section */}
      <div className={styles.createModelSection}>
        <h2>Create Model Manually</h2>
        <select
          value={selectedCsvId || ''}
          onChange={(e) => setSelectedCsvId(Number(e.target.value))}
        >
          <option value="">Select a CSV</option>
          {csvs.map(csv => (
            <option key={csv.id} value={csv.id}>{csv.filename}</option>
          ))}
        </select>

        <button
          onClick={() => setShowCsvManager(!showCsvManager)}
          className={styles.showButton}
        >
          {showCsvManager ? 'Hide CSV Manager' : 'Show CSV Manager'}
        </button>

        {showCsvManager && (
          <CsvManager
            csvs={csvs}
            onCsvUpload={fetchCsvs}
            onCsvSelect={setSelectedCsvId}
          />
        )}

        <input
          type="text"
          placeholder="URL Column Name"
          value={urlColumn}
          onChange={(e) => setUrlColumn(e.target.value)}
        />
        <input
          type="text"
          placeholder="Base URL (optional)"
          value={baseUrl}
          onChange={(e) => setBaseUrl(e.target.value)}
        />
        <input
          type="text"
          placeholder="Model Name"
          value={modelName}
          onChange={(e) => setModelName(e.target.value)}
        />
        <button onClick={handleModelCreation}>Create Model</button>
        {error && <div className={styles.error}>{error}</div>}
      </div>

      {/* Models Section */}
      <div className={styles.modelsSection}>
        <h2>Your Models</h2>
        <ul className={styles.modelsList}>
          {models.map(model => (
            <li key={model.id}>
              <span>{model.name} (Created: {new Date(model.created_at).toLocaleString()})</span>
              <div>
                <button onClick={() => handleModelSelect(model.id)}>View</button>
                <button onClick={() => handleModelDelete(model.id)}>Delete</button>
                <Link href={`/model?id=${model.id}`}>
                  <button>Open Model</button>
                </Link>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* Selected Model View */}
      {selectedModel && (
        <div className={styles.selectedModel}>
          <h2>Selected Model: {selectedModel.name}</h2>
          <p>Base URL: {selectedModel.base_url || 'N/A'}</p>
          <h3>URLs:</h3>
          <ul>
            {selectedModel.data.map((item: any, index: number) => (
              <li key={index}>
                {item.url}
                <ul>
                  {Object.entries(item.additional_data).map(([key, value]) => (
                    <li key={key}>{key}: {value as string}</li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default Dashboard;