import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import API_URL from '../config';

const AdminDashboard = () => {
    const navigate = useNavigate();
    
    // ✅ FIX: Helper function to handle case sensitivity (Already added by you, utilizing it now)
    const normalize = (str) => str ? str.toLowerCase().trim() : '';

    // --- UI STATES ---
    const [isSidebarOpen, setSidebarOpen] = useState(false); 
    const [currentView, setCurrentView] = useState('dashboard'); 
    const [showSuccessPopup, setShowSuccessPopup] = useState(false); 

    // --- DATA STATES ---
    const [requests, setRequests] = useState([]);
    const [hallBookings, setHallBookings] = useState([]); 
    const [executors, setExecutors] = useState([]);
    const [users, setUsers] = useState([]);

    // ✅ FILTER STATE
    const [filter, setFilter] = useState('All');

    // --- MODAL STATES ---
    const [showWorkModal, setShowWorkModal] = useState(false);
    const [workModalData, setWorkModalData] = useState({ title: '', action: null, id: null });
    const [selectedExecutor, setSelectedExecutor] = useState('');
    
    const [showUserModal, setShowUserModal] = useState(false);
    const [isEditingUser, setIsEditingUser] = useState(false);
    const [currentUser, setCurrentUser] = useState({ id: null, username: '', password: '', role: 'staff', department: '' });

    // ✅ FETCH ALL DATA & CHECK SECURITY
    useEffect(() => {
        const storedUser = sessionStorage.getItem('user');
        if (!storedUser) {
            navigate('/', { replace: true });
            return;
        }

        // Block Back Button
        window.history.pushState(null, document.title, window.location.href);
        window.addEventListener('popstate', function (event) {
            window.history.pushState(null, document.title, window.location.href);
        });

        fetchRequests();
        fetchHallBookings();
        fetchUsers();
        fetchExecutors();
        
        // Auto Refresh logic to keep admin dashboard synced
        const interval = setInterval(() => {
            fetchRequests();
            fetchHallBookings();
        }, 5000);
        return () => clearInterval(interval);

    }, [navigate]);

    // ✅ LOGOUT FUNCTION
    const handleLogout = () => {
        if(window.confirm("Are you sure you want to logout?")) {
            sessionStorage.removeItem('user'); 
            navigate('/', { replace: true });
        }
    };

    // --- API CALLS (WITH SAFETY CHECKS) ---
    const fetchRequests = () => {
        fetch(`${API_URL}/api/work-requests`)
            .then(res => {
                if (!res.ok) throw new Error("Server Error");
                return res.json();
            })
            .then(data => {
                if (Array.isArray(data)) setRequests(data);
                else setRequests([]);
            })
            .catch(err => {
                console.error("Error fetching requests:", err);
                setRequests([]);
            });
    };

    const fetchHallBookings = () => {
        fetch(`${API_URL}/api/hall-bookings`)
            .then(res => {
                if (!res.ok) throw new Error("Server Error");
                return res.json();
            })
            .then(data => {
                if (Array.isArray(data)) setHallBookings(data);
                else setHallBookings([]);
            })
            .catch(err => {
                console.error("Error fetching hall bookings:", err);
                setHallBookings([]);
            });
    };

    const fetchUsers = () => {
        fetch(`${API_URL}/api/users`)
            .then(res => res.ok ? res.json() : [])
            .then(data => setUsers(Array.isArray(data) ? data : []))
            .catch(err => setUsers([]));
    };

    const fetchExecutors = () => {
        fetch(`${API_URL}/api/users/executors`)
            .then(res => res.ok ? res.json() : [])
            .then(data => setExecutors(Array.isArray(data) ? data : []))
            .catch(err => setExecutors([]));
    };

    // --- HANDLERS ---
    const toggleSidebar = () => setSidebarOpen(!isSidebarOpen);

    const triggerSuccessPopup = () => {
        setShowSuccessPopup(true);
        setTimeout(() => setShowSuccessPopup(false), 3000); 
    };

    // --- ACTIONS ---
    const updateHallStatus = async (id, status) => {
        if(!window.confirm(`Confirm ${status}?`)) return;
        try {
            await fetch(`${API_URL}/api/hall-bookings/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status })
            });
            fetchHallBookings();
        } catch (err) { alert("Error updating status"); }
    };

    const updateWorkStatus = async () => {
        // ... (This function seems unused, logic moved to confirmWorkAction, keeping for safety)
    };

    // --- USER MANAGEMENT LOGIC ---
    const handleUserSubmit = async (e) => {
        e.preventDefault();
        const url = isEditingUser 
            ? `${API_URL}/api/users/${currentUser.id}`
            : `${API_URL}/api/users`;
        const method = isEditingUser ? 'PUT' : 'POST';

        try {
            await fetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(currentUser)
            });
            fetchUsers();
            fetchExecutors();
            setShowUserModal(false);
            triggerSuccessPopup(); 
        } catch (err) { alert("Failed to save user"); }
    };

    const deleteUser = async (id) => {
        if (!window.confirm("Are you sure you want to delete this user?")) return;
        try {
            await fetch(`${API_URL}/api/users/${id}`, { method: 'DELETE' });
            fetchUsers();
            fetchExecutors();
        } catch (err) { alert("Failed to delete"); }
    };

    const openAddUser = () => {
        setIsEditingUser(false);
        setCurrentUser({ username: '', password: '', role: 'staff', department: '' });
        setShowUserModal(true);
    };

    const openEditUser = (user) => {
        setIsEditingUser(true);
        setCurrentUser(user);
        setShowUserModal(true);
    };

    const openWorkModal = (action, id) => {
        let title = action === 'approve' ? 'Assign Executor' : 'Reject Request';
        if (action === 'approve') setSelectedExecutor('');
        setWorkModalData({ title, action, id });
        setShowWorkModal(true);
    };

    const confirmWorkAction = async () => {
        let newStatus = '';
        let bodyData = {};

        if (workModalData.action === 'approve') {
            if (!selectedExecutor) return alert("Please select an executor!");
            
            newStatus = 'approved'; 
            
            // 🔥 ULTIMATE FIX: Sending BOTH 'assignedTo' and 'assigned_to'
            // Idhu backend epdi irundhalum ID-a correct-a eduthukum.
            bodyData = { 
                status: newStatus, 
                assignedTo: selectedExecutor,  // For CamelCase Backend (Node.js convention)
                assigned_to: selectedExecutor  // For SnakeCase Backend (Database convention)
            }; 

        } else if (workModalData.action === 'reject') {
            newStatus = 'rejected'; 
            bodyData = { status: newStatus };
        }

        try {
            await fetch(`${API_URL}/api/work-requests/${workModalData.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(bodyData)
            });
            fetchRequests();
            setShowWorkModal(false);
        } catch (err) { alert("Server Error"); }
    };
    
    const getStatusClass = (s) => {
        if (!s) return '';
        const status = s.toLowerCase();
        // Updated to support 'pending' status color
        if (status.includes('pend')) return 'status-submitted';
        if (status.includes('submit')) return 'status-submitted';
        if (status.includes('approv')) return 'status-approved';
        if (status.includes('reject')) return 'status-rejected';
        if (status.includes('progress')) return 'status-progress';
        if (status.includes('complet')) return 'status-completed';
        return '';
    };

    return (
        <div className="admin-wrapper">
            <style>{`
                * { margin: 0; padding: 0; box-sizing: border-box; }
                body { font-family: 'Segoe UI', sans-serif; background: #f1f8f1; }
                
                /* LAYOUT & COLOR THEME UPDATE */
                .admin-wrapper { display: flex; min-height: 100vh; transition: all 0.3s ease; }
                
                /* --- SIDEBAR (GREEN THEME) --- */
                .sidebar { 
                    width: ${isSidebarOpen ? '260px' : '70px'}; 
                    background: linear-gradient(180deg, #1b5e20 0%, #2e7d32 100%); 
                    color: white; 
                    padding: 20px 10px; 
                    display: flex; flex-direction: column; 
                    position: fixed; 
                    top: 116px; 
                    height: calc(100vh - 116px); 
                    z-index: 100;
                    transition: width 0.3s ease;
                    box-shadow: 4px 0 15px rgba(0,0,0,0.1);
                }
                
                .logo-box { display: flex; align-items: center; justify-content: center; margin-bottom: 30px; height: 50px; }
                .logo-text { font-size: 20px; font-weight: 800; color: white; margin-left: 10px; display: ${isSidebarOpen ? 'block' : 'none'}; text-shadow: 0 2px 4px rgba(0,0,0,0.2); }
                .toggle-btn { background: rgba(255,255,255,0.2); border: none; color: white; width: 40px; height: 40px; border-radius: 8px; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 20px; transition: 0.3s; }
                .toggle-btn:hover { background: rgba(255,255,255,0.3); }

                /* NAVIGATION ITEMS */
                .nav-item { 
                    padding: 12px; border-radius: 10px; cursor: pointer; margin-bottom: 8px; 
                    font-weight: 600; display: flex; align-items: center; 
                    justify-content: ${isSidebarOpen ? 'flex-start' : 'center'};
                    gap: 15px; transition: all 0.2s; position: relative;
                    color: rgba(255,255,255,0.8);
                }
                .nav-item:hover, .nav-item.active { background: white; color: #1b5e20; box-shadow: 0 4px 10px rgba(0,0,0,0.1); }
                .nav-icon { font-size: 20px; min-width: 24px; text-align: center; }
                .nav-text { display: ${isSidebarOpen ? 'block' : 'none'}; white-space: nowrap; }

                /* TOOLTIP */
                ${!isSidebarOpen ? `
                    .nav-item:hover::after {
                        content: attr(data-tooltip);
                        position: absolute;
                        left: 60px;
                        top: 50%;
                        transform: translateY(-50%);
                        background: #1b5e20;
                        color: white;
                        padding: 6px 12px;
                        border-radius: 6px;
                        font-size: 12px;
                        white-space: nowrap;
                        z-index: 200;
                        box-shadow: 0 4px 10px rgba(0,0,0,0.15);
                        opacity: 1;
                        pointer-events: none;
                    }
                ` : ''}

                /* MAIN CONTENT (LAYOUT FIX) */
                .main-content { 
                    flex: 1; 
                    margin-left: ${isSidebarOpen ? '260px' : '70px'}; 
                    margin-top: 116px; 
                    padding: 30px; 
                    transition: margin-left 0.3s ease;
                    width: 100%;
                }
                
                /* DASHBOARD CARDS */
                .cards-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 20px; margin-bottom: 30px; }
                .stat-card { background: white; padding: 25px; border-radius: 16px; box-shadow: 0 4px 15px rgba(0,0,0,0.05); border: 1px solid #e2e8f0; transition: transform 0.2s; }
                .stat-card:hover { transform: translateY(-5px); }
                .stat-card h3 { font-size: 12px; color: #64748b; margin-bottom: 10px; text-transform: uppercase; font-weight: 700; letter-spacing: 0.5px; }
                .stat-card .num { font-size: 32px; font-weight: 800; color: #1b5e20; }

                /* FILTERS */
                .filters { background: white; padding: 15px; border-radius: 12px; margin-bottom: 20px; display: flex; gap: 10px; flex-wrap: wrap; box-shadow: 0 4px 15px rgba(0,0,0,0.05); border: 1px solid #e2e8f0; }
                .filter-btn { padding: 8px 18px; border-radius: 8px; border: 2px solid #e2e8f0; background: white; cursor: pointer; font-weight: 600; color: #4a5568; transition: 0.2s; }
                .filter-btn.active { background: linear-gradient(135deg, #1b5e20 0%, #2e7d32 100%); color: white; border-color: transparent; }
                .filter-btn:hover { transform: translateY(-1px); }

                /* TABLES */
                .table-container { background: white; border-radius: 16px; padding: 25px; box-shadow: 0 4px 15px rgba(0,0,0,0.05); border: 1px solid #e2e8f0; overflow-x: auto; }
                .section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px; }
                .section-title { font-size: 18px; font-weight: 700; color: #1e293b; }
                .add-btn { background: #1b5e20; color: white; padding: 10px 20px; border-radius: 8px; border: none; font-weight: 600; cursor: pointer; transition: transform 0.2s; box-shadow: 0 4px 10px rgba(27, 94, 32, 0.3); }
                .add-btn:hover { transform: translateY(-2px); }
                
                table { width: 100%; border-collapse: collapse; min-width: 600px; }
                th { text-align: left; padding: 15px; background: #f8fafc; color: #64748b; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; }
                td { padding: 15px; border-bottom: 1px solid #f1f5f9; font-size: 14px; color: #334155; }
                
                /* BADGES & BUTTONS */
                .status-badge { padding: 6px 12px; border-radius: 20px; font-size: 11px; font-weight: 700; text-transform: uppercase; }
                .status-submitted { background: #fff7ed; color: #c2410c; }
                .status-approved { background: #f0fdf4; color: #15803d; }
                .status-progress { background: #eff6ff; color: #1d4ed8; }
                .status-rejected { background: #fef2f2; color: #b91c1c; }
                .status-completed { background: #f0fdfa; color: #0f766e; }

                .action-btn { padding: 6px 12px; border-radius: 6px; border: none; cursor: pointer; font-size: 12px; font-weight: 600; margin-right: 5px; transition: 0.2s; }
                .action-btn:hover { transform: scale(1.05); }
                .btn-view { background: #f1f5f9; color: #475569; }
                .btn-approve { background: #dcfce7; color: #166534; }
                .btn-reject { background: #fee2e2; color: #991b1b; }
                .btn-edit { background: #dbeafe; color: #1e40af; }
                .btn-delete { background: #fee2e2; color: #991b1b; }

                /* SUCCESS POPUP */
                .success-popup {
                    position: fixed; top: 130px; right: 20px;
                    background: #1b5e20; color: white;
                    padding: 16px 24px; border-radius: 12px;
                    box-shadow: 0 10px 30px rgba(27, 94, 32, 0.3);
                    font-weight: 600; display: flex; align-items: center; gap: 10px;
                    animation: slideIn 0.3s ease; z-index: 2000;
                }
                @keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }

                /* MODAL */
                .modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); display: flex; justify-content: center; align-items: center; z-index: 1000; backdrop-filter: blur(2px); }
                .modal-box { background: white; padding: 30px; border-radius: 16px; width: 90%; max-width: 450px; box-shadow: 0 20px 50px rgba(0,0,0,0.1); }
                .form-group { margin-bottom: 15px; }
                .form-group label { display: block; margin-bottom: 6px; font-size: 13px; font-weight: 600; color: #475569; }
                .form-group input, .form-group select { width: 100%; padding: 12px; border: 2px solid #e2e8f0; border-radius: 8px; outline: none; font-size: 14px; background: #f8fafc; }
                .form-group input:focus, .form-group select:focus { border-color: #1b5e20; background: white; }
                .modal-actions { display: flex; justify-content: flex-end; gap: 10px; margin-top: 25px; }
            `}</style>

            {/* SUCCESS POPUP */}
            {showSuccessPopup && (
                <div className="success-popup">
                    <span>✨</span> Action Successful!
                </div>
            )}

            {/* SIDEBAR */}
            <div className="sidebar">
                <div className="logo-box">
                    <button className="toggle-btn" onClick={toggleSidebar}>
                        {isSidebarOpen ? '❮' : '☰'}
                    </button>
                    <span className="logo-text">AdminPanel</span>
                </div>
                
                <div 
                    className={`nav-item ${currentView === 'dashboard' ? 'active' : ''}`} 
                    onClick={() => { setCurrentView('dashboard'); setFilter('All'); }} 
                    data-tooltip="Dashboard" 
                >
                    <span className="nav-icon">📊</span> 
                    <span className="nav-text">Dashboard</span>
                </div>
                <div 
                    className={`nav-item ${currentView === 'hall' ? 'active' : ''}`} 
                    onClick={() => { setCurrentView('hall'); setFilter('All'); }} 
                    data-tooltip="Hall Bookings"
                >
                    <span className="nav-icon">🏛️</span> 
                    <span className="nav-text">Hall Bookings</span>
                </div>
                <div 
                    className={`nav-item ${currentView === 'users' ? 'active' : ''}`} 
                    onClick={() => setCurrentView('users')}
                    data-tooltip="User Management"
                >
                    <span className="nav-icon">👥</span> 
                    <span className="nav-text">User Management</span>
                </div>
                
                <div 
                    style={{marginTop: 'auto'}} 
                    className={`nav-item`} 
                    onClick={handleLogout} 
                    data-tooltip="Logout"
                >
                    <span className="nav-icon">🚪</span> 
                    <span className="nav-text">Logout</span>
                </div>
            </div>

            {/* MAIN CONTENT AREA */}
            <div className="main-content">
                
                <Header title={currentView === 'dashboard' ? 'Overview' : currentView === 'hall' ? 'Hall Bookings' : 'User Management'} user="Administrator" role="Admin" />

                {/* VIEW 1: WORK REQUESTS (DASHBOARD) */}
                {currentView === 'dashboard' && (
                    <>
                        {/* COUNTS */}
                        <div className="cards-grid">
                            <div className="stat-card"><h3>Total Requests</h3><div className="num">{requests.length}</div></div>
                            <div className="stat-card"><h3>Pending</h3><div className="num">{requests.filter(r => normalize(r.status) === 'pending').length}</div></div>
                            <div className="stat-card"><h3>In Progress</h3><div className="num">{requests.filter(r => normalize(r.status) === 'in progress').length}</div></div>
                            <div className="stat-card"><h3>Completed</h3><div className="num">{requests.filter(r => normalize(r.status) === 'completed').length}</div></div>
                        </div>

                        {/* FILTERS */}
                        <div className="filters">
                            {['All', 'pending', 'Approved', 'In Progress', 'Completed', 'Rejected'].map(f => (
                                <button 
                                    key={f} 
                                    className={`filter-btn ${filter === f ? 'active' : ''}`}
                                    onClick={() => setFilter(f)}
                                >{f === 'pending' ? 'Pending' : f}</button>
                            ))}
                        </div>

                        <div className="table-container">
                            <div className="section-header">
                                <h3 className="section-title">Work Requests</h3>
                            </div>
                            <table>
                                <thead>
                                    <tr><th>ID</th><th>Department</th><th>Type</th><th>Status</th><th>Actions</th></tr>
                                </thead>
                                <tbody>
                                    {requests.filter(req => filter === 'All' || normalize(req.status) === normalize(filter)).length === 0 ? (
                                        <tr><td colSpan="5" style={{textAlign:'center', color:'#718096'}}>No requests found.</td></tr>
                                    ) : (
                                        requests.filter(req => filter === 'All' || normalize(req.status) === normalize(filter)).map(req => (
                                            <tr key={req.id}>
                                                <td>#{req.id}</td>
                                                <td>{req.department}</td>
                                                <td>{req.work_type}</td>
                                                <td><span className={`status-badge ${getStatusClass(req.status)}`}>{req.status}</span></td>
                                                <td>
                                                    <button className="action-btn btn-view" onClick={() => navigate('/view-work', { state: { id: req.id } })}>View</button>
                                                    
                                                    {normalize(req.status) === 'pending' && (
                                                        <>
                                                            <button className="action-btn btn-approve" onClick={() => openWorkModal('approve', req.id)}>✓ Assign</button>
                                                            <button className="action-btn btn-reject" onClick={() => openWorkModal('reject', req.id)}>✕ Reject</button>
                                                        </>
                                                    )}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </>
                )}

                {/* VIEW 2: HALL BOOKINGS */}
                {currentView === 'hall' && (
                    <>
                        <div className="cards-grid">
                            <div className="stat-card"><h3>Total Bookings</h3><div className="num">{hallBookings.length}</div></div>
                            <div className="stat-card"><h3>Pending</h3><div className="num">{hallBookings.filter(b => normalize(b.status) === 'pending').length}</div></div>
                            <div className="stat-card"><h3>Approved</h3><div className="num">{hallBookings.filter(b => normalize(b.status) === 'approved').length}</div></div>
                            <div className="stat-card"><h3>Rejected</h3><div className="num">{hallBookings.filter(b => normalize(b.status) === 'rejected').length}</div></div>
                        </div>

                        <div className="filters">
                            {['All', 'pending', 'Approved', 'Rejected'].map(f => (
                                <button key={f} className={`filter-btn ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>{f === 'pending' ? 'Pending' : f}</button>
                            ))}
                        </div>

                        <div className="table-container">
                            <div className="section-header"><h3 className="section-title">Hall Booking Requests</h3></div>
                            <table>
                                <thead><tr><th>ID</th><th>Hall</th><th>Event</th><th>Date</th><th>Status</th><th>Actions</th></tr></thead>
                                <tbody>
                                    {hallBookings.filter(bk => filter === 'All' || normalize(bk.status) === normalize(filter)).length === 0 ? (
                                        <tr><td colSpan="6" style={{textAlign:'center', color:'#718096'}}>No bookings found.</td></tr>
                                    ) : (
                                        hallBookings.filter(bk => filter === 'All' || normalize(bk.status) === normalize(filter)).map(bk => (
                                            <tr key={bk.id}>
                                                <td>#{bk.id}</td>
                                                <td>{bk.hall_name}</td>
                                                <td>{bk.programme}<br/><small style={{color:'#1b5e20'}}>{bk.department}</small></td>
                                                <td>{bk.booking_date}</td>
                                                <td><span className={`status-badge ${getStatusClass(bk.status)}`}>{bk.status}</span></td>
                                                <td>
                                                    {normalize(bk.status) === 'pending' && (
                                                        <>
                                                            <button className="action-btn btn-approve" onClick={() => updateHallStatus(bk.id, 'approved')}>Approve</button>
                                                            <button className="action-btn btn-reject" onClick={() => updateHallStatus(bk.id, 'rejected')}>Reject</button>
                                                        </>
                                                    )}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </>
                )}

                {/* VIEW 3: USER MANAGEMENT CRUD */}
                {currentView === 'users' && (
                    <div className="table-container">
                        <div className="section-header">
                            <h3 className="section-title">All System Users</h3>
                            <button className="add-btn" onClick={openAddUser}>+ Add New User</button>
                        </div>
                        <table>
                            <thead><tr><th>ID</th><th>Username</th><th>Role</th><th>Department</th><th>Password</th><th>Actions</th></tr></thead>
                            <tbody>
                                {users.map(u => (
                                    <tr key={u.id}>
                                        <td>{u.id}</td>
                                        <td><b>{u.username}</b></td>
                                        <td><span style={{textTransform:'capitalize', background:'#f1f5f9', padding:'4px 8px', borderRadius:'4px', fontSize:'12px', fontWeight:'600'}}>{u.role}</span></td>
                                        <td>{u.department || '-'}</td><td style={{fontFamily:'monospace', color:'#94a3b8'}}>••••••</td>
                                        <td>
                                            <button className="action-btn btn-edit" onClick={() => openEditUser(u)}>Edit</button>
                                            <button className="action-btn btn-delete" onClick={() => deleteUser(u.id)}>Delete</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* MODAL 1: WORK ASSIGNMENT */}
            {showWorkModal && (
                <div className="modal-overlay">
                    <div className="modal-box">
                        <h3 style={{color:'#1e293b', marginBottom:'20px'}}>{workModalData.title}</h3>
                        {workModalData.action === 'approve' ? (
                            <div className="form-group">
                                <label>Select Executor to Assign:</label>
                                <select onChange={(e) => setSelectedExecutor(e.target.value)} value={selectedExecutor}>
                                    <option value="">-- Choose Executor --</option>
                                    {executors.map(ex => (
                                        <option key={ex.id} value={ex.id}>{ex.username} ({ex.department})</option>
                                    ))}
                                </select>
                            </div>
                        ) : (
                            <p style={{color:'#64748b'}}>Are you sure you want to reject this request?</p>
                        )}
                        <div className="modal-actions">
                            <button className="action-btn btn-view" onClick={() => setShowWorkModal(false)}>Cancel</button>
                            <button className="add-btn" onClick={confirmWorkAction}>Confirm</button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL 2: ADD/EDIT USER */}
            {showUserModal && (
                <div className="modal-overlay">
                    <div className="modal-box">
                        <h3 style={{color:'#1e293b', marginBottom:'20px'}}>{isEditingUser ? 'Edit User' : 'Add New User'}</h3>
                        <form onSubmit={handleUserSubmit}>
                            <div className="form-group"><label>Username</label><input type="text" required value={currentUser.username} onChange={e => setCurrentUser({...currentUser, username: e.target.value})} /></div>
                            <div className="form-group"><label>Password</label><input type="text" required value={currentUser.password} onChange={e => setCurrentUser({...currentUser, password: e.target.value})} /></div>
                            <div className="form-group"><label>Role</label><select value={currentUser.role} onChange={e => setCurrentUser({...currentUser, role: e.target.value})}><option value="staff">Staff</option><option value="executor">Executor</option><option value="admin">Admin</option></select></div>
                            <div className="form-group"><label>Department</label><input type="text" value={currentUser.department} onChange={e => setCurrentUser({...currentUser, department: e.target.value})} /></div>
                            <div className="modal-actions"><button type="button" className="action-btn btn-view" onClick={() => setShowUserModal(false)}>Cancel</button><button type="submit" className="add-btn">Save User</button></div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminDashboard;