import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../api/axios';
import { jwtDecode } from 'jwt-decode';

const Login = ({ onLoginSuccess }) => {
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
      console.log('Login response:', response.data);

      localStorage.setItem('access_token', response.data.access);
      localStorage.setItem('refresh_token', response.data.refresh);

      const decodedToken = jwtDecode(response.data.access);
      console.log('Decoded token:', decodedToken);

      const profile = await axiosInstance.get('user/profile/');
      console.log('Profile data:', profile.data);
      const userInfo = {
        username: profile.data.username,
        is_manager: profile.data.is_manager,
      };
      localStorage.setItem('user', JSON.stringify(userInfo));
      onLoginSuccess();

      if (profile.data.is_manager === true) {
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
    <div className="flex items-center justify-center min-h-screen bg-gray-100 p-4">
      <div className="w-full max-w-sm p-8 space-y-6 bg-white rounded-xl shadow-lg">
        <h2 className="text-3xl font-extrabold text-center text-gray-900">Log In</h2>
        {error && <p className="text-sm font-medium text-center text-red-600">{error}</p>}
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200"
            />
          </div>
          <div>
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200"
            />
          </div>
          <button
            type="submit"
            className="w-full py-2 text-white bg-blue-600 rounded-lg font-bold hover:bg-blue-700 transition duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Log In
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;