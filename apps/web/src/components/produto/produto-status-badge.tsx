type Props = { ativo: boolean };

export function ProdutoStatusBadge({ ativo }: Props) {
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
      ativo ? 'bg-green-500/10 text-green-400' : 'bg-slate-500/10 text-slate-500'
    }`}>
      {ativo ? 'Ativo' : 'Inativo'}
    </span>
  );
}
