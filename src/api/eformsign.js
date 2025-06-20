/**
 * eformsign API 통신 모듈
 * Next.js API 라우트로 쉽게 이전할 수 있도록 순수 함수로 구성
 */

/**
 * Access Token 발급
 * @param {Object} credentials - 인증 정보
 * @param {string} credentials.apiKey - API 키
 * @param {string} credentials.bearerToken - Bearer 토큰
 * @param {string} credentials.memberId - 멤버 ID
 * @returns {Promise<Object>} 토큰 정보 및 API URL
 */
async function getAccessToken({ apiKey, bearerToken, memberId }) {
  const timestamp = Date.now();
  const base64ApiKey = Buffer.from(apiKey).toString('base64');
  
  const response = await fetch('https://api.eformsign.com/v2.0/api_auth/access_token', {
    method: 'POST',
    headers: {
      'eformsign_signature': `Bearer ${bearerToken}`,
      'Authorization': `Bearer ${base64ApiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      execution_time: timestamp,
      member_id: memberId
    })
  });

  if (!response.ok) {
    throw new Error(`토큰 발급 실패: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  
  return {
    accessToken: data.oauth_token.access_token,
    apiUrl: data.api_key.company.api_url,
    expiresIn: data.oauth_token.expires_in,
    raw: data
  };
}

/**
 * 문서 생성 및 SMS 발송
 * @param {Object} params - 문서 생성 파라미터
 * @param {string} params.accessToken - 액세스 토큰
 * @param {string} params.apiUrl - API URL
 * @param {string} params.templateId - 템플릿 ID
 * @param {string} params.customerName - 고객명
 * @param {string} params.phoneNumber - 휴대폰 번호
 * @param {string} params.contractDetails - 계약 내용
 * @returns {Promise<Object>} 문서 생성 결과
 */
async function createAndSendDocument({ 
  accessToken, 
  apiUrl, 
  templateId, 
  customerName, 
  phoneNumber, 
  contractDetails 
}) {
  // 휴대폰 번호 정제 (하이픈 제거)
  const cleanPhoneNumber = phoneNumber.replace(/-/g, '');
  
  // URL 정제 (https:// 중복 제거)
  let cleanApiUrl = apiUrl;
  if (cleanApiUrl.startsWith('https://https://')) {
    cleanApiUrl = cleanApiUrl.replace('https://https://', 'https://');
  }
  
  const documentData = {
    document: {
      document_name: `방역 계약서 - ${customerName}`,
      comment: `${customerName}님의 방역 서비스 계약서입니다. ${contractDetails}`,
      recipients: [
        {
          step_type: "05",
          use_mail: false,
          use_sms: true,
          member: {
            name: customerName,
            id: "contract@pestcontrol.com",
            sms: {
              country_code: "+82",
              phone_number: cleanPhoneNumber
            }
          },
          auth: {
            password: "1234",
            password_hint: "기본 비밀번호: 1234",
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

  const response = await fetch(`${cleanApiUrl}/v2.0/api/documents?template_id=${templateId}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(documentData)
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(`문서 발송 실패: ${errorData.ErrorMessage || response.status}`);
  }

  const data = await response.json();
  
  return {
    documentId: data.document.id,
    documentName: data.document.document_name,
    status: data.document.status,
    recipient: {
      name: customerName,
      phone: phoneNumber
    },
    raw: data
  };
}

/**
 * 완전한 계약서 발송 프로세스 (토큰 발급 + 문서 발송)
 * @param {Object} params - 발송 파라미터
 * @param {Object} params.credentials - 인증 정보
 * @param {string} params.templateId - 템플릿 ID
 * @param {string} params.customerName - 고객명
 * @param {string} params.phoneNumber - 휴대폰 번호
 * @param {string} params.contractDetails - 계약 내용
 * @returns {Promise<Object>} 발송 결과
 */
async function sendContract({ credentials, templateId, customerName, phoneNumber, contractDetails }) {
  try {
    // 1단계: Access Token 발급
    const tokenData = await getAccessToken(credentials);
    
    // 2단계: 문서 생성 및 발송
    const documentData = await createAndSendDocument({
      accessToken: tokenData.accessToken,
      apiUrl: tokenData.apiUrl,
      templateId,
      customerName,
      phoneNumber,
      contractDetails
    });
    
    return {
      success: true,
      token: {
        accessToken: tokenData.accessToken,
        expiresIn: tokenData.expiresIn
      },
      document: documentData
    };
  } catch (error) {
    return {
      success: false,
      error: {
        message: error.message,
        code: error.code || 'UNKNOWN_ERROR'
      }
    };
  }
}

// Node.js 환경에서 사용
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    getAccessToken,
    createAndSendDocument,
    sendContract
  };
}

// 브라우저 환경에서 사용
if (typeof window !== 'undefined') {
  window.EformsignAPI = {
    getAccessToken,
    createAndSendDocument,
    sendContract
  };
}