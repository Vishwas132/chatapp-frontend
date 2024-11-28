import { useState, useEffect, useRef } from 'react';
import './Chat.css';
import io from 'socket.io-client';

const Chat = () => {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [socket, setSocket] = useState(null);
  const [userId, setUserId] = useState(localStorage.getItem('userId'));
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Generate a persistent user ID if not exists
    if (!userId) {
      const newUserId = 'user_' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem('userId', newUserId);
      setUserId(newUserId);
    }

    // Initialize socket connection
    const newSocket = io('http://localhost:1337', {
      transports: ['polling', 'websocket'],
      withCredentials: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      autoConnect: true,
      query: { userId } // Send userId with connection
    });

    newSocket.on('connect', () => {
      console.log('Connected to server');
    });

    newSocket.on('connect_error', (error) => {
      console.error('Connection error:', error.message);
    });

    setSocket(newSocket);

    // Cleanup on component unmount
    return () => newSocket.close();
  }, [userId]);

  useEffect(() => {
    if (!socket) return;

    // Listen for previous messages
    socket.on('previous-messages', (previousMessages) => {
      setMessages(previousMessages);
    });

    // Listen for new messages
    socket.on('message', (message) => {
      setMessages((prevMessages) => [...prevMessages, message]);
    });

    return () => {
      socket.off('previous-messages');
      socket.off('message');
    };
  }, [socket]);

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const sendMessage = (e) => {
    e.preventDefault();
    if (message.trim() && socket) {
      socket.emit('message', message.trim());
      setMessage('');
    }
  };

  return (
    <div className="chat-container">
      <div className="chat-header">
        <h1>Real-Time Chat</h1>
        <p>Send a message to get started</p>
      </div>
      <div className="messages">
        {messages.length === 0 ? (
          <div className="no-messages">No messages yet. Start the conversation!</div>
        ) : (
          messages.map((msg) => (
            <div 
              key={msg.id} 
              className={`message ${msg.userId === userId ? 'message-own' : ''}`}
            >
              <div className="message-content">{msg.text}</div>
              <div className="message-time">{formatTime(msg.timestamp)}</div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>
      <form onSubmit={sendMessage} className="message-form">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type your message..."
          className="message-input"
        />
        <button type="submit" className="send-button">
          Send
        </button>
      </form>
    </div>
  );
};

export default Chat;
