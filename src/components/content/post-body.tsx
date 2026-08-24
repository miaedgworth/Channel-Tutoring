const URL_PATTERN = /(https?:\/\/[^\s)]+)/g;
const BOLD_PATTERN = /\*\*(.+?)\*\*/g;

function linkify(text: string, keyPrefix: string) {
  const parts = text.split(URL_PATTERN);
  return parts.map((part, i) =>
    part.startsWith("http://") || part.startsWith("https://") ? (
      <a
        key={`${keyPrefix}-${i}`}
        href={part}
        target="_blank"
        rel="noopener noreferrer"
        className="underline"
      >
        {part}
      </a>
    ) : (
      <span key={`${keyPrefix}-${i}`}>{part}</span>
    ),
  );
}

function renderInline(text: string, keyPrefix: string) {
  const parts = text.split(BOLD_PATTERN);
  return parts.map((part, i) =>
    i % 2 === 1 ? (
      <strong key={`${keyPrefix}-b-${i}`} className="font-semibold text-navy">
        {part}
      </strong>
    ) : (
      <span key={`${keyPrefix}-b-${i}`}>{linkify(part, `${keyPrefix}-${i}`)}</span>
    ),
  );
}

export function PostBody({ content }: { content: string }) {
  const blocks = content.split(/\n{2,}/).filter(Boolean);
  return (
    <div className="space-y-4 text-navy/80">
      {blocks.map((block, i) => {
        if (block.startsWith("## ")) {
          return (
            <h2
              key={i}
              className="pt-2 font-heading text-xl font-bold text-navy sm:text-2xl"
            >
              {renderInline(block.slice(3), `h-${i}`)}
            </h2>
          );
        }
        return (
          <p key={i} className="leading-relaxed">
            {renderInline(block, `p-${i}`)}
          </p>
        );
      })}
    </div>
  );
}
