import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { registerUser } from '../services/api';

const RegisterPage = () => {
    const navigate = useNavigate();
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);
    const [user, setUser] = useState(null);
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        accessLevel: 'READ' // Default to READ
    });

    useEffect(() => {
        const localUser = JSON.parse(localStorage.getItem('user') || 'null');
        if (!localUser || !localUser.can_add_users) {
            // If not logged in or not CEO, redirect to login
            navigate('/login');
        } else {
            setUser(localUser);
        }
    }, [navigate]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (loading) return;
        setError('');
        setSuccess('');
        setLoading(true);

        try {
            await registerUser({
                email: formData.email,
                full_name: formData.fullName,
                can_add_users: false, // New users by default cannot add others
                access_level: formData.accessLevel
            });

            setSuccess(`Success! ${formData.fullName} has been authorized with ${formData.accessLevel} access. A welcome email is being sent to ${formData.email} now.`);
            setFormData({ fullName: '', email: '', accessLevel: 'READ' });
        } catch (err) {
            setError(err.message || 'Failed to authorize user. Please check if email is unique.');
        } finally {
            setLoading(false);
        }
    };

    if (!user) return null;

    return (
        <div className="register-wrapper">
            <div className="register-card">
                <div className="register-header">
                    <h1>Authorize New User</h1>
                    <p>Add a new team member to the Vriksha Dashboard</p>
                </div>

                <form onSubmit={handleSubmit}>
                    {error && <div className="error-message" style={{ color: '#f43f5e', marginBottom: '1rem', textAlign: 'center', fontWeight: '600' }}>{error}</div>}
                    {success && <div className="success-message" style={{ color: '#10b981', marginBottom: '1.5rem', textAlign: 'center', fontWeight: '600', padding: '10px', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '8px' }}>{success}</div>}

                    <div className="form-group">
                        <label htmlFor="fullName">Full Name</label>
                        <input
                            type="text"
                            id="fullName"
                            name="fullName"
                            placeholder="e.g. John Doe"
                            value={formData.fullName}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="email">Email Address</label>
                        <input
                            type="email"
                            id="email"
                            name="email"
                            placeholder="user@vriksha.ai"
                            value={formData.email}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="accessLevel">Access Level</label>
                        <select
                            id="accessLevel"
                            name="accessLevel"
                            value={formData.accessLevel}
                            onChange={handleChange}
                            className="access-level-select"
                            style={{
                                width: '100%',
                                padding: '14px',
                                borderRadius: '12px',
                                border: '1px solid #e2e8f0',
                                backgroundColor: '#f8fafc',
                                fontSize: '15px',
                                outline: 'none',
                                transition: 'all 0.2s',
                                appearance: 'none',
                                background: 'url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'16\' height=\'16\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'%2364748b\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3E%3Cpath d=\'m6 9 6 6 6-6\'/%3E%3C/svg%3E") no-repeat right 12px center #f8fafc',
                                backgroundSize: '16px'
                            }}
                        >
                            <option value="READ">READ (View Only)</option>
                            <option value="WRITE">WRITE (View & Manage)</option>
                        </select>
                        <p style={{ fontSize: '12px', color: '#64748b', marginTop: '6px' }}>
                            READ allows viewing projects. WRITE allows creating and updating projects.
                        </p>
                    </div>

                    <button type="submit" className="btn-register" disabled={loading}>
                        {loading ? 'Authorizing...' : 'Authorize User'}
                    </button>

                    <button
                        type="button"
                        className="btn-back-dashboard"
                        onClick={() => navigate('/dashboard')}
                    >
                        Back to Dashboard
                    </button>
                </form>
            </div>
        </div>
    );
};

export default RegisterPage;
