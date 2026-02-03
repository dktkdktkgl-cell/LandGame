import { io } from 'socket.io-client';

class SocketService {
  constructor() {
    this.socket = null;
    this.serverUrl = import.meta.env.VITE_SERVER_URL || 'http://localhost:3000';
  }

  connect() {
    if (this.socket?.connected) {
      console.log('⚠️  Already connected');
      return this.socket;
    }

    this.socket = io(this.serverUrl, {
      withCredentials: true,
      transports: ['websocket', 'polling']
    });

    this.socket.on('connect', () => {
      console.log('✅ Connected to server:', this.socket.id);
    });

    this.socket.on('disconnect', () => {
      console.log('❌ Disconnected from server');
    });

    this.socket.on('error', (error) => {
      console.error('❌ Socket error:', error);
    });

    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  // 게임 참여
  joinGame(gameId = null) {
    return new Promise((resolve, reject) => {
      this.socket.emit('joinGame', { gameId });

      this.socket.once('joinedGame', (data) => {
        resolve(data);
      });

      this.socket.once('error', (error) => {
        reject(error);
      });
    });
  }

  // 게임 시작
  startGame(gameId) {
    this.socket.emit('startGame', { gameId });
  }

  // 건물 건설
  buildBuilding(gameId, x, y, buildingType) {
    this.socket.emit('buildBuilding', { gameId, x, y, buildingType });
  }

  // 군인 이동
  moveTroops(gameId, fromX, fromY, toX, toY, troopCount) {
    this.socket.emit('moveTroops', { gameId, fromX, fromY, toX, toY, troopCount });
  }

  // 게임 상태 조회
  getGameState(gameId) {
    this.socket.emit('getGameState', { gameId });
  }

  // 이벤트 리스너 등록
  on(event, callback) {
    this.socket?.on(event, callback);
  }

  // 이벤트 리스너 제거
  off(event, callback) {
    this.socket?.off(event, callback);
  }
}

export default new SocketService();
