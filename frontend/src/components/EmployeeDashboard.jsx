import React, { useState, useEffect } from 'react';
import axiosInstance from '../api/axios';
import { useNavigate } from 'react-router-dom';

const EmployeeDashboard = ({ onLogout }) => {
    const [status, setStatus] = useState('unchecked-in');
    const [jiraKey, setJiraKey] = useState('');
    const [logs, setLogs] = useState([]);
    const [message, setMessage] = useState('');
    const [isLogsheetSubmitted, setIsLogsheetSubmitted] = useState(false); // New state variable
    const navigate = useNavigate();

    const fetchLogsAndSetStatus = async () => {
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
            } else {
                setStatus('unchecked-in');
            }
            console.log('Logs fetched:', response.data);
        } catch (error) {
            console.error('Error fetching time logs:', error);
            if (error.response && error.response.status === 401) {
                navigate('/login');
            }
            setMessage(error.response.data.detail || 'Failed to fetch logs.');
        }
    };

    const checkLogsheetStatus = async () => {
        try {
            const response = await axiosInstance.get('logsheet-status/'); // Assume a new backend endpoint
            setIsLogsheetSubmitted(response.data.hasSubmitted);
        } catch (error) {
            console.error('Error fetching logsheet status:', error);
        }
    };
    
    // Check logsheet status on initial load and whenever logs change
    useEffect(() => {
        fetchLogsAndSetStatus();
        checkLogsheetStatus();
    }, []);

    const handleAction = async (action) => {
        try {
            let endpoint = '';
            let newStatus = '';
            
            if (action === 'check-in') {
                endpoint = 'check-in/';
                newStatus = 'checked-in';
            } else if (action === 'break-start') {
                endpoint = 'break-start/';
                newStatus = 'on-break';
            } else if (action === 'break-end') {
                endpoint = 'break-end/';
                newStatus = 'checked-in';
            } else if (action === 'check-out') {
                endpoint = 'check-out/';
                newStatus = 'checked-out';
            } else {
                setMessage('Invalid action.');
                return;
            }

            const response = await axiosInstance.post(endpoint);
            setMessage(response.data.detail);
            
            setStatus(newStatus);
            await fetchLogsAndSetStatus();
            await checkLogsheetStatus();

        } catch (error) {
            setMessage(error.response.data.detail || 'An error occurred.');
        }
    };

    const handleSubmitLogsheet = async (e) => {
        e.preventDefault();
        try {
            await axiosInstance.post('submit-logsheet/', { jira_key: jiraKey });
            setMessage('Logsheet submitted for approval!');
            setJiraKey('');
            setIsLogsheetSubmitted(true); // Update state on successful submission
            await fetchLogsAndSetStatus();
        } catch (error) {
            setMessage(error.response.data.detail || 'Failed to submit logsheet.');
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');
        if (onLogout) {
            onLogout();
        }
        navigate('/login');
    };

    const isWorkDayComplete = isLogsheetSubmitted; // Use the new state variable
    const isCheckedOut = status === 'checked-out';

    return (
        <div className="min-h-screen bg-gray-100 p-8">
            <div className="max-w-4xl mx-auto space-y-8">
                {/* Header and Logout Button */}
                <div className="flex items-center justify-between p-4 bg-white rounded-lg shadow-md">
                    <h2 className="text-2xl font-bold text-gray-800">Employee Dashboard</h2>
                    <button
                        onClick={handleLogout}
                        className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 transition duration-200"
                    >
                        Logout
                    </button>
                </div>

                {/* Message Display */}
                {message && (
                    <div className="p-3 text-center text-sm font-medium text-blue-800 bg-blue-100 rounded-md">
                        {message}
                    </div>
                )}

                {/* Conditional Rendering of main content */}
                {isWorkDayComplete ? (
                    // Final message card for a complete workday
                    <div className="p-10 bg-white rounded-lg shadow-lg text-center">
                        <h3 className="text-3xl font-extrabold text-gray-900 mb-4">
                            Workday Complete! 🎉
                        </h3>
                        <p className="text-lg text-gray-700">
                            Hope you had a wonderful working day. Enjoy the rest of your day!
                        </p>
                    </div>
                ) : (
                    // Original dashboard content
                    <>
                        {/* Action Buttons */}
                        <div className="p-6 bg-white rounded-lg shadow-md">
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                                <button
                                    onClick={() => handleAction('check-in')}
                                    disabled={status !== 'unchecked-in'}
                                    className={`px-4 py-3 font-semibold text-white rounded-lg shadow-md transition duration-200 ${
                                        status !== 'unchecked-in' ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-500 hover:bg-green-600'
                                    }`}
                                >
                                    Check In
                                </button>
                                <button
                                    onClick={() => handleAction('break-start')}
                                    disabled={status !== 'checked-in'}
                                    className={`px-4 py-3 font-semibold text-white rounded-lg shadow-md transition duration-200 ${
                                        status !== 'checked-in' ? 'bg-gray-400 cursor-not-allowed' : 'bg-yellow-500 hover:bg-yellow-600'
                                    }`}
                                >
                                    Start Break
                                </button>
                                <button
                                    onClick={() => handleAction('break-end')}
                                    disabled={status !== 'on-break'}
                                    className={`px-4 py-3 font-semibold text-white rounded-lg shadow-md transition duration-200 ${
                                        status !== 'on-break' ? 'bg-gray-400 cursor-not-allowed' : 'bg-indigo-500 hover:bg-indigo-600'
                                    }`}
                                >
                                    End Break
                                </button>
                                <button
                                    onClick={() => handleAction('check-out')}
                                    disabled={status !== 'checked-in'}
                                    className={`px-4 py-3 font-semibold text-white rounded-lg shadow-md transition duration-200 ${
                                        status !== 'checked-in' ? 'bg-gray-400 cursor-not-allowed' : 'bg-red-500 hover:bg-red-600'
                                    }`}
                                >
                                    Check Out
                                </button>
                            </div>
                        </div>

                        {/* Today's Log Card */}
                        <div className="p-6 bg-white rounded-lg shadow-md">
                            <h3 className="text-xl font-bold text-gray-800 mb-4">Today's Log</h3>
                            <ul className="space-y-2">
                                {logs.length > 0 ? (
                                    logs.map((log) => (
                                        <li key={log.id} className="p-3 bg-gray-50 rounded-md">
                                            <span className="font-semibold text-gray-700">
                                                {log.type.replace('_', ' ').toUpperCase()}
                                            </span> 
                                            <span className="text-gray-500 ml-2">
                                                at {new Date(log.timestamp).toLocaleTimeString()}
                                            </span>
                                        </li>
                                    ))
                                ) : (
                                    <li className="text-gray-500 italic">No logs found for today.</li>
                                )}
                            </ul>
                        </div>

                        {/* Submit Logsheet Form */}
                        {isCheckedOut && !isLogsheetSubmitted && (
                            <div className="p-6 bg-white rounded-lg shadow-md">
                                <h3 className="text-xl font-bold text-gray-800 mb-4">Submit Logsheet</h3>
                                <form className="space-y-4" onSubmit={handleSubmitLogsheet}>
                                    <input
                                        type="text"
                                        placeholder="Enter JIRA Key"
                                        value={jiraKey}
                                        onChange={(e) => setJiraKey(e.target.value)}
                                        required
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200"
                                    />
                                    <button
                                        type="submit"
                                        className="w-full px-4 py-3 font-bold text-white bg-blue-600 rounded-lg shadow-md hover:bg-blue-700 transition duration-200"
                                    >
                                        Submit Logsheet
                                    </button>
                                </form>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default EmployeeDashboard;