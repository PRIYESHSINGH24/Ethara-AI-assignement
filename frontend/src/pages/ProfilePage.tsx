import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Mail, Shield, Save } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { format, parseISO } from 'date-fns';

export default function ProfilePage() {
  const { user, updateProfile } = useAuth();
  const [form, setForm] = useState({ name: user?.name || '', bio: user?.bio || '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await updateProfile(form);
      toast.success('Profile updated!');
    } catch { toast.error('Failed to update profile'); }
    setLoading(false);
  };

  const initials = user?.name?.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) || 'U';

  return (
    <div style={{ maxWidth: 700, margin: '0 auto' }}>
      <div className="page-header"><h1>Profile</h1><p>Manage your account details</p></div>

      <div className="card card-body" style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 24 }}>
          <motion.div className="avatar avatar-xl" whileHover={{ scale: 1.05 }}>
            {user?.avatar ? <img src={user.avatar} alt={user.name} /> : initials}
          </motion.div>
          <div>
            <h3>{user?.name}</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{user?.email}</p>
            <span className={`badge ${user?.role === 'admin' ? 'badge-orange' : 'badge-cyan'}`} style={{ marginTop: 6 }}>
              {user?.role === 'admin' ? <><Shield size={10} /> Admin</> : <><User size={10} /> Member</>}
            </span>
          </div>
        </div>

        <div className="divider" />

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, padding: '16px 0' }}>
          {[
            { label: 'Member Since', value: user?.createdAt ? format(parseISO(user.createdAt), 'MMMM d, yyyy') : '—', icon: <Mail size={14} /> },
            { label: 'Account Status', value: 'Active', icon: <User size={14} /> },
          ].map((item) => (
            <div key={item.label} style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 10, padding: '12px 16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)', fontSize: '0.72rem', textTransform: 'uppercase', marginBottom: 6 }}>{item.icon}{item.label}</div>
              <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{item.value}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="card card-body">
        <h4 style={{ marginBottom: 20 }}>Edit Profile</h4>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input className="form-input" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} required />
          </div>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input className="form-input" value={user?.email} disabled style={{ opacity: 0.6, cursor: 'not-allowed' }} />
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Email cannot be changed</span>
          </div>
          <div className="form-group">
            <label className="form-label">Bio</label>
            <textarea className="form-textarea" placeholder="Tell us about yourself..." value={form.bio} onChange={(e) => setForm((p) => ({ ...p, bio: e.target.value }))} style={{ minHeight: 100 }} />
          </div>
          <motion.button type="submit" className="btn btn-primary" disabled={loading} whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
            {loading ? <><div className="spinner" style={{ width: 16, height: 16 }} /> Saving...</> : <><Save size={16} /> Save Changes</>}
          </motion.button>
        </form>
      </div>
    </div>
  );
}
