import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import ComplaintsList from './pages/ComplaintsList';
import ComplaintForm from './pages/ComplaintForm';
import ComplaintDetail from './pages/ComplaintDetail';
import EightDForm from './pages/EightDForm';
import Layout from './components/Layout';

function PrivateRoute({ children }) {
  const { currentUser } = useAuth();
  return currentUser ? children : <Navigate to="/login" />;
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <ToastContainer position="top-right" autoClose={3000} />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={
            <PrivateRoute>
              <Layout>
                <Dashboard />
              </Layout>
            </PrivateRoute>
          } />
          <Route path="/complaints" element={
            <PrivateRoute>
              <Layout>
                <ComplaintsList />
              </Layout>
            </PrivateRoute>
          } />
          <Route path="/complaints/new" element={
            <PrivateRoute>
              <Layout>
                <ComplaintForm />
              </Layout>
            </PrivateRoute>
          } />
          <Route path="/complaints/:id" element={
            <PrivateRoute>
              <Layout>
                <ComplaintDetail />
              </Layout>
            </PrivateRoute>
          } />
          <Route path="/complaints/:id/8d" element={
            <PrivateRoute>
              <Layout>
                <EightDForm />
              </Layout>
            </PrivateRoute>
          } />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
