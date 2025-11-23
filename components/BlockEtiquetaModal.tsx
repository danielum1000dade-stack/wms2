
import React, { useState } from 'react';
import { Etiqueta, TipoBloqueio, BloqueioAplicaA } from '../types';
import { useWMS } from '../context/WMSContext';

interface BlockEtiquetaModalProps {
    etiqueta: Etiqueta;
    onSave: (etiqueta: Etiqueta) => void;
    onClose: () => void;
    tiposBloqueio: TipoBloqueio[];
}

const BlockEtiquetaModal: React.FC<BlockEtiquetaModalProps> = ({ etiqueta, onSave, onClose, tiposBloqueio }) => {
    const { skus } = useWMS();
    const sku = skus.find(s => s.id === etiqueta.skuId);

    const [isBlocked, setIsBlocked] = useState(etiqueta.isBlocked || false);
    const [motivo, setMotivo] = useState(etiqueta.motivoBloqueio || '');
    const [error, setError] = useState('');

    const tiposBloqueioParaPallet = tiposBloqueio.filter(tb => tb.aplicaA.includes(BloqueioAplicaA.PALLET));

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (isBlocked && !motivo.trim()) {
            setError('O motivo do bloqueio é obrigatório.');
            return;
        }

        onSave({
            ...etiqueta,
            isBlocked,
            motivoBloqueio: isBlocked ? motivo.trim() : '',
        });
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
                <h3 className="text-lg font-medium leading-6 text-gray-900 mb-2">Alterar Status do Pallet</h3>
                <div className="mb-4 bg-gray-50 p-2 rounded border">
                    <p className="text-sm font-semibold text-gray-800 font-mono">{etiqueta.id}</p>
                    <p className="text-sm text-gray-600">{sku?.sku} - {sku?.descritivo}</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="status" className="block text-sm font-medium text-gray-700">Status do Pallet</label>
                        <select
                            id="status"
                            value={isBlocked ? 'bloqueado' : 'liberado'}
                            onChange={(e) => setIsBlocked(e.target.value === 'bloqueado')}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm py-2 px-3 bg-white"
                        >
                            <option value="liberado">Liberado</option>
                            <option value="bloqueado">Bloqueado</option>
                        </select>
                    </div>

                    {isBlocked && (
                        <div>
                            <label htmlFor="motivo" className="block text-sm font-medium text-gray-700">Motivo do Bloqueio</label>
                            <select
                                id="motivo"
                                value={motivo}
                                onChange={(e) => setMotivo(e.target.value)}
                                required
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm py-2 px-3 bg-white"
                            >
                                <option value="" disabled>Selecione um motivo...</option>
                                {tiposBloqueioParaPallet.map(tb => (
                                     <option key={tb.id} value={tb.id} title={tb.descricao}>{tb.codigo} - {tb.descricao}</option>
                                ))}
                            </select>
                        </div>
                    )}
                    
                    {error && <p className="text-sm text-red-600">{error}</p>}

                    <div className="flex justify-end space-x-2 pt-4 border-t">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">
                            Cancelar
                        </button>
                        <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">
                            Salvar
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default BlockEtiquetaModal;
