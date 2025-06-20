/**
 * 에러 처리 유틸리티
 * 표준화된 에러 응답과 로깅
 */

export class AppError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly details: any;
  public readonly timestamp: string;

  constructor(
    message: string, 
    code: string = 'UNKNOWN_ERROR', 
    statusCode: number = 500, 
    details: any = null
  ) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    this.timestamp = new Date().toISOString();
    
    // 스택 트레이스 정리
    Error.captureStackTrace(this, AppError);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details: any = null) {
    super(message, 'VALIDATION_ERROR', 400, details);
    this.name = 'ValidationError';
  }
}

export class EformsignAPIError extends AppError {
  constructor(message: string, statusCode: number = 500, details: any = null) {
    super(message, 'EFORMSIGN_API_ERROR', statusCode, details);
    this.name = 'EformsignAPIError';
  }
}

export interface ErrorResponse {
  success: false;
  error: {
    message: string;
    code: string;
    statusCode: number;
    details?: any;
    timestamp: string;
  };
  requestId?: string;
}

export interface SuccessResponse<T = any> {
  success: true;
  data: T;
  message?: string;
  timestamp: string;
}

/**
 * 에러 응답 생성
 */
export function createErrorResponse(
  error: Error | AppError, 
  includeStack: boolean = false
): ErrorResponse {
  const isAppError = error instanceof AppError;
  
  return {
    success: false,
    error: {
      message: error.message,
      code: isAppError ? error.code : 'UNKNOWN_ERROR',
      statusCode: isAppError ? error.statusCode : 500,
      details: isAppError ? error.details : (includeStack ? error.stack : null),
      timestamp: isAppError ? error.timestamp : new Date().toISOString()
    }
  };
}

/**
 * 성공 응답 생성
 */
export function createSuccessResponse<T>(
  data: T, 
  message?: string
): SuccessResponse<T> {
  return {
    success: true,
    data,
    message,
    timestamp: new Date().toISOString()
  };
}

/**
 * 에러 로깅
 */
export function logError(error: Error | AppError, context?: string) {
  const timestamp = new Date().toISOString();
  const contextStr = context ? ` [${context}]` : '';
  
  console.error(`❌ [${timestamp}]${contextStr} ${error.name}: ${error.message}`);
  
  if (error instanceof AppError) {
    console.error(`   Code: ${error.code}, Status: ${error.statusCode}`);
    if (error.details) {
      console.error(`   Details:`, error.details);
    }
  }
  
  if (process.env.NODE_ENV === 'development') {
    console.error(`   Stack:`, error.stack);
  }
}

/**
 * API 응답 검증
 */
export function validateApiResponse(response: any): boolean {
  if (!response || typeof response !== 'object') {
    throw new ValidationError('Invalid API response format');
  }
  
  return true;
}

/**
 * Next.js API 핸들러용 에러 처리
 */
export function handleApiError(error: Error | AppError) {
  logError(error, 'API');
  
  if (error instanceof AppError) {
    return {
      status: error.statusCode,
      body: createErrorResponse(error)
    };
  }
  
  return {
    status: 500,
    body: createErrorResponse(error)
  };
}