import React from 'react';
import './App.css';
import InteractiveHockeyHeatMap from './components/InteractiveHockeyHeatMap';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <h1>Hockey Shot Map</h1>
        <p>Interactive hockey shot visualization with D3.js and React</p>
      </header>
      <main className="App-main">
        <InteractiveHockeyHeatMap />
      </main>
    </div>
  );
}

export default App;
