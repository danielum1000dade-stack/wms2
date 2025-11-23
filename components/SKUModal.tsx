
import React, { useState } from 'react';
import { SKU, Industria, SKUStatus, TipoBloqueio, BloqueioAplicaA } from '../types';

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
        totalCaixas: sku?.totalCaixas || 0,
        tempoVida: sku?.tempoVida || 0,
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
        industriaId: sku?.industriaId || '',
        status: sku?.status || SKUStatus.ATIVO,
        motivoBloqueio: sku?.motivoBloqueio || '',
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
        onSave(formData);
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
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Total Caixas/Pallet</label>
                            <input type="number" name="totalCaixas" value={formData.totalCaixas} onChange={handleChange} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm py-2 px-3"/>
                        </div>
                         <div>
                            <label className="block text-sm font-medium text-gray-700">Tempo de Vida (dias)</label>
                            <input type="number" name="tempoVida" value={formData.tempoVida} onChange={handleChange} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm py-2 px-3"/>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Peso (kg)</label>
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
                    <div>
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
