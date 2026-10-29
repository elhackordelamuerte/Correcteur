import { type Inline, parseRichText } from "@/lib/rich-text";

function Inlines({ parts }: { parts: Inline[] }) {
  return parts.map((p, i) => {
    if (p.bold) return <strong key={i} className="font-semibold text-ink">{p.text}</strong>;
    if (p.italic) return <em key={i}>{p.text}</em>;
    return <span key={i}>{p.text}</span>;
  });
}

// Affiche un énoncé rédigé en Markdown simple, à taille de lecture
export function RichText({ source, className = "" }: { source: string; className?: string }) {
  return (
    <div className={`space-y-3 text-[15.5px] leading-7 text-ink ${className}`}>
      {parseRichText(source).map((block, i) => {
        if (block.kind === "heading") {
          return (
            <h4 key={i} className="pt-3 font-display text-lg font-medium leading-snug tracking-tight first:pt-0">
              <Inlines parts={block.content} />
            </h4>
          );
        }
        if (block.kind === "list") {
          return (
            <ul key={i} className="space-y-1.5 pl-5">
              {block.items.map((item, j) => (
                <li key={j} className="list-disc marker:text-pen/60"><Inlines parts={item} /></li>
              ))}
            </ul>
          );
        }
        return (
          <p key={i}>
            {block.lines.map((line, j) => (
              <span key={j} className="block"><Inlines parts={line} /></span>
            ))}
          </p>
        );
      })}
    </div>
  );
}
