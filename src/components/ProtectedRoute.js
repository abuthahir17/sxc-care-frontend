import React from 'react';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children, allowedRole }) => {
    // ✅ புதிய கோட்:
    const storedUser = sessionStorage.getItem('user'); // localStorage வேண்டாம்
    const user = storedUser ? JSON.parse(storedUser) : null;
    
    // ... மீதி எல்லாம் same code ...

    // 1. User Login panni irukkana? Illana Login page ku po.
    if (!user) {
        return <Navigate to="/" replace />;
    }

    // 2. Role Check (Ex: Admin page-kulla Staff vara koodathu)
    // allowedRole irunthu, user role match aagalana veliya po.
    if (allowedRole && user.role.toLowerCase() !== allowedRole.toLowerCase()) {
        // Role thappu na, avanga sontha dashboard ke anuppidalam
        const redirectPath = user.role === 'admin' ? '/admin' : (user.role === 'staff' ? '/staff' : '/executor');
        return <Navigate to={redirectPath} replace />;
    }

    // 3. Ellam Correct na, Page-a kaattu
    return children;
};

export default ProtectedRoute;