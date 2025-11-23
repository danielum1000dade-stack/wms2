
import React, { useState } from 'react';
import { useWMS } from '../context/WMSContext';
import { Recebimento, Divergencia, DivergenciaTipo, SKU } from '../types';
import Modal from './Modal';
import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import SKUModal from './SKUModal';

interface DivergenciaModalProps {
    recebimento: Recebimento;
    onClose: () => void;
}

const DivergenciaModal: React.FC<DivergenciaModalProps> = ({ recebimento, onClose }) => {
    // FIX: Added `industrias` and `tiposBloqueio` to context destructuring to pass to SKUModal.
    const { 
        skus,
        addSku, 
        getDivergenciasByRecebimento, 
        addDivergencia, 
        deleteDivergencia, 
        updateRecebimento,
        industrias,
        tiposBloqueio
    } = useWMS();
    
    const divergenciasAtuais = getDivergenciasByRecebimento(recebimento.id);

    const [newDivergencia, setNewDivergencia] = useState<Omit<Divergencia, 'id' | 'recebimentoId'>>({
        skuId: '',
        tipo: DivergenciaTipo.AVARIA,
        quantidade: 1,
        observacao: ''
    });

    const [skuInput, setSkuInput] = useState('');
    const [foundSku, setFoundSku] = useState<SKU | null>(null);
    const [skuError, setSkuError] = useState('');
    const [isSkuModalOpen, setIsSkuModalOpen] = useState(false);

    const handleNewDivergenciaChange = (field: keyof Omit<Divergencia, 'id' | 'recebimentoId'>, value: any) => {
        setNewDivergencia(prev => ({ ...prev, [field]: field === 'quantidade' ? parseInt(value, 10) : value }));
    };
    
    const handleSkuInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setSkuInput(value);
        setFoundSku(null);
        setSkuError('');
        handleNewDivergenciaChange('skuId', '');
    };

    const handleSkuBlur = () => {
        if (!skuInput) return;
        const sku = skus.find(s => String(s.sku).toLowerCase() === skuInput.toLowerCase());
        if (sku) {
            setFoundSku(sku);
            setSkuError('');
            handleNewDivergenciaChange('skuId', sku.id);
        } else {
            setFoundSku(null);
            setSkuError('SKU não encontrado.');
            handleNewDivergenciaChange('skuId', '');
        }
    };

    const handleSaveNewSku = (newSkuData: Omit<SKU, 'id'>) => {
        const newSku = addSku(newSkuData);
        setSkuInput(newSku.sku);
        setFoundSku(newSku);
        setSkuError('');
        handleNewDivergenciaChange('skuId', newSku.id);
        setIsSkuModalOpen(false);
    };

    const handleAddDivergencia = async () => {
        if (!newDivergencia.skuId || newDivergencia.quantidade <= 0) {
            alert('Por favor, forneça um SKU válido e uma quantidade.');
            return;
        }
        await addDivergencia({ ...newDivergencia, recebimentoId: recebimento.id });
        
        if (!recebimento.houveAvarias) {
            await updateRecebimento({ ...recebimento, houveAvarias: true });
        }

        // Reset form
        setNewDivergencia({
            skuId: '',
            tipo: DivergenciaTipo.AVARIA,
            quantidade: 1,
            observacao: ''
        });
        setSkuInput('');
        setFoundSku(null);
        setSkuError('');
    };

    const handleDelete = async (id: string) => {
        await deleteDivergencia(id);
        const remainingDivergencias = divergenciasAtuais.filter(d => d.id !== id);
        if (remainingDivergencias.length === 1 && recebimento.houveAvarias) {
             if (divergenciasAtuais.length -1 === 0) {
                 await updateRecebimento({ ...recebimento, houveAvarias: false });
             }
        }
    };

    return (
        <>
        <Modal title={`Gerenciar Divergências - NF ${recebimento.notaFiscal}`} onClose={onClose}>
            <div className="space-y-4">
                {/* List of existing divergencias */}
                <div>
                    <h4 className="text-md font-medium text-gray-800 mb-2">Divergências Registradas</h4>
                    <div className="space-y-2 max-h-48 overflow-y-auto border p-2 rounded-md">
                        {divergenciasAtuais.length > 0 ? divergenciasAtuais.map(div => {
                             const sku = skus.find(s => s.id === div.skuId);
                             return (
                                <div key={div.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                                    <div>
                                        <p className="font-semibold">{div.tipo}: {div.quantidade}x {sku?.sku || 'SKU não encontrado'}</p>
                                        <p className="text-sm text-gray-600">{sku?.descritivo}</p>
                                        {div.observacao && <p className="text-xs text-gray-500 italic">Obs: {div.observacao}</p>}
                                    </div>
                                    <button onClick={() => handleDelete(div.id)} className="text-red-500 hover:text-red-700">
                                        <TrashIcon className="h-5 w-5"/>
                                    </button>
                                </div>
                             )
                        }) : <p className="text-sm text-gray-500 text-center py-2">Nenhuma divergência registrada.</p>}
                    </div>
                </div>

                {/* Form to add new divergencia */}
                <div className="border-t pt-4">
                    <h4 className="text-md font-medium text-gray-800 mb-2">Adicionar Nova Divergência</h4>
                    <div className="grid grid-cols-12 gap-2 items-start p-2 bg-gray-50 rounded-md border">
                        <div className="col-span-12 md:col-span-2">
                            <label className="text-xs text-gray-600">Tipo</label>
                            <select value={newDivergencia.tipo} onChange={(e) => handleNewDivergenciaChange('tipo', e.target.value)} className="w-full text-sm rounded-md border-gray-300 shadow-sm p-1">
                                {Object.values(DivergenciaTipo).map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                        </div>
                        <div className="col-span-12 md:col-span-4">
                            <label className="text-xs text-gray-600">SKU</label>
                            <input
                                type="text"
                                value={skuInput}
                                onChange={handleSkuInputChange}
                                onBlur={handleSkuBlur}
                                placeholder="Digite o código do SKU"
                                className="w-full text-sm rounded-md border-gray-300 shadow-sm p-1"
                            />
                            {foundSku && (
                                <p className="text-xs text-green-700 mt-1">
                                    ✓ {foundSku.descritivo}
                                </p>
                            )}
                            {skuError && (
                                <div className="flex items-center justify-between mt-1">
                                    <p className="text-xs text-red-700">{skuError}</p>
                                    <button 
                                        type="button" 
                                        onClick={() => setIsSkuModalOpen(true)} 
                                        className="text-xs font-medium text-indigo-600 hover:text-indigo-500"
                                    >
                                        Cadastrar
                                    </button>
                                </div>
                            )}
                        </div>
                        <div className="col-span-6 md:col-span-2">
                             <label className="text-xs text-gray-600">Qtd.</label>
                             <input type="number" min="1" value={newDivergencia.quantidade} onChange={(e) => handleNewDivergenciaChange('quantidade', e.target.value)} className="w-full text-sm rounded-md border-gray-300 shadow-sm p-1" />
                        </div>
                        <div className="col-span-6 md:col-span-4">
                             <label className="text-xs text-gray-600">Observação</label>
                             <input type="text" value={newDivergencia.observacao || ''} onChange={(e) => handleNewDivergenciaChange('observacao', e.target.value)} className="w-full text-sm rounded-md border-gray-300 shadow-sm p-1" />
                        </div>
                    </div>
                     <div className="text-right mt-2">
                        <button onClick={handleAddDivergencia} className="flex items-center justify-center bg-blue-500 text-white px-3 py-2 rounded-md hover:bg-blue-600 text-sm ml-auto">
                            <PlusIcon className="h-4 w-4 mr-1" /> Adicionar
                        </button>
                    </div>
                </div>
                 <div className="flex justify-end space-x-2 pt-4 border-t mt-4">
                    <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">Fechar</button>
                </div>
            </div>
        </Modal>
        
        {isSkuModalOpen && (
            <SKUModal 
                sku={{ sku: skuInput }}
                onSave={handleSaveNewSku}
                onClose={() => setIsSkuModalOpen(false)}
                // FIX: Passed missing `industrias` and `tiposBloqueio` props.
                industrias={industrias}
                tiposBloqueio={tiposBloqueio}
            />
        )}
        </>
    )
};

export default DivergenciaModal;