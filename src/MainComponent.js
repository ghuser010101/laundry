import React, { useState, useEffect } from 'react';
import './App.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import { initializeApp } from 'firebase/app';
import { getDatabase, ref, set, onValue, push, remove } from 'firebase/database';
import qrImage from './qr.jpg'; // Import your QR image here

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
const db = getDatabase(app);

function MainComponent() {
  const [isWashing, setIsWashing] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [queue, setQueue] = useState([]);
  const [completedQueue, setCompletedQueue] = useState([]);
  const [errorMessage, setErrorMessage] = useState('');
  const [currentWashingItem, setCurrentWashingItem] = useState('');
  const [countdown, setCountdown] = useState(1);
  const [showTakeButton, setShowTakeButton] = useState(false);
  const [weight, setWeight] = useState();
  const [timerValue, setTimerValue] = useState(0);

  // Firebase refs
  const washingRef = ref(db, 'washingStatus');
  const timerRef = ref(db, 'washingTimer');
  const weightRef = ref(db, 'Weight(g)');

  useEffect(() => {
    const weightInterval = setInterval(() => {
      onValue(weightRef, (snapshot) => {
        const weightValue = snapshot.val();
        setWeight(weightValue);
      });
    }, 100);

    return () => clearInterval(weightInterval);
  }, []);

  useEffect(() => {
    const timerInterval = setInterval(() => {
      onValue(timerRef, (snapshot) => {
        const timeValue = snapshot.val();
        setTimerValue(timeValue);
        setShowTakeButton(timeValue === 0);
        setIsWashing(timeValue > 2); // Set isWashing based on timerValue
      });
    }, 100);

    return () => clearInterval(timerInterval);
  }, []);

  useEffect(() => {
    const phoneNumbersRef = ref(db, 'phoneNumbers');

    const unsubscribePhoneNumbers = onValue(phoneNumbersRef, (snapshot) => {
      const data = snapshot.val();
      const formattedQueue = data ? Object.keys(data).map(key => ({
        id: key,
        value: data[key]
      })) : [];
      setQueue(formattedQueue);
    });

    const unsubscribeWashingStatus = onValue(washingRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setIsWashing(data.isWashing);
        setCurrentWashingItem(data.currentItem || '');
      }
    });

    return () => {
      unsubscribePhoneNumbers();
      unsubscribeWashingStatus();
    };
  }, []);

  const handleAddToQueue = () => {
    if ((phoneNumber.length === 10 || phoneNumber.length === 11) && /^\d+$/.test(phoneNumber)) {
      const queRef = ref(db, 'phoneNumbers');
      const newQueRef = push(queRef);
      set(newQueRef, phoneNumber);
      setErrorMessage('');

      if (isWashing) {
        const smsEsp32NextRef = ref(db, 'smsEsp32/next');
        set(smsEsp32NextRef, phoneNumber);
      }

      setPhoneNumber('');
    } else {
      setErrorMessage('Please enter a valid phone number (10 or 11 digits).');
    }
  };

  const handleClothesTaken = (item) => {
    const queueRef = ref(db, `phoneNumbers/${item.id}`);
    const completedQueueEntryRef = ref(db, `completedQueue/${item.id}`);

    set(timerRef, 1);

    const startWashingRef = ref(db, 'startWashing');
    set(startWashingRef, "NO")
      .then(() => {
        remove(queueRef)
          .then(() => {
            setQueue((prev) => prev.filter((entry) => entry.id !== item.id));
            setCompletedQueue((prev) => prev.filter((entry) => entry.id !== item.id));
            remove(completedQueueEntryRef);
          })
          .catch((error) => {
            console.error("Error removing item:", error);
          });
      })
      .catch((error) => {
        console.error("Error setting startWashing:", error);
      });
  };

  const startWashingProcess = (index) => {
    if (index < queue.length) {
      setCurrentWashingItem(queue[index]);

      const smsEsp32Ref = ref(db, 'smsEsp32');
      const currentPhoneNumber = queue[index].value;
      const nextPhoneNumber = index + 1 < queue.length ? queue[index + 1].value : null;

      set(smsEsp32Ref, {
        current: currentPhoneNumber,
        next: nextPhoneNumber,
      });

      const totalDuration = countdown;

      setTimeout(() => {
        const completedQueueEntryRef = ref(db, `completedQueue/${queue[index].id}`);
        set(completedQueueEntryRef, queue[index].value);
        setCompletedQueue((prev) => [...prev, queue[index]]);
        setCurrentWashingItem('');
        setCountdown(0);
      }, totalDuration * 1000);
    }
  };

  const handleStartWashing = () => {
    if (!isWashing && queue.length > 0) {
      const startWashingRef = ref(db, 'startWashing');
      set(startWashingRef, "YES")
        .then(() => {
          startWashingProcess(0);
        })
        .catch((error) => {
          console.error("Error setting startWashing:", error);
        });
    }
  };

  return (
    <div className="App d-flex flex-column vh-100">
      <header className="d-flex justify-content-between align-items-center p-3" style={{ backgroundColor: '#d3d3d3' }}>
        <h1 className="mb-0">Washing Machine</h1>
        <button 
          className="btn btn-secondary" 
          onClick={() => window.open('/report')} // Open in new tab
        >
          Report
        </button>
      </header>

      {/* Timer Box - Hide if timerValue is 1 */}
      {timerValue !== 1 && (
        <div className="alert alert-info mb-3" role="alert">
          <h5>Timer:</h5>
          <p>{timerValue}</p>
        </div>
      )}

      {queue.length > 0 && (
        <div className="alert alert-info mb-3" role="alert">
          <h5>Queue:</h5>
          <ul className="list-group">
            {queue.map((entry, index) => (
              <li className="list-group-item" key={entry.id}>
                {index + 1}. {entry.value}
                {showTakeButton && index === 0 && (
                  <>
                    <span className="text-success"> - Done washing</span>
                    <button className="btn btn-success btn-sm ms-2" onClick={() => handleClothesTaken(entry)}>
                      Take clothes
                    </button>
                  </>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {countdown > 2 && currentWashingItem && (
        <div className="alert alert-warning mb-3" role="alert">
          <h5>Currently Washing:</h5>
          <p>{currentWashingItem.value}</p>
        </div>
      )}

      {/* Display Weight in a styled box below Timer */}
      <div className="alert alert-secondary mb-3" role="alert">
        <h5>Weight (g):</h5>
        <p>{weight || "Loading..."}</p>
      </div>

      {/* Error Message */}
      {errorMessage && <div className="alert alert-danger mb-0" role="alert">{errorMessage}</div>}

      {/* Centered Washing Machine Box */}
      <div className="d-flex justify-content-center align-items-center flex-grow-1">
        <div className="card p-4" style={{ width: '300px', textAlign: 'center' }}>
          <div className={`washing-machine ${isWashing ? 'washing' : ''} mx-auto`}>
            <div className="inner-machine"></div>
          </div>
          <input
            type="text"
            className="form-control mb-2"
            placeholder="Phone Number"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
          />
          <button className="btn btn-primary mb-2" onClick={handleAddToQueue}>
            Add to Queue
          </button>
          <button className="btn btn-success" onClick={handleStartWashing} disabled={timerValue === 0}>
            Start Washing
          </button>
          {/* Centered QR Code Image with Pay Here Label */}
          <div className="d-flex flex-column align-items-center mt-3">
            <img 
              src={qrImage} 
              alt="QR Code" 
              style={{ width: '100px', height: '100px', marginTop: '10px' }} 
            />
            <small>Pay and Add to queue</small>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MainComponent;
