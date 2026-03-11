import { useRef } from 'react';
import { motion, useMotionValue, useTransform, useAnimation } from 'framer-motion';

const SWIPE_THRESHOLD = 100; // px required to trigger a swipe
const FLY_X = 600;           // px to fly off screen

/**
 * A single draggable song card.
 *
 * Props:
 *   song          – song data object
 *   onSwipe(dir)  – called with 'keep' or 'drop' when card is committed
 *   isTop         – whether this card is on top of the deck
 *   stackIndex    – visual stack position (0 = top)
 */
export default function SwipeCard({ song, onSwipe, isTop, stackIndex }) {
  const x = useMotionValue(0);
  const controls = useAnimation();
  const isDragging = useRef(false);

  // Visual transforms based on drag position
  const rotate = useTransform(x, [-250, 0, 250], [-18, 0, 18]);
  const keepOpacity = useTransform(x, [0, SWIPE_THRESHOLD], [0, 1]);
  const dropOpacity = useTransform(x, [-SWIPE_THRESHOLD, 0], [1, 0]);

  async function handleDragEnd(_, info) {
    const offsetX = info.offset.x;
    if (offsetX > SWIPE_THRESHOLD) {
      await controls.start({ x: FLY_X, opacity: 0, transition: { duration: 0.35 } });
      onSwipe('keep');
    } else if (offsetX < -SWIPE_THRESHOLD) {
      await controls.start({ x: -FLY_X, opacity: 0, transition: { duration: 0.35 } });
      onSwipe('drop');
    } else {
      // Snap back
      controls.start({ x: 0, rotate: 0, transition: { type: 'spring', stiffness: 400, damping: 30 } });
    }
  }

  // Stack appearance for cards behind the top
  const scaleY = 1 - stackIndex * 0.04;
  const translateY = stackIndex * 10;
  const zIndex = 10 - stackIndex;

  if (!isTop) {
    return (
      <motion.div
        style={{ zIndex, scale: scaleY, y: translateY, originY: 1 }}
        className="absolute inset-x-0 mx-auto w-full max-w-sm pointer-events-none"
      >
        <CardBody song={song} />
      </motion.div>
    );
  }

  return (
    <motion.div
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.8}
      onDragStart={() => { isDragging.current = true; }}
      onDragEnd={handleDragEnd}
      animate={controls}
      style={{ x, rotate, zIndex: 20 }}
      className="absolute inset-x-0 mx-auto w-full max-w-sm cursor-grab active:cursor-grabbing card-dragging touch-none"
      whileTap={{ scale: 1.02 }}
    >
      {/* KEEP overlay */}
      <motion.div
        style={{ opacity: keepOpacity }}
        className="absolute inset-0 z-10 rounded-3xl bg-green-500/20 border-4 border-green-400 flex items-start justify-end p-5 pointer-events-none"
      >
        <span className="text-green-400 font-black text-3xl tracking-wide rotate-12 border-4 border-green-400 rounded-xl px-3 py-1">
          KEEP
        </span>
      </motion.div>

      {/* DROP overlay */}
      <motion.div
        style={{ opacity: dropOpacity }}
        className="absolute inset-0 z-10 rounded-3xl bg-red-500/20 border-4 border-red-400 flex items-start justify-start p-5 pointer-events-none"
      >
        <span className="text-red-400 font-black text-3xl tracking-wide -rotate-12 border-4 border-red-400 rounded-xl px-3 py-1">
          SKIP
        </span>
      </motion.div>

      <CardBody song={song} />
    </motion.div>
  );
}

function CardBody({ song }) {
  return (
    <div className="bg-[#1a1a24] rounded-3xl overflow-hidden shadow-2xl border border-white/5 select-none">
      {/* Thumbnail */}
      <div className="relative w-full aspect-video bg-black">
        <img
          src={song.thumbnail}
          alt={song.title}
          className="w-full h-full object-cover"
          draggable={false}
          onError={(e) => {
            e.currentTarget.src = `https://i.ytimg.com/vi/${song.id}/hqdefault.jpg`;
          }}
        />
        {/* Duration badge */}
        {song.duration && song.duration !== '—' && (
          <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs font-mono px-2 py-0.5 rounded-md">
            {song.duration}
          </div>
        )}
        {/* Play icon overlay */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-14 h-14 rounded-full bg-black/50 flex items-center justify-center">
            <svg className="w-6 h-6 text-white ml-1" viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        </div>
      </div>

      {/* Song info */}
      <div className="p-5">
        <h2 className="text-white font-bold text-lg leading-tight line-clamp-2 mb-1">
          {song.title}
        </h2>
        <p className="text-gray-400 text-sm truncate">{song.author}</p>

        {/* YouTube link */}
        <a
          href={song.url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="mt-4 inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-red-400 transition-colors"
        >
          <YouTubeIcon />
          Open on YouTube
        </a>
      </div>
    </div>
  );
}

function YouTubeIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
  );
}
