import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Admin from './Admin';
import MainComponent from './MainComponent';
import Report from './Report';  // Import the Report component

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<MainComponent />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/report" element={<Report />} />  {/* Add the new route */}
      </Routes>
    </Router>
  );
}

export default App;
