#!/bin/bash

# 로그 파일 경로
LOG_FILE="./server-status.log"
ERROR_LOG="./server-error.log"

# 로그 함수
log_info() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] INFO: $1" | tee -a "$LOG_FILE"
}

log_error() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] ERROR: $1" | tee -a "$ERROR_LOG" | tee -a "$LOG_FILE"
}

log_success() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] SUCCESS: $1" | tee -a "$LOG_FILE"
}

# 기존 로그 파일 초기화
echo "=============== 새로운 서버 실행 시작 ===============" > "$LOG_FILE"
echo "=============== 에러 로그 ===============" > "$ERROR_LOG"

log_info "서버 실행 스크립트 시작"

# 1. 기존 프로세스 정리
log_info "기존 Next.js 프로세스 확인 중..."
EXISTING_PID=$(ps aux | grep "next dev" | grep -v grep | awk '{print $2}' | head -1)

if [ ! -z "$EXISTING_PID" ]; then
    log_info "기존 프로세스 발견 (PID: $EXISTING_PID) - 종료 중..."
    kill $EXISTING_PID 2>/dev/null
    sleep 2
    log_success "기존 프로세스 종료 완료"
else
    log_info "실행 중인 Next.js 프로세스 없음"
fi

# 2. 포트 상태 확인
log_info "포트 3000 상태 확인 중..."
if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null 2>&1; then
    log_error "포트 3000이 다른 프로세스에서 사용 중"
    PORT=3001
    log_info "포트 3001로 변경하여 실행"
else
    PORT=3000
    log_success "포트 3000 사용 가능"
fi

# 3. 서버 시작
log_info "Next.js 서버를 포트 $PORT에서 시작합니다..."
nohup npm run dev -- -p $PORT > server-output.log 2>&1 &
SERVER_PID=$!

log_info "서버 프로세스 시작됨 (PID: $SERVER_PID)"

# 4. 서버 시작 대기 및 상태 확인
log_info "서버 시작 대기 중... (최대 30초)"

for i in {1..30}; do
    sleep 1
    
    # 프로세스가 살아있는지 확인
    if ! kill -0 $SERVER_PID 2>/dev/null; then
        log_error "서버 프로세스가 예상보다 일찍 종료됨"
        log_error "에러 로그 확인: tail server-output.log"
        exit 1
    fi
    
    # HTTP 응답 확인
    HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:$PORT 2>/dev/null)
    
    if [ "$HTTP_STATUS" = "200" ]; then
        log_success "서버가 성공적으로 시작되었습니다!"
        log_success "URL: http://localhost:$PORT"
        log_success "PID: $SERVER_PID"
        break
    fi
    
    # 진행 상황 로그
    if [ $((i % 5)) -eq 0 ]; then
        log_info "대기 중... ($i/30초) - HTTP 상태: ${HTTP_STATUS:-연결불가}"
    fi
done

# 5. API 테스트
if [ "$HTTP_STATUS" = "200" ]; then
    log_info "API 기능 테스트 중..."
    
    API_STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X POST http://localhost:$PORT/api/auth/token \
        -H "Content-Type: application/json" \
        -d '{"execution_time": 1640995200000}' 2>/dev/null)
    
    if [ "$API_STATUS" = "200" ]; then
        log_success "API 토큰 발급 테스트 성공"
    else
        log_error "API 토큰 발급 실패 (상태: $API_STATUS)"
    fi
    
    log_success "========================================="
    log_success "🎉 서버 실행 완료!"
    log_success "📍 URL: http://localhost:$PORT"
    log_success "🔧 PID: $SERVER_PID"
    log_success "📊 상태: 정상 실행"
    log_success "📝 로그 파일: $LOG_FILE"
    log_success "❌ 에러 로그: $ERROR_LOG"
    log_success "📄 서버 출력: server-output.log"
    log_success "========================================="
    
    echo ""
    echo "🛑 서버 종료 방법:"
    echo "   kill $SERVER_PID"
    echo "   또는 Ctrl+C로 이 스크립트 종료"
    echo ""
    echo "📊 실시간 로그 확인:"
    echo "   tail -f $LOG_FILE"
    echo "   tail -f server-output.log"
    echo ""
    
    # 서버 프로세스 모니터링
    log_info "서버 모니터링 시작... (Ctrl+C로 종료)"
    
    trap "log_info '사용자가 서버 종료 요청'; kill $SERVER_PID 2>/dev/null; log_success '서버 종료 완료'; exit 0" INT
    
    while kill -0 $SERVER_PID 2>/dev/null; do
        sleep 10
        if curl -s http://localhost:$PORT > /dev/null 2>&1; then
            log_info "서버 상태: 정상 (PID: $SERVER_PID)"
        else
            log_error "서버 응답 없음 - 프로세스 확인 필요"
        fi
    done
    
    log_error "서버 프로세스가 예상치 못하게 종료됨"
    
else
    log_error "서버 시작 실패 - 30초 내에 응답 없음"
    log_error "프로세스 상태 확인: kill -0 $SERVER_PID"
    log_error "출력 로그 확인: tail server-output.log"
    kill $SERVER_PID 2>/dev/null
    exit 1
fi