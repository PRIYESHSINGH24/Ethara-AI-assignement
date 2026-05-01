import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, ArrowLeft } from 'lucide-react';

export default function NotFoundPage() {
  const navigate = useNavigate();
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary)', padding: 20, position: 'relative', overflow: 'hidden' }}>
      {/* Background glow */}
      <div style={{ position: 'absolute', top: '30%', left: '50%', transform: 'translate(-50%,-50%)', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(108,92,231,0.08) 0%, transparent 70%)', pointerEvents: 'none' }} />

      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} style={{ textAlign: 'center', zIndex: 1 }}>
        {/* Big 404 */}
        <motion.div
          animate={{ y: [0, -12, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          style={{ fontSize: 'clamp(80px, 20vw, 160px)', fontWeight: 900, lineHeight: 1, background: 'var(--gradient-primary)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', marginBottom: 8 }}
        >
          404
        </motion.div>

        <h2 style={{ fontSize: '1.6rem', fontWeight: 700, marginBottom: 12 }}>Page not found</h2>
        <p style={{ color: 'var(--text-secondary)', maxWidth: 380, margin: '0 auto 32px', lineHeight: 1.7 }}>
          The page you're looking for doesn't exist or you don't have permission to view it.
        </p>

        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <motion.button className="btn btn-secondary" onClick={() => navigate(-1)} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <ArrowLeft size={16} /> Go back
          </motion.button>
          <motion.button className="btn btn-primary" onClick={() => navigate('/dashboard')} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Home size={16} /> Dashboard
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}
