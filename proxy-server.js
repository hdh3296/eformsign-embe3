// CORS 프록시 서버 - eformsign API 브라우저 연동용
// 리팩토링된 버전은 src/server/index.js 를 사용하세요
const { startServer } = require('./src/server');

console.log('⚠️  레거시 proxy-server.js 실행됨');
console.log('💡 리팩토링된 버전: node src/server/index.js');
console.log('🔄 리팩토링된 서버로 전환합니다...\n');

// 리팩토링된 서버 시작
startServer();

// CORS 헤더 설정
function setCORSHeaders(res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, eformsign_signature');
    res.setHeader('Access-Control-Max-Age', '86400');
}

// HTTP 요청 프록시 함수
function proxyRequest(targetUrl, options, requestBody, res) {
    return new Promise((resolve, reject) => {
        const parsedUrl = url.parse(targetUrl);
        const isHttps = parsedUrl.protocol === 'https:';
        const httpModule = isHttps ? https : http;
        
        const proxyOptions = {
            hostname: parsedUrl.hostname,
            port: parsedUrl.port || (isHttps ? 443 : 80),
            path: parsedUrl.path,
            method: options.method,
            headers: options.headers
        };

        console.log(`🌐 [PROXY] ${options.method} ${targetUrl}`);
        console.log(`📤 [HEADERS]`, JSON.stringify(options.headers, null, 2));

        const proxyReq = httpModule.request(proxyOptions, (proxyRes) => {
            let data = '';
            
            proxyRes.on('data', (chunk) => {
                data += chunk;
            });
            
            proxyRes.on('end', () => {
                console.log(`📥 [RESPONSE] ${proxyRes.statusCode}`);
                
                // CORS 헤더 설정
                setCORSHeaders(res);
                res.writeHead(proxyRes.statusCode, proxyRes.headers);
                res.end(data);
                
                resolve(data);
            });
        });
        
        proxyReq.on('error', (error) => {
            console.error(`❌ [PROXY ERROR]`, error.message);
            if (!res.headersSent) {
                setCORSHeaders(res);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: error.message }));
            }
            reject(error);
        });
        
        if (requestBody) {
            proxyReq.write(requestBody);
        }
        
        proxyReq.end();
    });
}

// 서버 생성
const server = http.createServer(async (req, res) => {
    console.log(`\n🚀 [${new Date().toISOString()}] ${req.method} ${req.url}`);
    
    // OPTIONS 요청 (preflight) 처리
    if (req.method === 'OPTIONS') {
        setCORSHeaders(res);
        res.writeHead(200);
        res.end();
        return;
    }
    
    // 정적 파일 서빙 (HTML)
    if (req.url === '/' || req.url === '/demo') {
        const fs = require('fs');
        const path = require('path');
        
        try {
            const htmlPath = path.join(__dirname, 'pest-control-demo.html');
            const htmlContent = fs.readFileSync(htmlPath, 'utf8');
            
            setCORSHeaders(res);
            res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
            res.end(htmlContent);
        } catch (error) {
            setCORSHeaders(res);
            res.writeHead(404);
            res.end('HTML 파일을 찾을 수 없습니다.');
        }
        return;
    }
    
    // API 프록시 처리
    if (req.url.startsWith('/api/')) {
        let body = '';
        
        req.on('data', (chunk) => {
            body += chunk.toString();
        });
        
        req.on('end', async () => {
            try {
                // URL 매핑
                let targetUrl = '';
                
                if (req.url === '/api/access_token') {
                    targetUrl = 'https://api.eformsign.com/v2.0/api_auth/access_token';
                } else if (req.url.startsWith('/api/documents')) {
                    // 요청 body에서 API URL 추출
                    const requestData = JSON.parse(body || '{}');
                    let apiUrl = requestData.apiUrl || 'https://kr-api.eformsign.com';
                    
                    // https:// 중복 제거
                    if (apiUrl.startsWith('https://https://')) {
                        apiUrl = apiUrl.replace('https://https://', 'https://');
                    }
                    
                    const templateId = requestData.templateId;
                    targetUrl = `${apiUrl}/v2.0/api/documents?template_id=${templateId}`;
                    
                    // API URL과 templateId를 제거한 실제 document 데이터만 전송
                    const { apiUrl: _, templateId: __, ...documentData } = requestData;
                    body = JSON.stringify(documentData);
                } else {
                    setCORSHeaders(res);
                    res.writeHead(404);
                    res.end('API 엔드포인트를 찾을 수 없습니다.');
                    return;
                }
                
                // eformsign API에 필요한 헤더만 선별적으로 전송
                const proxyHeaders = {
                    'Content-Type': req.headers['content-type'],
                    'Authorization': req.headers['authorization'],
                    'eformsign_signature': req.headers['eformsign_signature']
                };
                
                // undefined 값 제거
                Object.keys(proxyHeaders).forEach(key => {
                    if (proxyHeaders[key] === undefined) {
                        delete proxyHeaders[key];
                    }
                });
                
                const options = {
                    method: req.method,
                    headers: proxyHeaders
                };
                
                await proxyRequest(targetUrl, options, body, res);
                
            } catch (error) {
                console.error(`❌ [SERVER ERROR]`, error.message);
                setCORSHeaders(res);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: error.message }));
            }
        });
    } else {
        // 알 수 없는 경로
        setCORSHeaders(res);
        res.writeHead(404);
        res.end('페이지를 찾을 수 없습니다.');
    }
});

// 서버 시작
server.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 [PROXY SERVER] 시작됨`);
    console.log(`🌐 주소: http://localhost:${PORT}`);
    console.log(`📱 데모: http://localhost:${PORT}/demo`);
    console.log(`🔧 API 프록시: http://localhost:${PORT}/api/*`);
    console.log(`\n💡 브라우저에서 http://localhost:${PORT}/demo 를 열어주세요!`);
    console.log(`=`.repeat(50));
    console.log(`\n서버가 실행 중입니다. Ctrl+C로 종료할 수 있습니다.`);
});

// 에러 핸들링
server.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
        console.log(`❌ 포트 ${PORT}이 이미 사용 중입니다.`);
        console.log(`💡 다른 터미널에서 서버가 실행 중인지 확인하세요.`);
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