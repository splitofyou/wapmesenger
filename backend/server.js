const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const socketIo = require('socket.io');
const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');

const app = express();
app.use(cors());
app.use(express.json());

const db = new Database('./messenger.db', { verbose: console.log });

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    chatId TEXT NOT NULL,
    senderId INTEGER NOT NULL,
    senderUsername TEXT NOT NULL,
    text TEXT NOT NULL,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

app.post('/register', async (req, res) => {
  const { username, email, password } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const stmt = db.prepare('INSERT INTO users (username, email, password) VALUES (?, ?, ?)');
    stmt.run(username, email, hashedPassword);
    res.status(201).send('User registered');
  } catch (err) {
    res.status(400).send('Error registering user: ' + err.message);
  }
});

app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const stmt = db.prepare('SELECT * FROM users WHERE username = ?');
  const user = stmt.get(username);
  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.status(401).send('Invalid credentials');
  }
  const token = jwt.sign({ id: user.id }, 'secretkey', { expiresIn: '1h' });
  res.json({ token, user: { id: user.id, username: user.username } });
});

app.get('/users/search', (req, res) => {
  const { query } = req.query;
  const stmt = db.prepare('SELECT id, username FROM users WHERE username LIKE ?');
  const users = stmt.all(`%${query}%`);
  res.json(users);
});

app.get('/messages/:chatId', (req, res) => {
  const { chatId } = req.params;
  console.log('Loading messages for chatId:', chatId);
  try {
    const stmt = db.prepare('SELECT senderUsername, text, timestamp FROM messages WHERE chatId = ? ORDER BY timestamp');
    const messages = stmt.all(chatId);
    console.log('Messages found:', messages.length);
    res.json(messages);
  } catch (err) {
    console.error('Error loading messages:', err.message);
    res.status(500).send('Error loading messages: ' + err.message);
  }
});

const server = app.listen(5000, () => console.log('Server running on port 5000'));

const io = socketIo(server);
io.on('connection', (socket) => {
  socket.on('joinChat', (chatId) => socket.join(chatId));
  socket.on('sendMessage', (data) => {
    const stmt = db.prepare('INSERT INTO messages (chatId, senderId, senderUsername, text) VALUES (?, ?, ?, ?)');
    stmt.run(data.chatId, data.senderId, data.senderUsername, data.text);
    io.to(data.chatId).emit('message', data);
  });
});
