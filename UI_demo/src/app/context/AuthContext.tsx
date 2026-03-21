import React, { createContext, useContext, useState, useEffect } from 'react';

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  department: string;
  grade: string;
  isAdmin: boolean;
  profileComplete: boolean;
  questionnaireComplete: boolean;
}

interface AuthContextType {
  user: User | null;
  isLoggedIn: boolean;
  isLoading: boolean;
  login: (email: string) => void;
  loginAsAdmin: () => void;
  logout: () => void;
  updateUser: (updates: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

const MOCK_USER: User = {
  id: 'u001',
  name: '林知晚',
  email: 'linzhiwan@campus.edu.cn',
  department: '中文系',
  grade: '大三',
  isAdmin: false,
  profileComplete: true,
  questionnaireComplete: true,
};

const MOCK_ADMIN: User = {
  id: 'a001',
  name: '管理员',
  email: 'admin@campus.edu.cn',
  department: '学生工作部',
  grade: '—',
  isAdmin: true,
  profileComplete: true,
  questionnaireComplete: true,
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem('campus_match_user');
    if (stored) {
      setUser(JSON.parse(stored));
    }
    setIsLoading(false);
  }, []);

  const login = (email: string) => {
    const u = { ...MOCK_USER, email };
    setUser(u);
    localStorage.setItem('campus_match_user', JSON.stringify(u));
  };

  const loginAsAdmin = () => {
    setUser(MOCK_ADMIN);
    localStorage.setItem('campus_match_user', JSON.stringify(MOCK_ADMIN));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('campus_match_user');
  };

  const updateUser = (updates: Partial<User>) => {
    if (!user) return;
    const updated = { ...user, ...updates };
    setUser(updated);
    localStorage.setItem('campus_match_user', JSON.stringify(updated));
  };

  return (
    <AuthContext.Provider value={{ user, isLoggedIn: !!user, isLoading, login, loginAsAdmin, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
