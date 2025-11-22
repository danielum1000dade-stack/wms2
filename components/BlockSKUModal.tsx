import React, { useState } from 'react';
import { SKU, SKUStatus } from '../types';

interface BlockSKUModalProps {
    sku: SKU;
    onSave: (sku: SKU) => void;
    onClose: () => void;
}

const BlockSKUModal: React.FC<BlockSKUModalProps> = ({ sku, onSave, onClose }) => {
    const [status, setStatus] = useState<SKUStatus>(sku.status);
    const [motivo, setMotivo] = useState(sku.motivoBloqueio || '');
    const [error, setError] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (status === SKUStatus.BLOQUEADO && !motivo.trim()) {
            setError('O motivo do bloqueio é obrigatório.');
            return;
        }

        onSave({
            ...sku,
            status,
            motivoBloqueio: status === SKUStatus.BLOQUEADO ? motivo.trim() : '',
        });
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
                <h3 className="text-lg font-medium leading-6 text-gray-900 mb-2">Alterar Status do SKU</h3>
                <p className="text-sm text-gray-600 mb-4">{sku.sku} - {sku.descritivo}</p>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="status" className="block text-sm font-medium text-gray-700">Status</label>
                        <select
                            id="status"
                            value={status}
                            onChange={(e) => setStatus(e.target.value as SKUStatus)}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm py-2 px-3 bg-white"
                        >
                            <option value={SKUStatus.ATIVO}>Ativo</option>
                            <option value={SKUStatus.BLOQUEADO}>Bloqueado</option>
                        </select>
                    </div>

                    {status === SKUStatus.BLOQUEADO && (
                        <div>
                            <label htmlFor="motivo" className="block text-sm font-medium text-gray-700">Motivo do Bloqueio</label>
                            <textarea
                                id="motivo"
                                value={motivo}
                                onChange={(e) => setMotivo(e.target.value)}
                                rows={3}
                                required
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm py-2 px-3"
                            />
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

export default BlockSKUModal;
