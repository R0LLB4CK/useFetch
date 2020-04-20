import React, { useState, useCallback } from 'react';
import './App.css';
import { useFetch, HTTPMethods } from './fetcher';
import { useResource } from './useResource';

class User {
  constructor({ name, age }) {
    this.name = name;
    this.age = age;
  }
}

function App() {
  const [show, setShow] = useState(true);

  return <div className="App">
    {show ? <FetcherTest /> : <div>hidden</div>}
    <button onClick={() => setShow(false)}>hide</button>
  </div>;
}

function ResourceTest() {
  const getResource = useCallback(() => new Promise(resolve => setTimeout(() => resolve('pipi'), 2000)), []);
  const resource = useResource(getResource);
  return JSON.stringify(resource);
}
function FetchTesterDataTest() {
  const [query, setQuery] = useState('');
  const { result, error, abort } = useFetch('http://localhost/query', null, null, { method: HTTPMethods.POST, data: { query } });
  return <div>
    <input onChange={e => { abort(); setQuery(e.target.value) }} value={query} />
    {result || <span style={{ color: 'red' }}>{error?.message}</span>}
  </div>
}

function FetcherTest() {
  const things = useFetch('http://localhost/users', User);
  const { result: users, error, abort, execute, renew } = things;
  const { result: users1, error: error1, abort: abort1, execute: execute1, renew: renew1 } = useFetch('http://localhost/users', User);
  console.log(users)
  return (
    <div>
      {JSON.stringify(things)}---
      {JSON.stringify(users)}-
      {error?.message}
      <button onClick={abort}>abort</button>
      <button onClick={execute}>execute</button>
      <br /><br />
      {JSON.stringify(users1)}-
      {error1?.message}
      <button onClick={abort1}>abort</button>
      <button onClick={execute1}>execute</button>
    </div>
  );

}

export default App;
