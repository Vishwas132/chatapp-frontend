import { useState, useEffect } from 'react';
import { Box, VStack, Input, Button, Text, Container } from '@chakra-ui/react';
import io from 'socket.io-client';

const Chat = () => {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    // Initialize socket connection
    const newSocket = io('http://localhost:1337');
    setSocket(newSocket);

    // Cleanup on component unmount
    return () => newSocket.close();
  }, []);

  useEffect(() => {
    if (!socket) return;

    // Listen for messages from server
    socket.on('message', (message) => {
      setMessages((prevMessages) => [...prevMessages, message]);
    });

    return () => {
      socket.off('message');
    };
  }, [socket]);

  const sendMessage = (e) => {
    e.preventDefault();
    if (message.trim() && socket) {
      socket.emit('message', message);
      setMessage('');
    }
  };

  return (
    <Container maxW="container.md" py={8}>
      <VStack spacing={4} align="stretch">
        <Box
          height="400px"
          overflowY="auto"
          borderWidth={1}
          borderRadius="lg"
          p={4}
        >
          {messages.map((msg, index) => (
            <Text key={index} p={2}>
              {msg}
            </Text>
          ))}
        </Box>
        <form onSubmit={sendMessage} style={{ width: '100%' }}>
          <VStack spacing={4}>
            <Input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type your message..."
            />
            <Button type="submit" colorScheme="blue" width="100%">
              Send
            </Button>
          </VStack>
        </form>
      </VStack>
    </Container>
  );
};

export default Chat;
