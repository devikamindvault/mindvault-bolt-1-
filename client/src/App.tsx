import React from 'react';
import RichTextEditor from './components/RichTextEditor';
import './App.css';

function App() {
  return (
    <div className="app-container">
      <header className="app-header">
        <h1 className="app-title">Mind Vault</h1>
      </header>
      <main className="app-content">
        <RichTextEditor />
      </main>
    </div>
  );
}

export default App;