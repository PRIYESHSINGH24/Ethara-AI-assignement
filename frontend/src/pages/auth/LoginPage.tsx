import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Zap, CheckCircle, Users, BarChart3 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const features = [
  { icon: <CheckCircle size={20} />, text: 'Task assignment & tracking' },
  { icon: <Users size={20} />, text: 'Role-based team management' },
  { icon: <BarChart3 size={20} />, text: 'Real-time progress dashboards' },
];

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      toast.success('Welcome back! 🚀');
      navigate('/dashboard');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      {/* Left Panel */}
      <div className="auth-left">
        <motion.div
          initial={{ opacity: 0, x: -40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          style={{ maxWidth: 480, width: '100%' }}
        >
          <div className="flex items-center gap-2 mb-6" style={{ marginBottom: 40 }}>
            <div style={{
              width: 42, height: 42, borderRadius: 12,
              background: 'var(--gradient-primary)',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <Zap size={22} color="white" />
            </div>
            <span style={{ fontSize: '1.4rem', fontWeight: 800 }}>Qphoria</span>
          </div>

          <h1 style={{ marginBottom: 16 }}>
            Manage teams,<br />
            <span className="glow-text">ship faster.</span>
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem', marginBottom: 40, lineHeight: 1.7 }}>
            The modern task manager built for ambitious teams. Organize, track, and deliver — all in one place.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {features.map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + i * 0.1 }}
                className="flex items-center gap-3"
              >
                <div style={{
                  color: 'var(--accent-cyan)',
                  background: 'rgba(0,206,201,0.1)',
                  padding: 8, borderRadius: 8
                }}>{f.icon}</div>
                <span style={{ color: 'var(--text-secondary)' }}>{f.text}</span>
              </motion.div>
            ))}
          </div>

          {/* Floating cards decoration */}
          <motion.div
            animate={{ y: [0, -12, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            style={{
              marginTop: 48,
              background: 'var(--bg-glass)',
              border: '1px solid var(--border-color)',
              borderRadius: 16, padding: '16px 20px',
              backdropFilter: 'blur(20px)',
              display: 'flex', alignItems: 'center', gap: 12,
              width: 'fit-content'
            }}
          >
            <div style={{
              width: 36, height: 36, borderRadius: '50%',
              background: 'var(--gradient-primary)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '0.8rem', fontWeight: 700, color: 'white'
            }}>A</div>
            <div>
              <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>Alex just completed</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--accent-green)' }}>✓ Design system setup</div>
            </div>
          </motion.div>
        </motion.div>
      </div>

      {/* Right Panel */}
      <div className="auth-right">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="auth-box"
        >
          <div className="auth-card">
            <h2 style={{ marginBottom: 8 }}>Sign in</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 28, fontSize: '0.9rem' }}>
              Welcome back! Enter your credentials.
            </p>

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Email</label>
                <input
                  type="email" className="form-input"
                  placeholder="you@company.com"
                  value={email} onChange={(e) => setEmail(e.target.value)}
                  required autoFocus
                />
              </div>

              <div className="form-group">
                <label className="form-label">Password</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPass ? 'text' : 'password'}
                    className="form-input"
                    placeholder="••••••••"
                    value={password} onChange={(e) => setPassword(e.target.value)}
                    required style={{ paddingRight: 44 }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                  >
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <motion.button
                type="submit" className="btn btn-primary btn-full btn-lg"
                disabled={loading}
                whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
                style={{ marginTop: 8 }}
              >
                {loading ? <><div className="spinner" style={{ width: 18, height: 18 }} /> Signing in...</> : 'Sign In →'}
              </motion.button>
            </form>

            <div className="divider" />

            <p style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
              Don't have an account?{' '}
              <Link to="/signup" style={{ color: 'var(--accent-secondary)', fontWeight: 600 }}>
                Sign up free
              </Link>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
