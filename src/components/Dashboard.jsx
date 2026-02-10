import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchProjects, fetchStages } from '../services/api';
import KanbanBoard from './KanbanBoard';

const Dashboard = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [data, setData] = useState({
        projects: [],
        stages: [],
        loading: true,
        error: null
    });

    useEffect(() => {
        const handleMagicLinkReturn = async () => {
            const hash = window.location.hash;
            if (hash && hash.includes('access_token=')) {
                const params = new URLSearchParams(hash.replace('#', '?'));
                const accessToken = params.get('access_token');
                if (accessToken) {
                    localStorage.setItem('supabase.auth.token', accessToken);
                    // Use the pending user info we saved during login attempt
                    const pendingUser = localStorage.getItem('pendingUser');
                    if (pendingUser) {
                        localStorage.setItem('user', pendingUser);
                        localStorage.removeItem('pendingUser');
                        window.history.replaceState(null, null, window.location.pathname); // Clear hash
                        return JSON.parse(pendingUser);
                    }
                }
            }
            return JSON.parse(localStorage.getItem('user') || 'null');
        };

        const init = async () => {
            const currentUser = await handleMagicLinkReturn();

            if (!currentUser) {
                navigate('/login');
                return;
            }
            setUser(currentUser);

            const loadData = async () => {
                try {
                    const [projects, stages] = await Promise.all([
                        fetchProjects(currentUser.email),
                        fetchStages()
                    ]);

                    setData({
                        projects,
                        stages,
                        loading: false,
                        error: null
                    });
                } catch (err) {
                    console.error('Data fetching error:', err);
                    setData(prev => ({ ...prev, loading: false, error: 'Failed to load dashboard data.' }));
                }
            };

            loadData();
        };

        init();
    }, [navigate]);

    const handleLogout = () => {
        localStorage.removeItem('user');
        localStorage.removeItem('supabase.auth.token');
        navigate('/login');
    };

    if (data.loading) {
        return (
            <div className="loading-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', flexDirection: 'column', gap: '1rem' }}>
                <div className="spinner" style={{ width: '40px', height: '40px', border: '4px solid #f3f3f3', borderTop: '4px solid #6366f1', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                <p style={{ color: '#64748b', fontWeight: 500 }}>Initializing Dashboard...</p>
                <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
            </div>
        );
    }

    return (
        <div className="dashboard-container">
            <header className="dashboard-header">
                <div style={{ flex: 1 }}>
                    <h1>Vriksha Command Center</h1>
                    <p>Internal Project & Deal Tracking System</p>
                </div>

                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    {/* CEO ONLY OPTION */}
                    {user?.can_add_users && (
                        <button
                            onClick={() => navigate('/register')}
                            style={{
                                padding: '10px 20px',
                                background: '#f1f5f9',
                                color: '#1e293b',
                                border: '1px solid #e2e8f0',
                                borderRadius: '8px',
                                fontWeight: '600',
                                cursor: 'pointer'
                            }}
                        >
                            Authorize Users
                        </button>
                    )}

                    <button
                        className="add-project-btn"
                        onClick={() => navigate('/add-project')}
                        style={{
                            padding: '12px 24px',
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            fontSize: '14px',
                            fontWeight: '600',
                            cursor: 'pointer'
                        }}
                    >
                        + Add Project
                    </button>

                    <button
                        onClick={handleLogout}
                        style={{
                            padding: '10px 15px',
                            background: 'none',
                            color: '#ef4444',
                            border: 'none',
                            fontWeight: '600',
                            cursor: 'pointer'
                        }}
                    >
                        Logout
                    </button>
                </div>
            </header>

            <KanbanBoard
                projects={data.projects}
                stages={data.stages}
            />
        </div>
    );
};

export default Dashboard;
