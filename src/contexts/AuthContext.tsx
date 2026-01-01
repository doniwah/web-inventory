import { supabase } from "@/lib/supabase";
import { User } from "@supabase/supabase-js";
import { createContext, useEffect, useState, useRef } from "react";

export type UserRole = "admin" | "owner"; // Removed "gudang"

export interface UserPermissions {
  products: boolean;
  bundles: boolean;
  stock_in: boolean;
  stock_out: boolean;
  reports: boolean;
  history: boolean;
  suppliers: boolean;
  users: boolean;
  settings: boolean;
}

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  permissions?: UserPermissions;
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const fetchingRef = useRef(false);
  const lastFetchedId = useRef<string | null>(null);

  // Fetch user data from users table
  const fetchUserData = async (authUser: User): Promise<AuthUser | null> => {
    // Prevent duplicate fetches for same user
    if (fetchingRef.current && lastFetchedId.current === authUser.id) {
      console.log('⏭️ Skipping duplicate fetch for:', authUser.id);
      return null;
    }

    fetchingRef.current = true;
    lastFetchedId.current = authUser.id;

    try {
      console.log('🔍 Fetching user data for:', authUser.id);
      console.time('⏱️ Database query time');
      
      // Add timeout to detect slow queries
      const timeoutPromise = new Promise<null>((_, reject) =>
        setTimeout(() => {
          console.timeEnd('⏱️ Database query time');
          reject(new Error('Query timeout after 10 seconds'));
        }, 10000)
      );

      const queryPromise = supabase
        .from("users")
        .select("id, name, email, role, permissions")
        .eq("id", authUser.id)
        .single();

      const result = await Promise.race([queryPromise, timeoutPromise]);
      console.timeEnd('⏱️ Database query time');

      if (!result) {
        throw new Error('Query timeout');
      }

      const { data, error } = result as any;

      if (error) {
        console.error("❌ Error fetching user data:", error);
        
        // TEMPORARY: Use mock data if query fails
        console.warn('⚠️ Using mock data for testing');
        return {
          id: authUser.id,
          name: 'Administrator',
          email: authUser.email || 'admin@stockbundle.com',
          role: 'admin' as UserRole,
        };
      }

      if (!data) {
        console.error("❌ No user data found for ID:", authUser.id);
        return null;
      }

      console.log('✅ User data fetched:', data);
      return data as AuthUser;
    } catch (error) {
      console.error("❌ Fetch user data failed:", error);
      
      // TEMPORARY: Use mock data on timeout
      console.warn('⚠️ Using mock data due to timeout');
      return {
        id: authUser.id,
        name: 'Administrator',
        email: authUser.email || 'admin@stockbundle.com',
        role: 'admin' as UserRole,
      };
    } finally {
      fetchingRef.current = false;
    }
  };

  // Check session on mount
  useEffect(() => {
    const initAuth = async () => {
      console.log('🚀 Initializing auth...');
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (session?.user) {
          console.log('👤 Session found, fetching user data...');
          const userData = await fetchUserData(session.user);
          if (userData) {
            setUser(userData);
          } else {
            console.warn('⚠️ User data not found, clearing session');
            await supabase.auth.signOut();
          }
        } else {
          console.log('ℹ️ No active session');
        }
      } catch (error) {
        console.error("❌ Auth initialization error:", error);
      } finally {
        console.log('✅ Auth initialization complete');
        setLoading(false);
      }
    };

    initAuth();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔄 Auth state changed:', event);
      
      if (event === 'SIGNED_OUT') {
        setUser(null);
        setLoading(false);
        lastFetchedId.current = null;
        return;
      }
      
      if (event === 'SIGNED_IN' && session?.user) {
        const userData = await fetchUserData(session.user);
        if (userData) {
          setUser(userData);
        }
      } else if (!session) {
        setUser(null);
      }
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Listen for real-time changes to user data (permissions/role)
  useEffect(() => {
    if (!user?.id) return;

    console.log('📡 Setting up realtime subscription for user:', user.id);
    
    const channel = supabase
      .channel(`user-updates-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'users',
          filter: `id=eq.${user.id}`,
        },
        async (payload) => {
          console.log('🔄 User data changed in database, refreshing session...', payload);
          // Refetch user data from the database to update the local state
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user) {
            const userData = await fetchUserData(session.user);
            if (userData) {
              setUser(userData);
              console.log('✅ User data successfully synced');
            }
          }
        }
      )
      .subscribe((status) => {
        console.log('📡 Subscription status:', status);
      });

    return () => {
      console.log('🔌 Cleaning up realtime subscription');
      supabase.removeChannel(channel);
    };
  }, [user?.id]);


  const login = async (email: string, password: string) => {
    console.log('🔐 Starting login process...');
    
    try {
      // Step 1: Sign in with Supabase Auth
      console.log('📧 Attempting sign in with email:', email);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('❌ Sign in error:', error);
        throw error;
      }

      console.log('✅ Sign in successful, user ID:', data.user?.id);

      // Step 2: Fetch user data from public.users
      if (data.user) {
        console.log('👤 Fetching user data from database...');
        const userData = await fetchUserData(data.user);
        
        if (!userData) {
          console.error('❌ User data not found in public.users table');
          throw new Error('User data tidak ditemukan. Pastikan user sudah ditambahkan ke tabel users.');
        }
        
        console.log('✅ User data fetched:', userData);
        setUser(userData);
      }
    } catch (error) {
      console.error('❌ Login failed:', error);
      throw error;
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
