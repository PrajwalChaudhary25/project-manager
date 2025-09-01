import React from 'react';
import { useNavigate } from 'react-router-dom';

const ManagerDashboard = ({onLogout}) => {
  const navigate = useNavigate();
  const handleLogout = () => {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user');
      onLogout();
      navigate('/login');
  };
  return (
    <div>
      <button onClick={handleLogout} style={{ float: 'right' }}>Logout</button>
      <h2>Manager Dashboard</h2>
      <p>Welcome, Manager! This is where you'll see pending logsheets.</p>
    </div>
  );
};

export default ManagerDashboard;