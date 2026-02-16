import { useState, useEffect } from "react";
import { Moon, Sun, Bell, Shield, User, Info, ChevronRight, ChevronDown, Check, Monitor, Trash2, Loader2, Fingerprint, Eye, EyeOff, ShieldBan, UserX, Flag, Clock, CheckCircle, XCircle } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "@/contexts/TranslationContext";
import { APP_VERSION, getFormattedBuildDate } from "@/lib/version";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useBiometricProtection } from "@/hooks/useBiometricProtection";
import { Badge } from "@/components/ui/badge";

type ThemeMode = "light" | "dark" | "system";

interface NotificationSettings {
  promotions: boolean;
  communityAlerts: boolean;
  newsUpdates: boolean;
}

const getSystemTheme = (): "light" | "dark" => {
  if (typeof window !== "undefined" && window.matchMedia) {
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }
  return "light";
};

const applyTheme = (mode: ThemeMode) => {
  const effectiveTheme = mode === "system" ? getSystemTheme() : mode;
  if (effectiveTheme === "dark") {
    document.documentElement.classList.add("dark");
  } else {
    document.documentElement.classList.remove("dark");
  }
};

export const ProfileSettingsSection = () => {
  const { toast } = useToast();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [themeMode, setThemeMode] = useState<ThemeMode>("light");
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [privacyOpen, setPrivacyOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [blockedUsersOpen, setBlockedUsersOpen] = useState(false);
  const [reportedPostsOpen, setReportedPostsOpen] = useState(false);
  const [reportedPosts, setReportedPosts] = useState<{ id: string; title: string; moderation_status: string | null; created_at: string; flagged_content: string[] | null }[]>([]);
  const [blockedUsers, setBlockedUsers] = useState<{ id: string; blocked_user_id: string; full_name: string | null; avatar_url: string | null }[]>([]);
  const [unblocking, setUnblocking] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [notifications, setNotifications] = useState<NotificationSettings>({
    promotions: true,
    communityAlerts: true,
    newsUpdates: true
  });

  // Biometric protection for sensitive actions
  const { 
    protectAction, 
    isVerifying, 
    isProtectionActive,
    biometricName 
  } = useBiometricProtection({ 
    actionName: 'delete your account',
    requireEnabled: true 
  });

  const executeDeleteAccount = async () => {
    if (!deletePassword.trim()) {
      setPasswordError("Please enter your password");
      return;
    }

    setIsDeleting(true);
    setPasswordError("");

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error("No active session");
      }

      const response = await supabase.functions.invoke('delete-account', {
        body: { password: deletePassword },
      });

      if (response.error) {
        const errorMsg = response.error.message || "Failed to delete account";
        // Try to parse the error body for a more specific message
        try {
          const parsed = JSON.parse(errorMsg);
          setPasswordError(parsed.error || errorMsg);
        } catch {
          setPasswordError(errorMsg);
        }
        return;
      }

      const data = response.data;
      if (data?.error) {
        setPasswordError(data.error);
        return;
      }

      // Success - sign out locally and redirect
      await supabase.auth.signOut();

      toast({
        title: "Account Deleted",
        description: "Your account has been permanently deleted.",
      });

      setShowDeleteDialog(false);
      navigate('/');
    } catch (error: any) {
      console.error('Error deleting account:', error);
      setPasswordError("An unexpected error occurred. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (isProtectionActive) {
      await protectAction(executeDeleteAccount);
    } else {
      await executeDeleteAccount();
    }
  };

  const openDeleteDialog = () => {
    setDeletePassword("");
    setPasswordError("");
    setShowPassword(false);
    setShowDeleteDialog(true);
  };

  // Load settings from localStorage on mount
  useEffect(() => {
    const savedThemeMode = (localStorage.getItem("themeMode") as ThemeMode) || "light";
    const savedNotifications = localStorage.getItem("notificationSettings");
    
    setThemeMode(savedThemeMode);
    
    if (savedNotifications) {
      try {
        setNotifications(JSON.parse(savedNotifications));
      } catch (e) {
        console.error("Error parsing notification settings:", e);
      }
    }

    applyTheme(savedThemeMode);
  }, []);

  // Fetch blocked users
  useEffect(() => {
    const fetchBlockedUsers = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: blocks } = await supabase
        .from('user_blocks')
        .select('id, blocked_user_id')
        .eq('blocker_id', user.id);

      if (blocks && blocks.length > 0) {
        const userIds = blocks.map(b => b.blocked_user_id);
        const { data: profiles } = await supabase
          .from('public_profiles')
          .select('id, full_name, avatar_url')
          .in('id', userIds);

        setBlockedUsers(blocks.map(b => {
          const profile = profiles?.find(p => p.id === b.blocked_user_id);
          return {
            id: b.id,
            blocked_user_id: b.blocked_user_id,
            full_name: profile?.full_name || 'Unknown User',
            avatar_url: profile?.avatar_url || null,
          };
        }));
      } else {
        setBlockedUsers([]);
      }
    };
    fetchBlockedUsers();
  }, []);

  // Fetch user's reported/pending posts
  useEffect(() => {
    const fetchReportedPosts = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('forum_posts')
        .select('id, title, moderation_status, created_at, flagged_content')
        .eq('author_id', user.id)
        .in('moderation_status', ['pending', 'rejected'])
        .order('created_at', { ascending: false });

      setReportedPosts(data || []);
    };
    fetchReportedPosts();
  }, []);

  // Listen to system theme changes when in "system" mode
  useEffect(() => {
    if (themeMode !== "system") return;

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = () => {
      applyTheme("system");
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [themeMode]);

  const handleThemeModeChange = (value: ThemeMode) => {
    setThemeMode(value);
    localStorage.setItem("themeMode", value);
    applyTheme(value);
    
    const themeLabels: Record<ThemeMode, string> = {
      light: t('light'),
      dark: t('dark'),
      system: t('system')
    };
    
    toast({
      title: t('theme') + " " + t('success'),
      description: `${t('theme')}: ${themeLabels[value]}`
    });
  };

  const handleNotificationToggle = (key: keyof NotificationSettings, checked: boolean) => {
    const updated = {
      ...notifications,
      [key]: checked
    };
    setNotifications(updated);
    localStorage.setItem("notificationSettings", JSON.stringify(updated));
    
    const labels: Record<keyof NotificationSettings, string> = {
      promotions: t('promotions'),
      communityAlerts: t('community_alerts'),
      newsUpdates: t('news_updates')
    };
    
    toast({
      title: t('notifications'),
      description: `${labels[key]} ${checked ? "enabled" : "disabled"}`
    });
  };

  const handleUnblockUser = async (blockId: string) => {
    setUnblocking(blockId);
    try {
      const { error } = await supabase
        .from('user_blocks')
        .delete()
        .eq('id', blockId);

      if (error) throw error;

      setBlockedUsers(prev => prev.filter(b => b.id !== blockId));
      toast({
        title: "User Unblocked",
        description: "You have unblocked this user. Their posts will be visible again.",
      });
    } catch (error) {
      console.error('Error unblocking user:', error);
      toast({
        title: "Error",
        description: "Failed to unblock user. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUnblocking(null);
    }
  };

  const formattedBuildDate = getFormattedBuildDate();

  return (
    <div className="space-y-4">
      <div className="mb-4">
        <h3 className="text-muted-foreground mb-2 flex items-center gap-2 text-lg font-semibold">
          {t('settings')}
        </h3>
      </div>

      {/* Theme Mode Selection */}
      <div className="flex items-center justify-between p-3 hover:bg-muted/50 transition-colors rounded-lg">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
            {themeMode === "dark" ? (
              <Moon className="w-4 h-4 text-primary" />
            ) : themeMode === "system" ? (
              <Monitor className="w-4 h-4 text-primary" />
            ) : (
              <Sun className="w-4 h-4 text-primary" />
            )}
          </div>
          <div className="flex flex-col items-start">
            <span className="text-sm font-medium text-foreground">{t('theme')}</span>
            <span className="text-xs text-muted-foreground">
              {themeMode === "dark" 
                ? t('dark_theme_active')
                : themeMode === "system" 
                  ? t('following_system')
                  : t('light_theme_active')}
            </span>
          </div>
        </div>
        <Select value={themeMode} onValueChange={(value) => handleThemeModeChange(value as ThemeMode)}>
          <SelectTrigger className="w-[120px] h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-background border shadow-lg z-[100]">
            <SelectItem value="light">
              <div className="flex items-center gap-2">
                <Sun className="w-3 h-3" />
                {t('light')}
              </div>
            </SelectItem>
            <SelectItem value="dark">
              <div className="flex items-center gap-2">
                <Moon className="w-3 h-3" />
                {t('dark')}
              </div>
            </SelectItem>
            <SelectItem value="system">
              <div className="flex items-center gap-2">
                <Monitor className="w-3 h-3" />
                {t('system')}
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Notification Settings */}
      <Collapsible open={notificationOpen} onOpenChange={setNotificationOpen}>
        <CollapsibleTrigger className="w-full flex items-center justify-between p-3 hover:bg-muted/50 transition-colors rounded-lg">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
              <Bell className="w-4 h-4 text-muted-foreground" />
            </div>
            <div className="flex flex-col items-start">
              <span className="text-sm font-medium text-foreground">{t('notifications')}</span>
              <span className="text-xs text-muted-foreground">{t('manage_alert_preferences')}</span>
            </div>
          </div>
          {notificationOpen ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
        </CollapsibleTrigger>
        <CollapsibleContent className="pl-11 pr-3 pb-2 space-y-3">
          <div className="flex items-center justify-between py-2">
            <Label className="text-sm text-foreground">{t('promotions')}</Label>
            <Switch checked={notifications.promotions} onCheckedChange={checked => handleNotificationToggle("promotions", checked)} className="data-[state=checked]:bg-primary scale-90" />
          </div>
          <div className="flex items-center justify-between py-2">
            <Label className="text-sm text-foreground">{t('community_alerts')}</Label>
            <Switch checked={notifications.communityAlerts} onCheckedChange={checked => handleNotificationToggle("communityAlerts", checked)} className="data-[state=checked]:bg-primary scale-90" />
          </div>
          <div className="flex items-center justify-between py-2">
            <Label className="text-sm text-foreground">{t('news_updates')}</Label>
            <Switch checked={notifications.newsUpdates} onCheckedChange={checked => handleNotificationToggle("newsUpdates", checked)} className="data-[state=checked]:bg-primary scale-90" />
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Privacy & Security */}
      <Collapsible open={privacyOpen} onOpenChange={setPrivacyOpen}>
        <CollapsibleTrigger className="w-full flex items-center justify-between p-3 hover:bg-muted/50 transition-colors rounded-lg">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
              <Shield className="w-4 h-4 text-muted-foreground" />
            </div>
            <div className="flex flex-col items-start">
              <span className="text-sm font-medium text-foreground">{t('privacy_security')}</span>
              <span className="text-xs text-muted-foreground">{t('manage_your_data')}</span>
            </div>
          </div>
          {privacyOpen ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
        </CollapsibleTrigger>
        <CollapsibleContent className="pl-11 pr-3 pb-2 space-y-2">
          <div className="flex items-center gap-2 py-2 text-sm text-foreground">
            <Check className="w-3 h-3 text-primary" />
            <span>{t('data_encrypted')}</span>
          </div>
          <div className="flex items-center gap-2 py-2 text-sm text-foreground">
            <Check className="w-3 h-3 text-primary" />
            <span>{t('secure_connection')}</span>
          </div>
          <div className="flex items-center gap-2 py-2 text-sm text-foreground">
            <Check className="w-3 h-3 text-primary" />
            <span>{t('two_factor_available')}</span>
          </div>
          <p className="text-xs text-muted-foreground pt-1">
            {t('privacy_policy')}
          </p>
        </CollapsibleContent>
      </Collapsible>

      {/* Reported Posts Status */}
      <Collapsible open={reportedPostsOpen} onOpenChange={setReportedPostsOpen}>
        <CollapsibleTrigger className="w-full flex items-center justify-between p-3 hover:bg-muted/50 transition-colors rounded-lg">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
              <Flag className="w-4 h-4 text-muted-foreground" />
            </div>
            <div className="flex flex-col items-start">
              <span className="text-sm font-medium text-foreground">Post Review Status</span>
              <span className="text-xs text-muted-foreground">
                {reportedPosts.length > 0 ? `${reportedPosts.length} post${reportedPosts.length > 1 ? 's' : ''} under review` : 'No flagged posts'}
              </span>
            </div>
          </div>
          {reportedPostsOpen ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
        </CollapsibleTrigger>
        <CollapsibleContent className="pl-11 pr-3 pb-2 space-y-2">
          {reportedPosts.length === 0 ? (
            <p className="text-xs text-muted-foreground py-2">None of your posts are flagged or under review.</p>
          ) : (
            reportedPosts.map(post => (
              <div key={post.id} className="py-2 border-b border-border last:border-0 space-y-1">
                <p className="text-sm font-medium text-foreground line-clamp-1">{post.title}</p>
                <div className="flex items-center gap-2">
                  {post.moderation_status === 'pending' ? (
                    <Badge variant="outline" className="text-xs gap-1 text-amber-700 bg-amber-50 border-amber-200 dark:text-amber-400 dark:bg-amber-950/50 dark:border-amber-800">
                      <Clock className="w-3 h-3" />
                      Under Review
                    </Badge>
                  ) : post.moderation_status === 'rejected' ? (
                    <Badge variant="destructive" className="text-xs gap-1">
                      <XCircle className="w-3 h-3" />
                      Rejected
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-xs gap-1 text-emerald-700 bg-emerald-50 border-emerald-200 dark:text-emerald-400 dark:bg-emerald-950/50 dark:border-emerald-800">
                      <CheckCircle className="w-3 h-3" />
                      Approved
                    </Badge>
                  )}
                  <span className="text-[11px] text-muted-foreground">
                    {new Date(post.created_at).toLocaleDateString()}
                  </span>
                </div>
                {post.flagged_content && post.flagged_content.length > 0 && (
                  <p className="text-[11px] text-muted-foreground">
                    Flagged for: {post.flagged_content.join(', ')}
                  </p>
                )}
              </div>
            ))
          )}
        </CollapsibleContent>
      </Collapsible>

      {/* Blocked Users */}
      <Collapsible open={blockedUsersOpen} onOpenChange={setBlockedUsersOpen}>
        <CollapsibleTrigger className="w-full flex items-center justify-between p-3 hover:bg-muted/50 transition-colors rounded-lg">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
              <ShieldBan className="w-4 h-4 text-muted-foreground" />
            </div>
            <div className="flex flex-col items-start">
              <span className="text-sm font-medium text-foreground">Blocked Users</span>
              <span className="text-xs text-muted-foreground">
                {blockedUsers.length > 0 ? `${blockedUsers.length} blocked` : 'No blocked users'}
              </span>
            </div>
          </div>
          {blockedUsersOpen ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
        </CollapsibleTrigger>
        <CollapsibleContent className="pl-11 pr-3 pb-2 space-y-2">
          {blockedUsers.length === 0 ? (
            <p className="text-xs text-muted-foreground py-2">You haven't blocked anyone.</p>
          ) : (
            blockedUsers.map(user => (
              <div key={user.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                    {user.avatar_url ? (
                      <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <UserX className="w-3.5 h-3.5 text-muted-foreground" />
                    )}
                  </div>
                  <span className="text-sm text-foreground">{user.full_name}</span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs h-7"
                  disabled={unblocking === user.id}
                  onClick={() => handleUnblockUser(user.id)}
                >
                  {unblocking === user.id ? (
                    <Loader2 className="w-3 h-3 animate-spin mr-1" />
                  ) : null}
                  Unblock
                </Button>
              </div>
            ))
          )}
        </CollapsibleContent>
      </Collapsible>

      {/* Account Management */}
      <Collapsible open={accountOpen} onOpenChange={setAccountOpen}>
        <CollapsibleTrigger className="w-full flex items-center justify-between p-3 hover:bg-muted/50 transition-colors rounded-lg">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
              <User className="w-4 h-4 text-muted-foreground" />
            </div>
            <div className="flex flex-col items-start">
              <span className="text-sm font-medium text-foreground">{t('account_management')}</span>
              <span className="text-xs text-muted-foreground">{t('manage_your_account')}</span>
            </div>
          </div>
          {accountOpen ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
        </CollapsibleTrigger>
        <CollapsibleContent className="pl-11 pr-3 pb-2 space-y-3">
          <p className="text-xs text-muted-foreground py-1">
            {t('manage_your_account')}
          </p>
          <div className="text-xs text-muted-foreground">
            <span className="font-medium text-foreground">{t('email')}:</span> Connected
          </div>
          <div className="text-xs text-muted-foreground">
            <span className="font-medium text-foreground">{t('password')}:</span> Set
          </div>
          
          {/* Biometric Protection Status */}
          {isProtectionActive && (
            <div className="flex items-center gap-2 py-2 px-3 bg-primary/5 rounded-lg border border-primary/20 mb-3">
              <Fingerprint className="w-4 h-4 text-primary" />
              <span className="text-xs text-foreground">
                Protected by {biometricName}
              </span>
            </div>
          )}
          
          <div className="pt-3 border-t border-border">
            <Button 
              variant="destructive" 
              size="sm" 
              className="w-full gap-2"
              disabled={isDeleting || isVerifying}
              onClick={openDeleteDialog}
            >
              {isDeleting || isVerifying ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4" />
              )}
              {isVerifying ? 'Verifying...' : 'Delete Account'}
            </Button>
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Delete Account Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-destructive flex items-center gap-2">
              <Trash2 className="w-5 h-5" />
              Delete Account
            </DialogTitle>
            <DialogDescription className="space-y-2">
              <span className="block font-semibold text-destructive">
                ⚠️ This action is permanent and cannot be undone.
              </span>
              <span className="block">
                All your data will be permanently removed, including your profile, orders, scan history, achievements, and forum activity.
              </span>
              {isProtectionActive && (
                <span className="block text-primary font-medium">
                  You will also need to verify with {biometricName} to proceed.
                </span>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <Label htmlFor="delete-password" className="text-sm font-medium">
              Enter your password to confirm
            </Label>
            <div className="relative">
              <Input
                id="delete-password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={deletePassword}
                onChange={(e) => {
                  setDeletePassword(e.target.value);
                  setPasswordError("");
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && deletePassword.trim()) {
                    handleDeleteAccount();
                  }
                }}
                className={passwordError ? "border-destructive pr-10" : "pr-10"}
                disabled={isDeleting}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {passwordError && (
              <p className="text-xs text-destructive">{passwordError}</p>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteAccount}
              disabled={isDeleting || !deletePassword.trim()}
              className="gap-2"
            >
              {isDeleting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4" />
              )}
              {isDeleting ? 'Deleting...' : 'Permanently Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* App Version Info */}
      <div className="flex items-center justify-between p-3 hover:bg-muted/50 transition-colors rounded-lg">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
            <Info className="w-4 h-4 text-muted-foreground" />
          </div>
          <div className="flex flex-col items-start">
            <span className="text-sm font-medium text-foreground">{t('app_version')}</span>
            <span className="text-xs text-muted-foreground">Gemini Agriculture</span>
            <span className="text-[11px] text-muted-foreground">Build: {formattedBuildDate}</span>
          </div>
        </div>
        <span className="text-xs text-muted-foreground font-mono">v{APP_VERSION}</span>
      </div>
    </div>
  );
};
