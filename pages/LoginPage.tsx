
import React, { useState } from 'react';
import { CubeIcon, LockClosedIcon, UserIcon, UserPlusIcon } from '@heroicons/react/24/solid';
import { useWMS } from '../context/WMSContext';

interface LoginPageProps {
    onLogin: () => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
    const { users, registerUser } = useWMS();
    const [isRegistering, setIsRegistering] = useState(false);
    
    // Login States
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    
    // Register States
    const [regFullName, setRegFullName] = useState('');
    const [regUsername, setRegUsername] = useState('');
    const [regPassword, setRegPassword] = useState('');
    const [regConfirmPassword, setRegConfirmPassword] = useState('');

    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleLoginSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        
        // Simple verification (mock password check)
        const user = users.find(u => u.username === username);
        
        // In a real app, verify password hash here. 
        // For this prototype, we accept any password if user exists, or just verify user existence.
        if (user && user.status === 'Ativo') {
            onLogin();
        } else {
            setError('Usuário não encontrado ou inativo.');
        }
    };

    const handleRegisterSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (regPassword !== regConfirmPassword) {
            setError('As senhas não coincidem.');
            return;
        }
        if (regPassword.length < 6) {
            setError('A senha deve ter no mínimo 6 caracteres.');
            return;
        }

        const result = registerUser({ 
            username: regUsername, 
            fullName: regFullName, 
            password: regPassword 
        });

        if (result.success) {
            setSuccess('Conta criada com sucesso! Faça login para continuar.');
            setIsRegistering(false);
            setUsername(regUsername);
            setPassword(''); // Clear password
            // Clear register form
            setRegFullName('');
            setRegUsername('');
            setRegPassword('');
            setRegConfirmPassword('');
        } else {
            setError(result.message || 'Erro ao criar conta.');
        }
    };

    const toggleMode = () => {
        setIsRegistering(!isRegistering);
        setError('');
        setSuccess('');
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-lg">
                <div>
                    <div className="flex justify-center">
                       <CubeIcon className="h-12 w-auto text-indigo-600" />
                    </div>
                    <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                        {isRegistering ? 'Criar Nova Conta' : 'WMS Pro Login'}
                    </h2>
                    <p className="mt-2 text-center text-sm text-gray-600">
                        {isRegistering ? 'Preencha seus dados para acessar o sistema' : 'Acesse sua conta para gerenciar o estoque'}
                    </p>
                </div>

                {error && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
                        <span className="block sm:inline">{error}</span>
                    </div>
                )}
                {success && (
                    <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative" role="alert">
                        <span className="block sm:inline">{success}</span>
                    </div>
                )}

                {isRegistering ? (
                    <form className="mt-8 space-y-6" onSubmit={handleRegisterSubmit}>
                        <div className="rounded-md shadow-sm -space-y-px">
                            <div>
                                <label htmlFor="reg-fullname" className="sr-only">Nome Completo</label>
                                <input
                                    id="reg-fullname"
                                    name="fullName"
                                    type="text"
                                    required
                                    className="appearance-none rounded-none relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                                    placeholder="Nome Completo"
                                    value={regFullName}
                                    onChange={(e) => setRegFullName(e.target.value)}
                                />
                            </div>
                            <div>
                                <label htmlFor="reg-username" className="sr-only">Usuário</label>
                                <input
                                    id="reg-username"
                                    name="username"
                                    type="text"
                                    required
                                    className="appearance-none rounded-none relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                                    placeholder="Nome de Usuário"
                                    value={regUsername}
                                    onChange={(e) => setRegUsername(e.target.value)}
                                />
                            </div>
                            <div>
                                <label htmlFor="reg-password" className="sr-only">Senha</label>
                                <input
                                    id="reg-password"
                                    name="password"
                                    type="password"
                                    required
                                    className="appearance-none rounded-none relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                                    placeholder="Senha"
                                    value={regPassword}
                                    onChange={(e) => setRegPassword(e.target.value)}
                                />
                            </div>
                            <div>
                                <label htmlFor="reg-confirm-password" className="sr-only">Confirmar Senha</label>
                                <input
                                    id="reg-confirm-password"
                                    name="confirmPassword"
                                    type="password"
                                    required
                                    className="appearance-none rounded-none relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                                    placeholder="Confirmar Senha"
                                    value={regConfirmPassword}
                                    onChange={(e) => setRegConfirmPassword(e.target.value)}
                                />
                            </div>
                        </div>

                        <div>
                            <button
                                type="submit"
                                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                            >
                                <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                                    <UserPlusIcon className="h-5 w-5 text-green-500 group-hover:text-green-400" aria-hidden="true" />
                                </span>
                                Criar Conta
                            </button>
                        </div>
                    </form>
                ) : (
                    <form className="mt-8 space-y-6" onSubmit={handleLoginSubmit}>
                        <input type="hidden" name="remember" defaultValue="true" />
                        <div className="rounded-md shadow-sm -space-y-px">
                            <div>
                                 <label htmlFor="username" className="sr-only">Usuário</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                         <UserIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                                    </div>
                                    <input
                                        id="username"
                                        name="username"
                                        type="text"
                                        autoComplete="username"
                                        required
                                        className="appearance-none rounded-none relative block w-full px-3 py-3 pl-10 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                                        placeholder="Usuário"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                    />
                                </div>
                            </div>
                            <div>
                                 <label htmlFor="password" className="sr-only">Senha</label>
                                 <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                         <LockClosedIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                                    </div>
                                    <input
                                        id="password"
                                        name="password"
                                        type="password"
                                        autoComplete="current-password"
                                        required
                                        className="appearance-none rounded-none relative block w-full px-3 py-3 pl-10 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                                        placeholder="Senha"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>

                        <div>
                            <button
                                type="submit"
                                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                            >
                                <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                                    <LockClosedIcon className="h-5 w-5 text-indigo-500 group-hover:text-indigo-400" aria-hidden="true" />
                                </span>
                                Entrar
                            </button>
                        </div>
                    </form>
                )}

                <div className="text-center">
                    <button 
                        onClick={toggleMode}
                        className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
                    >
                        {isRegistering ? 'Já tem uma conta? Faça Login' : 'Novo funcionário? Cadastre-se aqui'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
