import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useOAuthSignIn } from '@/hooks/useOAuthSignIn';
import { useNativeBiometric } from '@/hooks/useNativeBiometric';
import { Capacitor } from '@capacitor/core';

// BuildNatively OneSignal integration helpers
const setOneSignalExternalId = (userId: string) => {
  try {
    if (typeof window !== 'undefined' && (window as any).NativelyNotifications) {
      const notifications = new (window as any).NativelyNotifications();
      notifications.setExternalId(userId, (resp: any) => {
        console.log('OneSignal external_id set:', resp);
      });
      // Also request push permission
      notifications.requestPermissionIOS((permResp: any) => {
        console.log('OneSignal push permission:', permResp);
      });
    }
  } catch (error) {
    console.log('OneSignal setExternalId not available:', error);
  }
};

const removeOneSignalExternalId = () => {
  try {
    if (typeof window !== 'undefined' && (window as any).NativelyNotifications) {
      const notifications = new (window as any).NativelyNotifications();
      notifications.removeExternalId((resp: any) => {
        console.log('OneSignal external_id removed:', resp);
      });
    }
  } catch (error) {
    console.log('OneSignal removeExternalId not available:', error);
  }
};

interface AuthContextType {
  user: User | null;
  session: Session | null;
  login: (email: string, password: string) => Promise<boolean>;
  signInWithGoogle: () => Promise<boolean>;
  signInWithFacebook: () => Promise<boolean>;
  register: (userData: RegisterData) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
  userRole: string | null;
  storeBiometricCredentials: (email: string, password: string) => Promise<boolean>;
}

interface RegisterData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  birthday: Date | null;
  phone: string;
  streetNumber: string;
  city: string;
  barangay: string;
  role: string;
  gender: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);
  const { toast } = useToast();
  const { signInWithGoogle, signInWithFacebook } = useOAuthSignIn();
  const { setCredentials: setBiometricCredentials, isAvailable: biometricAvailable } = useNativeBiometric();

  // Role fetching for current user
  const fetchUserRole = async (userId: string) => {
    try {
      // Fetch all roles for the user
      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId);

      if (rolesError) {
        console.error('Error fetching user roles:', rolesError);
        setUserRole('user');
        return;
      }

      // Prioritize roles: admin > field_technician > user
      if (roles && roles.length > 0) {
        const roleList = roles.map(r => r.role as string);
        if (roleList.includes('admin')) {
          setUserRole('admin');
        } else if (roleList.includes('field_technician')) {
          setUserRole('field_technician');
        } else {
          setUserRole('user');
        }
      } else {
        setUserRole('user');
        // Ensure user has a default role
        await createUserRoleIfNeeded(userId);
      }
    } catch (error) {
      console.error('Error fetching user role:', error);
      setUserRole('user');
    }
  };

  // Create user role if it doesn't exist (fallback)
  const createUserRoleIfNeeded = async (userId: string) => {
    try {
      const { error } = await supabase
        .from('user_roles')
        .insert({ user_id: userId, role: 'user' })
        .select()
        .maybeSingle();
      
      // Ignore conflicts (user already has a role)
      if (error && !error.message.includes('duplicate')) {
        console.error('Error creating user role:', error);
      }
    } catch (error) {
      console.error('Error creating user role:', error);
    }
  };

  // Update login streak for daily tracking
  const updateLoginStreak = async (userId: string) => {
    try {
      await supabase.rpc('update_login_streak', {
        user_id: userId
      });
    } catch (error) {
      console.error('Error updating login streak:', error);
    }
  };

  useEffect(() => {
    // IMPORTANT: keep this callback synchronous; don't call other Supabase APIs inside it.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        // Defer Supabase calls to avoid auth deadlocks
        setTimeout(() => {
          fetchUserRole(session.user.id);
          updateLoginStreak(session.user.id);
          setOneSignalExternalId(session.user.id);
        }, 0);
      } else {
        setUserRole(null);
      }

      setIsLoading(false);
    });

    // Check for existing session AFTER setting up listener
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        setTimeout(() => {
          fetchUserRole(session.user!.id);
          updateLoginStreak(session.user!.id);
          setOneSignalExternalId(session.user!.id);
        }, 0);
      } else {
        setUserRole(null);
      }

      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        toast({
          variant: "destructive",
          title: "Login Failed",
          description: error.message,
        });
        return false;
      }

      toast({
        title: "Welcome back!",
        description: "You have successfully logged in.",
      });
      return true;
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Login Failed",
        description: "An unexpected error occurred.",
      });
      return false;
    }
  };

  const register = async (userData: RegisterData): Promise<boolean> => {
    try {
      // Determine default avatar based on gender (AI-generated Asian farmer avatars)
      const getDefaultAvatarUrl = (gender: string) => {
        const baseUrl = window.location.origin;
        if (gender === 'female') {
          return `${baseUrl}/avatars/default-female-farmer.jpg`;
        }
        // Default to male farmer for male, other, or prefer_not_to_say
        return `${baseUrl}/avatars/default-male-farmer.jpg`;
      };

      // Use custom URL scheme for native apps, web URL for browser
      const getEmailRedirectUrl = () => {
        if (Capacitor.isNativePlatform()) {
          // Custom URL scheme for deep linking back to the app
          return 'geminiagri://email-confirmed';
        }
        return 'https://geminiagri.vercel.app/email-confirmed';
      };

      const { data, error } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
        options: {
          emailRedirectTo: getEmailRedirectUrl(),
          data: {
            first_name: userData.firstName,
            last_name: userData.lastName,
            full_name: `${userData.firstName} ${userData.lastName}`,
            phone: userData.phone,
            birthday: userData.birthday ? userData.birthday.toISOString().split('T')[0] : null,
            street_number: userData.streetNumber,
            city: userData.city,
            barangay: userData.barangay,
            role: userData.role,
            gender: userData.gender,
            avatar_url: getDefaultAvatarUrl(userData.gender),
          }
        }
      });

      if (error) {
        toast({
          variant: "destructive",
          title: "Registration Failed",
          description: error.message,
        });
        return false;
      }

      // Check if email confirmation is required
      if (data.user && !data.user.email_confirmed_at) {
        // Email verification is required - don't show success toast here
        // The modal will handle the messaging
        return true;
      }

      toast({
        title: "Registration Successful!",
        description: "Your account has been created and you can now log in.",
      });
      return true;
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Registration Failed",
        description: "An unexpected error occurred.",
      });
      return false;
    }
  };

  const logout = async () => {
    // If there's no active session, treat as already logged out
    if (!session) {
      setUser(null);
      setSession(null);
      setUserRole(null);
      toast({
        title: "Logged out",
        description: "Your session has already ended.",
      });
      return;
    }

    const { error } = await supabase.auth.signOut();

    // Supabase can return errors like "Session not found" or "auth session missing!"
    // when the server no longer has the session. In those cases, the user is
    // effectively logged out, so we don't treat it as a failure.
    const isSessionNotFoundError =
      error &&
      typeof error.message === "string" &&
      error.message.toLowerCase().includes("session") &&
      (error.message.toLowerCase().includes("not found") ||
        error.message.toLowerCase().includes("missing"));

    if (error && !isSessionNotFoundError) {
      toast({
        variant: "destructive",
        title: "Logout Failed",
        description: error.message,
      });
      return;
    }

    removeOneSignalExternalId();
    setUser(null);
    setSession(null);
    setUserRole(null);
    toast({
      title: "Logged out",
      description: "You have been successfully logged out.",
    });
  };

  // Store credentials for biometric login
  const storeBiometricCredentials = async (email: string, password: string): Promise<boolean> => {
    if (!biometricAvailable) return false;
    return await setBiometricCredentials(email, password);
  };

  const value = {
    user,
    session,
    login,
    signInWithGoogle,
    signInWithFacebook,
    register,
    logout,
    isLoading,
    userRole,
    storeBiometricCredentials
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};