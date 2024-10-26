import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Admin from './Admin';
import MainComponent from './MainComponent';
import Report from './Report';  // Import the Report component

function App() {
  return (
    <Router basename="/laundry">  {/* Set the basename for GitHub Pages */}
      <Routes>
        <Route path="/" element={<MainComponent />} />
        <Route path="/admin" element={<Admin />} />  {/* Corrected path */}
        <Route path="/report" element={<Report />} />  {/* Corrected path */}
      </Routes>
    </Router>
  );
}

export default App;
