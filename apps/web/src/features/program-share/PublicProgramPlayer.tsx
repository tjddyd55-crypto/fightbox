import { useEffect, useRef } from 'react';
import type { PublishedProgramPlaybackItemDto } from '@fightbox/shared';

interface PublicProgramPlayerProps {
  item: PublishedProgramPlaybackItemDto | null;
}

export function PublicProgramPlayer({ item }: PublicProgramPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const element = videoRef.current;
    if (!element || !item?.playbackUrl) {
      return;
    }
    element.load();
  }, [item?.blockId, item?.playbackUrl]);

  if (!item) {
    return (
      <div className="public-program-player public-program-player--empty">
        <p>운동을 선택해 주세요.</p>
      </div>
    );
  }

  if (!item.playbackUrl) {
    return (
      <div className="public-program-player public-program-player--empty">
        <p className="public-program-player-title">{item.title}</p>
        <p className="public-program-player-message">영상 URL이 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="public-program-player">
      <video
        ref={videoRef}
        className="public-program-player-video"
        src={item.playbackUrl}
        controls
        playsInline
        poster={item.thumbnailUrl ?? undefined}
        aria-label={`${item.title} 영상 재생`}
      />
      <p className="public-program-player-title">{item.title}</p>
    </div>
  );
}
