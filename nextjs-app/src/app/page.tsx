import ContractForm from '@/components/ContractForm';
import config from '@/lib/config';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">
            🏢 {config.app.name}
          </h1>
          <p className="text-gray-600 text-xl mb-2">
            디지털 계약서 발송 시스템
          </p>
          <p className="text-gray-500 text-sm">
            고객 정보를 입력하면 휴대폰으로 계약서가 즉시 발송됩니다
          </p>
        </div>
        
        <ContractForm />
        
        <div className="text-center mt-12">
          <div className="inline-flex items-center px-4 py-2 bg-blue-50 border border-blue-200 rounded-lg">
            <span className="text-blue-600 text-sm">
              💡 실제 SMS 발송 시스템 | 안전하고 신뢰할 수 있는 서비스
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}