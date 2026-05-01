import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Mail, Shield, Save, Lock, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import api from '../../lib/api';
import toast from 'react-hot-toast';
import { format, parseISO } from 'date-fns';

export default function ProfilePage() {
  const { user, updateProfile } = useAuth();
  const [form, setForm] = useState({ name: user?.name || '', bio: user?.bio || '' });
  const [loading, setLoading] = useState(false);

  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [pwLoading, setPwLoading] = useState(false);

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await updateProfile(form);
      toast.success('Profile updated successfully');
    } catch {
      toast.error('Failed to update profile');
    }
    setLoading(false);
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    if (pwForm.newPassword.length < 6) {
      toast.error('New password must be at least 6 characters');
      return;
    }
    setPwLoading(true);
    try {
      await api.put('/auth/password', {
        currentPassword: pwForm.currentPassword,
        newPassword: pwForm.newPassword,
      });
      toast.success('Password changed successfully');
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to change password');
    }
    setPwLoading(false);
  };

  const initials = user?.name?.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) || 'U';

  return (
    <div style={{ maxWidth: 700, margin: '0 auto' }}>
      <div className="page-header"><h1>Profile</h1><p>Manage your account details and security</p></div>

      {/* Account info card */}
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
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, paddingTop: 16 }}>
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

      {/* Edit profile */}
      <div className="card card-body" style={{ marginBottom: 20 }}>
        <h4 style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}><User size={16} /> Edit Profile</h4>
        <form onSubmit={handleProfileSubmit}>
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input className="form-input" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} required />
          </div>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input className="form-input" value={user?.email} disabled style={{ opacity: 0.5, cursor: 'not-allowed' }} />
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Email cannot be changed</span>
          </div>
          <div className="form-group">
            <label className="form-label">Bio</label>
            <textarea className="form-textarea" placeholder="Tell us about yourself..." value={form.bio} onChange={(e) => setForm((p) => ({ ...p, bio: e.target.value }))} style={{ minHeight: 90 }} />
          </div>
          <motion.button type="submit" className="btn btn-primary" disabled={loading} whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
            {loading ? <><div className="spinner" style={{ width: 16, height: 16 }} /> Saving...</> : <><Save size={16} /> Save Changes</>}
          </motion.button>
        </form>
      </div>

      {/* Change password */}
      <div className="card card-body">
        <h4 style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}><Lock size={16} /> Change Password</h4>
        <form onSubmit={handlePasswordSubmit}>
          <div className="form-group">
            <label className="form-label">Current Password</label>
            <div style={{ position: 'relative' }}>
              <input type={showCurrent ? 'text' : 'password'} className="form-input" placeholder="Enter current password" value={pwForm.currentPassword} onChange={(e) => setPwForm((p) => ({ ...p, currentPassword: e.target.value }))} required style={{ paddingRight: 44 }} />
              <button type="button" onClick={() => setShowCurrent(!showCurrent)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                {showCurrent ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">New Password</label>
            <div style={{ position: 'relative' }}>
              <input type={showNew ? 'text' : 'password'} className="form-input" placeholder="Min. 6 characters" value={pwForm.newPassword} onChange={(e) => setPwForm((p) => ({ ...p, newPassword: e.target.value }))} required style={{ paddingRight: 44 }} />
              <button type="button" onClick={() => setShowNew(!showNew)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                {showNew ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Confirm New Password</label>
            <input type="password" className="form-input" placeholder="Repeat new password" value={pwForm.confirmPassword} onChange={(e) => setPwForm((p) => ({ ...p, confirmPassword: e.target.value }))} required />
            {pwForm.confirmPassword && pwForm.newPassword !== pwForm.confirmPassword && (
              <span className="form-error">Passwords do not match</span>
            )}
          </div>
          <motion.button type="submit" className="btn btn-primary" disabled={pwLoading} whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
            {pwLoading ? <><div className="spinner" style={{ width: 16, height: 16 }} /> Updating...</> : <><Lock size={16} /> Change Password</>}
          </motion.button>
        </form>
      </div>
    </div>
  );
}
