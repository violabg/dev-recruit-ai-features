"use client";

import type React from "react";

import { SupabaseFallback } from "@/components/shared/supabase-fallback";
import type { Database } from "@/lib/database.types";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { createContext, useContext, useEffect, useState } from "react";
import { toast } from "sonner";

type SupabaseContext = {
  supabase: SupabaseClient<Database> | null;
  user: any;
  loading: boolean;
  refreshSession: () => Promise<void>;
};

const SupabaseContext = createContext<SupabaseContext>({
  supabase: null,
  user: null,
  loading: true,
  refreshSession: async () => {},
});

export const useSupabase = () => useContext(SupabaseContext);

export const SupabaseProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [supabase, setSupabase] = useState<SupabaseClient<Database> | null>(
    null
  );
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  // Add a state to track if credentials are missing
  const [credentialsMissing, setCredentialsMissing] = useState(false);

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

  // Update the useEffect block to set this state
  useEffect(() => {
    // Get environment variables with fallbacks for development
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

    if (!supabaseUrl || !supabaseKey) {
      console.error(
        "Supabase credentials missing. Make sure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set."
      );
      setCredentialsMissing(true);
      setLoading(false);
      return;
    }

    const supabaseClient = createClient<Database>(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: true,
        storageKey: "supabase-auth",
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
    setSupabase(supabaseClient);

    // Initial session check
    const initializeAuth = async () => {
      try {
        const { data, error } = await supabaseClient.auth.getSession();
        if (error) {
          console.error("Error getting session:", error);
          setLoading(false);
          return;
        }

        if (data?.session) {
          const { data: userData } = await supabaseClient.auth.getUser();
          setUser(userData?.user || null);
        }
        setLoading(false);
      } catch (error) {
        console.error("Error in initializeAuth:", error);
        setLoading(false);
      }
    };

    initializeAuth();

    const { data: authListener } = supabaseClient.auth.onAuthStateChange(
      async (event, session) => {
        console.log("Auth state changed:", event, session?.user?.email);
        setUser(session?.user ?? null);

        if (event === "SIGNED_IN") {
          toast.success("Accesso effettuato", {
            description: `Benvenuto ${session?.user?.email}`,
          });
        } else if (event === "SIGNED_OUT") {
          toast.success("Disconnesso", {
            description: "Hai effettuato il logout con successo",
          });
        }
      }
    );

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  // Update the return statement to show the fallback when credentials are missing
  return (
    <SupabaseContext.Provider
      value={{ supabase, user, loading, refreshSession }}
    >
      {credentialsMissing ? <SupabaseFallback /> : children}
    </SupabaseContext.Provider>
  );
};
