import React, { useState, useEffect } from 'react';
import axiosInstance from '../api/axios';
import { useNavigate } from 'react-router-dom';

const ManagerDashboard = ({ onLogout }) => {
    const [logsheets, setLogsheets] = useState([]);
    const [message, setMessage] = useState('');
    const [selectedLogsheetLogs, setSelectedLogsheetLogs] = useState(null);
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);
    const [pendingAction, setPendingAction] = useState(null);
    const navigate = useNavigate();

    const fetchLogsheets = async () => {
        try {
            const response = await axiosInstance.get('manager/logsheets/');
            setLogsheets(response.data);
        } catch (error) {
            setMessage(error.response.data.detail || 'Failed to fetch logsheets.');
            if (error.response && error.response.status === 401) {
                navigate('/login');
            }
        }
    };

    useEffect(() => {
        fetchLogsheets();
    }, []);

    const handleAction = (id, action, credit = null) => {
        setPendingAction({ id, action, credit });
        setShowConfirmDialog(true);
    };

    const confirmAction = async () => {
        if (!pendingAction) return;

        const { id, action, credit } = pendingAction;
        try {
            const data = { action };
            if (credit !== null) {
                data.work_day_credit = credit;
            }
            await axiosInstance.post(`manager/logsheets/${id}/`, data);
            setMessage(`Logsheet ${id} has been ${action}d.`);
            fetchLogsheets();
            setSelectedLogsheetLogs(null);
        } catch (error) {
            setMessage(error.response.data.detail || 'An error occurred.');
        } finally {
            setShowConfirmDialog(false);
            setPendingAction(null);
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

    const handleViewLogs = async (userId, logDate) => {
        try {
            const response = await axiosInstance.get(`time-logs/${userId}/${logDate}/`);
            setSelectedLogsheetLogs(response.data);
            setMessage(`Showing logs for user ${userId} on ${logDate}`);
        } catch (error) {
            console.error('Error fetching detailed logs:', error);
            setMessage('Failed to fetch detailed logs.');
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 p-8">
            <div className="max-w-6xl mx-auto space-y-8">
                {/* Header and Logout Button */}
                <div className="flex items-center justify-between p-4 bg-white rounded-lg shadow-md">
                    <h2 className="text-2xl font-bold text-gray-800">Manager Dashboard - Pending Logsheets</h2>
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

                {/* Logsheets List */}
                {logsheets.length === 0 ? (
                    <div className="p-6 bg-white rounded-lg shadow-md text-center text-gray-500">
                        <p>No pending logsheets to review.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {logsheets.map((logsheet) => (
                            <div key={logsheet.id} className="p-6 bg-white rounded-lg shadow-md flex flex-col justify-between">
                                <div className="space-y-2 mb-4">
                                    <p>
                                        <span className="font-semibold text-gray-700">User:</span> {logsheet.user.username}
                                    </p>
                                    <p>
                                        <span className="font-semibold text-gray-700">Date:</span> {logsheet.date}
                                    </p>
                                    <p>
                                        <span className="font-semibold text-gray-700">JIRA Key:</span> {logsheet.jira_key}
                                    </p>
                                    <p>
                                        <span className="font-semibold text-gray-700">Hours Worked:</span> {logsheet.hours_worked.toFixed(2)}
                                    </p>
                                </div>
                                <div className="grid grid-cols-2 gap-2 mt-auto">
                                    <button
                                        onClick={() => handleAction(logsheet.id, 'approve', 1.0)}
                                        className="px-2 py-2 text-sm font-semibold text-white bg-green-500 rounded-lg hover:bg-green-600 transition duration-200"
                                    >
                                        Approve (Full)
                                    </button>
                                    <button
                                        onClick={() => handleAction(logsheet.id, 'approve', 0.5)}
                                        className="px-2 py-2 text-sm font-semibold text-white bg-green-400 rounded-lg hover:bg-green-500 transition duration-200"
                                    >
                                        Approve (Half)
                                    </button>
                                    <button
                                        onClick={() => handleAction(logsheet.id, 'reject')}
                                        className="px-2 py-2 text-sm font-semibold text-white bg-red-500 rounded-lg hover:bg-red-600 transition duration-200"
                                    >
                                        Reject
                                    </button>
                                    <button
                                        onClick={() => handleViewLogs(logsheet.user.id, logsheet.date)}
                                        className="px-2 py-2 text-sm font-semibold text-white bg-blue-500 rounded-lg hover:bg-blue-600 transition duration-200"
                                    >
                                        View Logs
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Detailed Timestamps Modal/Card */}
                {selectedLogsheetLogs && (
                    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-40">
                        <div className="bg-white rounded-lg shadow-xl p-8 max-w-lg w-full space-y-4">
                            <h3 className="text-xl font-bold text-gray-800 border-b pb-2 mb-2">Detailed Timestamps</h3>
                            <p className="font-semibold text-lg text-gray-700">
                                Total Hours Worked: <span className="font-bold text-blue-600">{selectedLogsheetLogs.total_hours}</span>
                            </p>
                            <ul className="space-y-2 max-h-64 overflow-y-auto">
                                {selectedLogsheetLogs.logs.length === 0 ? (
                                    <li className="text-gray-500 italic">No detailed logs found for this day.</li>
                                ) : (
                                    selectedLogsheetLogs.logs.map(log => (
                                        <li key={log.id} className="p-2 bg-gray-50 rounded-md text-gray-600 text-sm">
                                            <span className="font-semibold">{log.type.replace('_', ' ').toUpperCase()}</span> at {new Date(log.timestamp).toLocaleTimeString()}
                                        </li>
                                    ))
                                )}
                            </ul>
                            <button
                                onClick={() => setSelectedLogsheetLogs(null)}
                                className="w-full px-4 py-2 font-bold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition duration-200"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                )}

                {/* Confirmation Dialog */}
                {showConfirmDialog && (
                    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
                        <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-sm text-center space-y-4">
                            <h4 className="text-lg font-bold text-gray-800">Are you sure?</h4>
                            <p className="text-sm text-gray-600">This action cannot be undone.</p>
                            <div className="flex justify-center space-x-4">
                                <button
                                    onClick={confirmAction}
                                    className="px-4 py-2 text-white bg-green-500 rounded-lg hover:bg-green-600 transition duration-200"
                                >
                                    Yes
                                </button>
                                <button
                                    onClick={() => setShowConfirmDialog(false)}
                                    className="px-4 py-2 text-gray-800 bg-gray-200 rounded-lg hover:bg-gray-300 transition duration-200"
                                >
                                    No
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ManagerDashboard;