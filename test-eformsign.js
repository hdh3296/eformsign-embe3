// eformsign API 자동 테스트 스크립트
const https = require('https');

class EformsignTester {
    constructor() {
        this.config = {
            apiKey: process.env.EFORMSIGN_API_KEY || 'd00ff6bb-6a84-4ed4-8b99-841f51743443',
            bearerToken: process.env.EFORMSIGN_BEARER_TOKEN || 'myapitest2024',
            memberId: process.env.EFORMSIGN_MEMBER_ID || 'hdh3296@gmail.com',
            templateId: process.env.EFORMSIGN_TEMPLATE_ID || '023bd3b657cb4565b6f72e6fed2cbd8e'
        };
        this.accessToken = '';
        this.apiUrl = '';
    }

    // HTTP 요청 헬퍼 함수
    makeRequest(url, options, data = null) {
        return new Promise((resolve, reject) => {
            const req = https.request(url, options, (res) => {
                let body = '';
                res.on('data', (chunk) => body += chunk);
                res.on('end', () => {
                    try {
                        const result = JSON.parse(body);
                        if (res.statusCode >= 200 && res.statusCode < 300) {
                            resolve(result);
                        } else {
                            reject(new Error(`HTTP ${res.statusCode}: ${result.ErrorMessage || body}`));
                        }
                    } catch (error) {
                        reject(new Error(`JSON 파싱 에러: ${body}`));
                    }
                });
            });

            req.on('error', reject);
            
            if (data) {
                req.write(JSON.stringify(data));
            }
            req.end();
        });
    }

    // 1단계: Access Token 발급 테스트
    async testAccessToken() {
        console.log('🔑 1단계: Access Token 발급 테스트...');
        
        try {
            const timestamp = Date.now();
            const base64ApiKey = Buffer.from(this.config.apiKey).toString('base64');
            
            const options = {
                method: 'POST',
                headers: {
                    'eformsign_signature': `Bearer ${this.config.bearerToken}`,
                    'Authorization': `Bearer ${base64ApiKey}`,
                    'Content-Type': 'application/json'
                }
            };

            const data = {
                execution_time: timestamp,
                member_id: this.config.memberId
            };

            const result = await this.makeRequest(
                'https://api.eformsign.com/v2.0/api_auth/access_token',
                options,
                data
            );

            this.accessToken = result.oauth_token.access_token;
            this.apiUrl = result.api_key.company.api_url;

            console.log('✅ Access Token 발급 성공!');
            console.log(`   API URL: ${this.apiUrl}`);
            console.log(`   Token: ${this.accessToken.substring(0, 50)}...`);
            
            return true;
        } catch (error) {
            console.error('❌ Access Token 발급 실패:', error.message);
            return false;
        }
    }

    // 2단계: 문서 생성 및 SMS 발송 테스트
    async testDocumentCreation(customerName = '테스트고객', phoneNumber = '01032633296') {
        console.log('\n📱 2단계: 문서 생성 및 SMS 발송 테스트...');
        
        if (!this.accessToken) {
            console.error('❌ Access Token이 없습니다. 1단계를 먼저 실행하세요.');
            return false;
        }

        try {
            const options = {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.accessToken}`,
                    'Content-Type': 'application/json'
                }
            };

            const documentData = {
                document: {
                    document_name: `자동테스트 계약서 - ${customerName}`,
                    comment: `${customerName}님의 자동 생성된 테스트 계약서입니다.`,
                    recipients: [
                        {
                            step_type: "05",
                            use_mail: false,
                            use_sms: true,
                            member: {
                                name: customerName,
                                id: "test@pestcontrol.com",
                                sms: {
                                    country_code: "+82",
                                    phone_number: phoneNumber.replace(/-/g, '')
                                }
                            },
                            auth: {
                                password: "1234",
                                password_hint: "테스트 비밀번호: 1234",
                                valid: {
                                    day: 7,
                                    hour: 0
                                }
                            }
                        }
                    ],
                    fields: [
                        {
                            id: "회원구분",
                            value: "일반"
                        }
                    ],
                    select_group_name: "",
                    notification: []
                }
            };

            // API URL에서 https:// 제거 (이미 포함되어 있음)
            const cleanApiUrl = this.apiUrl.replace('https://', '');
            
            const result = await this.makeRequest(
                `https://${cleanApiUrl}/v2.0/api/documents?template_id=${this.config.templateId}`,
                options,
                documentData
            );

            console.log('✅ 문서 생성 및 SMS 발송 성공!');
            console.log(`   문서 ID: ${result.document.id}`);
            console.log(`   문서명: ${result.document.document_name}`);
            console.log(`   수신자: ${customerName} (${phoneNumber})`);
            
            return { success: true, documentId: result.document.id };
        } catch (error) {
            console.error('❌ 문서 발송 실패:', error.message);
            return { success: false, error: error.message };
        }
    }

    // 전체 테스트 실행
    async runFullTest() {
        console.log('🚀 [START] eformsign API 자동 테스트 시작');
        console.log('=' .repeat(60));
        
        // 환경 정보 로깅
        console.log('🔧 [SYSTEM] 환경 정보:');
        console.log(`   Node.js: ${process.version}`);
        console.log(`   Platform: ${process.platform}`);
        console.log(`   Memory: ${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`);
        console.log(`   Start Time: ${new Date().toISOString()}`);
        console.log('');
        
        const startTime = Date.now();
        
        // 1단계: Access Token 발급
        const tokenSuccess = await this.testAccessToken();
        if (!tokenSuccess) {
            console.log('\n❌ 테스트 중단: Token 발급 실패');
            return;
        }

        // 2단계: 문서 발송
        const documentResult = await this.testDocumentCreation();
        
        const endTime = Date.now();
        const duration = (endTime - startTime) / 1000;

        console.log('\n' + '=' .repeat(50));
        console.log('📊 테스트 결과 요약:');
        console.log(`   실행 시간: ${duration}초`);
        console.log(`   Access Token: ${tokenSuccess ? '✅ 성공' : '❌ 실패'}`);
        console.log(`   문서 발송: ${documentResult.success ? '✅ 성공' : '❌ 실패'}`);
        
        if (documentResult.success) {
            console.log('\n🎉 모든 테스트 성공! SMS가 발송되었습니다.');
            console.log(`📱 ${this.config.templateId} 템플릿으로 계약서가 전송되었습니다.`);
        } else {
            console.log('\n❌ 테스트 실패');
            console.log(`   에러: ${documentResult.error}`);
        }
    }

    // 다중 테스트 (여러 번 실행)
    async runMultipleTests(count = 3) {
        console.log(`🔄 ${count}회 연속 테스트 시작\n`);
        
        const results = [];
        
        for (let i = 1; i <= count; i++) {
            console.log(`\n📋 ${i}번째 테스트`);
            console.log('-' .repeat(30));
            
            // Access Token은 한 번만 발급
            if (i === 1) {
                const tokenSuccess = await this.testAccessToken();
                if (!tokenSuccess) {
                    console.log('❌ 첫 번째 테스트에서 실패. 중단합니다.');
                    return;
                }
            }
            
            // 각기 다른 고객명으로 테스트
            const customerName = `테스트고객${i}`;
            const result = await this.testDocumentCreation(customerName);
            
            results.push({
                test: i,
                success: result.success,
                documentId: result.documentId || null,
                error: result.error || null
            });
            
            // 다음 테스트 전 잠시 대기 (API 부하 방지)
            if (i < count) {
                console.log('   ⏳ 5초 대기...');
                await new Promise(resolve => setTimeout(resolve, 5000));
            }
        }
        
        // 결과 요약
        console.log('\n' + '=' .repeat(50));
        console.log('📊 다중 테스트 결과:');
        
        const successCount = results.filter(r => r.success).length;
        console.log(`   성공: ${successCount}/${count}`);
        console.log(`   실패: ${count - successCount}/${count}`);
        
        results.forEach(result => {
            const status = result.success ? '✅' : '❌';
            console.log(`   테스트 ${result.test}: ${status} ${result.documentId || result.error}`);
        });
    }
}

// 실행 부분
if (require.main === module) {
    const tester = new EformsignTester();
    
    // 명령행 인자 처리
    const args = process.argv.slice(2);
    const command = args[0] || 'single';
    
    if (command === 'multiple') {
        const count = parseInt(args[1]) || 3;
        tester.runMultipleTests(count);
    } else {
        tester.runFullTest();
    }
}

module.exports = EformsignTester;