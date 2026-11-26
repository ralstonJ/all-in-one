import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

/** Renders SOP Markdown. Raw HTML in the source is not rendered. */
export function Markdown({ children }: { children: string }) {
  return (
    <div className="space-y-3 text-sm leading-relaxed text-slate-800">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: (p) => <h2 className="pt-2 text-lg font-semibold text-slate-900" {...p} />,
          h2: (p) => <h2 className="pt-2 text-base font-semibold text-slate-900" {...p} />,
          h3: (p) => <h3 className="pt-1 text-sm font-semibold text-slate-900" {...p} />,
          p: (p) => <p {...p} />,
          ul: ({ className, ...p }) => (
            <ul
              className={
                className?.includes("contains-task-list") ? "space-y-1" : "list-disc space-y-1 pl-5"
              }
              {...p}
            />
          ),
          ol: (p) => <ol className="list-decimal space-y-1 pl-5" {...p} />,
          li: ({ className, ...p }) => (
            <li className={className?.includes("task-list-item") ? "flex items-start gap-2" : ""} {...p} />
          ),
          input: (p) => <input {...p} disabled className="mt-1 h-4 w-4 accent-emerald-600" />,
          blockquote: (p) => (
            <blockquote className="rounded-r-lg border-l-4 border-amber-400 bg-amber-50 px-3 py-2 text-amber-900" {...p} />
          ),
          strong: (p) => <strong className="font-semibold text-slate-900" {...p} />,
          a: (p) => <a className="text-blue-600 underline" target="_blank" rel="noreferrer" {...p} />,
          code: (p) => <code className="rounded bg-slate-100 px-1 py-0.5 font-mono text-xs" {...p} />,
          table: (p) => <table className="w-full border-collapse text-left text-sm" {...p} />,
          th: (p) => <th className="border-b border-slate-200 py-1.5 pr-3 font-semibold" {...p} />,
          td: (p) => <td className="border-b border-slate-100 py-1.5 pr-3" {...p} />,
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}
