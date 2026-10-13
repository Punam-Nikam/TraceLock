// useSocket.js — Real-time socket connection hook
// Used by all components that need live updates

import { useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from '../context/AuthContext';

let socketInstance = null;

export function useSocket() {
  const { user, isAuthenticated } = useAuth();
  const socketRef = useRef(null);

  useEffect(() => {
    if (!isAuthenticated || !user) return;

    // Create socket only once
    if (!socketInstance) {
      socketInstance = io('http://localhost:5000', {
        transports:        ['websocket', 'polling'],
        reconnection:      true,
        reconnectionDelay: 1000,
        timeout:           20000,
      });
    }

    socketRef.current = socketInstance;

    socketInstance.on('connect', () => {
      console.log('🔌 Socket connected:', socketInstance.id);
      // Join personal room
      socketInstance.emit('join', user.id);
      // Admin joins company room
      if (['super_admin','admin','dept_head'].includes(user.role)) {
        socketInstance.emit('join_company', user.company_id);
      }
    });

    socketInstance.on('disconnect', () => {
      console.log('🔌 Socket disconnected');
    });

    return () => {
      // Don't disconnect on component unmount — keep connection alive
    };
  }, [isAuthenticated, user]);

  // Listen for events
  const on = useCallback((event, handler) => {
    if (socketRef.current) {
      socketRef.current.on(event, handler);
    }
    return () => {
      if (socketRef.current) {
        socketRef.current.off(event, handler);
      }
    };
  }, []);

  // Remove listener
  const off = useCallback((event, handler) => {
    if (socketRef.current) {
      socketRef.current.off(event, handler);
    }
  }, []);

  return { socket: socketRef.current, on, off };
}