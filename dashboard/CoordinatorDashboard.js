import React, { useState } from 'react';
import CoordinatorProfile from '../components/CoordinatorProfile';

const CoordinatorDashboard = ({ coordinator }) => {
  // Add a state to control profile view
  const [showProfile, setShowProfile] = useState(false);

  return (
    <div>
      {/* Add a button/menu item to open profile */}
      <button onClick={() => setShowProfile(true)}>My Profile</button>

      {/* ...existing code... */}

      {showProfile && (
        <CoordinatorProfile
          coordinator={{
            name: coordinator.name,
            contactNumber: coordinator.contactNumber,
            email: coordinator.email,
            profilePic: coordinator.profilePic
          }}
        />
      )}

      {/* ...existing code... */}
    </div>
  );
};

export default CoordinatorDashboard;