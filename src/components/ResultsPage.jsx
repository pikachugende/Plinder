import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function ResultsPage({ keptSongs, playlistTitle, totalOriginal, onReset, onRetry }) {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState('kept');

  const keptCount = keptSongs.length;
  const skippedCount = totalOriginal - keptCount;
  const keepRate = totalOriginal > 0 ? Math.round((keptCount / totalOriginal) * 100) : 0;

  function downloadCSV() {
    const header = ['Title', 'Artist', 'Duration', 'YouTube URL'];
    const rows = keptSongs.map((s) => [
      csvEscape(s.title),
      csvEscape(s.author),
      csvEscape(s.duration),
      csvEscape(s.url),
    ]);
    const csvContent = [header, ...rows].map((r) => r.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${sanitizeFilename(playlistTitle)}_plinder.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  }

  async function copyURLs() {
    const text = keptSongs.map((s) => s.url).join('\n');
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard blocked */
    }
  }

  return (
    <div className="flex flex-col min-h-dvh bg-[#0f0f13] text-white">
      {/* Header */}
      <div className="px-5 pt-10 pb-6 text-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          className="text-6xl mb-4"
        >
          {keptCount === 0 ? '🗑️' : keptCount === totalOriginal ? '🎶' : '✨'}
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="text-3xl font-black gradient-text mb-1"
        >
          Playlist Curated!
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.25 }}
          className="text-gray-400 text-sm truncate px-6"
        >
          {playlistTitle}
        </motion.p>
      </div>

      {/* Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="mx-5 grid grid-cols-3 gap-3 mb-6"
      >
        <StatCard value={keptCount} label="Kept" color="text-green-400" />
        <StatCard value={skippedCount} label="Skipped" color="text-red-400" />
        <StatCard value={`${keepRate}%`} label="Keep rate" color="text-violet-400" />
      </motion.div>

      {/* Tabs */}
      <div className="mx-5 flex gap-1 bg-white/5 rounded-xl p-1 mb-4">
        {['kept', 'actions'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all capitalize ${
              activeTab === tab ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            {tab === 'kept' ? `♥ Kept (${keptCount})` : '↓ Export'}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'kept' && (
          <motion.div
            key="kept"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 overflow-y-auto no-scrollbar px-5 pb-6"
          >
            {keptSongs.length === 0 ? (
              <div className="text-center text-gray-600 py-16">
                <div className="text-4xl mb-3">🤷</div>
                <p>You didn't keep any songs.</p>
                <button
                  onClick={onRetry}
                  className="mt-4 text-violet-400 hover:text-violet-300 text-sm underline"
                >
                  Try again
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {keptSongs.map((song, i) => (
                  <motion.div
                    key={song.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className="flex items-center gap-3 bg-white/5 rounded-xl px-3 py-2.5 hover:bg-white/8 transition-colors"
                  >
                    <img
                      src={song.thumbnail}
                      alt={song.title}
                      className="w-12 h-9 rounded-lg object-cover flex-shrink-0 bg-black"
                      onError={(e) => {
                        e.currentTarget.src = `https://i.ytimg.com/vi/${song.id}/default.jpg`;
                      }}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-white truncate">{song.title}</p>
                      <p className="text-xs text-gray-500 truncate">{song.author}</p>
                    </div>
                    <span className="text-xs text-gray-600 font-mono flex-shrink-0">
                      {song.duration}
                    </span>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {activeTab === 'actions' && (
          <motion.div
            key="actions"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 px-5 pb-6 flex flex-col gap-4"
          >
            {/* CSV Export */}
            <ActionCard
              icon="📥"
              title="Export as CSV"
              description={`Download ${keptCount} kept song${keptCount !== 1 ? 's' : ''} as a spreadsheet.`}
              buttonLabel="Download CSV"
              buttonColor="bg-gradient-to-r from-violet-600 to-pink-600"
              onClick={downloadCSV}
              disabled={keptCount === 0}
            />

            {/* Copy URLs */}
            <ActionCard
              icon="🔗"
              title="Copy YouTube Links"
              description="Copy all kept song URLs to clipboard."
              buttonLabel={copied ? 'Copied! ✓' : 'Copy Links'}
              buttonColor={copied ? 'bg-green-600' : 'bg-white/10'}
              onClick={copyURLs}
              disabled={keptCount === 0}
            />

            {/* Redo */}
            <ActionCard
              icon="🔄"
              title="Redo This Playlist"
              description="Swipe through the same playlist again."
              buttonLabel="Swipe Again"
              buttonColor="bg-white/10"
              onClick={onRetry}
            />

            {/* New playlist */}
            <ActionCard
              icon="➕"
              title="New Playlist"
              description="Import a different YouTube playlist."
              buttonLabel="Start Over"
              buttonColor="bg-white/10"
              onClick={onReset}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function StatCard({ value, label, color }) {
  return (
    <div className="bg-white/5 rounded-2xl py-4 flex flex-col items-center gap-1">
      <span className={`text-2xl font-black ${color}`}>{value}</span>
      <span className="text-xs text-gray-500">{label}</span>
    </div>
  );
}

function ActionCard({ icon, title, description, buttonLabel, buttonColor, onClick, disabled }) {
  return (
    <div className="bg-white/5 rounded-2xl p-4">
      <div className="flex items-start gap-3 mb-3">
        <span className="text-2xl">{icon}</span>
        <div>
          <p className="font-semibold text-sm text-white">{title}</p>
          <p className="text-xs text-gray-500 mt-0.5">{description}</p>
        </div>
      </div>
      <motion.button
        whileTap={{ scale: disabled ? 1 : 0.97 }}
        onClick={onClick}
        disabled={disabled}
        className={`w-full ${buttonColor} text-white text-sm font-bold py-3 rounded-xl transition-opacity disabled:opacity-40 disabled:cursor-not-allowed`}
      >
        {buttonLabel}
      </motion.button>
    </div>
  );
}

function csvEscape(value) {
  if (value == null) return '';
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function sanitizeFilename(name) {
  return name.replace(/[^a-z0-9_\-\s]/gi, '_').trim().replace(/\s+/g, '_').slice(0, 60);
}
