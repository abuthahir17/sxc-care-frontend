import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import API_URL from '../config';

const StaffDashboard = () => {
    const navigate = useNavigate();
    
    // --- STATES ---
    const [requests, setRequests] = useState([]); 
    const [bookings, setBookings] = useState([]); // ✅ Hall Bookings Data
    const [view, setView] = useState('work'); // ✅ Toggle View ('work' or 'hall')
    const [filter, setFilter] = useState('All');
    const [currentUser, setCurrentUser] = useState({ username: 'Staff', id: null });

    // 🔴 NEW: Upload Report States
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [selectedBooking, setSelectedBooking] = useState(null);
    const [uploadFiles, setUploadFiles] = useState([]);
    const [uploadReportFiles, setUploadReportFiles] = useState([]);
    const [uploadLoading, setUploadLoading] = useState(false);

    // --- EFFECT: AUTH & DATA FETCH ---
    useEffect(() => {
        // 1. Security Check
        const storedUser = sessionStorage.getItem('user');
        if (!storedUser) {
            navigate('/', { replace: true });
            return;
        }

        // 2. Block Back Button
        window.history.pushState(null, document.title, window.location.href);
        window.addEventListener('popstate', function (event) {
            window.history.pushState(null, document.title, window.location.href);
        });

        const userObj = JSON.parse(storedUser);
        setCurrentUser(userObj);

        // 3. Fetch Both Data (Initial Load)
        fetchWorkRequests(userObj.id);
        fetchHallBookings(userObj.id);

        // 🔥 Auto Refresh every 2 seconds (Real-Time Update)
        const interval = setInterval(() => {
            fetchWorkRequests(userObj.id);
            fetchHallBookings(userObj.id);
        }, 2000);

        return () => clearInterval(interval);

    }, [navigate]);

    // --- API CALLS ---
    const fetchWorkRequests = (userId) => {
        fetch(`${API_URL}/api/work-requests?userId=${userId}`)
            .then(res => res.json())
            .then(data => setRequests(data))
            .catch(err => console.error("Error fetching work:", err));
    };

    const fetchHallBookings = (userId) => {
        fetch(`${API_URL}/api/hall-bookings?userId=${userId}`)
            .then(res => res.json())
            .then(data => setBookings(data))
            .catch(err => console.error("Error fetching hall:", err));
    };

    // 🔴 NEW: Handle Upload Report Button Click
    const handleUploadClick = (booking) => {
        setSelectedBooking(booking);
        setShowUploadModal(true);
        setUploadFiles([]);
        setUploadReportFiles([]);
    };

    // 🔴 NEW: Handle Photo Upload
    const handlePhotoUpload = (e) => {
        const files = Array.from(e.target.files);
        // Max 5 photos
        if (uploadFiles.length + files.length > 5) {
            alert("Maximum 5 photos allowed!");
            return;
        }
        setUploadFiles([...uploadFiles, ...files]);
    };

    // 🔴 NEW: Handle Report Upload
    const handleReportUpload = (e) => {
        const files = Array.from(e.target.files);
        // Check if PDF
        const validFiles = files.filter(file => file.type === 'application/pdf');
        if (validFiles.length !== files.length) {
            alert("Only PDF files allowed for reports!");
            return;
        }
        setUploadReportFiles([...uploadReportFiles, ...validFiles]);
    };

    // 🔴 NEW: Remove Photo
    const removePhoto = (index) => {
        setUploadFiles(uploadFiles.filter((_, i) => i !== index));
    };

    // 🔴 NEW: Remove Report
    const removeReport = (index) => {
        setUploadReportFiles(uploadReportFiles.filter((_, i) => i !== index));
    };

    // 🔴 NEW: Submit Upload
    const handleUploadSubmit = async () => {
        if (uploadFiles.length === 0 && uploadReportFiles.length === 0) {
            alert("Please upload at least one file!");
            return;
        }

        setUploadLoading(true);

        const formData = new FormData();
        formData.append('bookingId', selectedBooking.id);
        formData.append('userId', currentUser.id);
        formData.append('username', currentUser.username);
        
        // Append photos
        uploadFiles.forEach(file => {
            formData.append('photos', file);
        });
        
        // Append reports
        uploadReportFiles.forEach(file => {
            formData.append('reports', file);
        });

        try {
            const response = await fetch(`${API_URL}/api/upload-hall-report`, {
                method: 'POST',
                body: formData
            });

            if (response.ok) {
                alert("✅ Report uploaded successfully!");
                setShowUploadModal(false);
                setUploadFiles([]);
                setUploadReportFiles([]);
                setSelectedBooking(null);
                
                // Refresh data
                fetchHallBookings(currentUser.id);
            } else {
                const error = await response.json();
                alert(`Upload failed: ${error.error || 'Unknown error'}`);
            }
        } catch (error) {
            console.error("Upload error:", error);
            alert("Server error! Check console.");
        } finally {
            setUploadLoading(false);
        }
    };

    // --- HELPER: GET CURRENT STATS (KPI CARDS LOGIC) ---
    const activeList = view === 'work' ? requests : bookings;
    
    // 🔥 FIX: Strict Counting (No merging of statuses)
    const stats = {
        total: activeList.length,
        pending: activeList.filter(r => r.status?.toLowerCase() === 'pending').length,
        approved: activeList.filter(r => r.status?.toLowerCase() === 'approved').length,
        inProgress: activeList.filter(r => r.status?.toLowerCase() === 'in progress').length,
        completed: activeList.filter(r => r.status?.toLowerCase() === 'completed').length,
        rejected: activeList.filter(r => r.status?.toLowerCase() === 'rejected').length
    };

    // --- DEFINE FILTERS BASED ON VIEW ---
    const workFilters = ['All', 'Pending', 'Approved', 'In Progress', 'Completed', 'Rejected'];
    const hallFilters = ['All', 'Pending', 'Approved', 'Rejected'];
    const currentFilters = view === 'work' ? workFilters : hallFilters;

    // Helper for Status CSS Colors
    const getStatusClass = (status) => {
        const s = status ? status.toLowerCase() : 'submitted';
        if (s.includes('pend')) return 'status-submitted'; // 'Pending' gets orange/yellow
        if (s.includes('approv')) return 'status-approved';
        if (s.includes('reject')) return 'status-rejected';
        if (s.includes('progress')) return 'status-progress';
        if (s.includes('complet')) return 'status-completed';
        return '';
    };

    return (
        <div className="staff-container">
            <style>{`
                * { margin: 0; padding: 0; box-sizing: border-box; }
                body { font-family: 'Segoe UI', sans-serif; background: #f1f8f1; min-height: 100vh; }
                
                .container { 
                    max-width: 1300px; 
                    margin: 0 auto; 
                    padding: 30px 20px;
                    margin-top: 110px; /* Header Height Space */
                }
                
                /* --- KPI CARDS (STATS) --- */
                .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px; }
                .stat-card { 
                    background: white; 
                    padding: 25px; 
                    border-radius: 12px; 
                    border: 1px solid #e2e8f0;
                    box-shadow: 0 4px 6px rgba(0,0,0,0.02);
                    transition: transform 0.2s ease; 
                }
                .stat-card:hover { transform: translateY(-5px); box-shadow: 0 10px 15px rgba(0,0,0,0.05); }
                .stat-card h3 { font-size: 13px; color: #718096; text-transform: uppercase; margin-bottom: 10px; letter-spacing: 0.5px; font-weight: 700; }
                .stat-card .number { font-size: 32px; font-weight: 800; color: #1b5e20; }
                
                /* PAGE HEADER & BUTTONS */
                .page-title { display: flex; justify-content: space-between; margin-bottom: 25px; align-items: center; }
                .page-title h1 { color: #1b5e20; font-size: 26px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; }
                
                .btn-group { display: flex; gap: 15px; }
                .new-btn { 
                    background: #1b5e20; 
                    color: white; 
                    padding: 12px 24px; 
                    border-radius: 8px; 
                    border: none; 
                    font-weight: 600; 
                    cursor: pointer; 
                    transition: transform 0.2s; 
                    display: flex; align-items: center; gap: 8px;
                    box-shadow: 0 4px 6px rgba(27, 94, 32, 0.2);
                }
                .new-btn:hover { transform: translateY(-2px); box-shadow: 0 6px 12px rgba(27, 94, 32, 0.3); }
                .hall-btn { background: #f59e0b; color: #fff; } 
                .hall-btn:hover { background: #d97706; }

                /* TABS */
                .tabs { display: flex; gap: 5px; margin-bottom: 20px; border-bottom: 2px solid #e2e8f0; padding-bottom: 0; }
                .tab-item { 
                    color: #718096; 
                    font-size: 15px; 
                    font-weight: 600; 
                    cursor: pointer; 
                    padding: 10px 20px; 
                    transition: 0.3s; 
                    border-bottom: 3px solid transparent;
                    margin-bottom: -2px;
                }
                .tab-item:hover { color: #1b5e20; }
                .tab-item.active { color: #1b5e20; border-bottom: 3px solid #1b5e20; background: rgba(27, 94, 32, 0.05); }

                /* FILTERS & TABLE */
                .filters { background: white; padding: 15px; border-radius: 12px; margin-bottom: 20px; display: flex; gap: 10px; flex-wrap: wrap; border: 1px solid #e2e8f0; }
                .filter-btn { padding: 8px 18px; border-radius: 6px; border: 1px solid #e2e8f0; background: white; cursor: pointer; font-weight: 600; color: #4a5568; transition: 0.2s; }
                .filter-btn.active { background: linear-gradient(135deg, #1b5e20 0%, #2e7d32 100%); color: white; border-color: transparent; }
                .filter-btn:hover:not(.active) { background: #f7fafc; }

                .table-box { background: white; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px rgba(0,0,0,0.01); }
                table { width: 100%; border-collapse: collapse; }
                th, td { padding: 16px 20px; text-align: left; }
                th { background: #f8fafc; text-transform: uppercase; font-size: 12px; color: #64748b; font-weight: 700; letter-spacing: 0.5px; border-bottom: 1px solid #e2e8f0; }
                tr { border-bottom: 1px solid #f1f5f9; }
                tr:hover { background: #f8fafc; }
                
                .status-badge { padding: 6px 12px; border-radius: 20px; font-size: 11px; font-weight: 700; text-transform: uppercase; }
                .status-submitted { background: #fff7ed; color: #b45309; } 
                .status-approved { background: #f0fdf4; color: #15803d; }
                .status-progress { background: #eff6ff; color: #1d4ed8; } 
                .status-completed { background: #f0fdfa; color: #0f766e; }
                .status-rejected { background: #fef2f2; color: #b91c1c; }
                
                .view-btn { padding: 8px 16px; border-radius: 6px; border: 1px solid #e2e8f0; background: white; color: #4a5568; cursor: pointer; font-weight: 600; font-size: 13px; transition: 0.2s; }
                .view-btn:hover { border-color: #1b5e20; color: #1b5e20; background: #f0fdf4; }

                /* 🔴 NEW: Upload Report Button */
                .upload-report-btn { 
                    background: #f59e0b; 
                    color: white; 
                    padding: 8px 16px; 
                    border-radius: 6px; 
                    border: none; 
                    font-weight: 600; 
                    font-size: 12px; 
                    cursor: pointer; 
                    display: inline-flex; 
                    align-items: center; 
                    gap: 6px; 
                    transition: all 0.2s;
                    box-shadow: 0 2px 4px rgba(245, 158, 11, 0.3);
                }
                .upload-report-btn:hover { 
                    background: #d97706; 
                    transform: translateY(-2px);
                    box-shadow: 0 4px 8px rgba(245, 158, 11, 0.4);
                }

                /* 🔴 NEW: Upload Modal Styles */
                .upload-modal-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(0,0,0,0.6);
                    backdrop-filter: blur(4px);
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    z-index: 2000;
                }
                .upload-modal {
                    background: white;
                    padding: 40px;
                    border-radius: 16px;
                    width: 90%;
                    max-width: 600px;
                    max-height: 80vh;
                    overflow-y: auto;
                    animation: slideDown 0.3s ease;
                    border-top: 6px solid #f59e0b;
                }
                .upload-area {
                    border: 2px dashed #cbd5e0;
                    border-radius: 8px;
                    padding: 30px;
                    text-align: center;
                    background: #f8fafc;
                    cursor: pointer;
                    margin: 20px 0;
                }
                .upload-area:hover {
                    border-color: #f59e0b;
                    background: #fff7ed;
                }
                .file-list {
                    margin: 15px 0;
                }
                .file-item {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 10px;
                    background: #f8fafc;
                    border-radius: 6px;
                    margin-bottom: 8px;
                }
                .remove-file {
                    color: #dc2626;
                    cursor: pointer;
                    font-weight: 600;
                }
                .remove-file:hover {
                    color: #b91c1c;
                }
                @keyframes slideDown {
                    from { transform: translateY(-30px); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
            `}</style>

            <Header title="Staff Dashboard" user={currentUser.username} role="Department Staff" />

            <div className="container">
                
                {/* PAGE HEADER */}
                <div className="page-title">
                    <h1>My Dashboard</h1>
                    <div className="btn-group">
                        <button className="new-btn hall-btn" onClick={() => navigate('/create-hall-booking')}>🏛️ Hall Booking</button>
                        <button className="new-btn" onClick={() => navigate('/create-work')}>+ Create Request</button>
                    </div>
                </div>

                {/* ✅ KPI CARDS (STATS GRID) - Dynamic based on View */}
                <div className="stats-grid">
                    <div className="stat-card"><h3>Total</h3><div className="number">{stats.total}</div></div>
                    <div className="stat-card"><h3>Pending</h3><div className="number">{stats.pending}</div></div>
                    
                    {/* Dynamic 3rd Card: Shows 'In Progress' for Work, 'Approved' for Hall */}
                    <div className="stat-card">
                        <h3>{view === 'work' ? 'In Progress' : 'Approved'}</h3>
                        <div className="number">{view === 'work' ? stats.inProgress : stats.approved}</div>
                    </div>

                    {/* Dynamic 4th Card: Shows 'Completed' for Work, 'Rejected' for Hall */}
                    <div className="stat-card">
                        <h3>{view === 'work' ? 'Completed' : 'Rejected'}</h3>
                        <div className="number">{view === 'work' ? stats.completed : stats.rejected}</div>
                    </div>
                </div>

                {/* TABS */}
                <div className="tabs">
                    <div className={`tab-item ${view === 'work' ? 'active' : ''}`} onClick={() => { setView('work'); setFilter('All'); }}>Work Requests</div>
                    <div className={`tab-item ${view === 'hall' ? 'active' : ''}`} onClick={() => { setView('hall'); setFilter('All'); }}>Hall Bookings</div>
                </div>

                {/* FILTERS */}
                <div className="filters">
                    {currentFilters.map(f => (
                        <button 
                            key={f} 
                            className={`filter-btn ${filter === f ? 'active' : ''}`} 
                            onClick={() => setFilter(f)}
                        >
                            {f}
                        </button>
                    ))}
                </div>

                {/* TABLE */}
                <div className="table-box">
                    <table>
                        <thead>
                            {view === 'work' ? (
                                <tr><th>Work ID</th><th>Work Type</th><th>Date</th><th>Priority</th><th>Status</th><th>Action</th></tr>
                            ) : (
                                <tr><th>Booking ID</th><th>Hall Name</th><th>Event</th><th>Date & Time</th><th>Status</th><th>Report</th></tr>
                            )}
                        </thead>
                        <tbody>
                            {activeList.filter(item => 
                                filter === 'All' || item.status?.toLowerCase() === filter.toLowerCase()
                            ).length === 0 ? (
                                <tr><td colSpan="6" style={{textAlign:'center', padding:'30px', color:'#718096'}}>No records found.</td></tr>
                            ) : (
                                activeList.filter(item => 
                                    filter === 'All' || item.status?.toLowerCase() === filter.toLowerCase()
                                ).map(item => (
                                    <tr key={item.id}>
                                        <td><strong style={{color:'#2d3748'}}>#{item.id}</strong></td>
                                        
                                        {/* VIEW: WORK REQUESTS */}
                                        {view === 'work' ? (
                                            <>
                                                <td>{item.work_type}</td>
                                                <td>{item.required_date?.split('T')[0]}</td>
                                                <td>
                                                    <span style={{
                                                        padding: '4px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase',
                                                        background: item.priority === 'High' ? '#fee2e2' : '#fef3c7',
                                                        color: item.priority === 'High' ? '#991b1b' : '#92400e'
                                                    }}>
                                                        {item.priority}
                                                    </span>
                                                </td>
                                            </>
                                        ) : (
                                        /* VIEW: HALL BOOKINGS */
                                            <>
                                                <td>{item.hall_name}</td>
                                                <td>{item.programme}</td>
                                                <td>
                                                    <div style={{fontWeight:'500'}}>{item.booking_date}</div>
                                                    <div style={{fontSize:'12px', color:'#718096'}}>{item.time_from} - {item.time_to}</div>
                                                </td>
                                            </>
                                        )}

                                        <td><span className={`status-badge ${getStatusClass(item.status)}`}>{item.status}</span></td>
                                        
                                        {/* VIEW BUTTON for Work / UPLOAD BUTTON for Hall */}
                                        {view === 'work' ? (
                                            <td><button className="view-btn" onClick={() => navigate('/view-work', { state: { id: item.id } })}>View</button></td>
                                        ) : (
                                            <td>
                                                {item.status?.toLowerCase() === 'approved' ? (
                                                    <button 
                                                        className="upload-report-btn"
                                                        onClick={() => handleUploadClick(item)}
                                                    >
                                                        📤 Upload Report
                                                    </button>
                                                ) : item.status?.toLowerCase() === 'completed' ? (
                                                    <span style={{fontSize:'12px', color:'#15803d', fontWeight:'600'}}>✅ Report Submitted</span>
                                                ) : (
                                                    <span style={{fontSize:'12px', color:'#94a3b8', fontStyle:'italic'}}>No Action</span>
                                                )}
                                            </td>
                                        )}
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* 🔴 NEW: Upload Report Modal */}
            {showUploadModal && (
                <div className="upload-modal-overlay">
                    <div className="upload-modal">
                        <h2 style={{color: '#f59e0b', marginBottom: '20px'}}>
                            📤 Upload Event Report
                        </h2>
                        
                        {selectedBooking && (
                            <div style={{background: '#f8fafc', padding: '15px', borderRadius: '8px', marginBottom: '20px'}}>
                                <p><strong>Hall:</strong> {selectedBooking.hall_name}</p>
                                <p><strong>Event:</strong> {selectedBooking.programme}</p>
                                <p><strong>Date:</strong> {selectedBooking.booking_date}</p>
                                <p><strong>Time:</strong> {selectedBooking.time_from} - {selectedBooking.time_to}</p>
                            </div>
                        )}

                        {/* Photos Upload */}
                        <div style={{marginBottom: '25px'}}>
                            <label style={{fontWeight: '700', color: '#1b5e20', display: 'block', marginBottom: '10px'}}>
                                📸 Event Photos (Max 5)
                            </label>
                            <div 
                                className="upload-area"
                                onClick={() => document.getElementById('photo-upload').click()}
                            >
                                <div style={{fontSize: '40px', marginBottom: '10px'}}>📷</div>
                                <div>Click to upload photos (JPG, PNG)</div>
                                <input 
                                    id="photo-upload"
                                    type="file" 
                                    multiple 
                                    accept="image/*"
                                    onChange={handlePhotoUpload}
                                    style={{display: 'none'}}
                                />
                            </div>
                            
                            {uploadFiles.length > 0 && (
                                <div className="file-list">
                                    {uploadFiles.map((file, index) => (
                                        <div key={index} className="file-item">
                                            <span>📸 {file.name}</span>
                                            <span 
                                                className="remove-file"
                                                onClick={() => removePhoto(index)}
                                            >
                                                ✖ Remove
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Reports Upload */}
                        <div style={{marginBottom: '25px'}}>
                            <label style={{fontWeight: '700', color: '#1b5e20', display: 'block', marginBottom: '10px'}}>
                                📄 Event Minutes & Report (PDF)
                            </label>
                            <div 
                                className="upload-area"
                                onClick={() => document.getElementById('report-upload').click()}
                            >
                                <div style={{fontSize: '40px', marginBottom: '10px'}}>📄</div>
                                <div>Click to upload PDF files</div>
                                <input 
                                    id="report-upload"
                                    type="file" 
                                    multiple 
                                    accept=".pdf"
                                    onChange={handleReportUpload}
                                    style={{display: 'none'}}
                                />
                            </div>
                            
                            {uploadReportFiles.length > 0 && (
                                <div className="file-list">
                                    {uploadReportFiles.map((file, index) => (
                                        <div key={index} className="file-item">
                                            <span>📄 {file.name}</span>
                                            <span 
                                                className="remove-file"
                                                onClick={() => removeReport(index)}
                                            >
                                                ✖ Remove
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Action Buttons */}
                        <div style={{display: 'flex', gap: '15px', justifyContent: 'flex-end', marginTop: '30px'}}>
                            <button 
                                className="view-btn" 
                                onClick={() => {
                                    setShowUploadModal(false);
                                    setUploadFiles([]);
                                    setUploadReportFiles([]);
                                    setSelectedBooking(null);
                                }}
                            >
                                Cancel
                            </button>
                            <button 
                                className="new-btn" 
                                onClick={handleUploadSubmit}
                                disabled={uploadLoading}
                                style={{background: '#f59e0b'}}
                            >
                                {uploadLoading ? 'Uploading...' : '✓ Submit Report'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StaffDashboard;