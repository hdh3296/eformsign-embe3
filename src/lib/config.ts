/**
 * 애플리케이션 설정 관리
 * Next.js 환경변수 자동 지원
 */

export interface EformsignConfig {
  baseUrl: string;
  version: string;
  credentials: {
    apiKey: string;
    bearerToken: string;
    memberId: string;
    companyId: string;
  };
  templates: {
    pestControl: string;
  };
  document: {
    defaultPassword: string;
    defaultPasswordHint: string;
    validityDays: number;
    validityHours: number;
    defaultMemberType: string;
    defaultEmailId: string;
  };
}

export interface ServerConfig {
  port: number;
  host: string;
  cors: {
    origin: string;
    methods: string[];
    allowedHeaders: string[];
    maxAge: number;
  };
  proxy: {
    timeout: number;
  };
}

export interface AppConfig {
  name: string;
  version: string;
  environment: string;
}

const config = {
  // 앱 기본 설정
  app: {
    name: '디지털 계약서 발송 시스템',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  } as AppConfig,

  // eformsign API 설정
  eformsign: {
    // API 기본 설정
    baseUrl: process.env.EFORMSIGN_BASE_URL || 'https://api.eformsign.com',
    version: process.env.EFORMSIGN_API_VERSION || 'v2.0',
    
    // 인증 정보 (환경변수에서 우선 가져오기)
    credentials: {
      apiKey: process.env.EFORMSIGN_API_KEY || '',
      bearerToken: process.env.EFORMSIGN_BEARER_TOKEN || '',
      memberId: process.env.EFORMSIGN_MEMBER_ID || '',
      companyId: process.env.EFORMSIGN_COMPANY_ID || ''
    },
    
    // 템플릿 설정
    templates: {
      pestControl: process.env.EFORMSIGN_TEMPLATE_ID || ''
    },
    
    // 문서 기본 설정
    document: {
      defaultPassword: '1234',
      defaultPasswordHint: '기본 비밀번호: 1234',
      validityDays: 7,
      validityHours: 0,
      defaultMemberType: '일반',
      defaultEmailId: 'contract@pestcontrol.com'
    }
  } as EformsignConfig,

  // 서버 설정 (개발용)
  server: {
    port: parseInt(process.env.PORT || '3000'),
    host: process.env.HOST || 'localhost',
    cors: {
      origin: process.env.CORS_ORIGIN || '*',
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'eformsign_signature'],
      maxAge: 86400
    },
    proxy: {
      timeout: 30000
    }
  } as ServerConfig
};

export default config;