'use client';

import { useState, useEffect, useRef } from 'react';
import { X, Plus, Trash2, Camera } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { apiClient } from '@/lib/api-client';
import { toast } from 'sonner';
import type { ProdutoListItem } from '@/hooks/use-produto-list';
import { ScannerInput } from '@/components/scanner/scanner-input';

const BASE_URL = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:3001/api/v1';

const CATEGORIAS = [
  { value: 'MOT', label: 'Motor' },
  { value: 'FRE', label: 'Freio' },
  { value: 'TRA', label: 'Transmissão' },
  { value: 'ELE', label: 'Elétrica' },
  { value: 'SUS', label: 'Suspensão' },
  { value: 'PNE', label: 'Pneu / Câmara' },
  { value: 'ACC', label: 'Acessórios' },
  { value: 'OUT', label: 'Outros' },
];

const UNIDADES = [
  { value: 'UN', label: 'Unidade' },
  { value: 'CX', label: 'Caixa' },
  { value: 'PC', label: 'Peça' },
  { value: 'KG', label: 'Quilograma' },
  { value: 'L', label: 'Litro' },
];

const FIELD = 'w-full rounded-lg border border-white/10 bg-slate-800 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500';
const SELECT = FIELD + ' cursor-pointer';

type ProdutoDetalhe = {
  id: string; sku: string; nome: string; descricao: string | null;
  categoria: string; unidade: string; marca: string | null;
  aplicacao: string | null; localizacao: string | null;
  estoqueMinimo: number; precoVenda: number | null;
  codigosBarras: string[]; fotoUrl: string | null;
};

interface Props {
  produto?: ProdutoListItem;
  onClose: () => void;
  onSaved: () => void;
}

function parseMoeda(v: FormDataEntryValue | null): number {
  if (!v) return 0;
  return Number(String(v).replace(/\./g, '').replace(',', '.')) || 0;
}

function formatMoeda(v: string): string {
  const digits = v.replace(/\D/g, '');
  if (!digits) return '';
  const num = parseInt(digits, 10);
  return (num / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function ProdutoFormModal({ produto, onClose, onSaved }: Props) {
  const isEdit = !!produto;
  const [saving, setSaving] = useState(false);
  const [detalhe, setDetalhe] = useState<ProdutoDetalhe | null>(null);
  const [loadingDetalhe, setLoadingDetalhe] = useState(isEdit);
  const [codigosBarras, setCodigosBarras] = useState<string[]>([]);
  const [novoCodigo, setNovoCodigo] = useState('');
  const [fotoUrl, setFotoUrl] = useState<string | null>(null);
  const [uploadandoFoto, setUploadandoFoto] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isEdit || !produto) return;
    setLoadingDetalhe(true);
    apiClient.get<ProdutoDetalhe>(`/produtos/${produto.id}`)
      .then((d) => {
        setDetalhe(d);
        setCodigosBarras(d.codigosBarras);
        setFotoUrl(d.fotoUrl ?? null);
      })
      .catch(() => toast.error('Erro ao carregar produto'))
      .finally(() => setLoadingDetalhe(false));
  }, [isEdit, produto]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);

    const codigosFinais = [...codigosBarras];
    if (novoCodigo.trim()) {
      const v = novoCodigo.trim();
      if (!codigosFinais.includes(v)) codigosFinais.push(v);
      setCodigosBarras(codigosFinais);
      setNovoCodigo('');
    }

    if (codigosFinais.length === 0) {
      toast.error('Adicione pelo menos um código de barras');
      return;
    }

    setSaving(true);
    try {
      if (isEdit) {
        const body: Record<string, unknown> = {
          nome: fd.get('nome'),
          unidade: fd.get('unidade'),
          descricao: fd.get('descricao') || undefined,
          marca: fd.get('marca') || undefined,
          aplicacao: fd.get('aplicacao') || undefined,
          localizacao: fd.get('localizacao') || undefined,
          estoqueMinimo: Number(fd.get('estoqueMinimo') ?? 0),
          precoVenda: fd.get('precoVenda') ? parseMoeda(fd.get('precoVenda')) : null,
          codigosBarras: codigosFinais,
        };
        await apiClient.patch(`/produtos/${produto!.id}`, body);
        toast.success('Produto atualizado!');
      } else {
        const body: Record<string, unknown> = {
          nome: fd.get('nome'),
          categoria: fd.get('categoria'),
          unidade: fd.get('unidade'),
          descricao: fd.get('descricao') || undefined,
          marca: fd.get('marca') || undefined,
          aplicacao: fd.get('aplicacao') || undefined,
          localizacao: fd.get('localizacao') || undefined,
          estoqueMinimo: Number(fd.get('estoqueMinimo') ?? 0),
          estoqueInicial: Number(fd.get('estoqueInicial') ?? 0),
          custoUnitario: parseMoeda(fd.get('custoUnitario')),
          precoVenda: fd.get('precoVenda') ? parseMoeda(fd.get('precoVenda')) : undefined,
          codigosBarras: codigosFinais,
        };
        await apiClient.post('/produtos', body);
        toast.success('Produto criado com sucesso!');
      }
      onSaved();
      onClose();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Erro ao salvar produto');
    } finally {
      setSaving(false);
    }
  }

  async function handleFotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !produto) return;

    setUploadandoFoto(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch(`${BASE_URL}/produtos/${produto.id}/foto`, {
        method: 'POST',
        credentials: 'include',
        body: fd,
      });
      if (!res.ok) {
        const err = await res.json() as { message?: string };
        throw new Error(err.message ?? 'Erro ao enviar foto');
      }
      const { fotoUrl: novaFoto } = await res.json() as { fotoUrl: string };
      setFotoUrl(novaFoto);
      toast.success('Foto atualizada!');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Erro ao enviar foto');
    } finally {
      setUploadandoFoto(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  function addCodigo(codigo?: string) {
    const v = (codigo ?? novoCodigo).trim();
    if (v && !codigosBarras.includes(v)) {
      setCodigosBarras((prev) => [...prev, v]);
      setNovoCodigo('');
      toast.success(`Código ${v} adicionado`);
    } else if (v && codigosBarras.includes(v)) {
      toast.error('Código já cadastrado neste produto');
    }
  }

  const d = detalhe;
  const fotoSrc = fotoUrl ? `${BASE_URL.replace('/api/v1', '')}/uploads/${fotoUrl}` : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-white/10 bg-slate-900 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold text-white">
              {isEdit ? 'Editar Produto' : 'Novo Produto'}
            </h2>
            {isEdit && produto && (
              <p className="text-xs text-slate-500 mt-0.5">{produto.sku}</p>
            )}
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-white/5 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        {loadingDetalhe ? (
          <div className="flex items-center justify-center py-16 text-slate-500 text-sm">
            Carregando...
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5 px-6 py-5">

            {/* Foto — só em edição */}
            {isEdit && (
              <div className="flex items-center gap-4">
                <div className="relative h-20 w-20 flex-shrink-0 rounded-xl border border-white/10 bg-slate-800 overflow-hidden">
                  {fotoSrc ? (
                    <img src={fotoSrc} alt="Foto do produto" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-slate-600">
                      <Camera className="h-7 w-7" />
                    </div>
                  )}
                </div>
                <div>
                  <p className="text-xs text-slate-400 mb-1.5">Foto do produto</p>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadandoFoto}
                    className="rounded-lg border border-white/10 bg-slate-800 px-3 py-1.5 text-xs text-slate-300 hover:bg-white/5 disabled:opacity-50 transition-colors"
                  >
                    {uploadandoFoto ? 'Enviando...' : fotoSrc ? 'Trocar foto' : 'Adicionar foto'}
                  </button>
                  <p className="mt-1 text-[11px] text-slate-600">JPG, PNG ou WebP · máx 2MB</p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".jpg,.jpeg,.png,.webp"
                    onChange={handleFotoChange}
                    className="hidden"
                  />
                </div>
              </div>
            )}

            {/* Nome */}
            <div className="space-y-1.5">
              <Label className="text-slate-300">Nome *</Label>
              <input
                name="nome" required minLength={2} maxLength={200}
                defaultValue={d?.nome ?? ''}
                placeholder="Ex: Pastilha de freio dianteira"
                className={FIELD}
              />
            </div>

            {/* Categoria + Unidade */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-slate-300">Categoria *</Label>
                {isEdit ? (
                  <div className="space-y-1.5">
                    <input value={produto!.categoria} disabled className={FIELD + ' opacity-50 cursor-not-allowed'} />
                    <p className="text-xs text-amber-500/80">A categoria não pode ser alterada após a criação (define o SKU)</p>
                  </div>
                ) : (
                  <select name="categoria" required className={SELECT}>
                    <option value="">Selecione...</option>
                    {CATEGORIAS.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                )}
              </div>
              <div className="space-y-1.5">
                <Label className="text-slate-300">Unidade *</Label>
                <select name="unidade" required className={SELECT} defaultValue={d?.unidade ?? ''}>
                  <option value="">Selecione...</option>
                  {UNIDADES.map((u) => <option key={u.value} value={u.value}>{u.label}</option>)}
                </select>
              </div>
            </div>

            {/* Marca + Localização */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-slate-300">Marca</Label>
                <input name="marca" maxLength={100} defaultValue={d?.marca ?? ''} placeholder="Ex: Brembo" className={FIELD} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-slate-300">Localização</Label>
                <input name="localizacao" maxLength={50} defaultValue={d?.localizacao ?? ''} placeholder="Ex: A-02-3" className={FIELD} />
              </div>
            </div>

            {/* Aplicação */}
            <div className="space-y-1.5">
              <Label className="text-slate-300">Aplicação</Label>
              <input name="aplicacao" maxLength={500} defaultValue={d?.aplicacao ?? ''} placeholder="Ex: CG 150 2010-2015, Titan 150 2012-2016" className={FIELD} />
            </div>

            {/* Descrição */}
            <div className="space-y-1.5">
              <Label className="text-slate-300">Descrição</Label>
              <textarea name="descricao" maxLength={1000} rows={2} defaultValue={d?.descricao ?? ''} placeholder="Detalhes adicionais..." className={FIELD + ' resize-none'} />
            </div>

            {/* Estoque mínimo + inicial (só create) + preço */}
            <div className={`grid gap-4 ${isEdit ? 'grid-cols-2' : 'grid-cols-2'}`}>
              <div className="space-y-1.5">
                <Label className="text-slate-300">Estoque mínimo</Label>
                <Input name="estoqueMinimo" type="number" min={0} defaultValue={d?.estoqueMinimo ?? 0} className="border-white/10 bg-slate-800 text-white" />
              </div>
              {!isEdit && (
                <div className="space-y-1.5">
                  <Label className="text-slate-300">Estoque inicial</Label>
                  <Input name="estoqueInicial" type="number" min={0} defaultValue={0} className="border-white/10 bg-slate-800 text-white" />
                  <p className="text-xs text-slate-500">Gera movimentação de entrada</p>
                </div>
              )}
              {!isEdit && (
                <div className="space-y-1.5">
                  <Label className="text-slate-300">Custo unitário (R$)</Label>
                  <input
                    name="custoUnitario"
                    defaultValue="0"
                    placeholder="Ex: 5.000,00"
                    className={FIELD}
                    onChange={(e) => { e.target.value = formatMoeda(e.target.value); }}
                  />
                  <p className="text-xs text-slate-500">Define o custo médio inicial</p>
                </div>
              )}
              <div className="space-y-1.5">
                <Label className="text-slate-300">Preço de venda (R$)</Label>
                <input
                  name="precoVenda"
                  defaultValue={d?.precoVenda ? formatMoeda(String(d.precoVenda).replace('.', ',')) : ''}
                  placeholder="Ex: 9.990,00"
                  className={FIELD}
                  onChange={(e) => { e.target.value = formatMoeda(e.target.value); }}
                />
              </div>
            </div>

            {/* Códigos de barras */}
            <div className="space-y-2">
              <Label className="text-slate-300">Códigos de barras <span className="text-red-400">*</span></Label>
              <ScannerInput
                onScan={(codigo) => addCodigo(codigo)}
                placeholder="Escanear ou digitar código de barras..."
              />
              <div className="flex gap-2">
                <input
                  value={novoCodigo}
                  onChange={(e) => setNovoCodigo(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addCodigo(); } }}
                  placeholder="Ou digitar manualmente e pressionar Enter"
                  className={FIELD}
                />
                <button type="button" onClick={() => addCodigo()} className="rounded-lg border border-white/10 bg-slate-800 px-3 text-slate-300 hover:bg-white/5">
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              {codigosBarras.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {codigosBarras.map((c) => (
                    <span key={c} className="flex items-center gap-1 rounded-full bg-slate-800 px-3 py-1 text-xs text-slate-300">
                      {c}
                      <button type="button" onClick={() => setCodigosBarras((prev) => prev.filter((x) => x !== c))}>
                        <Trash2 className="h-3 w-3 text-slate-500 hover:text-red-400" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-3 border-t border-white/10 pt-4">
              <Button type="button" variant="ghost" onClick={onClose} className="text-slate-400 hover:text-white">
                Cancelar
              </Button>
              <Button type="submit" disabled={saving} className="bg-orange-500 hover:bg-orange-600 text-white">
                {saving ? 'Salvando...' : isEdit ? 'Salvar alterações' : 'Criar produto'}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
