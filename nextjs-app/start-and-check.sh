#!/bin/bash

# 로그 파일 경로
LOG_FILE="./server-status.log"

# 로그 함수
log_info() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] INFO: $1" | tee -a "$LOG_FILE"
}

log_success() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] SUCCESS: $1" | tee -a "$LOG_FILE"
}

log_error() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] ERROR: $1" | tee -a "$LOG_FILE"
}

# 로그 파일 초기화
echo "=============== 서버 실행 시작: $(date) ===============" > "$LOG_FILE"

log_info "서버 실행 스크립트 시작"

# 1. 기존 프로세스 정리
EXISTING_PID=$(ps aux | grep "next dev" | grep -v grep | awk '{print $2}' | head -1)
if [ ! -z "$EXISTING_PID" ]; then
    log_info "기존 프로세스 종료 중... (PID: $EXISTING_PID)"
    kill $EXISTING_PID 2>/dev/null
    sleep 2
    log_success "기존 프로세스 종료 완료"
fi

# 2. 포트 확인
if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null 2>&1; then
    PORT=3001
    log_info "포트 3000 사용 중 → 포트 3001 사용"
else
    PORT=3000
    log_info "포트 3000 사용 가능"
fi

# 3. 서버 시작
log_info "Next.js 서버를 포트 $PORT에서 시작합니다..."
nohup npm run dev -- -p $PORT > server-output.log 2>&1 &
SERVER_PID=$!

log_info "서버 프로세스 시작됨 (PID: $SERVER_PID)"

# 4. 서버 응답 대기 (최대 20초)
log_info "서버 응답 대기 중... (최대 20초)"

for i in {1..20}; do
    sleep 1
    
    # 프로세스 상태 확인
    if ! kill -0 $SERVER_PID 2>/dev/null; then
        log_error "서버 프로세스가 종료됨 - server-output.log 확인 필요"
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

# 5. 최종 확인 및 보고
if [ "$HTTP_STATUS" = "200" ]; then
    # API 테스트
    API_STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X POST http://localhost:$PORT/api/auth/token \
        -H "Content-Type: application/json" \
        -d '{"execution_time": 1640995200000}' 2>/dev/null)
    
    log_success "========================================="
    log_success "🎉 서버 실행 완료!"
    log_success "📍 URL: http://localhost:$PORT"
    log_success "🔧 PID: $SERVER_PID"
    log_success "🌐 홈페이지: HTTP $HTTP_STATUS"
    log_success "🔑 API: HTTP ${API_STATUS:-에러}"
    log_success "📝 로그: $LOG_FILE"
    log_success "========================================="
    
    echo ""
    echo "✅ 서버가 성공적으로 실행되었습니다!"
    echo "🌐 브라우저에서 http://localhost:$PORT 접속 가능"
    echo ""
    echo "🛑 서버 종료: kill $SERVER_PID"
    echo "📊 로그 확인: ./check-logs.sh"
    echo ""
    echo "🎯 이 스크립트는 이제 종료됩니다. 서버는 백그라운드에서 계속 실행됩니다."
    
else
    log_error "서버 시작 실패 - 20초 내에 응답 없음"
    log_error "프로세스 상태: $(kill -0 $SERVER_PID 2>/dev/null && echo '실행중' || echo '종료됨')"
    log_error "로그 확인: tail server-output.log"
    
    kill $SERVER_PID 2>/dev/null
    echo "❌ 서버 시작에 실패했습니다."
    echo "📄 에러 로그: tail server-output.log"
    exit 1
fi