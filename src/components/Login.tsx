import React, { useState } from 'react';
import { User, Page } from '../types/index';

interface LoginProps {
    onLogin: (user: User) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        const mockUser: User = {
            id: 'mock-user-id',
            name: 'Usuário Demo',
            email: 'demo@ldrseguros.com',
            role: 'Gestor',
            permissions: Object.values(Page),
        };

        // Simulate API call delay
        setTimeout(() => {
            if (email === 'demo@ldrseguros.com' && password === '123456') {
                onLogin(mockUser);
            } else {
                setError('Credenciais inválidas. Tente novamente.');
            }
            setIsLoading(false);
        }, 500);
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-ui-background">
            <div className="w-full max-w-md p-8 space-y-8 bg-ui-card rounded-lg border border-ui-border shadow-lg">
                <div className="text-center">
                    <h1 className="text-4xl font-bold tracking-wider text-brand-primary">LDR</h1>
                    <p className="text-lg text-text-secondary">SEGUROS</p>
                    <h2 className="mt-6 text-2xl font-bold text-text-primary">
                        Acesse o CRM
                    </h2>
                </div>
                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    <input type="hidden" name="remember" value="true" />
                    <div className="rounded-md shadow-sm -space-y-px">
                        <div>
                            <label htmlFor="email-address" className="sr-only">Email</label>
                            <input
                                id="email-address"
                                name="email"
                                type="email"
                                autoComplete="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="appearance-none rounded-none relative block w-full px-3 py-3 border border-ui-border bg-white placeholder-text-muted text-text-primary rounded-t-md focus:outline-none focus:ring-brand-primary focus:border-brand-primary focus:z-10 sm:text-sm"
                                placeholder="Seu e-mail"
                            />
                        </div>
                        <div>
                            <label htmlFor="password" className="sr-only">Senha</label>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                autoComplete="current-password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="appearance-none rounded-none relative block w-full px-3 py-3 border border-ui-border bg-white placeholder-text-muted text-text-primary rounded-b-md focus:outline-none focus:ring-brand-primary focus:border-brand-primary focus:z-10 sm:text-sm"
                                placeholder="Senha"
                            />
                        </div>
                    </div>

                    {error && (
                        <p className="text-sm text-danger text-center">{error}</p>
                    )}

                    <div>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-brand-primary hover:bg-brand-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary transition-colors disabled:bg-gray-400"
                        >
                            {isLoading ? 'Entrando...' : 'Entrar'}
                        </button>
                    </div>
                </form>
                <p className="mt-2 text-center text-sm text-text-muted">
                    Use <code className="font-mono bg-ui-hover p-1 rounded">demo@ldrseguros.com</code> e senha <code className="font-mono bg-ui-hover p-1 rounded">123456</code>
                </p>
            </div>
        </div>
    );
};

export default Login;