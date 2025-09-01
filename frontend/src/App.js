import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/LoginForm';
import EmployeeDashboard from './components/EmployeeDashboard';
import ManagerDashboard from './components/ManagerDashboard';
import { useState, useEffect } from 'react';


// --- Your existing components and axios setup are assumed to be here ---

const App = () => {
  const [userRole, setUserRole] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
   checkUserRole();
  }, [isLoggedIn]);


  const checkUserRole = () => {
  const profile = JSON.parse(localStorage.getItem('user'));
  if (!profile) {
    setUserRole(null);
    setIsLoading(false);
    return;
  }
  else{
    const role = profile.is_manager ? 'manager' : 'employee';
    setUserRole(role)
    console.log(role);
  }
  setIsLoading(false);
  };
  const handleLoginSuccess = () => {
  setIsLoggedIn(true); // Trigger a re-render after a successful login
  };

  const handleLogoutSuccess = () => {
    setIsLoggedIn(false); // Trigger a re-render after logout
  };
  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login onLoginSuccess={handleLoginSuccess}/>} />
        <Route 
          path="/employee-dashboard"
          element={userRole === 'employee' ? <EmployeeDashboard onLogout={handleLogoutSuccess}/> : <Navigate to="/login" />} 
        />
        <Route 
          path="/manager-dashboard" 
          element={userRole === 'manager' ? <ManagerDashboard onLogout={handleLogoutSuccess}/> : <Navigate to="/login" />} 
        />
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </Router>
  );
};

export default App;