import Link from "next/link";
import { cn, formatDate } from "@/lib/utils";

export function ConversationList({
  basePath,
  activeId,
  conversations,
}: {
  basePath: string;
  activeId?: string;
  conversations: {
    id: string;
    otherPartyName: string;
    lastMessageAt: Date;
    lastMessagePreview: string | null;
    unreadCount: number;
  }[];
}) {
  if (conversations.length === 0) {
    return (
      <div className="p-4 text-sm text-navy/50">No conversations yet.</div>
    );
  }

  return (
    <ul className="divide-y divide-navy/10">
      {conversations.map((c) => (
        <li key={c.id}>
          <Link
            href={`${basePath}/${c.id}`}
            className={cn(
              "block px-4 py-3 transition-colors hover:bg-navy/5",
              activeId === c.id && "bg-navy/5",
            )}
          >
            <div className="flex items-center justify-between gap-2">
              <p className="truncate text-sm font-medium text-navy">
                {c.otherPartyName}
              </p>
              {c.unreadCount > 0 && (
                <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-gold px-1 text-xs font-bold text-navy-dark">
                  {c.unreadCount}
                </span>
              )}
            </div>
            {c.lastMessagePreview && (
              <p className="mt-0.5 truncate text-xs text-navy/50">
                {c.lastMessagePreview}
              </p>
            )}
            <p className="mt-0.5 text-[11px] text-navy/35">
              {formatDate(c.lastMessageAt)}
            </p>
          </Link>
        </li>
      ))}
    </ul>
  );
}
