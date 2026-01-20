import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

interface AppSettings {
  vacation_mode: boolean;
  vacation_mode_message: string;
  updated_at: string;
}

export const useVacationMode = () => {
  const [vacationMode, setVacationMode] = useState(false);
  const [vacationMessage, setVacationMessage] = useState('Orders are temporarily paused. Please check back later.');
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchSettings = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('app_settings' as any)
        .select('vacation_mode, vacation_mode_message, updated_at')
        .eq('id', 'global')
        .single();

      if (error) {
        console.error('Error fetching app settings:', error);
        return;
      }

      if (data) {
        const settings = data as unknown as AppSettings;
        setVacationMode(settings.vacation_mode);
        setVacationMessage(settings.vacation_mode_message || 'Orders are temporarily paused. Please check back later.');
      }
    } catch (error) {
      console.error('Error fetching app settings:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const toggleVacationMode = useCallback(async (enabled: boolean) => {
    try {
      const { error } = await supabase
        .from('app_settings' as any)
        .update({ vacation_mode: enabled })
        .eq('id', 'global');

      if (error) {
        console.error('Error updating vacation mode:', error);
        toast({
          title: "Error",
          description: "Failed to update vacation mode. You may not have admin permissions.",
          variant: "destructive"
        });
        return false;
      }

      setVacationMode(enabled);
      toast({
        title: enabled ? "Vacation Mode Enabled" : "Vacation Mode Disabled",
        description: enabled 
          ? "All ordering functionality has been paused for users." 
          : "Normal ordering operations have resumed.",
      });
      return true;
    } catch (error) {
      console.error('Error updating vacation mode:', error);
      toast({
        title: "Error",
        description: "Failed to update vacation mode",
        variant: "destructive"
      });
      return false;
    }
  }, [toast]);

  useEffect(() => {
    fetchSettings();

    // Subscribe to realtime changes
    const channel = supabase
      .channel('app-settings-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'app_settings',
          filter: 'id=eq.global',
        },
        (payload) => {
          const newData = payload.new as AppSettings;
          setVacationMode(newData.vacation_mode);
          setVacationMessage(newData.vacation_mode_message || 'Orders are temporarily paused. Please check back later.');
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchSettings]);

  return {
    vacationMode,
    vacationMessage,
    loading,
    toggleVacationMode,
    refetch: fetchSettings,
  };
};
