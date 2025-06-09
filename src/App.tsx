import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';

// Pages
import Dashboard from './pages/Dashboard';
import Newsletters from './pages/Newsletters';
import Settings from './pages/Settings';
import Login from './pages/Login';

// Layouts
import AppLayout from './layouts/AppLayout';

// Components
import ProtectedRoute from './components/ProtectedRoute';
import LoadingScreen from './components/LoadingScreen';

function App() {
  const { user, loading } = useAuth();

  useEffect(() => {
    document.title = 'Nigest - Newsletter Intelligence';
  }, []);

  if (loading) {
    console.log("user : ", user);
    return <LoadingScreen />;
  }

  return (
    <Routes>
      <Route path="/login" element={!user ? <Login /> : <Navigate to="/" />} />
      
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/newsletters" element={<Newsletters />} />
          <Route path="/settings" element={<Settings />} />
        </Route>
      </Route>
      
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

export default App;