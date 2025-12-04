import { useState, useEffect } from "react";
import { Moon, Sun, Bell, Shield, User, Info, ChevronRight, ChevronDown, Check, Monitor } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "@/contexts/TranslationContext";
import { APP_VERSION, getFormattedBuildDate } from "@/lib/version";

type ThemeMode = "light" | "dark" | "system";

interface NotificationSettings {
  orderUpdates: boolean;
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
  const [themeMode, setThemeMode] = useState<ThemeMode>("light");
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [privacyOpen, setPrivacyOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationSettings>({
    orderUpdates: true,
    promotions: true,
    communityAlerts: true,
    newsUpdates: true
  });

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

    // Apply theme on mount
    applyTheme(savedThemeMode);
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
      orderUpdates: t('order_updates'),
      promotions: t('promotions'),
      communityAlerts: t('community_alerts'),
      newsUpdates: t('news_updates')
    };
    
    toast({
      title: t('notifications'),
      description: `${labels[key]} ${checked ? "enabled" : "disabled"}`
    });
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
              <Monitor className="w-4 h-4 text-blue-500" />
            ) : (
              <Sun className="w-4 h-4 text-amber-500" />
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
            <Label className="text-sm text-foreground">{t('order_updates')}</Label>
            <Switch checked={notifications.orderUpdates} onCheckedChange={checked => handleNotificationToggle("orderUpdates", checked)} className="data-[state=checked]:bg-primary scale-90" />
          </div>
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
            <Check className="w-3 h-3 text-green-500" />
            <span>{t('data_encrypted')}</span>
          </div>
          <div className="flex items-center gap-2 py-2 text-sm text-foreground">
            <Check className="w-3 h-3 text-green-500" />
            <span>{t('secure_connection')}</span>
          </div>
          <div className="flex items-center gap-2 py-2 text-sm text-foreground">
            <Check className="w-3 h-3 text-green-500" />
            <span>{t('two_factor_available')}</span>
          </div>
          <p className="text-xs text-muted-foreground pt-1">
            {t('privacy_policy')}
          </p>
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
        <CollapsibleContent className="pl-11 pr-3 pb-2 space-y-2">
          <p className="text-xs text-muted-foreground py-1">
            {t('manage_your_account')}
          </p>
          <div className="text-xs text-muted-foreground">
            <span className="font-medium text-foreground">{t('email')}:</span> Connected
          </div>
          <div className="text-xs text-muted-foreground">
            <span className="font-medium text-foreground">{t('password')}:</span> Set
          </div>
        </CollapsibleContent>
      </Collapsible>

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
