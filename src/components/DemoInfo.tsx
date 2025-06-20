'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Clock, FileText, AlertTriangle } from 'lucide-react';

interface DemoInfoProps {
  onRemainingUpdate?: (remaining: number) => void;
}

export default function DemoInfo({ onRemainingUpdate }: DemoInfoProps) {
  const [remainingDocs, setRemainingDocs] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 데모 버전 정보
  const demoInfo = {
    type: '무료체험',
    expiryDate: '2025-06-28',
    totalAllowed: 50, // 총 허용 문서 수 (추정) 
  };

  const fetchUsageStatus = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/usage');
      const data = await response.json();
      
      if (data.success && data.usage) {
        const currentUsage = data.usage.total || 0;
        const remaining = demoInfo.totalAllowed - currentUsage;
        setRemainingDocs(Math.max(0, remaining));
        
        // 부모 컴포넌트에 남은 건수 전달
        if (onRemainingUpdate) {
          onRemainingUpdate(remaining);
        }
      } else {
        throw new Error(data.error?.message || '이용현황 조회 실패');
      }
    } catch (err) {
      console.error('이용현황 조회 에러:', err);
      setError(err instanceof Error ? err.message : '알 수 없는 오류');
      // 에러 시 기본값 설정
      setRemainingDocs(36);
    } finally {
      setLoading(false);
    }
  }, [demoInfo.totalAllowed, onRemainingUpdate]);

  useEffect(() => {
    fetchUsageStatus();
  }, [fetchUsageStatus]);

  // 남은 일수 계산
  const calculateDaysRemaining = () => {
    const today = new Date();
    const expiryDate = new Date(demoInfo.expiryDate);
    const diffTime = expiryDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  };

  const daysRemaining = calculateDaysRemaining();
  const isExpiringSoon = daysRemaining <= 7;
  const isLowDocCount = remainingDocs !== null && remainingDocs <= 10;

  return (
    <div className="space-y-4">
      {/* 데모 버전 알림 */}
      <Alert className="border-blue-200 bg-blue-50">
        <AlertTriangle className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-800">
          <strong>데모 버전</strong> - 이 프로젝트는 eformsign API 연동 데모입니다.
        </AlertDescription>
      </Alert>

      {/* 이용 현황 카드 */}
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-3 text-lg font-bold text-slate-900">
            <div className="p-2 bg-blue-100 rounded-lg">
              <FileText className="h-5 w-5 text-blue-600" />
            </div>
            무료체험 이용현황
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* 체험 기간 섹션 */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-slate-600">
              <Clock className="h-4 w-4" />
              <span className="text-sm font-medium">체험 기간</span>
            </div>
            <div className="flex items-center justify-between pl-6">
              <span className="text-base font-bold text-slate-900">
                {demoInfo.expiryDate}까지
              </span>
              <Badge variant={isExpiringSoon ? "destructive" : "secondary"} className="text-sm font-semibold">
                {daysRemaining}일 남음
              </Badge>
            </div>
          </div>

          {/* 구분선 */}
          <hr className="border-slate-200" />

          {/* 남은 문서 발송 섹션 */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-slate-600">
                <FileText className="h-4 w-4" />
                <span className="text-sm font-medium">남은 발송 가능</span>
              </div>
              <button
                onClick={fetchUsageStatus}
                className="text-xs text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-full font-medium transition-colors"
                disabled={loading}
              >
                {loading ? '조회중...' : '새로고침'}
              </button>
            </div>
            
            {loading ? (
              <div className="pl-6">
                <div className="h-8 w-24 bg-gray-200 rounded-lg animate-pulse" />
              </div>
            ) : error ? (
              <div className="pl-6">
                <span className="text-sm text-red-600 font-medium">조회 실패</span>
              </div>
            ) : (
              <div className="pl-6">
                <div className="flex items-center gap-3">
                  <span className="text-2xl font-bold text-slate-900">
                    {remainingDocs}
                  </span>
                  <span className="text-sm text-slate-600">건</span>
                  <Badge variant={isLowDocCount ? "destructive" : "default"} className="ml-auto">
                    {isLowDocCount ? '부족' : '여유'}
                  </Badge>
                </div>
                
                {/* 진행률 표시 */}
                {remainingDocs !== null && (
                  <div className="mt-2 space-y-1">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all duration-300 ${
                          isLowDocCount ? 'bg-red-500' : 'bg-green-500'
                        }`}
                        style={{ width: `${(remainingDocs / demoInfo.totalAllowed) * 100}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-slate-500">
                      <span>사용: {demoInfo.totalAllowed - remainingDocs}건</span>
                      <span>총 {demoInfo.totalAllowed}건</span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {isLowDocCount && (
            <Alert className="border-orange-200 bg-orange-50">
              <AlertTriangle className="h-4 w-4 text-orange-600" />
              <AlertDescription className="text-orange-800 text-xs">
                남은 문서 발송 건수가 부족합니다. 체험 기간 연장이 필요할 수 있습니다.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
}