import { NextRequest, NextResponse } from 'next/server';
import { getCompanyInfo } from '@/lib/eformsign';

export async function GET(request: NextRequest) {
  try {
    console.log('회사 정보 조회 API 호출 시작');
    
    const result = await getCompanyInfo();
    
    if (result.success) {
      console.log('회사 정보 조회 성공:', result.data);
      return NextResponse.json({
        success: true,
        company: result.data
      });
    } else {
      console.error('회사 정보 조회 실패:', result.error);
      return NextResponse.json({
        success: false,
        error: result.error
      }, { status: 400 });
    }
    
  } catch (error) {
    console.error('회사 정보 조회 API 에러:', error);
    
    return NextResponse.json({
      success: false,
      error: {
        message: error instanceof Error ? error.message : '서버 오류가 발생했습니다'
      }
    }, { status: 500 });
  }
}