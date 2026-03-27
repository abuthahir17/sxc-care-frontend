import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import API_URL from '../config';


const CreateHallBooking = () => {
    const navigate = useNavigate();

    // --- STATES ---
    const [showModal, setShowModal] = useState(false);
    const [bookingId, setBookingId] = useState(null);
    const [loading, setLoading] = useState(false);
    const [checkingConflict, setCheckingConflict] = useState(false);
    const [conflictError, setConflictError] = useState('');
    const [currentUser, setCurrentUser] = useState({ username: 'Staff', role: 'Staff' });

    // 🔴 NEW: Payment Popup States
    const [showPaymentPopup, setShowPaymentPopup] = useState(false);
    const [tempSelectedHall, setTempSelectedHall] = useState('');

    // College Hall List
    const collegeHalls = [
        "Loyala Hall",
        "MCA Seminar Hall",
        "Fr. Caussanel Hall",
        "Fr. Louis Xavier Hall",
        "Lebeau Auditorium",
        "Pope Auditorium",
        "Fr. Peter Paradhesi Hall"
    ];

    // Form Data State
    const [formData, setFormData] = useState({
        department: '',
        programme: '',
        hallName: '',
        bookingDate: '',
        timeFrom: '',
        timeTo: '',
        contactPerson: '',
        contactNumber: ''
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

    // --- CHECK FOR CONFLICTS (Real-time) ---
    const checkForConflicts = async () => {
        const { hallName, bookingDate, timeFrom, timeTo } = formData;
        
        if (!hallName || !bookingDate || !timeFrom || !timeTo) {
            return false;
        }

        setCheckingConflict(true);
        setConflictError('');

        try {
            console.log("Checking availability...");
            const response = await fetch(`${API_URL}/api/check-hall-availability`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    hallName,
                    bookingDate,
                    timeFrom,
                    timeTo
                })
            });

            if (!response.ok) {
                // If endpoint doesn't exist, skip conflict check
                console.warn("Conflict check endpoint not available, skipping...");
                setCheckingConflict(false);
                return false;
            }

            const data = await response.json();
            console.log("Availability response:", data);

            if (data.conflict) {
                setConflictError(`This hall is already booked from ${data.existingBooking.timeFrom} to ${data.existingBooking.timeTo} for "${data.existingBooking.programme}". Please choose different time.`);
                return true; // Conflict exists
            }
            return false; // No conflict
        } catch (error) {
            console.error("Error checking conflicts:", error);
            // Don't block submission if conflict check fails
            return false;
        } finally {
            setCheckingConflict(false);
        }
    };
    // Auto-check when hall, date or time changes
    useEffect(() => {
        const delayDebounce = setTimeout(() => {
            if (formData.hallName && formData.bookingDate && formData.timeFrom && formData.timeTo) {
                checkForConflicts();
            }
        }, 800); // Wait 800ms after user stops typing

        return () => clearTimeout(delayDebounce);
    }, [formData.hallName, formData.bookingDate, formData.timeFrom, formData.timeTo]);

    // 🔴 NEW: Handle Hall Selection with Payment Popup
    const handleHallChange = (e) => {
        const hallValue = e.target.value;
        
        // Check if it's Fr. Peter Paradhesi Hall
        if (hallValue === "Fr. Peter Paradhesi Hall") {
            setTempSelectedHall(hallValue);
            setShowPaymentPopup(true);
        } else {
            // For other halls, directly set
            setFormData({ ...formData, hallName: hallValue });
        }
        setConflictError('');
    };

    // 🔴 NEW: Handle Payment Popup Confirm
    const handlePaymentConfirm = () => {
        setFormData({ ...formData, hallName: tempSelectedHall });
        setShowPaymentPopup(false);
        setTempSelectedHall('');
    };

    // 🔴 NEW: Handle Payment Popup Cancel
    const handlePaymentCancel = () => {
        setShowPaymentPopup(false);
        setTempSelectedHall('');
        // Reset the select dropdown
        setFormData({ ...formData, hallName: '' });
    };
    // --- HANDLERS ---
    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        // Clear conflict error when user changes any field
        setConflictError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Final conflict check before submit
        const hasConflict = await checkForConflicts();
        if (hasConflict) {
            return; // Stop submission if conflict exists
        }

        setLoading(true);

        const storedUser = sessionStorage.getItem('user');
        const userObj = storedUser ? JSON.parse(storedUser) : null;

        if (!userObj) {
            alert("Session Expired. Please Login Again.");
            navigate('/');
            return;
        }

        // Prepare Payload with status = 'pending'
        const payload = {
            ...formData,
            createdBy: userObj.id,
            status: 'pending' // New bookings are always pending
        };

        try {
            const response = await fetch(`${API_URL}/api/hall-booking`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                const result = await response.json();
                setBookingId(result.id);
                setShowModal(true);
            } else {
                const error = await response.json();
                if (error.conflict) {
                    setConflictError(error.message);
                } else {
                    alert("Failed to submit booking request.");
                }
            }
        } catch (error) {
            console.error("Error:", error);
            alert("Server Error. Ensure Backend is running!");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="hall-booking-wrapper">
            <style>{`
                * { margin: 0; padding: 0; box-sizing: border-box; }
                body { font-family: 'Segoe UI', sans-serif; background: #f1f8f1; }

                .top-action-bar {
                    max-width: 1000px; 
                    margin: 160px auto 0;
                    padding: 0;
                    display: flex;
                    justify-content: flex-start;
                }

                .back-btn-top {
                    background: transparent;
                    color: #1b5e20;
                    border: 1px solid #1b5e20;
                    padding: 8px 20px;
                    border-radius: 6px;
                    cursor: pointer;
                    font-weight: 600;
                    font-size: 14px;
                    transition: all 0.2s;
                    display: flex; align-items: center; gap: 8px;
                }
                .back-btn-top:hover {
                    background: #1b5e20;
                    color: white;
                }

                .container { 
                    max-width: 1000px; 
                    margin: 20px auto 40px; 
                    background: white; 
                    padding: 40px; 
                    border-radius: 16px; 
                    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05); 
                    border-top: 5px solid #1b5e20;
                }

                .page-title { margin-bottom: 35px; padding-bottom: 20px; border-bottom: 2px solid #f1f5f9; }
                .page-title h1 { color: #1b5e20; font-size: 28px; margin-bottom: 8px; display: flex; align-items: center; gap: 12px; font-weight: 800; text-transform: uppercase; }
                .page-title h1::before { content: "🏛️"; font-size: 32px; }
                .page-title p { color: #64748b; font-size: 15px; line-height: 1.6; }

                .form-section { margin-bottom: 35px; }
                
                .section-title { font-size: 18px; font-weight: 700; color: #1e293b; margin-bottom: 20px; display: flex; align-items: center; gap: 10px; }
                .section-title::before { 
                    content: ""; 
                    width: 4px; 
                    height: 24px; 
                    background: #22c55e; 
                    border-radius: 2px; 
                }

                .row { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 24px; }
                .form-group { margin-bottom: 24px; }
                label { display: block; font-size: 13px; font-weight: 700; color: #4a5568; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.5px; }
                .required { color: #e53e3e; margin-left: 4px; }
                
                input, select { 
                    width: 100%; 
                    padding: 14px 16px; 
                    border-radius: 10px; 
                    border: 1px solid #cbd5e0; 
                    font-size: 14px; 
                    outline: none; 
                    background: #fff; 
                    transition: all 0.3s ease; 
                }
                
                input:focus, select:focus { 
                    border-color: #1b5e20 !important; 
                    border-width: 2px !important;
                    background: white !important;
                    box-shadow: 0 0 0 4px rgba(27, 94, 32, 0.1) !important; 
                }

                /* Conflict Warning */
                .conflict-warning {
                    background: #fee2e2;
                    border: 1px solid #ef4444;
                    color: #991b1b;
                    padding: 16px;
                    border-radius: 10px;
                    margin: 20px 0;
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    font-size: 14px;
                    font-weight: 500;
                }
                .conflict-warning::before {
                    content: "⚠️";
                    font-size: 20px;
                }
                                /* 🔴 NEW: Payment Popup Styles */
                .payment-popup-overlay {
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
                .payment-popup {
                    background: white;
                    padding: 40px;
                    border-radius: 16px;
                    width: 90%;
                    max-width: 450px;
                    text-align: center;
                    animation: slideDown 0.3s ease;
                    box-shadow: 0 20px 60px rgba(0,0,0,0.3);
                    border-top: 6px solid #f9b43d;
                }
                .payment-amount {
                    font-size: 48px;
                    font-weight: 800;
                    color: #1b5e20;
                    margin: 20px 0;
                    background: #f0fdf4;
                    padding: 20px;
                    border-radius: 12px;
                    border: 2px solid #86efac;
                }
                .payment-amount small {
                    font-size: 16px;
                    font-weight: normal;
                    color: #166534;
                }
                .payment-buttons {
                    display: flex;
                    gap: 15px;
                    justify-content: center;
                    margin-top: 30px;
                }
                .payment-btn {
                    padding: 15px 30px;
                    border: none;
                    border-radius: 10px;
                    font-size: 16px;
                    font-weight: 700;
                    cursor: pointer;
                    transition: transform 0.2s;
                    flex: 1;
                }
                .payment-btn:hover {
                    transform: translateY(-2px);
                }
                .payment-btn-confirm {
                    background: #1b5e20;
                    color: white;
                }
                .payment-btn-cancel {
                    background: #fee2e2;
                    color: #991b1b;
                    border: 1px solid #fecaca;
                }
                .hall-warning-icon {
                    font-size: 48px;
                    margin-bottom: 15px;
                }

                .checking-badge {
                    font-size: 13px;
                    color: #64748b;
                    margin-top: 5px;
                    display: flex;
                    align-items: center;
                    gap: 5px;
                }
                .spinner-small {
                    width: 14px;
                    height: 14px;
                    border: 2px solid #e2e8f0;
                    border-top-color: #1b5e20;
                    border-radius: 50%;
                    animation: spin 0.6s linear infinite;
                }
                @keyframes spin { to { transform: rotate(360deg); } }

                .status-badge {
                    display: inline-block;
                    padding: 4px 10px;
                    border-radius: 20px;
                    font-size: 12px;
                    font-weight: 600;
                    margin-left: 10px;
                }
                .status-pending { background: #fef9c3; color: #854d0e; }
                .status-approved { background: #dcfce7; color: #166534; }
                .status-rejected { background: #fee2e2; color: #991b1b; }

                .actions { margin-top: 40px; padding-top: 30px; border-top: 1px solid #e2e8f0; display: flex; gap: 15px; }
                .btn { padding: 15px 32px; border: none; border-radius: 10px; cursor: pointer; font-size: 15px; font-weight: 700; display: inline-flex; align-items: center; gap: 8px; transition: transform 0.2s; }
                .btn:hover { transform: translateY(-2px); }
                .btn:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }
                
                .submit-btn { background: linear-gradient(135deg, #1b5e20 0%, #2e7d32 100%); color: white; box-shadow: 0 4px 15px rgba(27, 94, 32, 0.3); }
                .draft-btn { background: white; color: #4a5568; border: 1px solid #cbd5e0; }
                .cancel-btn { background: white; color: #dc2626; border: 1px solid #dc2626; }

                .modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.6); backdrop-filter: blur(4px); display: flex; justify-content: center; align-items: center; z-index: 1000; }
                .modal-content { background: white; padding: 40px; border-radius: 16px; width: 90%; max-width: 500px; text-align: center; animation: slideDown 0.3s ease; box-shadow: 0 20px 60px rgba(0,0,0,0.3); border-top: 6px solid #1b5e20; }
                @keyframes slideDown { from { transform: translateY(-30px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
            `}</style>

            <Header title="Hall Booking" user={currentUser.username} role={currentUser.role === 'admin' ? 'Administrator' : 'Staff Member'} />

            <div className="top-action-bar">
                <button className="back-btn-top" onClick={() => navigate('/staff')}>
                    ← Back to Dashboard
                </button>
            </div>

            <div className="container">
                <div className="page-title">
                    <h1>Hall Booking Request</h1>
                    <p>Submit a request to book a seminar hall or auditorium for events.</p>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="form-section">
                        <div className="section-title">Basic Information</div>
                        <div className="row">
                            <div className="form-group">
                                <label>Department <span className="required">*</span></label>
                                <select name="department" value={formData.department} onChange={handleInputChange} required>
                                    <option value="">Select Department</option>
                                    <option value="CS">Computer Science</option>
                                    <option value="Physics">Physics</option>
                                    <option value="Maths">Maths</option>
                                    <option value="English">English</option>
                                    <option value="Commerce">Commerce</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Programme Name <span className="required">*</span></label>
                                <input type="text" name="programme" placeholder="e.g. Guest Lecture, Symposium" value={formData.programme} onChange={handleInputChange} required />
                            </div>
                        </div>

                        <div className="row">
                            <div className="form-group">
                                <label>Select Hall/Room <span className="required">*</span></label>
                                <select name="hallName" value={formData.hallName} onChange={handleHallChange} required>
                                    <option value="">-- Choose Hall --</option>
                                    {collegeHalls.map((hall, index) => (
                                        <option key={index} value={hall}>
                                            {hall} {hall === "Fr. Peter Paradhesi Hall" ? " (₹10,000 Booking Fee)" : ""}
                                        </option>
                                    ))}
                                </select>
                                {/* 🔴 NEW: Show info for premium hall */}
                                {formData.hallName === "Fr. Peter Paradhesi Hall" && (
                                    <div style={{marginTop: '8px', fontSize: '12px', color: '#854d0e', background: '#fef9c3', padding: '4px 8px', borderRadius: '4px'}}>
                                        ⭐ Premium Hall - ₹10,000 booking fee applies
                                    </div>
                                )}
                            </div>
                            <div className="form-group">
                                <label>Required Date <span className="required">*</span></label>
                                <input 
                                    type="date" 
                                    name="bookingDate" 
                                    value={formData.bookingDate} 
                                    onChange={handleInputChange} 
                                    required 
                                    min={new Date().toISOString().split('T')[0]}// 👈 MIN ATTRIBUTE REMOVED - Now any date can be selected
                                />
                            </div>
                        </div>

                        <div className="row">
                            <div className="form-group">
                                <label>Time From <span className="required">*</span></label>
                                <input type="time" name="timeFrom" value={formData.timeFrom} onChange={handleInputChange} required />
                            </div>
                            <div className="form-group">
                                <label>Time To <span className="required">*</span></label>
                                <input type="time" name="timeTo" value={formData.timeTo} onChange={handleInputChange} required />
                            </div>
                        </div>

                        {/* Conflict Checker Status */}
                        {checkingConflict && (
                            <div className="checking-badge">
                                <span className="spinner-small"></span>
                                Checking availability...
                            </div>
                        )}

                        {/* Conflict Error Message */}
                        {conflictError && (
                            <div className="conflict-warning">
                                {conflictError}
                            </div>
                        )}

                        {/* Status Note */}
                        <div style={{ marginTop: '10px', padding: '10px', background: '#f8fafc', borderRadius: '8px', fontSize: '13px', color: '#64748b' }}>
                            <span style={{ fontWeight: 600 }}>Note:</span> All bookings require secretary approval. 
                            <span className="status-badge status-pending">Pending</span> → 
                            <span className="status-badge status-approved">Approved</span> or 
                            <span className="status-badge status-rejected">Rejected</span>
                        </div>
                    </div>

                    <div className="form-section">
                        <div className="section-title">Contact Details</div>
                        <div className="row">
                            <div className="form-group">
                                <label>Contact Person <span className="required">*</span></label>
                                <input type="text" name="contactPerson" placeholder="Your Name" value={formData.contactPerson} onChange={handleInputChange} required />
                            </div>
                            <div className="form-group">
                                <label>Contact Number <span className="required">*</span></label>
                                <input type="text" name="contactNumber" placeholder="Mobile Number" value={formData.contactNumber} onChange={handleInputChange} required />
                            </div>
                        </div>
                    </div>

                    <div className="actions">
                        <button 
                            type="submit" 
                            className="btn submit-btn" 
                            disabled={loading || checkingConflict || conflictError}
                        >
                            {loading ? 'Submitting...' : '✓ Submit Request'}
                        </button>
                        <button type="button" className="btn draft-btn" onClick={() => alert('Draft Saved!')}>💾 Save as Draft</button>
                        <button type="button" className="btn cancel-btn" onClick={() => navigate('/staff')}>Cancel</button>
                    </div>
                </form>
            </div>
                        {/* 🔴 NEW: Payment Popup for Fr. Peter Paradhesi Hall */}
            {showPaymentPopup && (
                <div className="payment-popup-overlay">
                    <div className="payment-popup">
                        <div className="hall-warning-icon">🏛️💰</div>
                        <h2 style={{color: '#1b5e20', marginBottom: '10px'}}>Premium Hall Booking</h2>
                        <p style={{color: '#4b5563', marginBottom: '20px'}}>
                            You have selected <strong>Fr. Peter Paradhesi Hall</strong>
                        </p>
                        <div className="payment-amount">
                            ₹10,000 <small>Booking Fee</small>
                        </div>
                        <p style={{color: '#6b7280', fontSize: '14px', marginBottom: '20px'}}>
                            This is a premium hall with AC and advanced facilities. 
                            A booking fee of ₹10,000 is required.
                        </p>
                        <div className="payment-buttons">
                            <button 
                                className="payment-btn payment-btn-confirm"
                                onClick={handlePaymentConfirm}
                            >
                                ✅ OK, Proceed
                            </button>
                            <button 
                                className="payment-btn payment-btn-cancel"
                                onClick={handlePaymentCancel}
                            >
                                ❌ Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Success Modal */}
            {showModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div style={{fontSize: '64px', marginBottom: '20px', color: '#16a34a'}}>✅</div>
                        <h2 style={{color: '#1b5e20', marginBottom: '12px', fontWeight: 800}}>Request Submitted!</h2>
                        <p style={{color: '#64748b', marginBottom: '25px'}}>
                            Your hall booking request has been submitted for secretary approval.
                            <br />
                            <span className="status-badge status-pending" style={{ marginTop: '10px' }}>Pending Approval</span>
                        </p>
                        <div style={{background: '#f0fdf4', padding: '12px', borderRadius: '8px', color: '#15803d', fontWeight: 'bold', fontSize: '18px', marginBottom: '30px', border: '1px solid #dcfce7'}}>
                            Booking ID: #{bookingId}
                        </div>
                        <div style={{display: 'flex', gap: '12px', justifyContent: 'center'}}>
                            <button className="btn submit-btn" onClick={() => navigate('/staff')}>Go to Dashboard</button>
                            <button className="btn draft-btn" onClick={() => { 
                                setShowModal(false); 
                                setFormData({
                                    department:'', 
                                    programme:'', 
                                    hallName:'', 
                                    bookingDate:'', 
                                    timeFrom:'', 
                                    timeTo:'', 
                                    contactPerson:'', 
                                    contactNumber:''
                                });
                                setConflictError('');
                            }}>Book Another</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CreateHallBooking;