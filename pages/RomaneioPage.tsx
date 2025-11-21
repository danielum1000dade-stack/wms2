
import React, { useState, useMemo } from 'react';
import { useWMS } from '../context/WMSContext';
import RomaneioDescarga from '../components/RomaneioDescarga';
import { Recebimento } from '../types';

const RomaneioPage: React.FC = () => {
    const { recebimentos } = useWMS();
    const [selectedRecebimentoId, setSelectedRecebimentoId] = useState<string>('');

    const selectedRecebimento = useMemo(() => {
        return recebimentos.find(r => r.id === selectedRecebimentoId) || null;
    }, [selectedRecebimentoId, recebimentos]);

    if (selectedRecebimento) {
        return <RomaneioDescarga recebimento={selectedRecebimento} onBack={() => setSelectedRecebimentoId('')} />;
    }

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-gray-900">Gerar Romaneio de Descarga</h1>
            <div className="bg-white p-6 rounded-lg shadow-md">
                <div className="space-y-4">
                    <h2 className="text-xl font-bold text-gray-800">Selecionar Recebimento</h2>
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                        <label htmlFor="recebimento-select" className="block text-sm font-medium text-gray-700 mb-2">
                            Selecione um Recebimento para gerar o relatório:
                        </label>
                        <select
                            id="recebimento-select"
                            value={selectedRecebimentoId}
                            onChange={(e) => setSelectedRecebimentoId(e.target.value)}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm py-2 px-3 bg-white focus:border-indigo-500 focus:ring-indigo-500"
                        >
                            <option value="" disabled>-- Escolha um recebimento --</option>
                            {recebimentos
                                .sort((a, b) => new Date(b.dataHoraChegada).getTime() - new Date(a.dataHoraChegada).getTime())
                                .map(r => (
                                    <option key={r.id} value={r.id}>
                                        NF: {r.notaFiscal} - Placa: {r.placaVeiculo} ({new Date(r.dataHoraChegada).toLocaleDateString()})
                                    </option>
                            ))}
                        </select>
                    </div>
                    {recebimentos.length === 0 && (
                        <p className="text-center text-gray-500 mt-4">Nenhum recebimento cadastrado ainda.</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default RomaneioPage;
