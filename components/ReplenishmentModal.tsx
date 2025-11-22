import React, { useState, useMemo } from 'react';
import { useWMS } from '../context/WMSContext';
import { Etiqueta, Endereco, EnderecoTipo, EnderecoStatus, MissaoTipo, SKU } from '../types';

interface ReplenishmentModalProps {
    etiqueta: Etiqueta;
    onClose: () => void;
    onMissionCreated: () => void;
}

const ReplenishmentModal: React.FC<ReplenishmentModalProps> = ({ etiqueta, onClose, onMissionCreated }) => {
    // FIX: Destructured `etiquetas` from the `useWMS` hook to make it available for finding pallets in picking locations.
    const { skus, enderecos, createMission, etiquetas } = useWMS();
    
    const sourceSku = useMemo(() => skus.find(s => s.id === etiqueta.skuId), [skus, etiqueta.skuId]);
    const sourceEndereco = useMemo(() => enderecos.find(e => e.id === etiqueta.enderecoId), [enderecos, etiqueta.enderecoId]);

    const [quantidade, setQuantidade] = useState<number | ''>(etiqueta.quantidadeCaixas || '');
    const [destinoId, setDestinoId] = useState('');
    const [error, setError] = useState('');

    const availablePickingLocations = useMemo(() => {
        // WMS Logic: Prefer picking locations already containing the same SKU, otherwise, any empty picking location.
        const sameSkuPickingLocations = enderecos.filter(e => {
            const palletInLocation = etiquetas.find(et => et.enderecoId === e.id);
            return e.tipo === EnderecoTipo.PICKING && palletInLocation?.skuId === sourceSku?.id;
        });
        
        const emptyPickingLocations = enderecos.filter(e => 
            e.tipo === EnderecoTipo.PICKING && e.status === EnderecoStatus.LIVRE
        );

        // Combine and remove duplicates
        const combined = [...sameSkuPickingLocations, ...emptyPickingLocations];
        return Array.from(new Set(combined.map(e => e.id))).map(id => combined.find(e => e.id === id) as Endereco);
    // FIX: Added `etiquetas` to the dependency array to ensure the memoized value is recalculated when the list of etiquetas changes.
    }, [enderecos, etiquetas, sourceSku]);

    const handleConfirm = () => {
        setError('');
        if (!destinoId) {
            setError('Por favor, selecione um endereço de destino.');
            return;
        }
        if (quantidade === '' || quantidade <= 0 || quantidade > (etiqueta.quantidadeCaixas || 0)) {
            setError(`A quantidade deve ser entre 1 e ${etiqueta.quantidadeCaixas}.`);
            return;
        }
        if (!sourceSku || !sourceEndereco) {
            setError('Erro: não foi possível encontrar o SKU ou endereço de origem.');
            return;
        }

        createMission({
            tipo: MissaoTipo.REABASTECIMENTO,
            etiquetaId: etiqueta.id,
            skuId: sourceSku.id,
            quantidade,
            origemId: sourceEndereco.id,
            destinoId: destinoId,
        });

        onMissionCreated();
    };


    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-lg">
                <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">Criar Missão de Ressuprimento</h3>
                
                <div className="space-y-4">
                    <div className="bg-gray-50 p-3 rounded-md border">
                        <p className="text-sm font-medium text-gray-600">Produto</p>
                        <p className="font-semibold">{sourceSku?.sku} - {sourceSku?.descritivo}</p>
                        <p className="text-sm">Origem: <span className="font-semibold">{sourceEndereco?.nome}</span></p>
                        <p className="text-sm">Quantidade em Pallet: <span className="font-semibold">{etiqueta.quantidadeCaixas} caixas</span></p>
                    </div>

                    <div>
                        <label htmlFor="quantidade" className="block text-sm font-medium text-gray-700">Quantidade a Mover</label>
                        <input
                            type="number"
                            id="quantidade"
                            value={quantidade}
                            onChange={(e) => setQuantidade(e.target.value === '' ? '' : parseInt(e.target.value, 10))}
                            max={etiqueta.quantidadeCaixas}
                            min="1"
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm py-2 px-3"
                        />
                    </div>

                    <div>
                        <label htmlFor="destinoId" className="block text-sm font-medium text-gray-700">Endereço de Destino (Picking)</label>
                         <select
                            id="destinoId"
                            value={destinoId}
                            onChange={(e) => setDestinoId(e.target.value)}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm py-2 px-3 bg-white"
                        >
                            <option value="" disabled>Selecione um destino...</option>
                            {availablePickingLocations.length > 0 ? (
                                availablePickingLocations.map(e => (
                                    <option key={e.id} value={e.id}>{e.nome}</option>
                                ))
                            ) : (
                                <option value="" disabled>Nenhuma posição de picking livre encontrada</option>
                            )}
                        </select>
                    </div>

                    {error && <p className="text-red-500 text-sm">{error}</p>}
                </div>

                <div className="flex justify-end space-x-2 pt-4 mt-4 border-t">
                    <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">Cancelar</button>
                    <button 
                        type="button" 
                        onClick={handleConfirm}
                        disabled={availablePickingLocations.length === 0}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:bg-indigo-300 disabled:cursor-not-allowed"
                    >
                        Criar Missão
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ReplenishmentModal;