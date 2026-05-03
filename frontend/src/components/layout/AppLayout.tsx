import React, { useState, useRef, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, FolderKanban, CheckSquare, Bell, User,
  LogOut, ChevronDown, Settings, Menu, X
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import api from '../../lib/api';
import type { Notification } from '../../types';
import toast from 'react-hot-toast';
import ParticleBackground from '../ParticleBackground';
import Logo from '../Logo';

const navItems = [
  { to: '/dashboard', icon: <LayoutDashboard size={18} />, label: 'Dashboard' },
  { to: '/projects', icon: <FolderKanban size={18} />, label: 'Projects' },
  { to: '/tasks', icon: <CheckSquare size={18} />, label: 'My Tasks' },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotif, setShowNotif] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const notifRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setShowNotif(false);
      if (userRef.current && !userRef.current.contains(e.target as Node)) setShowUserMenu(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/notifications');
      setNotifications(res.data.data.notifications);
      setUnreadCount(res.data.data.unreadCount);
    } catch {}
  };

  const markAllRead = async () => {
    try {
      await api.put('/notifications/read-all');
      setUnreadCount(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch {}
  };

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    navigate('/login');
  };

  const initials = user?.name?.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) || 'U';

  return (
    <div className="app-layout" style={{ position: 'relative' }}>
      {/* Global animated background */}
      <ParticleBackground />
      <div className="bg-orb bg-orb-1" />
      <div className="bg-orb bg-orb-2" />
      <div className="bg-orb bg-orb-3" />
      <div className="bg-grid" />
      {/* Sidebar */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.aside
            className="sidebar"
            initial={{ x: -260 }} animate={{ x: 0 }} exit={{ x: -260 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          >
            {/* Logo */}
            <div className="sidebar-logo">
              <Logo size={36} textSize="1rem" subtitle />
            </div>

            {/* Nav */}
            <nav className="sidebar-nav">
              <div className="nav-section-label">Main</div>
              {navItems.map((item) => (
                <NavLink key={item.to} to={item.to} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                  {item.icon}
                  <span>{item.label}</span>
                </NavLink>
              ))}

              {user?.role === 'admin' && (
                <>
                  <div className="nav-section-label" style={{ marginTop: 12 }}>Admin</div>
                  <NavLink to="/admin/users" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                    <Settings size={18} /><span>Manage Users</span>
                  </NavLink>
                </>
              )}
            </nav>

            {/* User footer */}
            <div style={{ padding: '16px 12px', borderTop: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 10, background: 'var(--bg-hover)' }}>
                <div className="avatar avatar-sm">
                  {user?.avatar ? <img src={user.avatar} alt={user.name} /> : initials}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: '0.85rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.name}</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'capitalize' }}>{user?.role}</div>
                </div>
                <button className="btn btn-ghost btn-icon btn-sm" onClick={handleLogout} title="Logout">
                  <LogOut size={15} />
                </button>
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Main */}
      <div className="main-content" style={{ position: 'relative', zIndex: 1 }}>
        {/* Header */}
        <header className="app-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button className="btn btn-ghost btn-icon" onClick={() => setSidebarOpen(!sidebarOpen)}>
              {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {/* Notifications */}
            <div ref={notifRef} className="dropdown">
              <button className="btn btn-ghost btn-icon" style={{ position: 'relative' }} onClick={() => setShowNotif(!showNotif)}>
                <Bell size={20} />
                {unreadCount > 0 && (
                  <span style={{ position: 'absolute', top: 4, right: 4, width: 8, height: 8, borderRadius: '50%', background: 'var(--accent-pink)', boxShadow: '0 0 8px var(--accent-pink)' }} />
                )}
              </button>

              <AnimatePresence>
                {showNotif && (
                  <motion.div className="dropdown-menu"
                    style={{ width: 340, maxHeight: 480, overflowY: 'auto', right: 0 }}
                    initial={{ opacity: 0, y: -8, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.97 }}
                    transition={{ duration: 0.15 }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px 12px' }}>
                      <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>Notifications</span>
                      {unreadCount > 0 && <button className="btn btn-ghost btn-sm" onClick={markAllRead} style={{ fontSize: '0.75rem' }}>Mark all read</button>}
                    </div>
                    {notifications.length === 0 ? (
                      <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>No notifications</div>
                    ) : (
                      notifications.slice(0, 8).map((n) => (
                        <div key={n.id} className="dropdown-item" style={{ opacity: n.read ? 0.6 : 1 }}>
                          <div style={{ width: 8, height: 8, borderRadius: '50%', background: n.read ? 'var(--text-muted)' : 'var(--accent-pink)', flexShrink: 0 }} />
                          <div>
                            <div style={{ fontSize: '0.82rem' }}>{n.message}</div>
                            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{new Date(n.createdAt).toLocaleDateString()}</div>
                          </div>
                        </div>
                      ))
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* User menu */}
            <div ref={userRef} className="dropdown">
              <button className="btn btn-ghost" style={{ gap: 8 }} onClick={() => setShowUserMenu(!showUserMenu)}>
                <div className="avatar avatar-sm">
                  {user?.avatar ? <img src={user.avatar} alt={user.name} /> : initials}
                </div>
                <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{user?.name?.split(' ')[0]}</span>
                <ChevronDown size={14} />
              </button>

              <AnimatePresence>
                {showUserMenu && (
                  <motion.div className="dropdown-menu" initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
                    <div className="dropdown-item" onClick={() => { navigate('/profile'); setShowUserMenu(false); }}>
                      <User size={15} /> Profile
                    </div>
                    <div style={{ height: 1, background: 'var(--border-color)', margin: '4px 0' }} />
                    <div className="dropdown-item danger" onClick={handleLogout}>
                      <LogOut size={15} /> Logout
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="page-content">
          <motion.div key={location.pathname} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
            {children}
          </motion.div>
        </main>
      </div>
    </div>
  );
}
