import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { checkEmailExists, loginUser } from '../services/api';

const LoginPage = () => {
    const navigate = useNavigate();
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isCEO, setIsCEO] = useState(false);
    const [step, setStep] = useState(1); // 1: Email Input, 2: Auth Action

    // Check session
    useEffect(() => {
        const localUser = localStorage.getItem('user');
        if (localUser) navigate('/dashboard');
    }, [navigate]);

    const handleNextStep = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const check = await checkEmailExists(email);
            // In your database, CEO email should have can_add_users = true
            if (check.user.can_add_users) {
                setIsCEO(true);
            } else {
                setIsCEO(false);
            }
            setStep(2);
        } catch (err) {
            setError(err.message || 'Access not granted.');
        } finally {
            setLoading(false);
        }
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setLoading(true);

        try {
            if (isCEO) {
                // CEO Login with Password
                const response = await loginUser({ email, password });
                localStorage.setItem('user', JSON.stringify(response.user));
                navigate('/dashboard');
            } else {
                // Member Login with Magic Link
                const { SUPABASE_URL, SUPABASE_ANON_KEY } = await import('../services/supabaseConfig');
                const check = await checkEmailExists(email);

                const supabaseResponse = await fetch(`${SUPABASE_URL}/auth/v1/magiclink`, {
                    method: 'POST',
                    headers: {
                        'apikey': SUPABASE_ANON_KEY,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        email: email,
                        options: { redirectTo: `${window.location.origin}/dashboard` }
                    })
                });

                if (!supabaseResponse.ok) throw new Error('Failed to send Magic Link');

                setSuccess("We've sent a secure login link to your email.");
                localStorage.setItem('pendingUser', JSON.stringify(check.user));
            }
        } catch (err) {
            setError(err.message || 'Login failed.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="register-wrapper">
            <div className="register-card">
                <div className="register-header">
                    <h1>Vriksha Portal</h1>
                    <p style={{ color: '#64748b' }}>
                        {step === 1 ? 'Enter email to begin' : (isCEO ? 'CEO Authentication' : 'Member Authentication')}
                    </p>
                </div>

                {step === 1 ? (
                    <form onSubmit={handleNextStep}>
                        {error && <div className="error-message" style={{ color: '#f43f5e', marginBottom: '1rem', textAlign: 'center', fontWeight: '600' }}>{error}</div>}
                        <div className="form-group">
                            <label>Email Address</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="ceo@example.com"
                                required
                            />
                        </div>
                        <button type="submit" className="btn-register" disabled={loading} style={{ background: 'var(--primary)', color: 'white' }}>
                            {loading ? 'Verifying...' : 'Next'}
                        </button>
                    </form>
                ) : (
                    <form onSubmit={handleLogin}>
                        {error && <div className="error-message" style={{ color: '#f43f5e', marginBottom: '1rem', textAlign: 'center', fontWeight: '600' }}>{error}</div>}
                        {success && <div className="success-message" style={{ color: '#10b981', marginBottom: '1.5rem', textAlign: 'center', fontWeight: '600', padding: '10px', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '8px' }}>{success}</div>}

                        {isCEO ? (
                            <div className="form-group">
                                <label>Password</label>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    required
                                    autoFocus
                                />
                            </div>
                        ) : (
                            <div style={{ textAlign: 'center', color: '#64748b', marginBottom: '1.5rem', padding: '15px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                                <p style={{ fontSize: '0.9rem', lineHeight: '1.5' }}>
                                    Your account is verified. Click below to receive a secure login link in your inbox.
                                </p>
                            </div>
                        )}

                        <button type="submit" className="btn-register" disabled={loading} style={{ background: 'var(--primary)', color: 'white' }}>
                            {loading ? 'Processing...' : (isCEO ? 'Login with Password' : 'Send Magic Link')}
                        </button>

                        <button
                            type="button"
                            onClick={() => setStep(1)}
                            style={{ width: '100%', marginTop: '12px', padding: '10px', background: 'none', border: '1px dashed #cbd5e1', borderRadius: '12px', cursor: 'pointer', color: '#64748b', fontSize: '0.9rem' }}
                        >
                            ← Use different email
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
};

export default LoginPage;
