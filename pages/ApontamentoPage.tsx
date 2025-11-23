
import React, { useState, useEffect, useRef } from 'react';
import { useWMS } from '../context/WMSContext';
import { Etiqueta, EtiquetaStatus, SKU } from '../types';
import { CameraIcon, ListBulletIcon, XCircleIcon } from '@heroicons/react/24/outline';
import SKUModal from '../components/SKUModal';

declare const Html5QrcodeScanner: any;

const ApontamentoPage: React.FC = () => {
    // FIX: Added `industrias` and `tiposBloqueio` to context destructuring to pass to SKUModal.
    const { getEtiquetasPendentesApontamento, apontarEtiqueta, getEtiquetaById, skus, addSku, industrias, tiposBloqueio } = useWMS();
    const [etiquetaId, setEtiquetaId] = useState('');
    const [formData, setFormData] = useState({ skuId: '', quantidadeCaixas: '', lote: '', validade: '', observacoes: '' });
    const [selectedEtiqueta, setSelectedEtiqueta] = useState<Etiqueta | null>(null);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [warning, setWarning] = useState('');
    const [isScanning, setIsScanning] = useState(false);
    const scannerRef = useRef<any>(null);

    // SKU Input states
    const [skuInput, setSkuInput] = useState('');
    const [foundSku, setFoundSku] = useState<SKU | null>(null);
    const [skuError, setSkuError] = useState('');
    const [isSkuModalOpen, setIsSkuModalOpen] = useState(false);


    const pendentes = getEtiquetasPendentesApontamento();

    useEffect(() => {
        if (isScanning) {
            scannerRef.current = new Html5QrcodeScanner(
                "reader",
                { fps: 10, qrbox: { width: 250, height: 250 } },
                false
            );
            scannerRef.current.render(onScanSuccess, onScanFailure);
        } else {
            if (scannerRef.current && scannerRef.current.getState() !== 1) { // 1 is NOT_STARTED
                scannerRef.current.clear().catch((err: any) => console.error("Failed to clear scanner", err));
            }
        }
        return () => {
             if (scannerRef.current && scannerRef.current.getState() !== 1) {
                scannerRef.current.clear().catch((err: any) => console.error("Failed to clear scanner", err));
            }
        };
    }, [isScanning]);

    const onScanSuccess = (decodedText: string) => {
        setEtiquetaId(decodedText);
        handleEtiquetaChange(decodedText);
        setIsScanning(false);
    };

    const onScanFailure = (errorMessage: string) => { /* ignore */ };
    
    const handleEtiquetaChange = (id: string) => {
        setEtiquetaId(id);
        setError('');
        setSuccess('');
        setWarning('');
        const etiqueta = getEtiquetaById(id);
        if (etiqueta && etiqueta.status === EtiquetaStatus.PENDENTE_APONTAMENTO) {
            setSelectedEtiqueta(etiqueta);
        } else {
            setSelectedEtiqueta(null);
            setError(etiqueta ? `Etiqueta já possui status: ${etiqueta.status}` : 'Etiqueta não encontrada.');
        }
    };
    
    const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({...prev, [name]: value}));
    };
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setWarning('');

        if (!selectedEtiqueta) {
            setError('Nenhuma etiqueta válida selecionada.');
            return;
        }
         if (!formData.skuId) {
            setError('SKU inválido ou não selecionado.');
            return;
        }
        
        const result = apontarEtiqueta(selectedEtiqueta.id, {
            ...formData,
            skuId: formData.skuId,
            quantidadeCaixas: parseInt(formData.quantidadeCaixas, 10)
        });

        if (result.success) {
            setSuccess(`Etiqueta ${selectedEtiqueta.id} apontada com sucesso!`);
            if (result.warnings && result.warnings.length > 0) {
                setWarning(result.warnings.join('\n'));
            }
            // Reset form
            setEtiquetaId('');
            setSelectedEtiqueta(null);
            setFormData({ skuId: '', quantidadeCaixas: '', lote: '', validade: '', observacoes: '' });
            setSkuInput('');
            setFoundSku(null);
            setSkuError('');
        } else {
            setError(result.message || 'Ocorreu um erro desconhecido.');
        }
    };

    const handleSkuInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setSkuInput(value);
        setFoundSku(null);
        setSkuError('');
        setFormData(prev => ({...prev, skuId: ''}));
    };

    const handleSkuBlur = () => {
        if (!skuInput) {
            return;
        }
        const sku = skus.find(s => String(s.sku).toLowerCase() === skuInput.toLowerCase());
        if (sku) {
            setFoundSku(sku);
            setSkuError('');
            setFormData(prev => ({...prev, skuId: sku.id}));
        } else {
            setFoundSku(null);
            setSkuError('SKU não encontrado.');
            setFormData(prev => ({...prev, skuId: ''}));
        }
    };

    const handleSaveNewSku = (newSkuData: Omit<SKU, 'id'>) => {
        const newSku = addSku(newSkuData);
        setSkuInput(newSku.sku);
        setFoundSku(newSku);
        setSkuError('');
        setFormData(prev => ({ ...prev, skuId: newSku.id }));
        setIsSkuModalOpen(false);
    };

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-gray-900">Apontamento de Pallets</h1>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Form */}
                <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow-md">
                    <h2 className="text-xl font-semibold mb-4">Registrar Produto no Pallet</h2>
                    
                    {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">{error}</div>}
                    {success && <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4" role="alert">{success}</div>}
                    {warning && <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded relative mb-4" role="alert">{warning}</div>}


                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700">Código da Etiqueta</label>
                        <div className="mt-1 flex rounded-md shadow-sm">
                            <input
                                type="text"
                                value={etiquetaId}
                                onChange={e => handleEtiquetaChange(e.target.value)}
                                placeholder="Leia o código ou digite"
                                className="flex-1 block w-full rounded-none rounded-l-md border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-2 px-3"
                            />
                            <button
                                onClick={() => setIsScanning(!isScanning)}
                                type="button"
                                className={`relative -ml-px inline-flex items-center space-x-2 rounded-r-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 ${isScanning ? 'bg-red-500 text-white hover:bg-red-600' : 'bg-gray-50'}`}
                            >
                                {isScanning ? <XCircleIcon className="h-5 w-5" /> : <CameraIcon className="h-5 w-5 text-gray-400" />}
                                <span>{isScanning ? 'Parar' : 'Escanear'}</span>
                            </button>
                        </div>
                    </div>

                    {isScanning && <div id="reader" className="w-full md:w-auto mx-auto my-4 border rounded-lg"></div>}
                    
                    {selectedEtiqueta && (
                         <form onSubmit={handleSubmit} className="space-y-4 animate-fade-in">
                            <div className="bg-indigo-50 p-4 rounded-lg">
                                <p className="font-semibold text-indigo-800">Etiqueta selecionada: <span className="font-mono">{selectedEtiqueta.id}</span></p>
                            </div>
                            
                            <div>
                                <label htmlFor="skuInput" className="block text-sm font-medium text-gray-700">SKU do Produto</label>
                                <input
                                    id="skuInput"
                                    type="text"
                                    name="skuInput"
                                    value={skuInput}
                                    onChange={handleSkuInputChange}
                                    onBlur={handleSkuBlur}
                                    required
                                    placeholder="Digite o código do SKU"
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm py-2 px-3 focus:border-indigo-500 focus:ring-indigo-500"
                                />
                                {foundSku && (
                                    <p className="text-sm text-green-700 mt-1">
                                        ✓ Produto encontrado: <strong>{foundSku.descritivo}</strong> (Pallet com {foundSku.totalCaixas} cx)
                                    </p>
                                )}
                                {skuError && (
                                    <div className="flex items-center justify-between mt-1">
                                        <p className="text-sm text-red-700">{skuError}</p>
                                        <button 
                                            type="button" 
                                            onClick={() => setIsSkuModalOpen(true)} 
                                            className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
                                        >
                                            Cadastrar Novo SKU
                                        </button>
                                    </div>
                                )}
                            </div>


                             <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Quantidade de Caixas</label>
                                    <input type="number" name="quantidadeCaixas" value={formData.quantidadeCaixas} onChange={handleFormChange} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm py-2 px-3" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Lote</label>
                                    <input type="text" name="lote" value={formData.lote} onChange={handleFormChange} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm py-2 px-3" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Validade</label>
                                    <input type="date" name="validade" value={formData.validade} onChange={handleFormChange} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm py-2 px-3" />
                                </div>
                            </div>
                            
                             <div>
                                <label className="block text-sm font-medium text-gray-700">Observações</label>
                               <textarea name="observacoes" value={formData.observacoes} onChange={handleFormChange} rows={3} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm py-2 px-3"></textarea>
                            </div>

                            <div className="text-right">
                                <button type="submit" className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700">
                                    Confirmar Apontamento
                                </button>
                            </div>
                        </form>
                    )}
                </div>

                {/* Pending List */}
                <div className="bg-white p-6 rounded-lg shadow-md">
                    <h2 className="text-xl font-semibold mb-4 flex items-center"><ListBulletIcon className="h-6 w-6 mr-2 text-gray-600" /> Etiquetas Pendentes ({pendentes.length})</h2>
                    <div className="max-h-96 overflow-y-auto space-y-2">
                        {pendentes.map(etiqueta => (
                            <div key={etiqueta.id} onClick={() => handleEtiquetaChange(etiqueta.id)} className="p-3 bg-gray-50 rounded-md cursor-pointer hover:bg-indigo-100 border border-gray-200">
                                <p className="text-sm font-medium text-gray-800 truncate">{etiqueta.id}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
             {isSkuModalOpen && (
                <SKUModal 
                    sku={{ sku: skuInput }} // Pre-fill the SKU code the user typed
                    onSave={handleSaveNewSku}
                    onClose={() => setIsSkuModalOpen(false)}
                    // FIX: Passed missing `industrias` and `tiposBloqueio` props.
                    industrias={industrias}
                    tiposBloqueio={tiposBloqueio}
                />
             )}
        </div>
    );
};

export default ApontamentoPage;
