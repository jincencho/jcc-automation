import React, { useState, useEffect, useRef } from 'react';
import { supabase, isSupabaseConfigured, mockRealtime } from '../supabase';
import { validateBoard, generateTilePool, sortForRun, sortForGroup } from '../utils/rummikubEvaluator';

export default function Rummikub({ onBack, onNavigateToReservation }) {
  // Connection states
  const [nickname, setNickname] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [inRoom, setInRoom] = useState(false);
  const [playerId, setPlayerId] = useState('');
  const [isHost, setIsHost] = useState(false);

  // Sync state from Database
  const [roomState, setRoomState] = useState(null);

  // Drag-and-drop active tile
  const [draggedTile, setDraggedTile] = useState(null);
  const [dragSource, setDragSource] = useState(null); // 'rack' or 'board'
  const [dragSourceIndex, setDragSourceIndex] = useState(null); // index or {r, c}

  // Local turn copy state (before submitting or drawing)
  const [localBoard, setLocalBoard] = useState(
    Array(8).fill(null).map(() => Array(15).fill(null))
  );
  const [localRack, setLocalRack] = useState([]);
  const [hasMovedThisTurn, setHasMovedThisTurn] = useState(false);
  const [validationError, setValidationError] = useState('');

  // Initialization & cleanup
  useEffect(() => {
    // Generate unique player ID
    const storedId = localStorage.getItem('rm_player_id') || Math.random().toString(36).substring(2, 9);
    localStorage.setItem('rm_player_id', storedId);
    setPlayerId(storedId);

    const storedNickname = localStorage.getItem('rm_nickname') || '';
    setNickname(storedNickname);
  }, []);

  // Supabase real-time subscription
  useEffect(() => {
    if (!inRoom || !roomCode) return;

    let unsubscribe = () => {};

    if (isSupabaseConfigured) {
      // Connect to real Supabase channel
      const channel = supabase
        .channel(`room:${roomCode}`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'rummikub_rooms', filter: `room_code=eq.${roomCode}` },
          (payload) => {
            if (payload.new) {
              setRoomState(payload.new);
            }
          }
        )
        .subscribe();

      // Initial fetch
      supabase
        .from('rummikub_rooms')
        .select('*')
        .eq('room_code', roomCode)
        .single()
        .then(({ data }) => {
          if (data) setRoomState(data);
        });

      unsubscribe = () => {
        supabase.removeChannel(channel);
      };
    } else {
      // Fallback Mock subscription
      unsubscribe = mockRealtime.subscribe(roomCode, (state) => {
        setRoomState(state);
      });
    }

    return () => {
      unsubscribe();
    };
  }, [inRoom, roomCode]);

  // Synchronize local board/rack from roomState changes
  const [turnTimeLeft, setTurnTimeLeft] = useState(300); // 5 minutes = 300 seconds

  useEffect(() => {
    if (!roomState || roomState.status !== 'playing') return;

    // Sync timer from server (only if it changes significantly or initializes)
    const serverTimeLeft = roomState.game_state.turnTimeLeft ?? 300;
    setTurnTimeLeft(serverTimeLeft);
  }, [roomState]);

  // Turn timer countdown effect
  useEffect(() => {
    if (!roomState || roomState.status !== 'playing') return;

    const timer = setInterval(async () => {
      setTurnTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          // If it is my turn, auto draw tile and pass turn when time runs out
          const isMyTurn = roomState.players[roomState.game_state.currentTurnIdx]?.id === playerId;
          if (isMyTurn) {
            handleDrawTile();
          }
          return 300;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [roomState, playerId]);

  useEffect(() => {
    if (!roomState) return;
    
    const me = roomState.players.find(p => p.id === playerId);
    if (me) {
      setLocalRack(me.rack || []);
    }

    // Only update local board if it is not my turn or if I haven't moved yet
    const isMyTurn = roomState.players[roomState.game_state.currentTurnIdx]?.id === playerId;
    if (!isMyTurn || !hasMovedThisTurn) {
      const dbBoard = roomState.game_state.board || [];
      // Re-fill local board with standard 8x15 grid
      const newGrid = Array(8).fill(null).map(() => Array(15).fill(null));
      dbBoard.forEach((tile) => {
        if (tile && tile.r !== undefined && tile.c !== undefined) {
          newGrid[tile.r][tile.c] = tile;
        }
      });
      setLocalBoard(newGrid);
    }
  }, [roomState, playerId, hasMovedThisTurn]);

  // Handle Room Actions
  const handleCreateRoom = async () => {
    if (!nickname.trim()) return alert('닉네임을 입력해 주세요!');
    localStorage.setItem('rm_nickname', nickname);

    const generatedCode = Math.random().toString(36).substring(2, 7).toUpperCase();
    const hostPlayer = {
      id: playerId,
      nickname: nickname,
      rack: []
    };

    if (isSupabaseConfigured) {
      const { error } = await supabase.from('rummikub_rooms').insert({
        room_code: generatedCode,
        status: 'lobby',
        players: [hostPlayer],
        game_state: {
          currentTurnIdx: 0,
          board: [],
          pool: generateTilePool(),
          history: [],
          turnTimeLeft: 60,
          winner: null
        }
      });
      if (error) return alert('방 생성 실패: ' + error.message);
    } else {
      mockRealtime.createRoom(generatedCode, hostPlayer);
    }

    setRoomCode(generatedCode);
    setIsHost(true);
    setInRoom(true);
  };

  const handleJoinRoom = async () => {
    if (!nickname.trim()) return alert('닉네임을 입력해 주세요!');
    if (!roomCode.trim()) return alert('방 코드를 입력해 주세요!');
    localStorage.setItem('rm_nickname', nickname);
    const upperCode = roomCode.trim().toUpperCase();

    let fetchedRoom = null;

    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from('rummikub_rooms')
        .select('*')
        .eq('room_code', upperCode)
        .single();
      if (error || !data) return alert('존재하지 않는 방입니다.');
      fetchedRoom = data;
    } else {
      fetchedRoom = mockRealtime.rooms[upperCode];
      if (!fetchedRoom) return alert('존재하지 않는 방입니다.');
    }

    if (fetchedRoom.players.length >= 4) return alert('정원이 가득 찬 방입니다 (최대 4인).');

    // Add player
    const updatedPlayers = [...fetchedRoom.players];
    const alreadyJoined = updatedPlayers.some(p => p.id === playerId);
    if (!alreadyJoined) {
      updatedPlayers.push({
        id: playerId,
        nickname: nickname,
        rack: []
      });

      if (isSupabaseConfigured) {
        await supabase
          .from('rummikub_rooms')
          .update({ players: updatedPlayers })
          .eq('room_code', upperCode);
      } else {
        mockRealtime.updateRoom(upperCode, { players: updatedPlayers });
      }
    }

    setRoomCode(upperCode);
    setIsHost(false);
    setInRoom(true);
  };

  // Start game loop (Distribute 14 tiles to each player)
  const handleStartGame = async () => {
    if (!roomState) return;
    let pool = [...roomState.game_state.pool];
    
    // Distribute 14 tiles per player
    const updatedPlayers = roomState.players.map(p => {
      const rack = pool.splice(0, 14);
      return { ...p, rack };
    });

    const updateData = {
      status: 'playing',
      players: updatedPlayers,
      game_state: {
        ...roomState.game_state,
        pool: pool,
        currentTurnIdx: 0,
        board: []
      }
    };

    if (isSupabaseConfigured) {
      await supabase
        .from('rummikub_rooms')
        .update(updateData)
        .eq('room_code', roomCode);
    } else {
      mockRealtime.updateRoom(roomCode, updateData);
    }
  };

  // Drag and drop handlers / Click-to-place handlers for mobile
  const [selectedTile, setSelectedTile] = useState(null); // { tile, source, index }
  const [actionHistory, setActionHistory] = useState([]); // Array of snapshots for step undo: { board, rack }

  const pushHistorySnapshot = (boardState, rackState) => {
    setActionHistory(prev => [...prev, {
      board: boardState.map(row => [...row]),
      rack: [...rackState]
    }]);
  };

  const handleUndoSingleStep = () => {
    if (!isMyTurn || actionHistory.length === 0) return;
    const historyCopy = [...actionHistory];
    const prevSnapshot = historyCopy.pop(); // Get last snapshot
    setActionHistory(historyCopy);

    setLocalBoard(prevSnapshot.board);
    setLocalRack(prevSnapshot.rack);
    if (historyCopy.length === 0) {
      setHasMovedThisTurn(false);
    }
    setValidationError('');
  };

  const handleTileClick = (tile, source, index) => {
    if (!isMyTurn) return;
    
    // Toggle selection
    if (selectedTile && selectedTile.tile.id === tile.id) {
      setSelectedTile(null);
    } else {
      setSelectedTile({ tile, source, index });
    }
  };

  const handleDragStart = (tile, source, index) => {
    setDraggedTile(tile);
    setDragSource(source);
    setDragSourceIndex(index);
    setSelectedTile(null); // Clear selected if starting drag
  };

  const handleBoardDrop = (r, c) => {
    if (!draggedTile) return;
    executeTilePlacement(draggedTile, dragSource, dragSourceIndex, r, c);
  };

  const handleBoardClick = (r, c) => {
    if (!isMyTurn) return;
    
    // If a tile is currently selected, place it here
    if (selectedTile) {
      const { tile, source, index } = selectedTile;
      const success = executeTilePlacement(tile, source, index, r, c);
      if (success) {
        setSelectedTile(null); // Clear selection on success
      }
    } else {
      // If a tile exists at this board slot, select it
      const clickedTile = localBoard[r][c];
      if (clickedTile) {
        handleTileClick(clickedTile, 'board', { r, c });
      }
    }
  };

  const executeTilePlacement = (tile, source, sourceIndex, r, c) => {
    const newGrid = localBoard.map(row => [...row]);

    // Check if target slot is empty
    if (newGrid[r][c] !== null) return false;

    // Save snapshot before making changes
    pushHistorySnapshot(localBoard, localRack);

    if (source === 'rack') {
      // Remove from rack
      const newRack = [...localRack];
      newRack.splice(sourceIndex, 1);
      setLocalRack(newRack);
    } else if (source === 'board') {
      // Move from existing board coordinates
      const { r: prevR, c: prevC } = sourceIndex;
      newGrid[prevR][prevC] = null;
    }

    newGrid[r][c] = { ...tile, r, c };
    setLocalBoard(newGrid);
    setHasMovedThisTurn(true);
    setDraggedTile(null);
    setValidationError('');
    return true;
  };

  const handleRackDrop = () => {
    if (!draggedTile) return;
    executeMoveBackToRack(draggedTile, dragSource, dragSourceIndex);
  };

  const handleRackClick = () => {
    if (!isMyTurn) return;

    // Move selected board tile back to rack
    if (selectedTile && selectedTile.source === 'board') {
      const { tile, source, index } = selectedTile;
      executeMoveBackToRack(tile, source, index);
      setSelectedTile(null);
    }
  };

  const executeMoveBackToRack = (tile, source, sourceIndex) => {
    if (source === 'board') {
      const { r, c } = sourceIndex;
      
      // Save snapshot before making changes
      pushHistorySnapshot(localBoard, localRack);

      const newGrid = localBoard.map(row => [...row]);
      newGrid[r][c] = null;
      setLocalBoard(newGrid);
      setLocalRack([...localRack, tile]);
      setHasMovedThisTurn(true);
      setDraggedTile(null);
    }
  };

  // Sort rack helpers
  const handleSortRun = () => {
    setLocalRack(sortForRun(localRack));
  };

  const handleSortGroup = () => {
    setLocalRack(sortForGroup(localRack));
  };

  // Skip / Draw a tile
  const handleDrawTile = async () => {
    if (!roomState) return;
    let pool = [...roomState.game_state.pool];
    if (pool.length === 0) return alert('더 이상 가져갈 타일이 없습니다!');

    // Restore board back to official db state (discard local layout changes if drawing)
    const officialBoard = roomState.game_state.board || [];
    const restoredGrid = Array(8).fill(null).map(() => Array(15).fill(null));
    officialBoard.forEach((tile) => {
      if (tile && tile.r !== undefined && tile.c !== undefined) {
        restoredGrid[tile.r][tile.c] = tile;
      }
    });

    const newTile = pool.shift();
    const updatedPlayers = roomState.players.map(p => {
      if (p.id === playerId) {
        const officialMe = roomState.players.find(x => x.id === playerId);
        return { ...p, rack: [...(officialMe.rack || []), newTile] };
      }
      return p;
    });

    const nextTurnIdx = (roomState.game_state.currentTurnIdx + 1) % roomState.players.length;

    const updateData = {
      players: updatedPlayers,
      game_state: {
        ...roomState.game_state,
        pool,
        board: officialBoard,
        currentTurnIdx: nextTurnIdx
      }
    };

    if (isSupabaseConfigured) {
      await supabase
        .from('rummikub_rooms')
        .update(updateData)
        .eq('room_code', roomCode);
    } else {
      mockRealtime.updateRoom(roomCode, updateData);
    }

    setHasMovedThisTurn(false);
    setActionHistory([]); // Clear steps history
    setValidationError('');
  };

  // Submit board layout / Finish turn
  const handleFinishTurn = async () => {
    if (!roomState) return;

    // Validate board configuration
    const valResult = validateBoard(localBoard);
    if (!valResult.isValid) {
      setValidationError(valResult.reason);
      return;
    }

    // Convert local grid back to list format for database storage
    const tilesList = [];
    localBoard.forEach((row, r) => {
      row.forEach((cell, c) => {
        if (cell) {
          tilesList.push({ ...cell, r, c });
        }
      });
    });

    const officialBoard = roomState.game_state.board || [];
    const me = roomState.players.find(p => p.id === playerId);
    const hasRegisteredMeld = me.initial_meld_done;

    // 1. Initial Meld Validation (등록 규칙: 합 30 이상)
    if (!hasRegisteredMeld) {
      // Find tiles that were newly placed on the board this turn
      // A newly placed tile is defined as a tile present in tilesList but not in officialBoard
      const newlyPlacedTiles = tilesList.filter(
        tile => !officialBoard.some(offTile => offTile.id === tile.id)
      );

      if (newlyPlacedTiles.length === 0) {
        setValidationError('첫 턴(등록)에는 자신의 받침대에서 타일을 내놓아야 합니다.');
        return;
      }

      // Group newly placed tiles into board sets
      const newSets = valResult.sets.filter(set =>
        set.some(tile => newlyPlacedTiles.some(nt => nt.id === tile.id))
      );

      // Verify that every set containing newly placed tiles is comprised ENTIRELY of newly placed tiles.
      // (Under Rummikub rules, you cannot manipulate existing sets on the board during your initial meld).
      for (const set of newSets) {
        const hasExistingTile = set.some(tile => officialBoard.some(offTile => offTile.id === tile.id));
        if (hasExistingTile) {
          setValidationError('등록(첫 등록 합 30 이상)을 하기 전에는 이미 보드판에 있는 타일을 조작하거나 조합할 수 없습니다.');
          return;
        }
      }

      // Sum values of new sets
      const meldSum = newSets.reduce((sum, set) => {
        return sum + set.reduce((setSum, tile) => setSum + tile.number, 0);
      }, 0);

      if (meldSum < 30) {
        setValidationError(`첫 등록은 총 합이 30 이상이어야 합니다. (현재 놓은 타일의 총 합: ${meldSum}점)`);
        return;
      }
    }

    // Check if player finished this turn
    const hasFinishedNow = localRack.length === 0;
    
    // Update players list with new rack & meld status
    const updatedPlayers = roomState.players.map(p => {
      if (p.id === playerId) {
        return { 
          ...p, 
          rack: localRack,
          initial_meld_done: true, // Registered successfully!
          finished: hasFinishedNow
        };
      }
      return p;
    });

    // Handle Ranking & Scoreboard
    const currentRanks = roomState.game_state.ranks || [];
    const isAlreadyRanked = currentRanks.some(r => r.id === playerId);
    let nextRanks = [...currentRanks];

    if (hasFinishedNow && !isAlreadyRanked) {
      nextRanks.push({
        id: playerId,
        nickname: nickname,
        rank: currentRanks.length + 1
      });
    }

    // Find players who are still active (not finished)
    const activePlayers = updatedPlayers.filter(p => !p.finished);

    // End game condition: Only 1 player left active, or everyone finished
    const gameEnded = activePlayers.length <= 1;

    // If game ended, add the remaining player(s) to ranks
    if (gameEnded) {
      // Sort remaining active players by number of tiles left in their rack (fewer tiles = better rank)
      const sortedRemaining = [...activePlayers].sort((a, b) => (a.rack || []).length - (b.rack || []).length);
      sortedRemaining.forEach(p => {
        const alreadyIn = nextRanks.some(r => r.id === p.id);
        if (!alreadyIn) {
          nextRanks.push({
            id: p.id,
            nickname: p.nickname,
            rank: nextRanks.length + 1,
            tilesLeft: (p.rack || []).length
          });
        }
      });
    }

    // Progress Turn: skip players who have already finished
    let nextTurnIdx = roomState.game_state.currentTurnIdx;
    if (!gameEnded) {
      do {
        nextTurnIdx = (nextTurnIdx + 1) % updatedPlayers.length;
      } while (updatedPlayers[nextTurnIdx].finished);
    }

    const updateData = {
      players: updatedPlayers,
      status: gameEnded ? 'finished' : 'playing',
      game_state: {
        ...roomState.game_state,
        board: tilesList,
        currentTurnIdx: nextTurnIdx,
        ranks: nextRanks,
        winner: nextRanks[0]?.nickname || nickname
      }
    };

    if (isSupabaseConfigured) {
      await supabase
        .from('rummikub_rooms')
        .update(updateData)
        .eq('room_code', roomCode);
    } else {
      mockRealtime.updateRoom(roomCode, updateData);
    }

    setHasMovedThisTurn(false);
    setActionHistory([]); // Clear steps history
    setValidationError('');
  };

  // Undo current local turn adjustments
  const handleResetLocalTurn = () => {
    if (!roomState) return;
    const me = roomState.players.find(p => p.id === playerId);
    if (me) setLocalRack(me.rack || []);

    const dbBoard = roomState.game_state.board || [];
    const newGrid = Array(8).fill(null).map(() => Array(15).fill(null));
    dbBoard.forEach((tile) => {
      if (tile && tile.r !== undefined && tile.c !== undefined) {
        newGrid[tile.r][tile.c] = tile;
      }
    });
    setLocalBoard(newGrid);
    setHasMovedThisTurn(false);
    setActionHistory([]); // Clear steps history
    setValidationError('');
  };

  // Leave room
  const handleLeaveRoom = () => {
    setInRoom(false);
    setRoomState(null);
    setRoomCode('');
    setIsHost(false);
    setHasMovedThisTurn(false);
  };

  // Color Mapping Helper
  const getTileColor = (color) => {
    if (color === 'red') return '#ef4444'; // Red
    if (color === 'blue') return '#3b82f6'; // Blue
    if (color === 'green') return '#10b981'; // Green
    return '#111827'; // Black
  };

  // Render Lobby screen (Room create/join)
  if (!inRoom) {
    return (
      <div style={wrapStyle}>
        <button onClick={onBack} style={btnBackStyle}>← 게임 선택으로</button>
        <h2 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'white', marginBottom: '0.5rem', textAlign: 'center' }}>🀄 실시간 루미큐브 (2~4인용)</h2>
        
        {/* Connection Status Badge */}
        <div style={{
          padding: '0.4rem 0.8rem',
          borderRadius: '100px',
          fontSize: '0.8rem',
          background: isSupabaseConfigured ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)',
          border: isSupabaseConfigured ? '1px solid #22c55e' : '1px solid #ef4444',
          color: isSupabaseConfigured ? '#4ade80' : '#fca5a5',
          fontWeight: 700,
          marginBottom: '1rem',
          textAlign: 'center'
        }}>
          {isSupabaseConfigured ? '● Supabase 실시간 서버 연결됨' : '● 연결 끊김 (가상 네트워크 모드)'}
        </div>

        <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '1.5rem', textAlign: 'center' }}>
          친구들과 함께 즐기는 클래식 두뇌 게임!
        </p>

        <div className="glass-panel" style={{ maxWidth: '400px', width: '100%', padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '0.4rem' }}>유저 닉네임</label>
            <input 
              type="text" 
              placeholder="예: 홍길동"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                borderRadius: '8px',
                background: '#1e293b',
                border: '1px solid rgba(255,255,255,0.2)',
                color: 'white',
                fontSize: '1rem',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <button onClick={handleCreateRoom} className="btn-primary" style={{ width: '100%', padding: '0.85rem' }}>방 만들기 🎮</button>
          </div>

          <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', margin: '0.5rem 0' }}></div>

          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '0.4rem' }}>방 코드 입력 (5글자)</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <input 
                type="text" 
                placeholder="예: X7A9D"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  borderRadius: '8px',
                  background: '#1e293b',
                  border: '1px solid rgba(255,255,255,0.2)',
                  color: 'white',
                  fontSize: '1rem',
                  boxSizing: 'border-box'
                }}
              />
              <button onClick={handleJoinRoom} className="btn-secondary" style={{ width: '100%', padding: '0.85rem' }}>참여하기 🎮</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Render Waiting Lobby Screen
  if (roomState && roomState.status === 'lobby') {
    return (
      <div style={wrapStyle}>
        <h2 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'white', marginBottom: '0.5rem' }}>🕹️ 대기방 ({roomCode})</h2>
        <p style={{ color: '#cbd5e1', fontSize: '0.95rem', marginBottom: '1.5rem' }}>친구들에게 방 코드를 공유하여 접속하게 하세요.</p>

        <div className="glass-panel" style={{ maxWidth: '450px', width: '100%', padding: '2rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem' }}>참가한 대기 인원 ({roomState.players.length}/4)</h3>
          <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 2rem 0', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {roomState.players.map((p, idx) => (
              <li key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.05)', padding: '0.75rem 1rem', borderRadius: '8px' }}>
                <span style={{ fontWeight: 600 }}>{p.nickname} {p.id === playerId && '(나)'}</span>
                <span style={{ fontSize: '0.8rem', color: idx === 0 ? 'var(--accent-gold)' : '#94a3b8' }}>{idx === 0 ? '방장' : '플레이어'}</span>
              </li>
            ))}
          </ul>

          <div style={{ display: 'flex', gap: '1rem' }}>
            <button onClick={handleLeaveRoom} className="btn-secondary" style={{ flex: 1 }}>나가기</button>
            {isHost && (
              <button 
                onClick={handleStartGame} 
                className="btn-primary" 
                disabled={roomState.players.length < 2}
                style={{ flex: 2 }}
              >
                게임 시작 🚀
              </button>
            )}
          </div>
          {isHost && roomState.players.length < 2 && (
            <p style={{ color: '#fb7185', fontSize: '0.8rem', marginTop: '0.75rem', textAlign: 'center' }}>최소 2명이 참가해야 시작할 수 있습니다.</p>
          )}
        </div>
      </div>
    );
  }

  // Render Finished/Winner screen
  if (roomState && roomState.status === 'finished') {
    const ranks = roomState.game_state.ranks || [];
    return (
      <div style={wrapStyle}>
        <div className="glass-panel" style={{ maxWidth: '450px', width: '100%', padding: '2.5rem 2rem', textAlign: 'center' }}>
          <div style={{ fontSize: '3.5rem', marginBottom: '0.75rem' }}>🏆</div>
          <h2 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--accent-gold-light)', marginBottom: '0.25rem' }}>경기 종료!</h2>
          <p style={{ fontSize: '1.1rem', color: '#cbd5e1', marginBottom: '1.5rem' }}>모든 순위가 결정되었습니다.</p>

          {/* Ranks Leaderboard */}
          <div style={{
            background: 'rgba(0,0,0,0.3)',
            borderRadius: '12px',
            padding: '1rem',
            marginBottom: '1.5rem',
            textAlign: 'left'
          }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--accent-gold)', marginBottom: '0.75rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.4rem' }}>최종 경기 순위</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {ranks.map((r, i) => (
                <div key={r.id || i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0.75rem', background: i === 0 ? 'rgba(212, 175, 55, 0.15)' : 'rgba(255,255,255,0.02)', borderRadius: '6px', border: i === 0 ? '1px solid var(--accent-gold)' : '1px solid transparent' }}>
                  <span style={{ fontWeight: 700, color: i === 0 ? 'var(--accent-gold-light)' : 'white' }}>
                    {r.rank}등: {r.nickname}
                  </span>
                  <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                    {r.tilesLeft !== undefined ? `남은 타일: ${r.tilesLeft}개` : '탈출 완료 🎉'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div style={{ background: 'rgba(197, 160, 89, 0.1)', border: '1px solid var(--accent-gold)', padding: '1rem', borderRadius: '12px', marginBottom: '2rem', fontSize: '0.85rem', color: '#cbd5e1', lineHeight: 1.5, textAlign: 'left' }}>
            <strong>💡 마스터의 추천 견적 혜택 받기</strong><br />
            "루미큐브를 통해 머리를 가볍게 푸셨다면, 갤러리아진주 조준석 매니저의 맞춤 가전 설계를 받아보세요. 1:1 맞춤 견적 졸업 혜택을 매칭해 드립니다!"
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <button onClick={onNavigateToReservation} className="btn-primary">가전 졸업 상담예약하기 📅</button>
            <button onClick={handleLeaveRoom} className="btn-secondary">대기방 로비로 돌아가기</button>
          </div>
        </div>
      </div>
    );
  }

  // Game UI setup
  const curTurnPlayer = roomState?.players[roomState.game_state.currentTurnIdx];
  const isMyTurn = curTurnPlayer?.id === playerId;

  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', padding: '0 0.5rem' }}>
      
      {/* Game Top Info */}
      <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem' }}>
        <div>
          <button onClick={handleLeaveRoom} style={{ background: 'transparent', border: 'none', color: '#cbd5e1', cursor: 'pointer', fontSize: '0.85rem' }}>← 나가기</button>
          <span style={{ marginLeft: '1rem', color: 'var(--accent-gold)', fontWeight: 700 }}>방 코드: {roomCode}</span>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>남은 타일: {roomState?.game_state.pool.length}개</span>
          {roomState && roomState.status === 'playing' && (
            <span style={{
              padding: '0.3rem 0.8rem',
              borderRadius: '100px',
              fontSize: '0.85rem',
              background: turnTimeLeft < 30 ? 'rgba(239, 68, 68, 0.2)' : 'rgba(255, 255, 255, 0.05)',
              border: turnTimeLeft < 30 ? '1px solid #ef4444' : '1px solid rgba(255,255,255,0.15)',
              color: turnTimeLeft < 30 ? '#fca5a5' : '#e2e8f0',
              fontWeight: 700
            }}>
              ⏱️ {Math.floor(turnTimeLeft / 60)}분 {String(turnTimeLeft % 60).padStart(2, '0')}초
            </span>
          )}
          <span style={{
            padding: '0.3rem 0.8rem',
            borderRadius: '100px',
            fontSize: '0.9rem',
            background: isMyTurn ? 'rgba(34, 197, 94, 0.2)' : 'rgba(255,255,255,0.05)',
            border: isMyTurn ? '1px solid #22c55e' : '1px solid rgba(255,255,255,0.1)',
            color: isMyTurn ? '#4ade80' : 'white',
            fontWeight: 700
          }}>
            {isMyTurn ? '내 차례 🌟' : `${curTurnPlayer?.nickname}의 차례`}
          </span>
        </div>
      </div>

      {/* Main Board Grid (8x15 Grid) */}
      <div 
        style={{
          width: '100%',
          maxWidth: '850px',
          background: 'rgba(15, 23, 42, 0.9)',
          border: '2px solid rgba(255,255,255,0.1)',
          borderRadius: '16px',
          padding: 'clamp(4px, 1.5vw, 12px)',
          display: 'grid',
          gridTemplateRows: 'repeat(8, 1fr)',
          gap: '3px',
          boxShadow: 'inset 0 4px 15px rgba(0,0,0,0.5)',
          boxSizing: 'border-box'
        }}
      >
        {localBoard.map((row, r) => (
          <div key={r} style={{ display: 'flex', gap: '3px', width: '100%', justifyContent: 'space-between' }}>
            {row.map((cell, c) => {
              const isSelected = selectedTile && selectedTile.source === 'board' && selectedTile.index.r === r && selectedTile.index.c === c;
              return (
                <div
                  key={c}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => handleBoardDrop(r, c)}
                  onClick={() => handleBoardClick(r, c)}
                  style={{
                    width: 'calc((100% - 42px) / 15)',
                    aspectRatio: '0.8', // standard card ratio
                    background: cell ? '#f8fafc' : 'rgba(255,255,255,0.02)',
                    border: isSelected 
                      ? '2px solid var(--accent-gold)' 
                      : cell ? '1px solid #cbd5e1' : '1px dashed rgba(255,255,255,0.05)',
                    borderRadius: '4px',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    cursor: isMyTurn ? 'grab' : 'default',
                    userSelect: 'none',
                    boxShadow: isSelected 
                      ? '0 0 10px rgba(212, 175, 55, 0.8)' 
                      : cell ? '0 2px 4px rgba(0,0,0,0.15), inset 0 -3px 0 rgba(0,0,0,0.08)' : 'none'
                  }}
                  draggable={isMyTurn && cell !== null}
                  onDragStart={() => cell && handleDragStart(cell, 'board', { r, c })}
                >
                  {cell && (
                    <span style={{ fontSize: 'clamp(0.7rem, 2vw, 1.15rem)', fontWeight: 800, color: getTileColor(cell.color) }}>
                      {cell.number}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* Validation Message Display */}
      {validationError && (
        <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid #ef4444', color: '#fca5a5', padding: '0.75rem 1rem', borderRadius: '8px', fontSize: '0.85rem', width: '100%', maxWidth: '850px', textAlign: 'center' }}>
          ⚠️ {validationError}
        </div>
      )}

      {/* Player Turn Controls */}
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', justifyContent: 'center' }}>
        <button onClick={handleUndoSingleStep} disabled={!isMyTurn || actionHistory.length === 0} style={btnControlStyle(!isMyTurn || actionHistory.length === 0)}>↩️ 한단계 취소</button>
        <button onClick={handleResetLocalTurn} disabled={!isMyTurn || !hasMovedThisTurn} style={btnControlStyle(!isMyTurn || !hasMovedThisTurn)}>🔄 전체 취소</button>
        <button onClick={handleDrawTile} disabled={!isMyTurn} style={btnControlStyle(!isMyTurn)}>📥 타일 먹기 (턴 종료)</button>
        <button onClick={handleFinishTurn} disabled={!isMyTurn || !hasMovedThisTurn} style={{ ...btnControlStyle(!isMyTurn || !hasMovedThisTurn), background: '#10b981', color: 'white' }}>✅ 배치 등록 완료</button>
      </div>

      {/* Player Hand Rack UI */}
      <div 
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleRackDrop}
        onClick={handleRackClick}
        style={{
          width: '100%',
          maxWidth: '850px',
          background: 'rgba(30, 41, 59, 0.8)',
          border: '2px solid rgba(212, 175, 55, 0.3)',
          borderRadius: '16px',
          padding: '1rem',
          minHeight: '100px',
          marginTop: '1rem',
          boxShadow: '0 8px 30px rgba(0,0,0,0.3)',
          cursor: selectedTile && selectedTile.source === 'board' ? 'pointer' : 'default'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--accent-gold)' }}>내 타일 받침대</span>
          <div style={{ display: 'flex', gap: '0.4rem' }}>
            <button onClick={(e) => { e.stopPropagation(); handleSortRun(); }} style={sortBtnStyle}>색상 정렬</button>
            <button onClick={(e) => { e.stopPropagation(); handleSortGroup(); }} style={sortBtnStyle}>숫자 정렬</button>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', minHeight: '60px' }}>
          {localRack.map((tile, idx) => {
            const isSelected = selectedTile && selectedTile.source === 'rack' && selectedTile.index === idx;
            return (
              <div
                key={tile.id}
                draggable={isMyTurn}
                onDragStart={() => handleDragStart(tile, 'rack', idx)}
                onClick={(e) => {
                  e.stopPropagation(); // Prevent rack container click from firing
                  handleTileClick(tile, 'rack', idx);
                }}
                style={{
                  width: '40px',
                  height: '52px',
                  background: '#f8fafc',
                  border: isSelected ? '2px solid var(--accent-gold)' : '1px solid #cbd5e1',
                  borderRadius: '8px',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  cursor: isMyTurn ? 'pointer' : 'default',
                  userSelect: 'none',
                  boxShadow: isSelected 
                    ? '0 0 10px rgba(212, 175, 55, 0.8)' 
                    : '0 4px 6px rgba(0,0,0,0.15), inset 0 -4px 0 rgba(0,0,0,0.08)',
                  transform: isSelected ? 'translateY(-4px)' : 'none',
                  transition: 'transform 0.15s ease'
                }}
              >
                <span style={{ fontSize: '1.25rem', fontWeight: 800, color: getTileColor(tile.color) }}>
                  {tile.number}
                </span>
              </div>
            );
          })}
          {localRack.length === 0 && (
            <p style={{ color: '#64748b', fontSize: '0.85rem', alignSelf: 'center', width: '100%', textAlign: 'center' }}>
              받침대에 타일이 없습니다. 승리가 코앞입니다!
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// ==========================================
// Styles
// ==========================================
const wrapStyle = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: '60vh',
  width: '100%',
  padding: '1rem',
  boxSizing: 'border-box'
};

const btnBackStyle = {
  background: 'rgba(255, 255, 255, 0.08)',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  color: '#cbd5e1',
  padding: '0.4rem 1rem',
  borderRadius: '20px',
  cursor: 'pointer',
  fontSize: '0.8rem',
  marginBottom: '1.5rem',
  fontWeight: 600
};

const labelStyle = {
  display: 'block',
  fontSize: '0.85rem',
  fontWeight: 600,
  color: '#cbd5e1',
  marginBottom: '0.4rem'
};

const inputStyle = {
  width: '100%',
  padding: '0.75rem 1rem',
  borderRadius: '8px',
  background: '#1a202c', // darker background to ensure it looks distinct and editable
  border: '2px solid rgba(255,255,255,0.2)',
  color: 'white',
  fontSize: '1rem',
  boxSizing: 'border-box',
  cursor: 'text',
  position: 'relative',
  zIndex: 10,
  WebkitUserSelect: 'text',
  userSelect: 'text'
};

const btnControlStyle = (disabled) => ({
  padding: '0.6rem 1.2rem',
  borderRadius: '8px',
  border: '1px solid rgba(255,255,255,0.1)',
  background: disabled ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.08)',
  color: disabled ? '#64748b' : '#f8fafc',
  cursor: disabled ? 'not-allowed' : 'pointer',
  fontSize: '0.85rem',
  fontWeight: 600,
  transition: 'all 0.2s'
});

const sortBtnStyle = {
  background: 'rgba(255,255,255,0.08)',
  border: '1px solid rgba(255,255,255,0.1)',
  color: 'white',
  padding: '0.3rem 0.6rem',
  borderRadius: '6px',
  cursor: 'pointer',
  fontSize: '0.75rem',
  fontWeight: 600
};
