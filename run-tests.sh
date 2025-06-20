#!/bin/bash

echo "🚀 eformsign API 자동 테스트 실행기"
echo "=================================="

# 1회 테스트
echo "1️⃣ 단일 테스트 실행:"
echo "node test-eformsign.js"
echo ""

# 다중 테스트 
echo "2️⃣ 다중 테스트 실행 (3회):"
echo "node test-eformsign.js multiple"
echo ""

echo "3️⃣ 다중 테스트 실행 (5회):"
echo "node test-eformsign.js multiple 5"
echo ""

echo "어떤 테스트를 실행하시겠습니까?"
echo "1) 단일 테스트"
echo "2) 다중 테스트 (3회)"
echo "3) 다중 테스트 (5회)"
echo "4) 직접 입력"

read -p "선택하세요 (1-4): " choice

case $choice in
    1)
        echo "📱 단일 테스트 실행 중..."
        node test-eformsign.js
        ;;
    2)
        echo "📱 3회 연속 테스트 실행 중..."
        node test-eformsign.js multiple 3
        ;;
    3)
        echo "📱 5회 연속 테스트 실행 중..."
        node test-eformsign.js multiple 5
        ;;
    4)
        read -p "테스트 횟수를 입력하세요: " count
        echo "📱 ${count}회 연속 테스트 실행 중..."
        node test-eformsign.js multiple $count
        ;;
    *)
        echo "❌ 잘못된 선택입니다."
        ;;
esac

echo ""
echo "✅ 테스트 완료!"