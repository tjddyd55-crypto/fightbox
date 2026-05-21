const THUMBNAIL_TIMEOUT_MS = 8000;
const DEFAULT_MAX_WIDTH = 640;
const DEFAULT_QUALITY = 0.82;
const DEFAULT_CONTENT_TYPE = 'image/jpeg';

export interface GeneratedVideoThumbnail {
  blob: Blob;
  objectUrl: string;
  width: number;
  height: number;
  contentType: 'image/jpeg';
  fileName: string;
}

function buildThumbnailFileName(sourceFileName: string): string {
  const baseName = sourceFileName.replace(/\.[^.]+$/, '').trim() || 'video';
  return `${baseName}-thumbnail.jpg`;
}

function computeDrawSize(
  sourceWidth: number,
  sourceHeight: number,
  maxWidth: number,
): { width: number; height: number } {
  if (sourceWidth <= maxWidth) {
    return { width: sourceWidth, height: sourceHeight };
  }

  const scale = maxWidth / sourceWidth;
  return {
    width: Math.max(1, Math.round(sourceWidth * scale)),
    height: Math.max(1, Math.round(sourceHeight * scale)),
  };
}

function waitForVideoEvent(
  video: HTMLVideoElement,
  eventName: 'loadedmetadata' | 'loadeddata' | 'seeked',
  timeoutMs: number,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const timeoutId = window.setTimeout(() => {
      cleanup();
      reject(new Error(`Video ${eventName} timed out`));
    }, timeoutMs);

    const onSuccess = () => {
      cleanup();
      resolve();
    };

    const onError = () => {
      cleanup();
      reject(new Error(`Video ${eventName} failed`));
    };

    const cleanup = () => {
      window.clearTimeout(timeoutId);
      video.removeEventListener(eventName, onSuccess);
      video.removeEventListener('error', onError);
    };

    video.addEventListener(eventName, onSuccess, { once: true });
    video.addEventListener('error', onError, { once: true });
  });
}

function canvasToBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('Failed to encode thumbnail blob'));
          return;
        }
        resolve(blob);
      },
      DEFAULT_CONTENT_TYPE,
      quality,
    );
  });
}

export async function generateVideoThumbnailFromFile(
  file: File,
  options?: {
    seekTimeSec?: number;
    maxWidth?: number;
    quality?: number;
  },
): Promise<GeneratedVideoThumbnail> {
  const maxWidth = options?.maxWidth ?? DEFAULT_MAX_WIDTH;
  const quality = options?.quality ?? DEFAULT_QUALITY;
  const objectUrl = URL.createObjectURL(file);
  const video = document.createElement('video');

  video.preload = 'metadata';
  video.muted = true;
  video.playsInline = true;
  video.src = objectUrl;

  try {
    await waitForVideoEvent(video, 'loadedmetadata', THUMBNAIL_TIMEOUT_MS);

    const duration = Number.isFinite(video.duration) ? video.duration : 0;
    const defaultSeek = duration > 0 ? Math.min(1, duration * 0.1) : 0;
    const seekTimeSec = options?.seekTimeSec ?? defaultSeek;

    video.currentTime = seekTimeSec;
    await waitForVideoEvent(video, 'seeked', THUMBNAIL_TIMEOUT_MS);
    await waitForVideoEvent(video, 'loadeddata', THUMBNAIL_TIMEOUT_MS);

    const sourceWidth = video.videoWidth;
    const sourceHeight = video.videoHeight;
    if (!sourceWidth || !sourceHeight) {
      throw new Error('Video dimensions are unavailable');
    }

    const { width, height } = computeDrawSize(sourceWidth, sourceHeight, maxWidth);
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext('2d');
    if (!context) {
      throw new Error('Canvas context is unavailable');
    }

    context.drawImage(video, 0, 0, width, height);
    const blob = await canvasToBlob(canvas, quality);
    const thumbnailObjectUrl = URL.createObjectURL(blob);

    return {
      blob,
      objectUrl: thumbnailObjectUrl,
      width,
      height,
      contentType: DEFAULT_CONTENT_TYPE,
      fileName: buildThumbnailFileName(file.name),
    };
  } finally {
    video.removeAttribute('src');
    video.load();
    URL.revokeObjectURL(objectUrl);
  }
}
