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
                can_add_users: false // New users by default cannot add others
            });

            setSuccess(`User ${formData.fullName} has been authorized. Note: No automatic email is sent until they attempt to log in. Please share the dashboard URL with them to begin.`);
            setFormData({ fullName: '', email: '' });
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

                    <button type="submit" className="btn-register" disabled={loading} style={{ background: 'var(--primary)', color: 'white' }}>
                        {loading ? 'Authorizing...' : 'Authorize User'}
                    </button>

                    <button
                        type="button"
                        onClick={() => navigate('/dashboard')}
                        style={{ width: '100%', marginTop: '10px', padding: '10px', background: 'none', border: '1px solid #e2e8f0', borderRadius: '12px', cursor: 'pointer', fontWeight: '600', color: '#64748b' }}
                    >
                        Back to Dashboard
                    </button>
                </form>
            </div>
        </div>
    );
};

export default RegisterPage;
