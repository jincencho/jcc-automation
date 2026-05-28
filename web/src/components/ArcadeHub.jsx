import React, { useState, useEffect, useRef } from 'react';

// Web Audio API Retro Sound Synthesizer with Bubble & Merge Tones
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
    } else if (type === 'pour' || type === 'drop') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(200, now);
      osc.frequency.linearRampToValueAtTime(350, now + 0.08);
      osc.frequency.linearRampToValueAtTime(250, now + 0.16);
      osc.frequency.linearRampToValueAtTime(400, now + 0.24);
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.linearRampToValueAtTime(0, now + 0.25);
      osc.start(now);
      osc.stop(now + 0.25);
    } else if (type === 'merge') {
      // Satisying upward ding
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(523.25, now); // C5
      osc.frequency.exponentialRampToValueAtTime(783.99, now + 0.12); // G5
      osc.frequency.exponentialRampToValueAtTime(1046.50, now + 0.24); // C6
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.linearRampToValueAtTime(0, now + 0.3);
      osc.start(now);
      osc.stop(now + 0.3);
    } else if (type === 'win') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, now); // C5
      osc.frequency.setValueAtTime(659.25, now + 0.1); // E5
      osc.frequency.setValueAtTime(783.99, now + 0.2); // G5
      osc.frequency.setValueAtTime(1046.50, now + 0.3); // C6
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.linearRampToValueAtTime(0, now + 0.8);
      osc.start(now);
      osc.stop(now + 0.8);
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

// ==========================================
// SHARED GENERAL STYLES & LOBBY SYSTEM
// ==========================================
export default function ArcadeHub({ onBack, onNavigateToReservation }) {
  const [activeGame, setActiveGame] = useState(null); // 'watersort', 'merge'
  const [bestScores, setBestScores] = useState({
    watersort: localStorage.getItem('hs_watersort_level') || 1,
    merge: localStorage.getItem('hs_merge_score') || 0
  });

  const handleBackToLobby = () => {
    setActiveGame(null);
    // Reload highscores
    setBestScores({
      watersort: localStorage.getItem('hs_watersort_level') || 1,
      merge: localStorage.getItem('hs_merge_score') || 0
    });
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

      {!activeGame ? (
        // ==========================
        // GRAND LOBBY VIEW
        // ==========================
        <div style={{ zIndex: 10, textAlign: 'center', maxWidth: '600px', width: '100%' }}>
          <button 
            onClick={onBack} 
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              color: '#cbd5e1',
              padding: '0.5rem 1.2rem',
              borderRadius: '20px',
              cursor: 'pointer',
              fontSize: '0.85rem',
              marginBottom: '1.5rem',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              transition: 'all 0.2s',
              fontWeight: 600
            }}
          >
            ← 메인 홈으로 가기
          </button>
          <h1 style={{
            fontSize: 'clamp(1.75rem, 6.5vw, 2.5rem)',
            fontWeight: 800,
            background: 'linear-gradient(135deg, #10b981 0%, #ec4899 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            margin: '0.5rem 0',
            letterSpacing: '-1.5px',
            wordBreak: 'keep-all'
          }}>
            JCC 아케이드 게임존
          </h1>
          <p style={{ color: '#94a3b8', fontSize: 'clamp(0.85rem, 3.5vw, 0.95rem)', marginBottom: '2.5rem', wordBreak: 'keep-all', lineHeight: '1.4' }}>
            가벼운 미니게임도 즐기고, 가전 큐레이션 마스터 조준석 매니저의 특별한 성지 혜택도 만나보세요!
          </p>

          {/* Game Selection Cards */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr',
            gap: '1.5rem',
            width: '100%',
            maxWidth: '480px',
            margin: '0 auto',
            boxSizing: 'border-box'
          }}>
            {/* Card 1: Neon Water Sort */}
            <div 
              onClick={() => { setActiveGame('watersort'); playSound('select'); }}
              style={cardStyle('#10b981')}
            >
              <div style={badgeStyle('#10b981')}>POUR & SORT</div>
              <h3 style={cardTitleStyle}>🧪 JCC 네온 워터 소트</h3>
              <p style={cardDescStyle}>시험관의 컬러 액체를 색상별로 이쁘게 분류하여 정렬해보세요!</p>
              <div style={scoreBadgeStyle}>최고 등급: 레벨 {bestScores.watersort}</div>
            </div>

            {/* Card 2: Bespoke Merge Shooting (Suika) */}
            <div 
              onClick={() => { setActiveGame('merge'); playSound('select'); }}
              style={cardStyle('#ec4899')}
            >
              <div style={badgeStyle('#ec4899')}>MERGE PUZZLE</div>
              <h3 style={cardTitleStyle}>🍉 비스포크 가전 머지 게임</h3>
              <p style={cardDescStyle}>가전을 떨어뜨려 병합하고 최고의 비스포크 마이크로 RGB TV를 완성하세요!</p>
              <div style={scoreBadgeStyle}>최고 점수: {bestScores.merge}점</div>
            </div>
          </div>
        </div>
      ) : (
        // ==========================
        // ACTIVE GAME AREA
        // ==========================
        <div style={{ zIndex: 10, width: '100%', display: 'flex', justifyContent: 'center' }}>
          {activeGame === 'watersort' && (
            <WaterSortGame onBack={handleBackToLobby} onNavigateToReservation={onNavigateToReservation} />
          )}
          {activeGame === 'merge' && (
            <BespokeMergeGame onBack={handleBackToLobby} onNavigateToReservation={onNavigateToReservation} />
          )}
        </div>
      )}
    </div>
  );
}

// Lobby Style Helpers
const cardStyle = (glowColor) => ({
  background: 'rgba(30, 30, 45, 0.45)',
  border: '1.5px solid rgba(255, 255, 255, 0.08)',
  borderRadius: '20px',
  padding: '1.5rem',
  cursor: 'pointer',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  backdropFilter: 'blur(20px)',
  boxShadow: `0 4px 30px rgba(0, 0, 0, 0.4)`,
  textAlign: 'left',
  position: 'relative',
  overflow: 'hidden',
  ':hover': {
    transform: 'translateY(-6px)',
    borderColor: glowColor
  }
});

const badgeStyle = (bgColor) => ({
  display: 'inline-block',
  background: bgColor,
  color: '#0f172a',
  fontSize: 'clamp(0.7rem, 2.5vw, 0.75rem)',
  fontWeight: 800,
  padding: '0.2rem 0.6rem',
  borderRadius: '20px',
  marginBottom: '0.75rem',
  letterSpacing: '0.5px'
});

const cardTitleStyle = {
  fontSize: 'clamp(1.15rem, 4.5vw, 1.3rem)',
  fontWeight: 700,
  margin: '0 0 0.5rem 0',
  color: '#f8fafc'
};

const cardDescStyle = {
  fontSize: 'clamp(0.78rem, 3.2vw, 0.85rem)',
  color: '#94a3b8',
  margin: '0 0 1.25rem 0',
  lineHeight: '1.4'
};

const scoreBadgeStyle = {
  display: 'inline-flex',
  fontSize: 'clamp(0.75rem, 3vw, 0.82rem)',
  fontWeight: 700,
  color: '#e2e8f0',
  background: 'rgba(255, 255, 255, 0.05)',
  padding: '0.35rem 0.8rem',
  borderRadius: '12px',
  border: '1px solid rgba(255, 255, 255, 0.05)'
};

// ============================================================================
// GAME 1: NEON WATER SORT GAME COMPONENT
// ============================================================================
const WATER_SORT_COLORS = {
  pink: { hex: '#ff1a8c', name: '비스포크 핑크 (세탁기)' },
  blue: { hex: '#00b0ff', name: '비스포크 블루 (냉장고)' },
  green: { hex: '#00e676', name: '비스포크 그린 (식기세척기)' },
  gold: { hex: '#ffea00', name: '비스포크 골드 (인덕션)' },
  purple: { hex: '#d500f9', name: '비스포크 퍼플 (에어드레서)' }
};

const WATER_SORT_LEVELS = [
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

function WaterSortGame({ onBack, onNavigateToReservation }) {
  const [currentLevelIdx, setCurrentLevelIdx] = useState(0);
  const [tubes, setTubes] = useState([]);
  const [selectedIdx, setSelectedIdx] = useState(null);
  const [history, setHistory] = useState([]);
  const [gameState, setGameState] = useState('playing'); // 'playing', 'win'
  const [moveCount, setMoveCount] = useState(0);
  const [bestScore, setBestScore] = useState(
    localStorage.getItem('hs_watersort_level') || 1
  );

  const currentLevel = WATER_SORT_LEVELS[currentLevelIdx];

  const initLevel = (levelIdx) => {
    const lvl = WATER_SORT_LEVELS[levelIdx];
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

  const handleTubeClick = (clickedIdx) => {
    if (gameState !== 'playing') return;

    if (selectedIdx === null) {
      if (tubes[clickedIdx].length === 0) return;
      setSelectedIdx(clickedIdx);
      playSound('select');
    } else {
      const sourceIdx = selectedIdx;
      setSelectedIdx(null);

      if (sourceIdx === clickedIdx) return;

      const source = tubes[sourceIdx];
      const target = tubes[clickedIdx];

      if (source.length === 0) return;
      if (target.length >= 4) return;

      const sourceColor = source[source.length - 1];
      const targetColor = target.length > 0 ? target[target.length - 1] : null;

      if (targetColor !== null && targetColor !== sourceColor) return;

      let pourCount = 0;
      for (let i = source.length - 1; i >= 0; i--) {
        if (source[i] === sourceColor) pourCount++;
        else break;
      }

      const targetSpace = 4 - target.length;
      const finalPourCount = Math.min(pourCount, targetSpace);

      if (finalPourCount === 0) return;

      const historyState = tubes.map(t => [...t]);
      setHistory(prev => [...prev, historyState]);

      const newTubes = tubes.map(t => [...t]);
      const pouredItems = newTubes[sourceIdx].splice(newTubes[sourceIdx].length - finalPourCount, finalPourCount);
      newTubes[clickedIdx] = [...newTubes[clickedIdx], ...pouredItems];

      setTubes(newTubes);
      setMoveCount(prev => prev + 1);
      playSound('pour');
      checkWinCondition(newTubes);
    }
  };

  const handleUndo = () => {
    if (history.length === 0) return;
    const prevHistory = [...history];
    const prevState = prevHistory.pop();
    setTubes(prevState);
    setHistory(prevHistory);
    setMoveCount(prev => prev - 1);
    playSound('select');
  };

  const checkWinCondition = (currentTubes) => {
    const isSolved = currentTubes.every(tube => {
      if (tube.length === 0) return true;
      if (tube.length < 4) return false;
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
    <div style={gameLayoutWrapper}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '1.25rem', width: '100%' }}>
        <button onClick={onBack} style={miniBackButtonStyle}>← 게임 선택으로</button>
        <h2 style={gameTitleStyle}>🧪 JCC 네온 워터 소트</h2>
      </div>

      {/* Info Stats Board */}
      <div style={statsBoardStyle}>
        <span style={{ color: '#10b981' }}>Level {currentLevel.level} ({currentLevel.title})</span>
        <span style={{ color: '#f59e0b' }}>이동: {moveCount}회</span>
      </div>

      {/* Tubes Board */}
      <div style={tubesContainerStyle}>
        {tubes.map((tube, tubeIdx) => {
          const isSelected = selectedIdx === tubeIdx;
          return (
            <div 
              key={tubeIdx}
              onClick={() => handleTubeClick(tubeIdx)}
              style={{
                width: 'clamp(46px, 11vw, 60px)',
                height: 'clamp(170px, 38vw, 210px)',
                border: isSelected ? '3.5px solid #00e676' : '2px solid #8e9cae',
                borderRadius: '0 0 30px 30px',
                background: 'rgba(30, 30, 45, 0.85)',
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
              {isSelected && <div style={bounceArrowStyle}>▼</div>}
              {tube.map((colorName, layerIdx) => (
                <div 
                  key={layerIdx}
                  style={{
                    height: '23%',
                    width: '100%',
                    background: WATER_SORT_COLORS[colorName].hex,
                    borderRadius: layerIdx === 0 ? '0 0 24px 24px' : '4px',
                    marginBottom: '3px',
                    boxShadow: `0 0 12px ${WATER_SORT_COLORS[colorName].hex}80, inset 0 2px 4px rgba(255,255,255,0.4)`
                  }}
                />
              ))}
            </div>
          );
        })}
      </div>

      {/* Control Tools */}
      <div style={{ display: 'flex', gap: '0.75rem', width: '100%', maxWidth: '400px' }}>
        <button onClick={handleUndo} disabled={history.length === 0} style={toolButtonStyle(history.length === 0)}>↩ 되돌리기</button>
        <button onClick={() => initLevel(currentLevelIdx)} style={resetButtonStyle}>🔄 처음부터</button>
      </div>

      {/* solved modal */}
      {gameState === 'win' && (
        <div style={modalOverlayStyle}>
          <div style={{ textAlign: 'center', maxWidth: '350px', width: '100%' }}>
            <h2 style={{ color: '#10b981', margin: '0 0 0.5rem 0', fontSize: '1.8rem', fontWeight: 800 }}>🏆 LEVEL CLEAR!</h2>
            <p style={{ margin: '0 0 1.5rem 0', color: '#cbd5e1', fontSize: '0.95rem' }}>완벽하게 분류해 내셨습니다!</p>
            
            <div style={customCtaBoxStyle}>
              <span style={{ fontWeight: 800, color: '#10b981', display: 'block', marginBottom: '0.4rem' }}>🎁 마스터의 가전 견적 꿀팁!</span>
              "가전을 종류와 색상별로 맞춤 큐레이션 하듯, 갤러리아진주 조준석 매니저에게 정밀 설계를 받아보세요. 최적의 할인 조합을 매칭해 드립니다!"
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1.5rem' }}>
              <button onClick={onNavigateToReservation} style={ctaButtonActionStyle}>1:1 무료 가전 상담받기 📅</button>
              {currentLevelIdx < WATER_SORT_LEVELS.length - 1 ? (
                <button 
                  onClick={() => {
                    setCurrentLevelIdx(prev => prev + 1);
                    setGameState('playing');
                  }}
                  style={nextLevelButtonStyle}
                >
                  다음 레벨 도전 🚀
                </button>
              ) : (
                <button onClick={() => { setCurrentLevelIdx(0); setGameState('playing'); }} style={nextLevelButtonStyle}>첫 레벨부터 다시 🔄</button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


// ============================================================================
// GAME 2: BESPOKE MERGE GAME COMPONENT (SUIKA FRUIT MERGE PHYSICS)
// ============================================================================
const MERGE_GRADES = [
  { grade: 0, radius: 15, color: '#ff80ab', label: 'AI큐커', emoji: '🍳' },
  { grade: 1, radius: 21, color: '#ff4081', label: 'AI스팀울트라', emoji: '🧹' },
  { grade: 2, radius: 28, color: '#00e5ff', label: 'AI인덕션', emoji: '🔥' },
  { grade: 3, radius: 36, color: '#00b0ff', label: 'AI로봇청소기', emoji: '🤖' },
  { grade: 4, radius: 45, color: '#1de9b6', label: 'AI에어드레서', emoji: '👔' },
  { grade: 5, radius: 55, color: '#00e676', label: 'AI콤보 세탁기', emoji: '🧺' },
  { grade: 6, radius: 66, color: '#ffea00', label: 'AI무풍갤러리 에어컨', emoji: '🌬️' },
  { grade: 7, radius: 78, color: '#ff9100', label: 'AI패밀리허브', emoji: '❄️' },
  { grade: 8, radius: 90, color: '#ff3d00', label: '마이크로RGB TV', emoji: '📺' }
];

function BespokeMergeGame({ onBack, onNavigateToReservation }) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [score, setScore] = useState(0);
  const [gameState, setGameState] = useState('ready'); // 'ready', 'playing', 'gameover'
  const [nextGrade, setNextGrade] = useState(0);
  const [highScore, setHighScore] = useState(
    parseInt(localStorage.getItem('hs_merge_score') || '0')
  );

  const circlesRef = useRef([]);
  const scoreRef = useRef(0);
  const nextGradeRef = useRef(0);
  const cursorX = useRef(200);
  const cooldownRef = useRef(false);

  // Set random next grade (0 to 3 for starting)
  const rollNextGrade = () => {
    const roll = Math.floor(Math.random() * 4);
    nextGradeRef.current = roll;
    setNextGrade(roll);
  };

  const initGame = () => {
    circlesRef.current = [];
    scoreRef.current = 0;
    setScore(0);
    rollNextGrade();
    setGameState('playing');
    playSound('reset');
  };

  // Drop a circle from the top
  const handleDrop = () => {
    if (gameState !== 'playing' || cooldownRef.current) return;
    
    // Position at top guideline
    const dropGrade = nextGradeRef.current;
    const info = MERGE_GRADES[dropGrade];
    
    // Clamp X to make sure it drops inside walls
    let x = cursorX.current;
    if (x < info.radius + 10) x = info.radius + 10;
    if (x > 390 - info.radius) x = 390 - info.radius;

    const newCircle = {
      id: Math.random().toString(),
      x: x,
      y: 70,
      vx: 0,
      vy: 2,
      radius: info.radius,
      grade: dropGrade,
      color: info.color,
      label: info.label,
      emoji: info.emoji,
      merged: false
    };

    circlesRef.current.push(newCircle);
    playSound('pour');
    
    // Cooldown to prevent spam
    cooldownRef.current = true;
    setTimeout(() => {
      cooldownRef.current = false;
    }, 450);

    rollNextGrade();
  };

  // Game Loop
  useEffect(() => {
    let animId;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const updatePhysics = () => {
      const circles = circlesRef.current;
      const gravity = 0.28;
      const friction = 0.985;
      const elasticity = 0.25;

      // Update positions
      circles.forEach(c => {
        c.vy += gravity;
        c.vx *= friction;
        c.x += c.vx;
        c.y += c.vy;

        // Collision: Bottom Wall (at Y=510)
        if (c.y + c.radius > 510) {
          c.y = 510 - c.radius;
          c.vy = -Math.abs(c.vy) * elasticity;
          c.vx *= 0.8; // higher friction at bottom
        }

        // Collision: Left Wall (at X=10)
        if (c.x - c.radius < 10) {
          c.x = 10 + c.radius;
          c.vx = Math.abs(c.vx) * elasticity;
        }

        // Collision: Right Wall (at X=390)
        if (c.x + c.radius > 390) {
          c.x = 390 - c.radius;
          c.vx = -Math.abs(c.vx) * elasticity;
        }
      });

      // Circle to Circle Collision & Merge
      for (let i = 0; i < circles.length; i++) {
        for (let j = i + 1; j < circles.length; j++) {
          const c1 = circles[i];
          const c2 = circles[j];
          if (c1.merged || c2.merged) continue;

          const dx = c2.x - c1.x;
          const dy = c2.y - c1.y;
          const dist = Math.hypot(dx, dy);
          const minDist = c1.radius + c2.radius;

          if (dist < minDist) {
            // Check if they are of the same grade -> MERGE!
            if (c1.grade === c2.grade && c1.grade < 8) {
              c1.merged = true;
              c2.merged = true;
              playSound('merge');
              
              // Upgraded parameters
              const newGrade = c1.grade + 1;
              const info = MERGE_GRADES[newGrade];
              
              scoreRef.current += (newGrade) * 15;
              setScore(scoreRef.current);

              // Position upgraded circle at midpoint
              const newCircle = {
                id: Math.random().toString(),
                x: (c1.x + c2.x) / 2,
                y: (c1.y + c2.y) / 2,
                vx: (c1.vx + c2.vx) * 0.5,
                vy: (c1.vy + c2.vy) * 0.5 - 1, // small upward pop
                radius: info.radius,
                grade: newGrade,
                color: info.color,
                label: info.label,
                emoji: info.emoji,
                merged: false
              };

              // Defer insertion to next frame logic
              setTimeout(() => {
                circlesRef.current.push(newCircle);
              }, 0);

              if (newGrade === 8) {
                playSound('win');
              }
            } else {
              // Elastic collision response & Overlap resolution
              const overlap = minDist - dist;
              const nx = dx / dist;
              const ny = dy / dist;

              // Static resolution (push apart)
              c1.x -= nx * overlap * 0.51;
              c1.y -= ny * overlap * 0.51;
              c2.x += nx * overlap * 0.51;
              c2.y += ny * overlap * 0.51;

              // Elastic reflection vector math
              const rvx = c2.vx - c1.vx;
              const rvy = c2.vy - c1.vy;
              const velAlongNormal = rvx * nx + rvy * ny;

              if (velAlongNormal < 0) {
                const impulse = -(1 + elasticity) * velAlongNormal / 2;
                c1.vx -= nx * impulse;
                c1.vy -= ny * impulse;
                c2.vx += nx * impulse;
                c2.vy += ny * impulse;
              }
            }
          }
        }
      }

      // Filter out merged circles
      circlesRef.current = circlesRef.current.filter(c => !c.merged);

      // Game Over Check: If any circle rests above Y=120 line
      let hasOverflow = false;
      circlesRef.current.forEach(c => {
        // Let circle settle for at least 1 second before overflow check
        if (c.y < 135 && Math.abs(c.vy) < 0.1) {
          hasOverflow = true;
        }
      });

      if (hasOverflow && gameState === 'playing') {
        // Double check after 1.5 seconds to prevent instant overflow triggers
        setTimeout(() => {
          let recheck = false;
          circlesRef.current.forEach(c => {
            if (c.y < 135 && Math.abs(c.vy) < 0.1) recheck = true;
          });
          if (recheck && gameState === 'playing') {
            setGameState('gameover');
            playSound('reset');
            // Save highscore
            const currentHigh = parseInt(localStorage.getItem('hs_merge_score') || '0');
            if (scoreRef.current > currentHigh) {
              localStorage.setItem('hs_merge_score', scoreRef.current);
              setHighScore(scoreRef.current);
            }
          }
        }, 1500);
      }
    };

    const draw = () => {
      // Clear
      ctx.fillStyle = '#0f0f15';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw Container Box Walls
      ctx.strokeStyle = 'rgba(255,255,255,0.15)';
      ctx.lineWidth = 4;
      ctx.strokeRect(10, 80, 380, 430); // drop boundary starts at Y=80

      // Draw Danger Warning Line (Y=140)
      ctx.strokeStyle = 'rgba(244, 63, 94, 0.4)';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(10, 135);
      ctx.lineTo(390, 135);
      ctx.stroke();
      ctx.setLineDash([]);

      // Draw Dropping Guide Line (if playing)
      if (gameState === 'playing') {
        const activeInfo = MERGE_GRADES[nextGradeRef.current];
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(cursorX.current, 70);
        ctx.lineTo(cursorX.current, 510);
        ctx.stroke();
        ctx.setLineDash([]);

        // Preview next circle at the top
        ctx.fillStyle = activeInfo.color;
        ctx.shadowBlur = 10;
        ctx.shadowColor = activeInfo.color;
        ctx.beginPath();
        ctx.arc(cursorX.current, 50, activeInfo.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        ctx.fillStyle = '#ffffff';
        ctx.font = '10px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(activeInfo.emoji, cursorX.current, 53);
      }

      // Draw All Circles
      circlesRef.current.forEach(c => {
        ctx.fillStyle = c.color;
        ctx.shadowBlur = 12;
        ctx.shadowColor = c.color;
        ctx.beginPath();
        ctx.arc(c.x, c.y, c.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        // Label details inside circles (Bespoke appliance grade)
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // Dynamic text sizing based on circle radius
        const emojiSize = Math.max(10, c.radius * 0.4);
        ctx.font = `bold ${emojiSize}px sans-serif`;
        ctx.fillText(c.emoji, c.x, c.y - 2);

        // Grade title labels for bigger circles
        if (c.radius > 26) {
          const fontSize = Math.max(8, c.radius * 0.18);
          ctx.font = `bold ${fontSize}px sans-serif`;
          ctx.fillStyle = 'rgba(255,255,255,0.9)';
          ctx.fillText(c.label, c.x, c.y + c.radius * 0.4);
        }
      });

      if (gameState === 'playing') {
        updatePhysics();
      }

      animId = requestAnimationFrame(draw);
    };

    draw();
    return () => cancelAnimationFrame(animId);
  }, [gameState]);

  // Handle touch and mouse moves for guidelines
  const handleMouseMove = (clientX) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const relativeX = ((clientX - rect.left) / rect.width) * canvas.width;
    cursorX.current = relativeX;
  };

  return (
    <div style={gameLayoutWrapper}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '1rem', width: '100%' }}>
        <button onClick={onBack} style={miniBackButtonStyle}>← 게임 선택으로</button>
        <h2 style={{ ...gameTitleStyle, color: '#ec4899' }}>🍉 비스포크 가전 머지</h2>
      </div>

      {/* Info Stats Board */}
      <div style={statsBoardStyle}>
        <span style={{ color: '#ec4899' }}>SCORE: {score}점</span>
        <span style={{ color: '#94a3b8' }}>최고 점수: {highScore}점</span>
      </div>

      {/* Interactive Arena Canvas */}
      <div 
        ref={containerRef}
        style={{
          position: 'relative',
          width: '100%',
          aspectRatio: '4/5.3',
          background: '#0f0f15',
          borderRadius: '16px',
          overflow: 'hidden',
          marginBottom: '1rem',
          border: '2px solid rgba(255,255,255,0.08)'
        }}
        onMouseMove={(e) => handleMouseMove(e.clientX)}
        onTouchMove={(e) => {
          if (e.touches.length > 0) {
            handleMouseMove(e.touches[0].clientX);
          }
        }}
        onClick={handleDrop}
      >
        <canvas 
          ref={canvasRef}
          width={400}
          height={530}
          style={{ width: '100%', height: '100%', display: 'block' }}
        />

        {/* Screen Overlays */}
        {gameState !== 'playing' && (
          <div style={canvasOverlayStyle}>
            {gameState === 'ready' && (
              <div style={{ textAlign: 'center', padding: '1rem', maxWidth: '340px' }}>
                <h3 style={{ fontSize: 'clamp(1.1rem, 4vw, 1.3rem)', color: '#ec4899', margin: '0 0 0.5rem 0' }}>가전 머지 슈팅 게임</h3>
                <div style={mergeInstructionsBoxStyle}>
                  <div style={{ fontWeight: 800, color: '#ec4899', marginBottom: '0.4rem' }}>📖 게임 방법</div>
                  • 📱/💻 <b>조작</b>: 터치 슬라이드/마우스 이동으로 조준선을 맞추고, 화면을 터치/클릭하여 떨어트립니다.<br/>
                  • 🎯 <b>규칙</b>: 같은 등급의 가전이 닿으면 더 큰 상위 스마트 가전으로 결합하여 크기가 커집니다.<br/>
                  • 👑 <b>목표</b>: 가전이 보드 위로 넘치지 않게 끊임없이 합쳐 최고 등급 **비스포크 마이크로 RGB TV 졸업**을 이뤄내세요!
                </div>
                <button onClick={initGame} style={playButtonStyle('#ec4899')}>머지 도전 시작</button>
              </div>
            )}

            {gameState === 'gameover' && (
              <div style={{ textAlign: 'center', padding: '1.25rem', width: '100%' }}>
                <h2 style={{ color: '#f43f5e', margin: '0 0 0.5rem 0', fontSize: '1.8rem', fontWeight: 800 }}>GAME OVER</h2>
                <p style={{ margin: '0 0 1.25rem 0', fontSize: '1.05rem', color: '#cbd5e1' }}>최종 점수: {score}점</p>
                
                <div style={customCtaBoxStyle}>
                  <p style={{ margin: '0 0 0.75rem 0', fontSize: '0.82rem', color: '#cbd5e1', wordBreak: 'keep-all', lineHeight: '1.4' }}>아쉽네요! 복잡하게 가전을 고민하고 조립하듯! 갤러리아진주 조준석 매니저가 백화점 프리미엄 혜택과 패키지 견적을 빈틈없이 맞춰 시원한 견적으로 조립해 드립니다! 🎓</p>
                  <button onClick={onNavigateToReservation} style={ctaButtonActionStyle}>진센조 무료 가전 졸업설계상담 받기 💍</button>
                </div>

                <button onClick={initGame} style={{ ...playButtonStyle('#ec4899'), marginTop: '1.25rem' }}>다시 도전하기</button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ==========================================
// SHARED GAME STYLES CONSTANTS
// ==========================================
const gameLayoutWrapper = {
  width: '100%',
  maxWidth: '440px',
  background: 'rgba(20, 20, 30, 0.65)',
  border: '1px solid rgba(255, 255, 255, 0.08)',
  borderRadius: '24px',
  padding: '1.25rem',
  boxSizing: 'border-box',
  backdropFilter: 'blur(25px)',
  boxShadow: '0 12px 40px rgba(0,0,0,0.6)',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center'
};

const miniBackButtonStyle = {
  background: 'rgba(255, 255, 255, 0.08)',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  color: '#cbd5e1',
  padding: '0.35rem 0.8rem',
  borderRadius: '8px',
  cursor: 'pointer',
  fontSize: '0.78rem',
  fontWeight: 700,
  marginBottom: '0.5rem',
  transition: 'all 0.2s'
};

const gameTitleStyle = {
  fontSize: 'clamp(1.2rem, 5vw, 1.45rem)',
  fontWeight: 800,
  background: 'linear-gradient(135deg, #10b981 0%, #3b82f6 100%)',
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  margin: '0.2rem 0',
  letterSpacing: '-0.5px'
};

const statsBoardStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  background: 'rgba(255, 255, 255, 0.04)',
  border: '1px solid rgba(255, 255, 255, 0.05)',
  borderRadius: '12px',
  padding: '0.5rem 1rem',
  width: '100%',
  boxSizing: 'border-box',
  fontSize: '0.85rem',
  fontWeight: 700,
  marginBottom: '1rem'
};

const tubesContainerStyle = {
  width: '100%',
  background: 'rgba(15, 15, 25, 0.5)',
  border: '1px solid rgba(255, 255, 255, 0.05)',
  borderRadius: '20px',
  padding: '1.5rem 0.5rem',
  display: 'flex',
  flexWrap: 'wrap',
  justifyContent: 'center',
  gap: '0.75rem',
  boxSizing: 'border-box',
  marginBottom: '1rem',
  boxShadow: 'inset 0 0 15px rgba(0, 0, 0, 0.6)'
};

const bounceArrowStyle = {
  position: 'absolute',
  top: '-15px',
  left: '50%',
  transform: 'translateX(-50%)',
  fontSize: '0.7rem',
  color: '#00e676',
  fontWeight: 900
};

const toolButtonStyle = (isDisabled) => ({
  flex: 1,
  background: isDisabled ? 'rgba(255, 255, 255, 0.02)' : 'rgba(255, 255, 255, 0.08)',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  color: isDisabled ? '#475569' : '#cbd5e1',
  padding: '0.65rem',
  borderRadius: '10px',
  cursor: isDisabled ? 'not-allowed' : 'pointer',
  fontSize: '0.85rem',
  fontWeight: 700
});

const resetButtonStyle = {
  flex: 1,
  background: 'rgba(244, 63, 94, 0.15)',
  border: '1px solid rgba(244, 63, 94, 0.3)',
  color: '#f43f5e',
  padding: '0.65rem',
  borderRadius: '10px',
  cursor: 'pointer',
  fontSize: '0.85rem',
  fontWeight: 700
};

const modalOverlayStyle = {
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
  padding: '1.25rem',
  boxSizing: 'border-box'
};

const customCtaBoxStyle = {
  background: 'rgba(255, 255, 255, 0.04)',
  border: '1px solid rgba(255, 255, 255, 0.08)',
  borderRadius: '14px',
  padding: '1rem',
  margin: '0.5rem 0',
  textAlign: 'left',
  fontSize: '0.8rem',
  lineHeight: '1.45',
  color: '#94a3b8',
  wordBreak: 'keep-all'
};

const ctaButtonActionStyle = {
  background: 'linear-gradient(135deg, #10b981 0%, #3b82f6 100%)',
  color: '#ffffff',
  border: 'none',
  padding: '0.75rem',
  borderRadius: '10px',
  fontWeight: 800,
  fontSize: '0.9rem',
  cursor: 'pointer',
  boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
};

const nextLevelButtonStyle = {
  background: 'rgba(255, 255, 255, 0.95)',
  color: '#0f172a',
  border: 'none',
  padding: '0.75rem',
  borderRadius: '10px',
  fontWeight: 800,
  fontSize: '0.9rem',
  cursor: 'pointer'
};

const canvasOverlayStyle = {
  position: 'absolute',
  top: 0,
  left: 0,
  width: '100%',
  height: '100%',
  background: 'rgba(10, 10, 15, 0.93)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 20
};

const mergeInstructionsBoxStyle = {
  background: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: '10px',
  padding: '0.75rem',
  fontSize: '0.72rem',
  color: '#cbd5e1',
  textAlign: 'left',
  margin: '0 auto 1.25rem auto',
  lineHeight: '1.45',
  wordBreak: 'keep-all'
};

const playButtonStyle = (shadowColor) => ({
  background: 'rgba(255, 255, 255, 0.95)',
  color: '#0f172a',
  border: 'none',
  padding: '0.7rem 1.8rem',
  borderRadius: '25px',
  fontWeight: 800,
  fontSize: '0.9rem',
  cursor: 'pointer',
  boxShadow: `0 4px 15px ${shadowColor}33`
});
