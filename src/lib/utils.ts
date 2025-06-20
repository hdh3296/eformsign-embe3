/**
 * UI 및 폼 유틸리티 함수들
 * React에서 사용할 수 있도록 TypeScript로 변환
 */

import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export interface FormData {
  customerName: string;
  phoneNumber: string;
  contractDetails: string;
}

export interface FormValidationResult {
  isValid: boolean;
  errors: string[];
  cleanData: {
    customerName: string;
    phoneNumber: string;
    contractDetails: string;
  };
}

/**
 * 휴대폰 번호 자동 포맷팅
 */
export function formatPhoneNumber(phoneNumber: string): string {
  // 숫자만 추출
  const numbers = phoneNumber.replace(/[^\d]/g, '');
  
  if (numbers.length <= 3) {
    return numbers;
  } else if (numbers.length <= 7) {
    return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
  } else if (numbers.length <= 11) {
    return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7)}`;
  } else {
    // 11자리 초과는 잘라냄
    return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7, 11)}`;
  }
}

/**
 * 휴대폰 번호 정제 (하이픈 제거)
 */
export function cleanPhoneNumber(phoneNumber: string): string {
  return phoneNumber.replace(/[^\d]/g, '');
}

/**
 * 폼 데이터 유효성 검사
 */
export function validateForm(formData: FormData): FormValidationResult {
  const errors: string[] = [];
  const { customerName, phoneNumber, contractDetails } = formData;
  
  // 고객명 검증
  if (!customerName || customerName.trim().length === 0) {
    errors.push('고객명을 입력해주세요');
  } else if (customerName.trim().length < 2) {
    errors.push('고객명은 2글자 이상 입력해주세요');
  } else if (customerName.trim().length > 20) {
    errors.push('고객명은 20글자 이하로 입력해주세요');
  }
  
  // 휴대폰 번호 검증
  if (!phoneNumber || phoneNumber.trim().length === 0) {
    errors.push('휴대폰번호를 입력해주세요');
  } else {
    const cleanPhone = cleanPhoneNumber(phoneNumber);
    if (cleanPhone.length !== 11) {
      errors.push('휴대폰번호는 11자리를 입력해주세요');
    } else if (!cleanPhone.startsWith('010')) {
      errors.push('010으로 시작하는 휴대폰번호를 입력해주세요');
    }
  }
  
  // 계약 내용 검증
  if (!contractDetails || contractDetails.trim().length === 0) {
    errors.push('계약내용을 입력해주세요');
  } else if (contractDetails.trim().length < 5) {
    errors.push('계약내용은 5글자 이상 입력해주세요');
  } else if (contractDetails.trim().length > 500) {
    errors.push('계약내용은 500글자 이하로 입력해주세요');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    cleanData: {
      customerName: customerName?.trim() || '',
      phoneNumber: cleanPhoneNumber(phoneNumber || ''),
      contractDetails: contractDetails?.trim() || ''
    }
  };
}

/**
 * 입력값 디바운싱 (React에서 사용)
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
}

/**
 * 상태 관리 헬퍼
 */
export interface FormState {
  isLoading: boolean;
  isSuccess: boolean;
  isError: boolean;
  errorMessage: string;
}

export const initialFormState: FormState = {
  isLoading: false,
  isSuccess: false,
  isError: false,
  errorMessage: ''
};

/**
 * 로딩 상태 관리
 */
export function createLoadingState(): FormState {
  return {
    isLoading: true,
    isSuccess: false,
    isError: false,
    errorMessage: ''
  };
}

export function createSuccessState(): FormState {
  return {
    isLoading: false,
    isSuccess: true,
    isError: false,
    errorMessage: ''
  };
}

export function createErrorState(message: string): FormState {
  return {
    isLoading: false,
    isSuccess: false,
    isError: true,
    errorMessage: message
  };
}

/**
 * CSS 클래스 조건부 결합 (shadcn/ui 호환)
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * 시간 포맷팅
 */
export function formatTimestamp(timestamp: string): string {
  const date = new Date(timestamp);
  return date.toLocaleString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
}

/**
 * 문서 ID 마스킹 (보안)
 */
export function maskDocumentId(documentId: string): string {
  if (documentId.length <= 8) return documentId;
  
  const start = documentId.slice(0, 4);
  const end = documentId.slice(-4);
  const middle = '*'.repeat(documentId.length - 8);
  
  return `${start}${middle}${end}`;
}