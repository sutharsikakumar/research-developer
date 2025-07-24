import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";

export default function CodeBlock({ code }: { code: string }) {
  if (!code) return null;
  return (
    <div className="mt-6">
      <h3 className="font-semibold mb-2">Starter code</h3>
      <SyntaxHighlighter language="python" wrapLongLines>
        {code}
      </SyntaxHighlighter>
      <a
        href="starter_project.py"
        download
        className="text-blue-600 underline mt-2 inline-block"
      >
        Download starter_project.py
      </a>
    </div>
  );
}
