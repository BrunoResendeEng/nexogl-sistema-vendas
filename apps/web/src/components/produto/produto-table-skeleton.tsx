export function ProdutoTableSkeleton() {
  return (
    <table className="w-full">
      <thead>
        <tr className="border-b border-white/5">
          {['SKU', 'Nome', 'Categoria', 'Aplicação', 'Estoque', 'Mín.', 'Preço', 'Status', 'Ações'].map((h) => (
            <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody className="divide-y divide-white/5">
        {Array.from({ length: 8 }).map((_, i) => (
          <tr key={i}>
            {Array.from({ length: 9 }).map((_, j) => (
              <td key={j} className="px-4 py-3">
                <div className="h-4 animate-pulse rounded bg-white/5" style={{ width: j === 1 ? '140px' : '60px' }} />
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
