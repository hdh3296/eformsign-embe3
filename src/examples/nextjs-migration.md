# Next.js 마이그레이션 가이드

## 개요
현재 프로젝트를 Next.js로 변환하기 위한 단계별 가이드입니다. 리팩토링된 모듈들을 활용하여 쉽게 마이그레이션할 수 있습니다.

## 1. 프로젝트 구조

### 현재 구조
```
eformsign_embe3/
├── pest-control-demo.html     # 단일 HTML 파일
├── proxy-server.js           # CORS 프록시 서버
├── test-eformsign.js         # Node.js 테스트
└── src/                      # 리팩토링된 모듈들
    ├── api/eformsign.js      # API 통신 로직
    ├── config/index.js       # 설정 관리
    ├── utils/errors.js       # 에러 처리
    ├── utils/ui.js           # UI 유틸리티
    └── server/               # 서버 로직
        ├── index.js          # 통합 서버
        └── routes.js         # 라우팅 로직
```

### Next.js 구조 (목표)
```
pest-control-nextjs/
├── app/                      # App Router 방식
│   ├── api/
│   │   ├── auth/
│   │   │   └── token/route.js
│   │   └── documents/
│   │       └── create/route.js
│   ├── page.js               # 메인 페이지
│   └── layout.js
├── components/
│   ├── ContractForm.js       # 계약서 폼
│   └── ui/
│       ├── Button.js
│       └── Input.js
├── lib/
│   ├── eformsign.js          # API 클라이언트
│   ├── config.js             # 설정
│   └── utils.js              # 유틸리티
├── public/
└── next.config.js
```

## 2. 환경 설정

### .env.local 파일 생성
```bash
# eformsign API 설정 (실제 값으로 교체하세요)
EFORMSIGN_API_KEY=your_api_key_here
EFORMSIGN_BEARER_TOKEN=your_bearer_token_here
EFORMSIGN_MEMBER_ID=your_email@example.com
EFORMSIGN_COMPANY_ID=your_company_id_here
EFORMSIGN_TEMPLATE_ID=your_template_id_here

# Next.js 설정
NODE_ENV=development
NEXT_PUBLIC_API_URL=http://localhost:3000
```

### package.json 의존성
```json
{
  "dependencies": {
    "next": "^14.0.0",
    "react": "^18.0.0",
    "react-dom": "^18.0.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "@types/react": "^18.0.0",
    "eslint": "^8.0.0",
    "eslint-config-next": "^14.0.0",
    "typescript": "^5.0.0"
  }
}
```

## 3. API 라우트 마이그레이션

### 토큰 발급 API: app/api/auth/token/route.js
```javascript
import { NextJSHelpers } from '../../../../src/server/routes';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const req = {
      method: 'POST',
      body,
      headers: {
        authorization: request.headers.get('authorization'),
        eformsign_signature: request.headers.get('eformsign_signature')
      }
    };
    
    let responseData;
    const res = {
      status: (code) => ({
        json: (data) => {
          responseData = { data, status: code };
          return responseData;
        }
      })
    };
    
    await NextJSHelpers.handleTokenRequest(req, res);
    
    return NextResponse.json(responseData.data, { 
      status: responseData.status 
    });
    
  } catch (error) {
    return NextResponse.json(
      { error: '토큰 발급 실패' }, 
      { status: 500 }
    );
  }
}
```

### 문서 생성 API: app/api/documents/create/route.js
```javascript
import { NextJSHelpers } from '../../../../src/server/routes';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const req = {
      method: 'POST',
      body,
      headers: {
        authorization: request.headers.get('authorization')
      }
    };
    
    let responseData;
    const res = {
      status: (code) => ({
        json: (data) => {
          responseData = { data, status: code };
          return responseData;
        }
      })
    };
    
    await NextJSHelpers.handleDocumentRequest(req, res);
    
    return NextResponse.json(responseData.data, { 
      status: responseData.status 
    });
    
  } catch (error) {
    return NextResponse.json(
      { error: '문서 생성 실패' }, 
      { status: 500 }
    );
  }
}
```

## 4. React 컴포넌트 변환

### 메인 페이지: app/page.js
```javascript
import ContractForm from '../components/ContractForm';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-center mb-8">
          🦠 방역 계약서 발송 시스템
        </h1>
        <ContractForm />
      </div>
    </div>
  );
}
```

### 계약서 폼 컴포넌트: components/ContractForm.js
```javascript
'use client';

import { useState } from 'react';
import { sendContract } from '../lib/eformsign';
import { formatPhoneNumber, validateForm } from '../lib/utils';

export default function ContractForm() {
  const [formData, setFormData] = useState({
    customerName: '',
    phoneNumber: '',
    contractDetails: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // 폼 검증
    const validation = validateForm(formData);
    if (!validation.isValid) {
      setResult({
        type: 'error',
        message: '입력 정보를 확인해주세요',
        errors: validation.errors
      });
      return;
    }

    setIsLoading(true);
    setResult(null);

    try {
      const response = await sendContract(validation.cleanData);
      
      if (response.success) {
        setResult({
          type: 'success',
          message: 'SMS가 발송되었습니다!',
          document: response.document
        });
        
        // 성공 시 폼 초기화
        setFormData({
          customerName: '',
          phoneNumber: '',
          contractDetails: ''
        });
      } else {
        setResult({
          type: 'error',
          message: response.error?.message || '발송에 실패했습니다'
        });
      }
    } catch (error) {
      setResult({
        type: 'error',
        message: '시스템 오류가 발생했습니다'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePhoneInput = (e) => {
    const formatted = formatPhoneNumber(e.target.value);
    setFormData(prev => ({ ...prev, phoneNumber: formatted }));
  };

  return (
    <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            고객명
          </label>
          <input
            type="text"
            value={formData.customerName}
            onChange={(e) => setFormData(prev => ({ ...prev, customerName: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="고객명을 입력하세요"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            휴대폰번호
          </label>
          <input
            type="tel"
            value={formData.phoneNumber}
            onChange={handlePhoneInput}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="010-0000-0000"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            계약내용
          </label>
          <textarea
            value={formData.contractDetails}
            onChange={(e) => setFormData(prev => ({ ...prev, contractDetails: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows="3"
            placeholder="계약 내용을 간단히 입력하세요"
            required
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
        >
          {isLoading ? '발송 중...' : '📄 계약서 발송하기'}
        </button>
      </form>

      {result && (
        <div className={`mt-4 p-3 rounded-md ${
          result.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          <strong>{result.type === 'success' ? '✅' : '❌'} {result.message}</strong>
          {result.errors && (
            <ul className="mt-1 text-sm">
              {result.errors.map((error, index) => (
                <li key={index}>• {error}</li>
              ))}
            </ul>
          )}
          {result.document && (
            <div className="mt-1 text-sm">
              <div>문서 ID: {result.document.documentId}</div>
              <div>수신자: {result.document.recipient?.name} ({result.document.recipient?.phone})</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
```

## 5. 유틸리티 라이브러리: lib/utils.js
```javascript
// src/utils/ui.js에서 React용으로 변환
export function formatPhoneNumber(phoneNumber) {
  const numbers = phoneNumber.replace(/[^\d]/g, '');
  
  if (numbers.length <= 3) {
    return numbers;
  } else if (numbers.length <= 7) {
    return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
  } else if (numbers.length <= 11) {
    return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7)}`;
  } else {
    return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7, 11)}`;
  }
}

export function validateForm(formData) {
  const errors = [];
  const { customerName, phoneNumber, contractDetails } = formData;
  
  // 고객명 검증
  if (!customerName || customerName.trim().length === 0) {
    errors.push('고객명을 입력해주세요');
  } else if (customerName.trim().length < 2) {
    errors.push('고객명은 2글자 이상 입력해주세요');
  }
  
  // 휴대폰 번호 검증
  if (!phoneNumber || phoneNumber.trim().length === 0) {
    errors.push('휴대폰번호를 입력해주세요');
  } else {
    const cleanPhone = phoneNumber.replace(/[^\d]/g, '');
    if (cleanPhone.length !== 11) {
      errors.push('휴대폰번호는 11자리를 입력해주세요');
    } else if (!cleanPhone.startsWith('010')) {
      errors.push('010으로 시작하는 휴대폰번호를 입력해주세요');
    }
  }
  
  // 계약 내용 검증
  if (!contractDetails || contractDetails.trim().length === 0) {
    errors.push('계약내용을 입력해주세요');
  } else if (contractDetails.trim().length < 5) {
    errors.push('계약내용은 5글자 이상 입력해주세요');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    cleanData: {
      customerName: customerName?.trim(),
      phoneNumber: phoneNumber?.replace(/[^\d]/g, ''),
      contractDetails: contractDetails?.trim()
    }
  };
}
```

## 6. API 클라이언트: lib/eformsign.js
```javascript
// 브라우저에서 Next.js API 라우트 호출
export async function sendContract({ customerName, phoneNumber, contractDetails }) {
  try {
    // 1단계: 토큰 발급
    const tokenResponse = await fetch('/api/auth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'eformsign_signature': `Bearer ${process.env.NEXT_PUBLIC_BEARER_TOKEN}`,
        'Authorization': `Bearer ${btoa(process.env.NEXT_PUBLIC_API_KEY)}`
      },
      body: JSON.stringify({
        execution_time: Date.now(),
        member_id: process.env.NEXT_PUBLIC_MEMBER_ID
      })
    });
    
    if (!tokenResponse.ok) {
      throw new Error('토큰 발급 실패');
    }
    
    const tokenData = await tokenResponse.json();
    
    // 2단계: 문서 생성
    const documentResponse = await fetch('/api/documents/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokenData.oauth_token.access_token}`
      },
      body: JSON.stringify({
        apiUrl: tokenData.api_key.company.api_url,
        templateId: process.env.NEXT_PUBLIC_TEMPLATE_ID,
        customerName,
        phoneNumber,
        contractDetails
      })
    });
    
    if (!documentResponse.ok) {
      throw new Error('문서 생성 실패');
    }
    
    const documentData = await documentResponse.json();
    
    return {
      success: true,
      document: {
        documentId: documentData.document.id,
        documentName: documentData.document.document_name,
        recipient: {
          name: customerName,
          phone: phoneNumber
        }
      }
    };
  } catch (error) {
    return {
      success: false,
      error: {
        message: error.message
      }
    };
  }
}
```

## 7. 마이그레이션 순서

1. **Next.js 프로젝트 초기화**
   ```bash
   npx create-next-app@latest pest-control-nextjs
   cd pest-control-nextjs
   ```

2. **기존 모듈 복사**
   ```bash
   cp -r ../eformsign_embe3/src ./
   ```

3. **환경 변수 설정**
   ```bash
   cp ../eformsign_embe3/src/examples/.env.example .env.local
   ```

4. **컴포넌트 및 페이지 작성**
   - 위의 예시 코드들을 참고하여 작성

5. **스타일링 적용**
   ```bash
   npm install tailwindcss
   npx tailwindcss init
   ```

6. **테스트 및 디버깅**
   ```bash
   npm run dev
   ```

## 8. 주요 차이점

| 현재 (HTML) | Next.js | 비고 |
|-------------|---------|------|
| 단일 HTML 파일 | 컴포넌트 분리 | 재사용성 향상 |
| Vanilla JS | React Hooks | 상태 관리 개선 |
| 프록시 서버 | API 라우트 | 통합된 백엔드 |
| 하드코딩 설정 | 환경 변수 | 보안 및 배포 편의성 |
| 클라이언트 사이드 | SSR/SSG 지원 | 성능 및 SEO 개선 |

이 가이드를 따라 단계적으로 마이그레이션하면 현재의 기능을 유지하면서 Next.js의 장점을 활용할 수 있습니다.