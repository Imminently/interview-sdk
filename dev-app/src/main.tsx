import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import { Playground } from './Playground';
import { UIBrowser } from './UIBrowser';

const Wrapper = () => {
  const [currentPage, setCurrentPage] = useState(() => {
    return sessionStorage.getItem('currentPage') || 'uiBrowser';
  });

  useEffect(() => {
    sessionStorage.setItem('currentPage', currentPage);
  }, [currentPage]);

  return (
    <div>
      {currentPage === 'playground' ? <Playground setCurrentPage={setCurrentPage}/> : <UIBrowser setCurrentPage={setCurrentPage}/>}
    </div>
  )
};

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Wrapper />
  </React.StrictMode>
);