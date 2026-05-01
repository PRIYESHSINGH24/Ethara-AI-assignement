import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Users, Shield, User, Trash2, Search } from 'lucide-react';
import api from '../lib/api';
import type { User as UserType } from '../types';
import toast from 'react-hot-toast';
import { format, parseISO } from 'date-fns';

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserType[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => { loadUsers(); }, []);

  const loadUsers = async () => {
    try {
      const res = await api.get('/auth/users');
      setUsers(res.data.data);
    } catch { toast.error('Failed to load users'); }
    setLoading(false);
  };

  const filtered = users.filter((u) =>
    u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase())
  );

  const admins = filtered.filter((u) => u.role === 'admin');
  const members = filtered.filter((u) => u.role === 'member');

  return (
    <div>
      <div className="page-header flex-between">
        <div>
          <h1>User Management</h1>
          <p>{users.length} total users · {admins.length} admins · {members.length} members</p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
        {[
          { label: 'Total Users', value: users.length, color: 'var(--accent-primary)', bg: 'rgba(108,92,231,0.12)' },
          { label: 'Admins', value: admins.length, color: 'var(--accent-orange)', bg: 'rgba(253,203,110,0.12)' },
          { label: 'Members', value: members.length, color: 'var(--accent-cyan)', bg: 'rgba(0,206,201,0.12)' },
        ].map((s) => (
          <div key={s.label} className="card stat-card" style={{ flex: 1, minWidth: 140 }}>
            <div className="stat-value" style={{ color: s.color }}>{s.value}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="search-bar" style={{ marginBottom: 20, maxWidth: 400 }}>
        <Search size={16} style={{ color: 'var(--text-muted)' }} />
        <input placeholder="Search by name or email..." value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[...Array(5)].map((_, i) => <div key={i} className="skeleton" style={{ height: 70 }} />)}
        </div>
      ) : (
        <div className="card" style={{ overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                {['User', 'Email', 'Role', 'Joined', 'Status'].map((h) => (
                  <th key={h} style={{ padding: '12px 20px', textAlign: 'left', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((u, i) => (
                <motion.tr key={u.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                  style={{ borderBottom: '1px solid var(--border-color)', transition: 'background 0.2s' }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-hover)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <td style={{ padding: '14px 20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div className="avatar avatar-sm">
                        {u.avatar ? <img src={u.avatar} alt={u.name} /> : u.name?.[0]}
                      </div>
                      <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{u.name}</span>
                    </div>
                  </td>
                  <td style={{ padding: '14px 20px', color: 'var(--text-secondary)', fontSize: '0.88rem' }}>{u.email}</td>
                  <td style={{ padding: '14px 20px' }}>
                    <span className={`badge ${u.role === 'admin' ? 'badge-orange' : 'badge-cyan'}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                      {u.role === 'admin' ? <Shield size={10} /> : <User size={10} />}
                      {u.role}
                    </span>
                  </td>
                  <td style={{ padding: '14px 20px', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                    {u.createdAt ? format(parseISO(u.createdAt), 'MMM d, yyyy') : '—'}
                  </td>
                  <td style={{ padding: '14px 20px' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: '0.78rem', color: u.isActive ? 'var(--accent-green)' : 'var(--text-muted)' }}>
                      <div style={{ width: 6, height: 6, borderRadius: '50%', background: u.isActive ? 'var(--accent-green)' : 'var(--text-muted)' }} />
                      {u.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="empty-state"><div className="empty-state-icon"><Users size={40} /></div><h3>No users found</h3></div>
          )}
        </div>
      )}
    </div>
  );
}
