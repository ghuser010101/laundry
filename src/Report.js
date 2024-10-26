// Report.js
import React from 'react';
import { Link } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';

const Report = () => {
  return (
    <div style={{ margin: 0, padding: 0 }}>
      <div className="d-flex justify-content-between align-items-center p-3" style={{ backgroundColor: '#7d7d7d', margin: 0 }}>
        <h1 className="text-white">Laundry Report</h1>
        <Link to="/" className="btn btn-light">Home</Link>
      </div>

      <div className="container mt-4 d-flex justify-content-center">
        <iframe 
          src="https://docs.google.com/forms/d/e/1FAIpQLSdzxw-jJ0rYSTQIqKhx74H2i4RDR6YKkEAeXeUE-Xj8kq374A/viewform?embedded=true" 
          width="640" 
          height="1500" 
          frameBorder="0" 
          marginHeight="0" 
          marginWidth="0"
          title="Laundry Report Form"
        >
          Loading…
        </iframe>
      </div>
    </div>
  );
};

export default Report;
