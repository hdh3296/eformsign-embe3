/**
 * eformsign API 클라이언트
 * Next.js API routes와 함께 사용
 */

import config from './config';
import { EformsignAPIError, createErrorResponse, createSuccessResponse } from './errors';

export interface TokenResponse {
  oauth_token: {
    access_token: string;
    expires_in: number;
    token_type: string;
  };
  api_key: {
    company: {
      api_url: string;
      company_id: string;
    };
  };
}

export interface DocumentRequest {
  customerName: string;
  phoneNumber: string;
  contractDetails: string;
}

export interface DocumentResponse {
  document: {
    id: string;
    document_name: string;
    status: string;
    recipients: Array<{
      id: string;
      name: string;
      phone?: string;
    }>;
  };
}

export interface ContractResult {
  success: boolean;
  document?: {
    documentId: string;
    documentName: string;
    recipient: {
      name: string;
      phone: string;
    };
  };
  error?: {
    message: string;
  };
}

/**
 * 브라우저에서 Next.js API routes를 통해 계약서 발송
 */
export async function sendContract(data: DocumentRequest): Promise<ContractResult> {
  try {
    // 1단계: 토큰 발급
    const tokenResponse = await fetch('/api/auth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        execution_time: Date.now()
      })
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json().catch(() => ({}));
      throw new Error(errorData.error?.message || `토큰 발급 실패: ${tokenResponse.status}`);
    }

    const tokenData: TokenResponse = await tokenResponse.json();

    // 2단계: 문서 생성 및 발송
    const documentResponse = await fetch('/api/documents/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokenData.oauth_token.access_token}`
      },
      body: JSON.stringify({
        apiUrl: tokenData.api_key.company.api_url,
        customerName: data.customerName,
        phoneNumber: data.phoneNumber,
        contractDetails: data.contractDetails
      })
    });

    if (!documentResponse.ok) {
      const errorData = await documentResponse.json().catch(() => ({}));
      throw new Error(errorData.error?.message || `문서 생성 실패: ${documentResponse.status}`);
    }

    const documentData: DocumentResponse = await documentResponse.json();

    return {
      success: true,
      document: {
        documentId: documentData.document.id,
        documentName: documentData.document.document_name,
        recipient: {
          name: data.customerName,
          phone: data.phoneNumber
        }
      }
    };

  } catch (error) {
    console.error('계약서 발송 에러:', error);
    
    return {
      success: false,
      error: {
        message: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다'
      }
    };
  }
}

/**
 * 이용현황 조회 API
 */
export async function getUsageStatus(): Promise<any> {
  try {
    // 먼저 액세스 토큰 발급
    const tokenData = await getAccessToken();
    const accessToken = tokenData.oauth_token.access_token;
    const apiUrl = tokenData.api_key.company.api_url;
    
    const response = await fetch(`${apiUrl}/v2.0/api/companies/${config.eformsign.credentials.companyId}/use_status`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      throw new EformsignAPIError(
        `이용현황 조회 실패: ${response.status}`,
        response.status,
        errorText
      );
    }
    
    const usageData = await response.json();
    return {
      success: true,
      data: usageData
    };
    
  } catch (error) {
    console.error('이용현황 조회 에러:', error);
    return {
      success: false,
      error: {
        message: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다'
      }
    };
  }
}

/**
 * 템플릿 목록 조회
 */
export async function getTemplateList(): Promise<any> {
  try {
    console.log('템플릿 목록 조회 API 호출 시작');
    
    const tokenData = await getAccessToken();
    const accessToken = tokenData.oauth_token.access_token;
    const apiUrl = tokenData.api_key.company.api_url;
    
    const response = await fetch(
      `${apiUrl}/v2.0/api/companies/${config.eformsign.credentials.companyId}/forms`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    if (!response.ok) {
      throw new Error(
        `템플릿 목록 조회 실패: ${response.status} ${response.statusText}`
      );
    }
    
    const templateData = await response.json();
    console.log('템플릿 목록 조회 성공:', templateData);
    
    return {
      success: true,
      data: templateData
    };
    
  } catch (error) {
    console.error('템플릿 목록 조회 에러:', error);
    return {
      success: false,
      error: {
        message: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다'
      }
    };
  }
}

/**
 * 특정 템플릿 정보 조회
 */
export async function getTemplateInfo(templateId: string): Promise<any> {
  try {
    console.log('템플릿 정보 조회 API 호출 시작:', templateId);
    
    const tokenData = await getAccessToken();
    const accessToken = tokenData.oauth_token.access_token;
    const apiUrl = tokenData.api_key.company.api_url;
    
    const response = await fetch(
      `${apiUrl}/v2.0/api/companies/${config.eformsign.credentials.companyId}/forms/${templateId}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    if (!response.ok) {
      throw new Error(
        `템플릿 정보 조회 실패: ${response.status} ${response.statusText}`
      );
    }
    
    const templateInfo = await response.json();
    console.log('템플릿 정보 조회 성공:', templateInfo);
    
    return {
      success: true,
      data: templateInfo
    };
    
  } catch (error) {
    console.error('템플릿 정보 조회 에러:', error);
    return {
      success: false,
      error: {
        message: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다'
      }
    };
  }
}

/**
 * 회사 정보 조회 API (플랜 정보 포함 가능성)
 */
export async function getCompanyInfo(): Promise<any> {
  try {
    // 먼저 액세스 토큰 발급
    const tokenData = await getAccessToken();
    const accessToken = tokenData.oauth_token.access_token;
    const apiUrl = tokenData.api_key.company.api_url;
    
    const response = await fetch(`${apiUrl}/v2.0/api/companies/${config.eformsign.credentials.companyId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      throw new EformsignAPIError(
        `회사 정보 조회 실패: ${response.status}`,
        response.status,
        errorText
      );
    }
    
    const companyData = await response.json();
    return {
      success: true,
      data: companyData
    };
    
  } catch (error) {
    console.error('회사 정보 조회 에러:', error);
    return {
      success: false,
      error: {
        message: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다'
      }
    };
  }
}

/**
 * 서버사이드에서 직접 eformsign API 호출 (토큰 발급)
 */
export async function getAccessToken(): Promise<TokenResponse> {
  const timestamp = Date.now();
  const base64ApiKey = Buffer.from(config.eformsign.credentials.apiKey).toString('base64');
  
  const response = await fetch(`${config.eformsign.baseUrl}/${config.eformsign.version}/api_auth/access_token`, {
    method: 'POST',
    headers: {
      'eformsign_signature': `Bearer ${config.eformsign.credentials.bearerToken}`,
      'Authorization': `Bearer ${base64ApiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      execution_time: timestamp,
      member_id: config.eformsign.credentials.memberId
    })
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => 'Unknown error');
    throw new EformsignAPIError(
      `토큰 발급 실패: ${response.status}`,
      response.status,
      { responseText: errorText }
    );
  }

  const data = await response.json();
  return data;
}

/**
 * 서버사이드에서 직접 eformsign API 호출 (문서 생성)
 */
export async function createAndSendDocument(
  accessToken: string,
  apiUrl: string,
  data: DocumentRequest
): Promise<DocumentResponse> {
  const documentData = {
    document: {
      document_name: `디지털 계약서 - ${data.customerName}`,
      comment: `${data.customerName}님의 온라인 계약서입니다. ${data.contractDetails}`,
      recipients: [
        {
          step_type: "05",
          use_mail: false,
          use_sms: true,
          member: {
            name: data.customerName,
            id: config.eformsign.document.defaultEmailId,
            sms: {
              country_code: "+82",
              phone_number: data.phoneNumber.replace(/[^\d]/g, '')
            }
          },
          auth: {
            password: config.eformsign.document.defaultPassword,
            password_hint: config.eformsign.document.defaultPasswordHint,
            valid: {
              day: config.eformsign.document.validityDays,
              hour: config.eformsign.document.validityHours
            }
          }
        }
      ],
      fields: [
        {
          id: "회원구분",
          value: config.eformsign.document.defaultMemberType
        }
      ],
      select_group_name: "",
      notification: []
    }
  };

  // URL 정제
  let cleanApiUrl = apiUrl;
  if (cleanApiUrl.startsWith('https://https://')) {
    cleanApiUrl = cleanApiUrl.replace('https://https://', 'https://');
  }

  const response = await fetch(
    `${cleanApiUrl}/${config.eformsign.version}/api/documents?template_id=${config.eformsign.templates.pestControl}`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(documentData)
    }
  );

  if (!response.ok) {
    const errorText = await response.text().catch(() => 'Unknown error');
    throw new EformsignAPIError(
      `문서 생성 실패: ${response.status}`,
      response.status,
      { responseText: errorText }
    );
  }

  const result = await response.json();
  return result;
}