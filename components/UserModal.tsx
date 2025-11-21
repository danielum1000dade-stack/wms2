import React, { useState } from 'react';
import { User, UserRole, UserStatus } from '../types';

interface UserModalProps {
    user: Partial<User> | null;
    onSave: (data: Omit<User, 'id'>) => void;
    onClose: () => void;
    serverError?: string;
}

const UserModal: React.FC<UserModalProps> = ({ user, onSave, onClose, serverError }) => {
    const isNewUser = !user?.id;
    const [formData, setFormData] = useState({
        username: user?.username || '',
        fullName: user?.fullName || '',
        role: user?.role || UserRole.OPERADOR,
        status: user?.status || UserStatus.ATIVO,
        password: '',
        confirmPassword: '',
    });
    const [error, setError] = useState('');

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (isNewUser || formData.password) {
            if (formData.password !== formData.confirmPassword) {
                setError('As senhas não coincidem.');
                return;
            }
            if (formData.password.length < 6) {
                setError('A senha deve ter no mínimo 6 caracteres.');
                return;
            }
        }
        
        const { password, confirmPassword, ...userDataToSave } = formData;
        onSave(userDataToSave);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
                <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">{isNewUser ? 'Novo' : 'Editar'} Usuário</h3>
                
                {error && <p className="text-red-500 text-sm mb-2">{error}</p>}
                {serverError && <p className="text-red-500 text-sm mb-2">{serverError}</p>}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Nome de Usuário</label>
                            <input type="text" name="username" value={formData.username} onChange={handleChange} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm py-2 px-3"/>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Nome Completo</label>
                            <input type="text" name="fullName" value={formData.fullName} onChange={handleChange} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm py-2 px-3"/>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Perfil de Acesso</label>
                            <select name="role" value={formData.role} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm py-2 px-3 bg-white">
                                {Object.values(UserRole).map(role => <option key={role} value={role}>{role}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Status</label>
                             <select name="status" value={formData.status} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm py-2 px-3 bg-white">
                                {Object.values(UserStatus).map(status => <option key={status} value={status}>{status}</option>)}
                            </select>
                        </div>
                    </div>
                    
                    <div className="pt-4 border-t">
                        <p className="text-sm text-gray-600">{isNewUser ? 'Defina a senha para o novo usuário.' : 'Deixe em branco para não alterar a senha.'}</p>
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Senha</label>
                                <input type="password" name="password" value={formData.password} onChange={handleChange} required={isNewUser} minLength={6} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm py-2 px-3"/>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Confirmar Senha</label>
                                <input type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} required={isNewUser} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm py-2 px-3"/>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end space-x-2 pt-4">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">Cancelar</button>
                        <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">Salvar</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default UserModal;