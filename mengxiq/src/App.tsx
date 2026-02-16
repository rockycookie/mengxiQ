import Header from "./component/Header";
import Body from "./component/Body";
import Report from "./component/Report";
import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

function App() {
  const [qid, setQid] = useState<string>();
  
  useEffect(() => {
    console.log("qid updated to: " + qid);
  }, [qid]);

  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Header setQid={setQid}/>
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
        </Routes>
      </div>
    </Router>
  );
}

export default App;

