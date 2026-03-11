import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import LandingPage from './components/LandingPage.jsx';
import SwipeDeck from './components/SwipeDeck.jsx';
import ResultsPage from './components/ResultsPage.jsx';

/**
 * App views:
 *  'landing'  – URL input page
 *  'swiping'  – Tinder-style swipe UI
 *  'results'  – Summary + CSV export
 */
export default function App() {
  const [view, setView] = useState('landing');
  const [playlist, setPlaylist] = useState(null); // { playlistTitle, songs[] }
  const [keptSongs, setKeptSongs] = useState([]);

  function handlePlaylistLoaded(data) {
    setPlaylist(data);
    setKeptSongs([]);
    setView('swiping');
  }

  function handleSwipingDone(kept) {
    setKeptSongs(kept);
    setView('results');
  }

  function handleReset() {
    setPlaylist(null);
    setKeptSongs([]);
    setView('landing');
  }

  function handleRetry() {
    setKeptSongs([]);
    setView('swiping');
  }

  return (
    <AnimatePresence mode="wait">
      {view === 'landing' && (
        <motion.div
          key="landing"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.4 }}
          className="flex-1 flex flex-col"
        >
          <LandingPage onPlaylistLoaded={handlePlaylistLoaded} />
        </motion.div>
      )}

      {view === 'swiping' && playlist && (
        <motion.div
          key="swiping"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.35 }}
          className="flex-1 flex flex-col"
        >
          <SwipeDeck
            playlist={playlist}
            onDone={handleSwipingDone}
            onBack={handleReset}
          />
        </motion.div>
      )}

      {view === 'results' && (
        <motion.div
          key="results"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 40 }}
          transition={{ duration: 0.4 }}
          className="flex-1 flex flex-col"
        >
          <ResultsPage
            keptSongs={keptSongs}
            playlistTitle={playlist?.playlistTitle ?? 'My Playlist'}
            totalOriginal={playlist?.songs?.length ?? 0}
            onReset={handleReset}
            onRetry={handleRetry}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
