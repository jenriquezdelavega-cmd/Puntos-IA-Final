export function ProofChips({ items }: { items: readonly string[] }) {
  return (
    <ul className="flex flex-wrap gap-2" aria-label="Pruebas clave">
      {items.map((item) => (
        <li
          key={item}
          className="rounded-full border border-[#e6d7f5] bg-white px-3 py-1.5 text-xs font-semibold text-[#5d437f] shadow-[0_4px_12px_rgba(90,64,137,0.08)]"
        >
          {item}
        </li>
      ))}
    </ul>
  );
}
