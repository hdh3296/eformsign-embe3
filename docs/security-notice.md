# 보안 안내

## 중요 알림
이 프로젝트에는 민감한 API 키와 토큰 정보가 포함되어 있습니다.

## 보안 조치 완료
- ✅ `docs/info.md` 파일을 git 추적에서 제외
- ✅ `.gitignore`에 보안 파일 추가
- ✅ 환경변수 예시 파일 생성 (`.env.example`)

## 필요한 환경변수
다음 정보들을 `.env.local` 파일에 설정하세요:

```bash
# eformsign API 설정
EFORMSIGN_API_KEY=실제_API_키
EFORMSIGN_BEARER_TOKEN=실제_Bearer_토큰  
EFORMSIGN_MEMBER_ID=실제_이메일
EFORMSIGN_COMPANY_ID=실제_회사_ID
EFORMSIGN_TEMPLATE_ID=실제_템플릿_ID
```

## 보안 주의사항
1. **절대 공개하지 마세요**:
   - API 키
   - Bearer 토큰
   - Company ID
   - 템플릿 ID

2. **환경변수 사용**:
   - 모든 민감한 정보는 환경변수로 관리
   - `.env.local` 파일은 git에 포함되지 않음

3. **코드 공유 시**:
   - `.env.example` 파일만 공유
   - 실제 값은 개별적으로 전달

## 문제 발생 시
만약 민감한 정보가 실수로 공개되었다면:
1. 즉시 eformsign에서 API 키 재발급
2. Bearer 토큰 변경
3. Git 히스토리 정리 고려