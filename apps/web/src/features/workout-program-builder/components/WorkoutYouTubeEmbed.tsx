import { getYouTubePreviewEmbedUrl } from '../utils/youtubeVideoUtils';

interface WorkoutYouTubeEmbedProps {
  videoId: string;
  embedUrl?: string;
  title?: string;
  className?: string;
}

export function WorkoutYouTubeEmbed({
  videoId,
  embedUrl,
  title = 'YouTube 미리보기',
  className = 'wpb-youtube-embed',
}: WorkoutYouTubeEmbedProps) {
  const origin = typeof window !== 'undefined' ? window.location.origin : undefined;
  const src = embedUrl?.trim() || getYouTubePreviewEmbedUrl(videoId, origin);

  return (
    <div className={className}>
      <iframe
        src={src}
        title={title}
        className="wpb-youtube-embed-frame"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
        referrerPolicy="strict-origin-when-cross-origin"
      />
    </div>
  );
}
