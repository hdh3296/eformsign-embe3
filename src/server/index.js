/**
 * 통합 프록시 서버 (개발용)
 * 기존 proxy-server.js를 모듈화된 구조로 리팩토링
 */

const http = require('http');
const { config } = require('../config');
const { 
  setCORSHeaders, 
  handleOptionsRequest, 
  handleStaticFiles, 
  handleApiProxy, 
  handle404 
} = require('./routes');

/**
 * 서버 생성 및 요청 라우팅
 */
function createServer() {
  return http.createServer(async (req, res) => {
    const timestamp = new Date().toISOString();
    console.log(`\n🚀 [${timestamp}] ${req.method} ${req.url}`);
    
    try {
      // 1. OPTIONS 요청 처리 (CORS Preflight)
      if (req.method === 'OPTIONS') {
        handleOptionsRequest(req, res);
        return;
      }
      
      // 2. 정적 파일 서빙 (개발용)
      if (handleStaticFiles(req, res)) {
        return;
      }
      
      // 3. API 프록시 처리
      const handled = await handleApiProxy(req, res);
      if (handled) {
        return;
      }
      
      // 4. 404 처리
      handle404(req, res);
      
    } catch (error) {
      console.error(`❌ [서버 에러]`, error.message);
      
      if (!res.headersSent) {
        setCORSHeaders(res);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
          error: '서버 내부 오류가 발생했습니다',
          timestamp: new Date().toISOString()
        }));
      }
    }
  });
}

/**
 * 서버 시작
 */
function startServer() {
  const server = createServer();
  const PORT = config.server.port;
  const HOST = config.server.host;
  
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 [${config.app.name}] 서버 시작됨`);
    console.log(`🌐 주소: http://${HOST}:${PORT}`);
    console.log(`📱 데모: http://${HOST}:${PORT}/demo`);
    console.log(`🔧 API 프록시: http://${HOST}:${PORT}/api/*`);
    console.log(`\n💡 브라우저에서 http://${HOST}:${PORT}/demo 를 열어주세요!`);
    console.log(`=`.repeat(60));
    console.log(`\n서버가 실행 중입니다. Ctrl+C로 종료할 수 있습니다.`);
  });
  
  // 에러 핸들링
  server.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
      console.log(`❌ 포트 ${PORT}이 이미 사용 중입니다.`);
      console.log(`💡 다른 터미널에서 서버가 실행 중인지 확인하세요.`);
      console.log(`💡 또는 다른 포트를 사용하세요: PORT=3001 node src/server/index.js`);
    } else {
      console.error(`❌ 서버 에러:`, error.message);
    }
    process.exit(1);
  });
  
  // 종료 처리
  process.on('SIGINT', () => {
    console.log(`\n🛑 서버 종료 중...`);
    server.close(() => {
      console.log(`✅ 서버가 안전하게 종료되었습니다.`);
      process.exit(0);
    });
  });
  
  return server;
}

/**
 * Next.js API 라우트 예시 생성
 */
function generateNextJSExamples() {
  return {
    tokenRoute: `// pages/api/auth/token.js 또는 app/api/auth/token/route.js
import { NextJSHelpers } from '../../../src/server/routes';

export default async function handler(req, res) {
  return NextJSHelpers.handleTokenRequest(req, res);
}

// 또는 App Router 방식
export async function POST(request) {
  const req = {
    method: 'POST',
    body: await request.json(),
    headers: {
      authorization: request.headers.get('authorization'),
      eformsign_signature: request.headers.get('eformsign_signature')
    }
  };
  
  const res = {
    status: (code) => ({
      json: (data) => Response.json(data, { status: code })
    })
  };
  
  return NextJSHelpers.handleTokenRequest(req, res);
}`,
    
    documentRoute: `// pages/api/documents/create.js 또는 app/api/documents/create/route.js
import { NextJSHelpers } from '../../../src/server/routes';

export default async function handler(req, res) {
  return NextJSHelpers.handleDocumentRequest(req, res);
}

// 또는 App Router 방식
export async function POST(request) {
  const req = {
    method: 'POST',
    body: await request.json(),
    headers: {
      authorization: request.headers.get('authorization')
    }
  };
  
  const res = {
    status: (code) => ({
      json: (data) => Response.json(data, { status: code })
    })
  };
  
  return NextJSHelpers.handleDocumentRequest(req, res);
}`,
    
    nextConfig: `// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET, POST, PUT, DELETE, OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization, eformsign_signature' },
        ],
      },
    ];
  },
};

module.exports = nextConfig;`
  };
}

// 직접 실행 시 서버 시작
if (require.main === module) {
  startServer();
}

// Node.js 환경에서 사용
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    createServer,
    startServer,
    generateNextJSExamples
  };
}