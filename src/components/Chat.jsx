import { useState, useEffect, useRef } from 'react';
import './Chat.css';
import io from 'socket.io-client';

const Chat = ({ user }) => {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [socket, setSocket] = useState(null);
  const [activeUsers, setActiveUsers] = useState([]);
  const [showUserList, setShowUserList] = useState(false);
  const userListRef = useRef(null);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userListRef.current && !userListRef.current.contains(event.target)) {
        setShowUserList(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!user) return;

    // Initialize socket connection with JWT token
    const token = localStorage.getItem('jwt');
    const newSocket = io('http://localhost:1337', {
      transports: ['polling', 'websocket'],
      withCredentials: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      autoConnect: true,
      auth: {
        token
      },
      query: { 
        userId: user.id,
        username: user.username
      }
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
  }, [user]);

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

    // Listen for active users updates
    socket.on('active_users', (users) => {
      setActiveUsers(users);
    });

    // Listen for individual user status updates
    socket.on('user_status', (userStatus) => {
      setActiveUsers((prevUsers) => {
        const userIndex = prevUsers.findIndex(u => u.userId === userStatus.userId);
        if (userIndex === -1) {
          return [...prevUsers, userStatus];
        }
        const newUsers = [...prevUsers];
        newUsers[userIndex] = userStatus;
        return newUsers;
      });
    });

    // Set up activity monitoring
    let activityTimeout;
    const handleActivity = () => {
      if (activityTimeout) {
        clearTimeout(activityTimeout);
      }
      socket.emit('status_change', 'online');
      activityTimeout = setTimeout(() => {
        socket.emit('status_change', 'away');
      }, 300000); // 5 minutes
    };

    window.addEventListener('mousemove', handleActivity);
    window.addEventListener('keypress', handleActivity);

    return () => {
      socket.off('previous-messages');
      socket.off('message');
      socket.off('active_users');
      socket.off('user_status');
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('keypress', handleActivity);
      if (activityTimeout) {
        clearTimeout(activityTimeout);
      }
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

  const getUserStatus = (userId) => {
    const userStatus = activeUsers.find(u => u.userId === userId);
    return userStatus?.status || 'offline';
  };

  const getOnlineCount = () => {
    return activeUsers.filter(user => user.status === 'online').length;
  };

  const getInitials = (username) => {
    return username
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'online': return '#4caf50';
      case 'away': return '#ff9800';
      default: return '#9e9e9e';
    }
  };

  return (
    <div className="chat-container">
      <div className="chat-header">
        <h2>Chat Room</h2>
        <div className="active-users" ref={userListRef}>
          <div 
            className="avatar-stack" 
            onClick={() => setShowUserList(!showUserList)}
            title={`${getOnlineCount()} online users`}
          >
            {activeUsers
              .filter(u => u.status === 'online')
              .slice(0, 3)
              .map((activeUser, index) => (
                <div 
                  key={activeUser.userId}
                  className="avatar"
                  style={{ 
                    zIndex: activeUsers.length - index,
                    marginLeft: index > 0 ? '-8px' : '0'
                  }}
                >
                  {getInitials(activeUser.username)}
                  <span 
                    className="status-dot"
                    style={{ backgroundColor: getStatusColor(activeUser.status) }}
                  />
                </div>
              ))}
            {activeUsers.length > 3 && (
              <div className="avatar more-avatar">
                +{activeUsers.length - 3}
              </div>
            )}
          </div>
          {showUserList && (
            <div className="user-list-popover">
              <h3>Active Users ({getOnlineCount()})</h3>
              {activeUsers.map(activeUser => (
                <div key={activeUser.userId} className="user-item">
                  <div className="user-avatar">
                    {getInitials(activeUser.username)}
                    <span 
                      className="status-dot"
                      style={{ backgroundColor: getStatusColor(activeUser.status) }}
                    />
                  </div>
                  <div className="user-info">
                    <span className="username">{activeUser.username}</span>
                    <span className="status-text">{activeUser.status}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <div className="messages">
        {messages.length === 0 ? (
          <div className="no-messages">No messages yet. Start the conversation!</div>
        ) : (
          messages.map((msg) => (
            <div 
              key={msg.id} 
              className={`message ${msg.userId === user.id ? 'message-own' : ''}`}
            >
              <div className="message-header">
                <div className="user-info">
                  <div className="message-avatar">
                    {getInitials(msg.username || 'Unknown')}
                    <span 
                      className="status-dot"
                      style={{ backgroundColor: getStatusColor(getUserStatus(msg.userId)) }}
                    />
                  </div>
                  <span className="message-username">{msg.username || 'Unknown'}</span>
                </div>
                <span className="message-time">{formatTime(msg.timestamp)}</span>
              </div>
              <div className="message-content">{msg.text}</div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>
      <form className="message-input" onSubmit={sendMessage}>
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type a message..."
        />
        <button type="submit">Send</button>
      </form>
    </div>
  );
};

export default Chat;
