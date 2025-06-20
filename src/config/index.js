/**
 * 애플리케이션 설정 관리
 * Next.js 환경변수로 쉽게 전환할 수 있도록 구성
 */

// 환경변수 로드
try {
  require('dotenv').config({ path: '.env.local' });
  console.log('✅ dotenv loaded from .env.local');
} catch (error) {
  console.log('❌ dotenv load failed:', error.message);
}

// 환경변수 디버깅
console.log('🔍 Environment Variables:');
console.log('EFORMSIGN_API_KEY:', process.env.EFORMSIGN_API_KEY ? '***loaded***' : 'NOT FOUND');
console.log('EFORMSIGN_BEARER_TOKEN:', process.env.EFORMSIGN_BEARER_TOKEN ? '***loaded***' : 'NOT FOUND');
console.log('EFORMSIGN_MEMBER_ID:', process.env.EFORMSIGN_MEMBER_ID ? '***loaded***' : 'NOT FOUND');

const config = {
  // eformsign API 설정
  eformsign: {
    // API 기본 설정
    baseUrl: process.env.EFORMSIGN_BASE_URL || 'https://api.eformsign.com',
    version: process.env.EFORMSIGN_API_VERSION || 'v2.0',
    
    // 인증 정보 (환경변수에서 우선 가져오기)
    credentials: {
      apiKey: process.env.EFORMSIGN_API_KEY || 'your_api_key_here',
      bearerToken: process.env.EFORMSIGN_BEARER_TOKEN || 'your_bearer_token_here',
      memberId: process.env.EFORMSIGN_MEMBER_ID || 'your_email@example.com',
      companyId: process.env.EFORMSIGN_COMPANY_ID || 'your_company_id_here'
    },
    
    // 템플릿 설정
    templates: {
      pestControl: process.env.EFORMSIGN_TEMPLATE_ID || 'your_template_id_here'
    },
    
    // 문서 기본 설정
    document: {
      defaultPassword: '1234',
      defaultPasswordHint: '기본 비밀번호: 1234',
      validityDays: 7,
      validityHours: 0,
      defaultMemberType: '일반',
      defaultEmailId: 'contract@pestcontrol.com'
    },
    
    // SMS 설정
    sms: {
      countryCode: '+82',
      useEmail: false,
      useSms: true
    }
  },
  
  // 서버 설정
  server: {
    port: process.env.PORT || 3000,
    host: process.env.HOST || 'localhost',
    
    // CORS 설정
    cors: {
      origin: process.env.CORS_ORIGIN || '*',
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'eformsign_signature'],
      maxAge: 86400
    },
    
    // 프록시 설정
    proxy: {
      timeout: 30000,
      maxRetries: 3
    }
  },
  
  // 애플리케이션 설정
  app: {
    name: '방역 계약서 발송 시스템',
    version: '1.0.0',
    description: '고객 정보를 입력하여 휴대폰으로 계약서를 발송합니다',
    
    // UI 설정
    ui: {
      title: '🦠 방역 계약서 발송',
      submitButtonText: '📄 계약서 발송하기',
      loadingText: '발송 중...',
      successMessage: 'SMS가 발송되었습니다!',
      errorMessage: '발송 실패'
    },
    
    // 로깅 설정
    logging: {
      level: process.env.LOG_LEVEL || 'info',
      format: 'json',
      enableConsole: true,
      enableFile: false
    }
  },
  
  // 개발 환경 설정
  development: {
    enableDebugLogs: process.env.NODE_ENV === 'development',
    mockApi: process.env.MOCK_API === 'true',
    skipValidation: process.env.SKIP_VALIDATION === 'true'
  }
};

/**
 * 설정값 검증
 */
function validateConfig() {
  const required = [
    'eformsign.credentials.apiKey',
    'eformsign.credentials.bearerToken',
    'eformsign.credentials.memberId',
    'eformsign.templates.pestControl'
  ];
  
  const missing = [];
  
  required.forEach(path => {
    const keys = path.split('.');
    let current = config;
    
    for (const key of keys) {
      if (!current[key]) {
        missing.push(path);
        break;
      }
      current = current[key];
    }
  });
  
  if (missing.length > 0) {
    throw new Error(`필수 설정값이 누락되었습니다: ${missing.join(', ')}`);
  }
}

/**
 * Next.js 환경변수 예시 생성
 */
function generateEnvExample() {
  return `# eformsign API 설정
EFORMSIGN_API_KEY=your_api_key_here
EFORMSIGN_BEARER_TOKEN=your_bearer_token_here
EFORMSIGN_MEMBER_ID=your_email@example.com
EFORMSIGN_COMPANY_ID=your_company_id_here
EFORMSIGN_TEMPLATE_ID=your_template_id_here

# 서버 설정
PORT=3000
HOST=localhost
CORS_ORIGIN=*

# 개발 설정
NODE_ENV=development
LOG_LEVEL=info
MOCK_API=false
SKIP_VALIDATION=false`;
}

// Node.js 환경에서 사용
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    config,
    validateConfig,
    generateEnvExample
  };
}

// 브라우저 환경에서 사용 (민감한 정보 제외)
if (typeof window !== 'undefined') {
  window.AppConfig = {
    app: config.app,
    development: config.development,
    // 보안상 서버/API 설정은 노출하지 않음
  };
}