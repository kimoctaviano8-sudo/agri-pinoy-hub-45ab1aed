import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Home, Package, User, ShoppingCart, Bell, MessageCircle, Scan, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import { useTranslation } from "@/contexts/TranslationContext";
import { useVacationModeContext } from "@/contexts/VacationModeContext";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { CacheManager } from "@/components/CacheManager";
import { NotificationPanel } from "@/components/NotificationPanel";
const Navigation = ({
  notificationCount,
  setNotificationCount
}: {
  notificationCount: number;
  setNotificationCount: (count: number) => void;
}) => {
  const location = useLocation();
  const {
    user,
    userRole
  } = useAuth();
  const {
    itemCount
  } = useCart();
  const {
    t
  } = useTranslation();
  const { vacationMode } = useVacationModeContext();
  const [unreadCount, setUnreadCount] = useState(0);
  const [isNotificationPanelOpen, setIsNotificationPanelOpen] = useState(false);
  const [userProfile, setUserProfile] = useState<{
    avatar_url?: string;
    full_name?: string;
  } | null>(null);
  useEffect(() => {
    if (user) {
      fetchUnreadCount();
      fetchUserProfile();

      const messagesChannel = supabase.channel('unread-messages').on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'messages',
        filter: `recipient_id.eq.${user.id}`
      }, () => {
        fetchUnreadCount();
      }).subscribe();

      const ticketResponsesChannel = supabase.channel('unread-ticket-responses').on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'ticket_responses'
      }, () => {
        fetchUnreadCount();
      }).subscribe();

      // Listen for custom "ticket read" events from Inbox page
      const handleTicketRead = () => fetchUnreadCount();
      window.addEventListener('ticket-read', handleTicketRead);

      return () => {
        supabase.removeChannel(messagesChannel);
        supabase.removeChannel(ticketResponsesChannel);
        window.removeEventListener('ticket-read', handleTicketRead);
      };
    }
  }, [user]);

  const fetchUnreadCount = async () => {
    if (!user) return;
    try {
      // Count unread direct messages
      const { count: messageCount, error: msgError } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('recipient_id', user.id)
        .eq('read', false);
      if (msgError) throw msgError;

      // Get read timestamps per ticket from localStorage
      const readTimestamps: Record<string, string> = JSON.parse(
        localStorage.getItem(`ticket_read_times_${user.id}`) || '{}'
      );

      // Get user's tickets
      const { data: userTickets, error: ticketError } = await supabase
        .from('support_tickets')
        .select('id')
        .eq('user_id', user.id);
      if (ticketError) throw ticketError;

      let unreadResponses = 0;
      if (userTickets && userTickets.length > 0) {
        for (const ticket of userTickets) {
          const lastRead = readTimestamps[ticket.id] || '1970-01-01T00:00:00Z';
          const { count, error: respError } = await supabase
            .from('ticket_responses')
            .select('*', { count: 'exact', head: true })
            .eq('ticket_id', ticket.id)
            .neq('user_id', user.id)
            .gt('created_at', lastRead);
          if (!respError) {
            unreadResponses += count || 0;
          }
        }
      }

      setUnreadCount((messageCount || 0) + unreadResponses);
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };
  const fetchUserProfile = async () => {
    if (!user) return;
    try {
      const {
        data,
        error
      } = await supabase.from('profiles').select('avatar_url, full_name').eq('id', user.id).maybeSingle();
      if (error) throw error;
      setUserProfile(data);
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  };
  const navItems = [{
    name: t('nav_news'),
    href: "/",
    icon: Home
  }, {
    name: t('nav_products'),
    href: "/products",
    icon: Package
  }, {
    name: t('nav_community'),
    href: "/forum",
    icon: MessageCircle
  }, {
    name: t('nav_profile'),
    href: "/profile",
    icon: User
  }];
  const isActive = (path: string) => location.pathname === path;
  const renderNavItem = (item: typeof navItems[0]) => {
    const active = isActive(item.href);
    return (
      <Link key={item.href} to={item.href} className={cn("flex flex-col items-center justify-center py-2 transition-smooth relative", active ? "text-primary" : "text-muted-foreground hover:text-foreground")}>
        <div className={cn(
          "absolute top-0 left-1/2 -translate-x-1/2 h-1 bg-primary rounded-full transition-all duration-300",
          active ? "w-8 opacity-100" : "w-0 opacity-0"
        )} />
        <item.icon 
          className={cn("w-5 h-5 mb-1 transition-all duration-200", active && "text-primary")} 
          fill={active ? "currentColor" : "none"}
          strokeWidth={active ? 1.5 : 2}
        />
        <span className="text-xs font-medium">{item.name}</span>
      </Link>
    );
  };
  const renderHeaderActions = () => <div className="flex items-center space-x-2">
      {!vacationMode && (
        <Link to="/cart">
          <Button size="sm" variant="ghost" className="relative" id="cart-icon">
            <ShoppingCart className="w-5 h-5" />
            {itemCount > 0 && <Badge variant="destructive" className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center text-xs p-0 min-w-0">
                {itemCount > 99 ? '99+' : itemCount}
              </Badge>}
          </Button>
        </Link>
      )}
      <Link to="/inbox">
        <Button size="sm" variant="ghost" className="relative">
          <Mail className="w-5 h-5" />
          {unreadCount > 0 && <Badge variant="destructive" className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center text-xs p-0 min-w-0">
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>}
        </Button>
      </Link>
      <Button size="sm" variant="ghost" className="relative md:hidden" onClick={() => setIsNotificationPanelOpen(!isNotificationPanelOpen)}>
        <Bell className="w-5 h-5" />
        {notificationCount > 0 && <Badge variant="destructive" className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center text-xs p-0 min-w-0">
            {notificationCount > 99 ? '99+' : notificationCount}
          </Badge>}
      </Button>
    </div>;
  const renderScannerButton = () => <div className="flex items-center justify-center pb-[10px]">
      <Link to="/plant-scanner" className="relative -top-2">
        <div className={cn("w-14 h-14 bg-gradient-button-primary-deep rounded-full flex items-center justify-center shadow-botanical transition-all duration-200 hover:shadow-glow", isActive("/plant-scanner") && "scale-110")}>
          <Scan className="w-6 h-6 text-white" />
        </div>
      </Link>
    </div>;
  return <>
      {/* Notification Panel */}
      <NotificationPanel isOpen={isNotificationPanelOpen} onClose={() => setIsNotificationPanelOpen(false)} onNotificationCountChange={setNotificationCount} />
      
      {/* Mobile-only Header */}
      <nav className="bg-card border-b border-border shadow-card sticky top-0 z-50 overscroll-none touch-none">
        <div className="px-4 py-3 bg-background">
          <div className="flex justify-between items-center">
            {/* Logo */}
            <Link to="/" className="flex items-center">
              <img src="/lovable-uploads/d4bc3992-d18a-4479-947c-c7ef46b32413.png" alt="App Logo" className="w-8 h-8 object-contain" />
            </Link>

            {/* Mobile Actions */}
            {renderHeaderActions()}
          </div>
        </div>
      </nav>

      {/* Bottom Navigation with safe area and app switcher space */}
      <div className="fixed bottom-0 left-0 right-0 z-50 overscroll-none touch-pan-x">
        <div className="bg-card border-t border-border shadow-lg">
          <div className="grid grid-cols-5 h-16">
            {renderNavItem(navItems[0])} {/* News */}
            {renderNavItem(navItems[1])} {/* Products */}
            {renderScannerButton()} {/* Scanner */}
            {renderNavItem(navItems[2])} {/* Forum */}
            {renderNavItem(navItems[3])} {/* Profile */}
          </div>
        </div>
        {/* Visual app switcher line and safe area spacing */}
        <div className="safe-area-bottom pb-[4%] bg-card" />
      </div>
    </>;
};
export default Navigation;