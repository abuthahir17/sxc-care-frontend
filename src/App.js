import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';
import StaffDashboard from './pages/StaffDashboard';
import ExecutorDashboard from './pages/ExecutorDashboard';
import ViewWork from './pages/ViewWork';
import CreateWork from './pages/CreateWork'; 
import ProtectedRoute from './components/ProtectedRoute';
import CreateHallBooking from './pages/CreateHallBooking'; 

function App() {
  return (
    <Router>
      <Routes>
        {/* Public Route (Login) */}
        <Route path="/" element={<Login />} />

        {/* 🔒 Protected Admin Route */}
        <Route path="/admin" element={
          <ProtectedRoute allowedRole="admin">
            <AdminDashboard />
          </ProtectedRoute>
        } />

        {/* 🔒 Protected Staff Route */}
        <Route path="/staff" element={
          <ProtectedRoute allowedRole="staff">
            <StaffDashboard />
          </ProtectedRoute>
        } />

        {/* 🔒 Protected Executor Route */}
        <Route path="/executor" element={
          <ProtectedRoute allowedRole="executor">
            <ExecutorDashboard />
          </ProtectedRoute>
        } />

        {/* 🔒 Protected View Work Page (Any logged-in user) */}
        <Route path="/view-work" element={
          <ProtectedRoute>
             <ViewWork />
          </ProtectedRoute>
        } />
        
        {/* 🔒 (2) Protected Create Work Page (Only Staff) */}
        {/* Direct-a URL adicha ulla poga mudiyathu, Login panni thaan varanum */}
        <Route path="/create-work" element={
          <ProtectedRoute allowedRole="staff">
             <CreateWork /> 
          </ProtectedRoute>
        } />
      // Routes kulla:
      <Route path="/create-hall-booking" element={
        <ProtectedRoute allowedRole="staff">
          <CreateHallBooking /> 
        </ProtectedRoute>
      } />
      </Routes>
    </Router>
  );
}

export default App;