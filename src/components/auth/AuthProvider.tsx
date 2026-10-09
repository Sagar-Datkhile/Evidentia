"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { User, Session } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import {
  UserProfile,
  UserRole,
  StandardRole,
  normalizeRole,
  canRegisterEvidence as checkCanRegisterEvidence,
} from "@/lib/supabase/types";

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  session: Session | null;
  role: StandardRole;
  isLoading: boolean;
  isPending: boolean;
  canRegister: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  updateProfile: (updates: {
    fullName?: string;
    phone?: string;
    avatarUrl?: string;
  }) => Promise<{ success: boolean; error?: string }>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  session: null,
  role: "pending",
  isLoading: true,
  isPending: true,
  canRegister: false,
  signOut: async () => {},
  refreshProfile: async () => {},
  updateProfile: async () => ({ success: false }),
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [supabase] = useState(() => createClient());
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchProfileForUser = useCallback(
    async (authUser: User): Promise<UserProfile | null> => {
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", authUser.id)
          .maybeSingle();

        if (error) {
          console.warn("Could not query profiles table:", error.message);
        }

        if (data) {
          return {
            id: data.id,
            email: data.email || authUser.email || "",
            fullName: data.full_name || authUser.user_metadata?.full_name || authUser.user_metadata?.name || "Judicial Officer",
            phone: data.phone || authUser.user_metadata?.phone,
            role: data.role as UserRole,
            organizationId: data.organization_id,
            badgeNumber: data.badge_number,
            avatarUrl: data.avatar_url || authUser.user_metadata?.avatar_url,
            isActive: data.is_active ?? true,
            createdAt: data.created_at || new Date().toISOString(),
            updatedAt: data.updated_at,
          };
        }

        // If no row exists yet in profiles (e.g. trigger delayed or unapplied),
        // build from auth metadata with safe 'pending' default role
        const metadata = authUser.user_metadata || {};
        const safeProfile: UserProfile = {
          id: authUser.id,
          email: authUser.email || "",
          fullName:
            metadata.full_name ||
            metadata.name ||
            authUser.email?.split("@")[0] ||
            "Judicial Officer",
          phone: metadata.phone || undefined,
          role: "pending",
          avatarUrl: metadata.avatar_url || undefined,
          isActive: true,
          createdAt: new Date().toISOString(),
        };

        // Attempt non-blocking profile creation
        try {
          await supabase.from("profiles").upsert({
            id: safeProfile.id,
            email: safeProfile.email,
            full_name: safeProfile.fullName,
            phone: safeProfile.phone || null,
            role: "pending",
            avatar_url: safeProfile.avatarUrl || null,
          });
        } catch {
          // Non-critical if table not yet created
        }

        return safeProfile;
      } catch (err) {
        console.error("Error in fetchProfileForUser:", err);
        return null;
      }
    },
    [supabase]
  );

  const refreshProfile = useCallback(async () => {
    if (!user) return;
    const prof = await fetchProfileForUser(user);
    if (prof) setProfile(prof);
  }, [user, fetchProfileForUser]);

  useEffect(() => {
    let mounted = true;

    async function initializeAuth() {
      try {
        const { data: { session: initialSession } } = await supabase.auth.getSession();
        if (!mounted) return;

        if (initialSession?.user) {
          setSession(initialSession);
          setUser(initialSession.user);
          const prof = await fetchProfileForUser(initialSession.user);
          if (mounted) setProfile(prof);
        } else {
          setSession(null);
          setUser(null);
          setProfile(null);
        }
      } catch (err) {
        console.warn("Auth initialization notice:", err);
      } finally {
        if (mounted) setIsLoading(false);
      }
    }

    initializeAuth();

    // Listen to Supabase Auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
      if (!mounted) return;

      if (event === "SIGNED_OUT" || !currentSession) {
        setSession(null);
        setUser(null);
        setProfile(null);
        setIsLoading(false);
        // Clear any local storage session
        if (typeof window !== "undefined") {
          localStorage.removeItem("evidentia_active_user");
        }
        return;
      }

      setSession(currentSession);
      setUser(currentSession.user);
      setIsLoading(true);

      const prof = await fetchProfileForUser(currentSession.user);
      if (mounted) {
        setProfile(prof);
        setIsLoading(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [supabase, fetchProfileForUser]);

  const signOut = useCallback(async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.warn("Sign out error:", err);
    } finally {
      setUser(null);
      setProfile(null);
      setSession(null);
      if (typeof window !== "undefined") {
        localStorage.removeItem("evidentia_active_user");
        window.location.href = "/auth/sign-in";
      }
    }
  }, [supabase]);

  const updateProfile = useCallback(
    async (updates: { fullName?: string; phone?: string; avatarUrl?: string }) => {
      if (!user) return { success: false, error: "Not authenticated" };

      try {
        const payload: Record<string, any> = {
          updated_at: new Date().toISOString(),
        };
        if (updates.fullName !== undefined) payload.full_name = updates.fullName;
        if (updates.phone !== undefined) payload.phone = updates.phone;
        if (updates.avatarUrl !== undefined) payload.avatar_url = updates.avatarUrl;

        const { error } = await supabase
          .from("profiles")
          .update(payload)
          .eq("id", user.id);

        if (error) {
          return { success: false, error: error.message };
        }

        // Also update auth user metadata
        await supabase.auth.updateUser({
          data: {
            full_name: updates.fullName,
            phone: updates.phone,
            avatar_url: updates.avatarUrl,
          },
        });

        await refreshProfile();
        return { success: true };
      } catch (err: any) {
        return { success: false, error: err.message || "Failed to update profile" };
      }
    },
    [user, supabase, refreshProfile]
  );

  const role: StandardRole = normalizeRole(profile?.role);
  const isPending = role === "pending";
  const canRegister = checkCanRegisterEvidence(profile?.role);

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        session,
        role,
        isLoading,
        isPending,
        canRegister,
        signOut,
        refreshProfile,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
