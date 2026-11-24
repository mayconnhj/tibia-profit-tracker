import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

// Só libera o app com sessão ativa. Cada conta enxerga só os próprios dados: isso é
// garantido no banco pelas policies RLS (007_per_user_data.sql), não aqui.
export function AuthGate({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const qc = useQueryClient();
  const userId = useRef<string | null>(null);

  useEffect(() => {
    // Trocou de conta (ou saiu): descarta o cache do React Query pra nada da conta
    // anterior aparecer na tela, nem por um instante.
    const apply = (s: Session | null) => {
      const id = s?.user.id ?? null;
      if (id !== userId.current) {
        qc.clear();
        userId.current = id;
      }
      setSession(s);
    };
    supabase.auth.getSession().then(({ data }) => {
      apply(data.session);
      setLoading(false);
    });
    const { data } = supabase.auth.onAuthStateChange((_event, s) => apply(s));
    return () => data.subscription.unsubscribe();
  }, [qc]);

  if (loading) {
    return <div className="p-6 text-sm text-muted-foreground">Carregando…</div>;
  }
  if (!session) return <AuthPage />;
  return <>{children}</>;
}

type Mode = 'login' | 'signup';

const MIN_PASSWORD = 8;

function AuthPage() {
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function switchMode(m: Mode) {
    setMode(m);
    setError(null);
    setInfo(null);
    setPassword('');
    setConfirm('');
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);

    if (mode === 'signup') {
      if (password.length < MIN_PASSWORD) {
        setError(`A senha precisa ter pelo menos ${MIN_PASSWORD} caracteres.`);
        return;
      }
      if (password !== confirm) {
        setError('As senhas não conferem.');
        return;
      }
    }

    setSubmitting(true);
    if (mode === 'login') {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setError(
          /not confirmed/i.test(error.message)
            ? 'Confirme seu e-mail antes de entrar (veja sua caixa de entrada).'
            : 'E-mail ou senha inválidos.',
        );
      }
    } else {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: window.location.origin },
      });
      if (error) {
        setError(signupError(error.message));
      } else if (!data.session) {
        // Com "Confirm email" ligado no Supabase, a conta só entra depois do link.
        // (Se o e-mail já tiver conta, o Supabase responde igual de propósito, pra não
        // revelar quais e-mails estão cadastrados.)
        switchMode('login');
        setInfo('Conta criada! Enviamos um link de confirmação para o seu e-mail.');
      }
      // com sessão, o AuthGate já troca pra dentro do app sozinho
    }
    setSubmitting(false);
  }

  const isSignup = mode === 'signup';

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-sm space-y-4">
        <img
          src="/logo.webp"
          alt="Tibia Profit Tracker"
          width={160}
          height={160}
          className="mx-auto h-40 w-40"
        />
        <form onSubmit={handleSubmit} className="card p-6 space-y-4">
          <div>
            <h1 className="text-[15px] font-semibold tracking-tight">
              {isSignup ? 'Criar conta' : 'Entrar'}
            </h1>
            <p className="text-xs text-muted-foreground">
              {isSignup
                ? 'Seus lançamentos ficam visíveis só para você.'
                : 'Entre para continuar'}
            </p>
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
              autoComplete={isSignup ? 'new-password' : 'current-password'}
              required
              minLength={isSignup ? MIN_PASSWORD : undefined}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full"
            />
          </label>
          {isSignup && (
            <label className="block space-y-1">
              <span className="text-xs text-muted-foreground">Confirmar senha</span>
              <Input
                type="password"
                autoComplete="new-password"
                required
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className="w-full"
              />
            </label>
          )}
          {error && <p className="text-xs text-red-600">{error}</p>}
          {info && <p className="text-xs text-emerald-700">{info}</p>}
          <Button type="submit" variant="primary" className="w-full" disabled={submitting}>
            {submitting
              ? isSignup
                ? 'Criando conta…'
                : 'Entrando…'
              : isSignup
                ? 'Criar conta'
                : 'Entrar'}
          </Button>
          <p className="text-center text-xs text-muted-foreground">
            {isSignup ? 'Já tem conta? ' : 'Ainda não tem conta? '}
            <button
              type="button"
              onClick={() => switchMode(isSignup ? 'login' : 'signup')}
              className="font-medium text-foreground underline underline-offset-2"
            >
              {isSignup ? 'Entrar' : 'Criar conta'}
            </button>
          </p>
        </form>
      </div>
    </div>
  );
}

function signupError(msg: string): string {
  if (/already registered|already exists/i.test(msg)) return 'Este e-mail já tem conta. Tente entrar.';
  if (/signups not allowed|signup.*disabled/i.test(msg))
    return 'O cadastro de novas contas está desativado no momento.';
  if (/password/i.test(msg)) return 'Senha fraca demais. Use uma senha maior ou mais variada.';
  if (/rate limit|too many/i.test(msg)) return 'Muitas tentativas. Espere alguns minutos e tente de novo.';
  if (/invalid.*email|email.*invalid/i.test(msg)) return 'E-mail inválido.';
  return 'Não foi possível criar a conta. Tente de novo.';
}
