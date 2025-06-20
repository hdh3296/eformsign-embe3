# AI-Friendly 코딩 가이드
## "AI가 디버깅하기 쉬운 코드 작성법"

---

## 🎯 핵심 원칙

### **"AI가 로그만 보고도 모든 것을 파악할 수 있게 하라"**

```javascript
❌ 나쁜 예:
console.log("API 호출");
// AI가 성공했는지 실패했는지 모름

✅ 좋은 예:  
console.log("🌐 [STEP 1/4] API 호출 시작...");
console.log("✅ [STEP 1/4] API 호출 성공 - 응답시간: 1.2초");
// AI가 정확히 파악 가능
```

---

## 📋 로깅 규칙

### 1️⃣ **단계별 명확한 표시**
```javascript
// 각 단계를 명확히 구분
console.log("🚀 [시작] 전체 프로세스 시작");
console.log("🔑 [1/4] Access Token 발급 중...");
console.log("📱 [2/4] 문서 생성 중...");  
console.log("📤 [3/4] SMS 발송 중...");
console.log("✅ [4/4] 모든 작업 완료");
```

### 2️⃣ **성공/실패 아이콘 통일**
```javascript
// 성공 패턴
console.log("✅ 성공: API 토큰 발급 완료");
console.log("✅ 성공: 문서 ID 12345 생성됨");

// 실패 패턴  
console.log("❌ 실패: 네트워크 연결 오류");
console.log("❌ 실패: 인증 토큰 만료");

// 경고 패턴
console.log("⚠️ 경고: 재시도 필요 (1/3)");
console.log("⚠️ 경고: 응답 시간 지연 (3.5초)");
```

### 3️⃣ **상세 정보 포함**
```javascript
// 중요 데이터는 항상 로그에 기록
console.log(`✅ Access Token 발급 성공:`);
console.log(`   - 토큰: ${token.substring(0, 20)}...`);
console.log(`   - 만료시간: ${expires_in}초`);
console.log(`   - API URL: ${api_url}`);

// 에러 시 더 자세한 정보
console.log(`❌ API 호출 실패:`);
console.log(`   - 상태코드: ${response.status}`);
console.log(`   - 에러메시지: ${error.message}`);
console.log(`   - 요청 URL: ${request_url}`);
console.log(`   - 시도 횟수: ${retry_count}/3`);
```

---

## 🔧 실제 구현 예시

### **Before (AI가 디버깅하기 어려운 코드)**
```javascript
async function sendContract() {
    try {
        const token = await getToken();
        const doc = await createDoc(token);
        await sendSMS(doc);
        console.log("완료");
    } catch (error) {
        console.log("에러:", error);
    }
}
```

### **After (AI가 디버깅하기 쉬운 코드)**
```javascript
async function sendContract() {
    console.log("🚀 [START] 계약서 발송 프로세스 시작");
    console.log("=" .repeat(50));
    
    try {
        // 1단계: 토큰 발급
        console.log("🔑 [1/3] Access Token 발급 시작...");
        const startTime = Date.now();
        const token = await getToken();
        const tokenTime = Date.now() - startTime;
        console.log(`✅ [1/3] Access Token 발급 성공 (${tokenTime}ms)`);
        console.log(`   토큰: ${token.substring(0, 20)}...`);
        
        // 2단계: 문서 생성  
        console.log("📄 [2/3] 문서 생성 시작...");
        const docStartTime = Date.now();
        const doc = await createDoc(token);
        const docTime = Date.now() - docStartTime;
        console.log(`✅ [2/3] 문서 생성 성공 (${docTime}ms)`);
        console.log(`   문서 ID: ${doc.id}`);
        console.log(`   수신자: ${doc.recipient}`);
        
        // 3단계: SMS 발송
        console.log("📱 [3/3] SMS 발송 시작...");
        const smsStartTime = Date.now();
        const result = await sendSMS(doc);
        const smsTime = Date.now() - smsStartTime;
        console.log(`✅ [3/3] SMS 발송 성공 (${smsTime}ms)`);
        console.log(`   발송 대상: ${result.phoneNumber}`);
        
        // 최종 결과
        const totalTime = Date.now() - startTime;
        console.log("=" .repeat(50));
        console.log("🎉 [SUCCESS] 모든 작업 완료!");
        console.log(`📊 총 소요시간: ${totalTime}ms`);
        console.log(`📋 처리 단계: 3/3 완료`);
        
    } catch (error) {
        console.log("=" .repeat(50));
        console.log("❌ [ERROR] 프로세스 실패!");
        console.log(`💥 에러 위치: ${error.step || '알 수 없음'}`);
        console.log(`📝 에러 메시지: ${error.message}`);
        console.log(`🔍 에러 타입: ${error.constructor.name}`);
        console.log(`⏰ 실패 시점: ${new Date().toISOString()}`);
        
        // AI가 자동으로 해결책을 찾을 수 있도록
        console.log("🔧 [DEBUG INFO]:");
        console.log(`   - 환경: ${process.env.NODE_ENV || 'development'}`);
        console.log(`   - Node 버전: ${process.version}`);
        console.log(`   - 메모리 사용량: ${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`);
        
        throw error;
    }
}
```

---

## 🎨 진행 상황 시각화

### **프로그레스 바 표시**
```javascript
function showProgress(current, total, task) {
    const percentage = Math.round((current / total) * 100);
    const bar = "█".repeat(Math.round(percentage / 5)) + "░".repeat(20 - Math.round(percentage / 5));
    console.log(`📊 [${bar}] ${percentage}% - ${task}`);
}

// 사용 예시
showProgress(1, 4, "토큰 발급 중");
// 📊 [█████░░░░░░░░░░░░░░░] 25% - 토큰 발급 중
```

### **상태 테이블 표시**
```javascript
function printStatus(steps) {
    console.log("\n📋 작업 상태:");
    console.log("┌────────────────────────┬──────────┬──────────┐");
    console.log("│ 작업                   │ 상태     │ 소요시간 │");
    console.log("├────────────────────────┼──────────┼──────────┤");
    
    steps.forEach(step => {
        const status = step.completed ? "✅ 완료" : step.running ? "🔄 진행중" : "⏳ 대기";
        const time = step.time ? `${step.time}ms` : "-";
        console.log(`│ ${step.name.padEnd(22)} │ ${status.padEnd(8)} │ ${time.padEnd(8)} │`);
    });
    
    console.log("└────────────────────────┴──────────┴──────────┘\n");
}
```

---

## 🔍 디버깅 정보 자동 수집

### **환경 정보 자동 로깅**
```javascript
function logEnvironment() {
    console.log("🔧 [SYSTEM INFO]:");
    console.log(`   OS: ${process.platform} ${process.arch}`);
    console.log(`   Node: ${process.version}`);
    console.log(`   메모리: ${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`);
    console.log(`   실행 경로: ${process.cwd()}`);
    console.log(`   시작 시간: ${new Date().toISOString()}`);
}
```

### **네트워크 상태 체크**
```javascript
async function checkNetworkStatus() {
    console.log("🌐 [NETWORK CHECK] 네트워크 상태 확인...");
    
    try {
        const startTime = Date.now();
        await fetch('https://api.eformsign.com/health');
        const responseTime = Date.now() - startTime;
        console.log(`✅ [NETWORK] eformsign API 접근 가능 (${responseTime}ms)`);
    } catch (error) {
        console.log(`❌ [NETWORK] eformsign API 접근 불가: ${error.message}`);
    }
}
```

---

## 🚨 자동 복구 로직

### **재시도 메커니즘**
```javascript
async function retryWithLogging(fn, maxRetries = 3) {
    for (let i = 1; i <= maxRetries; i++) {
        try {
            console.log(`🔄 [RETRY ${i}/${maxRetries}] 재시도 중...`);
            const result = await fn();
            console.log(`✅ [RETRY ${i}/${maxRetries}] 성공!`);
            return result;
        } catch (error) {
            console.log(`❌ [RETRY ${i}/${maxRetries}] 실패: ${error.message}`);
            
            if (i === maxRetries) {
                console.log(`💥 [RETRY] 모든 재시도 실패. 최종 에러: ${error.message}`);
                throw error;
            }
            
            const waitTime = i * 1000; // 1초, 2초, 3초씩 대기
            console.log(`⏳ [RETRY] ${waitTime}ms 대기 후 재시도...`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
        }
    }
}
```

---

## 📊 성능 모니터링

### **실행 시간 측정**
```javascript
class PerformanceMonitor {
    constructor() {
        this.startTime = Date.now();
        this.checkpoints = [];
    }
    
    checkpoint(name) {
        const now = Date.now();
        const elapsed = now - this.startTime;
        this.checkpoints.push({ name, time: elapsed });
        console.log(`⏱️ [PERF] ${name}: ${elapsed}ms (누적)`);
    }
    
    summary() {
        console.log("\n📊 [PERFORMANCE SUMMARY]:");
        this.checkpoints.forEach((cp, index) => {
            const stepTime = index === 0 ? cp.time : cp.time - this.checkpoints[index-1].time;
            console.log(`   ${cp.name}: ${stepTime}ms`);
        });
        console.log(`   총 소요시간: ${Date.now() - this.startTime}ms\n`);
    }
}
```

---

## 🎯 AI에게 친화적인 에러 메시지

### **구조화된 에러 정보**
```javascript
class AIFriendlyError extends Error {
    constructor(message, context = {}) {
        super(message);
        this.name = 'AIFriendlyError';
        this.context = context;
        this.timestamp = new Date().toISOString();
        this.suggestions = [];
    }
    
    addSuggestion(suggestion) {
        this.suggestions.push(suggestion);
        return this;
    }
    
    log() {
        console.log("❌ [AI-ERROR] 구조화된 에러 정보:");
        console.log(`   메시지: ${this.message}`);
        console.log(`   시점: ${this.timestamp}`);
        console.log(`   컨텍스트:`, JSON.stringify(this.context, null, 2));
        
        if (this.suggestions.length > 0) {
            console.log("💡 [AI-SUGGESTIONS] 해결 방안:");
            this.suggestions.forEach((suggestion, index) => {
                console.log(`   ${index + 1}. ${suggestion}`);
            });
        }
    }
}

// 사용 예시
const error = new AIFriendlyError("API 토큰 발급 실패", {
    apiKey: apiKey.substring(0, 10) + "...",
    endpoint: "https://api.eformsign.com/v2.0/api_auth/access_token",
    statusCode: 401
})
.addSuggestion("API 키가 올바른지 확인")
.addSuggestion("Bearer 토큰 값 점검")
.addSuggestion("네트워크 연결 상태 확인");

error.log();
```

---

## 🎁 완성된 템플릿

이 모든 원칙을 적용한 **AI-Friendly 코딩 템플릿**을 만들어드릴까요?

```javascript
// AI가 디버깅하기 쉬운 완벽한 코드 템플릿
```

이제 AI가 **로그만 보고도 즉시 문제를 파악하고 해결**할 수 있습니다! 🚀