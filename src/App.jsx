import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Dashboard from './components/Dashboard';
import ProjectDetails from './components/ProjectDetails';
import RegisterPage from './components/RegisterPage';
import LoginPage from './components/LoginPage';
import LandingPage from './components/LandingPage';
import AddProject from './components/AddProject';
import './index.css';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/add-project" element={<AddProject />} />
        <Route path="/project/:recordId" element={<ProjectDetails />} />
      </Routes>
    </Router>
  );
}

export default App;
