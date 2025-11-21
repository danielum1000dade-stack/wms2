import React, { useState } from 'react';
import { Profile, Permission, permissionLabels } from '../types';

interface ProfileModalProps {
    profile: Partial<Profile> | null;
    onSave: (data: Omit<Profile, 'id'>) => void;
    onClose: () => void;
    serverError?: string;
}

const permissionGroups = {
    'Operações Gerais': [
        Permission.VIEW_DASHBOARD,
        Permission.MANAGE_RECEBIMENTO,
        Permission.MANAGE_APONTAMENTO,
        Permission.MANAGE_ARMAZENAGEM,
        Permission.MANAGE_PEDIDOS,
        Permission.MANAGE_PICKING,
        Permission.MANAGE_CONFERENCIA,
        Permission.MANAGE_EXPEDICAO,
        Permission.VIEW_MISSOES,
        Permission.VIEW_RELATORIOS,
    ],
    'Cadastros': [
        Permission.MANAGE_CADASTRO_SKU,
        Permission.MANAGE_CADASTRO_ENDERECO,
        Permission.MANAGE_CADASTRO_INDUSTRIA,
    ],
    'Administração': [
        Permission.MANAGE_CADASTRO_USUARIOS,
        Permission.MANAGE_CADASTRO_PERFIS,
    ],
};

const ProfileModal: React.FC<ProfileModalProps> = ({ profile, onSave, onClose, serverError }) => {
    const isNewProfile = !profile?.id;
    const [formData, setFormData] = useState({
        name: profile?.name || '',
        permissions: profile?.permissions || {},
    });
    const [error, setError] = useState('');

    const handlePermissionChange = (permission: Permission, checked: boolean) => {
        setFormData(prev => ({
            ...prev,
            permissions: {
                ...prev.permissions,
                [permission]: checked
            }
        }));
    };

    const handleSelectAllGroup = (group: Permission[], checked: boolean) => {
        const newPermissions = { ...formData.permissions };
        group.forEach(p => {
            newPermissions[p] = checked;
        });
        setFormData(prev => ({ ...prev, permissions: newPermissions }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (!formData.name) {
            setError('O nome do perfil é obrigatório.');
            return;
        }
        onSave(formData);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl max-h-[90vh] flex flex-col">
                <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">{isNewProfile ? 'Novo' : 'Editar'} Perfil de Acesso</h3>
                
                {error && <p className="text-red-500 text-sm mb-2">{error}</p>}
                {serverError && <p className="text-red-500 text-sm mb-2">{serverError}</p>}

                <form onSubmit={handleSubmit} className="flex-grow overflow-y-auto pr-2">
                    <div className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Nome do Perfil</label>
                            <input 
                                type="text" 
                                name="name" 
                                value={formData.name} 
                                onChange={(e) => setFormData(p => ({...p, name: e.target.value}))} 
                                required 
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm py-2 px-3"
                            />
                        </div>
                        
                        <div>
                            <h4 className="text-md font-medium text-gray-800 mb-2">Permissões</h4>
                            <div className="space-y-4">
                                {Object.entries(permissionGroups).map(([groupName, permissions]) => (
                                    <fieldset key={groupName} className="border p-4 rounded-md">
                                        <legend className="text-sm font-semibold px-2">{groupName}</legend>
                                        <div className="flex items-center mb-2">
                                            <input
                                                type="checkbox"
                                                id={`select-all-${groupName}`}
                                                className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                                onChange={(e) => handleSelectAllGroup(permissions, e.target.checked)}
                                                checked={permissions.every(p => formData.permissions[p])}
                                            />
                                            <label htmlFor={`select-all-${groupName}`} className="ml-2 block text-sm font-medium text-gray-900">
                                                Selecionar Tudo
                                            </label>
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                            {permissions.map(p => (
                                                <div key={p} className="relative flex items-start">
                                                    <div className="flex h-5 items-center">
                                                        <input
                                                            id={p}
                                                            name={p}
                                                            type="checkbox"
                                                            checked={!!formData.permissions[p]}
                                                            onChange={(e) => handlePermissionChange(p, e.target.checked)}
                                                            className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                                        />
                                                    </div>
                                                    <div className="ml-3 text-sm">
                                                        <label htmlFor={p} className="font-medium text-gray-700">{permissionLabels[p]}</label>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </fieldset>
                                ))}
                            </div>
                        </div>
                    </div>
                </form>
                <div className="flex justify-end space-x-2 pt-4 border-t mt-4 flex-shrink-0">
                    <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">Cancelar</button>
                    <button type="button" onClick={handleSubmit} className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">Salvar</button>
                </div>
            </div>
        </div>
    );
};

export default ProfileModal;