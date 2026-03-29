import React from 'react';

const App: React.FC = () => {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      fontFamily: "'Cormorant Garamond', serif",
      backgroundColor: '#FFF8F0',
      color: '#333',
    }}>
      <div style={{ textAlign: 'center' }}>
        <h1 style={{ fontSize: '3rem', fontWeight: 300, marginBottom: '0.5rem' }}>
          ✨ Soul Journal ✨
        </h1>
        <p style={{ fontFamily: "'Quicksand', sans-serif", color: '#999', fontSize: '1.1rem' }}>
          Your sacred space for reflection
        </p>
      </div>
    </div>
  );
};

export default App;
