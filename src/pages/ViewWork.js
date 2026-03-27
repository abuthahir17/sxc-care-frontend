import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Header from '../components/Header';
import API_URL from '../config';

const ViewWork = () => {
    const navigate = useNavigate();
    const location = useLocation();
    
    const workId = location.state?.id;

    const [request, setRequest] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showImage, setShowImage] = useState(false);
    const [selectedImage, setSelectedImage] = useState('');
    const [currentUser, setCurrentUser] = useState({ username: 'User', role: 'Viewer' });

    useEffect(() => {
        const storedUser = sessionStorage.getItem('user');
        if (storedUser) {
            setCurrentUser(JSON.parse(storedUser));
        }
    }, []);

    useEffect(() => {
        if (!workId) return;

        fetch(`${API_URL}/api/work-requests`)
            .then(res => res.json())
            .then(data => {
                const foundWork = data.find(r => r.id === workId);
                setRequest(foundWork);
                setLoading(false);
            })
            .catch(err => {
                console.error("Error:", err);
                setLoading(false);
            });
    }, [workId]);

    const getStatusClass = (status) => {
        if (!status) return '';
        const s = status.toLowerCase();
        if (s.includes('submit')) return 'status-submitted';
        if (s.includes('approv')) return 'status-approved';
        if (s.includes('progress')) return 'status-progress';
        if (s.includes('complet')) return 'status-completed';
        if (s.includes('reject')) return 'status-rejected';
        return '';
    };

    // getImageUrl function change pannu (around line 40-50)

    const getImageUrl = (filePath) => {
    if (!filePath) return null;
    
    // ✅ Check if it's already a Cloudinary URL (starts with http)
    if (filePath.startsWith('http://') || filePath.startsWith('https://')) {
        return filePath;
    }
    
    // Fallback for local D: drive paths (old data)
    try {
        let urlPath = filePath.replace(/\\/g, '/');
        urlPath = urlPath.replace(/^D:/i, '');
        urlPath = urlPath.replace(/\/+/g, '/');
        
        if (!urlPath.startsWith('/')) {
            urlPath = '/' + urlPath;
        }
        return `${API_URL}${urlPath}`;
    } catch (e) {
        console.error("Error converting path:", e);
        return null;
    }
};
    const openImageModal = (imageUrl) => {
        setSelectedImage(imageUrl);
        setShowImage(true);
    };
    
    const formatLocalTime = (dateString) => {
    // ✅ NULL check - if no date, return 'N/A'
    if (!dateString || dateString === 'NULL' || dateString === null) {
        return 'N/A';
    }
    
    try {
        // Parse the database string directly: "2026-03-27 08:04:01"
        const [datePart, timePart] = dateString.split(' ');
        
        // ✅ If split didn't work, try handling ISO format
        if (!datePart || !timePart) {
            // Try parsing as ISO string
            const isoDate = new Date(dateString);
            if (!isNaN(isoDate.getTime())) {
                const day = String(isoDate.getDate()).padStart(2, '0');
                const month = String(isoDate.getMonth() + 1).padStart(2, '0');
                const year = isoDate.getFullYear();
                let hours = isoDate.getHours();
                const minutes = String(isoDate.getMinutes()).padStart(2, '0');
                const seconds = String(isoDate.getSeconds()).padStart(2, '0');
                const ampm = hours >= 12 ? 'pm' : 'am';
                const hour12 = hours % 12 || 12;
                return `${day}/${month}/${year}, ${hour12}:${minutes}:${seconds} ${ampm}`;
            }
            return dateString;
        }
        
        const [year, month, day] = datePart.split('-');
        const [hour, minute, second] = timePart.split(':');
        
        // Convert to 12-hour format
        let hours = parseInt(hour, 10);
        const minutes = minute;
        const seconds = second;
        const ampm = hours >= 12 ? 'pm' : 'am';
        const hour12 = hours % 12 || 12;
        
        // Return DD/MM/YYYY, HH:MM:SS am/pm format
        return `${day}/${month}/${year}, ${hour12}:${minutes}:${seconds} ${ampm}`;
    } catch (e) {
        console.error("Date format error:", e, "Input:", dateString);
        return dateString || 'Invalid Date';
    }
};

    const formatDateFromFilename = (filename) => {
        try {
            const match = filename.match(/audio_(\d+)/);
            if (match && match[1]) {
                const timestamp = parseInt(match[1]);
                if (!isNaN(timestamp)) {
                    return new Date(timestamp).toLocaleString();
                }
            }
        } catch (e) {
            console.log("Date parse error:", e);
        }
        return 'Recent';
    };

    // 🔥 Check if user is executor
    const isExecutor = currentUser?.role?.toLowerCase() === 'executor';
    
    // 🔥 Check if work was created by staff
    const isStaffCreated = request?.created_by && currentUser?.id && 
                          request.created_by.toString() !== currentUser.id.toString();

    if (loading) return <div style={{padding:'40px', textAlign:'center', color: '#2e7d32', marginTop: '100px'}}>Loading details...</div>;
    
    if (!request) return <div style={{padding:'40px', textAlign:'center', marginTop: '100px'}}>Work Request not found! <button onClick={() => navigate(-1)}>Go Back</button></div>;

    return (
        <div className="view-container">
            <style>{`
                * { margin: 0; padding: 0; box-sizing: border-box; }
                body { 
                    font-family: 'Segoe UI', sans-serif; 
                    background: #f1f8f1; 
                    min-height: 100vh; 
                }
                
                .container { 
                    max-width: 1000px; 
                    margin: 0 auto; 
                    padding: 30px 20px;
                    margin-top: 130px;
                }

                .card { 
                    background: white; 
                    border-radius: 20px; 
                    overflow: hidden; 
                    box-shadow: 0 10px 30px rgba(27, 94, 32, 0.15);
                    border: 1px solid #c8e6c9;
                    border-top: 6px solid #1b5e20;
                }

                .work-header { 
                    background: linear-gradient(135deg, #f8fafc 0%, #e8f5e9 100%);
                    padding: 30px; 
                    display: flex; 
                    justify-content: space-between; 
                    align-items: center;
                    border-bottom: 2px solid #a5d6a7; 
                }
                
                .work-header h1 {
                    color: #1b5e20 !important;
                }
                
                .status { 
                    padding: 8px 20px; 
                    border-radius: 30px; 
                    font-weight: 700; 
                    text-transform: uppercase; 
                    font-size: 12px; 
                    letter-spacing: 0.5px;
                    border: 1px solid;
                }
                .status-submitted { 
                    background: #fff7ed; 
                    color: #9a5e1a; 
                    border-color: #fed7aa; 
                }
                .status-approved { 
                    background: #e8f5e9; 
                    color: #1b5e20; 
                    border-color: #a5d6a7; 
                }
                .status-progress { 
                    background: #e3f2fd; 
                    color: #0d47a1; 
                    border-color: #90caf9; 
                }
                .status-completed { 
                    background: #1b5e20; 
                    color: white; 
                    border-color: #2e7d32; 
                }
                .status-rejected { 
                    background: #ffebee; 
                    color: #b71c1c; 
                    border-color: #ef9a9a; 
                }

                .content { padding: 40px; }
                
                .grid { 
                    display: grid; 
                    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); 
                    gap: 20px; 
                    margin-bottom: 30px; 
                }
                .info-box { 
                    background: #f9fbf9; 
                    padding: 20px; 
                    border-radius: 16px; 
                    border: 1px solid #c8e6c9;
                    border-left: 4px solid #2e7d32;
                    transition: transform 0.2s, box-shadow 0.2s;
                    box-shadow: 0 2px 8px rgba(46, 125, 50, 0.1);
                }
                .info-box:hover { 
                    transform: translateY(-3px); 
                    box-shadow: 0 8px 16px rgba(27, 94, 32, 0.15); 
                }
                
                .label { 
                    font-size: 11px; 
                    color: #2e7d32; 
                    font-weight: 700; 
                    text-transform: uppercase; 
                    letter-spacing: 0.5px; 
                    margin-bottom: 5px;
                }
                .value { 
                    font-size: 16px; 
                    font-weight: 600; 
                    color: #1b5e20; 
                }
                
                h3 { 
                    color: #1b5e20; 
                    font-size: 20px; 
                    margin: 25px 0 15px; 
                    font-weight: 700; 
                    display: flex; 
                    align-items: center; 
                    gap: 10px; 
                    border-bottom: 2px solid #a5d6a7;
                    padding-bottom: 10px;
                }
                
                .description { 
                    background: #e8f5e9; 
                    padding: 25px; 
                    border-radius: 16px; 
                    border: 1px solid #a5d6a7; 
                    margin-bottom: 30px; 
                    color: #1b5e20; 
                    line-height: 1.6;
                    box-shadow: inset 0 2px 4px rgba(27, 94, 32, 0.05);
                }

                /* Image Gallery Styles */
                .image-section {
                    margin: 30px 0;
                    padding: 25px;
                    background: #e8f5e9;
                    border-radius: 16px;
                    border: 2px dashed #2e7d32;
                }
                
                .image-section h3 {
                    border-bottom: none;
                    margin-top: 0;
                    padding-bottom: 0;
                }
                
                .image-container {
                    position: relative;
                    display: inline-block;
                    max-width: 100%;
                    border-radius: 12px;
                    overflow: hidden;
                    box-shadow: 0 4px 12px rgba(27, 94, 32, 0.2);
                    border: 3px solid white;
                }
                
                .work-image {
                    width: 100%;
                    height: 200px;
                    object-fit: cover;
                    border-radius: 10px;
                    cursor: pointer;
                    transition: transform 0.3s ease;
                }
                
                .work-image:hover {
                    transform: scale(1.05);
                }
                
                .image-caption {
                    margin-top: 8px;
                    font-size: 13px;
                    color: #2e7d32;
                    font-style: italic;
                    text-align: center;
                    font-weight: 500;
                }

                .image-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
                    gap: 20px;
                    margin-top: 20px;
                }

                /* Audio Section */
                .audio-section {
                    margin: 30px 0;
                    padding: 25px;
                    background: #e8f5e9;
                    border-radius: 16px;
                    border-left: 5px solid #1b5e20;
                    box-shadow: 0 4px 12px rgba(27, 94, 32, 0.1);
                }
                
                .audio-item {
                    background: white;
                    padding: 15px;
                    border-radius: 12px;
                    margin-bottom: 15px;
                    border: 1px solid #a5d6a7;
                    box-shadow: 0 2px 6px rgba(27, 94, 32, 0.05);
                }
                
                .audio-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 12px;
                }
                
                .audio-title {
                    font-weight: 700;
                    color: #1b5e20;
                    font-size: 15px;
                }
                
                .audio-date {
                    font-size: 12px;
                    color: #2e7d32;
                    background: #e8f5e9;
                    padding: 3px 10px;
                    border-radius: 20px;
                }
                
                audio {
                    width: 100%;
                    border-radius: 8px;
                }
                
                .image-modal {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(27, 94, 32, 0.95);
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    z-index: 2000;
                    cursor: pointer;
                    backdrop-filter: blur(5px);
                }
                
                .enlarged-image {
                    max-width: 90%;
                    max-height: 90%;
                    border-radius: 16px;
                    box-shadow: 0 20px 40px rgba(0,0,0,0.3);
                    border: 5px solid white;
                }

                /* Timeline Styles */
                .timeline-item { 
                    display: flex; 
                    gap: 20px; 
                    margin-bottom: 25px; 
                    position: relative; 
                    align-items: center;
                }

                .timeline-icon { 
                    width: 44px; 
                    height: 44px; 
                    background: linear-gradient(135deg, #1b5e20, #2e7d32);
                    border-radius: 50%; 
                    color: white; 
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 20px; 
                    font-weight: bold; 
                    flex-shrink: 0;
                    border: 4px solid #a5d6a7;
                    box-shadow: 0 4px 12px rgba(27, 94, 32, 0.3);
                    z-index: 2;
                }

                .timeline-content {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                    min-height: 60px;
                    background: #f9fbf9;
                    padding: 12px 20px;
                    border-radius: 12px;
                    border: 1px solid #c8e6c9;
                    box-shadow: 0 2px 6px rgba(27, 94, 32, 0.05);
                }

                .timeline-date {
                    font-size: 13px;
                    color: #2e7d32;
                    margin-bottom: 4px;
                    line-height: 1.4;
                    font-weight: 500;
                }

                .timeline-title {
                    font-weight: 700;
                    color: #1b5e20;
                    font-size: 16px;
                    line-height: 1.4;
                }

                .timeline-item:not(:last-child)::after {
                    content: ''; 
                    position: absolute; 
                    left: 21px; 
                    top: 44px; 
                    bottom: -25px; 
                    width: 3px; 
                    background: linear-gradient(to bottom, #2e7d32, #a5d6a7);
                    z-index: 1;
                    border-radius: 2px;
                }
                
                .back-btn { 
                    background: white; 
                    color: #1b5e20; 
                    border: 2px solid #1b5e20; 
                    padding: 12px 24px; 
                    border-radius: 30px; 
                    cursor: pointer; 
                    font-weight: 700; 
                    font-size: 14px;
                    transition: all 0.2s;
                    display: inline-flex;
                    align-items: center;
                    gap: 8px;
                    box-shadow: 0 2px 8px rgba(27, 94, 32, 0.1);
                }
                .back-btn:hover { 
                    background: #1b5e20; 
                    color: white;
                    transform: translateY(-2px);
                    box-shadow: 0 6px 16px rgba(27, 94, 32, 0.3);
                }

                audio::-webkit-media-controls-panel {
                    background-color: #e8f5e9;
                }
                
                audio::-webkit-media-controls-play-button {
                    background-color: #1b5e20;
                    border-radius: 50%;
                }
            `}</style>

            <Header 
                title="Work Details" 
                user={currentUser.username} 
                role={currentUser.role === 'staff' ? 'Staff Member' : currentUser.role === 'admin' ? 'Administrator' : 'Executor'} 
            />

            <div className="container">
                <div style={{marginBottom: '20px'}}>
                    <button className="back-btn" onClick={() => navigate(-1)}>
                        ← Back to Dashboard
                    </button>
                </div>

                <div className="card">
                    <div className="work-header">
                        <div>
                            <h1 style={{fontSize:'24px', fontWeight:'800'}}>Work #{request.id}</h1>
                            <div style={{color:'#2e7d32', fontWeight:'600', marginTop:'5px'}}>
                                {request.work_type} Request
                            </div>
                        </div>
                        <span className={`status ${getStatusClass(request.status)}`}>{request.status}</span>
                    </div>

                    <div className="content">
                        <div className="grid">
                            <div className="info-box">
                                <div className="label">🏢 Department</div>
                                <div className="value">{request.department}</div>
                            </div>
                            <div className="info-box">
                                <div className="label">📍 Location</div>
                                <div className="value">{request.location}</div>
                            </div>
                            <div className="info-box">
                                <div className="label">⚡ Priority</div>
                                <div className="value" style={{
                                    color: request.priority === 'high' ? '#d32f2f' : 
                                           request.priority === 'medium' ? '#f57c00' : '#2e7d32'
                                }}>
                                    {request.priority}
                                </div>
                            </div>
                            <div className="info-box">
                                <div className="label">📅 Required Date</div>
                                <div className="value">{request.required_date?.split('T')[0]}</div>
                            </div>
                        </div>

                        <h3>📝 Problem Description</h3>
                        <div className="description">
                            {request.description}
                        </div>

                        {/* 🔥 STAFF FILES - Show only if staff created this work */}
                        {isStaffCreated && (
                            <>
                                {/* Staff Photos */}
                                {request.staff_file_path && request.staff_file_path.trim() !== '' && (
                                    <div className="image-section">
                                        <h3>📸 Staff Uploaded Photos ({request.staff_file_path.split(',').filter(p => p && p.trim() !== '').length})</h3>
                                        <div className="image-grid">
                                            {request.staff_file_path.split(',').map((path, index) => {
                                                if (!path || path.trim() === '') return null;
                                                
                                                const imageUrl = getImageUrl(path);
                                                // If it's already a full URL (Cloudinary), use directly, else add localhost
                                                const fullUrl = imageUrl.startsWith('http') ? imageUrl : `http://localhost:5000${imageUrl}`;
                                                
                                                return (
                                                    <div key={index} className="image-container">
                                                        <img 
                                                            src={fullUrl}
                                                            alt={`Staff photo ${index + 1}`}
                                                            className="work-image"
                                                            onClick={() => openImageModal(fullUrl)}
                                                            onError={(e) => {
                                                                e.target.onerror = null;
                                                                e.target.src = 'https://via.placeholder.com/400x300?text=Image+Not+Found';
                                                            }}
                                                        />
                                                        <div className="image-caption">
                                                            Staff Photo {index + 1}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}

                                {/* Staff Audio */}
                                {request.staff_audio_path && request.staff_audio_path.trim() !== '' && (
                                    <div className="audio-section">
                                        <h3>🎤 Staff Voice Notes ({request.staff_audio_path.split(',').filter(p => p && p.trim() !== '').length})</h3>
                                        <div style={{ marginTop: '15px' }}>
                                            {request.staff_audio_path.split(',').map((path, index) => {
                                                if (!path || path.trim() === '') return null;
                                                const audioPath = getImageUrl(path);
                                                const audioUrl = audioPath.startsWith('http') ? audioPath : `http://localhost:5000${audioPath}`;
                                                
                                                const filename = path.split('\\').pop().split('/').pop() || '';
                                                const audioDate = formatDateFromFilename(filename);
                                                
                                                return (
                                                    <div key={index} className="audio-item">
                                                        <div className="audio-header">
                                                            <span className="audio-title">
                                                                🎵 Staff Voice Note {index + 1}
                                                            </span>
                                                            <span className="audio-date">
                                                                {audioDate}
                                                            </span>
                                                        </div>
                                                        <audio controls preload="metadata">
                                                            <source src={audioUrl} type="audio/webm" />
                                                            <source src={audioUrl} type="audio/mp4" />
                                                            <source src={audioUrl} type="audio/mpeg" />
                                                            Your browser does not support audio playback.
                                                        </audio>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                            </>
                        )}

                        {/* 🔥 EXECUTOR FILES - Show only after work is started (In Progress or Completed) */}
                        {(request.status?.toLowerCase() === 'in progress' || request.status?.toLowerCase() === 'completed') && (
                            <>
                                {/* Executor Photos */}
                                {request.executor_file_path && request.executor_file_path.trim() !== '' && (
                                    <div className="image-section">
                                        <h3>📸 Executor Uploaded Photos ({request.executor_file_path.split(',').filter(p => p && p.trim() !== '').length})</h3>
                                        <div className="image-grid">
                                            {request.executor_file_path.split(',').map((path, index) => {
                                                if (!path || path.trim() === '') return null;
                                                
                                                const imageUrl = getImageUrl(path);
                                                const fullUrl = imageUrl.startsWith('http') ? imageUrl : `http://localhost:5000${imageUrl}`;
                                                
                                                return (
                                                    <div key={index} className="image-container">
                                                        <img 
                                                            src={fullUrl}
                                                            alt={`Executor photo ${index + 1}`}
                                                            className="work-image"
                                                            onClick={() => openImageModal(fullUrl)}
                                                            onError={(e) => {
                                                                e.target.onerror = null;
                                                                e.target.src = 'https://via.placeholder.com/400x300?text=Image+Not+Found';
                                                            }}
                                                        />
                                                        <div className="image-caption">
                                                            Executor Photo {index + 1}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}

                                {/* Executor Audio */}
                                {request.executor_audio_path && request.executor_audio_path.trim() !== '' && (
                                    <div className="audio-section">
                                        <h3>🎤 Executor Voice Notes ({request.executor_audio_path.split(',').filter(p => p && p.trim() !== '').length})</h3>
                                        <div style={{ marginTop: '15px' }}>
                                            {request.executor_audio_path.split(',').map((path, index) => {
                                                if (!path || path.trim() === '') return null;
                                                
                                                const audioPath = getImageUrl(path);
                                                const audioUrl = audioPath.startsWith('http') ? audioPath : `http://localhost:5000${audioPath}`;
                                                const filename = path.split('\\').pop().split('/').pop() || '';
                                                const audioDate = formatDateFromFilename(filename);
                                                
                                                return (
                                                    <div key={index} className="audio-item">
                                                        <div className="audio-header">
                                                            <span className="audio-title">
                                                                🎵 Executor Voice Note {index + 1}
                                                            </span>
                                                            <span className="audio-date">
                                                                {audioDate}
                                                            </span>
                                                        </div>
                                                        <audio controls preload="metadata">
                                                            <source src={audioUrl} type="audio/webm" />
                                                            <source src={audioUrl} type="audio/mp4" />
                                                            <source src={audioUrl} type="audio/mpeg" />
                                                            Your browser does not support audio playback.
                                                        </audio>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                        {/* 🔥 TIMELINE SECTION - Hidden for Executors */}
                        {!isExecutor && (
                            <>
                                <h3>🕒 Activity Timeline</h3>
                                <div style={{marginTop:'20px'}}>
                                    {/* Request Submitted */}
                                    {/* Request Submitted */}
                                    <div className="timeline-item">
                                        <div className="timeline-icon">1</div>
                                        <div className="timeline-content">
                                            <div className="timeline-date">
                                                {request.created_at ? formatLocalTime(request.created_at) : 'Date N/A'}
                                            </div>
                                            <div className="timeline-title">
                                                Request Submitted
                                            </div>
                                        </div>
                                    </div>

                                    {/* Approved by Admin */}
                                    {request.approved_at && (
                                        <div className="timeline-item">
                                            <div className="timeline-icon">2</div>
                                            <div className="timeline-content">
                                                <div className="timeline-date">
                                                    {formatLocalTime(request.approved_at)}
                                                </div>
                                                <div className="timeline-title">
                                                    Approved by Admin
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Work Completed */}
                                    {request.completed_at && (
                                        <div className="timeline-item">
                                            <div className="timeline-icon">3</div>
                                            <div className="timeline-content">
                                                <div className="timeline-date">
                                                    {formatLocalTime(request.completed_at)}
                                                </div>
                                                <div className="timeline-title">
                                                    Work Completed
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Image Modal */}
            {showImage && (
                <div className="image-modal" onClick={() => setShowImage(false)}>
                    <img 
                        src={selectedImage}
                        alt="Enlarged view"
                        className="enlarged-image"
                        onClick={(e) => e.stopPropagation()}
                    />
                </div>
            )}
        </div>
    );
};

export default ViewWork;