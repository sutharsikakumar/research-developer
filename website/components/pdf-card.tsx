export default function PdfCard(
  { paths, onSelect }:
  { paths: string[]; onSelect: (p: string) => void }
) {
  return (
    <div className="grid md:grid-cols-3 gap-4">
      {paths.map((p) => (
        <button
          key={p}
          onClick={() => onSelect(p)}
          className="border rounded p-2 hover:bg-gray-100 text-left"
        >
          {p.split("/").pop()}
        </button>
      ))}
    </div>
  );
}
