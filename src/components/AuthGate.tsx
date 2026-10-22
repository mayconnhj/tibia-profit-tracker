import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

// Só libera o app com sessão ativa. As policies RLS (006_enable_auth_rls.sql)
// bloqueiam o banco pra quem não está logado, então isso aqui é só a porta da frente.
export function AuthGate({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    const { data } = supabase.auth.onAuthStateChange((_event, s) => setSession(s));
    return () => data.subscription.unsubscribe();
  }, []);

  if (loading) {
    return <div className="p-6 text-sm text-muted-foreground">Carregando…</div>;
  }
  if (!session) return <LoginPage />;
  return <>{children}</>;
}

function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setError('E-mail ou senha inválidos.');
    setSubmitting(false);
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <form onSubmit={handleSubmit} className="card w-full max-w-sm p-6 space-y-4">
        <div>
          <h1 className="text-[15px] font-semibold tracking-tight">Tibia Profit Tracker</h1>
          <p className="text-xs text-muted-foreground">Entre para continuar</p>
        </div>
        <label className="block space-y-1">
          <span className="text-xs text-muted-foreground">E-mail</span>
          <Input
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full"
          />
        </label>
        <label className="block space-y-1">
          <span className="text-xs text-muted-foreground">Senha</span>
          <Input
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full"
          />
        </label>
        {error && <p className="text-xs text-red-600">{error}</p>}
        <Button type="submit" variant="primary" className="w-full" disabled={submitting}>
          {submitting ? 'Entrando…' : 'Entrar'}
        </Button>
      </form>
    </div>
  );
}
