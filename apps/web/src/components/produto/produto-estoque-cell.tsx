type Props = { atual: number; minimo: number };

export function ProdutoEstoqueCell({ atual, minimo }: Props) {
  const sem = atual === 0;
  const baixo = !sem && atual <= minimo;
  const ok = !sem && !baixo;

  return (
    <span className={`font-medium tabular-nums ${
      sem ? 'text-red-400' : baixo ? 'text-amber-400' : 'text-green-400'
    }`}>
      {atual}
      {sem && <span className="ml-1.5 text-[10px] font-semibold uppercase tracking-wide">sem estoque</span>}
      {baixo && <span className="ml-1.5 text-[10px] font-semibold uppercase tracking-wide">baixo</span>}
      {ok && <span className="ml-1.5 text-[10px] font-semibold uppercase tracking-wide text-green-500">ok</span>}
    </span>
  );
}
