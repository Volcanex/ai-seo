import React from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../../firebase'; // Adjust this path as needed
import styles from './Profile.module.scss';

const Profile: React.FC = () => {
  const [user] = useAuthState(auth);

  if (!user) {
    return <div>Please sign in to view your profile.</div>;
  }

  return (
    <div className={styles.profile}>
      <div className={styles.profileInfo}>
        <img src={user.photoURL || '/default-avatar.png'} alt="Profile" className={styles.avatar} />
        <div className={styles.details}>
          <p><strong>Name:</strong> {user.displayName}</p>
          <p><strong>Email:</strong> {user.email}</p>
          <p><strong>Email Verified:</strong> {user.emailVerified ? 'Yes' : 'No'}</p>
        </div>
      </div>
    </div>
  );
};

export default Profile;