/**
 * ─────────────────────────────────────────────────────────────────
 * Session Context
 * ─────────────────────────────────────────────────────────────────
 * React context that holds the active user session (patient profile).
 * Allows any component to access/update patient context without
 * prop drilling.
 */

import { createContext, useContext, useState, useCallback } from 'react';
import axios from 'axios';

const SessionContext = createContext(null);

// Base API URL — uses Vite proxy in dev, or absolute URL in prod from environment variables
const API_BASE = import.meta.env.VITE_API_URL 
  ? `${import.meta.env.VITE_API_URL}/api` 
  : '/api';

export const SessionProvider = ({ children }) => {
  // Current active session data
  const [session, setSession] = useState(null);

  // Chat messages for the current session (kept in sync with DB)
  const [messages, setMessages] = useState([]);

  // Global loading and error states
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Creates a new session with patient context.
   * Persists to MongoDB and stores the returned sessionId locally.
   */
  const createSession = useCallback(async (patientName, disease, location = '') => {
    setIsLoading(true);
    setError(null);
    try {
      const resp = await axios.post(`${API_BASE}/sessions`, {
        patientName,
        disease,
        location,
      });
      setSession(resp.data);
      setMessages([]); // Fresh conversation for new session
      return resp.data;
    } catch (err) {
      const msg = err.response?.data?.error || 'Failed to create session.';
      setError(msg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Loads an existing session by ID (e.g., from localStorage on revisit).
   */
  const loadSession = useCallback(async (sessionId) => {
    setIsLoading(true);
    try {
      const resp = await axios.get(`${API_BASE}/sessions/${sessionId}`);
      setSession(resp.data);
      setMessages(resp.data.messages || []);
    } catch (err) {
      console.error('Failed to load session:', err.message);
      setSession(null); // Force user to re-create
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Sends a user message through the full AI pipeline.
   * Appends the user message optimistically, then the AI response.
   */
  const sendMessage = useCallback(async (userMessage) => {
    if (!session?.sessionId) throw new Error('No active session.');

    // Optimistic UI update — show user message immediately
    const userMsg = { role: 'user', content: userMessage, createdAt: new Date() };
    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);
    setError(null);

    try {
      const resp = await axios.post(`${API_BASE}/chat`, {
        sessionId: session.sessionId,
        message: userMessage,
      });

      // Append the assistant's structured response
      const assistantMsg = {
        role: 'assistant',
        content: resp.data.response,
        publications: resp.data.publications,
        trials: resp.data.trials,
        intent: resp.data.intent,
        expandedQuery: resp.data.expandedQuery,
        createdAt: new Date(),
      };
      setMessages((prev) => [...prev, assistantMsg]);
      return assistantMsg;
    } catch (err) {
      const msg = err.response?.data?.error || 'Failed to get a response. Please try again.';
      setError(msg);
      // Remove the optimistic user message on failure
      setMessages((prev) => prev.slice(0, -1));
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [session]);

  /**
   * Clears the current session (start over).
   */
  const clearSession = useCallback(() => {
    setSession(null);
    setMessages([]);
    setError(null);
  }, []);

  return (
    <SessionContext.Provider value={{
      session,
      messages,
      isLoading,
      error,
      createSession,
      loadSession,
      sendMessage,
      clearSession,
      setError,
    }}>
      {children}
    </SessionContext.Provider>
  );
};

/** Hook to consume session context. Must be used within SessionProvider. */
export const useSession = () => {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error('useSession must be used within SessionProvider');
  return ctx;
};
