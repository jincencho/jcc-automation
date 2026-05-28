import React, { useState, useEffect } from 'react';

// Web Audio API Retro Sound Synthesizer with Bubble Tone
const playSound = (type) => {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    const now = ctx.currentTime;
    
    if (type === 'select') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(320, now);
      osc.frequency.exponentialRampToValueAtTime(480, now + 0.08);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.linearRampToValueAtTime(0, now + 0.08);
      osc.start(now);
      osc.stop(now + 0.08);
    } else if (type === 'pour') {
      // Bubbling liquid sound using pitch sweeps
      osc.type = 'sine';
      osc.frequency.setValueAtTime(200, now);
      osc.frequency.linearRampToValueAtTime(350, now + 0.08);
      osc.frequency.linearRampToValueAtTime(250, now + 0.16);
      osc.frequency.linearRampToValueAtTime(400, now + 0.24);
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.linearRampToValueAtTime(0, now + 0.25);
      osc.start(now);
      osc.stop(now + 0.25);
    } else if (type === 'win') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(523.25, now); // C5
      osc.frequency.setValueAtTime(659.25, now + 0.1); // E5
      osc.frequency.setValueAtTime(783.99, now + 0.2); // G5
      osc.frequency.setValueAtTime(1046.50, now + 0.3); // C6
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.linearRampToValueAtTime(0, now + 0.6);
      osc.start(now);
      osc.stop(now + 0.6);
    } else if (type === 'reset') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(400, now);
      osc.frequency.exponentialRampToValueAtTime(150, now + 0.2);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.linearRampToValueAtTime(0, now + 0.2);
      osc.start(now);
      osc.stop(now + 0.2);
    }
  } catch (e) {
    console.log("AudioContext blocked or not supported.");
  }
};

// Neon Colors mapped to Samsung BESPOKE themes (High Contrast Saturated Neon)
const COLOR_PALETTE = {
  pink: { hex: '#ff1a8c', name: '비스포크 핑크 (세탁기)' },
  blue: { hex: '#00b0ff', name: '비스포크 블루 (냉장고)' },
  green: { hex: '#00e676', name: '비스포크 그린 (식기세척기)' },
  gold: { hex: '#ffea00', name: '비스포크 골드 (인덕션)' },
  purple: { hex: '#d500f9', name: '비스포크 퍼플 (에어드레서)' }
};

// Level configurations
const LEVELS = [
  {
    level: 1,
    title: '입문 설계사',
    tubes: [
      ['pink', 'blue', 'pink', 'blue'],
      ['blue', 'pink', 'blue', 'pink'],
      [],
      []
    ]
  },
  {
    level: 2,
    title: '전문 상담사',
    tubes: [
      ['pink', 'blue', 'green', 'pink'],
      ['green', 'pink', 'blue', 'green'],
      ['blue', 'green', 'pink', 'blue'],
      [],
      []
    ]
  },
  {
    level: 3,
    title: '스토어 디렉터',
    tubes: [
      ['pink', 'blue', 'green', 'gold'],
      ['gold', 'pink', 'blue', 'green'],
      ['green', 'gold', 'pink', 'blue'],
      ['blue', 'green', 'gold', 'pink'],
      [],
      []
    ]
  },
  {
    level: 4,
    title: '진센조 가전마스터',
    tubes: [
      ['pink', 'blue', 'green', 'gold'],
      ['purple', 'gold', 'pink', 'blue'],
      ['green', 'purple', 'gold', 'pink'],
      ['blue', 'green', 'purple', 'gold'],
      ['purple', 'blue', 'green', 'purple'],
      [],
      []
    ]
  }
];

export default function ArcadeHub({ onBack, onNavigateToReservation }) {
  const [currentLevelIdx, setCurrentLevelIdx] = useState(0);
  const [tubes, setTubes] = useState([]);
  const [selectedIdx, setSelectedIdx] = useState(null);
  const [history, setHistory] = useState([]);
  const [gameState, setGameState] = useState('ready'); // 'ready', 'playing', 'win'
  const [moveCount, setMoveCount] = useState(0);
  const [bestScore, setBestScore] = useState(
    localStorage.getItem('hs_watersort_level') || 1
  );

  const currentLevel = LEVELS[currentLevelIdx];

  // Initialize level
  const initLevel = (levelIdx) => {
    const lvl = LEVELS[levelIdx];
    // Deep clone the tubes array
    const clonedTubes = lvl.tubes.map(t => [...t]);
    setTubes(clonedTubes);
    setSelectedIdx(null);
    setHistory([]);
    setMoveCount(0);
    setGameState('playing');
    playSound('reset');
  };

  useEffect(() => {
    initLevel(currentLevelIdx);
  }, [currentLevelIdx]);

  // Pour Logic
  const handleTubeClick = (clickedIdx) => {
    if (gameState !== 'playing') return;

    if (selectedIdx === null) {
      // Select source tube
      if (tubes[clickedIdx].length === 0) return; // Cannot select empty tube
      setSelectedIdx(clickedIdx);
      playSound('select');
    } else {
      // Selected source + Clicked target
      const sourceIdx = selectedIdx;
      setSelectedIdx(null); // Reset selection

      if (sourceIdx === clickedIdx) return; // Same tube clicked

      const source = tubes[sourceIdx];
      const target = tubes[clickedIdx];

      if (source.length === 0) return;
      if (target.length >= 4) return; // Target full

      const sourceColor = source[source.length - 1];
      const targetColor = target.length > 0 ? target[target.length - 1] : null;

      // Pour condition: Target must be empty OR top colors match
      if (targetColor !== null && targetColor !== sourceColor) return;

      // Calculate how many layers of the same color can be poured
      let pourCount = 0;
      for (let i = source.length - 1; i >= 0; i--) {
        if (source[i] === sourceColor) {
          pourCount++;
        } else {
          break;
        }
      }

      // Check available space in target
      const targetSpace = 4 - target.length;
      const finalPourCount = Math.min(pourCount, targetSpace);

      if (finalPourCount === 0) return;

      // Save history for Undo
      const historyState = tubes.map(t => [...t]);
      setHistory(prev => [...prev, historyState]);

      // Perform the pour
      const newTubes = tubes.map(t => [...t]);
      const pouredItems = newTubes[sourceIdx].splice(newTubes[sourceIdx].length - finalPourCount, finalPourCount);
      newTubes[clickedIdx] = [...newTubes[clickedIdx], ...pouredItems];

      setTubes(newTubes);
      setMoveCount(prev => prev + 1);
      playSound('pour');

      // Check win condition after pour
      checkWinCondition(newTubes);
    }
  };

  // Undo last move
  const handleUndo = () => {
    if (history.length === 0) return;
    const prevHistory = [...history];
    const prevState = prevHistory.pop();
    setTubes(prevState);
    setHistory(prevHistory);
    setMoveCount(prev => prev - 1);
    playSound('select');
  };

  // Check if user solved the puzzle
  const checkWinCondition = (currentTubes) => {
    const isSolved = currentTubes.every(tube => {
      if (tube.length === 0) return true; // Empty tube is valid
      if (tube.length < 4) return false;  // Must be filled to max (4 blocks)
      // All blocks must be the same color
      return tube.every(color => color === tube[0]);
    });

    if (isSolved) {
      setTimeout(() => {
        setGameState('win');
        playSound('win');
        const nextLevelNum = currentLevel.level + 1;
        if (nextLevelNum > bestScore) {
          localStorage.setItem('hs_watersort_level', nextLevelNum);
          setBestScore(nextLevelNum);
        }
      }, 400);
    }
  };

  return (
    <div style={{
      minHeight: '85vh',
      background: '#0a0a0c',
      color: '#f3f4f6',
      fontFamily: "'Outfit', 'Pretendard', sans-serif",
      padding: '2rem 1rem',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      position: 'relative',
      overflow: 'hidden',
      width: '100%'
    }}>
      {/* Background Glows */}
      <div style={{ position: 'absolute', top: '-10%', left: '-10%', width: '400px', height: '400px', borderRadius: '50%', background: 'rgba(99, 102, 241, 0.12)', filter: 'blur(120px)', pointerEvents: 'none' }}></div>
      <div style={{ position: 'absolute', bottom: '-10%', right: '-10%', width: '400px', height: '400px', borderRadius: '50%', background: 'rgba(236, 72, 153, 0.12)', filter: 'blur(120px)', pointerEvents: 'none' }}></div>

      {/* Header */}
      <div style={{ zIndex: 10, textAlign: 'center', marginBottom: '1.5rem', maxWidth: '600px', width: '100%' }}>
        <button 
          onClick={onBack} 
          style={{
            background: 'rgba(255, 255, 255, 0.08)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            color: '#cbd5e1',
            padding: '0.5rem 1.2rem',
            borderRadius: '20px',
            cursor: 'pointer',
            fontSize: 'clamp(0.75rem, 2.5vw, 0.85rem)',
            marginBottom: '1rem',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            transition: 'all 0.2s',
            fontWeight: 600
          }}
        >
          ← 메인 화면으로 가기
        </button>
        <h1 style={{
          fontSize: 'clamp(1.5rem, 6.5vw, 2.2rem)',
          fontWeight: 800,
          background: 'linear-gradient(135deg, #10b981 0%, #3b82f6 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          margin: '0.5rem 0',
          letterSpacing: '-1px',
          wordBreak: 'keep-all'
        }}>
          💎 JCC 네온 워터 소트
        </h1>
        <p style={{ color: '#94a3b8', fontSize: 'clamp(0.8rem, 3.2vw, 0.95rem)', margin: '0 auto', maxWidth: '460px', wordBreak: 'keep-all', lineHeight: '1.5' }}>
          시험관의 물약을 색상별로 분류해 보세요! 동일한 가전 색상끼리 모으면 마스터의 견적 할인률도 함께 올라갑니다! 🧪
        </p>
      </div>

      {/* Stats Board */}
      <div style={{
        zIndex: 10,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: 'rgba(20, 20, 30, 0.6)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '16px',
        padding: '0.75rem 1.25rem',
        width: '100%',
        maxWidth: '480px',
        marginBottom: '1.5rem',
        boxSizing: 'border-box',
        fontSize: 'clamp(0.8rem, 3vw, 0.95rem)',
        fontWeight: 600,
        backdropFilter: 'blur(10px)'
      }}>
        <span style={{ color: '#10b981' }}>Level {currentLevel.level} ({currentLevel.title})</span>
        <span style={{ color: '#f59e0b' }}>이동 횟수: {moveCount}회</span>
        <span style={{ color: '#cbd5e1' }}>최고 Level: {bestScore}</span>
      </div>

      {/* Tubes Arena */}
      <div style={{
        zIndex: 10,
        width: '100%',
        maxWidth: '480px',
        background: 'rgba(15, 15, 25, 0.5)',
        border: '1px solid rgba(255, 255, 255, 0.05)',
        borderRadius: '24px',
        padding: '2rem 1rem',
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: 'clamp(1rem, 4vw, 2rem)',
        boxSizing: 'border-box',
        marginBottom: '1.5rem',
        boxShadow: 'inset 0 0 20px rgba(0, 0, 0, 0.6)'
      }}>
        {tubes.map((tube, tubeIdx) => {
          const isSelected = selectedIdx === tubeIdx;
          return (
            <div 
              key={tubeIdx}
              onClick={() => handleTubeClick(tubeIdx)}
              style={{
                width: 'clamp(50px, 12vw, 65px)',
                height: 'clamp(180px, 40vw, 220px)',
                border: isSelected ? '3.5px solid #00e676' : '2px solid #8e9cae', // Highly visible solid metallic border
                borderRadius: '0 0 35px 35px',
                background: 'rgba(30, 30, 45, 0.85)', // Denser high-contrast slate backing
                boxShadow: isSelected 
                  ? '0 0 25px rgba(0, 230, 118, 0.5), inset 0 0 10px rgba(255,255,255,0.1)' 
                  : 'inset 0 0 15px rgba(0, 0, 0, 0.7)',
                display: 'flex',
                flexDirection: 'column-reverse',
                justifyContent: 'flex-start',
                padding: '6px',
                cursor: 'pointer',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                transform: isSelected ? 'translateY(-12px)' : 'none',
                position: 'relative'
              }}
            >
              {/* Highlight selector */}
              {isSelected && (
                <div style={{
                  position: 'absolute',
                  top: '-15px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  fontSize: '0.75rem',
                  color: '#10b981',
                  fontWeight: 900,
                  animation: 'bounce 0.6s infinite alternate'
                }}>
                  ▼
                </div>
              )}

              {/* Fluid Layers */}
              {tube.map((colorName, layerIdx) => (
                <div 
                  key={layerIdx}
                  style={{
                    height: '23%',
                    width: '100%',
                    background: COLOR_PALETTE[colorName].hex,
                    borderRadius: layerIdx === 0 ? '0 0 28px 28px' : '4px',
                    marginBottom: '3px',
                    boxShadow: `0 0 15px ${COLOR_PALETTE[colorName].hex}80, inset 0 2px 4px rgba(255,255,255,0.4)`,
                    transition: 'all 0.4s ease',
                    position: 'relative',
                    overflow: 'hidden'
                  }}
                  title={COLOR_PALETTE[colorName].name}
                >
                  {/* Micro-sparkle glow */}
                  <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '150%',
                    height: '100%',
                    background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent)',
                    transform: 'translateX(-100%)',
                    animation: 'shine 2s infinite linear'
                  }}></div>
                </div>
              ))}
            </div>
          );
        })}
      </div>

      {/* Control Buttons */}
      <div style={{
        zIndex: 10,
        display: 'flex',
        gap: '1rem',
        width: '100%',
        maxWidth: '480px',
        justifyContent: 'center',
        marginBottom: '2rem'
      }}>
        <button 
          onClick={handleUndo}
          disabled={history.length === 0}
          style={{
            flex: 1,
            background: history.length === 0 ? 'rgba(255, 255, 255, 0.02)' : 'rgba(255, 255, 255, 0.08)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            color: history.length === 0 ? '#64748b' : '#cbd5e1',
            padding: '0.8rem',
            borderRadius: '12px',
            cursor: history.length === 0 ? 'not-allowed' : 'pointer',
            fontSize: 'clamp(0.8rem, 2.8vw, 0.95rem)',
            fontWeight: 700,
            transition: 'all 0.2s'
          }}
        >
          ↩ 한 수 되돌리기
        </button>
        <button 
          onClick={() => initLevel(currentLevelIdx)}
          style={{
            flex: 1,
            background: 'rgba(244, 63, 94, 0.15)',
            border: '1px solid rgba(244, 63, 94, 0.3)',
            color: '#f43f5e',
            padding: '0.8rem',
            borderRadius: '12px',
            cursor: 'pointer',
            fontSize: 'clamp(0.8rem, 2.8vw, 0.95rem)',
            fontWeight: 700,
            transition: 'all 0.2s'
          }}
        >
          🔄 처음부터 다시
        </button>
      </div>

      {/* Screens / Modals */}
      {gameState === 'win' && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'rgba(10, 10, 15, 0.95)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          padding: '1.5rem',
          boxSizing: 'border-box'
        }}>
          <div style={{ textAlign: 'center', maxWidth: '380px', width: '100%' }}>
            <h2 style={{ color: '#10b981', margin: '0 0 0.5rem 0', fontSize: 'clamp(1.6rem, 6vw, 2.2rem)', fontWeight: 800 }}>🏆 LEVEL CLEAR!</h2>
            <p style={{ margin: '0 0 1.5rem 0', fontSize: 'clamp(0.95rem, 3.2vw, 1.1rem)', color: '#cbd5e1' }}>
              총 {moveCount}회 만에 가전을 완벽 분류하셨습니다!
            </p>
            
            <div style={{
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '16px',
              padding: '1.25rem',
              margin: '1rem 0',
              textAlign: 'left',
              fontSize: 'clamp(0.8rem, 2.8vw, 0.9rem)',
              lineHeight: '1.5',
              color: '#94a3b8',
              wordBreak: 'keep-all'
            }}>
              <span style={{ fontWeight: 800, color: '#10b981', display: 'block', marginBottom: '0.5rem' }}>🎁 마스터의 가전 견적 꿀팁!</span>
              "가전을 종류와 색상별로 맞춤 큐레이션 하듯, 갤러리아진주 조준석 매니저에게 정밀 설계를 받아보세요. 백화점과 로드샵의 강점만을 딱 맞춰 결합해 드립니다!"
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1.5rem' }}>
              <button 
                onClick={onNavigateToReservation}
                style={{
                  background: 'linear-gradient(135deg, #10b981 0%, #3b82f6 100%)',
                  color: '#ffffff',
                  border: 'none',
                  padding: '0.85rem',
                  borderRadius: '12px',
                  fontWeight: 800,
                  fontSize: 'clamp(0.85rem, 3vw, 1rem)',
                  cursor: 'pointer',
                  boxShadow: '0 4px 15px rgba(16, 185, 129, 0.3)'
                }}
              >
                1:1 무료 가전 맞춤설계 상담받기 💍
              </button>
              
              {currentLevelIdx < LEVELS.length - 1 ? (
                <button 
                  onClick={() => {
                    setCurrentLevelIdx(prev => prev + 1);
                    setGameState('playing');
                  }}
                  style={{
                    background: 'rgba(255, 255, 255, 0.95)',
                    color: '#0f172a',
                    border: 'none',
                    padding: '0.85rem',
                    borderRadius: '12px',
                    fontWeight: 800,
                    fontSize: 'clamp(0.85rem, 3vw, 1rem)',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  다음 레벨 도전 🚀
                </button>
              ) : (
                <button 
                  onClick={() => {
                    setCurrentLevelIdx(0);
                    setGameState('playing');
                  }}
                  style={{
                    background: 'rgba(255, 255, 255, 0.95)',
                    color: '#0f172a',
                    border: 'none',
                    padding: '0.85rem',
                    borderRadius: '12px',
                    fontWeight: 800,
                    fontSize: 'clamp(0.85rem, 3vw, 1rem)',
                    cursor: 'pointer'
                  }}
                >
                  첫 레벨부터 다시하기 🔄
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
