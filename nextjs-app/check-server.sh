#!/bin/bash

# 서버 상태 확인 스크립트

echo "🔍 서버 상태 확인 중..."

# 포트 3001 확인
if curl -s http://localhost:3001 > /dev/null 2>&1; then
    echo "✅ 서버가 실행 중입니다!"
    echo "🌐 URL: http://localhost:3001"
    
    # API 테스트
    echo "🧪 API 테스트 중..."
    
    # 홈페이지 응답 코드
    HOME_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3001)
    echo "📄 홈페이지: HTTP $HOME_STATUS"
    
    # API 토큰 테스트
    TOKEN_STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X POST http://localhost:3001/api/auth/token \
        -H "Content-Type: application/json" \
        -d '{"execution_time": 1640995200000}')
    echo "🔑 토큰 API: HTTP $TOKEN_STATUS"
    
    if [[ $HOME_STATUS == "200" && $TOKEN_STATUS == "200" ]]; then
        echo "✅ 모든 기능이 정상 작동합니다!"
    else
        echo "⚠️  일부 기능에 문제가 있을 수 있습니다."
    fi
    
else
    echo "❌ 서버가 실행되지 않았습니다."
    echo "💡 서버를 시작하려면: ./start-server.sh"
    exit 1
fi