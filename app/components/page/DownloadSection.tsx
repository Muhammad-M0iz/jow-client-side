import './DownloadSection.css';

type DownloadItem = {
  id: number | string;
  title?: string | null;
  fileName?: string | null;
  fileUrl: string;
};

type DownloadSectionData = {
  id: number | string;
  title?: string | null;
  downloads: DownloadItem[];
};

type DownloadSectionProps = {
  section: DownloadSectionData;
};

const DownloadButton = ({ href, label }: { href: string; label: string }) => (
  <a
    className="download-item__button"
    href={href}
    target="_blank"
    rel="noopener noreferrer"
    download
  >
    {label}
  </a>
);

export default function DownloadSection({ section }: DownloadSectionProps) {
  if (!section.downloads.length) {
    return null;
  }

  return (
    <section className="download-section">
      {section.title ? <h2 className="download-section__title">{section.title}</h2> : null}
      <div className="download-section__grid">
        {section.downloads.map((download) => (
          <article key={download.id} className="download-item">
            <div className="download-item__body">
              <h3 className="download-item__title">{download.title ?? download.fileName ?? 'Download'}</h3>
              {download.fileName ? (
                <p className="download-item__file">{download.fileName}</p>
              ) : null}
            </div>
            <DownloadButton href={download.fileUrl} label="Download" />
          </article>
        ))}
      </div>
    </section>
  );
}

export type { DownloadSectionData, DownloadItem };
