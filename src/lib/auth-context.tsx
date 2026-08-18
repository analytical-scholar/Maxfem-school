import React, { createContext, useContext, useEffect, useState } from "react";
import type { User, Session } from "@supabase/supabase-js";
import { supabase, isSupabaseConfigured } from "./supabase";
import type { Profile, UserRole, AccountStatus } from "@/types/database";
import { logAuditEvent } from "./audit";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  role: UserRole | null;
  status: AccountStatus | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isConfigured: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: Error | null }>;
  updatePassword: (newPassword: string) => Promise<{ error: Error | null }>;
  refreshProfile: () => Promise<void>;
  // Test/Development role switcher for instant verification
  setMockSession: (mockRole: UserRole, mockStatus?: AccountStatus) => void;
  clearMockSession: () => void;
  isMockActive: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const DEMO_PROFILES: Record<UserRole, Profile> = {
  SUPER_ADMIN: {
    id: "00000000-0000-0000-0000-000000000001",
    email: "superadmin@maxfem.edu.ng",
    full_name: "Dr. Maxfem Administrator",
    phone: "+234 800 000 0001",
    avatar_url: null,
    role: "SUPER_ADMIN",
    status: "ACTIVE",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  ADMIN: {
    id: "00000000-0000-0000-0000-000000000002",
    email: "admin@maxfem.edu.ng",
    full_name: "Academic Officer",
    phone: "+234 800 000 0002",
    avatar_url: null,
    role: "ADMIN",
    status: "ACTIVE",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  TEACHER: {
    id: "00000000-0000-0000-0000-000000000003",
    email: "teacher.adeyemi@maxfem.edu.ng",
    full_name: "Mr. Babatunde Adeyemi",
    phone: "+234 800 000 0003",
    avatar_url: null,
    role: "TEACHER",
    status: "ACTIVE",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  STUDENT: {
    id: "00000000-0000-0000-0000-000000000004",
    email: "student.chisom@maxfem.edu.ng",
    full_name: "Chisom Okonkwo",
    phone: "+234 800 000 0004",
    avatar_url: null,
    role: "STUDENT",
    status: "ACTIVE",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
};

const MOCK_STORAGE_KEY = "maxfem_mock_auth_role";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMockActive, setIsMockActive] = useState(false);

  const fetchProfile = async (userId: string, userEmail?: string) => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .maybeSingle();

      if (error) {
        console.warn("[Auth] Failed to load profile:", error.message);
        // Fallback default profile if table is empty or pending
        setProfile({
          id: userId,
          email: userEmail || "user@maxfem.edu.ng",
          full_name: userEmail?.split("@")[0] || "Maxfem User",
          phone: null,
          avatar_url: null,
          role: "STUDENT",
          status: "ACTIVE",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
        return;
      }

      if (data) {
        setProfile(data as unknown as Profile);
      }
    } catch (err) {
      console.error("[Auth] Exception loading profile:", err);
    }
  };

  useEffect(() => {
    // Check if test mock session is stored in localStorage
    const savedMockRole =
      typeof window !== "undefined" ? localStorage.getItem(MOCK_STORAGE_KEY) : null;
    if (savedMockRole && savedMockRole in DEMO_PROFILES) {
      const mockRole = savedMockRole as UserRole;
      const mockProfile = DEMO_PROFILES[mockRole];
      setProfile(mockProfile);
      setUser({
        id: mockProfile.id,
        email: mockProfile.email,
        app_metadata: {},
        user_metadata: { full_name: mockProfile.full_name, role: mockProfile.role },
        aud: "authenticated",
        created_at: mockProfile.created_at,
      } as unknown as User);
      setIsMockActive(true);
      setIsLoading(false);
      return;
    }

    if (!isSupabaseConfigured) {
      setIsLoading(false);
      return;
    }

    // Initialize Supabase Auth session
    supabase.auth
      .getSession()
      .then(({ data: { session: currentSession } }) => {
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        if (currentSession?.user) {
          fetchProfile(currentSession.user.id, currentSession.user.email).finally(() => {
            setIsLoading(false);
          });
        } else {
          setIsLoading(false);
        }
      })
      .catch((err) => {
        console.error("[Auth] Session get error:", err);
        setIsLoading(false);
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      setSession(newSession);
      setUser(newSession?.user ?? null);

      if (event === "SIGNED_IN" && newSession?.user) {
        await fetchProfile(newSession.user.id, newSession.user.email);
        await logAuditEvent({
          action: "USER_LOGIN",
          entityType: "auth.users",
          entityId: newSession.user.id,
        });
      } else if (event === "SIGNED_OUT") {
        setProfile(null);
      } else if (event === "USER_UPDATED" && newSession?.user) {
        await fetchProfile(newSession.user.id, newSession.user.email);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const refreshProfile = async () => {
    if (user?.id) {
      await fetchProfile(user.id, user.email);
    }
  };

  const signIn = async (email: string, password: string): Promise<{ error: Error | null }> => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { error };
      }

      if (data.user) {
        setUser(data.user);
        setSession(data.session);
        await fetchProfile(data.user.id, data.user.email);
      }

      return { error: null };
    } catch (err: unknown) {
      return { error: err instanceof Error ? err : new Error(String(err)) };
    }
  };

  const signOut = async () => {
    if (isMockActive) {
      clearMockSession();
      return;
    }

    if (user?.id) {
      await logAuditEvent({
        action: "USER_LOGOUT",
        entityType: "auth.users",
        entityId: user.id,
      });
    }

    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
  };

  const resetPassword = async (email: string): Promise<{ error: Error | null }> => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      return { error };
    } catch (err: unknown) {
      return { error: err instanceof Error ? err : new Error(String(err)) };
    }
  };

  const updatePassword = async (newPassword: string): Promise<{ error: Error | null }> => {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });
      return { error };
    } catch (err: unknown) {
      return { error: err instanceof Error ? err : new Error(String(err)) };
    }
  };

  const setMockSession = (mockRole: UserRole, mockStatus: AccountStatus = "ACTIVE") => {
    const demoProf = { ...DEMO_PROFILES[mockRole], status: mockStatus };
    setProfile(demoProf);
    setUser({
      id: demoProf.id,
      email: demoProf.email,
      app_metadata: {},
      user_metadata: { full_name: demoProf.full_name, role: demoProf.role },
      aud: "authenticated",
      created_at: demoProf.created_at,
    } as unknown as User);
    setIsMockActive(true);
    if (typeof window !== "undefined") {
      localStorage.setItem(MOCK_STORAGE_KEY, mockRole);
    }
  };

  const clearMockSession = () => {
    setUser(null);
    setSession(null);
    setProfile(null);
    setIsMockActive(false);
    if (typeof window !== "undefined") {
      localStorage.removeItem(MOCK_STORAGE_KEY);
    }
  };

  const value: AuthContextType = {
    user,
    session,
    profile,
    role: profile?.role ?? null,
    status: profile?.status ?? null,
    isLoading,
    isAuthenticated: Boolean(user && profile),
    isConfigured: isSupabaseConfigured,
    signIn,
    signOut,
    resetPassword,
    updatePassword,
    refreshProfile,
    setMockSession,
    clearMockSession,
    isMockActive,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
