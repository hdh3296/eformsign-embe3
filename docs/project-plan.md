# 방역업체 현장 계약 시스템 MVP 개발 계획서

## 📋 프로젝트 개요

### 목적
- **대상**: 방역업체 관리자/직원
- **용도**: 현장에서 고객과 즉시 계약서 체결
- **성격**: 영업용 데모 + 최소기능 구현체
- **기술**: Next.js + eformsign API

### 사용 시나리오
1. **현장 도착**: 방역업체 직원이 고객 사무실/현장 방문
2. **정보 입력**: 웹 브라우저에서 고객 정보 간단 입력
3. **계약서 발송**: 고객 휴대폰으로 SMS 계약서 발송
4. **현장 서명**: 고객이 휴대폰에서 바로 계약서 작성/서명
5. **즉시 완료**: 계약 완료, 서비스 시작

## 🎯 MVP 최소 기능 정의

### 핵심 기능 (필수)
- [x] **간단한 입력 폼**: 고객명, 휴대폰번호, 계약내용
- [x] **SMS 발송**: eformsign API 통해 계약서 SMS 전송
- [x] **성공/실패 알림**: 발송 결과 확인

### 제외 기능 (나중에)
- 사용자 인증/로그인
- 계약 히스토리 관리
- 복잡한 UI/UX
- 다중 템플릿 선택

## 🏗️ 기술 스택 및 아키텍처

### 기술 스택
- **프레임워크**: Next.js 14 (App Router)
- **언어**: TypeScript
- **스타일링**: Tailwind CSS (빠른 개발)
- **API 연동**: eformsign REST API
- **배포**: Vercel (나중에)

### 프로젝트 구조
```
pest-control-contract/
├── app/
│   ├── api/
│   │   ├── auth/
│   │   │   └── route.ts          # eformsign Access Token 발급
│   │   └── documents/
│   │       └── route.ts          # 계약서 생성 및 SMS 발송
│   ├── page.tsx                  # 메인 페이지 (입력 폼)
│   ├── success/
│   │   └── page.tsx              # 발송 성공 페이지
│   └── layout.tsx                # 기본 레이아웃
├── lib/
│   └── eformsign.ts              # eformsign API 클래스
├── components/
│   ├── ContractForm.tsx          # 계약서 발송 폼 컴포넌트
│   └── ui/                       # 재사용 UI 컴포넌트
├── .env.local                    # 환경변수 (API 키 등)
├── package.json
└── README.md
```

## 🔧 구현 세부사항

### 환경변수 설정
```bash
# .env.local (실제 값으로 교체하세요)
EFORMSIGN_API_KEY=your_api_key_here
EFORMSIGN_BEARER_TOKEN=your_bearer_token_here
EFORMSIGN_COMPANY_ID=your_company_id_here
EFORMSIGN_MEMBER_ID=your_email@example.com
EFORMSIGN_TEMPLATE_ID=your_template_id_here
```

### API Routes

#### 1. Access Token 발급 (`/api/auth/route.ts`)
```typescript
export async function POST() {
  const timestamp = Date.now();
  const base64ApiKey = Buffer.from(process.env.EFORMSIGN_API_KEY!).toString('base64');
  
  // eformsign Access Token 발급 로직
  // Postman에서 테스트한 방식 그대로 구현
}
```

#### 2. 계약서 발송 (`/api/documents/route.ts`)
```typescript
export async function POST(request: Request) {
  const { customerName, phoneNumber, contractDetails } = await request.json();
  
  // 1. Access Token 발급
  // 2. 문서 생성 및 SMS 발송
  // 3. 결과 반환
}
```

### 프론트엔드 컴포넌트

#### 메인 페이지 (`app/page.tsx`)
```typescript
export default function HomePage() {
  return (
    <div className="max-w-md mx-auto mt-10 p-6">
      <h1 className="text-2xl font-bold mb-6">방역 계약서 발송</h1>
      <ContractForm />
    </div>
  );
}
```

#### 계약서 폼 (`components/ContractForm.tsx`)
```typescript
'use client';

export default function ContractForm() {
  const [loading, setLoading] = useState(false);
  
  const handleSubmit = async (formData) => {
    setLoading(true);
    
    try {
      const response = await fetch('/api/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      if (response.ok) {
        router.push('/success');
      } else {
        // 에러 처리
      }
    } catch (error) {
      // 에러 처리
    } finally {
      setLoading(false);
    }
  };
}
```

## 📱 UI/UX 설계

### 메인 화면 와이어프레임
```
┌─────────────────────────────────┐
│     🦠 디지털 계약서 발송         │
├─────────────────────────────────┤
│                                 │
│ 고객명 *                        │
│ ┌─────────────────────────────┐ │
│ │ 홍길동                      │ │
│ └─────────────────────────────┘ │
│                                 │
│ 휴대폰번호 *                    │
│ ┌─────────────────────────────┐ │
│ │ 010-1234-5678               │ │
│ └─────────────────────────────┘ │
│                                 │
│ 계약내용                        │
│ ┌─────────────────────────────┐ │
│ │ 사무실 정기 방역            │ │
│ └─────────────────────────────┘ │
│                                 │
│ ┌─────────────────────────────┐ │
│ │     📱 계약서 발송하기      │ │
│ └─────────────────────────────┘ │
│                                 │
│ * SMS로 계약서가 발송됩니다     │
└─────────────────────────────────┘
```

### 성공 페이지
```
┌─────────────────────────────────┐
│            ✅ 발송 완료         │
├─────────────────────────────────┤
│                                 │
│   계약서가 성공적으로            │
│   발송되었습니다!               │
│                                 │
│   📱 010-1234-5678              │
│   고객이 휴대폰에서 계약서를     │
│   확인할 수 있습니다.           │
│                                 │
│ ┌─────────────────────────────┐ │
│ │      새 계약서 발송         │ │
│ └─────────────────────────────┘ │
└─────────────────────────────────┘
```

## 🚀 개발 단계별 계획

### 1단계: 프로젝트 초기 설정 (1일차)
- [x] Next.js 프로젝트 생성
- [x] 기본 폴더 구조 생성
- [x] 환경변수 설정
- [x] Tailwind CSS 설정

### 2단계: API 연동 구현 (1일차)
- [x] eformsign API 클래스 구현
- [x] Access Token 발급 API Route
- [x] 문서 생성/발송 API Route
- [x] 에러 처리 로직

### 3단계: 프론트엔드 구현 (1일차)
- [x] 메인 입력 폼 컴포넌트
- [x] 성공/실패 페이지
- [x] 기본 스타일링
- [x] 로딩 상태 처리

### 4단계: 테스트 및 검증 (1일차)
- [x] 로컬 환경에서 실제 SMS 발송 테스트
- [x] 에러 케이스 테스트
- [x] 사용성 확인

### 5단계: 영업용 준비 (차주)
- [ ] 실제 방역 계약서 템플릿 적용
- [ ] UI 개선 및 브랜딩
- [ ] 배포 및 데모 환경 구축

## 📊 성공 지표

### 기술적 성공 기준
- [x] 폼 입력 → SMS 발송까지 30초 이내 완료
- [x] 에러 발생 시 명확한 메시지 표시
- [x] 모바일 브라우저에서 정상 동작

### 비즈니스 성공 기준
- [ ] 방역업체 관리자가 혼자서 사용 가능
- [ ] 고객이 휴대폰에서 쉽게 계약서 작성 가능
- [ ] 영업 시연 시 임팩트 있는 데모

## 🔒 보안 고려사항

### API 키 보안
- 모든 API 키는 서버 환경변수에만 저장
- 클라이언트에서 직접 eformsign API 호출 금지
- Next.js API Routes를 통한 프록시 방식

### 데이터 처리
- 개인정보는 전송 목적으로만 사용
- 별도 저장하지 않음 (MVP 단계)
- HTTPS 통신 필수

## 📝 추후 확장 계획

### 단기 확장 (1-2개월)
- 계약 히스토리 관리
- 다양한 계약서 템플릿
- 사용자 인증 시스템

### 중기 확장 (3-6개월)
- 고객 관리 시스템
- 매출 대시보드
- 모바일 앱 개발

### 장기 확장 (6개월+)
- 다른 업체용 템플릿
- SaaS 모델 전환
- API 제공

## 🛠️ 개발 환경 설정

### 필수 설치 프로그램
```bash
# Node.js 18+ 설치 확인
node --version

# Next.js 프로젝트 생성
npx create-next-app@latest pest-control-contract --typescript --tailwind --app

# 의존성 설치
npm install axios
npm install @types/node
```

### 개발 서버 실행
```bash
cd pest-control-contract
npm run dev
# http://localhost:3000에서 확인
```

## 📞 연락처 및 지원

### 개발자
- **이름**: HDH
- **이메일**: hdh3296@gmail.com

### eformsign API 정보
- **API 키**: d00ff6bb-6a84-4ed4-8b99-841f51743443
- **템플릿 ID**: 023bd3b657cb4565b6f72e6fed2cbd8e (회원가입신청서)
- **문서**: docs/ref/ 폴더 참조

---

**작성일**: 2025-06-20  
**버전**: v1.0  
**상태**: 개발 준비 완료