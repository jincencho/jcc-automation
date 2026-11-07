import React, { useState } from 'react';
import Hero from './components/Hero';
import Reservation from './components/Reservation';
import AdminSchedule from './components/AdminSchedule';
import About from './components/About';
import WhySamsung from './components/WhySamsung';
import BenefitCalculator from './components/BenefitCalculator';
import './index.css';

function App() {
  const [currentView, setCurrentView] = useState('home'); // 'home', 'admin', 'reservation', 'about', 'why-samsung', 'calculator'

  // 페이지 진입 시 UTM 태그 캡처 및 페이지 이동 시 최상단으로 스크롤
  React.useEffect(() => {
    // UTM 태그 캡처
    const params = new URLSearchParams(window.location.search);
    const utmTags = {
      utm_source: params.get('utm_source'),
      utm_medium: params.get('utm_medium'),
      utm_campaign: params.get('utm_campaign'),
      utm_content: params.get('utm_content'),
      utm_term: params.get('utm_term'),
    };
    
    if (utmTags.utm_source) {
      sessionStorage.setItem('jcc_utm_tags', JSON.stringify(utmTags));
    }

    window.scrollTo(0, 0);
  }, [currentView]);

  return (
    <div className="app-container">
      {/* Navigation Bar (Simple Mock) */}
      <nav className="site-nav" style={{ padding: '1.5rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--glass-border)', background: 'var(--bg-color)', position: 'sticky', top: 0, zIndex: 100 }}>
        <div 
          onClick={() => setCurrentView('home')}
          className="navbar-logo-container"
          style={{ 
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            height: 'var(--nav-logo-height)'
          }}
        >
          <img 
            src="/images/logo_new.png" 
            alt="JINCENCHO" 
            style={{ 
              height: '100%', 
              width: 'auto',
              objectFit: 'contain',
              filter: 'drop-shadow(0 1px 3px rgba(0,0,0,0.2))'
            }} 
          />
        </div>
        <div className="nav-links" style={{ display: 'flex', gap: 'clamp(0.5rem, 2.5vw, 1.5rem)', fontWeight: 600, color: 'var(--text-secondary)', fontSize: 'clamp(0.72rem, 2.4vw, 0.95rem)', whiteSpace: 'nowrap', flexWrap: 'nowrap' }}>
          <a href="#" onClick={(e) => { e.preventDefault(); setCurrentView('about'); }} style={{ color: currentView === 'about' || currentView === 'why-samsung' ? 'var(--text-primary)' : 'inherit', textDecoration: 'none' }}>더 알아보기</a>
          <a href="#" onClick={(e) => { e.preventDefault(); setCurrentView('reservation'); }} style={{ color: currentView === 'reservation' ? 'var(--text-primary)' : 'inherit', textDecoration: 'none' }}>상담 예약</a>
          <a href="#" onClick={(e) => { e.preventDefault(); setCurrentView('calculator'); }} style={{ color: currentView === 'calculator' ? 'var(--accent-gold-light)' : 'inherit', textDecoration: 'none' }}>혜택 계산기</a>
          <a href="#" onClick={(e) => { e.preventDefault(); setCurrentView('admin'); }} style={{ color: currentView === 'admin' ? 'var(--text-primary)' : 'inherit', textDecoration: 'none' }}>관리자</a>
        </div>
      </nav>

      <main>
        {currentView === 'home' && <Hero onNavigateToReservation={() => setCurrentView('reservation')} onNavigateToAbout={() => setCurrentView('about')} />}
        {currentView === 'about' && <About onNavigateToWhySamsung={() => setCurrentView('why-samsung')} onBack={() => setCurrentView('home')} />}
        {currentView === 'why-samsung' && <WhySamsung onBack={() => setCurrentView('about')} />}
        {currentView === 'reservation' && <Reservation onBack={() => setCurrentView('home')} />}
        {currentView === 'admin' && <AdminSchedule onBack={() => setCurrentView('home')} />}
        {currentView === 'calculator' && <BenefitCalculator onBack={() => setCurrentView('home')} />}
      </main>

      <footer className="site-footer" style={{ textAlign: 'center', padding: '3rem 2rem', color: 'var(--text-secondary)', borderTop: '1px solid var(--glass-border)', marginTop: '4rem' }}>
        <p>&copy; 2026 JCC (JINJU CENTUM CHOJUNSEOK). All rights reserved.</p>
      </footer>
    </div>
  );
}

export default App;
