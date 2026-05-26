const YOUTUBE_VIDEO_ID_PATTERN = /^[a-zA-Z0-9_-]{11}$/;

const YOUTUBE_URL_PATTERNS: RegExp[] = [
  /(?:youtube\.com\/watch\?.*v=|youtube\.com\/watch\?.*&v=)([a-zA-Z0-9_-]{11})/,
  /youtu\.be\/([a-zA-Z0-9_-]{11})/,
  /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
  /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
];

export function isValidYouTubeVideoId(videoId: string): boolean {
  return YOUTUBE_VIDEO_ID_PATTERN.test(videoId.trim());
}

export function parseYouTubeVideoId(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) {
    return null;
  }

  if (isValidYouTubeVideoId(trimmed)) {
    return trimmed;
  }

  for (const pattern of YOUTUBE_URL_PATTERNS) {
    const match = trimmed.match(pattern);
    if (match?.[1] && isValidYouTubeVideoId(match[1])) {
      return match[1];
    }
  }

  try {
    const url = new URL(trimmed);
    const vParam = url.searchParams.get('v');
    if (vParam && isValidYouTubeVideoId(vParam)) {
      return vParam;
    }
  } catch {
    /* not a URL */
  }

  return null;
}

export function isValidYouTubeVideoUrl(input: string): boolean {
  return parseYouTubeVideoId(input) !== null;
}

export function getYouTubeThumbnailUrl(videoId: string): string {
  return `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
}

/** Build nocookie embed URL. Pass origin when running in a browser for IFrame API. */
export function getYouTubeEmbedUrl(videoId: string, origin?: string): string {
  const params = new URLSearchParams({
    enablejsapi: '1',
    playsinline: '1',
    rel: '0',
    iv_load_policy: '3',
    controls: '0',
    disablekb: '1',
  });
  if (origin?.trim()) {
    params.set('origin', origin.trim());
  }
  return `https://www.youtube-nocookie.com/embed/${videoId}?${params.toString()}`;
}

/** Preview embed in builder — allow native YouTube controls for easier inspection. */
export function getYouTubePreviewEmbedUrl(videoId: string, origin?: string): string {
  const params = new URLSearchParams({
    enablejsapi: '1',
    playsinline: '1',
    rel: '0',
    iv_load_policy: '3',
    controls: '1',
  });
  if (origin?.trim()) {
    params.set('origin', origin.trim());
  }
  return `https://www.youtube-nocookie.com/embed/${videoId}?${params.toString()}`;
}
