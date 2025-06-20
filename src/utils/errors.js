/**
 * 표준화된 에러 처리 유틸리티
 * Next.js API 라우트에서 일관된 에러 응답을 위한 모듈
 */

/**
 * 애플리케이션 에러 클래스
 */
class AppError extends Error {
  constructor(message, code = 'UNKNOWN_ERROR', statusCode = 500, details = null) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    this.timestamp = new Date().toISOString();
    
    // 스택 트레이스에서 이 생성자 제외
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AppError);
    }
  }
  
  /**
   * JSON 직렬화를 위한 메서드
   */
  toJSON() {
    return {
      error: {
        message: this.message,
        code: this.code,
        statusCode: this.statusCode,
        details: this.details,
        timestamp: this.timestamp
      }
    };
  }
}

/**
 * 특정 에러 타입들
 */
class ValidationError extends AppError {
  constructor(message, details = null) {
    super(message, 'VALIDATION_ERROR', 400, details);
    this.name = 'ValidationError';
  }
}

class AuthenticationError extends AppError {
  constructor(message = '인증에 실패했습니다', details = null) {
    super(message, 'AUTHENTICATION_ERROR', 401, details);
    this.name = 'AuthenticationError';
  }
}

class EformsignAPIError extends AppError {
  constructor(message, originalError = null) {
    const details = originalError ? {
      originalMessage: originalError.message,
      statusCode: originalError.statusCode || originalError.status
    } : null;
    
    super(message, 'EFORMSIGN_API_ERROR', 502, details);
    this.name = 'EformsignAPIError';
  }
}

class NetworkError extends AppError {
  constructor(message = '네트워크 연결에 실패했습니다', details = null) {
    super(message, 'NETWORK_ERROR', 503, details);
    this.name = 'NetworkError';
  }
}

/**
 * 표준 에러 응답 생성
 * @param {Error} error - 발생한 에러
 * @param {boolean} includeStack - 스택 트레이스 포함 여부 (개발 환경에서만)
 * @returns {Object} 표준화된 에러 응답
 */
function createErrorResponse(error, includeStack = false) {
  let statusCode = 500;
  let code = 'INTERNAL_SERVER_ERROR';
  let message = '서버 내부 오류가 발생했습니다';
  let details = null;
  
  if (error instanceof AppError) {
    statusCode = error.statusCode;
    code = error.code;
    message = error.message;
    details = error.details;
  } else if (error.name === 'ValidationError') {
    statusCode = 400;
    code = 'VALIDATION_ERROR';
    message = error.message;
  } else if (error.message?.includes('fetch')) {
    statusCode = 503;
    code = 'NETWORK_ERROR';
    message = '외부 API 연결에 실패했습니다';
  }
  
  const response = {
    success: false,
    error: {
      message,
      code,
      statusCode,
      timestamp: new Date().toISOString()
    }
  };
  
  if (details) {
    response.error.details = details;
  }
  
  if (includeStack && error.stack) {
    response.error.stack = error.stack;
  }
  
  return response;
}

/**
 * 성공 응답 생성
 * @param {*} data - 응답 데이터
 * @param {string} message - 성공 메시지
 * @returns {Object} 표준화된 성공 응답
 */
function createSuccessResponse(data, message = '성공적으로 처리되었습니다') {
  return {
    success: true,
    message,
    data,
    timestamp: new Date().toISOString()
  };
}

/**
 * 에러 로깅
 * @param {Error} error - 로깅할 에러
 * @param {Object} context - 추가 컨텍스트 정보
 */
function logError(error, context = {}) {
  const logData = {
    timestamp: new Date().toISOString(),
    error: {
      name: error.name,
      message: error.message,
      code: error.code || 'UNKNOWN',
      statusCode: error.statusCode || 500
    },
    context
  };
  
  if (error.stack) {
    logData.error.stack = error.stack;
  }
  
  // 개발 환경에서는 콘솔에 출력
  if (process.env.NODE_ENV === 'development') {
    console.error('🚨 [ERROR]', JSON.stringify(logData, null, 2));
  } else {
    // 프로덕션에서는 구조화된 로깅
    console.error(JSON.stringify(logData));
  }
}

/**
 * 비동기 함수 래퍼 (에러 처리 자동화)
 * @param {Function} fn - 래핑할 비동기 함수
 * @returns {Function} 에러 처리가 포함된 함수
 */
function asyncWrapper(fn) {
  return async (...args) => {
    try {
      return await fn(...args);
    } catch (error) {
      logError(error, { function: fn.name, args });
      throw error;
    }
  };
}

/**
 * Express/Next.js 에러 핸들러 미들웨어
 * @param {Error} error - 발생한 에러
 * @param {Object} req - 요청 객체
 * @param {Object} res - 응답 객체
 * @param {Function} next - 다음 미들웨어
 */
function errorHandler(error, req, res, next) {
  logError(error, {
    method: req.method,
    url: req.url,
    userAgent: req.get('User-Agent'),
    ip: req.ip
  });
  
  const isDevelopment = process.env.NODE_ENV === 'development';
  const errorResponse = createErrorResponse(error, isDevelopment);
  
  res.status(errorResponse.error.statusCode).json(errorResponse);
}

// Node.js 환경에서 사용
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    AppError,
    ValidationError,
    AuthenticationError,
    EformsignAPIError,
    NetworkError,
    createErrorResponse,
    createSuccessResponse,
    logError,
    asyncWrapper,
    errorHandler
  };
}

// 브라우저 환경에서 사용
if (typeof window !== 'undefined') {
  window.ErrorUtils = {
    createErrorResponse,
    createSuccessResponse,
    logError: (error, context) => {
      console.error('🚨 [CLIENT ERROR]', error, context);
    }
  };
}