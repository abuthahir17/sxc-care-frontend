import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import API_URL from '../config';  

const ExecutorDashboard = () => {
    const navigate = useNavigate();
    const [requests, setRequests] = useState([]);
    const [activeTab, setActiveTab] = useState('All');
    const [currentUser, setCurrentUser] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [recordingId, setRecordingId] = useState(null);
    const [isRecording, setIsRecording] = useState(false);
    const [expandedWork, setExpandedWork] = useState(null);
    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);
    

    useEffect(() => {
        const storedUser = sessionStorage.getItem('user');
        if (!storedUser) {
            navigate('/', { replace: true }); 
            return;
        }

        window.history.pushState(null, document.title, window.location.href);
        window.addEventListener('popstate', function (event) {
            window.history.pushState(null, document.title, window.location.href);
        });
        
        const userObj = JSON.parse(storedUser);
        setCurrentUser(userObj);
        fetchRequests(userObj.id); 
        
        const interval = setInterval(() => fetchRequests(userObj.id), 5000);
        return () => clearInterval(interval);

    }, [navigate]);
    const fetchRequests = (userId) => {
        fetch(`${API_URL}/api/work-requests`)
            .then(res => res.json())
            .then(data => {
                console.log("All requests:", data);
                console.log("Current User ID:", userId);
                
                const myWork = data.filter(r => {
                    const dbAssignedTo = r.assigned_to ? String(r.assigned_to).trim() : "null";
                    const loginUserId = userId ? String(userId).trim() : "false";
                    const isIdMatch = dbAssignedTo === loginUserId;

                    const status = r.status ? r.status.toLowerCase().trim() : "";
                    const excludedStatuses = ['pending', 'rejected'];
                    const isStatusValid = !excludedStatuses.includes(status);

                    return isIdMatch && isStatusValid;
                }); 
                
                console.log("Filtered Work:", myWork);
                setRequests(myWork);
            })
            .catch(err => console.error("Error fetching data:", err));
    };

    // 📸 Upload Photo
    const uploadPhoto = async (workId, file) => {
    setUploading(true);
    const formData = new FormData();
    formData.append('photo', file);
    
    try {
        const response = await fetch(`${API_URL}/api/work-requests/${workId}/upload-photo`, {
            method: 'POST',
            headers: {
                'username': currentUser.username
            },
            body: formData
        });
        
        if (response.ok) {
            alert(`✅ Photo uploaded to WORK_${workId} folder!`);
            fetchRequests(currentUser.id);
        } else {
            const error = await response.json();
            alert(`❌ Upload failed: ${error.error || 'Unknown error'}`);
        }
    } catch (error) {
        console.error("Error:", error);
        alert("❌ Server Error. Check backend.");
    } finally {
        setUploading(false);
    }
};

    // 🎤 Upload Audio
    const uploadAudio = async (workId, audioBlob) => {
    setUploading(true);
    const formData = new FormData();
    
    const audioFile = new File([audioBlob], `audio_${Date.now()}.webm`, { type: 'audio/webm' });
    formData.append('audio', audioFile);
    
    try {
        const response = await fetch(`${API_URL}/api/work-requests/${workId}/upload-audio`, {
            method: 'POST',
            headers: {
                'username': currentUser.username
            },
            body: formData
        });
        
        if (response.ok) {
            alert(`✅ Audio uploaded to WORK_${workId} folder!`);
            setRecordingId(null);
            setIsRecording(false);
            fetchRequests(currentUser.id);
        } else {
            const error = await response.json();
            alert(`❌ Upload failed: ${error.error || 'Unknown error'}`);
        }
    } catch (error) {
        console.error("Upload error:", error);
        alert("❌ Server Error. Check console for details.");
    } finally {
        setUploading(false);
    }
};

    // ✅ Complete Work
    const completeWork = async (workId) => {
        if (!window.confirm("Are you sure you want to mark this work as COMPLETED?")) return;
        
        try {
            const response = await fetch(`${API_URL}/api/work-requests/${workId}/complete`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' }
            });
            
            if (response.ok) {
                alert(`✅ Work marked as completed!`);
                fetchRequests(currentUser.id);
            } else {
                alert(`❌ Failed to complete work`);
            }
        } catch (error) {
            console.error("Error:", error);
            alert("❌ Server Error");
        }
    };

    // Handle Upload Photo Click
    const handleUploadPhoto = (workId) => {
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = 'image/*';
        fileInput.multiple = true;
        
        fileInput.onchange = (e) => {
            const files = Array.from(e.target.files);
            files.forEach(file => {
                if (file.size > 5 * 1024 * 1024) {
                    alert(`File ${file.name} too large! Max 5MB allowed.`);
                    return;
                }
                if (!file.type.startsWith('image/')) {
                    alert(`Please select an image file`);
                    return;
                }
                uploadPhoto(workId, file);
            });
        };
        
        fileInput.click();
    };

    // 🎤 Start Recording
    const startRecording = async (workId) => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            audioChunksRef.current = [];
            
            mediaRecorder.ondataavailable = (event) => {
                audioChunksRef.current.push(event.data);
            };
            
            mediaRecorder.onstop = () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                uploadAudio(workId, audioBlob);
                stream.getTracks().forEach(track => track.stop());
            };
            
            mediaRecorder.start();
            setIsRecording(true);
            setRecordingId(workId);
            
        } catch (error) {
            console.error("Recording error:", error);
            alert("❌ Could not access microphone. Please check permissions.");
        }
    };

    // ⏹️ Stop Recording
    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
        }
    };

    const handleAction = async (action, id) => {
        if (action === 'Upload Photo') {
            handleUploadPhoto(id);
        } else if (action === 'Record Audio') {
            if (isRecording && recordingId === id) {
                stopRecording();
            } else {
                startRecording(id);
            }
        } else if (action === 'Complete') {
            completeWork(id);
        } else if (action === 'Start') {
            try {
                const response = await fetch(`${API_URL}/api/work-requests/${id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ status: 'in progress' })
                });
                if (response.ok) {
                    fetchRequests(currentUser.id);
                }
            } catch (error) {
                console.error("Error:", error);
            }
        }
    };

    const getStatusClass = (status) => {
        if (!status) return '';
        const s = status.toLowerCase();
        if (s === 'approved') return 'assigned'; 
        if (s === 'in progress') return 'progress';
        if (s === 'completed') return 'completed';
        return '';
    };

    const getFilteredRequests = () => {
        if (activeTab === 'All') return requests;
        if (activeTab === 'Assigned') return requests.filter(r => r.status?.toLowerCase() === 'approved');
        if (activeTab === 'In Progress') return requests.filter(r => r.status?.toLowerCase() === 'in progress');
        if (activeTab === 'Completed') return requests.filter(r => r.status?.toLowerCase() === 'completed');
        return requests;
    };

    const toggleTimeline = (workId) => {
        setExpandedWork(expandedWork === workId ? null : workId);
    };

    const stats = {
        total: requests.length,
        assigned: requests.filter(r => r.status?.toLowerCase() === 'approved').length,
        inProgress: requests.filter(r => r.status?.toLowerCase() === 'in progress').length,
        completed: requests.filter(r => r.status?.toLowerCase() === 'completed').length
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        try {
            return new Date(dateString).toLocaleString();
        } catch {
            return 'Invalid Date';
        }
    };

    return (
        <div className="exec-container">
            <style>{`
                * { margin: 0; padding: 0; box-sizing: border-box; }
                body { font-family: 'Segoe UI', sans-serif; background: #f1f8f1; min-height: 100vh; }
                
                .container { 
                    max-width: 1300px; 
                    margin: auto; 
                    padding: 30px 20px;
                    margin-top: 130px; 
                }
                
                .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px; }
                .stat-card { 
                    background: white; 
                    padding: 25px; 
                    border-radius: 12px; 
                    border: 1px solid #d5e6d5;
                    box-shadow: 0 4px 6px rgba(0,0,0,0.02);
                    border-bottom: 4px solid #1b5e20;
                }
                .stat-card h3 { font-size: 13px; color: #4a7c4a; text-transform: uppercase; margin-bottom: 10px; font-weight: 700; letter-spacing: 0.5px; }
                .stat-card .number { font-size: 32px; font-weight: 800; color: #1b5e20; }

                .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px; }
                .title { color: #1b5e20; font-size: 26px; font-weight: 800; text-transform: uppercase; }
                
                .tab-btn { 
                    padding: 10px 20px; 
                    border-radius: 8px; 
                    border: 1px solid #c8e6c9; 
                    background: white; 
                    color: #2e7d32; 
                    cursor: pointer; 
                    margin-left: 10px; 
                    font-weight: 600; 
                    transition: 0.3s;
                }
                .tab-btn.active { 
                    background: #1b5e20; 
                    color: white; 
                    border-color: #1b5e20;
                    box-shadow: 0 4px 6px rgba(27, 94, 32, 0.2);
                }

                .work-card { 
                    background: white; 
                    border-radius: 16px; 
                    padding: 30px; 
                    margin-bottom: 20px; 
                    border: 1px solid #e0eee0;
                    box-shadow: 0 4px 10px rgba(27, 94, 32, 0.05);
                    border-top: 5px solid #1b5e20; 
                    transition: all 0.3s ease;
                }
                
                .work-header { 
                    display: flex; 
                    justify-content: space-between; 
                    margin-bottom: 20px; 
                    border-bottom: 1px solid #f1f8f1; 
                    padding-bottom: 20px; 
                    cursor: pointer;
                }
                
                .work-icon { 
                    width: 50px; 
                    height: 50px; 
                    border-radius: 12px; 
                    background: #e8f5e9; 
                    color: #2e7d32; 
                    display: flex; 
                    align-items: center; 
                    justify-content: center; 
                    font-size: 24px; 
                    margin-right: 15px; 
                }
                
                .status { 
                    padding: 8px 18px; 
                    border-radius: 20px; 
                    font-size: 11px; 
                    font-weight: 700; 
                    text-transform: uppercase; 
                }
                
                .assigned { background: #e8f5e9; color: #2e7d32; border: 1px solid #a5d6a7; }
                .progress { background: #81c784; color: #1b5e20; border: 1px solid #4caf50; }
                .completed { background: #1b5e20; color: #ffffff; border: 1px solid #2e7d32; }

                .details-grid { 
                    display: grid; 
                    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); 
                    gap: 20px; 
                    margin-bottom: 25px; 
                }
                
                .detail-item { 
                    padding: 15px; 
                    background: #f9fbf9; 
                    border-radius: 12px; 
                    border-left: 4px solid #a5d6a7; 
                }
                .detail-item div:first-child { 
                    font-size: 12px; 
                    color: #618a61; 
                    text-transform: uppercase; 
                    margin-bottom: 5px; 
                    font-weight: 600;
                }
                .detail-item b { color: #1b5e20; }
                
                .description-box { 
                    background: #f1f8f1; 
                    padding: 20px; 
                    border-radius: 12px; 
                    margin-bottom: 25px; 
                    border-left: 4px solid #1b5e20; 
                }

                /* Timeline Styles */
                .timeline-container {
                    margin: 20px 0;
                    padding: 20px;
                    background: #f9fbf9;
                    border-radius: 12px;
                    border: 1px solid #c8e6c9;
                }
                
                .timeline-title {
                    font-size: 16px;
                    font-weight: 700;
                    color: #1b5e20;
                    margin-bottom: 15px;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }
                
                .timeline-item { 
                    display: flex; 
                    gap: 15px; 
                    margin-bottom: 15px; 
                    position: relative; 
                    align-items: flex-start;
                }

                .timeline-icon { 
                    width: 36px; 
                    height: 36px; 
                    background: linear-gradient(135deg, #1b5e20, #2e7d32);
                    border-radius: 50%; 
                    color: white; 
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 14px; 
                    font-weight: bold; 
                    flex-shrink: 0;
                    border: 2px solid #a5d6a7;
                    box-shadow: 0 2px 8px rgba(27, 94, 32, 0.2);
                    z-index: 2;
                }

                .timeline-content {
                    flex: 1;
                    background: white;
                    padding: 12px 15px;
                    border-radius: 10px;
                    border: 1px solid #c8e6c9;
                }

                .timeline-date {
                    font-size: 12px;
                    color: #2e7d32;
                    margin-bottom: 4px;
                    font-weight: 500;
                }

                .timeline-event {
                    font-weight: 600;
                    color: #1b5e20;
                    font-size: 14px;
                }

                .timeline-item:not(:last-child)::after {
                    content: ''; 
                    position: absolute; 
                    left: 17px; 
                    top: 36px; 
                    bottom: -15px; 
                    width: 2px; 
                    background: linear-gradient(to bottom, #2e7d32, #a5d6a7);
                    z-index: 1;
                }
                
                .actions { 
                    display: grid; 
                    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); 
                    gap: 15px; 
                    background: #f9fbf9; 
                    padding: 20px; 
                    border-radius: 12px; 
                    border: 1px solid #e8f5e9; 
                    margin-top: 20px;
                }
                
                .btn { 
                    padding: 14px; 
                    border-radius: 12px; 
                    border: none; 
                    cursor: pointer; 
                    font-weight: 700; 
                    color: white; 
                    display: flex; 
                    align-items: center; 
                    justify-content: center; 
                    gap: 8px; 
                    transition: 0.2s; 
                }
                .btn:hover:not(:disabled) { 
                    transform: translateY(-2px); 
                    opacity: 0.9; 
                }
                .btn:disabled { 
                    opacity: 0.5; 
                    cursor: not-allowed; 
                }
                
                .start-btn { background: #4caf50; }
                .upload-btn { background: #2e7d32; }
                .audio-btn { background: #7b1fa2; }
                .recording-btn { background: #d32f2f; animation: pulse 1.5s infinite; }
                .complete-btn { background: #1b5e20; }
                
                @keyframes pulse {
                    0% { transform: scale(1); }
                    50% { transform: scale(1.05); }
                    100% { transform: scale(1); }
                }
                
                /* File indicators */
                .file-section {
                    margin: 20px 0;
                }
                
                .file-section-title {
                    font-size: 14px;
                    font-weight: 700;
                    color: #1b5e20;
                    margin-bottom: 12px;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    padding-bottom: 5px;
                    border-bottom: 1px solid #c8e6c9;
                }
                
                .file-indicators {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 12px;
                }
                
                .file-badge {
                    padding: 8px 18px;
                    border-radius: 30px;
                    font-size: 13px;
                    font-weight: 600;
                    display: inline-flex;
                    align-items: center;
                    gap: 8px;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.05);
                }
                
                /* Staff files (from request) */
                .staff-file-badge { 
                    background: #e8f5e9; 
                    color: #1b5e20; 
                    border: 1px solid #a5d6a7;
                }
                
                /* Executor files (your uploads) */
                .executor-photo-badge { 
                    background: #e3f2fd; 
                    color: #1565c0; 
                    border: 1px solid #90caf9;
                }
                
                .executor-audio-badge { 
                    background: #f3e5f5; 
                    color: #7b1fa2; 
                    border: 1px solid #ba68c8;
                }

                .view-details-btn {
                    background: white;
                    color: #1b5e20;
                    border: 2px solid #1b5e20;
                    padding: 10px 24px;
                    border-radius: 30px;
                    font-weight: 600;
                    font-size: 14px;
                    cursor: pointer;
                    display: inline-flex;
                    align-items: center;
                    gap: 8px;
                    transition: all 0.2s;
                    margin: 15px 0;
                }
                
                .view-details-btn:hover {
                    background: #1b5e20;
                    color: white;
                    transform: translateY(-2px);
                    box-shadow: 0 4px 12px rgba(27, 94, 32, 0.2);
                }

                .empty-state {
                    color: #618a61;
                    text-align: center;
                    margin-top: 50px;
                    font-size: 18px;
                    font-weight: 600;
                }

                .hide-timeline-btn {
                    background: transparent;
                    color: #1b5e20;
                    border: 1px solid #1b5e20;
                    padding: 6px 16px;
                    border-radius: 20px;
                    font-size: 12px;
                    font-weight: 600;
                    cursor: pointer;
                    display: inline-flex;
                    align-items: center;
                    gap: 5px;
                    transition: all 0.2s;
                }
                
                .hide-timeline-btn:hover {
                    background: #1b5e20;
                    color: white;
                }
            `}</style>

            <Header 
                title="Executor Dashboard" 
                user={currentUser ? currentUser.username : "Technician"} 
                role="Maintenance Dept" 
            />

            <div className="container">
                <div className="stats-grid">
                    <div className="stat-card">
                        <h3>Total Works</h3>
                        <div className="number">{stats.total}</div>
                    </div>
                    <div className="stat-card">
                        <h3>Assigned</h3>
                        <div className="number">{stats.assigned}</div>
                    </div>
                    <div className="stat-card">
                        <h3>In Progress</h3>
                        <div className="number">{stats.inProgress}</div>
                    </div>
                    <div className="stat-card">
                        <h3>Completed</h3>
                        <div className="number">{stats.completed}</div>
                    </div>
                </div>

                <div className="page-header">
                    <div className="title">Work Assignment</div>
                    <div>
                        {['All', 'Assigned', 'In Progress', 'Completed'].map(t => (
                            <button 
                                key={t} 
                                className={`tab-btn ${activeTab === t ? 'active' : ''}`} 
                                onClick={() => setActiveTab(t)}
                            >{t}</button>
                        ))}
                    </div>
                </div>

                {getFilteredRequests().length === 0 ? (
                    <div className="empty-state">
                        No work requests found for this status.
                    </div>
                ) : (
                    getFilteredRequests().map(req => {
                        // 🔥 FIXED: Show files based on work status and who uploaded
                        const isStaffCreated = req.created_by && req.created_by.toString() !== currentUser?.id?.toString();

                        let staffPhotoCount = 0;
                        let staffAudioCount = 0;
                        let executorPhotoCount = 0;
                        let executorAudioCount = 0;

                        // Staff files (always show if staff created)
                        if (isStaffCreated) {
                            staffPhotoCount = req.staff_file_path ? req.staff_file_path.split(',').filter(p => p && p.trim() !== '').length : 0;
                            staffAudioCount = req.staff_audio_path ? req.staff_audio_path.split(',').filter(p => p && p.trim() !== '').length : 0;
                        }

                        // Executor files - SHOW ONLY AFTER WORK IS STARTED (In Progress or Completed)
                        const workStarted = req.status?.toLowerCase() === 'in progress' || req.status?.toLowerCase() === 'completed';
                        if (workStarted) {
                            executorPhotoCount = req.executor_file_path ? req.executor_file_path.split(',').filter(p => p && p.trim() !== '').length : 0;
                            executorAudioCount = req.executor_audio_path ? req.executor_audio_path.split(',').filter(p => p && p.trim() !== '').length : 0;
                        }
                        return (
                            <div key={req.id} className="work-card">
                                <div className="work-header" onClick={() => toggleTimeline(req.id)}>
                                    <div style={{display:'flex', alignItems:'center'}}>
                                        <div className="work-icon">🛠️</div>
                                        <div>
                                            <div style={{fontWeight:800, color:'#1b5e20', fontSize:'20px'}}>
                                                Work ID #{req.id}
                                            </div>
                                            <div style={{color:'#618a61', fontSize:'14px', fontWeight:600}}>
                                                {req.work_type} Work
                                            </div>
                                        </div>
                                    </div>
                                    <span className={`status ${getStatusClass(req.status)}`}>
                                        {req.status?.toLowerCase() === 'approved' ? 'Assigned' : req.status}
                                    </span>
                                </div>

                                <div className="details-grid">
                                    <div className="detail-item">
                                        <div>📍 Location</div>
                                        <b>{req.location}</b>
                                    </div>
                                    <div className="detail-item">
                                        <div>⚡ Priority</div>
                                        <b style={{
                                            color: req.priority === 'high' ? '#d32f2f' : 
                                                   req.priority === 'medium' ? '#f57c00' : '#2e7d32'
                                        }}>
                                            {req.priority}
                                        </b>
                                    </div>
                                    <div className="detail-item">
                                        <div>📅 Required Date</div>
                                        <b>{req.required_date ? req.required_date.split('T')[0] : 'N/A'}</b>
                                    </div>
                                </div>

                                <div className="description-box">
                                    <div style={{fontSize:'12px', color:'#4a7c4a', textTransform:'uppercase', marginBottom:'5px'}}>
                                        📝 Task Description
                                    </div>
                                    <b style={{color: '#1b5e20'}}>{req.description}</b>
                                </div>

                                {/* VIEW DETAILS BUTTON */}
                                <button 
                                    className="view-details-btn"
                                    onClick={() => navigate('/view-work', { state: { id: req.id } })}
                                >
                                    <span>🔍</span> View Full Details
                                </button>

                                {/* REQUEST ATTACHMENTS - Staff files (GREEN) - Always show if staff created */}
                                {isStaffCreated && (staffPhotoCount > 0 || staffAudioCount > 0) && (
                                    <div className="file-section">
                                        <div className="file-section-title">
                                            <span>📎</span> Request Attachments:
                                        </div>
                                        <div className="file-indicators">
                                            {staffPhotoCount > 0 && (
                                                <span className="file-badge staff-file-badge">
                                                    <span>📸</span>
                                                    {staffPhotoCount} Photo{staffPhotoCount > 1 ? 's' : ''}
                                                </span>
                                            )}
                                            {staffAudioCount > 0 && (
                                                <span className="file-badge staff-file-badge">
                                                    <span>🎤</span>
                                                    {staffAudioCount} Audio Note{staffAudioCount > 1 ? 's' : ''}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* YOUR UPLOADS - Executor files (BLUE/PURPLE) - Show ONLY AFTER WORK STARTED */}
                                {req.status?.toLowerCase() !== 'approved' && (executorPhotoCount > 0 || executorAudioCount > 0) && (
                                    <div className="file-section">
                                        <div className="file-section-title">
                                            <span>📤</span> Your Uploads:
                                        </div>
                                        <div className="file-indicators">
                                            {executorPhotoCount > 0 && (
                                                <span className="file-badge executor-photo-badge">
                                                    <span>📸</span>
                                                    {executorPhotoCount} Photo{executorPhotoCount > 1 ? 's' : ''}
                                                </span>
                                            )}
                                            {executorAudioCount > 0 && (
                                                <span className="file-badge executor-audio-badge">
                                                    <span>🎤</span>
                                                    {executorAudioCount} Audio Note{executorAudioCount > 1 ? 's' : ''}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* TIMELINE SECTION */}
                                {expandedWork === req.id && (
                                    <div className="timeline-container">
                                        <div className="timeline-title">
                                            <span>📋</span> Activity Timeline
                                        </div>
                                        
                                        {/* Submitted */}
                                        <div className="timeline-item">
                                            <div className="timeline-icon">📝</div>
                                            <div className="timeline-content">
                                                <div className="timeline-date">
                                                    {formatDate(req.created_at)}
                                                </div>
                                                <div className="timeline-event">
                                                    Request Submitted
                                                </div>
                                            </div>
                                        </div>

                                        {/* Approved */}
                                        {req.approved_at && (
                                            <div className="timeline-item">
                                                <div className="timeline-icon">✓</div>
                                                <div className="timeline-content">
                                                    <div className="timeline-date">
                                                        {formatDate(req.approved_at)}
                                                    </div>
                                                    <div className="timeline-event">
                                                        Approved by Admin
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* Started */}
                                        {req.status?.toLowerCase() === 'in progress' && (
                                            <div className="timeline-item">
                                                <div className="timeline-icon">▶️</div>
                                                <div className="timeline-content">
                                                    <div className="timeline-date">
                                                        {formatDate(new Date())}
                                                    </div>
                                                    <div className="timeline-event">
                                                        Work Started
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* Completed */}
                                        {req.completed_at && (
                                            <div className="timeline-item">
                                                <div className="timeline-icon">✅</div>
                                                <div className="timeline-content">
                                                    <div className="timeline-date">
                                                        {formatDate(req.completed_at)}
                                                    </div>
                                                    <div className="timeline-event">
                                                        Work Completed
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                        
                                        {/* Hide Timeline Button */}
                                        <div style={{ textAlign: 'center', marginTop: '15px' }}>
                                            <button 
                                                className="hide-timeline-btn"
                                                onClick={() => toggleTimeline(req.id)}
                                            >
                                                <span>▲</span> Hide Timeline
                                            </button>
                                        </div>
                                    </div>
                                )}

                                <div className="actions">
                                    {req.status?.toLowerCase() === 'approved' && (
                                        <button 
                                            className="btn start-btn" 
                                            onClick={() => handleAction('Start', req.id)}
                                            disabled={uploading}
                                        >▶️ Start Work</button>
                                    )}
                                    
                                    {req.status?.toLowerCase() === 'in progress' && (
                                        <>
                                            <button 
                                                className="btn upload-btn" 
                                                onClick={() => handleAction('Upload Photo', req.id)}
                                                disabled={uploading}
                                            >
                                                {uploading ? '⏳ Uploading...' : '📷 Upload Photo'}
                                            </button>
                                            <button 
                                                className={`btn ${isRecording && recordingId === req.id ? 'recording-btn' : 'audio-btn'}`}
                                                onClick={() => handleAction('Record Audio', req.id)}
                                                disabled={uploading}
                                            >
                                                {isRecording && recordingId === req.id ? '⏹️ Stop Recording' : '🎤 Add Voice Note'}
                                            </button>
                                            <button 
                                                className="btn complete-btn" 
                                                onClick={() => handleAction('Complete', req.id)}
                                                disabled={uploading}
                                            >✅ Complete Work</button>
                                        </>
                                    )}

                                    {req.status?.toLowerCase() === 'completed' && (
                                        <div style={{textAlign: 'center', width: '100%', color: '#1b5e20', fontWeight: 'bold', fontSize: '18px'}}>
                                            ✨ Work Successfully Completed
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
};

export default ExecutorDashboard;