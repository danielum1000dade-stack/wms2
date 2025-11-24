
import React, { useState } from 'react';
import { SKU, Industria, SKUStatus, TipoBloqueio, BloqueioAplicaA, CategoriaProduto, SetorArmazem } from '../types';

interface SKUModalProps {
    sku: Partial<SKU>;
    onSave: (data: Omit<SKU, 'id'>) => void;
    onClose: () => void;
    industrias: Industria[];
    tiposBloqueio: TipoBloqueio[];
}

const SKUModal: React.FC<SKUModalProps> = ({ sku, onSave, onClose, industrias, tiposBloqueio }) => {
     const [formData, setFormData] = useState({
        sku: sku?.sku || '',
        descritivo: sku?.descritivo || '',
        unidadeMedida: sku?.unidadeMedida || 'CX',
        totalCaixas: sku?.totalCaixas || 0,
        tempoVida: sku?.tempoVida || 0,
        shelfLifeMinimoRecebimento: sku?.shelfLifeMinimoRecebimento || 0,
        peso: sku?.peso || 0,
        qtdPorCamada: sku?.qtdPorCamada || 0,
        camadaPorLastro: sku?.camadaPorLastro || 0,
        sre1: sku?.sre1 || '',
        sre2: sku?.sre2 || '',
        sre3: sku?.sre3 || '',
        sre4: sku?.sre4 || '',
        sre5: sku?.sre5 || '',
        classificacao: sku?.classificacao || '',
        familia: sku?.familia || '',
        categoria: sku?.categoria || CategoriaProduto.GERAL,
        setor: sku?.setor || SetorArmazem.SECO,
        industriaId: sku?.industriaId || '',
        status: sku?.status || SKUStatus.ATIVO,
        motivoBloqueio: sku?.motivoBloqueio || '',
        
        // Dimensions flattened for form
        dim_altura: sku?.dimensoes?.altura || 0,
        dim_largura: sku?.dimensoes?.largura || 0,
        dim_comprimento: sku?.dimensoes?.comprimento || 0,
        dim_pesoBruto: sku?.dimensoes?.pesoBruto || 0,
        dim_volumeM3: sku?.dimensoes?.volumeM3 || 0,
    });

    const tiposBloqueioParaSku = tiposBloqueio.filter(tb => tb.aplicaA.includes(BloqueioAplicaA.SKU));

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;

        setFormData(prev => {
            const updated = { ...prev, [name]: type === 'number' ? parseFloat(value) : value };
            if (name === 'status' && value === SKUStatus.ATIVO) {
                updated.motivoBloqueio = '';
            }
            return updated;
        });
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        const { 
            dim_altura, dim_largura, dim_comprimento, dim_pesoBruto, dim_volumeM3, 
            ...rest 
        } = formData;

        const skuToSave: Omit<SKU, 'id'> = {
            ...rest,
            dimensoes: {
                altura: dim_altura,
                largura: dim_largura,
                comprimento: dim_comprimento,
                pesoBruto: dim_pesoBruto,
                volumeM3: dim_volumeM3
            }
        };

        onSave(skuToSave);
    }

     return (
         <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">{sku?.id ? 'Editar' : 'Novo'} SKU</h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">SKU</label>
                            <input type="text" name="sku" value={formData.sku} onChange={handleChange} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm py-2 px-3"/>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Descritivo</label>
                            <input type="text" name="descritivo" value={formData.descritivo} onChange={handleChange} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm py-2 px-3"/>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Unidade de Medida</label>
                            <select name="unidadeMedida" value={formData.unidadeMedida} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm py-2 px-3 bg-white">
                                <option value="CX">Caixa (CX)</option>
                                <option value="UN">Unidade (UN)</option>
                                <option value="KG">Quilo (KG)</option>
                                <option value="L">Litro (L)</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Categoria (Segurança)</label>
                            <select name="categoria" value={formData.categoria} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm py-2 px-3 bg-white">
                                {Object.values(CategoriaProduto).map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Setor de Armazenagem</label>
                            <select name="setor" value={formData.setor} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm py-2 px-3 bg-white">
                                {Object.values(SetorArmazem).map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>
                         <div>
                            <label className="block text-sm font-medium text-gray-700">Classificação</label>
                            <input type="text" name="classificacao" value={formData.classificacao} onChange={handleChange} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm py-2 px-3"/>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Família</label>
                            <input type="text" name="familia" value={formData.familia} onChange={handleChange} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm py-2 px-3"/>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Indústria / Proprietário</label>
                            <select name="industriaId" value={formData.industriaId} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm py-2 px-3 bg-white">
                                <option value="">Nenhuma</option>
                                {industrias.map(i => <option key={i.id} value={i.id}>{i.nome}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Status</label>
                            <select name="status" value={formData.status} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm py-2 px-3 bg-white">
                                {Object.values(SKUStatus).map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>
                        {formData.status === SKUStatus.BLOQUEADO && (
                             <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700">Motivo do Bloqueio</label>
                                <select name="motivoBloqueio" value={formData.motivoBloqueio} onChange={handleChange} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm py-2 px-3 bg-white">
                                    <option value="" disabled>Selecione um motivo...</option>
                                    {tiposBloqueioParaSku.map(tb => (
                                        <option key={tb.id} value={tb.id} title={tb.descricao}>{tb.codigo} - {tb.descricao}</option>
                                    ))}
                                </select>
                            </div>
                        )}
                    </div>

                    {/* Dimensions & Logistics */}
                    <div className="pt-4 border-t">
                        <h4 className="text-md font-medium text-gray-800 mb-2">Dados Logísticos e Dimensões</h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Total Caixas/Pallet</label>
                                <input type="number" name="totalCaixas" value={formData.totalCaixas} onChange={handleChange} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm py-2 px-3"/>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Peso Pallet (kg)</label>
                                <input type="number" name="peso" value={formData.peso} onChange={handleChange} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm py-2 px-3"/>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Qtd por Camada</label>
                                <input type="number" name="qtdPorCamada" value={formData.qtdPorCamada} onChange={handleChange} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm py-2 px-3"/>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Camada por Lastro</label>
                                <input type="number" name="camadaPorLastro" value={formData.camadaPorLastro} onChange={handleChange} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm py-2 px-3"/>
                            </div>
                        </div>
                         <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-2">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Altura (cm)</label>
                                <input type="number" name="dim_altura" value={formData.dim_altura} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm py-2 px-3"/>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Largura (cm)</label>
                                <input type="number" name="dim_largura" value={formData.dim_largura} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm py-2 px-3"/>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Comprimento (cm)</label>
                                <input type="number" name="dim_comprimento" value={formData.dim_comprimento} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm py-2 px-3"/>
                            </div>
                             <div>
                                <label className="block text-sm font-medium text-gray-700">Peso Bruto Un. (kg)</label>
                                <input type="number" name="dim_pesoBruto" value={formData.dim_pesoBruto} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm py-2 px-3"/>
                            </div>
                             <div>
                                <label className="block text-sm font-medium text-gray-700">Volume (m³)</label>
                                <input type="number" name="dim_volumeM3" value={formData.dim_volumeM3} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm py-2 px-3"/>
                            </div>
                        </div>
                    </div>

                     {/* Shelf Life */}
                    <div className="pt-4 border-t">
                        <h4 className="text-md font-medium text-gray-800 mb-2">Shelf Life (Validade)</h4>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Tempo de Vida Total (dias)</label>
                                <input type="number" name="tempoVida" value={formData.tempoVida} onChange={handleChange} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm py-2 px-3"/>
                            </div>
                             <div>
                                <label className="block text-sm font-medium text-gray-700">Mínimo para Recebimento (dias)</label>
                                <input type="number" name="shelfLifeMinimoRecebimento" value={formData.shelfLifeMinimoRecebimento} onChange={handleChange} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm py-2 px-3"/>
                            </div>
                        </div>
                    </div>

                    <div className="pt-4 border-t">
                         <h4 className="text-md font-medium text-gray-800">SRE (Regras de Armazenagem)</h4>
                         <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mt-2">
                             {([1,2,3,4,5] as const).map(i => (
                                <div key={i}>
                                    <label className="block text-sm font-medium text-gray-700">SRE {i}</label>
                                    <input type="text" name={`sre${i}`} value={formData[`sre${i}`]} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm py-2 px-3"/>
                                </div>
                             ))}
                         </div>
                    </div>
                     <div className="flex justify-end space-x-2 pt-4">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">Cancelar</button>
                        <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">Salvar</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default SKUModal;
