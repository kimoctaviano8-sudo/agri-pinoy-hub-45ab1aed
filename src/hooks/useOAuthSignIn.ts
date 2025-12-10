import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

type OAuthProvider = 'google' | 'facebook';

interface OAuthConfig {
  provider: OAuthProvider;
  options?: {
    scopes?: string;
    queryParams?: Record<string, string>;
  };
}

const OAUTH_CONFIGS: Record<OAuthProvider, OAuthConfig['options']> = {
  google: {
    queryParams: {
      access_type: 'offline',
      prompt: 'consent',
    },
  },
  facebook: {
    scopes: 'email,public_profile',
  },
};

export const useOAuthSignIn = () => {
  const { toast } = useToast();

  const signInWithOAuth = async (provider: OAuthProvider): Promise<boolean> => {
    try {
      const redirectTo = `${window.location.origin}/`;
      const config = OAUTH_CONFIGS[provider];

      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo,
          scopes: config?.scopes,
          queryParams: config?.queryParams,
        },
      });

      if (error) {
        toast({
          variant: 'destructive',
          title: `${capitalize(provider)} Sign In Failed`,
          description: error.message,
        });
        return false;
      }

      return true;
    } catch (error) {
      toast({
        variant: 'destructive',
        title: `${capitalize(provider)} Sign In Failed`,
        description: 'An unexpected error occurred.',
      });
      return false;
    }
  };

  const signInWithGoogle = () => signInWithOAuth('google');
  const signInWithFacebook = () => signInWithOAuth('facebook');

  return {
    signInWithGoogle,
    signInWithFacebook,
    signInWithOAuth,
  };
};

const capitalize = (str: string) => str.charAt(0).toUpperCase() + str.slice(1);
