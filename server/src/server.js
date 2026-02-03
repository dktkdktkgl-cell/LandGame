import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import session from 'express-session';
import cors from 'cors';
import dotenv from 'dotenv';
import pool from './config/database.js';
import { setupSocketHandlers } from './controllers/socketController.js';
import TimerService from './services/TimerService.js';

dotenv.config();

const app = express();
const httpServer = createServer(app);

// 세션 미들웨어 설정
const sessionMiddleware = session({
  secret: process.env.SESSION_SECRET || 'landgame-secret',
  resave: false,
  saveUninitialized: true,
  cookie: {
    maxAge: 24 * 60 * 60 * 1000 // 24시간
  }
});

// Express 미들웨어
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());
app.use(sessionMiddleware);

// Socket.IO 설정
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
    methods: ['GET', 'POST']
  }
});

// Socket.IO에 세션 미들웨어 적용
io.engine.use(sessionMiddleware);

// Socket 이벤트 핸들러 설정
setupSocketHandlers(io);

// 기본 라우트
app.get('/', (req, res) => {
  res.json({ message: 'LandGame Server is running!' });
});

// 헬스 체크
app.get('/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok', database: 'connected' });
  } catch (error) {
    res.status(500).json({ status: 'error', database: 'disconnected' });
  }
});

// 서버 시작
const PORT = process.env.PORT || 3000;

httpServer.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════╗
║       🎮 LandGame Server Started      ║
╠═══════════════════════════════════════╣
║  Port: ${PORT}                        ║
║  Environment: ${process.env.NODE_ENV || 'development'}        ║
║  Client URL: ${process.env.CLIENT_URL || 'http://localhost:5173'}  ║
╚═══════════════════════════════════════╝
  `);
});

// 종료 시 타이머 정리
process.on('SIGINT', () => {
  console.log('\n⏹️  Shutting down server...');
  TimerService.stopAllTimers();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n⏹️  Shutting down server...');
  TimerService.stopAllTimers();
  process.exit(0);
});

export { io };
