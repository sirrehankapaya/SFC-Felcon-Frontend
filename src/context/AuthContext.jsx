import { createContext, useContext, useEffect, useState } from 'react';
import { apiClient } from '../services/apiClient';

const SESSION_KEY = 'smartsociety_session';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Restore session on mount
  useEffect(() => {
    async function restoreSession() {
      const stored = localStorage.getItem(SESSION_KEY);
      if (stored) {
        try {
          const res = await apiClient.get('/api/user/profile');
          if (res && res.status) {
            const mappedUser = {
              ...res.user,
              role: res.user.role === 'security' || res.user.role === 'guard' ? 'guard' : res.user.role
            };

            if (mappedUser.role === 'resident' && !mappedUser.flatId) {
              try {
                const usersRes = await apiClient.get('/api/user/all');
                const users = usersRes.users || usersRes.Users || [];
                const match = users.find((item) => {
                  const userId = item.id || item._id;
                  return String(userId) === String(mappedUser.id || mappedUser._id)
                    || String(item.email || '').toLowerCase() === String(mappedUser.email || '').toLowerCase();
                });

                if (match?.flatId) {
                  mappedUser.flatId = String(match.flatId);
                }
              } catch (innerErr) {
                console.warn('Flat fallback lookup failed during restore:', innerErr);
              }
            }

            setUser(mappedUser);
          }
        } catch (err) {
          localStorage.removeItem(SESSION_KEY);
        }
      }
      setLoading(false);
    }
    restoreSession();
  }, []);

  useEffect(() => {
    function handleSessionExpired() {
      setUser(null);
      localStorage.removeItem(SESSION_KEY);
    }
    window.addEventListener('session-expired', handleSessionExpired);
    return () => window.removeEventListener('session-expired', handleSessionExpired);
  }, []);

  async function login(username, password) {
    try {
      const res = await apiClient.post('/api/user/login', { email: username, password });
      if (res && res.status) {
        const mappedUser = {
          ...res.user,
          role: res.user.role === 'security' || res.user.role === 'guard' ? 'guard' : res.user.role
        };

        if (mappedUser.role === 'resident' && !mappedUser.flatId) {
          try {
            const usersRes = await apiClient.get('/api/user/all');
            const users = usersRes.users || usersRes.Users || [];
            const match = users.find((item) => {
              const userId = item.id || item._id;
              return String(userId) === String(mappedUser.id || mappedUser._id)
                || String(item.email || '').toLowerCase() === String(mappedUser.email || '').toLowerCase();
            });

            if (match?.flatId) {
              mappedUser.flatId = String(match.flatId);
            }
          } catch (innerErr) {
            console.warn('Flat fallback lookup failed during login:', innerErr);
          }
        }

        setUser(mappedUser);
        localStorage.setItem(SESSION_KEY, 'true');
        return { ok: true, user: mappedUser };
      }
      return { ok: false, error: res.message || 'Login failed' };
    } catch (err) {
      return { ok: false, error: err.message || 'Server connection failed' };
    }
  }

  async function logout() {
    try {
      await apiClient.post('/api/user/logout', {});
    } catch (e) {}
    setUser(null);
    localStorage.removeItem(SESSION_KEY);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
