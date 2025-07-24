export default function IdeasList(
  { text, onSelect }:
  { text: string; onSelect: (n: string) => void }
) {
  const items = text
    .split("\n")
    .filter((l) => /^\d+\./.test(l.trim()));

  return (
    <ol className="space-y-2">
      {items.map((line) => {
        const num = line.match(/^(\d+)\./)![1];
        return (
          <li key={num} className="border rounded p-2">
            {line.slice(line.indexOf(".") + 1).trim()}
            <button
              onClick={() => onSelect(num)}
              className="float-right text-blue-600 underline"
            >
              Use
            </button>
          </li>
        );
      })}
    </ol>
  );
}
