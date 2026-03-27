import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import API_URL from '../config';

const CreateWork = () => {
    const navigate = useNavigate();

    // --- STATES ---
    const [files, setFiles] = useState([]);
    const [description, setDescription] = useState('');
    const [priority, setPriority] = useState('medium');
    const [showModal, setShowModal] = useState(false);
    const [workId, setWorkId] = useState(null);
    const [loading, setLoading] = useState(false);
    const [currentUser, setCurrentUser] = useState({ username: 'Staff', role: 'Staff', id: null });
    
    
    // Voice Recording States - Multiple messages
    const [voiceMessages, setVoiceMessages] = useState([]);
    const [isRecording, setIsRecording] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);
    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);
    const timerRef = useRef(null);

    // Form Data State
    const [formData, setFormData] = useState({
        department: '',
        workType: '',
        contactPerson: '',
        contactNumber: '',
        location: '',
        requiredDate: ''
    });

    // --- CHECK AUTH ---
    useEffect(() => {
        const storedUser = sessionStorage.getItem('user');
        if (!storedUser) {
            alert("Please login first!");
            navigate('/', { replace: true });
        } else {
            setCurrentUser(JSON.parse(storedUser));
        }
    }, [navigate]);

    // Cleanup timer on unmount
    useEffect(() => {
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, []);

    // --- HANDLERS ---
    const handleInputChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });
    
    // 📸 Handle Image Files
    const handleFileSelect = (e) => {
        const selectedFiles = Array.from(e.target.files);
        const validFiles = selectedFiles.filter(file => {
            if (file.size > 5 * 1024 * 1024) {
                alert(`File ${file.name} too large! Max 5MB allowed.`);
                return false;
            }
            if (!file.type.startsWith('image/')) {
                alert(`File ${file.name} is not an image. Please select images only.`);
                return false;
            }
            return true;
        });
        setFiles(prev => [...prev, ...validFiles]);
    };

    const removeFile = (fileName) => setFiles(files.filter(file => file.name !== fileName));

    const formatFileSize = (bytes) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    // 🎤 Voice Recording Functions
    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            audioChunksRef.current = [];
            
            mediaRecorder.ondataavailable = (event) => {
                audioChunksRef.current.push(event.data);
            };
            
            mediaRecorder.onstop = () => {
                const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                const url = URL.createObjectURL(blob);
                
                // Add to voice messages array
                const newMessage = {
                    id: Date.now(),
                    blob: blob,
                    url: url,
                    duration: recordingTime,
                    name: `Voice Message ${voiceMessages.length + 1}`
                };
                
                setVoiceMessages([...voiceMessages, newMessage]);
                
                // Stop all tracks
                stream.getTracks().forEach(track => track.stop());
            };
            
            mediaRecorder.start();
            setIsRecording(true);
            
            // Start timer
            setRecordingTime(0);
            timerRef.current = setInterval(() => {
                setRecordingTime(prev => prev + 1);
            }, 1000);
            
        } catch (error) {
            console.error("Recording error:", error);
            alert("❌ Could not access microphone. Please check permissions.");
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
            clearInterval(timerRef.current);
        }
    };

    const removeVoiceMessage = (id) => {
        setVoiceMessages(voiceMessages.filter(msg => msg.id !== id));
    };

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    };

    // In CreateWork.js - handleSubmit function la idha add pannu (around line 330)

// CreateWork.js la handleSubmit function la change pannu (around line 250-280)

const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const storedUser = sessionStorage.getItem('user');
    const userObj = storedUser ? JSON.parse(storedUser) : null;

    if (!userObj) {
        alert("Session Expired. Please Login Again.");
        navigate('/');
        return;
    }

    const data = new FormData();
    data.append('department', formData.department);
    data.append('workType', formData.workType);
    data.append('contactPerson', formData.contactPerson);
    data.append('contactNumber', formData.contactNumber);
    data.append('location', formData.location);
    data.append('requiredDate', formData.requiredDate);
    data.append('priority', priority);
    data.append('description', description);
    data.append('createdBy', userObj.id);
    data.append('username', userObj.username);
    data.append('isStaff', 'true');
    
    // Append image files
    files.forEach((file) => data.append('files', file));
    
    // Append all voice messages
    voiceMessages.forEach((msg, index) => {
        const audioFile = new File([msg.blob], `voice_${Date.now()}_${index}.webm`, { type: 'audio/webm' });
        data.append('audioFiles', audioFile);
    });

    try {
        const response = await fetch(`${API_URL}/api/create-work`, {
            method: 'POST',
            body: data 
        });
        
        if (response.ok) {
            const result = await response.json();
            setWorkId(result.id);
            setShowModal(true);
            
            // 🔥 Info message update pannu
            alert(`✅ Work created! Work ID: ${result.id}`);
            
        } else {
            const error = await response.json();
            alert(`Failed to submit request: ${error.error || 'Server Error'}`);
        }
    } catch (error) {
        console.error("Error:", error);
        alert("Could not connect to server.");
    } finally {
        setLoading(false);
    }
};



    return (
        <div className="create-work-wrapper">
            <style>{`
                * { margin: 0; padding: 0; box-sizing: border-box; }
                body { font-family: 'Segoe UI', sans-serif; background: #f1f8f1; }

                /* BUTTON CONTAINER */
                .top-action-bar {
                    max-width: 1000px; 
                    margin: 160px auto 0; 
                    padding: 0;
                    display: flex;
                    justify-content: flex-start;
                }

                /* BACK BUTTON */
                .back-btn-top {
                    background: transparent;
                    color: #1b5e20;
                    border: 2px solid #1b5e20;
                    padding: 10px 24px;
                    border-radius: 30px;
                    cursor: pointer;
                    font-weight: 700;
                    font-size: 14px;
                    transition: all 0.2s;
                    display: flex; 
                    align-items: center; 
                    gap: 8px;
                    box-shadow: 0 2px 8px rgba(27, 94, 32, 0.1);
                }
                .back-btn-top:hover {
                    background: #1b5e20;
                    color: white;
                    transform: translateY(-2px);
                    box-shadow: 0 6px 16px rgba(27, 94, 32, 0.3);
                }

                /* MAIN FORM CONTAINER */
                .container { 
                    max-width: 1000px; 
                    margin: 20px auto 40px; 
                    background: white; 
                    padding: 40px; 
                    border-radius: 20px; 
                    box-shadow: 0 10px 30px rgba(27, 94, 32, 0.15); 
                    border-top: 6px solid #1b5e20; 
                }

                /* PAGE TITLE */
                .page-title { 
                    margin-bottom: 35px; 
                    padding-bottom: 20px; 
                    border-bottom: 2px solid #a5d6a7; 
                }
                .page-title h1 { 
                    color: #1b5e20; 
                    font-size: 28px; 
                    margin-bottom: 8px; 
                    display: flex; 
                    align-items: center; 
                    gap: 12px; 
                    font-weight: 800; 
                    text-transform: uppercase; 
                }
                .page-title h1::before { 
                    content: "📝"; 
                    font-size: 32px; 
                }
                .page-title p { 
                    color: #2e7d32; 
                    font-size: 15px; 
                    line-height: 1.6; 
                }

                /* SECTIONS */
                .form-section { 
                    margin-bottom: 35px; 
                    background: #f9fbf9;
                    padding: 25px;
                    border-radius: 16px;
                    border: 1px solid #c8e6c9;
                }
                
                /* SECTION BAR */
                .section-title { 
                    font-size: 20px; 
                    font-weight: 700; 
                    color: #1b5e20; 
                    margin-bottom: 20px; 
                    display: flex; 
                    align-items: center; 
                    gap: 10px; 
                    border-bottom: 2px solid #a5d6a7;
                    padding-bottom: 10px;
                }
                .section-title::before { 
                    content: ""; 
                    width: 6px; 
                    height: 26px; 
                    background: #1b5e20; 
                    border-radius: 3px; 
                }

                /* FORM INPUTS */
                .row { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 24px; }
                .form-group { margin-bottom: 20px; }
                label { 
                    display: block; 
                    font-size: 13px; 
                    font-weight: 700; 
                    color: #1b5e20; 
                    margin-bottom: 8px; 
                    text-transform: uppercase; 
                    letter-spacing: 0.5px; 
                }
                .required { color: #e53e3e; margin-left: 4px; }
                
                input, select, textarea { 
                    width: 100%; 
                    padding: 14px 16px; 
                    border-radius: 12px; 
                    border: 2px solid #c8e6c9; 
                    font-size: 14px; 
                    outline: none; 
                    background: white; 
                    transition: all 0.3s ease; 
                }
                
                input:focus, select:focus, textarea:focus { 
                    border-color: #1b5e20 !important;
                    background: white !important;
                    box-shadow: 0 0 0 4px rgba(27, 94, 32, 0.15) !important;
                }

                textarea { resize: vertical; min-height: 140px; line-height: 1.6; }
                .char-count { text-align: right; font-size: 12px; color: #2e7d32; margin-top: 6px; }

                /* INFO BOX */
                .info-box { 
                    background: #e8f5e9; 
                    border-left: 6px solid #1b5e20; 
                    padding: 20px; 
                    border-radius: 12px; 
                    margin-bottom: 30px; 
                    box-shadow: 0 4px 12px rgba(27, 94, 32, 0.1);
                }
                .info-box-title { 
                    font-weight: 700; 
                    color: #1b5e20; 
                    margin-bottom: 10px; 
                    font-size: 16px;
                }
                .info-box-content ul { 
                    margin-left: 20px; 
                    font-size: 14px; 
                    color: #2e7d32; 
                }

                /* PRIORITY */
                .priority-selector { display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; }
                .priority-option input { display: none; }
                .priority-label { 
                    display: block; 
                    padding: 20px; 
                    border: 2px solid #c8e6c9; 
                    border-radius: 16px; 
                    text-align: center; 
                    cursor: pointer; 
                    transition: all 0.3s ease; 
                    background: white; 
                    box-shadow: 0 2px 8px rgba(27, 94, 32, 0.05);
                }
                .priority-label:hover { 
                    border-color: #1b5e20; 
                    background: #e8f5e9; 
                    transform: translateY(-2px);
                    box-shadow: 0 6px 16px rgba(27, 94, 32, 0.15);
                }
                
                .priority-low input:checked + .priority-label { 
                    border-color: #2e7d32; 
                    background: #e8f5e9; 
                    color: #1b5e20; 
                    font-weight: 700;
                    box-shadow: 0 4px 12px rgba(46, 125, 50, 0.2);
                }
                .priority-medium input:checked + .priority-label { 
                    border-color: #f59e0b; 
                    background: #fff3e0; 
                    color: #92400e; 
                    font-weight: 700;
                    box-shadow: 0 4px 12px rgba(245, 158, 11, 0.2);
                }
                .priority-high input:checked + .priority-label { 
                    border-color: #dc2626; 
                    background: #fee2e2; 
                    color: #991b1b; 
                    font-weight: 700;
                    box-shadow: 0 4px 12px rgba(220, 38, 38, 0.2);
                }

                /* FILE UPLOAD */
                .file-upload { 
                    border: 3px dashed #a5d6a7; 
                    border-radius: 16px; 
                    padding: 30px; 
                    text-align: center; 
                    background: #f9fbf9; 
                    cursor: pointer; 
                    transition: all 0.3s ease; 
                    display: block; 
                }
                .file-upload:hover { 
                    border-color: #1b5e20; 
                    background: #e8f5e9; 
                    transform: translateY(-2px);
                    box-shadow: 0 8px 20px rgba(27, 94, 32, 0.15);
                }
                
                .file-item { 
                    display: flex; 
                    align-items: center; 
                    justify-content: space-between; 
                    padding: 15px; 
                    background: #f9fbf9; 
                    border-radius: 12px; 
                    margin-top: 10px; 
                    border: 2px solid #c8e6c9; 
                    transition: all 0.2s;
                }
                .file-item:hover {
                    border-color: #1b5e20;
                    background: #e8f5e9;
                }
                
                .remove-file { 
                    background: #fee2e2; 
                    color: #991b1b; 
                    border: none; 
                    padding: 8px 16px; 
                    border-radius: 8px; 
                    cursor: pointer; 
                    font-size: 12px; 
                    font-weight: 700; 
                    transition: all 0.2s;
                }
                .remove-file:hover { 
                    background: #fecaca; 
                    transform: scale(1.05);
                }

                /* Voice Recording Section - Multiple Messages */
                .voice-section {
                    margin: 25px 0;
                    padding: 20px;
                    background: #ecf8ed;
                    border-radius: 16px;
                    border-left: 6px solid #1b5e20;
                }
                
                .voice-title {
                    font-size: 18px;
                    font-weight: 700;
                    color: #1b5e20;
                    margin-bottom: 15px;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                }
                
                .voice-messages-list {
                    margin-bottom: 20px;
                }
                
                .voice-message-item {
                    background: white;
                    border: 2px solid #c8e6c9;
                    border-radius: 12px;
                    padding: 15px;
                    margin-bottom: 15px;
                }
                
                .voice-message-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 10px;
                }
                
                .voice-message-title {
                    font-weight: 700;
                    color: #1b5e20;
                    font-size: 15px;
                }
                
                .voice-message-duration {
                    font-size: 12px;
                    color: #2e7d32;
                    background: #e8f5e9;
                    padding: 4px 10px;
                    border-radius: 20px;
                }
                
                .recording-controls {
                    display: flex;
                    gap: 15px;
                    align-items: center;
                    flex-wrap: wrap;
                    margin-top: 15px;
                }
                
                .record-btn {
                    padding: 14px 28px;
                    border: none;
                    border-radius: 30px;
                    font-weight: 700;
                    font-size: 15px;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    transition: all 0.2s;
                }
                
                .record-btn-start {
                    background: #1b5e20;
                    color: white;
                    box-shadow: 0 4px 12px rgba(27, 94, 32, 0.3);
                }
                
                .record-btn-start:hover {
                    background: #2e7d32;
                    transform: translateY(-2px);
                    box-shadow: 0 6px 16px rgba(27, 94, 32, 0.4);
                }
                
                .record-btn-stop {
                    background: #d32f2f;
                    color: white;
                    box-shadow: 0 4px 12px rgba(211, 47, 47, 0.3);
                    animation: pulse 1.5s infinite;
                }
                
                .record-btn-stop:hover {
                    background: #f44336;
                    transform: translateY(-2px);
                }
                
                .record-btn-add {
                    background: white;
                    color: #1b5e20;
                    border: 2px solid #1b5e20;
                    box-shadow: 0 4px 12px rgba(27, 94, 32, 0.1);
                }
                
                .record-btn-add:hover {
                    background: #e8f5e9;
                    transform: translateY(-2px);
                }
                
                .record-btn-remove {
                    background: #fee2e2;
                    color: #991b1b;
                    border: 2px solid #fecaca;
                    padding: 8px 16px;
                    font-size: 13px;
                }
                
                .record-btn-remove:hover {
                    background: #fecaca;
                }
                
                .recording-timer {
                    font-size: 24px;
                    font-weight: 700;
                    color: #1b5e20;
                    background: white;
                    padding: 8px 16px;
                    border-radius: 30px;
                    border: 2px solid #a5d6a7;
                }
                
                .audio-player {
                    width: 100%;
                    margin-top: 10px;
                }
                
                @keyframes pulse {
                    0% { transform: scale(1); }
                    50% { transform: scale(1.05); }
                    100% { transform: scale(1); }
                }

                /* Upload Section Titles */
                .upload-title {
                    font-size: 16px;
                    font-weight: 700;
                    color: #1b5e20;
                    margin-bottom: 10px;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }
                .upload-title span {
                    font-size: 20px;
                }

                /* ACTIONS */
                .actions { 
                    margin-top: 40px; 
                    padding-top: 30px; 
                    border-top: 2px solid #a5d6a7; 
                    display: flex; 
                    gap: 15px; 
                }
                .btn { 
                    padding: 16px 32px; 
                    border: none; 
                    border-radius: 30px; 
                    cursor: pointer; 
                    font-size: 16px; 
                    font-weight: 700; 
                    display: inline-flex; 
                    align-items: center; 
                    gap: 10px; 
                    transition: all 0.2s; 
                }
                .btn:hover { 
                    transform: translateY(-3px); 
                }
                .submit-btn { 
                    background: linear-gradient(135deg, #1b5e20 0%, #2e7d32 100%); 
                    color: white; 
                    box-shadow: 0 8px 20px rgba(27, 94, 32, 0.3); 
                }
                .draft-btn { 
                    background: white; 
                    color: #1b5e20; 
                    border: 2px solid #1b5e20; 
                }
                
                /* MODAL */
                .modal-overlay { 
                    position: fixed; 
                    top: 0; 
                    left: 0; 
                    width: 100%; 
                    height: 100%; 
                    background: rgba(27, 94, 32, 0.95); 
                    backdrop-filter: blur(5px); 
                    display: flex; 
                    justify-content: center; 
                    align-items: center; 
                    z-index: 1000; 
                }
                .modal-content { 
                    background: white; 
                    padding: 40px; 
                    border-radius: 24px; 
                    width: 90%; 
                    max-width: 500px; 
                    text-align: center; 
                    animation: slideDown 0.3s ease; 
                    box-shadow: 0 20px 60px rgba(0,0,0,0.3); 
                    border-top: 8px solid #1b5e20; 
                }
                @keyframes slideDown { 
                    from { transform: translateY(-30px); opacity: 0; } 
                    to { transform: translateY(0); opacity: 1; } 
                }
                
                @media (max-width: 768px) { 
                    .row { grid-template-columns: 1fr; } 
                    .actions { flex-direction: column; } 
                    .btn { width: 100%; justify-content: center; } 
                }
            `}</style>

            <Header 
                title="Create Request" 
                user={currentUser.username} 
                role={currentUser.role === 'admin' ? 'Administrator' : 'Staff Member'} 
            />

            {/* BACK BUTTON */}
            <div className="top-action-bar">
                <button className="back-btn-top" onClick={() => navigate('/staff')}>
                    ← Back to Dashboard
                </button>
            </div>

            {/* MAIN FORM CONTAINER */}
            <div className="container">
                <div className="page-title">
                    <h1>Create Work Request</h1>
                    <p>Fill out the form below to submit a new work request.</p>
                </div>

               
                <div className="info-box">
                    <div className="info-box-title">📋 Submission Guidelines</div>
                    <div className="info-box-content">
                        <ul>
                            <li>All fields marked with <span style={{color: '#e53e3e'}}>*</span> are required</li>
                            <li>Images will be saved in: <strong>D:\WM_DATABASE\yourname\WORK_ID\IMAGE\</strong></li>
                            <li>Voice messages will be saved in: <strong>D:\WM_DATABASE\yourname\WORK_ID\AUDIO\</strong></li>
                            <li>Max file size: Images 5MB, Voice messages 10MB</li>
                        </ul>
                    </div>
                </div>
                <form onSubmit={handleSubmit}>
                    {/* SECTION 1: BASIC INFO */}
                    <div className="form-section">
                        <div className="section-title">Basic Information</div>
                        <div className="row">
                            <div className="form-group">
                                <label>Department <span className="required">*</span></label>
                                <select name="department" value={formData.department} onChange={handleInputChange} required>
                                    <option value="">Select Department</option>
                                    <option value="Computer Science">Computer Science(Shift-1)</option>
                                    <option value="Computer Science">Computer Science(Shift-2)</option>
                                    <option value="Office">Data Science</option>
                                    <option value="Maintenance">Computer Application</option>
                                    <option value="Office">BBA</option>
                                    <option value="Office">Tamil</option>
                                    <option value="Office">English</option>
                                    <option value="Computer Science">Artificial Intellience</option>
                                    <option value="Office">Zoology</option>
                                    <option value="Maintenance">Goverment Programme</option>
                                    <option value="Office">Goverment Exam</option>
                                    <option value="Maintenance">Jesuit</option>
                                    <option value="Computer Science">Common</option>
                                    <option value="Maintenance">Other</option>
                                    
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Work Type <span className="required">*</span></label>
                                <select name="workType" value={formData.workType} onChange={handleInputChange} required>
                                    <option value="">Select Work Type</option>
                                    <option value="Electrical">Electrical</option>
                                    <option value="Plumbing">Plumbing</option>
                                    <option value="Networking">Networking</option>
                                    <option value="Computer">Computer / IT Related</option>
                                    <option value="Stationary">Stationary</option>
                                    <option value="Laboratory">Laboratory</option>
                                </select>
                            </div>
                        </div>

                        <div className="row">
                            <div className="form-group">
                                <label>Contact Person <span className="required">*</span></label>
                                <input type="text" name="contactPerson" placeholder="Your Name" value={formData.contactPerson} onChange={handleInputChange} required />
                            </div>
                            <div className="form-group">
                                <label>Contact Number <span className="required">*</span></label>
                                <input type="text" name="contactNumber" placeholder="Phone Number" value={formData.contactNumber} onChange={handleInputChange} required />
                            </div>
                        </div>

                        <div className="row">
                            <div className="form-group">
                                <label>Location/Room Number <span className="required">*</span></label>
                                <input type="text" name="location" placeholder="e.g., Room 301, CS Dept" value={formData.location} onChange={handleInputChange} required />
                            </div>
                            <div className="form-group">
                                <label>Required Date <span className="required">*</span></label>
                                <input type="date" name="requiredDate" value={formData.requiredDate} onChange={handleInputChange} required min={new Date().toISOString().split('T')[0]} />
                            </div>
                        </div>
                    </div>

                    {/* SECTION 2: PRIORITY */}
                    <div className="form-section">
                        <div className="section-title">Priority Level</div>
                        <div className="priority-selector">
                            <div className="priority-option priority-low">
                                <input type="radio" id="p-low" name="priority" checked={priority === 'low'} onChange={() => setPriority('low')} />
                                <label htmlFor="p-low" className="priority-label">
                                    <div style={{fontSize: '32px', marginBottom: '8px'}}>🟢</div>
                                    <div style={{fontWeight: 700}}>Low</div>
                                </label>
                            </div>
                            <div className="priority-option priority-medium">
                                <input type="radio" id="p-medium" name="priority" checked={priority === 'medium'} onChange={() => setPriority('medium')} />
                                <label htmlFor="p-medium" className="priority-label">
                                    <div style={{fontSize: '32px', marginBottom: '8px'}}>🟡</div>
                                    <div style={{fontWeight: 700}}>Medium</div>
                                </label>
                            </div>
                            <div className="priority-option priority-high">
                                <input type="radio" id="p-high" name="priority" checked={priority === 'high'} onChange={() => setPriority('high')} />
                                <label htmlFor="p-high" className="priority-label">
                                    <div style={{fontSize: '32px', marginBottom: '8px'}}>🔴</div>
                                    <div style={{fontWeight: 700}}>High</div>
                                </label>
                            </div>
                        </div>
                    </div>

                    {/* SECTION 3: DESCRIPTION */}
                    <div className="form-section">
                        <div className="section-title">Work Description</div>
                        <div className="form-group">
                            <label>Detailed Description <span className="required">*</span></label>
                            <textarea 
                                placeholder="Describe the work in detail..." 
                                required 
                                maxLength="1000"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                            ></textarea>
                            <div className="char-count">
                                {description.length} / 1000 characters
                            </div>
                        </div>
                    </div>

                    {/* SECTION 4: VOICE MESSAGES - MULTIPLE */}
                    {/* SECTION 4: VOICE MESSAGES - SIMPLIFIED */}
                    <div className="form-section">
                        <div className="section-title">🎤 Voice Messages</div>
                        <div className="voice-section">
                            <div className="voice-title">
                                <span>🎵</span> Add voice messages (Optional)
                            </div>
                            
                            {/* List of recorded messages */}
                            {voiceMessages.length > 0 && (
                                <div className="voice-messages-list">
                                    {voiceMessages.map((msg, index) => (
                                        <div key={msg.id} className="voice-message-item">
                                            <div className="voice-message-header">
                                                <span className="voice-message-title">
                                                    Voice Message {index + 1}
                                                </span>
                                                <span className="voice-message-duration">
                                                    {formatTime(msg.duration)}
                                                </span>
                                            </div>
                                            <audio controls className="audio-player" src={msg.url} />
                                            <div style={{marginTop: '10px', display: 'flex', justifyContent: 'flex-end', gap: '10px'}}>
                                                <button 
                                                    type="button" 
                                                    className="record-btn record-btn-remove"
                                                    onClick={() => removeVoiceMessage(msg.id)}
                                                >
                                                    <span>🗑️</span> Remove
                                                </button>
                                                {index === voiceMessages.length - 1 && (
                                                    <button 
                                                        type="button" 
                                                        className="record-btn record-btn-add"
                                                        onClick={startRecording}
                                                    >
                                                        <span>➕</span> Add Another
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                            
                            {/* Only show Start Recording if no messages */}
                            {voiceMessages.length === 0 && (
                                <div className="recording-controls">
                                    <button 
                                        type="button" 
                                        className="record-btn record-btn-start"
                                        onClick={startRecording}
                                    >
                                        <span style={{fontSize: '20px'}}>🎤</span>
                                        Start Recording
                                    </button>
                                </div>
                            )}
                            
                            {/* Recording indicator - only shows when recording */}
                            {isRecording && (
                                <div className="recording-controls">
                                    <button 
                                        type="button" 
                                        className="record-btn record-btn-stop"
                                        onClick={stopRecording}
                                    >
                                        <span style={{fontSize: '20px'}}>⏹️</span>
                                        Stop Recording
                                    </button>
                                    <span className="recording-timer">
                                        {formatTime(recordingTime)}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* SECTION 5: IMAGE FILES */}
                    <div className="form-section">
                        <div className="section-title">📸 Image Attachments</div>
                        <div className="upload-section">
                            <div className="upload-title">
                                <span>📷</span> Upload Images (Optional)
                            </div>
                            <label className="file-upload">
                                <div style={{fontSize: '48px', marginBottom: '12px', color: '#1b5e20'}}>📸</div>
                                <div style={{fontWeight: 700, color: '#1b5e20', fontSize: '16px'}}>Click to upload images</div>
                                <div style={{fontSize: '13px', color: '#2e7d32', marginTop: '8px'}}>JPG, PNG (Max 5MB each)</div>
                                <input type="file" multiple accept=".jpg,.jpeg,.png,.gif" onChange={handleFileSelect} style={{display: 'none'}} />
                            </label>
                            
                            <div style={{marginTop: '15px'}}>
                                {files.map((file, index) => (
                                    <div key={index} className="file-item">
                                        <div style={{display: 'flex', alignItems: 'center', gap: '12px'}}>
                                            <div style={{fontSize: '28px'}}>📸</div>
                                            <div>
                                                <div style={{fontSize: '14px', fontWeight: 700, color:'#1b5e20'}}>{file.name}</div>
                                                <div style={{fontSize: '12px', color: '#2e7d32'}}>{formatFileSize(file.size)}</div>
                                            </div>
                                        </div>
                                        <button type="button" className="remove-file" onClick={() => removeFile(file.name)}>Remove</button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* ACTIONS */}
                    <div className="actions">
                        <button type="submit" className="btn submit-btn" disabled={loading}>
                            {loading ? '⏳ Submitting...' : '✓ Submit Request'}
                        </button>
                        <button type="button" className="btn draft-btn" onClick={() => navigate('/staff')}>
                            Cancel
                        </button>
                    </div>
                </form>
            </div>

            {/* SUCCESS MODAL */}
            {showModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div style={{fontSize: '72px', marginBottom: '20px', color: '#1b5e20'}}>✅</div>
                        <h2 style={{color: '#1b5e20', marginBottom: '12px', fontWeight: 800}}>Request Submitted!</h2>
                        <p style={{color: '#2e7d32', marginBottom: '25px', fontSize: '16px'}}>
                            Your work request has been sent for approval.
                        </p>
                        <div style={{
                            background: '#e8f5e9', 
                            padding: '16px', 
                            borderRadius: '12px', 
                            color: '#1b5e20', 
                            fontWeight: 'bold', 
                            fontSize: '20px', 
                            marginBottom: '30px', 
                            border: '2px solid #a5d6a7'
                        }}>
                            Work ID: #{workId}
                        </div>
                        <div style={{display: 'flex', gap: '12px', justifyContent: 'center'}}>
                            <button className="btn submit-btn" onClick={() => navigate('/staff')}>
                                View My Requests
                            </button>
                            <button 
                                className="btn draft-btn" 
                                onClick={() => { 
                                    setShowModal(false); 
                                    setDescription(''); 
                                    setFiles([]); 
                                    setVoiceMessages([]);
                                    setFormData({
                                        department: '',
                                        workType: '',
                                        contactPerson: '',
                                        contactNumber: '',
                                        location: '',
                                        requiredDate: ''
                                    });
                                }}
                            >
                                Create Another
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CreateWork;