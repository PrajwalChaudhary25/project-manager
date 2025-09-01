import React, { useState, useEffect } from 'react';
import axiosInstance from '../api/axios';
import { useNavigate } from 'react-router-dom';

const EmployeeDashboard = ({onLogout}) => {
    const [status, setStatus] = useState('unchecked-in');
    const [jiraKey, setJiraKey] = useState('');
    const [logs, setLogs] = useState([]);
    const [message, setMessage] = useState('');
    const navigate = useNavigate(); // Add this line

    useEffect(() => {
        fetchLogs();
    }, []);

    const fetchLogs = async () => {
        try {
            const response = await axiosInstance.get('time-logs/');
            setLogs(response.data);
            if (response.data.length > 0) {
                const lastLog = response.data[response.data.length - 1];
                if (lastLog.type === 'check_in' || lastLog.type === 'break_end') {
                    setStatus('checked-in');
                } else if (lastLog.type === 'break_start') {
                    setStatus('on-break');
                } else if (lastLog.type === 'check_out') {
                    setStatus('checked-out');
                }
            }
        } catch (error) {
            console.error('Error fetching time logs:', error);
            // Optional: Redirect to login if token is expired or invalid
            if (error.response && error.response.status === 401) {
                navigate('/login');
            }
        }
    };

    const handleAction = async (action) => {
        try {
            const response = await axiosInstance.post(`${action}/`);
            setMessage(response.data.detail);
            fetchLogs();
        } catch (error) {
            setMessage(error.response.data.detail || 'An error occurred.');
        }
    };

    const handleSubmitLogsheet = async (e) => {
        e.preventDefault();
        try {
            await axiosInstance.post('submit-logsheet/', { jira_key: jiraKey });
            setMessage('Logsheet submitted for approval!');
        } catch (error) {
            setMessage(error.response.data.detail || 'Failed to submit logsheet.');
        }
    };

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
            <h2>Employee Dashboard</h2>
            {message && <p>{message}</p>}

            <div className="button-group">
                <button onClick={() => handleAction('check-in')} disabled={status !== 'unchecked-in'}>Check In</button>
                <button onClick={() => handleAction('break-start')} disabled={status !== 'checked-in'}>Start Break</button>
                <button onClick={() => handleAction('break-end')} disabled={status !== 'on-break'}>End Break</button>
                <button onClick={() => handleAction('check-out')} disabled={status !== 'checked-in'}>Check Out</button>
            </div>

            <h3>Today's Log</h3>
            <ul>
                {logs.map((log) => (
                    <li key={log.id}>{log.type.replace('_', ' ').toUpperCase()} at {new Date(log.timestamp).toLocaleTimeString()}</li>
                ))}
            </ul>

            {status === 'checked-out' && (
                <form onSubmit={handleSubmitLogsheet}>
                    <h3>Submit Logsheet</h3>
                    <input
                        type="text"
                        placeholder="Enter JIRA Key"
                        value={jiraKey}
                        onChange={(e) => setJiraKey(e.target.value)}
                        required
                    />
                    <button type="submit">Submit Logsheet</button>
                </form>
            )}
        </div>
    );
};

export default EmployeeDashboard;