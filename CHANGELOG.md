# 변경 이력 (Changelog)

## 2026-02-03 - 군인 이동 UX 개선

### 추가된 기능

#### 1. 군인 이동 애니메이션
- 군인이 출발지에서 목적지까지 이동하는 모습을 시각적으로 표시
- 이동 경로를 점선으로 표시하여 이동 방향 명확화
- Easing 함수를 사용한 부드러운 움직임
- 이동 중인 군인을 원형 마커로 표시하며 군인 수도 함께 표시

**변경된 파일:**
- `client/src/services/gameRenderer.js`
  - `movingTroops` 배열 추가: 이동 중인 군인 정보 추적
  - `startTroopMovement()`: 군인 이동 애니메이션 시작
  - `animate()`: 애니메이션 루프 처리
  - `drawMovingTroops()`: 이동 중인 군인 렌더링
  - `easeInOutQuad()`: 부드러운 애니메이션을 위한 easing 함수

- `client/src/context/GameContext.jsx`
  - `pendingMovement` 상태 추가: 서버로부터 받은 이동 정보 임시 저장
  - `troopsMoved` 이벤트 핸들러 수정: playerId 포함

- `client/src/components/Game/GameBoard.jsx`
  - 애니메이션 렌더링을 위한 `useEffect` 추가
  - `pendingMovement` 감지 및 애니메이션 시작 로직 추가

#### 2. 이동 후 타일에서 즉시 명령 가능
- 군인 이동 완료 후 도착지 타일이 자동으로 선택된 상태로 유지
- 도착한 타일에서 바로 "방어하기" 또는 "이동 시작" 버튼 사용 가능
- 연속적인 군인 이동 명령이 더욱 편리해짐

**변경된 파일:**
- `client/src/components/Game/GameControls.jsx`
  - `handleExecuteMovement()`: 이동 완료 후 도착지 타일 선택 유지

#### 3. "처음으로" 버튼 추가
- 군인 이동 모드 중 타일 선택을 유지하면서 초기 상태로 돌아가는 버튼
- 이동 모드를 취소하지 않고도 다른 타일의 명령을 확인 가능

**변경된 파일:**
- `client/src/components/Game/GameControls.jsx`
  - `handleResetToInitialState()`: 초기 상태로 리셋
  - UI에 "🔄 처음으로" 버튼 추가

#### 4. 방어하기 버튼 UI 추가
- 군인이 있는 타일에서 "🛡️ 방어하기" 버튼 표시
- 향후 방어 모드 기능 구현을 위한 UI 준비

**변경된 파일:**
- `client/src/components/Game/GameControls.jsx`
  - 군인 명령 섹션에 방어하기 버튼 추가

### 기술적 개선사항

- 애니메이션을 위한 `requestAnimationFrame` 사용으로 부드러운 렌더링
- 이동 시간은 게임 상수(`TROOP_MOVEMENT_TIME`: 10초)를 기준으로 동기화
- Context API를 통한 효율적인 상태 관리
- 서버에서 이미 제공하는 `playerId`를 활용하여 올바른 플레이어 색상으로 군인 표시

### 사용자 경험 개선

1. **시각적 피드백**: 군인 이동이 즉시 애니메이션으로 표시되어 게임 진행 상황을 직관적으로 파악 가능
2. **연속 명령**: 이동 완료 후 바로 다음 명령을 내릴 수 있어 게임 플레이 속도 향상
3. **유연한 조작**: "처음으로" 버튼으로 언제든 초기 상태로 돌아가 다른 작업 수행 가능
4. **명확한 인터페이스**: 각 상황에 맞는 버튼만 표시되어 혼란 최소화

---

## 이전 버전

### 2026-02-02 - 게임 플레이 개선
- 게임 참여 및 군인 이동 UI 개선
- 플레이어 중복 생성 문제 해결
- 재접속 문제 수정

### 2026-02-01 - 멀티플레이어 구현
- 실시간 멀티플레이어 땅따먹기 게임 구현
- Socket.io를 통한 실시간 통신
- PostgreSQL 데이터베이스 연동
