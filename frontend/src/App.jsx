/**
 * ─────────────────────────────────────────────────────────────────
 * App.jsx — Root Application Component
 * ─────────────────────────────────────────────────────────────────
 * Sets up React Router routes and wraps the app in SessionProvider.
 */

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { SessionProvider } from '@/context/SessionContext';
import HomePage from '@/pages/HomePage';
import ChatPage from '@/pages/ChatPage';

function App() {
  return (
    <BrowserRouter>
      {/* SessionProvider makes patient context available to all components */}
      <SessionProvider>
        <Routes>
          {/* Landing/onboarding page */}
          <Route path="/" element={<HomePage />} />

          {/* Main chat interface, uses :sessionId from MongoDB */}
          <Route path="/chat/:sessionId" element={<ChatPage />} />

          {/* Redirect any unknown routes to home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </SessionProvider>
    </BrowserRouter>
  );
}

export default App;
