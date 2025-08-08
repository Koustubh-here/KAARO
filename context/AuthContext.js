import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [session, setSession] = useState(null);
  const [initializing, setInitializing] = useState(true);
  const [business, setBusiness] = useState(null);
  const [isBusinessLoading, setIsBusinessLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data: { session: current } } = await supabase.auth.getSession();
      if (mounted) setSession(current);
      setInitializing(false);
    })();
    const { data: subscription } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });
    return () => {
      mounted = false;
      subscription.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    const ensureBusinessForUser = async () => {
      if (!session?.user) {
        setBusiness(null);
        return;
      }
      setIsBusinessLoading(true);
      try {
        const userId = session.user.id;
        const fullName = session.user.user_metadata?.full_name || session.user.user_metadata?.name;
        const email = session.user.email;

        // Check for existing business for this owner
        const { data: existing, error: fetchErr } = await supabase
          .from('businesses')
          .select('*')
          .eq('owner_user', userId)
          .maybeSingle();
        if (fetchErr) {
          console.log('[Auth] Error fetching business', fetchErr.message);
        }

        if (existing) {
          setBusiness(existing);
          setIsBusinessLoading(false);
          return;
        }

        // Create a default business for first-time user
        const defaultName = fullName || (email ? email.split('@')[0] : 'My Business');
        const { data: created, error: insertErr } = await supabase
          .from('businesses')
          .insert({ owner_user: userId, name: defaultName })
          .select()
          .single();
        if (insertErr) {
          console.log('[Auth] Error creating business', insertErr.message);
        }
        setBusiness(created || null);
      } catch (e) {
        console.log('[Auth] ensureBusinessForUser error', e.message);
      } finally {
        setIsBusinessLoading(false);
      }
    };

    ensureBusinessForUser();
  }, [session?.user?.id]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  return (
    <AuthContext.Provider value={{ session, user: session?.user || null, business, isBusinessLoading, initializing, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
