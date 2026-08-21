export function PostBody({ content }: { content: string }) {
  const paragraphs = content.split(/\n{2,}/).filter(Boolean);
  return (
    <div className="space-y-4 text-navy/80">
      {paragraphs.map((paragraph, i) => (
        <p key={i} className="leading-relaxed">
          {paragraph}
        </p>
      ))}
    </div>
  );
}
