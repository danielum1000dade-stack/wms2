import React, { useState } from 'react';
import { useWMS } from '../context/WMSContext';
import { SKU, Endereco, EnderecoTipo, Industria, EnderecoStatus, User, UserStatus, Profile, Permission, permissionLabels, SKUStatus, EtiquetaStatus } from '../types';
import { PlusIcon, PencilIcon, TrashIcon, ArrowUpTrayIcon, ArrowDownTrayIcon, UserGroupIcon, ShieldCheckIcon, MapIcon, ArchiveBoxIcon, BuildingOffice2Icon, LockClosedIcon } from '@heroicons/react/24/outline';
import SKUModal from '../components/SKUModal';
import ImportExcelModal from '../components/ImportExcelModal';
import UserModal from '../components/UserModal';
import ProfileModal from '../components/ProfileModal';
import BlockSKUModal from '../components/BlockSKUModal';


declare const XLSX: any;

const CadastroPage: React.FC = () => {
    const [activeTab, setActiveTab] = useState('enderecos');

    const TabButton: React.FC<{ tabName: string; label: string; icon: React.ElementType }> = ({ tabName, label, icon: Icon }) => (
        <button
            onClick={() => setActiveTab(tabName)}
            className={`flex items-center px-4 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === tabName ? 'bg-indigo-600 text-white' : 'text-gray-600 hover:bg-gray-200'}`}
        >
            <Icon className="h-5 w-5 mr-2" />
            {label}
        </button>
    );

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-gray-900">Cadastros e Importações</h1>
            <div className="bg-white p-4 rounded-lg shadow-md">
                <div className="flex space-x-2 border-b border-gray-200 mb-4 pb-2 overflow-x-auto">
                    <TabButton tabName="enderecos" label="Endereços" icon={MapIcon} />
                    <TabButton tabName="skus" label="SKUs" icon={ArchiveBoxIcon} />
                    <TabButton tabName="industrias" label="Indústrias" icon={BuildingOffice2Icon} />
                    <TabButton tabName="importar_estoque" label="Importar Estoque" icon={ArrowUpTrayIcon} />
                    <TabButton tabName="usuarios" label="Usuários" icon={UserGroupIcon} />
                    <TabButton tabName="perfis" label="Perfis de Acesso" icon={ShieldCheckIcon} />
                </div>
                <div>
                    {activeTab === 'enderecos' && <CadastroEnderecos />}
                    {activeTab === 'skus' && <CadastroSKUs />}
                    {activeTab === 'industrias' && <CadastroIndustrias />}
                    {activeTab === 'importar_estoque' && <ImportarEstoqueInicial />}
                    {activeTab === 'usuarios' && <CadastroUsuarios />}
                    {activeTab === 'perfis' && <CadastroPerfis />}
                </div>
            </div>
        </div>
    );
};


// CadastroEnderecos Component
const CadastroEnderecos: React.FC = () => {
    const { enderecos, addEndereco, updateEndereco, deleteEndereco, addEnderecosBatch, industrias } = useWMS();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [currentEndereco, setCurrentEndereco] = useState<Partial<Endereco> | null>(null);

    const openModal = (endereco: Partial<Endereco> | null = null) => {
        setCurrentEndereco(endereco || {});
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setCurrentEndereco(null);
        setIsModalOpen(false);
    };

    const handleSave = (formData: Omit<Endereco, 'id'>) => {
        if (currentEndereco && 'id' in currentEndereco) {
            updateEndereco({ ...currentEndereco, ...formData } as Endereco);
        } else {
            addEndereco(formData);
        }
        closeModal();
    };

    const handleImport = (data: any[]) => {
        addEnderecosBatch(data);
        alert(`${data.length} endereços importados com sucesso!`);
    };

    const handleDownloadTemplate = () => {
        const headers = ['codigo', 'nome', 'altura', 'capacidade', 'tipo', 'status', 'motivoBloqueio', 'sre1', 'sre2', 'sre3', 'sre4', 'sre5'];
        const exampleData = [['A-01-01', 'Rua A Módulo 01 Nível 01', 2.5, 1, 'Armazenagem', 'Livre', '', 'FRIO', 'PESADO', '', '', '']];
        
        const dataToExport = [headers, ...exampleData];
        const ws = XLSX.utils.aoa_to_sheet(dataToExport);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Modelo_Enderecos");
        XLSX.writeFile(wb, "modelo_cadastro_enderecos.xlsx");
    };

    const enderecoColumnConfig = {
        codigo: { type: 'string', required: true },
        nome: { type: 'string', required: true },
        altura: { type: 'number', required: true },
        capacidade: { type: 'number', required: true },
        tipo: { type: 'string', required: true, enum: Object.values(EnderecoTipo) },
        status: { type: 'string', required: false, enum: Object.values(EnderecoStatus) },
        motivoBloqueio: { type: 'string', required: false },
        sre1: { type: 'string', required: false },
        sre2: { type: 'string', required: false },
        sre3: { type: 'string', required: false },
        sre4: { type: 'string', required: false },
        sre5: { type: 'string', required: false },
    };
    
    return (
        <div>
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Gerenciar Endereços</h2>
                <div className="flex space-x-2">
                    <button onClick={handleDownloadTemplate} className="flex items-center bg-gray-600 text-white px-4 py-2 rounded-lg shadow hover:bg-gray-700">
                        <ArrowDownTrayIcon className="h-5 w-5 mr-2" /> Baixar Modelo
                    </button>
                    <button onClick={() => setIsImportModalOpen(true)} className="flex items-center bg-green-600 text-white px-4 py-2 rounded-lg shadow hover:bg-green-700">
                        <ArrowUpTrayIcon className="h-5 w-5 mr-2" /> Importar Excel
                    </button>
                    <button onClick={() => openModal()} className="flex items-center bg-indigo-600 text-white px-4 py-2 rounded-lg shadow hover:bg-indigo-700">
                        <PlusIcon className="h-5 w-5 mr-2" /> Novo Endereço
                    </button>
                </div>
            </div>
            {/* Table */}
             <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Código</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nome</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Indústria Dedicada</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {enderecos.map(e => {
                            const industria = industrias.find(i => i.id === e.industriaId);
                            return (
                                <tr key={e.id}>
                                    <td className="px-6 py-4 whitespace-nowrap">{e.codigo}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">{e.nome}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">{e.tipo}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">{industria?.nome || 'N/A'}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                            e.status === EnderecoStatus.LIVRE ? 'bg-green-100 text-green-800' :
                                            e.status === EnderecoStatus.OCUPADO ? 'bg-yellow-100 text-yellow-800' :
                                            e.status === EnderecoStatus.BLOQUEADO ? 'bg-red-100 text-red-800' :
                                            'bg-gray-100 text-gray-800'
                                        }`}>
                                            {e.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <button onClick={() => openModal(e)} className="text-indigo-600 hover:text-indigo-900"><PencilIcon className="h-5 w-5" /></button>
                                        <button onClick={() => deleteEndereco(e.id)} className="text-red-600 hover:text-red-900 ml-4"><TrashIcon className="h-5 w-5" /></button>
                                    </td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
            </div>
            {isModalOpen && <EnderecoModal endereco={currentEndereco} industrias={industrias} onSave={handleSave} onClose={closeModal} />}
            {isImportModalOpen && <ImportExcelModal title="Importar Endereços" columnConfig={enderecoColumnConfig} onImport={handleImport} onClose={() => setIsImportModalOpen(false)} />}
        </div>
    )
}

const EnderecoModal: React.FC<{ endereco: Partial<Endereco> | null, industrias: Industria[], onSave: (data: any) => void, onClose: () => void }> = ({ endereco, industrias, onSave, onClose }) => {
    const [formData, setFormData] = useState({
        codigo: endereco?.codigo || '',
        nome: endereco?.nome || '',
        altura: endereco?.altura || 0,
        capacidade: endereco?.capacidade || 1,
        tipo: endereco?.tipo || EnderecoTipo.ARMAZENAGEM,
        status: endereco?.status || EnderecoStatus.LIVRE,
        motivoBloqueio: endereco?.motivoBloqueio || '',
        sre1: endereco?.sre1 || '',
        sre2: endereco?.sre2 || '',
        sre3: endereco?.sre3 || '',
        sre4: endereco?.sre4 || '',
        sre5: endereco?.sre5 || '',
        industriaId: endereco?.industriaId || '',
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        
        setFormData(prev => {
            const updated = { ...prev, [name]: (e.target as HTMLInputElement).type === 'number' ? parseFloat(value) : value };
            if (name === 'status' && value !== EnderecoStatus.BLOQUEADO) {
                updated.motivoBloqueio = '';
            }
            return updated;
        });
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
    }

    return (
         <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">{endereco?.id ? 'Editar' : 'Novo'} Endereço</h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Form fields */}
                     <div>
                        <label htmlFor="codigo" className="block text-sm font-medium text-gray-700">Código</label>
                        <input type="text" name="codigo" id="codigo" value={formData.codigo} onChange={handleChange} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-2 px-3"/>
                    </div>
                     <div>
                        <label htmlFor="nome" className="block text-sm font-medium text-gray-700">Nome (Ex: A01-01-A)</label>
                        <input type="text" name="nome" id="nome" value={formData.nome} onChange={handleChange} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-2 px-3"/>
                    </div>
                     <div>
                        <label htmlFor="tipo" className="block text-sm font-medium text-gray-700">Tipo</label>
                        <select name="tipo" id="tipo" value={formData.tipo} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-2 px-3">
                            {Object.values(EnderecoTipo).map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                    </div>
                     <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="altura" className="block text-sm font-medium text-gray-700">Altura (m)</label>
                            <input type="number" name="altura" id="altura" value={formData.altura} onChange={handleChange} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-2 px-3"/>
                        </div>
                        <div>
                            <label htmlFor="capacidade" className="block text-sm font-medium text-gray-700">Capacidade (pallets)</label>
                            <input type="number" name="capacidade" id="capacidade" min="1" value={formData.capacidade} onChange={handleChange} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-2 px-3"/>
                        </div>
                    </div>

                    <div>
                        <label htmlFor="status" className="block text-sm font-medium text-gray-700">Status</label>
                        <select name="status" id="status" value={formData.status} onChange={handleChange} 
                            disabled={endereco?.status === EnderecoStatus.OCUPADO}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-2 px-3 disabled:bg-gray-200"
                        >
                            <option value={EnderecoStatus.LIVRE}>Livre</option>
                            <option value={EnderecoStatus.BLOQUEADO}>Bloqueado</option>
                            {endereco?.status === EnderecoStatus.OCUPADO && <option value={EnderecoStatus.OCUPADO}>Ocupado</option>}
                        </select>
                        {endereco?.status === EnderecoStatus.OCUPADO && <p className="text-xs text-gray-500 mt-1">Não é possível alterar o status de um endereço ocupado.</p>}
                    </div>
                    
                    {formData.status === EnderecoStatus.BLOQUEADO && (
                        <div>
                            <label htmlFor="motivoBloqueio" className="block text-sm font-medium text-gray-700">Motivo do Bloqueio</label>
                            <textarea name="motivoBloqueio" id="motivoBloqueio" value={formData.motivoBloqueio} onChange={handleChange} rows={2}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-2 px-3"
                            ></textarea>
                        </div>
                    )}

                    <div className="pt-4 border-t">
                        <h4 className="text-md font-medium text-gray-800">Regras de Armazenagem (SREs)</h4>
                        <p className="text-xs text-gray-500 mb-2">Define quais tipos de produto podem ser armazenados aqui.</p>
                         <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mt-2">
                             {(['sre1', 'sre2', 'sre3', 'sre4', 'sre5'] as const).map(sre => (
                                <div key={sre}>
                                    <label className="block text-sm font-medium text-gray-700">{sre.toUpperCase()}</label>
                                    <input type="text" name={sre} value={formData[sre]} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm py-2 px-3"/>
                                </div>
                             ))}
                         </div>
                    </div>

                    <div className="pt-4 border-t">
                        <label htmlFor="industriaId" className="block text-sm font-medium text-gray-700">Indústria / Proprietário (Opcional)</label>
                        <p className="text-xs text-gray-500 mb-2">Dedica este endereço para produtos de uma indústria específica.</p>
                        <select name="industriaId" id="industriaId" value={formData.industriaId} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-2 px-3 bg-white">
                            <option value="">Nenhuma</option>
                            {industrias.map(i => <option key={i.id} value={i.id}>{i.nome}</option>)}
                        </select>
                    </div>


                    <div className="flex justify-end space-x-2 pt-4">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">Cancelar</button>
                        <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">Salvar</button>
                    </div>
                </form>
            </div>
        </div>
    )
}


// CadastroSKUs Component
const CadastroSKUs: React.FC = () => {
    const { skus, addSku, updateSku, deleteSku, addSkusBatch, industrias } = useWMS();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [currentSku, setCurrentSku] = useState<Partial<SKU> | null>(null);
    const [isBlockModalOpen, setIsBlockModalOpen] = useState(false);
    const [skuToBlock, setSkuToBlock] = useState<SKU | null>(null);

    const openModal = (sku: Partial<SKU> | null = null) => {
        setCurrentSku(sku || {});
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setCurrentSku(null);
        setIsModalOpen(false);
    };

    const openBlockModal = (sku: SKU) => {
        setSkuToBlock(sku);
        setIsBlockModalOpen(true);
    };

    const closeBlockModal = () => {
        setSkuToBlock(null);
        setIsBlockModalOpen(false);
    };

    const handleSave = (formData: Omit<SKU, 'id'>) => {
        if (currentSku && 'id' in currentSku) {
            updateSku({ ...currentSku, ...formData } as SKU);
        } else {
            addSku(formData);
        }
        closeModal();
    };
    
    const handleSaveStatus = (sku: SKU) => {
        updateSku(sku);
        closeBlockModal();
    };

    const handleDeleteSku = (sku: SKU) => {
        if (window.confirm(`Tem certeza que deseja excluir o SKU "${sku.sku} - ${sku.descritivo}"?`)) {
            const success = deleteSku(sku.id);
            if (!success) {
                alert('Não foi possível excluir o SKU. Ele já está sendo utilizado em um ou mais pallets (etiquetas).');
            }
        }
    };
    
    const handleImport = (data: any[]) => {
        const skusToImport: Omit<SKU, 'id'>[] = [];
        const errors: string[] = [];

        for (let i = 0; i < data.length; i++) {
            const row = data[i];
            const { industria: industriaName, ...skuData } = row;
            let industriaId: string | undefined = undefined;

            if (industriaName) {
                const foundIndustria = industrias.find(ind => ind.nome.toLowerCase() === String(industriaName).toLowerCase());
                if (foundIndustria) {
                    industriaId = foundIndustria.id;
                } else {
                    errors.push(`Linha ${i + 2}: Indústria "${industriaName}" para o SKU "${row.sku}" não foi encontrada no cadastro.`);
                    continue; // Pula para a próxima linha
                }
            }
            skusToImport.push({ ...skuData, industriaId, status: SKUStatus.ATIVO });
        }

        if (errors.length > 0) {
            alert(`A importação falhou. Foram encontrados ${errors.length} erros:\n\n${errors.join('\n')}`);
            return;
        }

        if (skusToImport.length > 0) {
            addSkusBatch(skusToImport);
            alert(`${skusToImport.length} SKUs foram importados com sucesso!`);
        } else if (data.length > 0) {
             alert('Nenhum SKU para importar após a validação. Verifique os erros no seu arquivo.');
        }
    };

    const handleDownloadTemplate = () => {
        const headers = [
            'sku', 'descritivo', 'totalCaixas', 'tempoVida', 'peso', 
            'qtdPorCamada', 'camadaPorLastro', 'sre1', 'sre2', 'sre3', 
            'sre4', 'sre5', 'classificacao', 'familia', 'industria'
        ];
        const exampleData = [[
            'SKU001', 'Produto Exemplo', 100, 365, 12.5, 
            20, 5, 'A', 'B', '', '', '', 'Alimento', 'Congelado', 'Industria Exemplo S.A.'
        ]];
        
        const dataToExport = [headers, ...exampleData];
        const ws = XLSX.utils.aoa_to_sheet(dataToExport);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Modelo_SKUs");
        XLSX.writeFile(wb, "modelo_cadastro_skus.xlsx");
    };

    const skuColumnConfig = {
        sku: { type: 'string', required: true },
        descritivo: { type: 'string', required: true },
        totalCaixas: { type: 'number', required: true },
        tempoVida: { type: 'number', required: true },
        peso: { type: 'number', required: true },
        qtdPorCamada: { type: 'number', required: true },
        camadaPorLastro: { type: 'number', required: true },
        sre1: { type: 'string', required: false },
        sre2: { type: 'string', required: false },
        sre3: { type: 'string', required: false },
        sre4: { type: 'string', required: false },
        sre5: { type: 'string', required: false },
        classificacao: { type: 'string', required: true },
        familia: { type: 'string', required: true },
        industria: { type: 'string', required: false },
    };


    return (
         <div>
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Gerenciar SKUs</h2>
                <div className="flex space-x-2">
                    <button onClick={handleDownloadTemplate} className="flex items-center bg-gray-600 text-white px-4 py-2 rounded-lg shadow hover:bg-gray-700">
                        <ArrowDownTrayIcon className="h-5 w-5 mr-2" /> Baixar Modelo
                    </button>
                     <button onClick={() => setIsImportModalOpen(true)} className="flex items-center bg-green-600 text-white px-4 py-2 rounded-lg shadow hover:bg-green-700">
                        <ArrowUpTrayIcon className="h-5 w-5 mr-2" /> Importar Excel
                    </button>
                    <button onClick={() => openModal()} className="flex items-center bg-indigo-600 text-white px-4 py-2 rounded-lg shadow hover:bg-indigo-700">
                        <PlusIcon className="h-5 w-5 mr-2" /> Novo SKU
                    </button>
                </div>
            </div>
            {/* Table */}
             <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SKU</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Descritivo</th>
                             <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Família</th>
                             <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Indústria</th>
                             <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
                        </tr>
                    </thead>
                     <tbody className="bg-white divide-y divide-gray-200">
                        {skus.map(s => {
                            const industria = industrias.find(i => i.id === s.industriaId);
                            return (
                                <tr key={s.id} className={s.status === SKUStatus.BLOQUEADO ? 'bg-red-50' : ''}>
                                    <td className="px-6 py-4 whitespace-nowrap">{s.sku}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">{s.descritivo}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">{s.familia}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">{industria?.nome || 'N/A'}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                            s.status === SKUStatus.ATIVO ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                        }`}>
                                            {s.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <button onClick={() => openBlockModal(s)} className="text-gray-500 hover:text-gray-800" title="Bloquear/Desbloquear SKU"><LockClosedIcon className="h-5 w-5" /></button>
                                        <button onClick={() => openModal(s)} className="text-indigo-600 hover:text-indigo-900 ml-4"><PencilIcon className="h-5 w-5" /></button>
                                        <button onClick={() => handleDeleteSku(s)} className="text-red-600 hover:text-red-900 ml-4"><TrashIcon className="h-5 w-5" /></button>
                                    </td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
            </div>
            {isModalOpen && <SKUModal sku={currentSku} onSave={handleSave} onClose={closeModal} industrias={industrias} />}
            {isImportModalOpen && <ImportExcelModal title="Importar SKUs" columnConfig={skuColumnConfig} onImport={handleImport} onClose={() => setIsImportModalOpen(false)} />}
            {isBlockModalOpen && skuToBlock && <BlockSKUModal sku={skuToBlock} onSave={handleSaveStatus} onClose={closeBlockModal} />}
        </div>
    )
}

// CadastroIndustrias Component
const CadastroIndustrias: React.FC = () => {
    const { industrias, addIndustria, updateIndustria, deleteIndustria, addIndustriasBatch } = useWMS();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [currentIndustria, setCurrentIndustria] = useState<Partial<Industria> | null>(null);

    const openModal = (industria: Partial<Industria> | null = null) => {
        setCurrentIndustria(industria || {});
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setCurrentIndustria(null);
        setIsModalOpen(false);
    };

    const handleSave = (formData: Omit<Industria, 'id'>) => {
        if (currentIndustria && 'id' in currentIndustria) {
            updateIndustria({ ...currentIndustria, ...formData } as Industria);
        } else {
            addIndustria(formData);
        }
        closeModal();
    };
    
    const handleDelete = (industria: Industria) => {
        if (window.confirm(`Tem certeza que deseja excluir a indústria "${industria.nome}"?`)) {
            const success = deleteIndustria(industria.id);
            if (!success) {
                alert(`Não é possível excluir a indústria "${industria.nome}", pois ela já está vinculada a um recebimento, SKU ou endereço.`);
            }
        }
    }
    
    const handleImport = (data: any[]) => {
        addIndustriasBatch(data);
        alert(`${data.length} indústrias importadas com sucesso!`);
    };

    const handleDownloadTemplate = () => {
        const headers = ['nome'];
        const exampleData = [['Indústria Exemplo S.A.']];
        
        const dataToExport = [headers, ...exampleData];
        const ws = XLSX.utils.aoa_to_sheet(dataToExport);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Modelo_Industrias");
        XLSX.writeFile(wb, "modelo_cadastro_industrias.xlsx");
    };

    const industriaColumnConfig = {
        nome: { type: 'string', required: true },
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Gerenciar Indústrias/Fornecedores</h2>
                 <div className="flex space-x-2">
                    <button onClick={handleDownloadTemplate} className="flex items-center bg-gray-600 text-white px-4 py-2 rounded-lg shadow hover:bg-gray-700">
                        <ArrowDownTrayIcon className="h-5 w-5 mr-2" /> Baixar Modelo
                    </button>
                     <button onClick={() => setIsImportModalOpen(true)} className="flex items-center bg-green-600 text-white px-4 py-2 rounded-lg shadow hover:bg-green-700">
                        <ArrowUpTrayIcon className="h-5 w-5 mr-2" /> Importar Excel
                    </button>
                    <button onClick={() => openModal()} className="flex items-center bg-indigo-600 text-white px-4 py-2 rounded-lg shadow hover:bg-indigo-700">
                        <PlusIcon className="h-5 w-5 mr-2" /> Nova Indústria
                    </button>
                </div>
            </div>
             <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nome</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {industrias.map(i => (
                            <tr key={i.id}>
                                <td className="px-6 py-4 whitespace-nowrap">{i.nome}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <button onClick={() => openModal(i)} className="text-indigo-600 hover:text-indigo-900"><PencilIcon className="h-5 w-5" /></button>
                                    <button onClick={() => handleDelete(i)} className="text-red-600 hover:text-red-900 ml-4"><TrashIcon className="h-5 w-5" /></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {isModalOpen && <IndustriaModal industria={currentIndustria} onSave={handleSave} onClose={closeModal} />}
            {isImportModalOpen && <ImportExcelModal title="Importar Indústrias" columnConfig={industriaColumnConfig} onImport={handleImport} onClose={() => setIsImportModalOpen(false)} />}
        </div>
    )
}

const IndustriaModal: React.FC<{ industria: Partial<Industria> | null, onSave: (data: any) => void, onClose: () => void }> = ({ industria, onSave, onClose }) => {
    const [formData, setFormData] = useState({
        nome: industria?.nome || '',
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
    }

    return (
         <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
                <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">{industria?.id ? 'Editar' : 'Nova'} Indústria</h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="nome" className="block text-sm font-medium text-gray-700">Nome da Indústria</label>
                        <input type="text" name="nome" id="nome" value={formData.nome} onChange={handleChange} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-2 px-3"/>
                    </div>
                    <div className="flex justify-end space-x-2 pt-4">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">Cancelar</button>
                        <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">Salvar</button>
                    </div>
                </form>
            </div>
        </div>
    )
}


// CadastroUsuarios Component
const CadastroUsuarios: React.FC = () => {
    const { users, addUser, updateUser, deleteUser, profiles } = useWMS();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentUser, setCurrentUser] = useState<Partial<User> | null>(null);
    const [error, setError] = useState('');
    
    const openModal = (user: Partial<User> | null = null) => {
        setCurrentUser(user || {});
        setIsModalOpen(true);
        setError('');
    };

    const closeModal = () => {
        setCurrentUser(null);
        setIsModalOpen(false);
    };

    const handleSave = (formData: Omit<User, 'id'>) => {
        let result: { success: boolean, message?: string };
        if (currentUser && 'id' in currentUser) {
            result = updateUser({ ...currentUser, ...formData } as User);
        } else {
            result = addUser(formData);
        }
        
        if (result.success) {
            closeModal();
        } else {
            setError(result.message || 'Ocorreu um erro desconhecido.');
        }
    };
    
    const handleDelete = (user: User) => {
        if(window.confirm(`Tem certeza que deseja excluir o usuário "${user.username}"?`)) {
            const result = deleteUser(user.id);
            if (!result.success) {
                alert(result.message);
            }
        }
    };
    
    return (
        <div>
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Gerenciar Usuários</h2>
                <button onClick={() => openModal()} className="flex items-center bg-indigo-600 text-white px-4 py-2 rounded-lg shadow hover:bg-indigo-700">
                    <PlusIcon className="h-5 w-5 mr-2" /> Novo Usuário
                </button>
            </div>
             <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nome de Usuário</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nome Completo</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Perfil</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
                        </tr>
                    </thead>
                     <tbody className="bg-white divide-y divide-gray-200">
                        {users.map(u => {
                            const profile = profiles.find(p => p.id === u.profileId);
                            return (
                                <tr key={u.id}>
                                    <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{u.username}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">{u.fullName}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">{profile?.name || 'Não definido'}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${u.status === UserStatus.ATIVO ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                            {u.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <button onClick={() => openModal(u)} className="text-indigo-600 hover:text-indigo-900"><PencilIcon className="h-5 w-5" /></button>
                                        <button onClick={() => handleDelete(u)} className="text-red-600 hover:text-red-900 ml-4"><TrashIcon className="h-5 w-5" /></button>
                                    </td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
            </div>
             {isModalOpen && <UserModal user={currentUser} profiles={profiles} onSave={handleSave} onClose={closeModal} serverError={error} />}
        </div>
    )
}

// CadastroPerfis Component
const CadastroPerfis: React.FC = () => {
    const { profiles, addProfile, updateProfile, deleteProfile } = useWMS();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentProfile, setCurrentProfile] = useState<Partial<Profile> | null>(null);
    const [error, setError] = useState('');

    const openModal = (profile: Partial<Profile> | null = null) => {
        setCurrentProfile(profile || { permissions: {} });
        setIsModalOpen(true);
        setError('');
    };

    const closeModal = () => {
        setCurrentProfile(null);
        setIsModalOpen(false);
    };
    
    const handleSave = (formData: Omit<Profile, 'id'>) => {
        let result: { success: boolean, message?: string };
        if (currentProfile && 'id' in currentProfile) {
            result = updateProfile({ ...currentProfile, ...formData } as Profile);
        } else {
            result = addProfile(formData);
        }

        if (result.success) {
            closeModal();
        } else {
            setError(result.message || 'Ocorreu um erro desconhecido.');
        }
    };
    
    const handleDelete = (profile: Profile) => {
        if (window.confirm(`Tem certeza que deseja excluir o perfil "${profile.name}"?`)) {
            const result = deleteProfile(profile.id);
            if (!result.success) {
                alert(result.message);
            }
        }
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Gerenciar Perfis de Acesso</h2>
                <button onClick={() => openModal()} className="flex items-center bg-indigo-600 text-white px-4 py-2 rounded-lg shadow hover:bg-indigo-700">
                    <PlusIcon className="h-5 w-5 mr-2" /> Novo Perfil
                </button>
            </div>
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nome do Perfil</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Permissões</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {profiles.map(p => (
                            <tr key={p.id}>
                                <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{p.name}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {Object.entries(p.permissions)
                                        .filter(([, value]) => value)
                                        .slice(0, 3)
                                        .map(([key]) => permissionLabels[key as Permission])
                                        .join(', ')}
                                    {Object.values(p.permissions).filter(v => v).length > 3 && ', ...'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <button onClick={() => openModal(p)} className="text-indigo-600 hover:text-indigo-900"><PencilIcon className="h-5 w-5" /></button>
                                    <button onClick={() => handleDelete(p)} className="text-red-600 hover:text-red-900 ml-4"><TrashIcon className="h-5 w-5" /></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {isModalOpen && <ProfileModal profile={currentProfile} onSave={handleSave} onClose={closeModal} serverError={error} />}
        </div>
    );
};

const ImportarEstoqueInicial: React.FC = () => {
    const { enderecos, skus, addEtiqueta } = useWMS();
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);

    const handleDownloadTemplate = () => {
        const headers = ['endereco', 'sku', 'lote', 'validade', 'quantidadeCaixas', 'observacoes'];
        const exampleData = [['A01-01-A', 'SKU001', 'LOTE123', '2025-12-31', 100, 'Carga inicial']];
        
        const dataToExport = [headers, ...exampleData];
        const ws = XLSX.utils.aoa_to_sheet(dataToExport);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Modelo_Estoque_Inicial");
        XLSX.writeFile(wb, "modelo_importacao_estoque.xlsx");
    };

    const columnConfig = {
        endereco: { type: 'string', required: true },
        sku: { type: 'string', required: true },
        lote: { type: 'string', required: true },
        validade: { type: 'string', required: true },
        quantidadeCaixas: { type: 'number', required: true },
        observacoes: { type: 'string', required: false },
    };

    const handleImport = (data: any[]) => {
        const errors: string[] = [];
        let successes = 0;

        for (let i = 0; i < data.length; i++) {
            const row = data[i];
            const endereco = enderecos.find(e => e.codigo.toLowerCase() === row.endereco.toLowerCase());
            if (!endereco) {
                errors.push(`Linha ${i + 2}: Endereço "${row.endereco}" não encontrado.`);
                continue;
            }
            if (endereco.status === EnderecoStatus.OCUPADO) {
                errors.push(`Linha ${i + 2}: Endereço "${row.endereco}" já está ocupado.`);
                continue;
            }

            const sku = skus.find(s => s.sku.toLowerCase() === row.sku.toLowerCase());
            if (!sku) {
                errors.push(`Linha ${i + 2}: SKU "${row.sku}" não encontrado.`);
                continue;
            }

            // Date validation
            const validadeDate = new Date(row.validade);
            if (isNaN(validadeDate.getTime())) {
                errors.push(`Linha ${i + 2}: Data de validade "${row.validade}" inválida. Use o formato AAAA-MM-DD.`);
                continue;
            }
            
            addEtiqueta({
                enderecoId: endereco.id,
                skuId: sku.id,
                lote: row.lote,
                validade: row.validade,
                quantidadeCaixas: Number(row.quantidadeCaixas),
                observacoes: row.observacoes || '',
                status: EtiquetaStatus.ARMAZENADA,
                dataApontamento: new Date().toISOString(),
                dataArmazenagem: new Date().toISOString(),
            });
            successes++;
        }

        let message = `${successes} itens de estoque importados com sucesso!`;
        if (errors.length > 0) {
            message += `\n\nFalha em ${errors.length} itens:\n${errors.join('\n')}`;
        }
        alert(message);
    };

    return (
        <div className="space-y-4">
            <h2 className="text-xl font-semibold">Importação de Estoque Inicial</h2>
            <p className="text-gray-600">
                Use esta ferramenta para fazer a carga inicial do seu estoque no sistema. Baixe o modelo, preencha com os dados do seu inventário e importe o arquivo.
            </p>
            <div className="flex space-x-2">
                <button onClick={handleDownloadTemplate} className="flex items-center bg-gray-600 text-white px-4 py-2 rounded-lg shadow hover:bg-gray-700">
                    <ArrowDownTrayIcon className="h-5 w-5 mr-2" /> Baixar Modelo
                </button>
                <button onClick={() => setIsImportModalOpen(true)} className="flex items-center bg-green-600 text-white px-4 py-2 rounded-lg shadow hover:bg-green-700">
                    <ArrowUpTrayIcon className="h-5 w-5 mr-2" /> Importar Estoque
                </button>
            </div>
             {isImportModalOpen && <ImportExcelModal title="Importar Estoque Inicial" columnConfig={columnConfig} onImport={handleImport} onClose={() => setIsImportModalOpen(false)} />}
        </div>
    );
};

export default CadastroPage;