
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
            const reader = new FileReader();
            reader.onload = (evt) => {
                try {
                    const bstr = evt.target?.result;
                    const wb = XLSX.read(bstr, { type: 'binary' });
                    const wsname = wb.SheetNames[0];
                    const ws = wb.Sheets[wsname];
                    // FIX: Added cellDates: true to correctly parse Excel dates
                    const data = XLSX.utils.sheet_to_json(ws, { cellDates: true });
                    setPreviewData(data);
                    setSimulationResult(null);
                } catch (error) {
                    console.error("Erro ao ler arquivo:", error);
                    alert("Erro ao ler o arquivo. Verifique se é um Excel válido.");
                }
            };
            reader.readAsBinaryString(f);
        }
    };

    const handleSimulate = async () => {
        if (!file || !selectedTemplateId) return;
        const template = importTemplates.find(t => t.id === selectedTemplateId);
        if (!template) return;

        setIsProcessing(true);
        // Small timeout to allow UI to update to "Processing" state
        setTimeout(async () => {
            try {
                const result = await processImportFile(previewData, template, file.name, true);
                setSimulationResult(result);
            } catch (error) {
                console.error("Erro na simulação:", error);
                alert("Ocorreu um erro durante a simulação. Verifique o console para mais detalhes.");
            } finally {
                setIsProcessing(false);
            }
        }, 100);
    };

    const handleImport = async () => {
        if (!file || !selectedTemplateId) return;
        const template = importTemplates.find(t => t.id === selectedTemplateId);
        if (!template) return;

        if (confirm("Confirma a importação oficial destes dados?")) {
            setIsProcessing(true);
            setTimeout(async () => {
                try {
                    const result = await processImportFile(previewData, template, file.name, false);
                    if (result.success) {
                        alert(`Importação concluída com sucesso! ${result.total} registros processados.`);
                        setFile(null);
                        setPreviewData([]);
                        setSimulationResult(null);
                        setSelectedTemplateId('');
                        // Optional: Reset file input manually if needed
                    } else {
                        alert("Erro na importação. Verifique os logs ou a lista de erros.");
                    }
                } catch (error) {
                    console.error("Erro na importação:", error);
                    alert("Falha crítica ao processar importação.");
                } finally {
                    setIsProcessing(false);
                }
            }, 100);
        }
    };

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-gray-900">Importação de Arquivos</h1>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Input Panel */}
                <div className="lg:col-span-1 bg-white p-6 rounded-lg shadow-md space-y-6 h-fit">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">1. Selecione o Template</label>
                        <select 
                            value={selectedTemplateId} 
                            onChange={e => { setSelectedTemplateId(e.target.value); setSimulationResult(null); }}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm py-2 px-3 bg-white focus:ring-indigo-500 focus:border-indigo-500"
                        >
                            <option value="">-- Escolha --</option>
                            {importTemplates.filter(t => t.active).map(t => (
                                <option key={t.id} value={t.id}>{t.name} ({industrias.find(i=>i.id===t.industriaId)?.nome})</option>
                            ))}
                        </select>
                        {importTemplates.length === 0 && <p className="text-xs text-red-500 mt-1">Crie um template na tela de Configuração.</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">2. Arquivo (Excel/CSV)</label>
                        <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md hover:bg-gray-50 transition-colors">
                            <div className="space-y-1 text-center">
                                <ArrowUpTrayIcon className="mx-auto h-12 w-12 text-gray-400" />
                                <div className="flex text-sm text-gray-600 justify-center">
                                    <label className="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500">
                                        <span>Upload um arquivo</span>
                                        <input type="file" className="sr-only" onChange={handleFileChange} accept=".xlsx,.csv" />
                                    </label>
                                </div>
                                <p className="text-xs text-gray-500">XLSX, CSV</p>
                            </div>
                        </div>
                        {file && <p className="text-sm text-green-600 mt-2 text-center font-semibold">Selecionado: {file.name}</p>}
                    </div>

                    <div className="flex flex-col gap-3 pt-4 border-t">
                        <button 
                            onClick={handleSimulate} 
                            disabled={!file || !selectedTemplateId || isProcessing}
                            className="w-full bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-3 px-4 rounded-lg shadow disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        >
                            {isProcessing ? 'Analisando...' : '3. Simular Importação'}
                        </button>
                        
                        {simulationResult?.success && !isProcessing && (
                            <button 
                                onClick={handleImport} 
                                className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-lg shadow animate-pulse"
                            >
                                4. Confirmar e Processar
                            </button>
                        )}
                    </div>
                </div>

                {/* Result Panel */}
                <div className="lg:col-span-2 space-y-6">
                    {simulationResult && (
                        <div className={`p-6 rounded-lg border-l-4 shadow-sm ${simulationResult.success ? 'bg-green-50 border-green-500' : 'bg-red-50 border-red-500'}`}>
                            <div className="flex items-center mb-4">
                                {simulationResult.success ? <CheckCircleIcon className="h-8 w-8 text-green-600 mr-3"/> : <ExclamationTriangleIcon className="h-8 w-8 text-red-600 mr-3"/>}
                                <div>
                                    <h3 className={`font-bold text-xl ${simulationResult.success ? 'text-green-800' : 'text-red-800'}`}>
                                        {simulationResult.success ? 'Validação Bem-Sucedida' : 'Erros Encontrados'}
                                    </h3>
                                    <p className="text-sm text-gray-600">Total de registros lidos: {simulationResult.total}</p>
                                </div>
                            </div>
                            
                            {simulationResult.errors.length > 0 ? (
                                <div className="bg-white p-4 rounded border border-red-200 max-h-96 overflow-y-auto shadow-inner">
                                    <p className="font-bold text-red-700 mb-2 border-b pb-1">Lista de Pendências:</p>
                                    <ul className="space-y-2">
                                        {simulationResult.errors.map((err: string, i: number) => (
                                            <li key={i} className="text-sm text-red-600 flex items-start">
                                                <span className="mr-2">•</span> {err}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            ) : (
                                <div className="bg-white p-4 rounded border border-green-200">
                                    <p className="text-green-700 font-medium">Todos os dados estão corretos. Os SKUs foram validados e as quantidades conferidas.</p>
                                </div>
                            )}
                        </div>
                    )}

                    <div className="bg-white p-6 rounded-lg shadow-md">
                        <h3 className="text-lg font-bold text-gray-800 mb-4">Histórico de Importações</h3>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200 text-sm">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-4 py-2 text-left font-semibold text-gray-600">Data</th>
                                        <th className="px-4 py-2 text-left font-semibold text-gray-600">Arquivo</th>
                                        <th className="px-4 py-2 text-left font-semibold text-gray-600">Indústria</th>
                                        <th className="px-4 py-2 text-left font-semibold text-gray-600">Status</th>
                                        <th className="px-4 py-2 text-left font-semibold text-gray-600">Registros</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {importLogs.slice(0, 10).map(log => {
                                        const ind = industrias.find(i => i.id === log.industriaId);
                                        return (
                                            <tr key={log.id} className="hover:bg-gray-50">
                                                <td className="px-4 py-3 whitespace-nowrap text-gray-500">{new Date(log.timestamp).toLocaleString()}</td>
                                                <td className="px-4 py-3 font-medium text-gray-900">{log.fileName}</td>
                                                <td className="px-4 py-3 text-gray-600">{ind?.nome || 'N/A'}</td>
                                                <td className="px-4 py-3">
                                                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${log.status === 'SUCESSO' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                                        {log.status}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-gray-600">{log.successCount} / {log.totalRecords}</td>
                                            </tr>
                                        )
                                    })}
                                    {importLogs.length === 0 && <tr><td colSpan={5} className="p-4 text-center text-gray-500">Nenhum histórico disponível.</td></tr>}
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
