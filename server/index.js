import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import rateLimit from 'express-rate-limit';
import ytpl from '@distube/ytpl';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;
const IS_PROD = process.env.NODE_ENV === 'production';

app.use(cors());
app.use(express.json());

// Rate-limit the playlist scraping endpoint (10 requests per minute per IP)
const playlistLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Please wait a minute before trying again.' },
});

// Serve static files in production
if (IS_PROD) {
  const distPath = join(__dirname, '..', 'dist');
  app.use(express.static(distPath));
}

/**
 * POST /api/playlist
 * Body: { url: string }
 * Returns playlist metadata and song list.
 */
app.post('/api/playlist', playlistLimiter, async (req, res) => {
  const { url } = req.body;

  if (!url || typeof url !== 'string') {
    return res.status(400).json({ error: 'Please provide a valid YouTube playlist URL.' });
  }

  // Basic validation – must look like a YouTube URL
  if (!/youtube\.com|youtu\.be/i.test(url)) {
    return res.status(400).json({ error: 'URL must be a YouTube playlist link.' });
  }

  try {
    const playlistId = await ytpl.getPlaylistID(url);
    const playlist = await ytpl(playlistId, { limit: Infinity });

    const songs = playlist.items.map((item) => ({
      id: item.id,
      title: item.title,
      author: item.author?.name ?? 'Unknown Artist',
      duration: item.duration ?? '—',
      url: item.shortUrl ?? item.url,
      thumbnail:
        item.bestThumbnail?.url ??
        `https://i.ytimg.com/vi/${item.id}/hqdefault.jpg`,
    }));

    res.json({
      playlistTitle: playlist.title,
      playlistAuthor: playlist.author?.name ?? '',
      totalItems: songs.length,
      songs,
    });
  } catch (err) {
    console.error('Playlist fetch error:', err.message);

    const msg =
      err.message?.includes('private') || err.message?.includes('unavailable')
        ? 'This playlist is private or unavailable. Please make it public and try again.'
        : err.message?.includes('not a playlist')
          ? 'That URL does not appear to be a playlist. Please paste a YouTube playlist link.'
          : 'Could not load the playlist. Please check the URL and try again.';

    res.status(422).json({ error: msg });
  }
});

// Rate-limit all other routes (100 requests per minute per IP) to guard file-system access
const generalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
});

// Fallback to React app in production
if (IS_PROD) {
  app.get(/.*/, generalLimiter, (_req, res) => {
    res.sendFile(join(__dirname, '..', 'dist', 'index.html'));
  });
}

const HOST = process.env.HOST || (IS_PROD ? '0.0.0.0' : '127.0.0.1');

app.listen(PORT, HOST, () => {
  console.log(`Plinder server running on http://${HOST}:${PORT}`);
});
