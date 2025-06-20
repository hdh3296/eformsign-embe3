#!/bin/bash

echo "🔍 서버 로그 상태 확인"
echo "======================"

# 로그 파일 존재 여부 확인
if [ -f "server-status.log" ]; then
    echo "📊 서버 상태 로그 (최근 10줄):"
    echo "----------------------------"
    tail -10 server-status.log
    echo ""
else
    echo "❌ server-status.log 파일이 없습니다"
fi

if [ -f "server-error.log" ]; then
    echo "❌ 에러 로그 (최근 5줄):"
    echo "------------------------"
    tail -5 server-error.log
    echo ""
else
    echo "✅ 에러 로그 없음"
fi

if [ -f "server-output.log" ]; then
    echo "📄 서버 출력 로그 (최근 5줄):"
    echo "----------------------------"
    tail -5 server-output.log
    echo ""
fi

# 현재 실행 중인 Next.js 프로세스 확인
echo "🔄 현재 실행 중인 Next.js 프로세스:"
echo "--------------------------------"
ps aux | grep "next dev" | grep -v grep || echo "실행 중인 Next.js 프로세스 없음"

echo ""
echo "🌐 포트 사용 상태:"
echo "-----------------"
lsof -i :3000 -i :3001 2>/dev/null || echo "포트 3000, 3001 사용 중인 프로세스 없음"

echo ""
echo "📊 실시간 로그 모니터링 명령어:"
echo "tail -f server-status.log    # 상태 로그"
echo "tail -f server-error.log     # 에러 로그"  
echo "tail -f server-output.log    # 서버 출력"