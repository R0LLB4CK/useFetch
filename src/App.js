import React, { useState } from 'react';
import './App.css';
import { useFetch } from './fetcher.jsx';

function App() {
  const [show, setShow] = useState(true);

  return <div className="App">
    {show ? <FetcherTest /> : <div>hidden</div>}
    <button onClick={() => setShow(false)}>hide</button>
  </div>;
}

function FetcherTest() {
  const { result: users, error, abort } = useFetch('http://localhost/users');
  console.log(users, error, abort);
  return (
    <div>
      {JSON.stringify(users)}
      {error?.message}
      <button onClick={abort}>abort</button>
    </div>
  );

}

export default App;
