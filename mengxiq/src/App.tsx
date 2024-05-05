import Header from "./component/Header";
import Body from "./component/Body";
import { useState, useEffect } from 'react';

function App() {
  const [qid, setQid] = useState<string>();
  
  useEffect(() => {
    console.log("qid updated to: " + qid);
  }, [qid]);

  return (
    <div>
      <Header setQid={setQid}/>
      <Body qid={qid!}/>
    </div>
  );
}

export default App;

