import React from 'react';
import Link from 'next/link';

export default function NotFoundPage() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #1a237e 0%, #283593 100%)',
      color: '#fff',
      position: 'relative',
      overflow: 'hidden',
    }}>
      <div style={{ fontSize: '6rem', fontWeight: 'bold', position: 'relative', zIndex: 2 }}>
        404
      </div>
      <div style={{ position: 'relative', zIndex: 2, marginBottom: '2rem', fontSize: '2rem', fontWeight: 500 }}>
        Look like you’re lost in space
      </div>
      <div style={{ position: 'relative', zIndex: 2, marginBottom: '2rem' }}>
        <img src="/astro404.png" alt="Astronaut" style={{ width: '320px', marginBottom: '1rem' }} />
      </div>
      <Link href="/">
        <button style={{
          background: '#fff',
          color: '#283593',
          border: 'none',
          borderRadius: '8px',
          padding: '0.75rem 2rem',
          fontWeight: 'bold',
          fontSize: '1.1rem',
          cursor: 'pointer',
          boxShadow: '0 2px 8px rgba(40,53,147,0.2)',
        }}>
          GO BACK
        </button>
      </Link>
      {/* Decorative space elements */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 1,
        pointerEvents: 'none',
      }}>
        {/* Stars */}
        {[...Array(80)].map((_, i) => (
          <div key={i} style={{
            position: 'absolute',
            top: `${Math.random() * 100}%`,
            left: `${Math.random() * 100}%`,
            width: '3px',
            height: '3px',
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.7)',
            opacity: Math.random(),
          }} />
        ))}
        {/* Planets */}
        <div style={{
          position: 'absolute',
          top: '10%',
          left: '5%',
          width: '120px',
          height: '120px',
          borderRadius: '50%',
          background: 'rgba(40,53,147,0.3)',
          filter: 'blur(2px)',
        }} />
        <div style={{
          position: 'absolute',
          bottom: '15%',
          right: '8%',
          width: '180px',
          height: '180px',
          borderRadius: '50%',
          background: 'rgba(26,35,126,0.4)',
          filter: 'blur(3px)',
        }} />
      </div>
    </div>
  );
}
