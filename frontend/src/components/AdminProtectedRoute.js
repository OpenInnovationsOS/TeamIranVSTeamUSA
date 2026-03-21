import React from 'react';
import { useAuthStore } from '../stores/authStore';
import AdminDashboard from './AdminDashboard';

const AdminProtectedRoute = () => {
  const { isAdmin } = useAuthStore();

  if (!isAdmin()) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 100%)',
        color: 'white',
        textAlign: 'center',
        padding: '20px'
      }}>
        <div>
          <h1 style={{ fontSize: '2rem', marginBottom: '1rem' }}>🚫 Access Denied</h1>
          <p style={{ color: 'rgba(255, 255, 255, 0.6)', marginBottom: '2rem' }}>
            You don't have permission to access this area.
          </p>
          <button
            onClick={() => window.history.back()}
            style={{
              padding: '12px 24px',
              background: '#0088cc',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '16px'
            }}
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return <AdminDashboard />;
};

export default AdminProtectedRoute;
