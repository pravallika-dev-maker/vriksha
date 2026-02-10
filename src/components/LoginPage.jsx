import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { checkEmailExists, loginUser } from '../services/api';
import { supabase } from '../services/supabaseConfig';

const LoginPage = () => {
    const navigate = useNavigate();
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [otp, setOtp] = useState('');
    const [isCEO, setIsCEO] = useState(false);
    const [step, setStep] = useState(1); // 1: Email Input, 2: Auth Action (Password or OTP)

    // Check session
    useEffect(() => {
        const localUser = localStorage.getItem('user');
        if (localUser) navigate('/dashboard');
    }, [navigate]);

    const handleNextStep = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setLoading(true);

        try {
            const check = await checkEmailExists(email);
            if (!check.user) throw new Error('Account not found.');

            setIsCEO(!!check.user.can_add_users);

            if (!check.user.can_add_users) {
                // If not CEO, trigger OTP immediately
                // We allow creating the user in Supabase Auth if they are authorized in our DB
                const { error: otpError } = await supabase.auth.signInWithOtp({
                    email: email,
                    options: {
                        shouldCreateUser: true,
                    }
                });

                if (otpError) throw otpError;
                setSuccess('A verification code has been sent to your email.');
            }

            setStep(2);
        } catch (err) {
            setError(err.message || 'Access not granted. Please contact admin.');
        } finally {
            setLoading(false);
        }
    };

    const handleResendOTP = async () => {
        setError('');
        setSuccess('');
        setLoading(true);
        try {
            const { error: otpError } = await supabase.auth.signInWithOtp({
                email: email,
                options: { shouldCreateUser: true }
            });
            if (otpError) throw otpError;
            setSuccess('A new code has been sent to your email.');
        } catch (err) {
            setError(err.message || 'Failed to resend code.');
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
                // Member Login with OTP
                const { data, error: verifyError } = await supabase.auth.verifyOtp({
                    email,
                    token: otp,
                    type: 'email'
                });

                if (verifyError) throw verifyError;

                // After Supabase verifies the session, we also sync with our backend user object
                const check = await checkEmailExists(email);
                localStorage.setItem('user', JSON.stringify(check.user));
                navigate('/dashboard');
            }
        } catch (err) {
            setError(err.message || 'Authentication failed.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="register-wrapper">
            <div className="register-card">
                <div className="register-header">
                    <h1>Vriksha Portal</h1>
                    <p style={{ color: '#64748b', fontSize: '0.95rem', marginTop: '8px' }}>
                        {step === 1 ? 'Enter your authorized email to begin' : (isCEO ? 'CEO Authentication' : 'Enter 6-Digit Code')}
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
                                onChange={(e) => setEmail(e.target.value.toLowerCase())}
                                placeholder="name@company.com"
                                required
                                style={{ borderRadius: '10px', padding: '12px' }}
                            />
                        </div>
                        <button type="submit" className="btn-register" disabled={loading} style={{ background: 'var(--vriksha-green)', color: 'white', borderRadius: '10px', height: '48px', fontWeight: '600' }}>
                            {loading ? 'Verifying...' : 'Continue'}
                        </button>
                    </form>
                ) : (
                    <form onSubmit={handleLogin}>
                        {error && <div className="error-message" style={{ color: '#f43f5e', marginBottom: '1rem', textAlign: 'center', fontWeight: '600' }}>{error}</div>}
                        {success && <div className="success-message" style={{ color: '#10b981', marginBottom: '1.5rem', textAlign: 'center', fontWeight: '600', padding: '12px', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '10px' }}>{success}</div>}

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
                                    style={{ borderRadius: '10px', padding: '12px' }}
                                />
                            </div>
                        ) : (
                            <div className="form-group">
                                <label>Verification Code</label>
                                <input
                                    type="text"
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 8))}
                                    placeholder="00000000"
                                    required
                                    autoFocus
                                    style={{ borderRadius: '10px', padding: '12px', textAlign: 'center', fontSize: '1.5rem', letterSpacing: '4px', maxWidth: '100%' }}
                                />
                                <p style={{ fontSize: '0.85rem', color: '#64748b', textAlign: 'center', marginTop: '12px' }}>
                                    Didn't get the code? <span onClick={handleResendOTP} style={{ color: 'var(--vriksha-blue)', cursor: 'pointer', fontWeight: '600' }}>Resend</span>
                                </p>
                            </div>
                        )}

                        <button type="submit" className="btn-register" disabled={loading} style={{ background: 'var(--vriksha-green)', color: 'white', borderRadius: '10px', height: '48px', fontWeight: '600' }}>
                            {loading ? 'Processing...' : (isCEO ? 'Login' : 'Verify & Login')}
                        </button>

                        <button
                            type="button"
                            onClick={() => { setStep(1); setOtp(''); setPassword(''); }}
                            style={{ width: '100%', marginTop: '16px', background: 'none', border: 'none', color: '#64748b', fontSize: '0.9rem', cursor: 'pointer' }}
                        >
                            ← Use a different email
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
};

export default LoginPage;
