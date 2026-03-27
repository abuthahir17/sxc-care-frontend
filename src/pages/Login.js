import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header'; // ✅ Header Import
import API_URL from '../config';

const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    // ✅ CHECK LOGIN STATUS
    useEffect(() => {
        const storedUser = sessionStorage.getItem('user');
        if (storedUser) {
            const user = JSON.parse(storedUser);
            const role = user.role.toLowerCase();
            if (role === 'admin') navigate('/admin', { replace: true });
            else if (role === 'staff') navigate('/staff', { replace: true });
            else if (role === 'executor') navigate('/executor', { replace: true });
        }
    }, [navigate]);

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        if (!username || !password) {
            setError("Please enter both username and password");
            setLoading(false);
            return;
        }

        try {
            const response = await fetch(`${API_URL}/api/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });

            const data = await response.json();

            if (response.ok) {
                sessionStorage.setItem('user', JSON.stringify(data));
                const role = data.role.toLowerCase();
                
                if (role === 'admin') navigate('/admin', { replace: true });
                else if (role === 'staff') navigate('/staff', { replace: true });
                else if (role === 'executor') navigate('/executor', { replace: true });
                else setError("Unknown Role assigned to this user.");

            } else {
                setError(data.message || "Invalid credentials");
            }
        } catch (err) {
            console.error("Login Error:", err);
            setError("Server Error. Is Backend running?");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={styles.pageContainer}>
            {/* ✅ HEADER FIXED AT TOP */}
            <Header user="" role="" />

            <style>
                {`
                    body { margin: 0; padding: 0; font-family: 'Segoe UI', sans-serif; background: #f8f9fa; }
                    .login-btn:hover {
                        transform: translateY(-2px);
                        box-shadow: 0 6px 20px rgba(27, 94, 32, 0.4);
                    }
                    input:focus {
                        border-color: #1b5e20 !important;
                        background: white !important;
                        box-shadow: 0 0 0 4px rgba(27, 94, 32, 0.1);
                    }
                `}
            </style>

            {/* ✅ CENTERED CONTENT WRAPPER */}
            <div style={styles.contentWrapper}>
                <div style={styles.loginCard}>
                    
                    {/* LOGO AREA */}
                    <div style={styles.logoSection}>
                        <div style={styles.logoIcon}>🔐</div>
                        <h2 style={styles.title}>SXC Care</h2>
                        <p style={styles.subtitle}>Secretary Office & Maintenance System</p>
                    </div>

                    {/* FORM AREA */}
                    <form onSubmit={handleLogin} style={styles.form}>
                        <div style={styles.formGroup}>
                            <label style={styles.label}>Username</label>
                            <input 
                                type="text" 
                                placeholder="Enter your username" 
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                style={styles.input}
                                required 
                            />
                        </div>

                        <div style={styles.formGroup}>
                            <label style={styles.label}>Password</label>
                            <input 
                                type="password" 
                                placeholder="Enter your password" 
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                style={styles.input}
                                required 
                            />
                        </div>

                        {error && (
                            <div style={styles.errorMessage}>
                                ⚠️ {error}
                            </div>
                        )}

                        <button 
                            type="submit" 
                            style={{...styles.loginBtn, opacity: loading ? 0.7 : 1}} 
                            className="login-btn"
                            disabled={loading}
                        >
                            {loading ? 'Verifying...' : 'Login Securely'}
                        </button>
                    </form>

                    {/* FOOTER AREA */}
                    <div style={styles.divider}>
                        <span style={styles.dividerText}>Authorized Access Only</span>
                    </div>

                    <div style={styles.roleTags}>
                        <span style={styles.roleTag}>Admin</span>
                        <span style={styles.roleTag}>Staff</span>
                        <span style={styles.roleTag}>Executor</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- STYLES (Separated Layout) ---
const styles = {
    pageContainer: {
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        background: "#f8f9fa", // Light Grey Background
    },
    contentWrapper: {
        flex: 1,
        display: "flex",
        alignItems: "flex-start", // ✅ Vertically Center
        justifyContent: "center", // ✅ Horizontally Center
        // ✅ IMPORTANT: Padding added to push it away from Header
        paddingTop: "150px", 
        paddingBottom: "30px",
        paddingLeft: "20px",
        paddingRight: "20px",
        boxSizing: "border-box"
    },
    loginCard: {
        background: "white",
        padding: "20px 50px",
        borderRadius: "20px",
        // ✅ Shadow makes it float
        boxShadow: "0 15px 35px rgba(0, 0, 0, 0.1)", 
        width: "100%",
        maxWidth: "450px",
        textAlign: "center",
        border: "1px solid #e2e8f0",
        // ✅ Green Accent on Top Only
        borderTop: "6px solid #1b5e20" 
    },
    logoSection: { marginBottom: "25px" },
    logoIcon: {
        width: "60px", height: "60px",
        background: "#f0fdf4", 
        color: "#1b5e20",
        borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: "30px", margin: "0 auto 20px", border: "2px solid #1b5e20",
    },
    title: { color: "#1b5e20", fontSize: "26px", fontWeight: "800", marginBottom: "5px", textTransform: "uppercase" },
    subtitle: { color: "#718096", fontSize: "14px", fontWeight: "500" },
    form: { textAlign: "left" },
    formGroup: { marginBottom: "20px" },
    label: { display: "block", fontSize: "13px", color: "#4a5568", fontWeight: "700", marginBottom: "8px", marginLeft: "4px", textTransform: "uppercase" },
    input: {
        width: "100%", padding: "14px 18px", borderRadius: "10px",
        border: "2px solid #e2e8f0", background: "#f8fafc", fontSize: "15px",
        outline: "none", transition: "all 0.3s ease", color: "#2d3748", boxSizing: "border-box",
    },
    errorMessage: {
        background: "#fef2f2", color: "#991b1b", padding: "12px", borderRadius: "8px",
        fontSize: "13px", fontWeight: "600", textAlign: "center", marginBottom: "20px", border: "1px solid #fca5a5",
    },
    loginBtn: {
        width: "100%", padding: "16px", border: "none", borderRadius: "12px",
        background: "linear-gradient(135deg, #1b5e20 0%, #2e7d32 100%)", 
        color: "white", fontSize: "16px", fontWeight: "700", cursor: "pointer",
        transition: "all 0.3s ease", boxShadow: "0 4px 15px rgba(27, 94, 32, 0.3)",
        textTransform: "uppercase", letterSpacing: "1px"
    },
    divider: { position: "relative", textAlign: "center", margin: "30px 0 20px" },
    dividerText: { background: "white", padding: "0 15px", color: "#a0aec0", fontSize: "12px", fontWeight: "600", position: "relative", zIndex: "1", textTransform: "uppercase" },
    roleTags: { display: "flex", justifyContent: "center", gap: "10px", flexWrap: "wrap" },
    roleTag: { 
        padding: "6px 14px", background: "#f0fdf4", border: "1px solid #bbf7d0", 
        borderRadius: "20px", fontSize: "11px", color: "#166534", fontWeight: "700", cursor: "default", textTransform: "uppercase" 
    }
};

export default Login;