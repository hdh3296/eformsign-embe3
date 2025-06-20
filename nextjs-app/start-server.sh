#!/bin/bash

# Next.js 서버 시작 및 응답 확인 스크립트

echo "🚀 Next.js 서버를 시작합니다..."

# 백그라운드에서 서버 시작
npm run dev &
SERVER_PID=$!

echo "📡 서버 PID: $SERVER_PID"
echo "⏳ 서버가 시작될 때까지 대기 중..."

# 서버 응답 대기 (최대 30초)
for i in {1..30}; do
    sleep 1
    if curl -s http://localhost:3001 > /dev/null 2>&1; then
        echo "✅ 서버가 정상적으로 시작되었습니다!"
        echo "🌐 URL: http://localhost:3001"
        echo "🔗 API 토큰 테스트: http://localhost:3001/api/auth/token"
        
        # 간단한 API 테스트
        echo "🧪 API 토큰 발급 테스트 중..."
        TOKEN_RESPONSE=$(curl -s -X POST http://localhost:3001/api/auth/token \
            -H "Content-Type: application/json" \
            -d '{"execution_time": 1640995200000}')
        
        if [[ $TOKEN_RESPONSE == *"access_token"* ]]; then
            echo "✅ API 토큰 발급 성공!"
        else
            echo "❌ API 토큰 발급 실패"
        fi
        
        echo ""
        echo "🎯 서버가 준비되었습니다. 브라우저에서 http://localhost:3001 을 열어보세요!"
        echo "🛑 서버를 종료하려면 Ctrl+C를 누르거나 다음 명령어를 실행하세요:"
        echo "   kill $SERVER_PID"
        echo ""
        
        # 서버를 포그라운드로 전환
        wait $SERVER_PID
        exit 0
    fi
    echo "⏳ 대기 중... ($i/30초)"
done

echo "❌ 서버 시작 실패 또는 응답 없음"
kill $SERVER_PID 2>/dev/null
exit 1