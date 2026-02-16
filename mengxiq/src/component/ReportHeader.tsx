import { useNavigate } from 'react-router-dom';

function ReportHeader(): JSX.Element {
  const navigate = useNavigate();

  return (
    <div className="bg-white shadow-md border-b border-gray-200">
      <div className="max-w-6xl mx-auto px-4">
        {/* App Title */}
        <div className="py-4 border-b border-gray-200">
          <h1 
            className="text-2xl font-bold text-gray-800 cursor-pointer hover:text-blue-600 transition-colors duration-150"
            onClick={() => navigate('/')}
          >
            📋 MengxiQ
          </h1>
          <p className="text-sm text-gray-600 mt-1">Prioritize, record, and forget quickly</p>
        </div>

        {/* Actions Row */}
        <div className="py-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/')}
              className="px-4 py-2 rounded-lg font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-all duration-150 whitespace-nowrap"
            >
              ← Back to Queues
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ReportHeader;
