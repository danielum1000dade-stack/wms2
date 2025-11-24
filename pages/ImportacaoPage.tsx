
import React, { useState } from 'react';
import { useWMS } from '../context/WMSContext';
import { ImportTemplate } from '../types';
import { ArrowUpTrayIcon, CheckCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

declare const XLSX: any;

const ImportacaoPage: React.FC = () => {
    const { importTemplates, processImportFile, importLogs, industrias } = useWMS();
    
    const [selectedTemplateId, setSelectedTemplateId] = useState('');
    const [file, setFile] = useState<File | null>(null);
    const [previewData, setPreviewData] = useState<any[]>([]);
    const [simulationResult, setSimulationResult] = useState<any>(null);
    const [isProcessing, setIsProcessing] = useState(false);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const f = e.target.files?.[0];
        if (f) {
            setFile(f);
            // Read for preview
            const reader = new FileReader();
            reader.onload = (evt) => {
                const bstr = evt.target?.result;
                const wb = XLSX.read(bstr, { type: 'binary' });
                const wsname = wb.SheetNames[0];
                const ws = wb.Sheets[wsname];
                const data = XLSX.utils.sheet_to_json(ws);
                setPreviewData(data);
                setSimulationResult(null);
            };
            reader.readAsBinaryString(f);
        }
    };

    const handleSimulate = async () => {
        if (!file || !selectedTemplateId) return;
        const template = importTemplates.find(t => t.id === selectedTemplateId);
        if (!template) return;

        setIsProcessing(true);
        const result = await processImportFile(previewData, template, file.name, true);
        setSimulationResult(result);
        setIsProcessing(false);
    };

    const handleImport = async () => {
        if (!file || !selectedTemplateId) return;
        const template = importTemplates.find(t => t.id === selectedTemplateId);
        if (!template) return;

        if (confirm("Confirma a importação oficial destes dados?")) {
            setIsProcessing(true);
            const result = await processImportFile(previewData, template, file.name, false);
            if (result.success) {
                alert(`Importação concluída com sucesso! ${result.total} registros processados.`);
                setFile(null);
                setPreviewData([]);
                setSimulationResult(null);
                setSelectedTemplateId('');
            } else {
                alert("Erro na importação. Verifique os logs.");
            }
            setIsProcessing(false);
        }
    };

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-gray-900">Importação de Arquivos</h1>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Input Panel */}
                <div className="lg:col-span-1 bg-white p-6 rounded-lg shadow-md space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Selecione o Template</label>
                        <select 
                            value={selectedTemplateId} 
                            onChange={e => { setSelectedTemplateId(e.target.value); setSimulationResult(null); }}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm py-2 px-3 bg-white"
                        >
                            <option value="">Selecione...</option>
                            {importTemplates.filter(t => t.active).map(t => (
                                <option key={t.id} value={t.id}>{t.name}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Arquivo</label>
                        <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                            <div className="space-y-1 text-center">
                                <ArrowUpTrayIcon className="mx-auto h-12 w-12 text-gray-400" />
                                <div className="flex text-sm text-gray-600">
                                    <label className="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500">
                                        <span>Upload um arquivo</span>
                                        <input type="file" className="sr-only" onChange={handleFileChange} accept=".xlsx,.csv" />
                                    </label>
                                </div>
                                <p className="text-xs text-gray-500">XLSX, CSV</p>
                            </div>
                        </div>
                        {file && <p className="text-sm text-gray-600 mt-2 text-center">Selecionado: {file.name}</p>}
                    </div>

                    <div className="flex flex-col gap-2">
                        <button 
                            onClick={handleSimulate} 
                            disabled={!file || !selectedTemplateId || isProcessing}
                            className="w-full bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
                        >
                            {isProcessing ? 'Processando...' : 'Simular Importação'}
                        </button>
                        
                        {simulationResult?.success && (
                            <button 
                                onClick={handleImport} 
                                className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
                            >
                                Confirmar Importação
                            </button>
                        )}
                    </div>
                </div>

                {/* Result Panel */}
                <div className="lg:col-span-2 space-y-6">
                    {simulationResult && (
                        <div className={`p-4 rounded-lg border ${simulationResult.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                            <div className="flex items-center mb-2">
                                {simulationResult.success ? <CheckCircleIcon className="h-6 w-6 text-green-600 mr-2"/> : <ExclamationTriangleIcon className="h-6 w-6 text-red-600 mr-2"/>}
                                <h3 className={`font-bold text-lg ${simulationResult.success ? 'text-green-800' : 'text-red-800'}`}>
                                    Resultado da Simulação
                                </h3>
                            </div>
                            <p className="mb-2">Registros lidos: {simulationResult.total}</p>
                            
                            {simulationResult.errors.length > 0 ? (
                                <div className="bg-white p-2 rounded border max-h-60 overflow-y-auto">
                                    <p className="font-bold text-red-600 mb-1">Erros Encontrados:</p>
                                    <ul className="list-disc pl-5 text-sm text-red-600">
                                        {simulationResult.errors.map((err: string, i: number) => (
                                            <li key={i}>{err}</li>
                                        ))}
                                    </ul>
                                </div>
                            ) : (
                                <p className="text-green-700">Nenhum erro encontrado. Pronto para importar.</p>
                            )}
                        </div>
                    )}

                    <div className="bg-white p-6 rounded-lg shadow-md">
                        <h3 className="text-lg font-bold text-gray-800 mb-4">Histórico Recente</h3>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200 text-sm">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-4 py-2 text-left">Data</th>
                                        <th className="px-4 py-2 text-left">Arquivo</th>
                                        <th className="px-4 py-2 text-left">Indústria</th>
                                        <th className="px-4 py-2 text-left">Status</th>
                                        <th className="px-4 py-2 text-left">Registros</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {importLogs.slice(0, 10).map(log => {
                                        const ind = industrias.find(i => i.id === log.industriaId);
                                        return (
                                            <tr key={log.id}>
                                                <td className="px-4 py-2">{new Date(log.timestamp).toLocaleString()}</td>
                                                <td className="px-4 py-2">{log.fileName}</td>
                                                <td className="px-4 py-2">{ind?.nome || 'N/A'}</td>
                                                <td className="px-4 py-2">
                                                    <span className={`px-2 py-1 rounded-full text-xs ${log.status === 'SUCESSO' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                                        {log.status}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-2">{log.successCount} / {log.totalRecords}</td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ImportacaoPage;
