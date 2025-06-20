/**
 * UI 유틸리티 함수들
 * React 컴포넌트로 쉽게 변환할 수 있도록 순수 함수로 구성
 */

/**
 * 휴대폰 번호 포맷팅 (하이픈 자동 추가)
 * @param {string} phoneNumber - 입력된 휴대폰 번호
 * @returns {string} 포맷팅된 휴대폰 번호
 */
function formatPhoneNumber(phoneNumber) {
  // 숫자만 추출
  const numbers = phoneNumber.replace(/[^\d]/g, '');
  
  // 길이에 따라 포맷팅
  if (numbers.length <= 3) {
    return numbers;
  } else if (numbers.length <= 7) {
    return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
  } else if (numbers.length <= 11) {
    return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7)}`;
  } else {
    // 11자리 초과시 자르기
    return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7, 11)}`;
  }
}

/**
 * 폼 데이터 검증
 * @param {Object} formData - 검증할 폼 데이터
 * @param {string} formData.customerName - 고객명
 * @param {string} formData.phoneNumber - 휴대폰 번호
 * @param {string} formData.contractDetails - 계약 내용
 * @returns {Object} 검증 결과
 */
function validateForm(formData) {
  const errors = [];
  const { customerName, phoneNumber, contractDetails } = formData;
  
  // 고객명 검증
  if (!customerName || customerName.trim().length === 0) {
    errors.push('고객명을 입력해주세요');
  } else if (customerName.trim().length < 2) {
    errors.push('고객명은 2글자 이상 입력해주세요');
  }
  
  // 휴대폰 번호 검증
  if (!phoneNumber || phoneNumber.trim().length === 0) {
    errors.push('휴대폰번호를 입력해주세요');
  } else {
    const cleanPhone = phoneNumber.replace(/[^\d]/g, '');
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
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    cleanData: {
      customerName: customerName?.trim(),
      phoneNumber: phoneNumber?.replace(/[^\d]/g, ''),
      contractDetails: contractDetails?.trim()
    }
  };
}

/**
 * UI 상태 관리 함수들
 */
const UIState = {
  /**
   * 로딩 상태 표시
   * @param {boolean} isLoading - 로딩 여부
   * @param {string} loadingText - 로딩 텍스트
   */
  setLoading(isLoading, loadingText = '처리 중...') {
    const submitBtn = document.getElementById('submitBtn');
    const loading = document.getElementById('loading');
    
    if (submitBtn) {
      submitBtn.disabled = isLoading;
      submitBtn.textContent = isLoading ? loadingText : '📄 계약서 발송하기';
    }
    
    if (loading) {
      loading.style.display = isLoading ? 'block' : 'none';
    }
  },
  
  /**
   * 결과 메시지 표시
   * @param {string} type - 'success' | 'error'
   * @param {string} message - 표시할 메시지
   * @param {Object} details - 추가 세부 정보
   */
  showResult(type, message, details = null) {
    const result = document.getElementById('result');
    if (!result) return;
    
    result.className = `result ${type}`;
    result.style.display = 'block';
    
    let content = `<strong>${type === 'success' ? '✅' : '❌'} ${message}</strong>`;
    
    if (details) {
      if (type === 'success' && details.documentId) {
        content += `<br><small>문서 ID: ${details.documentId}</small>`;
        content += `<br><small>수신자: ${details.recipient?.name} (${details.recipient?.phone})</small>`;
      } else if (type === 'error' && details.errors) {
        content += '<ul>';
        details.errors.forEach(error => {
          content += `<li>${error}</li>`;
        });
        content += '</ul>';
      }
    }
    
    result.innerHTML = content;
    
    // 성공 메시지는 5초 후 자동 숨김
    if (type === 'success') {
      setTimeout(() => {
        result.style.display = 'none';
      }, 5000);
    }
  },
  
  /**
   * 결과 영역 숨김
   */
  hideResult() {
    const result = document.getElementById('result');
    if (result) {
      result.style.display = 'none';
    }
  }
};

/**
 * 폼 이벤트 핸들러들
 */
const FormHandlers = {
  /**
   * 휴대폰 번호 입력 시 자동 포맷팅
   * @param {Event} event - input 이벤트
   */
  handlePhoneInput(event) {
    const input = event.target;
    const formatted = formatPhoneNumber(input.value);
    input.value = formatted;
  },
  
  /**
   * 폼 제출 처리
   * @param {Event} event - submit 이벤트
   * @param {Function} onSubmit - 제출 시 실행할 함수
   */
  async handleSubmit(event, onSubmit) {
    event.preventDefault();
    
    // 폼 데이터 수집
    const formData = {
      customerName: document.getElementById('customerName')?.value || '',
      phoneNumber: document.getElementById('phoneNumber')?.value || '',
      contractDetails: document.getElementById('contractDetails')?.value || ''
    };
    
    // 결과 영역 숨김
    UIState.hideResult();
    
    // 폼 검증
    const validation = validateForm(formData);
    if (!validation.isValid) {
      UIState.showResult('error', '입력 정보를 확인해주세요', {
        errors: validation.errors
      });
      return;
    }
    
    // 로딩 상태 시작
    UIState.setLoading(true, '발송 중...');
    
    try {
      // 실제 제출 로직 실행
      const result = await onSubmit(validation.cleanData);
      
      if (result.success) {
        UIState.showResult('success', 'SMS가 발송되었습니다!', result.document);
        
        // 성공 시 폼 초기화
        document.getElementById('contractForm')?.reset();
      } else {
        UIState.showResult('error', result.error?.message || '발송에 실패했습니다');
      }
    } catch (error) {
      console.error('Form submit error:', error);
      UIState.showResult('error', '시스템 오류가 발생했습니다');
    } finally {
      // 로딩 상태 종료
      UIState.setLoading(false);
    }
  },
  
  /**
   * 실시간 입력 검증
   * @param {Event} event - input 이벤트
   */
  handleInputValidation(event) {
    const input = event.target;
    const fieldName = input.id;
    
    // 개별 필드 검증 로직
    switch (fieldName) {
      case 'customerName':
        if (input.value.trim().length > 0 && input.value.trim().length < 2) {
          input.setCustomValidity('고객명은 2글자 이상 입력해주세요');
        } else {
          input.setCustomValidity('');
        }
        break;
        
      case 'phoneNumber':
        const cleanPhone = input.value.replace(/[^\d]/g, '');
        if (cleanPhone.length > 0 && (cleanPhone.length !== 11 || !cleanPhone.startsWith('010'))) {
          input.setCustomValidity('010으로 시작하는 11자리 휴대폰번호를 입력해주세요');
        } else {
          input.setCustomValidity('');
        }
        break;
        
      case 'contractDetails':
        if (input.value.trim().length > 0 && input.value.trim().length < 5) {
          input.setCustomValidity('계약내용은 5글자 이상 입력해주세요');
        } else {
          input.setCustomValidity('');
        }
        break;
    }
  }
};

// Node.js 환경에서 사용
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    formatPhoneNumber,
    validateForm,
    UIState,
    FormHandlers
  };
}

// 브라우저 환경에서 사용
if (typeof window !== 'undefined') {
  window.UIUtils = {
    formatPhoneNumber,
    validateForm,
    UIState,
    FormHandlers
  };
}