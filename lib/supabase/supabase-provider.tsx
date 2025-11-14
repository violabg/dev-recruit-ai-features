"use client";
import { createClient } from "@/lib/supabase/client";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import {
  createContext,
  Suspense,
  useContext,
  useEffect,
  useState,
} from "react";

interface SupabaseContextValue {
  loading: boolean;
  supabase: SupabaseClient;
  user: User | null;
  refreshSession: () => Promise<void>;
}

const SupabaseContext = createContext<SupabaseContextValue>({
  user: null,
  loading: true,
  supabase: createClient(),
  refreshSession: async () => {},
});

export function SupabaseProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [supabase] = useState(() => createClient());

  // Function to refresh the session
  const refreshSession = async () => {
    if (!supabase) return;

    try {
      const { data, error } = await supabase.auth.getSession();
      if (error) {
        console.error("Error refreshing session:", error);
        return;
      }

      if (data?.session) {
        const { data: userData } = await supabase.auth.getUser();
        setUser(userData?.user || null);
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error("Error in refreshSession:", error);
    }
  };

  useEffect(() => {
    let mounted = true;
    supabase.auth.getUser().then(({ data }) => {
      if (mounted) {
        setUser(data.user ?? null);
        setLoading(false);
      }
    });
    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
      }
    );
    return () => {
      mounted = false;
      listener?.subscription.unsubscribe();
    };
  }, [supabase.auth]);

  return (
    <Suspense>
      <SupabaseContext.Provider
        value={{ loading, supabase, user, refreshSession }}
      >
        {children}
      </SupabaseContext.Provider>
    </Suspense>
  );
}

export function useSupabase() {
  return useContext(SupabaseContext);
}
