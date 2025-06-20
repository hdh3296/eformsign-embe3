/**
 * Next.js API Route: 문서 생성 및 발송
 * POST /api/documents/create
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAndSendDocument, DocumentRequest } from '@/lib/eformsign';
import { handleApiError, createSuccessResponse, ValidationError } from '@/lib/errors';
import { validateForm } from '@/lib/utils';

export async function POST(request: NextRequest) {
  try {
    // Authorization 헤더에서 토큰 추출
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new ValidationError('Authorization 헤더가 필요합니다');
    }
    
    const accessToken = authHeader.replace('Bearer ', '');
    
    // 요청 본문 파싱
    const body = await request.json();
    const { apiUrl, customerName, phoneNumber, contractDetails } = body;
    
    if (!apiUrl) {
      throw new ValidationError('API URL이 필요합니다');
    }
    
    // 폼 데이터 유효성 검사
    const validation = validateForm({
      customerName: customerName || '',
      phoneNumber: phoneNumber || '',
      contractDetails: contractDetails || ''
    });
    
    if (!validation.isValid) {
      throw new ValidationError('입력 데이터가 유효하지 않습니다', validation.errors);
    }
    
    // 문서 생성 및 발송
    const documentData = await createAndSendDocument(
      accessToken,
      apiUrl,
      {
        customerName: validation.cleanData.customerName,
        phoneNumber: validation.cleanData.phoneNumber,
        contractDetails: validation.cleanData.contractDetails
      }
    );
    
    // 직접 문서 데이터 반환 (래핑하지 않음)
    return NextResponse.json(documentData);
  } catch (error) {
    const { status, body } = handleApiError(error as Error);
    return NextResponse.json(body, { status });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}