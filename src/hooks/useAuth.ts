import { useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import i18n from '@/lib/i18n';

export type AppRole = 'admin' | 'manager' | 'viewer';

interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
  role: AppRole | null;
}

export const useAuth = () => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    session: null,
    loading: true,
    role: null,
  });
  const { toast } = useToast();

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setAuthState(prev => ({
          ...prev,
          session,
          user: session?.user ?? null,
          loading: false,
        }));

        // Defer role fetch with setTimeout to prevent deadlock
        if (session?.user) {
          setTimeout(() => {
            fetchUserRole(session.user.id);
          }, 0);
        } else {
          setAuthState(prev => ({ ...prev, role: null }));
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setAuthState(prev => ({
        ...prev,
        session,
        user: session?.user ?? null,
        loading: false,
      }));

      if (session?.user) {
        fetchUserRole(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserRole = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) throw error;

      setAuthState(prev => ({
        ...prev,
        role: (data?.role as AppRole) ?? 'viewer',
      }));
    } catch (error) {
      console.error('Error fetching user role:', error);
      setAuthState(prev => ({ ...prev, role: 'viewer' }));
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        if (error.message === 'Invalid login credentials') {
          toast({
            title: i18n.t('hooks.auth.signInError'),
            description: i18n.t('hooks.auth.invalidCredentials'),
            variant: 'destructive',
          });
        } else {
          toast({
            title: i18n.t('hooks.auth.signInError'),
            description: error.message,
            variant: 'destructive',
          });
        }
        return { error };
      }

      toast({
        title: i18n.t('hooks.auth.welcome'),
        description: i18n.t('hooks.auth.signInSuccess'),
      });

      return { error: null };
    } catch (error) {
      console.error('Sign in error:', error);
      return { error };
    }
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    try {
      const redirectUrl = `${window.location.origin}/`;

      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            full_name: fullName,
          },
        },
      });

      if (error) {
        if (error.message.includes('already registered')) {
          toast({
            title: i18n.t('hooks.auth.signUpError'),
            description: i18n.t('hooks.auth.emailAlreadyRegistered'),
            variant: 'destructive',
          });
        } else {
          toast({
            title: i18n.t('hooks.auth.signUpError'),
            description: error.message,
            variant: 'destructive',
          });
        }
        return { error };
      }

      toast({
        title: i18n.t('hooks.auth.accountCreated'),
        description: i18n.t('hooks.auth.signUpSuccess'),
      });

      return { error: null };
    } catch (error) {
      console.error('Sign up error:', error);
      return { error };
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();

      if (error) {
        toast({
          title: i18n.t('hooks.auth.signOutError'),
          description: error.message,
          variant: 'destructive',
        });
        return { error };
      }

      toast({
        title: i18n.t('hooks.auth.goodbye'),
        description: i18n.t('hooks.auth.signOutSuccess'),
      });

      return { error: null };
    } catch (error) {
      console.error('Sign out error:', error);
      return { error };
    }
  };

  const isAdmin = authState.role === 'admin';
  const isManager = authState.role === 'manager' || authState.role === 'admin';

  return {
    user: authState.user,
    session: authState.session,
    loading: authState.loading,
    role: authState.role,
    isAdmin,
    isManager,
    signIn,
    signUp,
    signOut,
  };
};
