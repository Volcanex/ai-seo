
// components/Layout/Navbar.tsx
import React from 'react';
import Link from 'next/link';
import { Menu, X } from 'lucide-react';
import Profile from '../Profile/Profile';
import styles from './Navbar.module.scss';

interface NavbarProps {
  onMenuClick: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ onMenuClick }) => {
  return (
    <nav className={styles.navbar}>
      <div className={styles.navLeft}>
        <button onClick={onMenuClick} className={styles.menuButton}>
          <Menu size={24} />
        </button>
        <Link href="/" className={styles.logo}>
          AI Testing
        </Link>
      </div>

      <div className={styles.navMiddle}>
        <Link href="/">Home</Link>
        <Link href="/profile">Testing</Link>
        <Link href="/analytics">Testing</Link>
      </div>

      <div className={styles.navRight}>
        <Profile />
      </div>
    </nav>
  );
};

export default Navbar;