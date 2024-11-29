import { useState, useEffect } from 'react';
import Chat from './components/Chat';
import Auth from './components/Auth';
import './App.css';

function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const handleAuthSuccess = (userData) => {
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('jwt');
    localStorage.removeItem('user');
    setUser(null);
  };

  return (
    <div className="app">
      {user ? (
        <>
          <div className="header">
            <span>Welcome, {user.username}!</span>
            <button onClick={handleLogout} className="logout-button">Logout</button>
          </div>
          <Chat user={user} />
        </>
      ) : (
        <Auth onAuthSuccess={handleAuthSuccess} />
      )}
    </div>
  );
}

export default App;
