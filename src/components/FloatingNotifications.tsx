import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { NotificationItem } from "./NotificationItem";

interface Notification {
  id: string;
  type: 'reaction' | 'support_ticket';
  post_id?: string;
  ticket_id?: string;
  message: string;
  read: boolean;
  created_at: string;
}

interface FloatingNotificationProps {
  onNotificationCountChange: (count: number) => void;
}

export const FloatingNotifications: React.FC<FloatingNotificationProps> = ({
  onNotificationCountChange
}) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [visibleNotifications, setVisibleNotifications] = useState<string[]>([]);
  const [realtimeChannel, setRealtimeChannel] = useState<any>(null);
  const notificationRefs = useRef<Map<string, NodeJS.Timeout>>(new Map());

  // Setup real-time subscription
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('floating-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id.eq.${user.id}`
        },
        (payload) => {
          const newNotification = payload.new as any;
          
          // Temporarily filter out comment notifications
          if (newNotification.type === 'comment') {
            return;
          }
          
          const typedNotification: Notification = {
            id: newNotification.id,
            type: newNotification.type as 'reaction' | 'support_ticket',
            post_id: newNotification.post_id,
            ticket_id: newNotification.ticket_id,
            message: newNotification.message,
            read: newNotification.read,
            created_at: newNotification.created_at
          };
          
          // Add new notification
          setNotifications(prev => [typedNotification, ...prev]);
          
          // Show notification with staggered animation
          setTimeout(() => {
            setVisibleNotifications(prev => [typedNotification.id, ...prev]);
          }, 100);
          
          // Auto-dismiss after 8 seconds
          const timeoutId = setTimeout(() => {
            dismissNotification(typedNotification.id);
          }, 8000);
          
          notificationRefs.current.set(typedNotification.id, timeoutId);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notifications',
          filter: `user_id.eq.${user.id}`
        },
        () => {
          // Refresh notification count when notifications are updated
          fetchNotificationCount();
        }
      )
      .subscribe();

    setRealtimeChannel(channel);
    fetchNotificationCount();

    return () => {
      supabase.removeChannel(channel);
      // Clear all timeouts
      notificationRefs.current.forEach(timeout => clearTimeout(timeout));
      notificationRefs.current.clear();
    };
  }, [user]);

  const fetchNotificationCount = async () => {
    if (!user) return;

    try {
      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('read', false)
        .neq('type', 'comment'); // Exclude comment notifications from count

      if (error) throw error;
      onNotificationCountChange(count || 0);
    } catch (error) {
      console.error('Error fetching notification count:', error);
    }
  };

  const markNotificationAsRead = async (notificationId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId)
        .eq('user_id', user.id);

      if (error) throw error;

      // Update local state
      setNotifications(prev => 
        prev.map(notif => 
          notif.id === notificationId 
            ? { ...notif, read: true }
            : notif
        )
      );

      // Update notification count
      fetchNotificationCount();
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const dismissNotification = (notificationId: string) => {
    // Clear timeout if exists
    const timeoutId = notificationRefs.current.get(notificationId);
    if (timeoutId) {
      clearTimeout(timeoutId);
      notificationRefs.current.delete(notificationId);
    }

    // Hide notification with animation
    setVisibleNotifications(prev => prev.filter(id => id !== notificationId));
    
    // Remove from notifications list after animation
    setTimeout(() => {
      setNotifications(prev => prev.filter(notif => notif.id !== notificationId));
    }, 500);
  };

  const handleNotificationClick = async (notificationId: string) => {
    const notification = notifications.find(n => n.id === notificationId);
    if (!notification) return;

    // Mark as read if not already read
    if (!notification.read) {
      await markNotificationAsRead(notificationId);
    }

    // Navigate based on notification type
    if (notification.type === 'support_ticket') {
      navigate('/inbox');
    } else {
      navigate('/forum', { state: { scrollToPost: notification.post_id } });
    }
    
    // Dismiss the notification
    dismissNotification(notificationId);
  };

  return (
    <div className="fixed inset-0 pointer-events-none z-50">
      {notifications.map((notification, index) => (
        <div
          key={notification.id}
          className="pointer-events-auto"
          style={{
            transform: `translateY(${index * 10}px)`,
            zIndex: 50 - index
          }}
        >
          <NotificationItem
            id={notification.id}
            type={notification.type}
            message={notification.message}
            createdAt={notification.created_at}
            read={notification.read}
            onDismiss={dismissNotification}
            onClick={handleNotificationClick}
            isVisible={visibleNotifications.includes(notification.id)}
          />
        </div>
      ))}
    </div>
  );
};