import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../api/axios';
import { jwtDecode } from 'jwt-decode';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const handleSubmit = async (e) => {
      e.preventDefault();
      try {
          const response = await axiosInstance.post('http://127.0.0.1:8000/api/token/', {
              username,
              password,
          });
          console.log('Login response:', response.data);  // Debug log
          
          // Store tokens and user data
          localStorage.setItem('access_token', response.data.access);
          localStorage.setItem('refresh_token', response.data.refresh);
          
          // Store user info
          const userInfo = {
              username: response.data.username,
              is_manager: response.data.is_manager
          };
          localStorage.setItem('user', JSON.stringify(userInfo));
          
          // Decode token for verification
          const decodedToken = jwtDecode(response.data.access);
          console.log('Decoded token:', decodedToken);
          console.log('User info:', userInfo);
          
          // Check if user is manager using the response data
          if (response.data.is_manager === true) {
              console.log('Redirecting to manager dashboard');
              navigate('/manager-dashboard');
          } else {
              console.log('Redirecting to employee dashboard');
              navigate('/employee-dashboard');
          }

      } catch (err) {
          setError('Invalid credentials. Please try again.');
      }
  };
  

  return (
    <div>
      <h2>Login</h2>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button type="submit">Log In</button>
      </form>
    </div>
  );
};

export default Login;