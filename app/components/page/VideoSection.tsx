'use client';

import dynamic from 'next/dynamic';
import './VideoSection.css';

const ReactPlayer = dynamic(() => import('react-player/lazy'), { ssr: false });

export type VideoItemData = {
  id: number | string;
  title?: string | null;
  description?: string | null;
  url: string | null;
  filename?: string | null;
};

export type VideoSectionData = {
  id: number | string;
  title?: string | null;
  videos: VideoItemData[];
};

type VideoSectionProps = {
  section: VideoSectionData;
  direction?: 'ltr' | 'rtl';
};

const isPlayable = (video: VideoItemData) => Boolean(video.url);

const shouldForceHls = (url?: string | null) => !!url && /\.m3u8(\?.*)?$/i.test(url);

const buildPlayerConfig = (url?: string | null) => ({
  file: {
    forceHLS: shouldForceHls(url),
    attributes: {
      preload: 'none',
      controlsList: 'nodownload',
    },
  },
});

const PlayIcon = () => <div className="video-card__play-button" aria-hidden="true">▶</div>;

export default function VideoSection({ section, direction = 'ltr' }: VideoSectionProps) {
  const playableVideos = (section.videos ?? []).filter(isPlayable);
  if (!playableVideos.length) {
    return null;
  }

  return (
    <section className="video-section" dir={direction}>
      {section.title ? <h2 className="video-section__title">{section.title}</h2> : null}
      <div className="video-grid">
        {playableVideos.map((video) => (
          <article key={video.id} className="video-card">
            <div className="video-card__player">
              <ReactPlayer
                url={video.url ?? undefined}
                controls
                width="100%"
                height="100%"
                light
                playing={false}
                stopOnUnmount
                pip={false}
                playIcon={<PlayIcon />}
                config={buildPlayerConfig(video.url)}
              />
            </div>
            <div className={`video-card__body${video.description ? '' : ' video-card__body--empty'}`}>
              <h3 className="video-card__title">{video.title ?? video.filename ?? 'Video'}</h3>
              {video.description ? <p className="video-card__description">{video.description}</p> : null}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}