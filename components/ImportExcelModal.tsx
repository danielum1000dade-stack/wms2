import React, { useState } from 'react';
import Modal from './Modal';
import { ArrowUpTrayIcon, DocumentTextIcon, XCircleIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

declare const XLSX: any;

interface ColumnConfig {
    [key: string]: {
        type: 'string' | 'number';
        required: boolean;
        enum?: string[];
    };
}

interface ImportExcelModalProps {
    title: string;
    columnConfig: ColumnConfig;
    onImport: (data: any[]) => void;
    onClose: () => void;
}

const ImportExcelModal: React.FC<ImportExcelModalProps> = ({ title, columnConfig, onImport, onClose }) => {
    const [file, setFile] = useState<File | null>(null);
    const [data, setData] = useState<any[]>([]);
    const [error, setError] = useState<string>('');

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            setFile(selectedFile);
            processFile(selectedFile);
        }
    };

    const processFile = (fileToProcess: File) => {
        setError('');
        setData([]);

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const binaryStr = event.target?.result;
                const workbook = XLSX.read(binaryStr, { type: 'binary' });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                // Use cellDates: true to parse Excel dates into JS Date objects
                const jsonData = XLSX.utils.sheet_to_json(worksheet, { cellDates: true });

                if (jsonData.length === 0) {
                    setError('O arquivo está vazio ou em um formato inválido.');
                    return;
                }

                const headers = Object.keys(jsonData[0] as object);
                const requiredHeaders = Object.keys(columnConfig).filter(key => columnConfig[key].required);

                const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
                if (missingHeaders.length > 0) {
                    setError(`As seguintes colunas obrigatórias não foram encontradas: ${missingHeaders.join(', ')}`);
                    return;
                }
                
                const validationErrors: string[] = [];
                const processedData = jsonData.map((row: any, rowIndex) => {
                    const newRow: { [key: string]: any } = { ...row }; // Start with a copy of the row
                    let hasError = false;

                    for (const key in columnConfig) {
                        const config = columnConfig[key];
                        let value = row[key];

                        if (config.required && (value === undefined || value === null || value === '')) {
                            validationErrors.push(`Erro na linha ${rowIndex + 2}: a coluna obrigatória "${key}" está vazia.`);
                            hasError = true;
                            continue;
                        }

                        if (value !== undefined && value !== null && value !== '') {
                            if (config.type === 'number') {
                                const numValue = parseFloat(value);
                                if (isNaN(numValue)) {
                                    validationErrors.push(`Erro na linha ${rowIndex + 2}: o valor "${value}" na coluna "${key}" não é um número válido.`);
                                    hasError = true;
                                } else {
                                    newRow[key] = numValue;
                                }
                            }
                            
                            if (config.enum && !config.enum.includes(String(value))) {
                                validationErrors.push(`Erro na linha ${rowIndex + 2}: o valor "${value}" para a coluna "${key}" é inválido. Valores aceitos: ${config.enum.join(', ')}.`);
                                hasError = true;
                            }
                        }
                    }
                    
                    return hasError ? null : newRow;
                }).filter(Boolean); // Filter out rows with errors (which are now null)

                if (validationErrors.length > 0) {
                    setError(`Foram encontrados ${validationErrors.length} erros no arquivo:\n- ${validationErrors.join('\n- ')}`);
                    setData([]); // Clear data preview on error
                    return;
                }
                
                setData(processedData as any[]);

            } catch (err: any) {
                setError(err.message || 'Ocorreu um erro ao processar o arquivo. Verifique o formato e o conteúdo.');
                setData([]);
            }
        };

        reader.onerror = () => {
             setError('Não foi possível ler o arquivo.');
        }

        reader.readAsBinaryString(fileToProcess);
    };

    const handleConfirmImport = () => {
        if (data.length > 0) {
            onImport(data);
            onClose();
        }
    };
    
    const requiredColumns = Object.keys(columnConfig).filter(key => columnConfig[key].required);
    const optionalColumns = Object.keys(columnConfig).filter(key => !columnConfig[key].required);

    return (
        <Modal title={title} onClose={onClose}>
            <div className="space-y-4">
                <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                    <h4 className="font-semibold text-gray-800">Instruções</h4>
                    <p className="text-sm text-gray-600 mt-1">
                        Seu arquivo Excel (.xlsx ou .csv) deve conter as seguintes colunas:
                    </p>
                    <ul className="text-sm text-gray-600 mt-2 list-disc list-inside">
                        {requiredColumns.map(col => <li key={col}><strong>{col}</strong> (obrigatório)</li>)}
                        {optionalColumns.map(col => <li key={col}>{col} (opcional)</li>)}
                    </ul>
                </div>
                
                <div>
                     <label htmlFor="file-upload" className="block text-sm font-medium text-gray-700 mb-2">Selecione o arquivo para importar</label>
                    <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                        <div className="space-y-1 text-center">
                            <ArrowUpTrayIcon className="mx-auto h-12 w-12 text-gray-400" />
                            <div className="flex text-sm text-gray-600">
                                <label htmlFor="file-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500">
                                    <span>Carregar um arquivo</span>
                                    <input id="file-upload" name="file-upload" type="file" className="sr-only" onChange={handleFileChange} accept=".xlsx, .csv" />
                                </label>
                                <p className="pl-1">ou arraste e solte</p>
                            </div>
                            <p className="text-xs text-gray-500">XLSX, CSV até 10MB</p>
                        </div>
                    </div>
                </div>

                {file && !error && data.length === 0 && <p className="text-center text-gray-500">Processando arquivo...</p>}

                {error && (
                     <div className="p-3 bg-red-100 border border-red-300 rounded-md flex items-start">
                        <XCircleIcon className="h-5 w-5 text-red-600 mr-2 flex-shrink-0" />
                        <p className="text-sm text-red-800 whitespace-pre-wrap">{error}</p>
                    </div>
                )}
                
                {data.length > 0 && (
                    <div>
                        <div className="p-3 bg-green-100 border border-green-300 rounded-md flex items-start mb-2">
                             <CheckCircleIcon className="h-5 w-5 text-green-600 mr-2 flex-shrink-0" />
                            <p className="text-sm text-green-800">{data.length} registros prontos para serem importados. Confira a pré-visualização abaixo.</p>
                        </div>
                        <h4 className="font-semibold text-gray-800 mb-2">Pré-visualização dos Dados</h4>
                         <div className="max-h-60 overflow-auto border rounded-lg">
                            <table className="min-w-full divide-y divide-gray-200 text-xs">
                                <thead className="bg-gray-50">
                                    <tr>
                                        {Object.keys(data[0]).map(header => (
                                            <th key={header} className="px-3 py-2 text-left font-medium text-gray-500 uppercase tracking-wider">{header}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {data.slice(0, 5).map((row, index) => (
                                        <tr key={index}>
                                            {Object.keys(row).map((key, i) => (
                                                <td key={i} className="px-3 py-2 whitespace-nowrap">
                                                    {row[key] instanceof Date ? row[key].toLocaleDateString() : String(row[key])}
                                                </td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}


                <div className="flex justify-end space-x-2 pt-4 border-t">
                    <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">Cancelar</button>
                    <button
                        type="button"
                        onClick={handleConfirmImport}
                        disabled={data.length === 0 || !!error}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:bg-indigo-300 disabled:cursor-not-allowed"
                    >
                        Confirmar Importação
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default ImportExcelModal;
