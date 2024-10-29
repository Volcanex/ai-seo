// components/Layout/Sidebar.tsx
import React from 'react';
import Link from 'next/link';
import { X, Layout, Search, BarChart2, Settings } from 'lucide-react';
import styles from './Sidebar.module.scss';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  return (
    <div className={`${styles.sidebar} ${isOpen ? styles.open : ''}`}>
      <div className={styles.sidebarHeader}>
        <button onClick={onClose} className={styles.closeButton}>
          <X size={24} />
        </button>
      </div>

      <div className={styles.sidebarContent}>
        <Link href="/models" className={styles.sidebarItem}>
          <Layout size={20} />
          <span>Models</span>
        </Link>
        <Link href="/testing" className={styles.sidebarItem}>
          <Search size={20} />
          <span>Testing</span>
        </Link>
        <Link href="/analytics" className={styles.sidebarItem}>
          <BarChart2 size={20} />
          <span>Analytics</span>
        </Link>
        <Link href="/settings" className={styles.sidebarItem}>
          <Settings size={20} />
          <span>Settings</span>
        </Link>
      </div>
    </div>
  );
};

export default Sidebar;