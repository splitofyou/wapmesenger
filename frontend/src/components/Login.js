import React, { useState } from 'react';
import { TextField, Button, Paper, Typography } from '@mui/material';
import axios from 'axios';

function Login({ setUser }) {
  const [form, setForm] = useState({ username: '', password: '', email: '' });
  const [isRegister, setIsRegister] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const endpoint = isRegister ? '/register' : '/login';
    try {
      const res = await axios.post(`http://localhost:5000${endpoint}`, form);
      if (!isRegister) {
        localStorage.setItem('token', res.data.token);
        setUser({ username: form.username });
      } else {
        alert('Registered successfully!');
      }
    } catch (err) {
      alert('Error: ' + err.response.data);
    }
  };

  return (
    <Paper style={{ padding: 20, maxWidth: 400, margin: '50px auto', background: '#2c2c2c', color: 'white' }}>
      <Typography variant="h5">{isRegister ? 'Register' : 'Login'}</Typography>
      <form onSubmit={handleSubmit}>
        {isRegister && <TextField label="Email" fullWidth onChange={(e) => setForm({ ...form, email: e.target.value })} />}
        <TextField label="Username" fullWidth onChange={(e) => setForm({ ...form, username: e.target.value })} />
        <TextField label="Password" type="password" fullWidth onChange={(e) => setForm({ ...form, password: e.target.value })} />
        <Button type="submit" variant="contained" fullWidth style={{ marginTop: 10 }}>{isRegister ? 'Register' : 'Login'}</Button>
        <Button onClick={() => setIsRegister(!isRegister)} style={{ marginTop: 10 }}>Switch to {isRegister ? 'Login' : 'Register'}</Button>
      </form>
    </Paper>
  );
}

export default Login;