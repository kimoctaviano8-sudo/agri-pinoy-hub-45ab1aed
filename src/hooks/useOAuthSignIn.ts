import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Provider } from '@supabase/supabase-js';

export const useOAuthSignIn = () => {
  const { toast } = useToast();

  const handleOAuthSignIn = async (provider: Provider): Promise<boolean> => {
    const providerName = provider.charAt(0).toUpperCase() + provider.slice(1);
    
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/`,
        },
      });

      if (error) {
        toast({
          variant: 'destructive',
          title: `${providerName} Sign In Failed`,
          description: error.message,
        });
        return false;
      }

      // OAuth will redirect, so if we get here with a URL, it's working
      if (data?.url) {
        return true;
      }

      return true;
    } catch (err) {
      toast({
        variant: 'destructive',
        title: `${providerName} Sign In Failed`,
        description: 'An unexpected error occurred. Please try again.',
      });
      return false;
    }
  };

  const signInWithGoogle = () => handleOAuthSignIn('google');
  const signInWithFacebook = () => handleOAuthSignIn('facebook');

  return {
    signInWithGoogle,
    signInWithFacebook,
  };
};
