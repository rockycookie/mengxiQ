import Header from "./component/Header";
import Body from "./component/Body";
import Report from "./component/Report";
import ReportHeader from "./component/ReportHeader";
import DeletedQueues from "./component/DeletedQueues";
import DeletedQueuesHeader from "./component/DeletedQueuesHeader";
import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';

function AppContent({ qid, setQid }: { qid: string | undefined, setQid: (id: string) => void }) {
  const location = useLocation();
  
  const getHeader = () => {
    if (location.pathname === '/report') return <ReportHeader />;
    if (location.pathname === '/deleted') return <DeletedQueuesHeader />;
    return <Header setQid={setQid} />;
  };
  
  return (
    <>
      {getHeader()}
      <Routes>
        <Route path="/" element={
          qid ? (
            <Body qid={qid}/>
          ) : (
            <div className="max-w-6xl mx-auto px-4 py-12 text-center">
              <div className="bg-white rounded-lg shadow-md p-12">
                <p className="text-gray-500 text-lg">📝 Create your first queue to get started!</p>
                <p className="text-gray-400 text-sm mt-2">Use the "➕ New Queue" button above.</p>
              </div>
            </div>
          )
        } />
        <Route path="/report" element={<Report />} />
        <Route path="/deleted" element={<DeletedQueues />} />
      </Routes>
    </>
  );
}

function App() {
  const [qid, setQid] = useState<string>();
  
  useEffect(() => {
    console.log("qid updated to: " + qid);
  }, [qid]);

  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <AppContent qid={qid} setQid={setQid} />
      </div>
    </Router>
  );
}

export default App;

