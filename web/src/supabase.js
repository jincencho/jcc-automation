import { createClient } from '@supabase/supabase-js';

// Environment variables with fallback to live Supabase project
let envUrl = '';
let envKey = '';
try {
  if (typeof process !== 'undefined' && process.env) {
    envUrl = process.env.VITE_SUPABASE_URL;
    envKey = process.env.VITE_SUPABASE_ANON_KEY;
  }
} catch {}

const supabaseUrl = envUrl || 'https://nuptkcozqdwirafrbfyx.supabase.co';
const supabaseAnonKey = envKey || 'sb_publishable_qEjEObM6m8ICxhY2d62Nog_-WIVl4A5';

export const isSupabaseConfigured = supabaseUrl !== '' && supabaseAnonKey !== '';

export const supabase = isSupabaseConfigured 
  ? createClient(supabaseUrl, supabaseAnonKey) 
  : null;

// Local Mock Realtime System to allow testing the UI/UX & rules without credentials
class MockRealtimeEngine {
  constructor() {
    this.listeners = {};
    this.rooms = {};
  }

  subscribe(roomCode, callback) {
    if (!this.listeners[roomCode]) {
      this.listeners[roomCode] = [];
    }
    this.listeners[roomCode].push(callback);
    
    // Send current state
    if (this.rooms[roomCode]) {
      callback(this.rooms[roomCode]);
    }

    return () => {
      this.listeners[roomCode] = this.listeners[roomCode].filter(cb => cb !== callback);
    };
  }

  updateRoom(roomCode, state) {
    this.rooms[roomCode] = { ...this.rooms[roomCode], ...state };
    if (this.listeners[roomCode]) {
      this.listeners[roomCode].forEach(callback => callback(this.rooms[roomCode]));
    }
  }

  createRoom(roomCode, hostPlayer) {
    const defaultState = {
      room_code: roomCode,
      status: 'lobby',
      players: [hostPlayer],
      game_state: {
        currentTurnIdx: 0,
        board: [],
        pool: [],
        history: [],
        turnTimeLeft: 60,
        winner: null
      }
    };
    this.rooms[roomCode] = defaultState;
    return defaultState;
  }
}

export const mockRealtime = new MockRealtimeEngine();
