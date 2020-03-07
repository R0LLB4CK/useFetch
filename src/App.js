import React, { useState } from 'react';
import './App.css';
import { useFetch, HTTPMethods } from './fetcher.jsx';


class User {
  constructor({ name, age }) {
    this.name = name;
    this.age = age;
  }
}

function App() {
  const [show, setShow] = useState(true);

  return <div className="App">
    {show ? <FetchTesterDataTest /> : <div>hidden</div>}
    <button onClick={() => setShow(false)}>hide</button>
  </div>;
}

function FetchTesterDataTest() {
  const [query, setQuery] = useState('');
  const { result, error, abort } = useFetch('http://localhost/query', null, null, { method: HTTPMethods.POST, data: { query } });
  return <div>
    <input onChange={e => { setQuery(e.target.value) }} value={query} />
    {result || <span style={{ color: 'red' }}>{error?.message}</span>}
  </div>
}

function FetcherTest() {
  const { result: users, error, abort, execute } = useFetch('http://localhost/users', User);
  const { result: users1, error: error1, abort: abort1, execute: execute1 } = useFetch('http://localhost/users', User);

  return (
    <div>
      {JSON.stringify(users)}
      {error?.message}
      <button onClick={abort}>abort</button>
      <button onClick={execute}>execute</button>
      <br /><br />
      {JSON.stringify(users1)}
      {error1?.message}
      <button onClick={abort1}>abort</button>
      <button onClick={execute1}>execute</button>

    </div>
  );

}

export default App;
