
import React, { useState } from 'react';
import { useWMS } from '../context/WMSContext';
import { SKU, Endereco, EnderecoTipo, Industria } from '../types';
import { PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import SKUModal from '../components/SKUModal';

const CadastroPage: React.FC = () => {
    const [activeTab, setActiveTab] = useState('enderecos');

    const TabButton: React.FC<{ tabName: string; label: string }> = ({ tabName, label }) => (
        <button
            onClick={() => setActiveTab(tabName)}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === tabName ? 'bg-indigo-600 text-white' : 'text-gray-600 hover:bg-gray-200'}`}
        >
            {label}
        </button>
    );

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-gray-900">Cadastros</h1>
            <div className="bg-white p-4 rounded-lg shadow-md">
                <div className="flex space-x-2 border-b border-gray-200 mb-4">
                    <TabButton tabName="enderecos" label="Endereços" />
                    <TabButton tabName="skus" label="SKUs" />
                    <TabButton tabName="industrias" label="Indústrias" />
                </div>
                <div>
                    {activeTab === 'enderecos' && <CadastroEnderecos />}
                    {activeTab === 'skus' && <CadastroSKUs />}
                    {activeTab === 'industrias' && <CadastroIndustrias />}
                </div>
            </div>
        </div>
    );
};


// CadastroEnderecos Component
const CadastroEnderecos: React.FC = () => {
    const { enderecos, addEndereco, updateEndereco, deleteEndereco } = useWMS();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentEndereco, setCurrentEndereco] = useState<Partial<Endereco> | null>(null);

    const openModal = (endereco: Partial<Endereco> | null = null) => {
        setCurrentEndereco(endereco || {});
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setCurrentEndereco(null);
        setIsModalOpen(false);
    };

    const handleSave = (formData: Omit<Endereco, 'id' | 'ocupado'>) => {
        if (currentEndereco && 'id' in currentEndereco) {
            updateEndereco({ ...currentEndereco, ...formData } as Endereco);
        } else {
            addEndereco(formData);
        }
        closeModal();
    };
    
    return (
        <div>
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Gerenciar Endereços</h2>
                <button onClick={() => openModal()} className="flex items-center bg-indigo-600 text-white px-4 py-2 rounded-lg shadow hover:bg-indigo-700">
                    <PlusIcon className="h-5 w-5 mr-2" /> Novo Endereço
                </button>
            </div>
            {/* Table */}
             <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Código</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nome</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Capacidade</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {enderecos.map(e => (
                            <tr key={e.id}>
                                <td className="px-6 py-4 whitespace-nowrap">{e.codigo}</td>
                                <td className="px-6 py-4 whitespace-nowrap">{e.nome}</td>
                                <td className="px-6 py-4 whitespace-nowrap">{e.tipo}</td>
                                <td className="px-6 py-4 whitespace-nowrap">{e.capacidade} pallets</td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${e.ocupado ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                                        {e.ocupado ? 'Ocupado' : 'Livre'}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <button onClick={() => openModal(e)} className="text-indigo-600 hover:text-indigo-900"><PencilIcon className="h-5 w-5" /></button>
                                    <button onClick={() => deleteEndereco(e.id)} className="text-red-600 hover:text-red-900 ml-4"><TrashIcon className="h-5 w-5" /></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {isModalOpen && <EnderecoModal endereco={currentEndereco} onSave={handleSave} onClose={closeModal} />}
        </div>
    )
}

const EnderecoModal: React.FC<{ endereco: Partial<Endereco> | null, onSave: (data: any) => void, onClose: () => void }> = ({ endereco, onSave, onClose }) => {
    const [formData, setFormData] = useState({
        codigo: endereco?.codigo || '',
        nome: endereco?.nome || '',
        altura: endereco?.altura || 0,
        capacidade: endereco?.capacidade || 1,
        tipo: endereco?.tipo || EnderecoTipo.ARMAZENAGEM,
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        setFormData(prev => ({ ...prev, [name]: type === 'number' ? parseFloat(value) : value }));
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
    }

    return (
         <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
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
    const { skus, addSku, updateSku, deleteSku } = useWMS();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentSku, setCurrentSku] = useState<Partial<SKU> | null>(null);

    const openModal = (sku: Partial<SKU> | null = null) => {
        setCurrentSku(sku || {});
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setCurrentSku(null);
        setIsModalOpen(false);
    };

    const handleSave = (formData: Omit<SKU, 'id'>) => {
        if (currentSku && 'id' in currentSku) {
            updateSku({ ...currentSku, ...formData } as SKU);
        } else {
            addSku(formData);
        }
        closeModal();
    };

    const handleDeleteSku = (sku: SKU) => {
        if (window.confirm(`Tem certeza que deseja excluir o SKU "${sku.sku} - ${sku.descritivo}"?`)) {
            const success = deleteSku(sku.id);
            if (!success) {
                alert('Não foi possível excluir o SKU. Ele já está sendo utilizado em um ou mais pallets (etiquetas).');
            }
        }
    };


    return (
         <div>
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Gerenciar SKUs</h2>
                <button onClick={() => openModal()} className="flex items-center bg-indigo-600 text-white px-4 py-2 rounded-lg shadow hover:bg-indigo-700">
                    <PlusIcon className="h-5 w-5 mr-2" /> Novo SKU
                </button>
            </div>
            {/* Table */}
             <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SKU</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Descritivo</th>
                             <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Família</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
                        </tr>
                    </thead>
                     <tbody className="bg-white divide-y divide-gray-200">
                        {skus.map(s => (
                            <tr key={s.id}>
                                <td className="px-6 py-4 whitespace-nowrap">{s.sku}</td>
                                <td className="px-6 py-4 whitespace-nowrap">{s.descritivo}</td>
                                <td className="px-6 py-4 whitespace-nowrap">{s.familia}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <button onClick={() => openModal(s)} className="text-indigo-600 hover:text-indigo-900"><PencilIcon className="h-5 w-5" /></button>
                                    <button onClick={() => handleDeleteSku(s)} className="text-red-600 hover:text-red-900 ml-4"><TrashIcon className="h-5 w-5" /></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {isModalOpen && <SKUModal sku={currentSku} onSave={handleSave} onClose={closeModal} />}
        </div>
    )
}

// CadastroIndustrias Component
const CadastroIndustrias: React.FC = () => {
    const { industrias, addIndustria, updateIndustria, deleteIndustria } = useWMS();
    const [isModalOpen, setIsModalOpen] = useState(false);
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
                alert(`Não é possível excluir a indústria "${industria.nome}", pois ela já está vinculada a um recebimento.`);
            }
        }
    }

    return (
        <div>
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Gerenciar Indústrias/Fornecedores</h2>
                <button onClick={() => openModal()} className="flex items-center bg-indigo-600 text-white px-4 py-2 rounded-lg shadow hover:bg-indigo-700">
                    <PlusIcon className="h-5 w-5 mr-2" /> Nova Indústria
                </button>
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


export default CadastroPage;