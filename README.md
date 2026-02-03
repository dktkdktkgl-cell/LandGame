# 🎮 LandGame

20x20 그리드 기반 실시간 멀티플레이어 땅따먹기 게임

## 📋 게임 규칙

- **맵**: 20x20 그리드
- **플레이어**: 2-4명 동시 플레이
- **건물**:
  - 🏕️ 군인캠프: 2초마다 군인 1명 생산
  - ⛏️ 광산: 1초마다 금 1개 생산
- **군인**: 10초마다 1칸 이동
- **땅 점령**: 빈 땅에 30초 주둔 + 금 10개
- **전투**: 군인 수 비교, 많은 쪽이 승리 (상대 군인 수만큼 손실)
- **승리 조건**: 200칸 이상 점령 (50%)

## 🛠️ 기술 스택

- **프론트엔드**: React + Vite + HTML5 Canvas
- **백엔드**: Node.js + Express + Socket.IO
- **데이터베이스**: PostgreSQL

## 📁 프로젝트 구조

```
├── client/           # React 프론트엔드
│   ├── src/
│   │   ├── components/  # React 컴포넌트
│   │   ├── context/     # 전역 상태 관리
│   │   ├── services/    # Socket 및 렌더링 서비스
│   │   └── utils/       # 유틸리티 및 상수
│   └── package.json
├── server/           # Node.js 백엔드
│   ├── src/
│   │   ├── config/      # DB 설정
│   │   ├── services/    # 게임 로직
│   │   ├── controllers/ # Socket 핸들러
│   │   └── utils/       # 상수 및 유틸리티
│   ├── migrations/      # DB 마이그레이션
│   └── package.json
└── CLAUDE.md         # 게임 기획서
```

## 🚀 설치 및 실행

### 1. 사전 요구사항

- Node.js 18+ 설치
- PostgreSQL 설치 및 실행

### 2. PostgreSQL 데이터베이스 생성

```bash
# PostgreSQL 접속
psql -U postgres

# 데이터베이스 생성
CREATE DATABASE landgame;

# 종료
\q
```

### 3. 환경 변수 설정

**server/.env** 파일을 열고 PostgreSQL 설정을 확인/수정:
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=landgame
DB_USER=postgres
DB_PASSWORD=postgres  # 본인의 PostgreSQL 비밀번호로 변경
```

### 4. 패키지 설치

```bash
# 서버 패키지 설치
cd server
npm install

# 클라이언트 패키지 설치
cd ../client
npm install
```

### 5. 데이터베이스 마이그레이션

```bash
# 루트 디렉토리로 이동
cd ..

# 마이그레이션 실행
npm run migrate
```

### 6. 개발 서버 실행

**두 개의 터미널이 필요합니다:**

**터미널 1 - 백엔드 서버:**
```bash
npm run dev:server
```

**터미널 2 - 프론트엔드 서버:**
```bash
npm run dev:client
```

### 7. 게임 접속

브라우저에서 http://localhost:5173 을 열어 게임을 시작하세요!

**멀티플레이어 테스트:**
- 여러 브라우저 탭/창을 열어서 동시에 접속
- 각 탭이 서로 다른 플레이어로 인식됨
- 2-4명이 모이면 게임 시작 가능

## 🎮 게임 플레이 가이드

1. **게임 시작**: 2-4명의 플레이어가 참여하면 "게임 시작" 버튼 활성화
2. **초기 상태**: 각 플레이어는 랜덤 위치에서 1칸으로 시작 (금 10개 보유)
3. **건물 건설**: 자신의 땅을 클릭 → 군인캠프 또는 광산 건설
4. **군인 생산**: 군인캠프가 2초마다 자동으로 군인 생산
5. **금 생산**: 광산이 1초마다 자동으로 금 생산
6. **군인 이동**:
   - 군인이 있는 자신의 땅 클릭
   - "이동 시작" 버튼 클릭
   - 인접한 타일 클릭하여 이동
7. **전투**: 적의 땅으로 군인 이동 시 자동 전투
8. **땅 점령**: 빈 땅에 군인을 보내고 30초 대기 (금 10개 소모)
9. **승리**: 200칸 이상 점령 시 게임 종료!

## 🔧 개발 정보

### 주요 서비스

**백엔드:**
- `GameService`: 게임 생성, 시작, 승리 조건 체크
- `BuildingService`: 건물 건설, 금/군인 생산
- `TroopService`: 군인 이동, 도착 처리, 땅 점령
- `CombatService`: 전투 로직
- `TimerService`: 게임 타이머 관리

**프론트엔드:**
- `GameRenderer`: Canvas 렌더링
- `GameContext`: 전역 상태 관리
- `socketService`: Socket.IO 통신

### Socket 이벤트

**클라이언트 → 서버:**
- `joinGame`: 게임 참여
- `startGame`: 게임 시작
- `buildBuilding`: 건물 건설
- `moveTroops`: 군인 이동

**서버 → 클라이언트:**
- `gameStarted`: 게임 시작 알림
- `goldProduced`: 금 생산 업데이트
- `troopsProduced`: 군인 생산 업데이트
- `troopsArrived`: 군인 도착 알림
- `landOccupied`: 땅 점령 알림
- `gameEnded`: 게임 종료

## 📝 라이선스

MIT

## 🤝 기여

Pull Request를 환영합니다!

---

**Made with Claude Code** 🤖
