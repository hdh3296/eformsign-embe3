# 서버 로그 관리 시스템 구축 가이드

> AI 코더를 위한 실용적인 서버 실행/종료/모니터링 스크립트 작성 가이드

## 🎯 목적

- 서버 실행 상태를 실시간으로 추적할 수 있는 로그 시스템 구축
- 명확한 시작/종료 지점이 있는 서버 관리 스크립트 작성
- 무한 루프 없이 적절한 완료 피드백을 제공하는 시스템 구현

## 📋 핵심 문제점과 해결책

### 문제 1: 서버 실행 여부를 확실히 알 수 없음
**해결책**: 단계별 로그 기록 + HTTP 응답 확인

### 문제 2: 스크립트가 무한 루프에 빠져 완료 확인이 안됨
**해결책**: 명확한 완료 지점 설정 + 타임아웃 처리

### 문제 3: 포트 충돌 및 프로세스 관리 어려움
**해결책**: 자동 포트 감지 + 기존 프로세스 정리

## 🛠 구현 단계

### 1단계: 로그 시스템 기본 구조

```bash
#!/bin/bash

# 로그 파일 경로 설정
LOG_FILE="./server-status.log"
ERROR_LOG="./server-error.log"

# 로그 함수 정의
log_info() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] INFO: $1" | tee -a "$LOG_FILE"
}

log_success() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] SUCCESS: $1" | tee -a "$LOG_FILE"
}

log_error() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] ERROR: $1" | tee -a "$ERROR_LOG" | tee -a "$LOG_FILE"
}

# 로그 파일 초기화
echo "=============== 서버 실행 시작: $(date) ===============" > "$LOG_FILE"
```

### 2단계: 기존 프로세스 정리

```bash
# 기존 프로세스 확인 및 정리
EXISTING_PID=$(ps aux | grep "next dev" | grep -v grep | awk '{print $2}' | head -1)
if [ ! -z "$EXISTING_PID" ]; then
    log_info "기존 프로세스 종료 중... (PID: $EXISTING_PID)"
    kill $EXISTING_PID 2>/dev/null
    sleep 2
    log_success "기존 프로세스 종료 완료"
fi
```

### 3단계: 포트 자동 감지

```bash
# 포트 사용 상태 확인
if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null 2>&1; then
    PORT=3001
    log_info "포트 3000 사용 중 → 포트 3001 사용"
else
    PORT=3000
    log_info "포트 3000 사용 가능"
fi
```

### 4단계: 서버 시작 및 모니터링

```bash
# 서버 백그라운드 실행
log_info "서버를 포트 $PORT에서 시작합니다..."
nohup npm run dev -- -p $PORT > server-output.log 2>&1 &
SERVER_PID=$!

log_info "서버 프로세스 시작됨 (PID: $SERVER_PID)"

# 서버 응답 대기 (타임아웃 설정 중요!)
log_info "서버 응답 대기 중... (최대 20초)"

for i in {1..20}; do
    sleep 1
    
    # 프로세스 상태 확인
    if ! kill -0 $SERVER_PID 2>/dev/null; then
        log_error "서버 프로세스가 종료됨"
        exit 1
    fi
    
    # HTTP 응답 확인
    HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:$PORT 2>/dev/null)
    
    if [ "$HTTP_STATUS" = "200" ]; then
        log_success "서버 응답 확인됨! (${i}초 후)"
        break
    fi
    
    echo "⏳ 대기 중... ($i/20초)"
done
```

### 5단계: 완료 보고 및 스크립트 종료

```bash
# 최종 상태 확인 및 보고
if [ "$HTTP_STATUS" = "200" ]; then
    log_success "========================================="
    log_success "🎉 서버 실행 완료!"
    log_success "📍 URL: http://localhost:$PORT"
    log_success "🔧 PID: $SERVER_PID"
    log_success "🌐 상태: HTTP $HTTP_STATUS"
    log_success "========================================="
    
    echo ""
    echo "✅ 서버가 성공적으로 실행되었습니다!"
    echo "🛑 서버 종료: kill $SERVER_PID"
    echo ""
    echo "🎯 이 스크립트는 이제 종료됩니다. 서버는 백그라운드에서 계속 실행됩니다."
    
else
    log_error "서버 시작 실패 - 20초 내에 응답 없음"
    kill $SERVER_PID 2>/dev/null
    exit 1
fi
```

## 📁 보조 스크립트

### 로그 확인 스크립트 (check-logs.sh)

```bash
#!/bin/bash

echo "🔍 서버 로그 상태 확인"
echo "======================"

# 상태 로그 확인
if [ -f "server-status.log" ]; then
    echo "📊 서버 상태 로그 (최근 10줄):"
    tail -10 server-status.log
else
    echo "❌ server-status.log 파일이 없습니다"
fi

# 현재 실행 중인 프로세스 확인
echo "🔄 현재 실행 중인 프로세스:"
ps aux | grep "next dev" | grep -v grep || echo "실행 중인 프로세스 없음"

# 포트 사용 상태
echo "🌐 포트 사용 상태:"
lsof -i :3000 -i :3001 2>/dev/null || echo "포트 사용 중인 프로세스 없음"
```

## 🎯 핵심 원칙

### 1. 명확한 완료 지점
- ❌ 무한 모니터링 루프
- ✅ 서버 시작 → 확인 → 보고 → 스크립트 종료

### 2. 타임아웃 설정
- 서버 응답 대기 시간을 명확히 제한 (20초 권장)
- 무한 대기 방지

### 3. 상태 검증
- 프로세스 존재 여부 (`kill -0 $PID`)
- HTTP 응답 상태 (`curl` 사용)
- API 기능 테스트

### 4. 로그 분리
- `server-status.log`: 일반 상태 로그
- `server-error.log`: 에러 전용 로그  
- `server-output.log`: 서버 실제 출력

## 📋 package.json 스크립트 등록

```json
{
  "scripts": {
    "dev": "next dev",
    "dev:log": "./start-and-check.sh",
    "logs": "./check-logs.sh"
  }
}
```

## 🚀 사용법

```bash
# 서버 시작 (로그와 함께)
./start-and-check.sh

# 로그 상태 확인
./check-logs.sh

# 서버 종료 (PID는 로그에서 확인)
kill [PID]
```

## ⚠️ 주의사항

1. **스크립트 실행 권한**: `chmod +x script-name.sh`
2. **포트 충돌**: 자동 감지 로직 필수
3. **타임아웃**: 무한 대기 방지를 위한 제한 시간 설정
4. **로그 파일**: `.gitignore`에 추가 권장

## 🔧 문제 해결

### 서버가 시작되지 않는 경우
```bash
# 에러 로그 확인
tail server-output.log

# 포트 사용 확인
lsof -i :3000

# 프로세스 확인
ps aux | grep next
```

### 로그가 기록되지 않는 경우
- 스크립트 실행 권한 확인
- 디렉토리 쓰기 권한 확인
- 로그 파일 경로 확인

---

**📌 이 가이드를 통해 어떤 프로젝트에서든 안정적인 서버 로그 관리 시스템을 구축할 수 있습니다.**