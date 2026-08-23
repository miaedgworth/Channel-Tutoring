const URL_PATTERN = /(https?:\/\/[^\s)]+)/g;

function linkify(text: string) {
  const parts = text.split(URL_PATTERN);
  return parts.map((part, i) =>
    part.startsWith("http://") || part.startsWith("https://") ? (
      <a
        key={i}
        href={part}
        target="_blank"
        rel="noopener noreferrer"
        className="underline"
      >
        {part}
      </a>
    ) : (
      part
    ),
  );
}

export function PostBody({ content }: { content: string }) {
  const paragraphs = content.split(/\n{2,}/).filter(Boolean);
  return (
    <div className="space-y-4 text-navy/80">
      {paragraphs.map((paragraph, i) => (
        <p key={i} className="leading-relaxed">
          {linkify(paragraph)}
        </p>
      ))}
    </div>
  );
}
