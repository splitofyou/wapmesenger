import React, { useState, useEffect } from 'react';
import { Grid, Paper, TextField, Button, List, ListItem, ListItemText, Typography } from '@mui/material';
import io from 'socket.io-client';
import axios from 'axios';

const socket = io('http://localhost:5000');

function Chat({ user }) {
  const [chats, setChats] = useState([]);
  const [currentChat, setCurrentChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    socket.on('message', (msg) => {
      if (msg.chatId === currentChat?.chatId) {
        setMessages(prev => [...prev, msg]);
      }
    });
  }, [currentChat]);

  const searchUsers = async () => {
    const res = await axios.get(`http://localhost:5000/users/search?query=${searchQuery}`);
    setChats(res.data.map(u => ({
      id: u.id,
      name: u.username,
      chatId: [user.id, u.id].sort().join('-') //chatId
    })));
  };

 const selectChat = async (chat) => {
  console.log('Selecting chat:', chat); 
  setCurrentChat(chat);
  setMessages([]);
  try {
    const res = await axios.get(`http://localhost:5000/messages/${chat.chatId}`);
    setMessages(res.data.map(msg => ({ sender: msg.senderUsername, text: msg.text })));
    socket.emit('joinChat', chat.chatId);
  } catch (err) {
    console.error('Error loading chat messages:', err);
  }
};
  

  const sendMessage = () => {
    if (currentChat && newMessage.trim()) {
      const data = {
        chatId: currentChat.chatId,
        senderId: user.id,
        senderUsername: user.username,
        text: newMessage
      };
      socket.emit('sendMessage', data);
      setNewMessage('');
    }
  };

  return (
    <Grid container style={{ height: '100vh', background: '#1e1e1e' }}>
      <Grid item xs={3}>
        <Paper style={{ height: '100%', padding: 10, background: '#2c2c2c', color: 'white' }}>
          <TextField label="Search username" fullWidth onChange={(e) => setSearchQuery(e.target.value)} style={{ marginBottom: 10 }} />
          <Button onClick={searchUsers} variant="contained" fullWidth>Search</Button>
          <List>
            {chats.map(chat => (
              <ListItem button key={chat.id} onClick={() => selectChat(chat)} style={{ color: 'white' }}>
                <ListItemText primary={chat.name} />
              </ListItem>
            ))}
          </List>
        </Paper>
      </Grid>
      <Grid item xs={9}>
        <Paper style={{ height: '100%', padding: 10, background: '#1e1e1e', color: 'white' }}>
          {currentChat ? (
            <>
              <Typography variant="h6">{currentChat.name}</Typography>
              <div style={{ height: '80%', overflowY: 'scroll', marginBottom: 10 }}>
                {messages.map((msg, i) => <div key={i}><strong>{msg.sender}:</strong> {msg.text}</div>)}
              </div>
              <TextField value={newMessage} onChange={(e) => setNewMessage(e.target.value)} fullWidth placeholder="Type a message..." />
              <Button onClick={sendMessage} variant="contained" fullWidth style={{ marginTop: 10 }}>Send</Button>
            </>
          ) : (
            <Typography>Select a chat to start messaging</Typography>
          )}
        </Paper>
      </Grid>
    </Grid>
  );
}

export default Chat;