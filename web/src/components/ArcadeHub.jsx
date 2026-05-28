import React, { useState, useEffect, useRef } from 'react';

// Web Audio API Retro Sound Synthesizer
const playSound = (type) => {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    const now = ctx.currentTime;
    
    if (type === 'beep') {
      // Brick hit / Move / Flip
      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, now);
      osc.frequency.exponentialRampToValueAtTime(800, now + 0.1);
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.linearRampToValueAtTime(0, now + 0.1);
      osc.start(now);
      osc.stop(now + 0.1);
    } else if (type === 'coin') {
      // Score / Match
      osc.type = 'square';
      osc.frequency.setValueAtTime(523.25, now); // C5
      osc.frequency.setValueAtTime(659.25, now + 0.08); // E5
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.linearRampToValueAtTime(0, now + 0.25);
      osc.start(now);
      osc.stop(now + 0.25);
    } else if (type === 'explosion') {
      // Game over / Hit obstacle
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(150, now);
      osc.frequency.exponentialRampToValueAtTime(40, now + 0.3);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.linearRampToValueAtTime(0, now + 0.3);
      osc.start(now);
      osc.stop(now + 0.3);
    } else if (type === 'win') {
      // Level complete / Game clear
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(523.25, now); // C5
      osc.frequency.setValueAtTime(659.25, now + 0.1); // E5
      osc.frequency.setValueAtTime(783.99, now + 0.2); // G5
      osc.frequency.setValueAtTime(1046.50, now + 0.3); // C6
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.linearRampToValueAtTime(0, now + 0.5);
      osc.start(now);
      osc.stop(now + 0.5);
    }
  } catch (e) {
    console.log("AudioContext blocked or not supported.");
  }
};

export default function ArcadeHub({ onBack, onNavigateToReservation }) {
  const [activeGame, setActiveGame] = useState(null); // 'brick', 'runner', 'match', '2048'
  const [highScore, setHighScore] = useState({
    brick: localStorage.getItem('hs_brick') || 0,
    runner: localStorage.getItem('hs_runner') || 0,
    match: localStorage.getItem('hs_match') || '--',
    t2048: localStorage.getItem('hs_t2048') || 0,
  });

  const updateHighScore = (game, val) => {
    const current = highScore[game];
    if (game === 'match') {
      if (current === '--' || val < parseInt(current)) {
        localStorage.setItem('hs_match', val);
        setHighScore(prev => ({ ...prev, match: val }));
      }
    } else {
      if (val > current) {
        localStorage.setItem(`hs_${game}`, val);
        setHighScore(prev => ({ ...prev, [game]: val }));
      }
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
      overflow: 'hidden'
    }}>
      {/* Background Decorative Glows */}
      <div style={{ position: 'absolute', top: '-10%', left: '-10%', width: '400px', height: '400px', borderRadius: '50%', background: 'rgba(99, 102, 241, 0.15)', filter: 'blur(100px)', pointerEvents: 'none' }}></div>
      <div style={{ position: 'absolute', bottom: '-10%', right: '-10%', width: '400px', height: '400px', borderRadius: '50%', background: 'rgba(236, 72, 153, 0.15)', filter: 'blur(100px)', pointerEvents: 'none' }}></div>

      {/* Header */}
      <div style={{ zIndex: 10, textAlign: 'center', marginBottom: '2rem', maxWidth: '600px' }}>
        <button 
          onClick={activeGame ? () => setActiveGame(null) : onBack} 
          style={{
            background: 'rgba(255, 255, 255, 0.08)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            color: '#cbd5e1',
            padding: '0.5rem 1rem',
            borderRadius: '20px',
            cursor: 'pointer',
            fontSize: '0.85rem',
            marginBottom: '1rem',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            transition: 'all 0.2s'
          }}
        >
          ← {activeGame ? '게임 목록으로' : '홈페이지로 돌아가기'}
        </button>
        <h1 style={{
          fontSize: '2.5rem',
          fontWeight: 800,
          background: 'linear-gradient(135deg, #818cf8 0%, #ec4899 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          margin: '0.5rem 0',
          letterSpacing: '-1px'
        }}>
          JCC 아케이드 게임존
        </h1>
        <p style={{ color: '#94a3b8', fontSize: '0.95rem', margin: 0 }}>
          {activeGame ? '최고 기록에 도전해 보세요!' : '가벼운 미니게임도 즐기고, 19년차 가전 마스터의 시크릿 혜택도 만나보세요.'}
        </p>
      </div>

      {/* Main Area */}
      <div style={{ zIndex: 10, width: '100%', maxWidth: '500px', display: 'flex', justifyContent: 'center' }}>
        {!activeGame && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr',
            gap: '1.5rem',
            width: '100%',
            padding: '0 0.5rem'
          }}>
            {/* Game Card 1: Brick Breaker */}
            <div 
              onClick={() => setActiveGame('brick')}
              style={cardStyle('#818cf8')}
            >
              <div style={badgeStyle('#818cf8')}>BREAK OUT</div>
              <h3 style={cardTitleStyle}>🌌 사이버 브릭 브레이커</h3>
              <p style={cardDescStyle}>패들을 조작해 네온 블록을 시원하게 깨부수세요!</p>
              <div style={scoreBadgeStyle}>최고 점수: {highScore.brick}점</div>
            </div>

            {/* Game Card 2: Space Runner */}
            <div 
              onClick={() => setActiveGame('runner')}
              style={cardStyle('#ec4899')}
            >
              <div style={badgeStyle('#ec4899')}>INFINITE RUNNER</div>
              <h3 style={cardTitleStyle}>🚀 은하계 스페이스 러너</h3>
              <p style={cardDescStyle}>운석을 점프해 피하고 보너스 별을 수집하세요!</p>
              <div style={scoreBadgeStyle}>최고 점수: {highScore.runner}점</div>
            </div>

            {/* Game Card 3: Card Match */}
            <div 
              onClick={() => setActiveGame('match')}
              style={cardStyle('#34d399')}
            >
              <div style={badgeStyle('#34d399')}>MEMORY GAME</div>
              <h3 style={cardTitleStyle}>🃏 네온 가전 카드 매칭</h3>
              <p style={cardDescStyle}>마스터 가전의 카드를 뒤집어 짝을 맞춰 보세요!</p>
              <div style={scoreBadgeStyle}>최단 시간: {highScore.match === '--' ? '--' : `${highScore.match}초`}</div>
            </div>

            {/* Game Card 4: 2048 Neon */}
            <div 
              onClick={() => setActiveGame('t2048')}
              style={cardStyle('#fbbf24')}
            >
              <div style={badgeStyle('#fbbf24')}>PUZZLE</div>
              <h3 style={cardTitleStyle}>🧩 2048 네온 슬라이드</h3>
              <p style={cardDescStyle}>타일을 합쳐 더욱 큰 AI 가전 등급을 완성하세요!</p>
              <div style={scoreBadgeStyle}>최고 점수: {highScore.t2048}점</div>
            </div>
          </div>
        )}

        {/* Dynamic Game Component Loading */}
        {activeGame === 'brick' && <BrickBreaker onGameOver={(score) => updateHighScore('brick', score)} onNavigateToReservation={onNavigateToReservation} />}
        {activeGame === 'runner' && <SpaceRunner onGameOver={(score) => updateHighScore('runner', score)} onNavigateToReservation={onNavigateToReservation} />}
        {activeGame === 'match' && <CardMatch onGameWin={(sec) => updateHighScore('match', sec)} onNavigateToReservation={onNavigateToReservation} />}
        {activeGame === 't2048' && <Neon2048 onGameOver={(score) => updateHighScore('t2048', score)} onNavigateToReservation={onNavigateToReservation} />}
      </div>
    </div>
  );
}

// Cards Style Helpers
const cardStyle = (glowColor) => ({
  background: 'rgba(30, 30, 40, 0.45)',
  border: '1px solid rgba(255, 255, 255, 0.08)',
  borderRadius: '16px',
  padding: '1.5rem',
  cursor: 'pointer',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  backdropFilter: 'blur(20px)',
  boxShadow: `0 4px 30px rgba(0, 0, 0, 0.4)`,
  position: 'relative',
  overflow: 'hidden'
});

const badgeStyle = (bgColor) => ({
  display: 'inline-block',
  background: bgColor,
  color: '#0f172a',
  fontSize: '0.75rem',
  fontWeight: 800,
  padding: '0.2rem 0.6rem',
  borderRadius: '20px',
  marginBottom: '0.75rem',
  letterSpacing: '0.5px'
});

const cardTitleStyle = {
  fontSize: '1.25rem',
  fontWeight: 700,
  margin: '0 0 0.5rem 0',
  color: '#f8fafc'
};

const cardDescStyle = {
  fontSize: '0.85rem',
  color: '#94a3b8',
  margin: '0 0 1rem 0',
  lineHeight: '1.4'
};

const scoreBadgeStyle = {
  display: 'inline-flex',
  fontSize: '0.85rem',
  fontWeight: 600,
  color: '#e2e8f0',
  background: 'rgba(255, 255, 255, 0.05)',
  padding: '0.3rem 0.8rem',
  borderRadius: '12px',
  border: '1px solid rgba(255, 255, 255, 0.05)'
};


// ==========================================
// 1. NEON BRICK BREAKER GAME COMPONENT
// ==========================================
function BrickBreaker({ onGameOver, onNavigateToReservation }) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [score, setScore] = useState(0);
  const [gameState, setGameState] = useState('ready'); // 'ready', 'playing', 'gameover', 'win'

  const scoreRef = useRef(0);
  const stateRef = useRef('ready');

  // Game Settings Refs
  const ball = useRef({ x: 200, y: 350, dx: 4, dy: -4, radius: 8 });
  const paddle = useRef({ x: 150, width: 80, height: 12 });
  const bricks = useRef([]);
  const brickRows = 4;
  const brickCols = 5;

  const initGame = () => {
    scoreRef.current = 0;
    setScore(0);
    stateRef.current = 'playing';
    setGameState('playing');
    
    // Ball init
    ball.current = {
      x: 250,
      y: 400,
      dx: (Math.random() > 0.5 ? 3 : -3) * 1.2,
      dy: -4,
      radius: 8
    };

    // Paddle init
    paddle.current.x = 210;

    // Bricks init
    bricks.current = [];
    for (let r = 0; r < brickRows; r++) {
      bricks.current[r] = [];
      for (let c = 0; c < brickCols; c++) {
        bricks.current[r][c] = { x: 0, y: 0, status: 1 };
      }
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animId;

    // Game loop
    const draw = () => {
      // Clear
      ctx.fillStyle = '#0f0f15';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      if (stateRef.current === 'playing') {
        // Update ball position
        ball.current.x += ball.current.dx;
        ball.current.y += ball.current.dy;

        // Collision: Left/Right walls
        if (ball.current.x + ball.current.radius > canvas.width || ball.current.x - ball.current.radius < 0) {
          ball.current.dx = -ball.current.dx;
          playSound('beep');
        }
        // Collision: Top wall
        if (ball.current.y - ball.current.radius < 0) {
          ball.current.dy = -ball.current.dy;
          playSound('beep');
        }

        // Collision: Paddle
        if (
          ball.current.y + ball.current.radius > canvas.height - 30 &&
          ball.current.x > paddle.current.x &&
          ball.current.x < paddle.current.x + paddle.current.width
        ) {
          // Angle redirection depending on where ball hits the paddle
          const hitPoint = ball.current.x - (paddle.current.x + paddle.current.width/2);
          ball.current.dx = hitPoint * 0.15;
          ball.current.dy = -Math.abs(ball.current.dy);
          playSound('beep');
        }

        // Collision: Bottom wall (Game over)
        if (ball.current.y + ball.current.radius > canvas.height) {
          stateRef.current = 'gameover';
          setGameState('gameover');
          onGameOver(scoreRef.current);
          playSound('explosion');
        }

        // Bricks drawing and collision
        let bricksLeft = 0;
        const bW = 80;
        const bH = 20;
        const bPad = 10;
        const bTop = 50;
        const bLeft = 35;

        for (let r = 0; r < brickRows; r++) {
          for (let c = 0; c < brickCols; c++) {
            const b = bricks.current[r][c];
            if (b.status === 1) {
              bricksLeft++;
              const bX = (c * (bW + bPad)) + bLeft;
              const bY = (r * (bH + bPad)) + bTop;
              b.x = bX;
              b.y = bY;

              // Collision detection
              if (
                ball.current.x > bX &&
                ball.current.x < bX + bW &&
                ball.current.y > bY &&
                ball.current.y < bY + bH
              ) {
                ball.current.dy = -ball.current.dy;
                b.status = 0;
                scoreRef.current += 10;
                setScore(scoreRef.current);
                playSound('coin');
              }

              // Draw neon brick
              ctx.shadowBlur = 10;
              ctx.shadowColor = r === 0 ? '#ec4899' : r === 1 ? '#818cf8' : r === 2 ? '#34d399' : '#fbbf24';
              ctx.fillStyle = r === 0 ? 'rgba(236, 72, 153, 0.8)' : r === 1 ? 'rgba(129, 140, 248, 0.8)' : r === 2 ? 'rgba(52, 211, 153, 0.8)' : 'rgba(251, 191, 36, 0.8)';
              ctx.fillRect(bX, bY, bW, bH);
              ctx.shadowBlur = 0;
            }
          }
        }

        // Win check
        if (bricksLeft === 0) {
          stateRef.current = 'win';
          setGameState('win');
          onGameOver(scoreRef.current);
          playSound('win');
        }
      }

      // Draw Paddle
      ctx.shadowBlur = 15;
      ctx.shadowColor = '#6366f1';
      ctx.fillStyle = '#6366f1';
      ctx.fillRect(paddle.current.x, canvas.height - 30, paddle.current.width, paddle.current.height);
      ctx.shadowBlur = 0;

      // Draw Ball
      if (stateRef.current === 'playing') {
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#f43f5e';
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(ball.current.x, ball.current.y, ball.current.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      animId = requestAnimationFrame(draw);
    };

    draw();
    return () => cancelAnimationFrame(animId);
  }, []);

  // Handle Touch/Mouse Controls for Paddle
  const handleMove = (clientX) => {
    if (stateRef.current !== 'playing') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const relativeX = clientX - rect.left;
    
    // Set paddle x centered to touch/mouse
    let targetX = relativeX - paddle.current.width / 2;
    if (targetX < 0) targetX = 0;
    if (targetX > canvas.width - paddle.current.width) targetX = canvas.width - paddle.current.width;
    paddle.current.x = targetX;
  };

  return (
    <div ref={containerRef} style={gameContainerStyle}>
      <div style={gameHeaderStyle}>
        <span>🧱 브릭 브레이커</span>
        <span style={{ color: '#818cf8', fontWeight: 800 }}>SCORE: {score}</span>
      </div>

      <div style={{ position: 'relative', width: '100%', aspectRatio: '5/6', background: '#0f0f15', borderRadius: '12px', overflow: 'hidden' }}>
        <canvas 
          ref={canvasRef} 
          width={500} 
          height={600} 
          style={{ width: '100%', height: '100%', display: 'block' }}
          onMouseMove={(e) => handleMove(e.clientX)}
          onTouchMove={(e) => {
            if (e.touches.length > 0) {
              handleMove(e.touches[0].clientX);
            }
          }}
        />

        {/* Screens */}
        {gameState !== 'playing' && (
          <div style={canvasOverlayStyle}>
            {gameState === 'ready' && (
              <div style={{ textAlign: 'center', padding: '1rem', maxWidth: '360px' }}>
                <h3 style={{ margin: '0 0 0.5rem 0' }}>네온 벽돌 깨기</h3>
                <div style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', padding: '0.75rem', fontSize: '0.75rem', color: '#cbd5e1', textAlign: 'left', margin: '0 auto 1.25rem auto', lineHeight: '1.5' }}>
                  <div style={{ fontWeight: 700, color: '#818cf8', marginBottom: '0.25rem' }}>📖 게임 방법</div>
                  • 📱 <b>모바일</b>: 화면 패들을 터치해 좌우로 부드럽게 드래그합니다.<br/>
                  • 💻 <b>PC</b>: 마우스 커서를 좌우로 움직여 패들을 조절합니다.<br/>
                  • 🎯 <b>목표</b>: 공이 아래로 떨어지지 않게 튕겨 상단 네온 블록을 모두 격파하세요!
                </div>
                <button onClick={initGame} style={playButtonStyle('#818cf8')}>게임 시작</button>
              </div>
            )}

            {gameState === 'gameover' && (
              <div style={{ textAlign: 'center', padding: '1rem' }}>
                <h2 style={{ color: '#f43f5e', margin: '0 0 0.5rem 0' }}>GAME OVER</h2>
                <p style={{ margin: '0 0 1.5rem 0' }}>최종 점수: {score}점</p>
                
                <div style={arcadeCtaStyle}>
                  <p style={{ margin: '0 0 0.75rem 0', fontSize: '0.85rem', color: '#cbd5e1' }}>앗, 아쉽네요! 19년 마스터와 함께 가전 졸업 설계는 훨씬 더 쉽고 막힘없이 성공할 수 있답니다! 🎓</p>
                  <button onClick={onNavigateToReservation} style={ctaButtonStyle}>진센조 비대면 상담 예약하기 💍</button>
                </div>

                <button onClick={initGame} style={{ ...playButtonStyle('#818cf8'), marginTop: '1rem' }}>다시 시작하기</button>
              </div>
            )}

            {gameState === 'win' && (
              <div style={{ textAlign: 'center', padding: '1rem' }}>
                <h2 style={{ color: '#34d399', margin: '0 0 0.5rem 0' }}>🏆 STAGE CLEAR!</h2>
                <p style={{ margin: '0 0 1.5rem 0' }}>최종 점수: {score}점</p>
                
                <div style={arcadeCtaStyle}>
                  <p style={{ margin: '0 0 0.75rem 0', fontSize: '0.85rem', color: '#cbd5e1' }}>완벽한 클리어! 뛰어난 공간 감각을 가지셨네요! 우리 집 평면에 꼭 맞는 명품 가전 레이아웃도 마스터 조준석 매니저에게 설계 받아보세요. 📐</p>
                  <button onClick={onNavigateToReservation} style={ctaButtonStyle}>마스터에게 무료 배치설계 받기 🎁</button>
                </div>

                <button onClick={initGame} style={{ ...playButtonStyle('#34d399'), marginTop: '1rem' }}>한 판 더 하기</button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}


// ==========================================
// 2. INFINITE RUNNER GAME COMPONENT
// ==========================================
function SpaceRunner({ onGameOver, onNavigateToReservation }) {
  const canvasRef = useRef(null);
  const [score, setScore] = useState(0);
  const [gameState, setGameState] = useState('ready');

  const scoreRef = useRef(0);
  const stateRef = useRef('ready');

  // Physics Refs
  const shipY = useRef(200);
  const shipVelocity = useRef(0);
  const gravity = 0.5;
  const lift = -9;
  const shipHeight = 24;
  const shipWidth = 35;

  const obstacles = useRef([]);
  const stars = useRef([]);
  const frameCount = useRef(0);
  const speed = useRef(4);

  const initGame = () => {
    scoreRef.current = 0;
    setScore(0);
    shipY.current = 200;
    shipVelocity.current = 0;
    obstacles.current = [];
    stars.current = [];
    frameCount.current = 0;
    speed.current = 4.5;
    stateRef.current = 'playing';
    setGameState('playing');
  };

  const jump = () => {
    if (stateRef.current === 'playing') {
      shipVelocity.current = lift;
      playSound('beep');
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animId;

    const draw = () => {
      ctx.fillStyle = '#0b0b12';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      if (stateRef.current === 'playing') {
        frameCount.current++;
        
        // Dynamic speed increase
        if (frameCount.current % 300 === 0) {
          speed.current += 0.5;
        }

        // Apply physics
        shipVelocity.current += gravity;
        shipY.current += shipVelocity.current;

        // Boundaries
        if (shipY.current > canvas.height - shipHeight) {
          shipY.current = canvas.height - shipHeight;
          shipVelocity.current = 0;
        }
        if (shipY.current < 0) {
          shipY.current = 0;
          shipVelocity.current = 0;
        }

        // Generate stars (coins)
        if (frameCount.current % 90 === 0) {
          stars.current.push({
            x: canvas.width,
            y: Math.random() * (canvas.height - 50) + 25,
            radius: 7,
            collected: false
          });
        }

        // Generate obstacles
        if (frameCount.current % 120 === 0) {
          const obsHeight = Math.random() * 80 + 30;
          const isTop = Math.random() > 0.5;
          obstacles.current.push({
            x: canvas.width,
            y: isTop ? 0 : canvas.height - obsHeight,
            width: 30,
            height: obsHeight,
            passed: false
          });
        }

        // Draw and update stars
        for (let i = stars.current.length - 1; i >= 0; i--) {
          const s = stars.current[i];
          s.x -= speed.current;

          if (!s.collected) {
            // Draw shining gold star
            ctx.shadowBlur = 10;
            ctx.shadowColor = '#fbbf24';
            ctx.fillStyle = '#fbbf24';
            ctx.beginPath();
            ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;

            // Collision check
            const dist = Math.hypot(s.x - 60, s.y - (shipY.current + shipHeight/2));
            if (dist < s.radius + shipWidth/2) {
              s.collected = true;
              scoreRef.current += 15;
              setScore(scoreRef.current);
              playSound('coin');
            }
          }

          if (s.x < -20) stars.current.splice(i, 1);
        }

        // Draw and update obstacles
        for (let i = obstacles.current.length - 1; i >= 0; i--) {
          const o = obstacles.current[i];
          o.x -= speed.current;

          // Draw neon red obstacle
          ctx.shadowBlur = 12;
          ctx.shadowColor = '#f43f5e';
          ctx.fillStyle = 'rgba(244, 63, 94, 0.85)';
          ctx.fillRect(o.x, o.y, o.width, o.height);
          ctx.shadowBlur = 0;

          // Collision check
          if (
            o.x < 50 + shipWidth &&
            o.x + o.width > 50 &&
            shipY.current < o.y + o.height &&
            shipY.current + shipHeight > o.y
          ) {
            stateRef.current = 'gameover';
            setGameState('gameover');
            onGameOver(scoreRef.current);
            playSound('explosion');
          }

          // Score check for passing obstacles
          if (!o.passed && o.x + o.width < 50) {
            o.passed = true;
            scoreRef.current += 10;
            setScore(scoreRef.current);
          }

          if (o.x < -40) obstacles.current.splice(i, 1);
        }
      }

      // Draw Spaceship
      ctx.shadowBlur = 15;
      ctx.shadowColor = '#ec4899';
      ctx.fillStyle = '#ec4899';
      ctx.beginPath();
      // Spaceship triangle shape pointing right
      ctx.moveTo(50, shipY.current);
      ctx.lineTo(50 + shipWidth, shipY.current + shipHeight / 2);
      ctx.lineTo(50, shipY.current + shipHeight);
      ctx.closePath();
      ctx.fill();
      // Neon thruster light
      if (stateRef.current === 'playing') {
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(46, shipY.current + shipHeight / 2, 4 + Math.random()*3, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.shadowBlur = 0;

      animId = requestAnimationFrame(draw);
    };

    draw();
    return () => cancelAnimationFrame(animId);
  }, []);

  return (
    <div style={gameContainerStyle}>
      <div style={gameHeaderStyle}>
        <span>🚀 은하계 스페이스 러너</span>
        <span style={{ color: '#ec4899', fontWeight: 800 }}>SCORE: {score}</span>
      </div>

      <div 
        onClick={jump}
        onTouchStart={(e) => { e.preventDefault(); jump(); }}
        style={{ position: 'relative', width: '100%', aspectRatio: '5/3', background: '#0b0b12', borderRadius: '12px', overflow: 'hidden', cursor: 'pointer' }}
      >
        <canvas 
          ref={canvasRef} 
          width={500} 
          height={300} 
          style={{ width: '100%', height: '100%', display: 'block' }}
        />

        {/* Screens */}
        {gameState !== 'playing' && (
          <div style={canvasOverlayStyle}>
            {gameState === 'ready' && (
              <div style={{ textAlign: 'center', padding: '1rem', maxWidth: '360px' }}>
                <h3 style={{ margin: '0 0 0.5rem 0' }}>은하계 스페이스 러너</h3>
                <div style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', padding: '0.75rem', fontSize: '0.75rem', color: '#cbd5e1', textAlign: 'left', margin: '0 auto 1.25rem auto', lineHeight: '1.5' }}>
                  <div style={{ fontWeight: 700, color: '#ec4899', marginBottom: '0.25rem' }}>📖 게임 방법</div>
                  • 📱 <b>모바일</b>: 화면 아무 곳이나 터치하면 우주선이 위로 가속합니다.<br/>
                  • 💻 <b>PC</b>: 마우스 클릭 시 우주선이 위로 가속합니다.<br/>
                  • 🎯 <b>목표</b>: 장애물(운석)을 점프로 피하고, 고득점 황금 별을 획득하세요!
                </div>
                <button onClick={(e) => { e.stopPropagation(); initGame(); }} style={playButtonStyle('#ec4899')}>우주 비행 시작</button>
              </div>
            )}

            {gameState === 'gameover' && (
              <div style={{ textAlign: 'center', padding: '1rem' }} onClick={(e) => e.stopPropagation()}>
                <h2 style={{ color: '#f43f5e', margin: '0 0 0.5rem 0' }}>비행 종료</h2>
                <p style={{ margin: '0 0 1.5rem 0' }}>최종 탐사 점수: {score}점</p>
                
                <div style={arcadeCtaStyle}>
                  <p style={{ margin: '0 0 0.75rem 0', fontSize: '0.85rem', color: '#cbd5e1' }}>우주 비행선처럼 스마트한 원격 비대면 가전 설계! 오직 진센조 19년 마스터와 함께라면 카톡 하나로 모든 견적 비교 끝입니다! 🚀</p>
                  <button onClick={onNavigateToReservation} style={ctaButtonStyle}>진센조 비대면 즉시 무료설계 신청</button>
                </div>

                <button onClick={initGame} style={{ ...playButtonStyle('#ec4899'), marginTop: '1rem' }}>다시 탐사하기</button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}


// ==========================================
// 3. CARD MATCHING COMPONENT
// ==========================================
function CardMatch({ onGameWin, onNavigateToReservation }) {
  const appliances = [
    { name: '📺 비스포크 TV', emoji: '📺' },
    { name: '❄️ 비스포크 냉장고', emoji: '❄️' },
    { name: '🧺 비스포크 드럼세탁기', emoji: '🧺' },
    { name: '🌀 제트 청소기', emoji: '🌀' },
    { name: '🌬️ 큐브 공기청정기', emoji: '🌬️' },
    { name: '🍽️ 비스포크 식기세척기', emoji: '🍽️' },
    { name: '🔥 비스포크 인덕션', emoji: '🔥' },
    { name: '🤖 비스포크 스팀봇', emoji: '🤖' },
  ];

  const [cards, setCards] = useState([]);
  const [flippedIndices, setFlippedIndices] = useState([]);
  const [matchedPairs, setMatchedPairs] = useState([]);
  const [moves, setMoves] = useState(0);
  const [sec, setSec] = useState(0);
  const [gameState, setGameState] = useState('ready'); // 'ready', 'playing', 'win'
  
  const timerRef = useRef(null);

  const initGame = () => {
    // Generate 16 card deck (pairs of 8 appliances)
    const deck = [...appliances, ...appliances]
      .map((app, idx) => ({ ...app, uniqueId: idx }))
      .sort(() => 0.5 - Math.random());
    
    setCards(deck);
    setFlippedIndices([]);
    setMatchedPairs([]);
    setMoves(0);
    setSec(0);
    setGameState('playing');
    playSound('win');

    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setSec(prev => prev + 1);
    }, 1000);
  };

  const handleCardClick = (idx) => {
    if (gameState !== 'playing') return;
    if (flippedIndices.includes(idx) || matchedPairs.includes(cards[idx].name)) return;
    if (flippedIndices.length >= 2) return;

    playSound('beep');
    const newFlipped = [...flippedIndices, idx];
    setFlippedIndices(newFlipped);

    if (newFlipped.length === 2) {
      setMoves(prev => prev + 1);
      const [firstIdx, secondIdx] = newFlipped;
      
      if (cards[firstIdx].name === cards[secondIdx].name) {
        // Match found
        setTimeout(() => {
          setMatchedPairs(prev => [...prev, cards[firstIdx].name]);
          setFlippedIndices([]);
          playSound('coin');
          
          // Victory check
          if (matchedPairs.length + 1 === appliances.length) {
            setGameState('win');
            clearInterval(timerRef.current);
            onGameWin(sec);
            playSound('win');
          }
        }, 300);
      } else {
        // Flip back
        setTimeout(() => {
          setFlippedIndices([]);
        }, 1000);
      }
    }
  };

  useEffect(() => {
    return () => clearInterval(timerRef.current);
  }, []);

  return (
    <div style={gameContainerStyle}>
      <div style={gameHeaderStyle}>
        <span>🃏 가전 카드 매칭</span>
        <span style={{ color: '#34d399', fontWeight: 800 }}>⏳ {sec}초 | 🔄 {moves}회</span>
      </div>

      <div style={{
        background: '#0d1117',
        borderRadius: '12px',
        padding: '1rem',
        minHeight: '320px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative'
      }}>
        {gameState === 'ready' && (
          <div style={{ textAlign: 'center', padding: '1rem', maxWidth: '360px' }}>
            <h3 style={{ margin: '0 0 0.5rem 0' }}>가전 카드 뒤집기</h3>
            <div style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', padding: '0.75rem', fontSize: '0.75rem', color: '#cbd5e1', textAlign: 'left', margin: '0 auto 1.25rem auto', lineHeight: '1.5' }}>
              <div style={{ fontWeight: 700, color: '#34d399', marginBottom: '0.25rem' }}>📖 게임 방법</div>
              • 📱/💻 <b>조작</b>: 카드를 터치/클릭하여 뒤집습니다.<br/>
              • 🎯 <b>목표</b>: 뒤집힌 가전 아이콘의 짝을 기억해 가장 빠른 속도로 8쌍의 똑같은 가전 짝을 완성하세요!
            </div>
            <button onClick={initGame} style={playButtonStyle('#34d399')}>매칭 챌린지 시작</button>
          </div>
        )}

        {gameState === 'playing' && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '0.5rem',
            width: '100%'
          }}>
            {cards.map((card, idx) => {
              const isFlipped = flippedIndices.includes(idx) || matchedPairs.includes(card.name);
              return (
                <div 
                  key={card.uniqueId} 
                  onClick={() => handleCardClick(idx)}
                  style={{
                    aspectRatio: '1/1',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    perspective: '1000px',
                    position: 'relative',
                    transition: 'transform 0.4s',
                    transformStyle: 'preserve-3d',
                    transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)'
                  }}
                >
                  {/* Card Back */}
                  <div style={{
                    position: 'absolute',
                    width: '100%',
                    height: '100%',
                    backfaceVisibility: 'hidden',
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(52, 211, 153, 0.4)',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.25rem',
                    boxShadow: 'inset 0 0 8px rgba(52, 211, 153, 0.15)'
                  }}>
                    JCC
                  </div>
                  {/* Card Front */}
                  <div style={{
                    position: 'absolute',
                    width: '100%',
                    height: '100%',
                    backfaceVisibility: 'hidden',
                    background: 'rgba(52, 211, 153, 0.15)',
                    border: '1.5px solid #34d399',
                    borderRadius: '8px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transform: 'rotateY(180deg)',
                    fontSize: '1.75rem',
                    boxShadow: '0 0 15px rgba(52, 211, 153, 0.3)'
                  }}>
                    {card.emoji}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {gameState === 'win' && (
          <div style={{ textAlign: 'center', padding: '1rem', width: '100%' }}>
            <h2 style={{ color: '#34d399', margin: '0 0 0.5rem 0' }}>🏆 CHALLENGE CLEAR!</h2>
            <p style={{ margin: '0 0 1.5rem 0' }}>걸린 시간: {sec}초 | 움직인 횟수: {moves}회</p>
            
            <div style={arcadeCtaStyle}>
              <p style={{ margin: '0 0 0.75rem 0', fontSize: '0.85rem', color: '#cbd5e1' }}>대단한 뇌지컬입니다! 복잡하고 골치 아픈 삼성스토어 갤러리아진주의 혜택 짝 맞추기 설계도, 진센조 마스터 조준석 매니저가 한 방에 시원하게 큐레이션 해드립니다! 🃏</p>
              <button onClick={onNavigateToReservation} style={ctaButtonStyle}>진센조 명품 가전 맞춤 설계 받아보기 🎓</button>
            </div>

            <button onClick={initGame} style={{ ...playButtonStyle('#34d399'), marginTop: '1.5rem' }}>다시 대결하기</button>
          </div>
        )}
      </div>
    </div>
  );
}


// ==========================================
// 4. NEON 2048 GAME COMPONENT
// ==========================================
function Neon2048({ onGameOver, onNavigateToReservation }) {
  const [board, setBoard] = useState(Array(16).fill(0));
  const [score, setScore] = useState(0);
  const [gameState, setGameState] = useState('ready'); // 'ready', 'playing', 'gameover'
  const touchStart = useRef({ x: 0, y: 0 });

  const getTileLabel = (val) => {
    if (val === 0) return "";
    // Customize 2048 to reflect JCC Samsung Appliance upgrade journey
    const labels = {
      2: "비스포크 큐커",
      4: "제트 청소기",
      8: "인덕션 쿡탑",
      16: "식기세척기",
      32: "공기청정기 큐브",
      64: "비스포크 정수기",
      128: "에어드레서",
      256: "비스포크 슈드레서",
      512: "비스포크 드럼세탁기",
      1024: "비스포크 냉장고 4도어",
      2048: "비스포크 TV 8K 성지졸업"
    };
    return labels[val] || `${val}`;
  };

  const getTileColor = (val) => {
    const colors = {
      2: 'rgba(255, 255, 255, 0.08)',
      4: 'rgba(129, 140, 248, 0.15)',
      8: 'rgba(129, 140, 248, 0.25)',
      16: 'rgba(236, 72, 153, 0.15)',
      32: 'rgba(236, 72, 153, 0.3)',
      64: 'rgba(251, 191, 36, 0.2)',
      128: 'rgba(251, 191, 36, 0.35)',
      256: 'rgba(52, 211, 153, 0.2)',
      512: 'rgba(52, 211, 153, 0.35)',
      1024: 'rgba(239, 68, 68, 0.25)',
      2048: 'rgba(239, 68, 68, 0.45)'
    };
    return colors[val] || 'rgba(30, 30, 40, 0.45)';
  };

  const getTileBorder = (val) => {
    const borders = {
      2: '1px solid rgba(255,255,255,0.1)',
      4: '1.5px solid #818cf8',
      8: '2px solid #818cf8',
      16: '1.5px solid #ec4899',
      32: '2px solid #ec4899',
      64: '1.5px solid #fbbf24',
      128: '2px solid #fbbf24',
      256: '1.5px solid #34d399',
      512: '2px solid #34d399',
      1024: '2px solid #f43f5e',
      2048: '3px dashed #f43f5e'
    };
    return borders[val] || '1px solid rgba(255,255,255,0.05)';
  };

  const initGame = () => {
    let newBoard = Array(16).fill(0);
    newBoard = spawnTile(newBoard);
    newBoard = spawnTile(newBoard);
    setBoard(newBoard);
    setScore(0);
    setGameState('playing');
    playSound('win');
  };

  const spawnTile = (currentBoard) => {
    const empties = [];
    currentBoard.forEach((val, idx) => {
      if (val === 0) empties.push(idx);
    });
    if (empties.length === 0) return currentBoard;
    const randomIdx = empties[Math.floor(Math.random() * empties.length)];
    const temp = [...currentBoard];
    temp[randomIdx] = Math.random() > 0.9 ? 4 : 2;
    return temp;
  };

  // 2048 Slide Math Logic
  const compress = (row) => {
    const cleanRow = row.filter(val => val !== 0);
    const missing = 4 - cleanRow.length;
    return cleanRow.concat(Array(missing).fill(0));
  };

  const merge = (row, scoreAdder) => {
    for (let i = 0; i < 3; i++) {
      if (row[i] !== 0 && row[i] === row[i + 1]) {
        row[i] = row[i] * 2;
        scoreAdder.current += row[i];
        row[i + 1] = 0;
        playSound('beep');
      }
    }
    return row;
  };

  const slideLeft = (currentBoard, scoreAdder) => {
    let nextBoard = [];
    for (let i = 0; i < 16; i += 4) {
      const row = currentBoard.slice(i, i + 4);
      const compressed = compress(row);
      const merged = merge(compressed, scoreAdder);
      const finalRow = compress(merged);
      nextBoard = nextBoard.concat(finalRow);
    }
    return nextBoard;
  };

  const rotateLeft = (currentBoard) => {
    const temp = Array(16).fill(0);
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        temp[c * 4 + (3 - r)] = currentBoard[r * 4 + c];
      }
    }
    return temp;
  };

  const handleMove = (dir) => {
    if (gameState !== 'playing') return;
    let current = [...board];
    let scoreAdder = { current: 0 };
    
    // Rotate to always slide left
    let rotations = 0;
    if (dir === 'up') rotations = 1;
    if (dir === 'right') rotations = 2;
    if (dir === 'down') rotations = 3;

    for (let i = 0; i < rotations; i++) current = rotateLeft(current);
    
    let movedBoard = slideLeft(current, scoreAdder);
    
    // Rotate back
    const reverseRotations = (4 - rotations) % 4;
    for (let i = 0; i < reverseRotations; i++) movedBoard = rotateLeft(movedBoard);

    // If board changed, spawn new tile
    if (JSON.stringify(board) !== JSON.stringify(movedBoard)) {
      const newScore = score + scoreAdder.current;
      setScore(newScore);
      
      const spawned = spawnTile(movedBoard);
      setBoard(spawned);
      
      // Game over check
      if (isGameOver(spawned)) {
        setGameState('gameover');
        onGameOver(newScore);
        playSound('explosion');
      }
    }
  };

  const isGameOver = (tempBoard) => {
    if (tempBoard.includes(0)) return false;
    // Check horizontal merges
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 3; c++) {
        if (tempBoard[r * 4 + c] === tempBoard[r * 4 + c + 1]) return false;
      }
    }
    // Check vertical merges
    for (let c = 0; c < 4; c++) {
      for (let r = 0; r < 3; r++) {
        if (tempBoard[r * 4 + c] === tempBoard[(r + 1) * 4 + c]) return false;
      }
    }
    return true;
  };

  // Keyboard controls for PC
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (gameState !== 'playing') return;
      if (e.key === 'ArrowUp' || e.key === 'w') { e.preventDefault(); handleMove('up'); }
      if (e.key === 'ArrowRight' || e.key === 'd') { e.preventDefault(); handleMove('right'); }
      if (e.key === 'ArrowDown' || e.key === 's') { e.preventDefault(); handleMove('down'); }
      if (e.key === 'ArrowLeft' || e.key === 'a') { e.preventDefault(); handleMove('left'); }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [board, score, gameState]);

  // Touch Swipe Gesture Math for Mobile
  const handleTouchStart = (e) => {
    if (e.touches.length > 0) {
      touchStart.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY
      };
    }
  };

  const handleTouchEnd = (e) => {
    if (e.changedTouches.length === 0) return;
    const dx = e.changedTouches[0].clientX - touchStart.current.x;
    const dy = e.changedTouches[0].clientY - touchStart.current.y;
    
    // Minimum threshold for swipe
    if (Math.hypot(dx, dy) > 30) {
      if (Math.abs(dx) > Math.abs(dy)) {
        if (dx > 0) handleMove('right');
        else handleMove('left');
      } else {
        if (dy > 0) handleMove('down');
        else handleMove('up');
      }
    }
  };

  return (
    <div style={gameContainerStyle}>
      <div style={gameHeaderStyle}>
        <span>🧩 2048 네온 슬라이드</span>
        <span style={{ color: '#fbbf24', fontWeight: 800 }}>SCORE: {score}</span>
      </div>

      <div 
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        style={{
          background: '#0d1117',
          borderRadius: '12px',
          padding: '0.75rem',
          position: 'relative',
          width: '100%',
          aspectRatio: '1/1',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          boxSizing: 'border-box'
        }}
      >
        {gameState === 'ready' && (
          <div style={{ textAlign: 'center', padding: '1rem', maxWidth: '360px' }}>
            <h3 style={{ margin: '0 0 0.5rem 0' }}>2048 네온 슬라이드</h3>
            <div style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', padding: '0.75rem', fontSize: '0.75rem', color: '#cbd5e1', textAlign: 'left', margin: '0 auto 1.25rem auto', lineHeight: '1.5' }}>
              <div style={{ fontWeight: 700, color: '#fbbf24', marginBottom: '0.25rem' }}>📖 게임 방법</div>
              • 📱 <b>모바일</b>: 화면을 상하좌우 방향으로 터치 슬라이드(스와이프)합니다.<br/>
              • 💻 <b>PC</b>: 키보드 방향키 또는 W, S, A, D 키를 활용합니다.<br/>
              • 🎯 <b>목표</b>: 타일을 합쳐 최고 등급인 2048(비스포크 TV 8K)을 완성하세요!
            </div>
            <button onClick={initGame} style={playButtonStyle('#fbbf24')}>슬라이드 시작</button>
          </div>
        )}

        {gameState === 'playing' && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gridTemplateRows: 'repeat(4, 1fr)',
            gap: '0.5rem',
            width: '100%',
            height: '100%',
            aspectRatio: '1/1'
          }}>
            {board.map((val, idx) => (
              <div 
                key={idx}
                style={{
                  background: getTileColor(val),
                  border: getTileBorder(val),
                  borderRadius: '8px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '0.2rem',
                  boxSizing: 'border-box',
                  transition: 'all 0.15s ease-out',
                  boxShadow: val > 0 ? `0 0 12px ${getTileColor(val).replace(/[\d.]+\)$/, '0.2)')}` : 'none'
                }}
              >
                {val > 0 && (
                  <>
                    <span style={{ fontSize: '1rem', fontWeight: 800, color: '#f8fafc' }}>{val}</span>
                    <span style={{ fontSize: '0.5rem', color: '#94a3b8', textAlign: 'center', wordBreak: 'keep-all', marginTop: '2px', fontWeight: 600 }}>{getTileLabel(val)}</span>
                  </>
                )}
              </div>
            ))}
          </div>
        )}

        {gameState === 'gameover' && (
          <div style={canvasOverlayStyle}>
            <div style={{ textAlign: 'center', padding: '1rem' }}>
              <h2 style={{ color: '#f43f5e', margin: '0 0 0.5rem 0' }}>GAME OVER</h2>
              <p style={{ margin: '0 0 1.5rem 0' }}>최종 지수: {score}점</p>
              
              <div style={arcadeCtaStyle}>
                <p style={{ margin: '0 0 0.75rem 0', fontSize: '0.85rem', color: '#cbd5e1' }}>가전을 2048까지 병합하고 조립하듯! 19년 마스터 조준석 매니저가 백화점 프리미엄과 로드샵 실속형을 가장 정밀하게 결합해 최저 단가 설계를 완성해 드립니다! 🧩</p>
                <button onClick={onNavigateToReservation} style={ctaButtonStyle}>1:1 무료 가전 조립 설계상담 받기 💎</button>
              </div>

              <button onClick={initGame} style={{ ...playButtonStyle('#fbbf24'), marginTop: '1.5rem' }}>새 게임 시작</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


// Shared Style Constants
const gameContainerStyle = {
  width: '100%',
  background: 'rgba(20, 20, 30, 0.65)',
  border: '1px solid rgba(255, 255, 255, 0.08)',
  borderRadius: '16px',
  padding: '1rem',
  boxSizing: 'border-box',
  backdropFilter: 'blur(25px)',
  boxShadow: '0 8px 32px rgba(0,0,0,0.6)'
};

const gameHeaderStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  fontWeight: 700,
  fontSize: '1rem',
  marginBottom: '1rem',
  paddingBottom: '0.5rem',
  borderBottom: '1px solid rgba(255, 255, 255, 0.08)'
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

const playButtonStyle = (shadowColor) => ({
  background: 'rgba(255, 255, 255, 0.95)',
  color: '#0f172a',
  border: 'none',
  padding: '0.75rem 2rem',
  borderRadius: '25px',
  fontWeight: 800,
  fontSize: '0.95rem',
  cursor: 'pointer',
  transition: 'all 0.2s',
  boxShadow: `0 4px 15px ${shadowColor}33`
});

const arcadeCtaStyle = {
  background: 'rgba(255, 255, 255, 0.04)',
  border: '1px solid rgba(255, 255, 255, 0.08)',
  borderRadius: '12px',
  padding: '1rem',
  margin: '0.5rem 0',
  maxWidth: '360px',
  boxSizing: 'border-box'
};

const ctaButtonStyle = {
  background: 'linear-gradient(135deg, #818cf8 0%, #ec4899 100%)',
  color: '#ffffff',
  border: 'none',
  padding: '0.6rem 1.2rem',
  borderRadius: '8px',
  fontWeight: 700,
  fontSize: '0.85rem',
  cursor: 'pointer',
  width: '100%',
  marginTop: '0.25rem',
  boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)'
};
