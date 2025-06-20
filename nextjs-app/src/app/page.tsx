import ContractForm from '@/components/ContractForm';
import config from '@/lib/config';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-400 via-pink-500 to-red-500">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            🦠 {config.app.name}
          </h1>
          <p className="text-white/90 text-lg">
            고객 정보를 입력하면 휴대폰으로 계약서가 발송됩니다
          </p>
          <p className="text-white/70 text-sm mt-2">
            버전 {config.app.version} | Next.js 환경
          </p>
        </div>
        
        <ContractForm />
        
        <div className="text-center mt-8">
          <p className="text-white/60 text-sm">
            💡 데모용 - 실제 SMS가 발송됩니다
          </p>
        </div>
      </div>
    </div>
  );
}