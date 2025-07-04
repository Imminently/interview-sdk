import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import './styles.css';
// import { Playground } from './Playground';
// import { UIBrowser } from './UIBrowser';
import { InterviewPage } from './Interview';

const Wrapper = () => {
  const [currentPage, setCurrentPage] = useState(() => {
    return "interview";
    // return sessionStorage.getItem('currentPage') || 'uiBrowser';
  });

  useEffect(() => {
    sessionStorage.setItem('currentPage', currentPage);
  }, [currentPage]);

  switch (currentPage) {
    // case 'uiBrowser':
    //   return <UIBrowser />;
    // case 'playground':
    //   return <Playground />;
    case 'interview':
      return <InterviewPage />;
    default:
      return (
        <header>
          <h1 className="text-4xl font-bold">Dev App</h1>
          <nav className="flex gap-2 mt-4">
            <button className="px-4 py-2 bg-primary text-primary-foreground rounded-2xl" onClick={() => setCurrentPage('uiBrowser')}>UI Browser</button>
            <button className="px-4 py-2 bg-primary text-primary-foreground rounded-2xl" onClick={() => setCurrentPage('playground')}>Playground</button>
            <button className="px-4 py-2 bg-primary text-primary-foreground rounded-2xl" onClick={() => setCurrentPage('interview')}>Interview</button>
          </nav>
        </header>
      );
  }
};

ReactDOM.createRoot(document.getElementById('root')!).render(
  // <React.StrictMode>
  <Wrapper />
  // </React.StrictMode>
);