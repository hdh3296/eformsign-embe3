# 디지털 계약서 발송 시스템

디지털 계약서 발송 MVP 시스템입니다.

## 주요 기능
- 고객 정보 입력
- eformsign API를 통한 계약서 생성
- SMS로 계약서 발송
- 실시간 발송 결과 확인

## 설치 및 설정

### 1. 환경변수 설정
```bash
# .env.example을 복사하여 .env.local 생성
cp .env.example .env.local

# 실제 API 정보로 수정
# 보안상 중요: 실제 값은 별도로 전달받으세요
```

### 2. 서버 시작
```bash
# 리팩토링된 서버 (권장)
node src/server/index.js

# 또는 레거시 서버
node proxy-server.js

# 브라우저에서 접속
http://localhost:3000/demo
```

## 보안 주의사항
⚠️ **중요**: API 키, Bearer 토큰 등 민감한 정보는 환경변수로 관리됩니다.
- `docs/security-notice.md` 참조
- 실제 API 정보는 별도 전달

## Next.js 마이그레이션
상세한 마이그레이션 가이드는 `src/examples/nextjs-migration.md`를 참조하세요.

## 파일 구조
```
├── pest-control-demo.html    # 메인 웹 애플리케이션
├── proxy-server.js          # 레거시 프록시 서버
├── test-eformsign.js        # API 테스트 스크립트
├── src/                     # 리팩토링된 모듈들
│   ├── api/                 # API 통신 로직
│   ├── config/              # 설정 관리
│   ├── server/              # 서버 로직
│   ├── utils/               # 유틸리티 함수들
│   └── examples/            # 예시 및 가이드
└── docs/                    # 문서
```

## API 정보
- eformsign API 연동
- Bearer Token 인증
- SMS 발송 지원
- 환경변수 기반 설정 관리

## 개발 도구
- Node.js 기반 프록시 서버
- 자동화된 테스트 스크립트
- AI 친화적 로깅 시스템
- 모듈화된 아키텍처