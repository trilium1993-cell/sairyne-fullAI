import { safeGetItem, safeSetItem, safeRemoveItem, isLocalStorageAvailable } from '../utils/storage';
import { safeJsonParse } from '../utils/safeJson';

const IS_DEV = Boolean((import.meta as any)?.env?.DEV);

export interface AuthUser {
  id: number;
  email: string;
  password: string;
  loginTime: string;
}

const USERS_KEY = 'sairyne_users';
const CURRENT_USER_KEY = 'sairyne_current_user';
const ACCESS_TOKEN_KEY = 'sairyne_access_token';

const normalizeEmail = (value: string) => value.trim().toLowerCase();

function parseUsers(): AuthUser[] {
  if (typeof window === 'undefined') return [];
  
  try {
    const raw = safeGetItem(USERS_KEY);
    const parsed = safeJsonParse<any>(raw, []);
    if (!Array.isArray(parsed)) return [];
    return parsed.map((user) => ({
      id: typeof user.id === 'number' ? user.id : Date.now(),
      email: typeof user.email === 'string' ? user.email.trim() : '',
      password: typeof user.password === 'string' ? user.password : '',
      loginTime: typeof user.loginTime === 'string' ? user.loginTime : new Date().toISOString(),
    })).filter((user) => user.email.length > 0);
  } catch (error) {
    console.warn('[Auth] Error parsing users:', error);
    return [];
  }
}

function persistUsers(users: AuthUser[]) {
  if (typeof window === 'undefined') return;
  
  if (IS_DEV) console.log('[Auth] 🔄 persistUsers called with', users.length, 'users');
  const usersJson = JSON.stringify(users);
  if (IS_DEV) {
    console.log('[Auth] 📦 Users JSON length:', usersJson.length);
    console.log('[Auth] 📦 Users JSON preview:', usersJson.substring(0, 200));
  }
  
  // Debug: send message to JUCE to log this call
  if (IS_DEV) {
    try {
      if (typeof window !== 'undefined') {
        const debugUrl = `juce://debug?message=persistUsers_called_with_${users.length}_users_json_length_${usersJson.length}`;
        // Try top/parent first (for iframe), fallback to window
        if (window.top && window.top !== window) {
          window.top.location.href = debugUrl;
        } else if (window.parent && window.parent !== window) {
          window.parent.location.href = debugUrl;
        } else if (window.location) {
          window.location.href = debugUrl;
        }
      }
    } catch (e) {
      console.warn('[Auth] Failed to send debug message:', e);
    }
  }
  
  // safeSetItem will handle JUCE fallback automatically
  if (IS_DEV) {
    console.log('[Auth] 🔄 Calling safeSetItem for', USERS_KEY);
    console.log('[Auth] 🔄 Checking if window.saveToJuce exists:', typeof (window as any).saveToJuce);
  }
  
  const success = safeSetItem(USERS_KEY, usersJson);
  if (!success) {
    console.warn('[Auth] ⚠️ Failed to persist users - localStorage blocked and JUCE not available');
  } else {
    if (IS_DEV) console.log('[Auth] ✅ persistUsers completed successfully');
    // Double-check: try to read it back immediately
    setTimeout(() => {
      const readBack = safeGetItem(USERS_KEY);
      if (readBack) {
        if (IS_DEV) console.log('[Auth] ✅ Verified: users data persisted successfully, length:', readBack.length);
      } else {
        console.warn('[Auth] ⚠️ Warning: users data not found after save, length:', readBack?.length || 0);
      }
    }, 500);
  }
}

function emailsEqual(a: string, b: string) {
  return normalizeEmail(a) === normalizeEmail(b);
}

function normalizeStoredUser(data: any): AuthUser | null {
  if (!data || typeof data.email !== 'string') {
    return null;
  }

  return {
    id: typeof data.id === 'number' ? data.id : Date.now(),
    email: data.email.trim(),
    password: typeof data.password === 'string' ? data.password : '',
    loginTime: typeof data.loginTime === 'string' ? data.loginTime : new Date().toISOString(),
  };
}

function readCurrentUser(): AuthUser | null {
  if (typeof window === 'undefined') return null;

  try {
    const raw = safeGetItem(CURRENT_USER_KEY);
    const parsed = safeJsonParse<any>(raw, null);
    return normalizeStoredUser(parsed);
  } catch (error) {
    console.warn('[Auth] Error reading current user:', error);
    return null;
  }
}

export function findUserByEmail(email: string): AuthUser | undefined {
  return parseUsers().find((user) => emailsEqual(user.email, email));
}

export function saveUser(user: AuthUser): AuthUser {
  if (IS_DEV) console.log('[Auth] 🔄 saveUser called:', user.email);
  
  // Debug: send message to JUCE immediately
  if (IS_DEV) {
    try {
      if (typeof window !== 'undefined') {
        const debugUrl = `juce://debug?message=saveUser_called_with_email_${user.email}`;
        if (window.top && window.top !== window) {
          window.top.location.href = debugUrl;
        } else if (window.parent && window.parent !== window) {
          window.parent.location.href = debugUrl;
        } else if (window.location) {
          window.location.href = debugUrl;
        }
      }
    } catch (e) {
      console.warn('[Auth] Failed to send debug message from saveUser:', e);
    }
  }
  
  const users = parseUsers();
  const existingIndex = users.findIndex((u) => emailsEqual(u.email, user.email));
  const normalizedUser: AuthUser = {
    ...user,
    email: user.email.trim(),
  };

  if (existingIndex >= 0) {
    users[existingIndex] = { ...users[existingIndex], ...normalizedUser };
    console.log('[Auth] ✅ User updated in array');
  } else {
    users.push(normalizedUser);
    console.log('[Auth] ✅ New user added to array');
  }

  console.log('[Auth] 🔄 Calling persistUsers with', users.length, 'users');
  console.log('[Auth] 🔄 About to call persistUsers - users array:', JSON.stringify(users));
  persistUsers(users);
  console.log('[Auth] ✅ persistUsers completed');
  return normalizedUser;
}

export function getCurrentUser(): AuthUser | null {
  const direct = readCurrentUser();
  if (direct) {
    return direct;
  }

  const users = parseUsers();
  if (users.length > 0) {
    const fallback = users[users.length - 1];
    // ensure current user cache is populated for future reads
    setCurrentUser(fallback);
    return fallback;
  }

  return null;
}

function ensureAccessToken() {
  if (!getAccessToken()) {
    setAccessToken(generateToken());
  }
}

export function setCurrentUser(user: AuthUser | null) {
  if (typeof window === 'undefined') return;
  
  console.log('[Auth] 🔄 setCurrentUser called:', user?.email || 'null');
  try {
    if (!user) {
      console.log('[Auth] 🔄 Removing current user');
      safeRemoveItem(CURRENT_USER_KEY);
      return;
    }
    const userJson = JSON.stringify(user);
    console.log('[Auth] 🔄 Calling safeSetItem for', CURRENT_USER_KEY, 'length:', userJson.length);
    const success = safeSetItem(CURRENT_USER_KEY, userJson);
    if (!success) {
      console.warn('[Auth] ⚠️ Failed to set current user - localStorage blocked and JUCE not available');
    } else {
      console.log('[Auth] ✅ Current user set successfully');
    }
  } catch (error) {
    console.error('[Auth] ❌ Error setting current user:', error);
  }
}

function generateToken(): string {
  return `sairyne_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

export function getAccessToken(): string | null {
  if (typeof window === 'undefined') return null;
  
  try {
    return safeGetItem(ACCESS_TOKEN_KEY);
  } catch (error) {
    console.warn('[Auth] Error getting access token:', error);
    return null;
  }
}

export function setAccessToken(token: string | null) {
  if (typeof window === 'undefined') return;
  
  try {
    if (!token) {
      safeRemoveItem(ACCESS_TOKEN_KEY);
      return;
    }
    const success = safeSetItem(ACCESS_TOKEN_KEY, token);
    if (!success) {
      console.warn('[Auth] Failed to set access token - localStorage blocked and JUCE not available');
    }
  } catch (error) {
    console.error('[Auth] Error setting access token:', error);
  }
}

export function clearSession() {
  setCurrentUser(null);
  setAccessToken(null);
}

interface SessionResult {
  success: boolean;
  error?: string;
  user?: AuthUser;
  token?: string;
}

export function createSession(email: string, password: string): SessionResult {
  console.log('[Auth] 🔄 createSession called:', email);
  
  // Debug: send message to JUCE immediately
  try {
    if (typeof window !== 'undefined') {
      const debugUrl = `juce://debug?message=createSession_called_with_email_${email}`;
      if (window.top && window.top !== window) {
        window.top.location.href = debugUrl;
      } else if (window.parent && window.parent !== window) {
        window.parent.location.href = debugUrl;
      } else if (window.location) {
        window.location.href = debugUrl;
      }
    }
  } catch (e) {
    console.warn('[Auth] Failed to send debug message from createSession:', e);
  }
  
  const trimmedEmail = email.trim();
  if (!trimmedEmail || !password) {
    console.warn('[Auth] ⚠️ Email or password missing');
    return { success: false, error: 'Email and password are required.' };
  }

  const loginTime = new Date().toISOString();
  const existingUser = findUserByEmail(trimmedEmail);

  if (existingUser) {
    if (existingUser.password !== password) {
      console.warn('[Auth] ⚠️ Incorrect password');
      return { success: false, error: 'Incorrect password. Please try again.' };
    }
    console.log('[Auth] ✅ User found, updating and saving...');
    const updatedUser: AuthUser = { ...existingUser, loginTime };
    const persistedUser = saveUser(updatedUser);
    console.log('[Auth] ✅ saveUser returned, setting current user...');
    setCurrentUser(persistedUser);
    ensureAccessToken();
    const token = getAccessToken();
    console.log('[Auth] ✅ Session created successfully');
    return { success: true, user: persistedUser, token: token ?? undefined };
  }

  const newUser: AuthUser = {
    id: Date.now(),
    email: trimmedEmail,
    password,
    loginTime,
  };

  const persistedUser = saveUser(newUser);
  setCurrentUser(persistedUser);
  ensureAccessToken();
  const token = getAccessToken();
  return { success: true, user: persistedUser, token: token ?? undefined };
}

export function isAuthenticated(): boolean {
  const user = getCurrentUser();
  if (!user) {
    return false;
  }
  ensureAccessToken();
  return true;
}

export function getActiveUserEmail(): string {
  const user = getCurrentUser();
  return user?.email ?? '__guest__';
}
