import React, { useState, useEffect, useRef } from 'react';
import Rummikub from './Rummikub';


// Web Audio API Retro Sound Synthesizer with Bubble, Merge & Tetris Tones
const playSound = (type) => {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    const now = ctx.currentTime;
    
    if (type === 'select' || type === 'rotate') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(320, now);
      osc.frequency.exponentialRampToValueAtTime(480, now + 0.08);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.linearRampToValueAtTime(0, now + 0.08);
      osc.start(now);
      osc.stop(now + 0.08);
    } else if (type === 'move') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(200, now);
      osc.frequency.exponentialRampToValueAtTime(150, now + 0.05);
      gain.gain.setValueAtTime(0.05, now);
      gain.gain.linearRampToValueAtTime(0, now + 0.05);
      osc.start(now);
      osc.stop(now + 0.05);
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
    } else if (type === 'merge' || type === 'clear') {
      // Ascending chord ding
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(523.25, now); // C5
      osc.frequency.exponentialRampToValueAtTime(783.99, now + 0.12); // G5
      osc.frequency.exponentialRampToValueAtTime(1046.50, now + 0.24); // C6
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.linearRampToValueAtTime(0, now + 0.35);
      osc.start(now);
      osc.stop(now + 0.35);
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
      osc.frequency.setValueAtTime(350, now);
      osc.frequency.exponentialRampToValueAtTime(100, now + 0.25);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.linearRampToValueAtTime(0, now + 0.25);
      osc.start(now);
      osc.stop(now + 0.25);
    }
  } catch (e) {
    console.log("AudioContext blocked or not supported.");
  }
};

// ==========================================
// SHARED GENERAL STYLES & LOBBY SYSTEM
// ==========================================
export default function ArcadeHub({ onBack, onNavigateToReservation }) {
  const [activeGame, setActiveGame] = useState(null); // 'watersort', 'merge', 'tetris', 'snake', 'rummikub'

  const [bestScores, setBestScores] = useState({
    watersort: localStorage.getItem('hs_watersort_level') || 1,
    merge: localStorage.getItem('hs_merge_score') || 0,
    tetris: localStorage.getItem('hs_tetris_score') || 0,
    snake: localStorage.getItem('hs_snake_score') || 0
  });

  const handleBackToLobby = () => {
    setActiveGame(null);
    setBestScores({
      watersort: localStorage.getItem('hs_watersort_level') || 1,
      merge: localStorage.getItem('hs_merge_score') || 0,
      tetris: localStorage.getItem('hs_tetris_score') || 0,
      snake: localStorage.getItem('hs_snake_score') || 0
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
        // GRAND 3-GAME LOBBY VIEW
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
            다채롭고 중독성 넘치는 3대 명작 아케이드와 함께, 갤러리아진주 조준석 매니저의 특별 가전 졸업 설계 혜택도 만나보세요!
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
              <h3 style={cardTitleStyle}>🍉 삼성 AI 가전 머지 게임</h3>
              <p style={cardDescStyle}>가전을 떨어뜨려 병합하고 최고의 비스포크 마이크로 RGB TV를 완성하세요!</p>
              <div style={scoreBadgeStyle}>최고 점수: {bestScores.merge}점</div>
            </div>

            {/* Card 3: Neon AI Tetris */}
            <div 
              onClick={() => { setActiveGame('tetris'); playSound('select'); }}
              style={cardStyle('#00b0ff')}
            >
              <div style={badgeStyle('#00b0ff')}>CLASSIC BLOCK</div>
              <h3 style={cardTitleStyle}>🧱 삼성 AI 가전 테트리스</h3>
              <p style={cardDescStyle}>네온 가전 블록을 맞춰 빈틈없이 채우고 고득점에 도전하세요!</p>
              <div style={scoreBadgeStyle}>최고 점수: {bestScores.tetris}점</div>
            </div>

            {/* Card 4: Neon AI Snake */}
            <div 
              onClick={() => { setActiveGame('snake'); playSound('select'); }}
              style={cardStyle('#a855f7')}
            >
              <div style={badgeStyle('#a855f7')}>NEON ACCELERATION</div>
              <h3 style={cardTitleStyle}>🐍 삼성 AI 스마트 그리드 스네이크</h3>
              <p style={cardDescStyle}>빛나는 AI 가전 그리드를 연결해 나가며 뱀을 가장 길게 성장시켜 보세요!</p>
              <div style={scoreBadgeStyle}>최고 점수: {bestScores.snake}점</div>
            </div>

            {/* Card 5: Multiplayer Rummikub */}
            <div 
              onClick={() => { setActiveGame('rummikub'); playSound('select'); }}
              style={cardStyle('#d4af37')}
            >
              <div style={badgeStyle('#d4af37')}>MULTIPLAYER BOARD GAME</div>
              <h3 style={cardTitleStyle}>🀄 JCC 실시간 루미큐브</h3>
              <p style={cardDescStyle}>2~4인용 실시간 온라인 루미큐브! 보드를 완성하고 친구들과 두뇌 대결을 즐겨보세요.</p>
              <div style={scoreBadgeStyle}>온라인 멀티플레이 가능</div>
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
          {activeGame === 'tetris' && (
            <BespokeTetrisGame onBack={handleBackToLobby} onNavigateToReservation={onNavigateToReservation} />
          )}
          {activeGame === 'snake' && (
            <BespokeSnakeGame onBack={handleBackToLobby} onNavigateToReservation={onNavigateToReservation} />
          )}
          {activeGame === 'rummikub' && (
            <Rummikub onBack={handleBackToLobby} onNavigateToReservation={onNavigateToReservation} />
          )}
        </div>
      )}
    </div>
  );
}

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
      ['purple', 'blue', 'green', 'pink'],
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
  const [gameState, setGameState] = useState('playing'); 
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
  { grade: 1, radius: 22, color: '#ff4081', label: 'AI인덕션', emoji: '🔥' },
  { grade: 2, radius: 30, color: '#00e5ff', label: 'AI스팀울트라', emoji: '🧹' },
  { grade: 3, radius: 39, color: '#00b0ff', label: 'AI에어드레서', emoji: '👔' },
  { grade: 4, radius: 49, color: '#1de9b6', label: 'AI콤보', emoji: '🧺' },
  { grade: 5, radius: 60, color: '#00e676', label: 'AI무풍콤보', emoji: '🌀' },
  { grade: 6, radius: 72, color: '#ffea00', label: 'AI패밀리허브', emoji: '❄️' },
  { grade: 7, radius: 88, color: '#ff3d00', label: '마이크로RGB', emoji: '📺' }
];

function BespokeMergeGame({ onBack, onNavigateToReservation }) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [score, setScore] = useState(0);
  const [gameState, setGameState] = useState('ready'); 
  const [nextGrade, setNextGrade] = useState(0);
  const [highScore, setHighScore] = useState(
    parseInt(localStorage.getItem('hs_merge_score') || '0')
  );

  const circlesRef = useRef([]);
  const scoreRef = useRef(0);
  const nextGradeRef = useRef(0);
  const cursorX = useRef(200);
  const cooldownRef = useRef(false);

  const stateRef = useRef('ready');
  const overflowTimerRef = useRef(0);

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
    stateRef.current = 'playing';
    overflowTimerRef.current = 0;
    playSound('reset');
  };

  const handleDrop = () => {
    if (stateRef.current !== 'playing' || cooldownRef.current) return;
    
    const dropGrade = nextGradeRef.current;
    const info = MERGE_GRADES[dropGrade];
    
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
      merged: false,
      hasDropped: false
    };

    circlesRef.current.push(newCircle);
    playSound('pour');
    
    cooldownRef.current = true;
    setTimeout(() => {
      cooldownRef.current = false;
    }, 450);

    rollNextGrade();
  };

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

      circles.forEach(c => {
        c.vy += gravity;
        c.vx *= friction;
        c.x += c.vx;
        c.y += c.vy;

        if (c.y > 155) {
          c.hasDropped = true;
        }

        if (c.y + c.radius > 510) {
          c.y = 510 - c.radius;
          c.vy = -Math.abs(c.vy) * elasticity;
          c.vx *= 0.8;
        }

        if (c.x - c.radius < 10) {
          c.x = 10 + c.radius;
          c.vx = Math.abs(c.vx) * elasticity;
        }

        if (c.x + c.radius > 390) {
          c.x = 390 - c.radius;
          c.vx = -Math.abs(c.vx) * elasticity;
        }
      });

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
            if (c1.grade === c2.grade && c1.grade < 7) {
              c1.merged = true;
              c2.merged = true;
              playSound('merge');
              
              const newGrade = c1.grade + 1;
              const info = MERGE_GRADES[newGrade];
              
              scoreRef.current += (newGrade) * 15;
              setScore(scoreRef.current);

              const newCircle = {
                id: Math.random().toString(),
                x: (c1.x + c2.x) / 2,
                y: (c1.y + c2.y) / 2,
                vx: (c1.vx + c2.vx) * 0.5,
                vy: (c1.vy + c2.vy) * 0.5 - 1, 
                radius: info.radius,
                grade: newGrade,
                color: info.color,
                label: info.label,
                emoji: info.emoji,
                merged: false,
                hasDropped: true
              };

              setTimeout(() => {
                circlesRef.current.push(newCircle);
              }, 0);

              if (newGrade === 7) {
                playSound('win');
              }
            } else {
              const overlap = minDist - dist;
              const nx = dx / dist;
              const ny = dy / dist;

              c1.x -= nx * overlap * 0.51;
              c1.y -= ny * overlap * 0.51;
              c2.x += nx * overlap * 0.51;
              c2.y += ny * overlap * 0.51;

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

      circlesRef.current = circlesRef.current.filter(c => !c.merged);

      let hasOverflow = false;
      circlesRef.current.forEach(c => {
        if (c.hasDropped && c.y - c.radius < 135) {
          hasOverflow = true;
        }
      });

      if (hasOverflow && stateRef.current === 'playing') {
        if (overflowTimerRef.current === 0) {
          overflowTimerRef.current = Date.now();
        } else if (Date.now() - overflowTimerRef.current > 1500) {
          setGameState('gameover');
          stateRef.current = 'gameover';
          playSound('reset');
          
          const currentHigh = parseInt(localStorage.getItem('hs_merge_score') || '0');
          if (scoreRef.current > currentHigh) {
            localStorage.setItem('hs_merge_score', scoreRef.current);
            setHighScore(scoreRef.current);
          }
          overflowTimerRef.current = 0;
        }
      } else {
        overflowTimerRef.current = 0;
      }
    };

    const draw = () => {
      ctx.fillStyle = '#0f0f15';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.strokeStyle = 'rgba(255,255,255,0.15)';
      ctx.lineWidth = 4;
      ctx.strokeRect(10, 80, 380, 430); 

      ctx.strokeStyle = 'rgba(244, 63, 94, 0.4)';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(10, 135);
      ctx.lineTo(390, 135);
      ctx.stroke();
      ctx.setLineDash([]);

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

        ctx.fillStyle = activeInfo.color;
        ctx.shadowBlur = 10;
        ctx.shadowColor = activeInfo.color;
        ctx.beginPath();
        ctx.arc(cursorX.current, 50, activeInfo.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 3.5;
        ctx.font = 'bold 12px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.strokeText(activeInfo.emoji, cursorX.current, 50);
        ctx.fillText(activeInfo.emoji, cursorX.current, 50);
      }

      circlesRef.current.forEach(c => {
        ctx.fillStyle = c.color;
        ctx.shadowBlur = 12;
        ctx.shadowColor = c.color;
        ctx.beginPath();
        ctx.arc(c.x, c.y, c.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        const emojiSize = Math.max(12, c.radius * 0.45);
        ctx.font = `bold ${emojiSize}px sans-serif`;
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 3.5;
        
        const emojiY = c.radius > 20 ? c.y - c.radius * 0.15 : c.y;
        ctx.strokeText(c.emoji, c.x, emojiY);
        ctx.fillStyle = '#ffffff';
        ctx.fillText(c.emoji, c.x, emojiY);

        if (c.radius > 20) {
          const fontSize = Math.max(8, c.radius * 0.20);
          ctx.font = `bold ${fontSize}px sans-serif`;
          ctx.strokeStyle = '#000000';
          ctx.lineWidth = 3;
          const labelY = c.y + c.radius * 0.38;
          ctx.strokeText(c.label, c.x, labelY);
          ctx.fillStyle = '#ffffff';
          ctx.fillText(c.label, c.x, labelY);
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

  const handleMouseMove = (clientX) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const relativeX = ((clientX - rect.left) / rect.width) * canvas.width;
    cursorX.current = relativeX;
  };

  return (
    <div style={gameLayoutWrapper}>
      <div style={{ textAlign: 'center', marginBottom: '1rem', width: '100%' }}>
        <button onClick={onBack} style={miniBackButtonStyle}>← 게임 선택으로</button>
        <h2 style={{ ...gameTitleStyle, color: '#ec4899' }}>🍉 삼성 AI 가전 머지</h2>
      </div>

      <div style={statsBoardStyle}>
        <span style={{ color: '#ec4899' }}>SCORE: {score}점</span>
        <span style={{ color: '#94a3b8' }}>최고: {highScore}점</span>
      </div>

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

// ============================================================================
// GAME 3: BESPOKE TETRIS GAME COMPONENT
// ============================================================================
const TETRIS_SHAPES = {
  I: {
    shape: [
      [0, 0, 0, 0],
      [1, 1, 1, 1],
      [0, 0, 0, 0],
      [0, 0, 0, 0]
    ],
    color: '#00e5ff', // Neon Cyan - AI인덕션
    label: 'AI인덕션'
  },
  O: {
    shape: [
      [1, 1],
      [1, 1]
    ],
    color: '#ffea00', // Neon Yellow - AI패밀리허브
    label: 'AI패밀리허브'
  },
  T: {
    shape: [
      [0, 1, 0],
      [1, 1, 1],
      [0, 0, 0]
    ],
    color: '#d500f9', // Neon Purple - AI무풍콤보
    label: 'AI무풍콤보'
  },
  S: {
    shape: [
      [0, 1, 1],
      [1, 1, 0],
      [0, 0, 0]
    ],
    color: '#00e676', // Neon Green - AI큐커
    label: 'AI큐커'
  },
  Z: {
    shape: [
      [1, 1, 0],
      [0, 1, 1],
      [0, 0, 0]
    ],
    color: '#ff3d00', // Neon Red - 마이크로RGB
    label: '마이크로RGB'
  },
  J: {
    shape: [
      [1, 0, 0],
      [1, 1, 1],
      [0, 0, 0]
    ],
    color: '#00b0ff', // Neon Blue - AI콤보
    label: 'AI콤보'
  },
  L: {
    shape: [
      [0, 0, 1],
      [1, 1, 1],
      [0, 0, 0]
    ],
    color: '#ff1a8c', // Neon Pink - AI에어드레서
    label: 'AI에어드레서'
  }
};

const SHAPE_KEYS = ['I', 'O', 'T', 'S', 'Z', 'J', 'L'];

function BespokeTetrisGame({ onBack, onNavigateToReservation }) {
  const canvasRef = useRef(null);
  const [score, setScore] = useState(0);
  const [lines, setLines] = useState(0);
  const [gameState, setGameState] = useState('ready'); // 'ready', 'playing', 'gameover'
  const [highScore, setHighScore] = useState(
    parseInt(localStorage.getItem('hs_tetris_score') || '0')
  );

  // Board State: 20 rows x 10 columns
  const board = useRef(Array(20).fill(null).map(() => Array(10).fill(0)));
  
  // Current Piece State
  const currentPiece = useRef(null);
  const currentX = useRef(3);
  const currentY = useRef(0);
  const nextPieceKey = useRef('I');
  
  const scoreRef = useRef(0);
  const linesRef = useRef(0);
  const gameInterval = useRef(null);
  const activeStateRef = useRef('ready');

  const rollNextPiece = () => {
    const keys = SHAPE_KEYS;
    const randomKey = keys[Math.floor(Math.random() * keys.length)];
    nextPieceKey.current = randomKey;
  };

  const initGame = () => {
    board.current = Array(20).fill(null).map(() => Array(10).fill(0));
    scoreRef.current = 0;
    linesRef.current = 0;
    setScore(0);
    setLines(0);
    rollNextPiece();
    spawnPiece();
    setGameState('playing');
    activeStateRef.current = 'playing';
    playSound('reset');

    if (gameInterval.current) clearInterval(gameInterval.current);
    gameInterval.current = setInterval(gameStep, 800); // 800ms base drop speed
  };

  const spawnPiece = () => {
    const key = nextPieceKey.current;
    currentPiece.current = {
      key: key,
      matrix: TETRIS_SHAPES[key].shape,
      color: TETRIS_SHAPES[key].color,
      label: TETRIS_SHAPES[key].label
    };
    currentX.current = Math.floor((10 - currentPiece.current.matrix[0].length) / 2);
    currentY.current = 0;
    rollNextPiece();

    // Spawn Collision -> Game Over
    if (checkCollision(currentX.current, currentY.current, currentPiece.current.matrix)) {
      setGameState('gameover');
      activeStateRef.current = 'gameover';
      playSound('reset');
      clearInterval(gameInterval.current);

      const savedHigh = parseInt(localStorage.getItem('hs_tetris_score') || '0');
      if (scoreRef.current > savedHigh) {
        localStorage.setItem('hs_tetris_score', scoreRef.current);
        setHighScore(scoreRef.current);
      }
    }
  };

  const checkCollision = (ax, ay, matrix) => {
    for (let r = 0; r < matrix.length; r++) {
      for (let c = 0; c < matrix[r].length; c++) {
        if (matrix[r][c] !== 0) {
          const targetX = ax + c;
          const targetY = ay + r;

          // Out of bounds
          if (targetX < 0 || targetX >= 10 || targetY >= 20) {
            return true;
          }

          // Collide with settled blocks
          if (targetY >= 0 && board.current[targetY][targetX] !== 0) {
            return true;
          }
        }
      }
    }
    return false;
  };

  const mergePiece = () => {
    const { matrix, color } = currentPiece.current;
    for (let r = 0; r < matrix.length; r++) {
      for (let c = 0; c < matrix[r].length; c++) {
        if (matrix[r][c] !== 0) {
          const targetY = currentY.current + r;
          const targetX = currentX.current + c;
          if (targetY >= 0) {
            board.current[targetY][targetX] = color;
          }
        }
      }
    }
  };

  const checkLineClears = () => {
    let cleared = 0;
    for (let r = 20 - 1; r >= 0; r--) {
      // Line is full if all elements are non-zero
      if (board.current[r].every(val => val !== 0)) {
        board.current.splice(r, 1);
        board.current.unshift(Array(10).fill(0)); // insert empty row at top
        cleared++;
        r++; // check same row index again as rows shifted down
      }
    }

    if (cleared > 0) {
      playSound('clear');
      linesRef.current += cleared;
      setLines(linesRef.current);

      // Scoring: 100, 300, 600, 1200 points
      const payouts = [0, 100, 300, 600, 1200];
      scoreRef.current += payouts[cleared] || 100;
      setScore(scoreRef.current);

      // Speed up as rows increase
      const speed = Math.max(150, 800 - Math.floor(linesRef.current / 4) * 80);
      clearInterval(gameInterval.current);
      gameInterval.current = setInterval(gameStep, speed);
    }
  };

  const settlePiece = () => {
    mergePiece();
    checkLineClears();
    spawnPiece();
  };

  const moveLeft = () => {
    if (activeStateRef.current !== 'playing') return;
    if (!checkCollision(currentX.current - 1, currentY.current, currentPiece.current.matrix)) {
      currentX.current -= 1;
      playSound('move');
    }
  };

  const moveRight = () => {
    if (activeStateRef.current !== 'playing') return;
    if (!checkCollision(currentX.current + 1, currentY.current, currentPiece.current.matrix)) {
      currentX.current += 1;
      playSound('move');
    }
  };

  const rotatePiece = () => {
    if (activeStateRef.current !== 'playing') return;
    const matrix = currentPiece.current.matrix;
    const N = matrix.length;
    // Transpose and reverse rows
    const rotated = Array(N).fill(null).map(() => Array(N).fill(0));
    for (let r = 0; r < N; r++) {
      for (let c = 0; c < N; c++) {
        rotated[c][N - 1 - r] = matrix[r][c];
      }
    }

    // Try rotating with basic wall kicks
    if (!checkCollision(currentX.current, currentY.current, rotated)) {
      currentPiece.current.matrix = rotated;
      playSound('rotate');
    } else if (!checkCollision(currentX.current - 1, currentY.current, rotated)) {
      currentX.current -= 1;
      currentPiece.current.matrix = rotated;
      playSound('rotate');
    } else if (!checkCollision(currentX.current + 1, currentY.current, rotated)) {
      currentX.current += 1;
      currentPiece.current.matrix = rotated;
      playSound('rotate');
    }
  };

  const softDrop = () => {
    if (activeStateRef.current !== 'playing') return;
    if (!checkCollision(currentX.current, currentY.current + 1, currentPiece.current.matrix)) {
      currentY.current += 1;
      playSound('move');
    } else {
      settlePiece();
    }
  };

  const hardDrop = () => {
    if (activeStateRef.current !== 'playing') return;
    let dropY = currentY.current;
    while (!checkCollision(currentX.current, dropY + 1, currentPiece.current.matrix)) {
      dropY++;
    }
    currentY.current = dropY;
    settlePiece();
    playSound('pour');
  };

  const gameStep = () => {
    if (activeStateRef.current !== 'playing') return;
    if (!checkCollision(currentX.current, currentY.current + 1, currentPiece.current.matrix)) {
      currentY.current += 1;
    } else {
      settlePiece();
    }
  };

  // Keyboard controls for desktop
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (activeStateRef.current !== 'playing') return;
      if (e.key === 'ArrowLeft' || e.key === 'a') { e.preventDefault(); moveLeft(); }
      if (e.key === 'ArrowRight' || e.key === 'd') { e.preventDefault(); moveRight(); }
      if (e.key === 'ArrowUp' || e.key === 'w') { e.preventDefault(); rotatePiece(); }
      if (e.key === 'ArrowDown' || e.key === 's') { e.preventDefault(); softDrop(); }
      if (e.key === ' ' || e.key === 'Spacebar') { e.preventDefault(); hardDrop(); }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (gameInterval.current) clearInterval(gameInterval.current);
    };
  }, []);

  // Animation Loop for rendering Neon Tetris
  useEffect(() => {
    let animId;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const drawGrid = () => {
      ctx.fillStyle = '#0f0f15';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const blockSize = 24; // block size inside canvas
      
      // Draw grid container border
      ctx.strokeStyle = 'rgba(255,255,255,0.06)';
      ctx.lineWidth = 1;
      for (let x = 0; x <= 10; x++) {
        ctx.beginPath();
        ctx.moveTo(x * blockSize, 0);
        ctx.lineTo(x * blockSize, 20 * blockSize);
        ctx.stroke();
      }
      for (let y = 0; y <= 20; y++) {
        ctx.beginPath();
        ctx.moveTo(0, y * blockSize);
        ctx.lineTo(10 * blockSize, y * blockSize);
        ctx.stroke();
      }

      // Draw settled blocks on board
      for (let r = 0; r < 20; r++) {
        for (let c = 0; c < 10; c++) {
          const color = board.current[r][c];
          if (color !== 0) {
            drawBlock(ctx, c, r, color, blockSize);
          }
        }
      }

      // Draw current falling piece
      if (gameState === 'playing' && currentPiece.current) {
        const { matrix, color } = currentPiece.current;
        for (let r = 0; r < matrix.length; r++) {
          for (let c = 0; c < matrix[r].length; c++) {
            if (matrix[r][c] !== 0) {
              drawBlock(ctx, currentX.current + c, currentY.current + r, color, blockSize);
            }
          }
        }
      }
    };

    const drawBlock = (context, x, y, color, size) => {
      context.fillStyle = color;
      context.shadowBlur = 10;
      context.shadowColor = color;
      context.fillRect(x * size + 1.5, y * size + 1.5, size - 3, size - 3);
      context.shadowBlur = 0;

      // Inner shiny outline for neon aesthetic
      context.strokeStyle = 'rgba(255,255,255,0.45)';
      context.lineWidth = 1.5;
      context.strokeRect(x * size + 3.5, y * size + 3.5, size - 7, size - 7);
    };

    const render = () => {
      drawGrid();
      animId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animId);
  }, [gameState]);

  return (
    <div style={gameLayoutWrapper}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '0.75rem', width: '100%' }}>
        <button onClick={onBack} style={miniBackButtonStyle}>← 게임 선택으로</button>
        <h2 style={{ ...gameTitleStyle, color: '#00b0ff' }}>🧱 삼성 AI 가전 테트리스</h2>
      </div>

      {/* Info Stats Board */}
      <div style={statsBoardStyle}>
        <span style={{ color: '#00b0ff' }}>SCORE: {score}</span>
        <span style={{ color: '#00e676' }}>줄소거: {lines}개</span>
        <span style={{ color: '#94a3b8' }}>최고: {highScore}</span>
      </div>

      {/* Arena and Preview Row */}
      <div style={{
        display: 'flex',
        gap: '0.75rem',
        width: '100%',
        justifyContent: 'center',
        alignItems: 'flex-start',
        marginBottom: '1rem'
      }}>
        {/* Tetris Canvas Container */}
        <div style={{
          position: 'relative',
          width: 'clamp(170px, 50vw, 240px)',
          aspectRatio: '1/2',
          background: '#0f0f15',
          borderRadius: '12px',
          overflow: 'hidden',
          border: '2px solid rgba(255,255,255,0.08)'
        }}>
          <canvas 
            ref={canvasRef} 
            width={240} 
            height={480} 
            style={{ display: 'block', width: '100%', height: '100%' }}
          />

          {/* Overlays */}
          {gameState !== 'playing' && (
            <div style={canvasOverlayStyle}>
              {gameState === 'ready' && (
                <div style={{ textAlign: 'center', padding: '1rem', maxWidth: '200px' }}>
                  <h3 style={{ fontSize: '1.1rem', color: '#00b0ff', margin: '0 0 0.5rem 0' }}>AI 가전 테트리스</h3>
                  <div style={{ ...mergeInstructionsBoxStyle, fontSize: '0.68rem', padding: '0.5rem', marginBottom: '1rem' }}>
                    • 📱 <b>모바일</b>: 하단 화살표와 회전 버튼을 탭하여 블록을 조작합니다.<br/>
                    • 💻 <b>PC</b>: 방향키(이동/회전) 및 스페이스바(하드드롭)를 활용합니다.
                  </div>
                  <button onClick={initGame} style={playButtonStyle('#00b0ff')}>게임 시작</button>
                </div>
              )}

              {gameState === 'gameover' && (
                <div style={{ textAlign: 'center', padding: '0.75rem', width: '100%' }}>
                  <h2 style={{ color: '#f43f5e', margin: '0 0 0.5rem 0', fontSize: '1.5rem', fontWeight: 800 }}>GAME OVER</h2>
                  <p style={{ margin: '0 0 1rem 0', fontSize: '0.9rem', color: '#cbd5e1' }}>최종 점수: {score}점</p>
                  
                  <div style={{ ...customCtaBoxStyle, padding: '0.65rem', margin: '0.3rem 0' }}>
                    <p style={{ margin: 0, fontSize: '0.76rem', color: '#cbd5e1', wordBreak: 'keep-all', lineHeight: '1.4' }}>테트리스 블록을 빈틈없이 결합하듯! 갤러리아진주 조준석 매니저가 백화점 혜택과 비대면 비교 패키지를 완벽한 하나의 퍼즐로 맞춰 드립니다! 🧱</p>
                    <button onClick={onNavigateToReservation} style={{ ...ctaButtonActionStyle, width: '100%', padding: '0.55rem', fontSize: '0.8rem', marginTop: '0.5rem' }}>무료 가전 견적상담 받기 📅</button>
                  </div>

                  <button onClick={initGame} style={{ ...playButtonStyle('#00b0ff'), marginTop: '0.75rem', padding: '0.55rem 1.4rem' }}>다시 하기</button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Side Panel (Next Piece & Info) */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '0.75rem',
          width: '90px'
        }}>
          {/* Next Piece Box */}
          <div style={{
            background: 'rgba(20,20,30,0.6)',
            border: '1.5px solid rgba(255,255,255,0.08)',
            borderRadius: '12px',
            padding: '0.5rem',
            textAlign: 'center'
          }}>
            <span style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 800, display: 'block', marginBottom: '0.4rem' }}>NEXT PIECE</span>
            <div style={{
              height: '50px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '2rem',
              color: gameState === 'playing' ? TETRIS_SHAPES[nextPieceKey.current].color : '#555'
            }}>
              {gameState === 'playing' ? TETRIS_SHAPES[nextPieceKey.current].emoji : '❓'}
            </div>
            <span style={{ fontSize: '0.55rem', color: '#cbd5e1', wordBreak: 'keep-all', display: 'block', marginTop: '0.2rem', fontWeight: 600 }}>
              {gameState === 'playing' ? TETRIS_SHAPES[nextPieceKey.current].label : '--'}
            </span>
          </div>
        </div>
      </div>

      {/* Mobile Touch Controller Panel (Only visible on Mobile view) */}
      <div className="mobile-only" style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem',
        width: '100%',
        maxWidth: '300px',
        background: 'rgba(255,255,255,0.02)',
        border: '1px solid rgba(255,255,255,0.05)',
        borderRadius: '16px',
        padding: '0.75rem',
        boxSizing: 'border-box'
      }}>
        {/* Top row: Rotation & Harddrop */}
        <div style={{ display: 'flex', gap: '0.5rem', width: '100%' }}>
          <button onClick={rotatePiece} style={controllerButtonStyle('#00b0ff')}>↻ 회전 (Rotate)</button>
          <button onClick={hardDrop} style={controllerButtonStyle('#ff3d00')}>⚡ 즉시낙하 (Drop)</button>
        </div>
        {/* Bottom row: Left, Down, Right */}
        <div style={{ display: 'flex', gap: '0.5rem', width: '100%' }}>
          <button onClick={moveLeft} style={controllerButtonStyle('#cbd5e1')}>◀ 좌로</button>
          <button onClick={softDrop} style={controllerButtonStyle('#cbd5e1')}>▼ 아래로</button>
          <button onClick={moveRight} style={controllerButtonStyle('#cbd5e1')}>▶ 우로</button>
        </div>
      </div>
    </div>
  );
}

const controllerButtonStyle = (color) => ({
  flex: 1,
  background: 'rgba(255,255,255,0.06)',
  border: `1.5px solid ${color}40`,
  color: color,
  padding: '0.65rem 0',
  borderRadius: '8px',
  fontWeight: 800,
  fontSize: '0.78rem',
  cursor: 'pointer',
  transition: 'active 0.1s',
  outline: 'none',
  userSelect: 'none',
  WebkitUserSelect: 'none'
});

// ============================================================================
// GAME 4: SAMSUNG AI SMART GRID SNAKE COMPONENT
// ============================================================================
function BespokeSnakeGame({ onBack, onNavigateToReservation }) {
  const canvasRef = useRef(null);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(
    parseInt(localStorage.getItem('hs_snake_score') || '0', 10)
  );
  const [gameState, setGameState] = useState('ready'); // 'ready', 'playing', 'gameover'
  
  // Grid settings
  const CELL_COUNT = 16; // 16x16 grid

  // Game state refs to bypass react dynamic closure delays in requestAnimationFrame loops
  const snake = useRef([{ x: 8, y: 8 }]);
  const direction = useRef({ x: 0, y: -1 }); // initial direction: UP
  const nextDirection = useRef({ x: 0, y: -1 });
  const food = useRef({ x: 4, y: 4, grade: 0 });
  const gameSpeed = useRef(150); // ms
  const lastUpdateTime = useRef(0);

  const initGame = () => {
    snake.current = [
      { x: 8, y: 8 },
      { x: 8, y: 9 },
      { x: 8, y: 10 }
    ];
    direction.current = { x: 0, y: -1 };
    nextDirection.current = { x: 0, y: -1 };
    spawnFood();
    setScore(0);
    setGameState('playing');
    gameSpeed.current = 150;
    lastUpdateTime.current = 0;
    playSound('reset');
  };

  const spawnFood = () => {
    let newX, newY;
    let overlap = true;
    while (overlap) {
      newX = Math.floor(Math.random() * CELL_COUNT);
      newY = Math.floor(Math.random() * CELL_COUNT);
      overlap = snake.current.some(part => part.x === newX && part.y === newY);
    }
    const randomGrade = Math.floor(Math.random() * MERGE_GRADES.length);
    food.current = { x: newX, y: newY, grade: randomGrade };
  };

  // Keyboard Event Handlers for PC
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (gameState !== 'playing') return;
      const curr = direction.current;
      
      if (e.key === 'ArrowUp' && curr.y === 0) {
        nextDirection.current = { x: 0, y: -1 };
        e.preventDefault();
      } else if (e.key === 'ArrowDown' && curr.y === 0) {
        nextDirection.current = { x: 0, y: 1 };
        e.preventDefault();
      } else if (e.key === 'ArrowLeft' && curr.x === 0) {
        nextDirection.current = { x: -1, y: 0 };
        e.preventDefault();
      } else if (e.key === 'ArrowRight' && curr.x === 0) {
        nextDirection.current = { x: 1, y: 0 };
        e.preventDefault();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState]);

  // Touch handlers for mobile buttons
  const changeDirection = (x, y) => {
    if (gameState !== 'playing') return;
    const curr = direction.current;
    if (x !== 0 && curr.x === 0) {
      nextDirection.current = { x, y };
      playSound('move');
    }
    if (y !== 0 && curr.y === 0) {
      nextDirection.current = { x, y };
      playSound('move');
    }
  };

  // Main game loop (tick)
  useEffect(() => {
    if (gameState !== 'playing') return;

    let animId;
    const tick = (timestamp) => {
      if (!lastUpdateTime.current) lastUpdateTime.current = timestamp;
      const elapsed = timestamp - lastUpdateTime.current;

      if (elapsed > gameSpeed.current) {
        lastUpdateTime.current = timestamp;

        // Apply next buffered direction
        direction.current = nextDirection.current;

        const head = snake.current[0];
        const newHead = {
          x: head.x + direction.current.x,
          y: head.y + direction.current.y
        };

        // Collision Check: Walls
        if (newHead.x < 0 || newHead.x >= CELL_COUNT || newHead.y < 0 || newHead.y >= CELL_COUNT) {
          handleGameOver();
          return;
        }

        // Collision Check: Self
        if (snake.current.some(part => part.x === newHead.x && part.y === newHead.y)) {
          handleGameOver();
          return;
        }

        // Move Snake
        const newSnake = [newHead, ...snake.current];

        // Eat Check
        if (newHead.x === food.current.x && newHead.y === food.current.y) {
          playSound('merge');
          setScore(prev => {
            const next = prev + 10;
            if (next > highScore) {
              setHighScore(next);
              localStorage.setItem('hs_snake_score', next.toString());
            }
            return next;
          });
          // Speed up slightly
          gameSpeed.current = Math.max(80, 150 - Math.floor(newSnake.length * 1.5));
          spawnFood();
        } else {
          newSnake.pop();
        }

        snake.current = newSnake;
      }

      // Draw Grid & Entities
      drawGame();
      animId = requestAnimationFrame(tick);
    };

    const drawGame = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      const cellSize = canvas.width / CELL_COUNT;

      // Clear Canvas
      ctx.fillStyle = '#0a0a0f';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw grid wires for AI look
      ctx.strokeStyle = 'rgba(255,255,255,0.03)';
      ctx.lineWidth = 1;
      for (let i = 0; i < CELL_COUNT; i++) {
        ctx.beginPath();
        ctx.moveTo(i * cellSize, 0);
        ctx.lineTo(i * cellSize, canvas.height);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, i * cellSize);
        ctx.lineTo(canvas.width, i * cellSize);
        ctx.stroke();
      }

      // Draw glowing food (Samsung AI Appliance target)
      const foodItem = MERGE_GRADES[food.current.grade];
      const fx = food.current.x * cellSize + cellSize / 2;
      const fy = food.current.y * cellSize + cellSize / 2;

      ctx.shadowBlur = 15;
      ctx.shadowColor = foodItem.color;
      ctx.fillStyle = foodItem.color;
      ctx.beginPath();
      ctx.arc(fx, fy, cellSize / 2.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Draw food appliance initial text overlay
      ctx.fillStyle = '#000000';
      ctx.font = `bold ${cellSize * 0.5}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(foodItem.emoji, fx, fy);

      // Draw glowing neon snake grid stream
      snake.current.forEach((part, index) => {
        const px = part.x * cellSize;
        const py = part.y * cellSize;
        const isHead = index === 0;

        // Body segment color maps to corresponding appliance index
        const bodyGrade = index % MERGE_GRADES.length;
        const segmentColor = isHead ? '#a855f7' : MERGE_GRADES[bodyGrade].color;

        ctx.shadowBlur = isHead ? 15 : 8;
        ctx.shadowColor = segmentColor;
        ctx.fillStyle = segmentColor;
        
        // Draw head or rounded body block
        ctx.beginPath();
        if (isHead) {
          ctx.arc(px + cellSize/2, py + cellSize/2, cellSize/2.2, 0, Math.PI * 2);
        } else {
          ctx.roundRect(px + 1.5, py + 1.5, cellSize - 3, cellSize - 3, 5);
        }
        ctx.fill();
        ctx.shadowBlur = 0;

        // Draw connecting white core outline
        ctx.strokeStyle = 'rgba(255,255,255,0.45)';
        ctx.lineWidth = 1;
        ctx.strokeRect(px + 3, py + 3, cellSize - 6, cellSize - 6);
      });
    };

    const handleGameOver = () => {
      playSound('reset');
      setGameState('gameover');
    };

    animId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animId);
  }, [gameState]);

  return (
    <div style={gameLayoutWrapper}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '0.75rem', width: '100%' }}>
        <button onClick={onBack} style={miniBackButtonStyle}>← 게임 선택으로</button>
        <h2 style={{ ...gameTitleStyle, color: '#a855f7' }}>🐍 AI 가전 스마트 그리드 스네이크</h2>
      </div>

      {/* Info Stats Board */}
      <div style={statsBoardStyle}>
        <span style={{ color: '#a855f7' }}>SCORE: {score}</span>
        <span style={{ color: '#cbd5e1' }}>길이: {snake.current.length}m</span>
        <span style={{ color: '#94a3b8' }}>최고: {highScore}점</span>
      </div>

      {/* Grid Board Canvas */}
      <div style={{
        position: 'relative',
        width: '100%',
        aspectRatio: '1/1',
        background: '#0f0f15',
        borderRadius: '16px',
        overflow: 'hidden',
        border: '2px solid rgba(255,255,255,0.08)',
        marginBottom: '1rem',
        boxSizing: 'border-box'
      }}>
        <canvas 
          ref={canvasRef} 
          width={320} 
          height={320} 
          style={{ width: '100%', height: '100%', display: 'block' }}
        />

        {/* Game Over / Start Overlays */}
        {gameState !== 'playing' && (
          <div style={canvasOverlayStyle}>
            {gameState === 'ready' && (
              <div style={{ textAlign: 'center', padding: '1rem', maxWidth: '240px' }}>
                <h3 style={{ fontSize: '1.1rem', color: '#a855f7', margin: '0 0 0.5rem 0' }}>AI 가전 스네이크</h3>
                <div style={{ ...mergeInstructionsBoxStyle, fontSize: '0.68rem', padding: '0.5rem', marginBottom: '1rem' }}>
                  • 📱 <b>모바일</b>: 하단 방향 D-Pad 컨트롤러를 탭해 조작합니다.<br/>
                  • 💻 <b>PC</b>: 방향키(↑ ↓ ← →)를 사용해 블록을 조작합니다.
                </div>
                <button onClick={initGame} style={playButtonStyle('#a855f7')}>그리드 연결 시작</button>
              </div>
            )}

            {gameState === 'gameover' && (
              <div style={{ textAlign: 'center', padding: '0.75rem', width: '100%' }}>
                <h2 style={{ color: '#f43f5e', margin: '0 0 0.5rem 0', fontSize: '1.5rem', fontWeight: 800 }}>GAME OVER</h2>
                <p style={{ margin: '0 0 1rem 0', fontSize: '0.9rem', color: '#cbd5e1' }}>최종 점수: {score}점</p>
                
                <div style={{ ...customCtaBoxStyle, padding: '0.65rem', margin: '0.3rem 0' }}>
                  <p style={{ margin: 0, fontSize: '0.76rem', color: '#cbd5e1', wordBreak: 'keep-all', lineHeight: '1.4' }}>스마트 가전들을 완벽한 홈 그리드로 연결하듯! 갤러리아진주 조준석 매니저가 백화점 혜택과 비대면 패키지를 가장 합리적인 견적으로 설계해 드립니다! 🐍</p>
                  <button onClick={onNavigateToReservation} style={{ ...ctaButtonActionStyle, width: '100%', padding: '0.55rem', fontSize: '0.8rem', marginTop: '0.5rem' }}>무료 가전 견적상담 받기 📅</button>
                </div>

                <button onClick={initGame} style={{ ...playButtonStyle('#a855f7'), marginTop: '0.75rem', padding: '0.55rem 1.4rem' }}>다시 하기</button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* D-Pad controls for mobile viewports */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '0.4rem',
        width: '100%',
        maxWidth: '180px',
        boxSizing: 'border-box'
      }}>
        {/* UP */}
        <button onClick={() => changeDirection(0, -1)} style={{ ...controllerButtonStyle('#a855f7'), width: '60px', padding: '0.55rem 0' }}>▲</button>
        {/* LEFT / RIGHT */}
        <div style={{ display: 'flex', gap: '0.4rem', width: '100%', justifyContent: 'center' }}>
          <button onClick={() => changeDirection(-1, 0)} style={{ ...controllerButtonStyle('#a855f7'), width: '60px', padding: '0.55rem 0' }}>◀</button>
          <div style={{ width: '60px' }} />
          <button onClick={() => changeDirection(1, 0)} style={{ ...controllerButtonStyle('#a855f7'), width: '60px', padding: '0.55rem 0' }}>▶</button>
        </div>
        {/* DOWN */}
        <button onClick={() => changeDirection(0, 1)} style={{ ...controllerButtonStyle('#a855f7'), width: '60px', padding: '0.55rem 0' }}>▼</button>
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
  borderRadius: 'clamp(12px, 4vw, 24px)',
  padding: 'clamp(0.6rem, 3.5vw, 1.25rem)',
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

const cardStyle = (color) => ({
  background: 'rgba(255, 255, 255, 0.03)',
  border: '1px solid rgba(255, 255, 255, 0.08)',
  borderRadius: '16px',
  padding: '1.5rem',
  cursor: 'pointer',
  textAlign: 'left',
  position: 'relative',
  overflow: 'hidden',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  display: 'flex',
  flexDirection: 'column',
  gap: '0.5rem',
  boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
  borderLeft: `4px solid ${color}`
});

const badgeStyle = (color) => ({
  background: `${color}15`,
  color: color,
  padding: '0.25rem 0.6rem',
  borderRadius: '6px',
  fontSize: '0.7rem',
  fontWeight: 800,
  alignSelf: 'flex-start',
  letterSpacing: '0.5px'
});

const cardTitleStyle = {
  fontSize: '1.15rem',
  fontWeight: 800,
  margin: '0.25rem 0 0 0',
  color: '#ffffff',
  letterSpacing: '-0.5px'
};

const cardDescStyle = {
  fontSize: '0.82rem',
  color: '#94a3b8',
  margin: 0,
  lineHeight: '1.45',
  wordBreak: 'keep-all'
};

const scoreBadgeStyle = {
  fontSize: '0.75rem',
  color: '#cbd5e1',
  fontWeight: 600,
  marginTop: '0.5rem',
  background: 'rgba(255,255,255,0.05)',
  padding: '0.3rem 0.6rem',
  borderRadius: '8px',
  alignSelf: 'flex-start'
};

