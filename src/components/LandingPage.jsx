import { useState } from 'react';
import { motion } from 'framer-motion';
import { DEMO_PLAYLIST } from '../demoData.js';

const EXAMPLE_URLS = [
  'https://www.youtube.com/playlist?list=PLFgquLnL59alCl_2TQvOiD5Vgm1hCaGSI',
  'https://www.youtube.com/playlist?list=PLw-VjHDlEOgs658kAHR_LAaLCE9DdU6lN',
];

export default function LandingPage({ onPlaylistLoaded }) {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    const trimmed = url.trim();
    if (!trimmed) {
      setError('Please paste a YouTube playlist URL.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/playlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: trimmed }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Failed to load playlist.');
      } else if (!data.songs?.length) {
        setError('Playlist appears to be empty or all videos are unavailable.');
      } else {
        onPlaylistLoaded(data);
      }
    } catch {
      setError('Network error – is the server running?');
    } finally {
      setLoading(false);
    }
  }

  function pasteExample() {
    setUrl(EXAMPLE_URLS[Math.floor(Math.random() * EXAMPLE_URLS.length)]);
    setError('');
  }

  return (
    <div className="flex flex-col min-h-dvh bg-[#0f0f13] text-white px-5 pt-16 pb-10">
      {/* Logo / Hero */}
      <motion.div
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="text-center mb-12"
      >
        <div className="text-6xl mb-4 select-none">🎵</div>
        <h1 className="text-5xl font-black tracking-tight gradient-text mb-3">
          Plinder
        </h1>
        <p className="text-gray-400 text-lg leading-snug max-w-xs mx-auto">
          Swipe to curate your YouTube playlist — no sign-in needed.
        </p>
      </motion.div>

      {/* How it works */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        className="flex justify-center gap-6 mb-10"
      >
        {[
          { icon: '🔗', label: 'Paste URL' },
          { icon: '👈👉', label: 'Swipe' },
          { icon: '📥', label: 'Export CSV' },
        ].map(({ icon, label }) => (
          <div key={label} className="flex flex-col items-center gap-1">
            <span className="text-3xl">{icon}</span>
            <span className="text-xs text-gray-500 font-medium">{label}</span>
          </div>
        ))}
      </motion.div>

      {/* Form */}
      <motion.form
        onSubmit={handleSubmit}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35, duration: 0.5 }}
        className="flex flex-col gap-3 max-w-md mx-auto w-full"
      >
        <div className="relative">
          <input
            type="url"
            value={url}
            onChange={(e) => { setUrl(e.target.value); setError(''); }}
            placeholder="youtube.com/playlist?list=…"
            autoComplete="off"
            spellCheck={false}
            className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-4 text-white placeholder-gray-600 text-sm focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 transition-all"
          />
          {url && (
            <button
              type="button"
              onClick={() => { setUrl(''); setError(''); }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white text-xl leading-none"
            >
              ×
            </button>
          )}
        </div>

        {error && (
          <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-red-400 text-sm px-1"
          >
            {error}
          </motion.p>
        )}

        <motion.button
          type="submit"
          disabled={loading}
          whileTap={{ scale: 0.97 }}
          className="w-full bg-gradient-to-r from-violet-600 to-pink-600 text-white font-bold py-4 rounded-2xl text-lg shadow-lg shadow-violet-500/25 disabled:opacity-60 disabled:cursor-not-allowed transition-opacity"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <LoadingSpinner />
              Loading playlist…
            </span>
          ) : (
            'Start Swiping ✨'
          )}
        </motion.button>

        <button
          type="button"
          onClick={pasteExample}
          className="text-center text-sm text-gray-500 hover:text-violet-400 transition-colors py-1"
        >
          Try an example playlist →
        </button>

        <button
          type="button"
          onClick={() => onPlaylistLoaded(DEMO_PLAYLIST)}
          className="text-center text-xs text-gray-600 hover:text-gray-400 transition-colors py-1"
        >
          ✨ Try demo mode (no URL needed)
        </button>
      </motion.form>

      {/* Tips */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6, duration: 0.6 }}
        className="mt-auto pt-12 max-w-md mx-auto w-full"
      >
        <p className="text-xs text-gray-600 text-center">
          Works with any <span className="text-gray-500">public</span> YouTube playlist.
          Songs are scraped directly — no Google sign-in required.
        </p>
        <div className="mt-4 flex justify-center gap-8 text-xs text-gray-600">
          <span>← Swipe left to skip</span>
          <span>Swipe right to keep →</span>
        </div>
      </motion.div>
    </div>
  );
}

function LoadingSpinner() {
  return (
    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
    </svg>
  );
}
