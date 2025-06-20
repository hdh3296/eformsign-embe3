/**
 * 프록시 서버 라우트 로직
 * Next.js API 라우트로 쉽게 변환할 수 있도록 분리
 */

const { config } = require('../config');
const { createErrorResponse, createSuccessResponse } = require('../utils/errors');

/**
 * CORS 헤더 설정
 * Next.js에서는 cors 미들웨어나 next.config.js로 처리
 */
function setCORSHeaders(res) {
  const corsConfig = config.server.cors;
  
  res.setHeader('Access-Control-Allow-Origin', corsConfig.origin);
  res.setHeader('Access-Control-Allow-Methods', corsConfig.methods.join(', '));
  res.setHeader('Access-Control-Allow-Headers', corsConfig.allowedHeaders.join(', '));
  res.setHeader('Access-Control-Max-Age', corsConfig.maxAge.toString());
}

/**
 * OPTIONS 요청 처리 (Preflight)
 * Next.js에서는 자동 처리되므로 필요 없음
 */
function handleOptionsRequest(req, res) {
  setCORSHeaders(res);
  res.writeHead(200);
  res.end();
  return true;
}

/**
 * 정적 파일 서빙 (개발용)
 * Next.js에서는 public 폴더로 대체
 */
function handleStaticFiles(req, res) {
  if (req.url === '/' || req.url === '/demo') {
    const fs = require('fs');
    const path = require('path');
    
    try {
      const htmlPath = path.join(__dirname, '../../pest-control-demo.html');
      const htmlContent = fs.readFileSync(htmlPath, 'utf8');
      
      setCORSHeaders(res);
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(htmlContent);
      return true;
    } catch (error) {
      setCORSHeaders(res);
      res.writeHead(404);
      res.end('HTML 파일을 찾을 수 없습니다.');
      return true;
    }
  }
  return false;
}

/**
 * API URL 매핑 및 정제
 * @param {string} requestUrl - 요청 URL
 * @param {string} requestBody - 요청 본문
 * @returns {Object} 매핑 결과
 */
function mapApiUrl(requestUrl, requestBody) {
  let targetUrl = '';
  let cleanBody = requestBody;
  
  if (requestUrl === '/api/access_token') {
    // 토큰 발급 엔드포인트
    targetUrl = `${config.eformsign.baseUrl}/${config.eformsign.version}/api_auth/access_token`;
  } 
  else if (requestUrl.startsWith('/api/documents')) {
    // 문서 생성 엔드포인트
    try {
      const requestData = JSON.parse(requestBody || '{}');
      let apiUrl = requestData.apiUrl || config.eformsign.baseUrl;
      
      // URL 정제 (https:// 중복 제거)
      if (apiUrl.startsWith('https://https://')) {
        apiUrl = apiUrl.replace('https://https://', 'https://');
      }
      
      const templateId = requestData.templateId || config.eformsign.templates.pestControl;
      targetUrl = `${apiUrl}/${config.eformsign.version}/api/documents?template_id=${templateId}`;
      
      // API URL과 templateId를 제거한 실제 document 데이터만 추출
      const { apiUrl: _, templateId: __, ...documentData } = requestData;
      cleanBody = JSON.stringify(documentData);
    } catch (error) {
      throw new Error('요청 데이터 파싱 실패');
    }
  } 
  else {
    throw new Error('알 수 없는 API 엔드포인트');
  }
  
  return { targetUrl, cleanBody };
}

/**
 * 프록시 헤더 필터링
 * eformsign API에 필요한 헤더만 선별
 */
function filterProxyHeaders(headers) {
  const allowedHeaders = config.server.cors.allowedHeaders;
  const proxyHeaders = {};
  
  allowedHeaders.forEach(headerName => {
    const value = headers[headerName.toLowerCase()];
    if (value !== undefined) {
      proxyHeaders[headerName] = value;
    }
  });
  
  return proxyHeaders;
}

/**
 * HTTP 프록시 요청 처리
 */
function createProxyRequest(targetUrl, options, requestBody) {
  return new Promise((resolve, reject) => {
    const http = require('http');
    const https = require('https');
    const url = require('url');
    
    const parsedUrl = url.parse(targetUrl);
    const isHttps = parsedUrl.protocol === 'https:';
    const httpModule = isHttps ? https : http;
    
    const proxyOptions = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || (isHttps ? 443 : 80),
      path: parsedUrl.path,
      method: options.method,
      headers: options.headers,
      timeout: config.server.proxy.timeout
    };

    console.log(`🌐 [PROXY] ${options.method} ${targetUrl}`);
    
    const proxyReq = httpModule.request(proxyOptions, (proxyRes) => {
      let data = '';
      
      proxyRes.on('data', (chunk) => {
        data += chunk;
      });
      
      proxyRes.on('end', () => {
        console.log(`📥 [RESPONSE] ${proxyRes.statusCode}`);
        
        resolve({
          statusCode: proxyRes.statusCode,
          headers: proxyRes.headers,
          body: data
        });
      });
    });
    
    proxyReq.on('timeout', () => {
      proxyReq.destroy();
      reject(new Error('요청 타임아웃'));
    });
    
    proxyReq.on('error', (error) => {
      console.error(`❌ [PROXY ERROR]`, error.message);
      reject(error);
    });
    
    if (requestBody) {
      proxyReq.write(requestBody);
    }
    
    proxyReq.end();
  });
}

/**
 * API 프록시 요청 핸들러
 * Next.js API 라우트로 변환 시 이 로직을 사용
 */
async function handleApiProxy(req, res) {
  if (!req.url.startsWith('/api/')) {
    return false;
  }
  
  let body = '';
  
  // 요청 본문 읽기
  req.on('data', (chunk) => {
    body += chunk.toString();
  });
  
  return new Promise((resolve) => {
    req.on('end', async () => {
      try {
        // URL 매핑 및 데이터 정제
        const { targetUrl, cleanBody } = mapApiUrl(req.url, body);
        
        // 헤더 필터링
        const proxyHeaders = filterProxyHeaders(req.headers);
        
        const options = {
          method: req.method,
          headers: proxyHeaders
        };
        
        // 프록시 요청 실행
        const response = await createProxyRequest(targetUrl, options, cleanBody);
        
        // 응답 반환
        setCORSHeaders(res);
        res.writeHead(response.statusCode, response.headers);
        res.end(response.body);
        
        resolve(true);
        
      } catch (error) {
        console.error(`❌ [API PROXY ERROR]`, error.message);
        
        const errorResponse = createErrorResponse(error);
        setCORSHeaders(res);
        res.writeHead(errorResponse.error.statusCode, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(errorResponse));
        
        resolve(true);
      }
    });
  });
}

/**
 * 404 에러 처리
 */
function handle404(req, res) {
  const errorResponse = createErrorResponse(new Error('페이지를 찾을 수 없습니다'), false);
  errorResponse.error.statusCode = 404;
  
  setCORSHeaders(res);
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(errorResponse));
}

/**
 * Next.js API 라우트용 헬퍼 함수들
 */
const NextJSHelpers = {
  /**
   * Next.js API 라우트용 토큰 발급 핸들러
   * /api/auth/token.js 에서 사용
   */
  async handleTokenRequest(req, res) {
    if (req.method !== 'POST') {
      return res.status(405).json(createErrorResponse(new Error('메서드가 허용되지 않습니다')));
    }
    
    try {
      const { targetUrl } = mapApiUrl('/api/access_token', JSON.stringify(req.body));
      const proxyHeaders = filterProxyHeaders({
        'content-type': 'application/json',
        'authorization': req.headers.authorization,
        'eformsign_signature': req.headers.eformsign_signature
      });
      
      const response = await createProxyRequest(targetUrl, {
        method: 'POST',
        headers: proxyHeaders
      }, JSON.stringify(req.body));
      
      res.status(response.statusCode).json(JSON.parse(response.body));
    } catch (error) {
      const errorResponse = createErrorResponse(error);
      res.status(errorResponse.error.statusCode).json(errorResponse);
    }
  },
  
  /**
   * Next.js API 라우트용 문서 생성 핸들러
   * /api/documents/create.js 에서 사용
   */
  async handleDocumentRequest(req, res) {
    if (req.method !== 'POST') {
      return res.status(405).json(createErrorResponse(new Error('메서드가 허용되지 않습니다')));
    }
    
    try {
      const { targetUrl, cleanBody } = mapApiUrl('/api/documents', JSON.stringify(req.body));
      const proxyHeaders = filterProxyHeaders({
        'content-type': 'application/json',
        'authorization': req.headers.authorization
      });
      
      const response = await createProxyRequest(targetUrl, {
        method: 'POST',
        headers: proxyHeaders
      }, cleanBody);
      
      res.status(response.statusCode).json(JSON.parse(response.body));
    } catch (error) {
      const errorResponse = createErrorResponse(error);
      res.status(errorResponse.error.statusCode).json(errorResponse);
    }
  }
};

// Node.js 환경에서 사용
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    setCORSHeaders,
    handleOptionsRequest,
    handleStaticFiles,
    mapApiUrl,
    filterProxyHeaders,
    createProxyRequest,
    handleApiProxy,
    handle404,
    NextJSHelpers
  };
}