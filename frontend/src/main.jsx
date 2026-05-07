/**
 * main.jsx — Application bootstrap.
 */
import React, { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import './index.css';
import App from './App.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import { SocketProvider } from './context/SocketContext.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <SocketProvider>
          <App />
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: 'rgba(5,15,7,0.98)',
                color: '#00ff41',
                border: '1px solid rgba(0,255,65,0.3)',
                fontFamily: '"Share Tech Mono", monospace',
                fontSize: '0.8rem',
                boxShadow: '0 0 20px rgba(0,255,65,0.15)',
              },
              success: {
                iconTheme: { primary: '#00ff41', secondary: '#020b04' },
              },
              error: {
                style: {
                  borderColor: 'rgba(239,68,68,0.4)',
                  color: '#ef4444',
                },
                iconTheme: { primary: '#ef4444', secondary: '#020b04' },
              },
            }}
          />
        </SocketProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>
);
