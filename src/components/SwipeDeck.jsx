import { useState, useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import SwipeCard from './SwipeCard.jsx';

const VISIBLE_STACK = 3; // how many cards visible in the stack

export default function SwipeDeck({ playlist, onDone, onBack }) {
  const [songs] = useState(() => [...playlist.songs]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [kept, setKept] = useState([]);
  const [dropped, setDropped] = useState([]);
  const [history, setHistory] = useState([]); // for undo
  const [lastAction, setLastAction] = useState(null); // 'keep' | 'drop' for toast
  const [toastVisible, setToastVisible] = useState(false);

  // Refs so keyboard handler always sees latest state without re-registering
  const handleSwipeRef = useRef(null);
  const handleUndoRef = useRef(null);

  const total = songs.length;
  const remaining = total - currentIndex;
  const progress = currentIndex / total;

  // Keyboard shortcuts
  useEffect(() => {
    function onKey(e) {
      if (e.key === 'ArrowRight') handleSwipeRef.current?.('keep');
      if (e.key === 'ArrowLeft') handleSwipeRef.current?.('drop');
      if ((e.key === 'z' || e.key === 'Z') && (e.ctrlKey || e.metaKey)) handleUndoRef.current?.();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const triggerSwipe = (direction) => {
    if (currentIndex < total) handleSwipeRef.current?.(direction);
  };

  function handleSwipe(direction) {
    const song = songs[currentIndex];
    const newKept = direction === 'keep' ? [...kept, song] : kept;
    const newDropped = direction === 'drop' ? [...dropped, song] : dropped;

    setHistory((h) => [...h, { kept, dropped, currentIndex }]);
    setKept(newKept);
    setDropped(newDropped);

    const nextIndex = currentIndex + 1;
    setCurrentIndex(nextIndex);

    // Show toast
    setLastAction(direction);
    setToastVisible(true);
    setTimeout(() => setToastVisible(false), 1200);

    if (nextIndex >= total) {
      setTimeout(() => onDone(newKept), 400);
    }
  }

  function handleUndo() {
    if (history.length === 0) return;
    const prev = history[history.length - 1];
    setKept(prev.kept);
    setDropped(prev.dropped);
    setCurrentIndex(prev.currentIndex);
    setHistory((h) => h.slice(0, -1));
    setToastVisible(false);
  }

  // Keep refs in sync with latest handlers on every render
  handleSwipeRef.current = handleSwipe;
  handleUndoRef.current = handleUndo;

  // Slice of visible cards (top card + a few behind it)
  const visibleSongs = songs.slice(currentIndex, currentIndex + VISIBLE_STACK);

  return (
    <div className="flex flex-col min-h-dvh bg-[#0f0f13] text-white">
      {/* Header */}
      <div className="px-4 pt-8 pb-4">
        <div className="flex items-center justify-between mb-1">
          <button
            onClick={onBack}
            className="text-gray-500 hover:text-white transition-colors text-sm flex items-center gap-1"
          >
            ← Back
          </button>
          <span className="text-gray-500 text-sm font-medium">
            {currentIndex < total ? `${currentIndex + 1} / ${total}` : 'Done!'}
          </span>
          <button
            onClick={handleUndo}
            disabled={history.length === 0}
            className="text-gray-500 hover:text-violet-400 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-sm flex items-center gap-1"
          >
            ↩ Undo
          </button>
        </div>

        {/* Progress bar */}
        <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-violet-500 to-pink-500"
            animate={{ width: `${progress * 100}%` }}
            transition={{ type: 'spring', stiffness: 200, damping: 30 }}
          />
        </div>

        {/* Stats row */}
        <div className="flex justify-between mt-2 text-xs text-gray-600">
          <span className="text-green-500 font-medium">✓ {kept.length} kept</span>
          <span className="text-gray-500">{remaining > 0 ? `${remaining} left` : 'All done'}</span>
          <span className="text-red-400 font-medium">{dropped.length} skipped ✗</span>
        </div>
      </div>

      {/* Playlist title */}
      <div className="px-4 mb-3">
        <p className="text-xs text-gray-600 truncate text-center">
          📋 {playlist.playlistTitle}
        </p>
      </div>

      {/* Card deck */}
      <div className="flex-1 relative flex items-center justify-center px-4">
        <div className="relative w-full max-w-sm" style={{ height: 440 }}>
          <AnimatePresence>
            {currentIndex < total ? (
              visibleSongs
                .slice()
                .reverse()
                .map((song, reversedIdx) => {
                  const stackIdx = visibleSongs.length - 1 - reversedIdx;
                  return (
                    <SwipeCard
                      key={song.id + '-' + (currentIndex + stackIdx)}
                      song={song}
                      isTop={stackIdx === 0}
                      stackIndex={stackIdx}
                      onSwipe={handleSwipe}
                    />
                  );
                })
            ) : (
              <motion.div
                key="done"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="absolute inset-0 flex flex-col items-center justify-center text-center"
              >
                <div className="text-7xl mb-4">🎉</div>
                <h2 className="text-2xl font-bold text-white mb-2">All done!</h2>
                <p className="text-gray-400">Loading your results…</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Action buttons */}
      {currentIndex < total && (
        <div className="px-8 pb-10 pt-4 flex items-center justify-center gap-8">
          <ActionButton
            onClick={() => handleSwipe('drop')}
            icon="✕"
            label="Skip"
            colorClass="bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500/20"
            size="large"
          />
          <ActionButton
            onClick={handleUndo}
            disabled={history.length === 0}
            icon="↩"
            label="Undo"
            colorClass="bg-white/5 text-gray-400 border-white/10 hover:bg-white/10"
            size="small"
          />
          <ActionButton
            onClick={() => handleSwipe('keep')}
            icon="♥"
            label="Keep"
            colorClass="bg-green-500/10 text-green-400 border-green-500/20 hover:bg-green-500/20"
            size="large"
          />
        </div>
      )}

      {/* Swipe action toast */}
      <AnimatePresence>
        {toastVisible && (
          <motion.div
            key="toast"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-28 left-1/2 -translate-x-1/2 z-50 pointer-events-none"
          >
            <div
              className={`px-5 py-2.5 rounded-2xl text-sm font-bold shadow-lg ${
                lastAction === 'keep'
                  ? 'bg-green-500 text-white'
                  : 'bg-red-500 text-white'
              }`}
            >
              {lastAction === 'keep' ? '♥ Kept!' : '✕ Skipped'}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Keyboard hint */}
      <div className="pb-3 text-center text-xs text-gray-700 hidden md:block">
        ← Skip &nbsp;|&nbsp; Keep → &nbsp;|&nbsp; Ctrl+Z Undo
      </div>
    </div>
  );
}

function ActionButton({ onClick, icon, label, colorClass, size = 'large', disabled }) {
  const isLarge = size === 'large';
  return (
    <motion.button
      onClick={onClick}
      disabled={disabled}
      whileTap={{ scale: disabled ? 1 : 0.9 }}
      className={`flex flex-col items-center gap-1 ${isLarge ? 'w-16 h-16' : 'w-12 h-12'} rounded-full border ${colorClass} disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-md`}
    >
      <span className={`${isLarge ? 'text-2xl' : 'text-lg'} leading-none mt-auto mb-auto`}>
        {icon}
      </span>
      <span className="text-[10px] font-medium pb-1 leading-none">{label}</span>
    </motion.button>
  );
}
