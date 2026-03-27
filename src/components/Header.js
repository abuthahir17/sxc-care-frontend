import React from 'react';
import { useNavigate } from 'react-router-dom';
import logoImg from './Logo.png'; 

const Header = ({ user, role }) => {
    const navigate = useNavigate();

    const handleLogout = () => {
        if(window.confirm('Are you sure you want to logout?')) {
            sessionStorage.removeItem('user'); 
            navigate('/', { replace: true });
        }
    };

    return (
        <div style={styles.headerWrapper}>
            <div style={styles.headerContainer}>
                
                {/* LEFT SECTION: LOGO + TEXT */}
                <div style={styles.leftSection}>
                    <img 
                        src={logoImg} 
                        alt="College Logo" 
                        style={styles.logoImage} 
                    />
                    
                    <div style={styles.collegeInfo}>
                        <h1 style={styles.collegeName}>St. Xavier's COLLEGE</h1>
                        <span style={styles.autonomousText}>(Autonomous)</span>
                        <p style={styles.subText}>
                            Palayamkottai, Tamil Nadu, India.
                        </p>
                    </div>
                </div>

                {/* RIGHT SECTION */}
                <div style={styles.rightSection}>
                    {user && (
                        <div style={styles.userPanel}>
                            <div style={styles.userDetails}>
                                <span style={styles.userName}>{user}</span>
                                <span style={styles.userRole}>({role})</span>
                            </div>
                            <button style={styles.logoutBtn} onClick={handleLogout}>
                                Logout ➜
                            </button>
                        </div>
                    )}
                </div>
            </div>

            <div style={styles.bottomBorder}></div>
        </div>
    );
};

// --- STYLES ---
const styles = {
    headerWrapper: {
        width: '100%',
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
        boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
    },
    headerContainer: {
        background: 'linear-gradient(to right, #1b5e20, #2e7d32)', 
        padding: '10px 30px', 
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        color: 'white',
        minHeight: '110px', 
        boxSizing: 'border-box',
        width: '100%',
        margin: 0
    },
    leftSection: {
        display: 'flex',
        alignItems: 'center',
        gap: '20px', 
        flex: 1
    },
    logoImage: {
        height: '90px', 
        width: '90px',
        objectFit: 'cover',
        borderRadius: '50%',
        // ✅ CHANGE: Gap removed!
        border: '3px solid #ffdc16', 
        padding: '0', // 👈 Indha padding-a 0 aakitten (Gap poyidum)
        
        filter: 'drop-shadow(0px 4px 6px rgba(0,0,0,0.3))'
    
        
        // ✅ CHANGE IS HERE:
        },
    collegeInfo: {
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'flex-start', 
        textAlign: 'left' 
    },
    collegeName: {
        margin: '0 0 3px 0', 
        fontSize: '28px', 
        fontWeight: '900',
        color: '#ffd700', 
        textTransform: 'uppercase',
        letterSpacing: '1px',
        fontFamily: "'Times New Roman', serif", 
        textShadow: '2px 2px 4px rgba(0,0,0,0.5)',
        lineHeight: '1.1',
        textAlign: 'left'
    },
    autonomousText: { 
        fontSize: '20px', 
        fontWeight: 'bold',
        color: '#ffffff',
        marginBottom: '3px',
        fontFamily: "'Times New Roman', serif",
        textShadow: '1px 1px 2px rgba(0,0,0,0.3)',
        textAlign: 'left'
    },
    subText: {
        margin: 0,
        fontSize: '14px',
        fontWeight: '500',
        color: '#e2e8f0', 
        fontFamily: "sans-serif",
        opacity: 0.9,
        textAlign: 'left'
    },
    rightSection: {
        display: 'flex',
        alignItems: 'center'
    },
    userPanel: {
        display: 'flex',
        alignItems: 'center',
        gap: '20px',
        background: 'rgba(255, 255, 255, 0.1)', 
        padding: '8px 20px',
        borderRadius: '50px',
        border: '1px solid rgba(255, 215, 0, 0.3)'
    },
    userDetails: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-end',
        lineHeight: '1.2'
    },
    welcomeLabel: {
        fontSize: '11px',
        color: '#a5d6a7', 
        textTransform: 'uppercase',
        letterSpacing: '1px'
    },
    userName: {
        fontWeight: 'bold',
        fontSize: '16px',
        color: '#ffd700' 
    },
    userRole: {
        fontSize: '11px',
        color: 'white',
        textTransform: 'uppercase',
        opacity: 0.8
    },
    logoutBtn: {
        padding: '8px 16px',
        fontSize: '13px',
        background: '#ffd700', 
        color: '#1b5e20', 
        border: 'none',
        borderRadius: '30px',
        cursor: 'pointer',
        fontWeight: 'bold',
        boxShadow: '0 4px 10px rgba(0,0,0,0.2)',
        transition: 'transform 0.2s'
    },
    bottomBorder: {
        height: '6px',
        background: 'linear-gradient(to right, #ffd700, #f59e0b)', 
        width: '100%'
    }
};

export default Header;