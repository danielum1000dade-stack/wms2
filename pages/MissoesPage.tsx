import React from 'react';
import { useWMS } from '../context/WMSContext';
import { Missao } from '../types';
import { CubeIcon, ArrowRightIcon, FlagIcon } from '@heroicons/react/24/outline';

const MissoesPage: React.FC = () => {
    const { missoes, skus, enderecos } = useWMS();

    const getStatusClass = (status: Missao['status']) => {
        switch (status) {
            case 'Pendente': return 'bg-yellow-100 text-yellow-800';
            case 'Em Andamento': return 'bg-blue-100 text-blue-800';
            case 'Concluída': return 'bg-green-100 text-green-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    }
    
    const sortedMissoes = [...missoes].sort((a,b) => {
        const statusOrder = { 'Pendente': 1, 'Em Andamento': 2, 'Concluída': 3 };
        return statusOrder[a.status] - statusOrder[b.status];
    });

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-gray-900">Missões Operacionais</h1>
             {sortedMissoes.length > 0 ? (
                <div className="space-y-4">
                    {sortedMissoes.map(missao => {
                        const sku = skus.find(s => s.id === missao.skuId);
                        const origem = enderecos.find(e => e.id === missao.origemId);
                        const destino = enderecos.find(e => e.id === missao.destinoId);

                        return (
                             <div key={missao.id} className="bg-white p-4 rounded-lg shadow-md border-l-4 border-indigo-500">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h2 className="text-lg font-bold text-gray-800">{missao.tipo}</h2>
                                        <p className="text-sm text-gray-500 font-mono">ID: {missao.id}</p>
                                    </div>
                                    <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getStatusClass(missao.status)}`}>
                                        {missao.status}
                                    </span>
                                </div>
                                <div className="mt-4 space-y-3">
                                    <div className="flex items-center">
                                        <CubeIcon className="h-6 w-6 text-gray-500 mr-3"/>
                                        <div>
                                            <p className="font-semibold">{sku?.descritivo || 'Produto não encontrado'}</p>
                                            <p className="text-sm text-gray-600">SKU: {sku?.sku} | Qtd: {missao.quantidade} caixas</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center text-sm">
                                        <FlagIcon className="h-5 w-5 text-red-500 mr-3"/>
                                        <span>De: <span className="font-semibold">{origem?.nome || 'Origem desconhecida'}</span></span>
                                        <ArrowRightIcon className="h-4 w-4 text-gray-400 mx-3"/>
                                         <FlagIcon className="h-5 w-5 text-green-500 mr-3"/>
                                        <span>Para: <span className="font-semibold">{destino?.nome || 'Destino desconhecido'}</span></span>
                                    </div>
                                </div>
                                 <div className="mt-4 pt-3 border-t flex justify-end">
                                     {missao.status === 'Pendente' && (
                                        <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
                                            Iniciar Missão
                                        </button>
                                     )}
                                      {missao.status === 'Em Andamento' && (
                                        <button className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700">
                                            Finalizar Missão
                                        </button>
                                     )}
                                </div>
                            </div>
                        )
                    })}
                </div>
             ) : (
                <div className="text-center py-10 bg-white rounded-lg shadow-md">
                    <CubeIcon className="mx-auto h-12 w-12 text-gray-400"/>
                    <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhuma missão pendente</h3>
                    <p className="mt-1 text-sm text-gray-500">
                        As missões de ressuprimento e picking aparecerão aqui quando forem criadas.
                    </p>
                </div>
            )}
        </div>
    );
};

export default MissoesPage;
