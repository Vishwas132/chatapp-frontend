import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import { ChakraProvider } from '@chakra-ui/react'
import Chat from './components/Chat'

function App() {
  return (
    <ChakraProvider>
      <Chat />
    </ChakraProvider>
  )
}

export default App
