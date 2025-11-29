import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { toast } from 'sonner';

const Auth: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      toast.success('Login realizado com sucesso!');
      // No need to reload, App.tsx should listen to auth state changes
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error('Erro ao fazer login');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-ui-background">
      <div className="bg-ui-card p-8 rounded-lg border border-ui-border w-full max-w-md shadow-2xl">
        <h1 className="text-3xl font-bold text-text-primary mb-2 text-center">
          LDR Seguros
        </h1>
        <p className="text-text-secondary text-center mb-6">
          Faça login para continuar
        </p>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="password">Senha</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="mt-1"
            />
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Processando...' : 'Entrar'}
          </Button>
        </form>

        <div className="mt-6 text-center text-sm text-text-muted">
          <p>Apenas administradores podem criar novas contas.</p>
          <p>Contate seu administrador para obter acesso.</p>
        </div>
      </div>
    </div>
  );
};

export default Auth;
