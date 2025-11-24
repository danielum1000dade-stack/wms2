
import React, { useState } from 'react';
import { useWMS } from '../context/WMSContext';
import { ImportTemplate, ImportMapping, WMSFieldEnum, WMSFieldLabels, ImportTransformation } from '../types';
import { PlusIcon, TrashIcon, ArrowRightIcon, DocumentTextIcon } from '@heroicons/react/24/outline';
import Modal from '../components/Modal';

declare const XLSX: any;

const ConfigImportacaoPage: React.FC = () => {
    const { importTemplates, industrias, deleteImportTemplate, saveImportTemplate } = useWMS();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTemplate, setEditingTemplate] = useState<Partial<ImportTemplate> | null>(null);

    const handleEdit = (template: ImportTemplate) => {
        setEditingTemplate(template);
        setIsModalOpen(true);
    };

    const handleCreate = () => {
        setEditingTemplate({
            name: '',
            type: 'PEDIDO',
            mappings: [],
            active: true
        });
        setIsModalOpen(true);
    };

    const handleDelete = (id: string) => {
        if(confirm("Tem certeza que deseja excluir este template?")) {
            deleteImportTemplate(id);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-gray-900">Configuração de Importação por Indústria</h1>
                <button
                    onClick={handleCreate}
                    className="flex items-center bg-indigo-600 text-white px-4 py-2 rounded-lg shadow hover:bg-indigo-700"
                >
                    <PlusIcon className="h-5 w-5 mr-2" /> Novo Template
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {importTemplates.map(template => {
                    const industria = industrias.find(i => i.id === template.industriaId);
                    return (
                        <div key={template.id} className="bg-white p-6 rounded-lg shadow-md border border-gray-200 hover:border-indigo-500 transition-colors">
                            <div className="flex justify-between items-start mb-2">
                                <h3 className="text-lg font-bold text-gray-800">{template.name}</h3>
                                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${template.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                                    {template.active ? 'Ativo' : 'Inativo'}
                                </span>
                            </div>
                            <p className="text-sm text-gray-600 mb-4">Indústria: <strong>{industria?.nome || 'N/A'}</strong></p>
                            <p className="text-xs text-gray-500 mb-4">Tipo: {template.type} | Mapeamentos: {template.mappings.length}</p>
                            
                            <div className="flex justify-end gap-2">
                                <button onClick={() => handleEdit(template)} className="text-indigo-600 hover:text-indigo-900 text-sm font-medium">Editar</button>
                                <button onClick={() => handleDelete(template.id)} className="text-red-600 hover:text-red-900 text-sm font-medium">Excluir</button>
                            </div>
                        </div>
                    )
                })}
                {importTemplates.length === 0 && (
                    <div className="col-span-full text-center py-12 bg-gray-50 rounded-lg border-dashed border-2 border-gray-300">
                        <p className="text-gray-500">Nenhum template configurado. Comece criando um para importar arquivos.</p>
                    </div>
                )}
            </div>

            {isModalOpen && (
                <TemplateEditor 
                    initialData={editingTemplate} 
                    onSave={(t) => { saveImportTemplate(t as ImportTemplate); setIsModalOpen(false); }}
                    onClose={() => setIsModalOpen(false)}
                />
            )}
        </div>
    );
};

const TemplateEditor: React.FC<{ 
    initialData: Partial<ImportTemplate> | null, 
    onSave: (data: Partial<ImportTemplate>) => void,
    onClose: () => void
}> = ({ initialData, onSave, onClose }) => {
    const { industrias } = useWMS();
    const [formData, setFormData] = useState<Partial<ImportTemplate>>(initialData || {});
    const [sampleColumns, setSampleColumns] = useState<string[]>([]);
    
    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (evt) => {
            const bstr = evt.target?.result;
            const wb = XLSX.read(bstr, { type: 'binary' });
            const wsname = wb.SheetNames[0];
            const ws = wb.Sheets[wsname];
            const data = XLSX.utils.sheet_to_json(ws, { header: 1 });
            if (data.length > 0) {
                setSampleColumns(data[0] as string[]);
            }
        };
        reader.readAsBinaryString(file);
    };

    const addMapping = () => {
        setFormData(prev => ({
            ...prev,
            mappings: [...(prev.mappings || []), { 
                fileColumn: '', 
                wmsField: WMSFieldEnum.SKU_CODIGO, 
                required: true, 
                transformation: ImportTransformation.NONE 
            }]
        }));
    };

    const removeMapping = (index: number) => {
        setFormData(prev => ({
            ...prev,
            mappings: prev.mappings?.filter((_, i) => i !== index)
        }));
    };

    const updateMapping = (index: number, field: keyof ImportMapping, value: any) => {
        const newMappings = [...(formData.mappings || [])];
        newMappings[index] = { ...newMappings[index], [field]: value };
        setFormData({ ...formData, mappings: newMappings });
    };

    return (
        <Modal title="Editor de Template" onClose={onClose}>
            <div className="space-y-6">
                {/* Basic Info */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Nome do Template</label>
                        <input 
                            type="text" 
                            value={formData.name || ''} 
                            onChange={e => setFormData({...formData, name: e.target.value})}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm py-2 px-3"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Indústria</label>
                        <select 
                            value={formData.industriaId || ''}
                            onChange={e => setFormData({...formData, industriaId: e.target.value})}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm py-2 px-3 bg-white"
                        >
                            <option value="">Selecione...</option>
                            {industrias.map(i => <option key={i.id} value={i.id}>{i.nome}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Tipo de Importação</label>
                        <select 
                            value={formData.type || 'PEDIDO'}
                            onChange={e => setFormData({...formData, type: e.target.value as any})}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm py-2 px-3 bg-white"
                        >
                            <option value="PEDIDO">Pedidos de Saída</option>
                            <option value="RECEBIMENTO">Recebimento (ASN)</option>
                        </select>
                    </div>
                </div>

                {/* Sample File Loader */}
                <div className="bg-blue-50 p-4 rounded-md border border-blue-200">
                    <h4 className="font-bold text-blue-800 mb-2">Carregar Arquivo de Exemplo</h4>
                    <p className="text-sm text-blue-600 mb-2">Carregue um arquivo (Excel/CSV) para preencher automaticamente as colunas disponíveis.</p>
                    <input type="file" onChange={handleFileUpload} accept=".xlsx,.csv" className="text-sm" />
                </div>

                {/* Mappings */}
                <div>
                    <div className="flex justify-between items-center mb-2">
                        <h4 className="font-bold text-gray-800">Mapeamento de Colunas</h4>
                        <button onClick={addMapping} className="text-sm bg-gray-200 hover:bg-gray-300 px-2 py-1 rounded">Adicionar Campo</button>
                    </div>
                    
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                        {formData.mappings?.map((map, idx) => (
                            <div key={idx} className="flex gap-2 items-end bg-gray-50 p-2 rounded border">
                                <div className="flex-1">
                                    <label className="text-xs font-bold text-gray-500">Coluna no Arquivo</label>
                                    {sampleColumns.length > 0 ? (
                                        <select 
                                            value={map.fileColumn} 
                                            onChange={e => updateMapping(idx, 'fileColumn', e.target.value)}
                                            className="w-full text-sm rounded border-gray-300"
                                        >
                                            <option value="">Selecione...</option>
                                            {sampleColumns.map(c => <option key={c} value={c}>{c}</option>)}
                                        </select>
                                    ) : (
                                        <input 
                                            type="text" 
                                            value={map.fileColumn} 
                                            onChange={e => updateMapping(idx, 'fileColumn', e.target.value)}
                                            className="w-full text-sm rounded border-gray-300" 
                                            placeholder="Nome Exato"
                                        />
                                    )}
                                </div>
                                <div className="flex-shrink-0">
                                    <ArrowRightIcon className="h-4 w-4 text-gray-400 mb-2" />
                                </div>
                                <div className="flex-1">
                                    <label className="text-xs font-bold text-gray-500">Campo WMS</label>
                                    <select 
                                        value={map.wmsField}
                                        onChange={e => updateMapping(idx, 'wmsField', e.target.value)}
                                        className="w-full text-sm rounded border-gray-300"
                                    >
                                        {Object.entries(WMSFieldLabels).map(([key, label]) => (
                                            <option key={key} value={key}>{label}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="flex-1">
                                    <label className="text-xs font-bold text-gray-500">Transformação</label>
                                    <select 
                                        value={map.transformation}
                                        onChange={e => updateMapping(idx, 'transformation', e.target.value)}
                                        className="w-full text-sm rounded border-gray-300"
                                    >
                                        {Object.values(ImportTransformation).map(t => (
                                            <option key={t} value={t}>{t}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <button onClick={() => removeMapping(idx)} className="text-red-500 hover:text-red-700 mb-1">
                                        <TrashIcon className="h-5 w-5" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="flex justify-end pt-4 border-t">
                    <button onClick={onClose} className="mr-2 px-4 py-2 bg-gray-200 rounded">Cancelar</button>
                    <button onClick={() => onSave(formData)} className="px-4 py-2 bg-indigo-600 text-white rounded">Salvar Template</button>
                </div>
            </div>
        </Modal>
    );
};

export default ConfigImportacaoPage;
