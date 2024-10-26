import React, { useState } from 'react';
import axios from 'axios';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../../firebase';
import styles from './CsvManager.module.scss';
import { API_URL } from '@/config';

interface CSV {
  id: number;
  filename: string;
  uploaded_at: string;
}

interface CsvManagerProps {
  csvs: CSV[];
  onCsvUpload: () => void;
  onCsvSelect: (csvId: number) => void;
}

const CsvManager: React.FC<CsvManagerProps> = ({ csvs, onCsvUpload, onCsvSelect }) => {
  const [user] = useAuthState(auth);
  const [error, setError] = useState<string | null>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      const token = await user.getIdToken();
      await axios.post<{ id: number }>(`${API_URL}/api/csvs`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`
        }
      });
      onCsvUpload();
    } catch (error) {
      console.error('Error uploading CSV:', error);
      setError('Failed to upload CSV');
    }
  };

  const handleCsvDelete = async (csvId: number) => {
    try {
      const token = await user?.getIdToken();
      await axios.delete(`${API_URL}/api/csvs/${csvId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      onCsvUpload();
    } catch (error) {
      console.error('Error deleting CSV:', error);
      setError('Failed to delete CSV');
    }
  };

  const handleCsvRename = async (csvId: number, newName: string) => {
    try {
      const token = await user?.getIdToken();
      await axios.put(`${API_URL}/api/csvs/${csvId}`, { filename: newName }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      onCsvUpload();
    } catch (error) {
      console.error('Error renaming CSV:', error);
      setError('Failed to rename CSV');
    }
  };

  return (
    <div className={styles.csvmanager}>
      <h2>CSV Files</h2>
      <input type="file" accept=".csv" onChange={handleFileUpload} />
      {error && <div className={styles.error}>{error}</div>}
      <ul className={styles.csvList}>
        {csvs.map(csv => (
          <li key={csv.id}>
            <span>{csv.filename}</span>
            <div className={styles.actions}>
              <button onClick={() => onCsvSelect(csv.id)}>Select</button>
              <div className={styles.dropdown}>
                <button className={styles.dropbtn}>⋮</button>
                <div className={styles.dropdownContent}>
                  <a href="#" onClick={() => {
                    const newName = prompt('Enter new name:', csv.filename);
                    if (newName) handleCsvRename(csv.id, newName);
                  }}>Rename</a>
                  <a href="#" onClick={() => handleCsvDelete(csv.id)}>Delete</a>
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default CsvManager;