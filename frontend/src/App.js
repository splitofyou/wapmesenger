import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Login from './components/Login';
import Chat from './components/Chat';
import axios from 'axios';

function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setUser({ id: 1, username: 'example' });
    }
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={user ? <Chat user={user} /> : <Login setUser={setUser} />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;