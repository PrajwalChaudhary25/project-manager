import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/LoginForm';
import EmployeeDashboard from './components/EmployeeDashboard';
import ManagerDashboard from './components/ManagerDashboard';
import { useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';

// --- Your existing components and axios setup are assumed to be here ---

const App = () => {
  const [userRole, setUserRole] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkUserRole = () => {
      const token = localStorage.getItem('access_token');
      if (!token) {
        setUserRole(null);
        setIsLoading(false);
        return;
      }
      try {
        const decodedToken = jwtDecode(token);
        setUserRole(decodedToken.is_manager ? 'manager' : 'employee');
      } catch (error) {
        console.error("Failed to decode token:", error);
        localStorage.clear();
        setUserRole(null);
      }
      setIsLoading(false);
    };
    
    checkUserRole();
  }, []);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route 
          path="/employee-dashboard" 
          element={userRole === 'employee' ? <EmployeeDashboard /> : <Navigate to="/login" />} 
        />
        <Route 
          path="/manager-dashboard" 
          element={userRole === 'manager' ? <ManagerDashboard /> : <Navigate to="/login" />} 
        />
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </Router>
  );
};

export default App;