import React, { useEffect, useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { getDatabase, ref, onValue, remove, set } from 'firebase/database';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { Link } from 'react-router-dom';

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAf_63WyzFQXnR2DJ9i4Aw6NrnW7JCkO6k",
  authDomain: "laundry-c5236.firebaseapp.com",
  databaseURL: "https://laundry-c5236-default-rtdb.asia-southeast1.firebasedatabase.app/",
  projectId: "laundry-c5236",
  storageBucket: "laundry-47ce6.appspot.com",
  messagingSenderId: "318389532626",
  appId: "YOUR_APP_ID"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);

function AdminComponent() {
  const [completedQueue, setCompletedQueue] = useState({});
  const [phoneNumbers, setPhoneNumbers] = useState({});
  const [performanceData, setPerformanceData] = useState([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    const storedAuth = localStorage.getItem('isAuthenticated');
    if (storedAuth === 'true') {
      setIsAuthenticated(true);
    }
  }, []);

  const handleLogin = () => {
    signInWithEmailAndPassword(auth, email, password)
      .then(() => {
        setIsAuthenticated(true);
        localStorage.setItem('isAuthenticated', 'true');
      })
      .catch((error) => {
        alert('Authentication failed: ' + error.message);
      });
  };

  const handleLogout = () => {
    signOut(auth).then(() => {
      setIsAuthenticated(false);
      setEmail('');
      setPassword('');
      localStorage.removeItem('isAuthenticated');
    });
  };

  useEffect(() => {
    if (!isAuthenticated) return;

    const completedQueueRef = ref(db, 'completedQueue');
    const phoneNumbersRef = ref(db, 'phoneNumbers');

    const unsubscribeCompletedQueue = onValue(completedQueueRef, (snapshot) => {
      const data = snapshot.val();
      setCompletedQueue(data || {});
    });

    const unsubscribePhoneNumbers = onValue(phoneNumbersRef, (snapshot) => {
      const data = snapshot.val();
      setPhoneNumbers(data || {});
    });

    return () => {
      unsubscribeCompletedQueue();
      unsubscribePhoneNumbers();
    };
  }, [isAuthenticated]);

  const calculatePerformance = () => {
    const totalCompleted = Object.keys(completedQueue).length;
    const totalInQueue = Object.keys(phoneNumbers).length;

    setPerformanceData([
      { label: 'Washing', value: totalCompleted },
      { label: 'In Queue', value: totalInQueue },
    ]);
  };

  useEffect(() => {
    if (!isAuthenticated) return;

    const interval = setInterval(() => {
      calculatePerformance();
    }, 1000);

    return () => clearInterval(interval);
  }, [completedQueue, phoneNumbers, isAuthenticated]);

  const handleDeletePhoneNumber = (id) => {
    const phoneNumberRef = ref(db, `phoneNumbers/${id}`);
    const timerRef = ref(db, 'washingTimer');

    remove(phoneNumberRef)
      .then(() => {
        return set(timerRef, 1);
      })
      .catch((error) => {
        console.error("Error deleting phone number:", error);
      });
  };

  const handleDeleteCompletedQueue = (id) => {
    const completedQueueRef = ref(db, `completedQueue/${id}`);

    remove(completedQueueRef)
      .catch((error) => {
        console.error("Error deleting completed queue item:", error);
      });
  };

  const handleReset = () => {
    const timerRef = ref(db, 'washingTimer');
    set(timerRef, 1)
      .then(() => {
        console.log("Washing timer reset to 1");
      })
      .catch((error) => {
        console.error("Error resetting washing timer:", error);
      });
  };

  const chartData = {
    labels: performanceData.map(data => data.label),
    datasets: [
      {
        label: 'Machine Performance',
        data: performanceData.map(data => data.value),
        backgroundColor: ['#28a745', '#ffc107'],
      },
    ],
  };

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
  };

  if (!isAuthenticated) {
    return (
      <div style={styles.loginContainer}>
        <h2>Admin Login</h2>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="form-control mb-2"
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="form-control mb-2"
        />
        <button onClick={handleLogin} className="btn btn-primary">Login</button>
      </div>
    );
  }

  return (
    <div style={{ ...styles.adminContainer, backgroundColor: 'white' }}>
      <div style={styles.header}>
        <h1 className="mb-0">Admin Panel</h1>
        <div>
          <Link to="/" className="btn btn-info me-2">Home</Link>
          <button onClick={handleLogout} className="btn btn-secondary">Logout</button>
        </div>
      </div>

      <div style={styles.content}>
        <p>This is the admin panel where you can manage washing queue and settings.</p>

        {/* Reset Button */}
        <button className="btn btn-warning mb-3" onClick={handleReset}>Reset Timer</button>

        <div style={styles.phoneNumbersBox}>
          <h5>Current Phone Numbers:</h5>
          <ul className="list-group">
            {Object.entries(phoneNumbers).map(([id, value], index) => (
              <li className="list-group-item d-flex justify-content-between align-items-center" key={id}>
                {index + 1}. {value}
                <button className="btn btn-danger btn-sm" onClick={() => handleDeletePhoneNumber(id)}>
                  Delete
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div style={styles.chartContainer}>
          <h5>Machine Performance</h5>
          {performanceData.length > 0 ? (
            <Bar data={chartData} options={{ responsive: true }} />
          ) : (
            <p>No data available</p>
          )}
        </div>

        <div style={styles.completedQueueBox}>
          <h5>Currently Washing:</h5>
          <ul className="list-group text-center">
            {Object.entries(completedQueue).map(([id, value], index) => (
              <li className="list-group-item d-flex justify-content-between align-items-center" key={id}>
                {index + 1}. {value}
                <button className="btn btn-danger btn-sm" onClick={() => handleDeleteCompletedQueue(id)}>
                  Delete
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div style={styles.darkModeToggle}>
          <button onClick={toggleDarkMode} className="btn btn-light">
            {/* {isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'} */}
          </button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  adminContainer: {
    padding: '0', // No padding to ensure full width
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    minHeight: '100vh',
    backgroundColor: 'white', // Full white background
  },
  header: {
    width: '100%', // Full width
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'gray',
    color: 'white',
    padding: '10px 20px',
    position: 'absolute',
    top: 0,
  },
  content: {
    marginTop: '70px', // Space for header
    width: '100%',
    maxWidth: '1200px',
    padding: '20px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  completedQueueBox: {
    marginTop: '20px',
    padding: '20px',
    border: '1px solid #007bff',
    borderRadius: '5px',
    width: '100%',
    maxWidth: '600px',
  },
  phoneNumbersBox: {
    marginTop: '20px',
    padding: '20px',
    border: '1px solid #28a745',
    borderRadius: '5px',
    width: '100%',
    maxWidth: '600px',
  },
  chartContainer: {
    marginTop: '20px',
    padding: '20px',
    border: '1px solid #ffc107',
    borderRadius: '5px',
    width: '100%',
    maxWidth: '600px',
  },
  darkModeToggle: {
    marginTop: '20px',
  },
  loginContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100vh',
    backgroundColor: '#f8f9fa',
  },
};

export default AdminComponent;
