import { useState } from "react";

export default function ProjectModal({ scaffold }: { scaffold: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button className="btn" onClick={() => setOpen(true)}>
        View Project Plan
      </button>
      {open && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center">
          <div className="bg-white max-w-3xl w-full p-6 rounded-lg shadow">
            <pre className="whitespace-pre-wrap text-sm">{scaffold}</pre>
            <button className="btn mt-4" onClick={() => setOpen(false)}>
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
}
