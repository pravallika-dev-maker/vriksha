import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchProjects, fetchStages, fetchUsers } from '../services/api';
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
            <header className="dashboard-header" style={{
                display: 'grid',
                gridTemplateColumns: '1fr auto 1fr',
                gap: '20px',
                alignItems: 'center',
                padding: '1.5rem 0'
            }}>
                <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                    {user && (
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '6px 12px',
                            background: '#f8fafc',
                            borderRadius: '20px',
                            border: '1px solid #e2e8f0',
                            flexShrink: 0
                        }}>
                            <div style={{
                                width: '24px',
                                height: '24px',
                                borderRadius: '50%',
                                background: 'linear-gradient(135deg, #81c784 0%, #dcedc1 100%)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'white',
                                fontWeight: '700',
                                fontSize: '11px'
                            }}>
                                {user.full_name?.charAt(0).toUpperCase()}
                            </div>
                            <span style={{ fontSize: '13px', color: '#475569', fontWeight: '600', whiteSpace: 'nowrap' }}>{user.full_name}</span>
                        </div>
                    )}
                </div>

                <div style={{ textAlign: 'center' }}>
                    <h1 style={{ margin: 0, fontSize: '1.75rem', fontWeight: '800' }}>Vriksha Command Center</h1>
                    <p style={{ margin: 0, fontSize: '0.9rem', color: '#64748b', fontWeight: '500' }}>Internal Project & Deal Tracking System</p>
                </div>

                <div style={{ display: 'flex', gap: '12px', alignItems: 'center', justifyContent: 'flex-end' }}>
                    {/* CEO ONLY OPTION */}
                    {user?.can_add_users && (
                        <>
                            <button
                                onClick={() => navigate('/ceo-financials')}
                                style={{
                                    padding: '8px 16px',
                                    background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '8px',
                                    fontWeight: '600',
                                    fontSize: '13px',
                                    cursor: 'pointer',
                                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                                }}
                            >
                                CEO Financials
                            </button>
                            <button
                                onClick={() => navigate('/register')}
                                style={{
                                    padding: '8px 16px',
                                    background: '#f1f5f9',
                                    color: '#1e293b',
                                    border: '1px solid #e2e8f0',
                                    borderRadius: '8px',
                                    fontWeight: '600',
                                    fontSize: '13px',
                                    cursor: 'pointer'
                                }}
                            >
                                Authorize Users
                            </button>
                        </>
                    )}

                    {/* CEO or WRITE users can add projects */}
                    {(user?.can_add_users || user?.access_level === 'WRITE') && (
                        <button
                            className="add-project-btn"
                            onClick={() => navigate('/add-project')}
                            style={{
                                padding: '10px 20px',
                                background: 'linear-gradient(135deg, #10b981 0%, #65a30d 100%)',
                                color: 'white',
                                border: 'none',
                                borderRadius: '8px',
                                fontSize: '13px',
                                fontWeight: '600',
                                cursor: 'pointer',
                                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                            }}
                        >
                            + Add Project
                        </button>
                    )}

                    <button
                        onClick={handleLogout}
                        style={{
                            padding: '8px 12px',
                            background: 'none',
                            color: '#ef4444',
                            border: 'none',
                            fontWeight: '600',
                            fontSize: '13px',
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
                currentUser={user}
            />
        </div>
    );
};

export default Dashboard;
