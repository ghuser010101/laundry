import React from 'react';
import { HashRouter as Router, Route, Routes } from 'react-router-dom';
import Admin from './Admin';
import MainComponent from './MainComponent';
import Report from './Report';

function App() {
  return (
    <Router>  {/* No need for basename with HashRouter */}
      <Routes>
        <Route path="/" element={<MainComponent />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/report" element={<Report />} />
      </Routes>
    </Router>
  );
}

export default App;
