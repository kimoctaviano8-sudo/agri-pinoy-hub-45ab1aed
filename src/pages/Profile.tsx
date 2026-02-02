import { useState, useRef, useEffect } from "react";
import { Camera, Edit, Save, MapPin, Phone, Mail, Calendar, Briefcase, Award, Settings, Bell, Shield, HelpCircle, LogOut, ChevronRight, Heart, Download, Globe, Monitor, Rss, Trash2, History, Loader2, Check, User, Users, Trophy, Menu, Star, Target, DollarSign, Gift, Fingerprint, Crown, Headphones, PhilippinePeso } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Drawer, DrawerContent, DrawerTrigger, DrawerClose } from "@/components/ui/drawer";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "@/contexts/TranslationContext";
import { useOnboarding } from "@/contexts/OnboardingContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Link, useNavigate } from "react-router-dom";
import farmerImage from "@/assets/farmer-mobile.jpg";
import { ProfileImageCropper } from "@/components/ProfileImageCropper";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useCacheManager } from "@/hooks/useCacheManager";
import OrderStatusTracker from "@/components/OrderStatusTracker";

import AchievementsModal from "@/components/AchievementsModal";
import { RatingModal } from "@/components/RatingModal";
import { ProfileSettingsSection } from "@/components/ProfileSettingsSection";
import { BiometricSettingsModal } from "@/components/BiometricSettingsModal";
import { useVacationModeContext } from "@/contexts/VacationModeContext";

const Profile = () => {
  const navigate = useNavigate();
  const {
    user,
    logout,
    userRole
  } = useAuth();
  const { t } = useTranslation();
  const {
    resetOnboarding
  } = useOnboarding();
  const {
    toast
  } = useToast();
  const { vacationMode } = useVacationModeContext();
  const [isEditing, setIsEditing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [avatar, setAvatar] = useState<string | null>(null);
  const [showCropper, setShowCropper] = useState(false);
  
  const {
    isClearing: clearingCache,
    clearCache,
    clearUserData,
    clearCacheAndReload
  } = useCacheManager();
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState<string>("english");
  const [selectedPage, setSelectedPage] = useState<string>("");
  const [profileData, setProfileData] = useState({
    name: user?.user_metadata?.full_name || user?.email?.split('@')[0] || "User",
    email: user?.email || "",
    phone: user?.phone || "",
    location: "",
    farmSize: "",
    primaryCrops: [],
    yearsExperience: "",
    gender: "",
    age: "",
    memberSince: ""
  });
  const [streakData, setStreakData] = useState({
    currentStreak: 0,
    longestStreak: 0,
    totalLogins: 0,
    vouchersEarned: 0,
    lastLoginDate: null as string | null
  });
  const [earnedPoints, setEarnedPoints] = useState(0);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [showBiometricSettings, setShowBiometricSettings] = useState(false);
  const [showAchievements, setShowAchievements] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false);

  // Load user profile and avatar on component mount
  useEffect(() => {
    if (user?.id) {
      loadProfile();
      loadStreakData();
      loadEarnedPoints();
      updateLoginStreak();
    }
  }, [user?.id]);
  const loadProfile = async () => {
    if (!user?.id) return;
    try {
      const {
        data: profile,
        error
      } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      if (error && error.code !== 'PGRST116') {
        console.error('Error loading profile:', error);
        return;
      }
      if (profile) {
        const memberSinceDate = profile.created_at ? new Date(profile.created_at).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long'
        }) : "Recently";
        setProfileData(prev => ({
          ...prev,
          name: profile.full_name || prev.name,
          email: profile.email || prev.email,
          phone: profile.phone || prev.phone,
          location: [profile.barangay, profile.city].filter(Boolean).join(', ') || "Philippines",
          memberSince: memberSinceDate
        }));
        setAvatar(profile.avatar_url);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  };
  const loadStreakData = async () => {
    if (!user?.id) return;
    try {
      const {
        data: streak,
        error
      } = await supabase.from('user_streaks').select('*').eq('user_id', user.id).single();
      if (error && error.code !== 'PGRST116') {
        console.error('Error loading streak data:', error);
        return;
      }
      if (streak) {
        setStreakData({
          currentStreak: streak.current_streak || 0,
          longestStreak: streak.longest_streak || 0,
          totalLogins: streak.total_logins || 0,
          vouchersEarned: streak.vouchers_earned || 0,
          lastLoginDate: streak.last_login_date
        });
      }
    } catch (error) {
      console.error('Error loading streak data:', error);
    }
  };
  const loadEarnedPoints = async () => {
    if (!user?.id) return;
    try {
      const {
        data: orders,
        error
      } = await supabase.from('orders').select('items, status').eq('user_id', user.id).eq('status', 'completed');
      if (error) {
        console.error('Error loading earned points:', error);
        return;
      }
      if (orders) {
        let totalPoints = 0;
        orders.forEach(order => {
          if (order.items && Array.isArray(order.items)) {
            order.items.forEach((item: any) => {
              totalPoints += item.quantity || 1; // 1 point per item quantity
            });
          }
        });
        setEarnedPoints(totalPoints);
      }
    } catch (error) {
      console.error('Error loading earned points:', error);
    }
  };
  const updateLoginStreak = async () => {
    if (!user?.id) return;
    try {
      const {
        error
      } = await supabase.rpc('update_login_streak', {
        user_id: user.id
      });
      if (error) {
        console.error('Error updating login streak:', error);
        return;
      }

      // Reload streak data after update
      setTimeout(() => {
        loadStreakData();
      }, 500);

      // Show voucher earned notification if applicable
      const {
        data: currentStreak
      } = await supabase.from('user_streaks').select('current_streak, vouchers_earned').eq('user_id', user.id).single();
      if (currentStreak?.current_streak && currentStreak.current_streak % 7 === 0) {
        toast({
          title: "🎉 Voucher Earned!",
          description: `Congratulations! You've earned a bonus voucher for your ${currentStreak.current_streak}-day login streak!`
        });
      }
    } catch (error) {
      console.error('Error updating login streak:', error);
    }
  };
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setProfileData({
      ...profileData,
      [e.target.name]: e.target.value
    });
  };
  const handleCroppedImageSave = async (croppedImageBlob: Blob) => {
    if (!user?.id) return;
    setUploading(true);
    try {
      const fileName = `${user.id}/avatar.jpg`;

      // Upload the cropped file to Supabase Storage
      const {
        error: uploadError
      } = await supabase.storage.from('avatars').upload(fileName, croppedImageBlob, {
        upsert: true
      });
      if (uploadError) throw uploadError;

      // Get the public URL with cache-busting parameter
      const {
        data
      } = supabase.storage.from('avatars').getPublicUrl(fileName);
      
      // Add cache-busting timestamp to URL
      const avatarUrlWithCache = `${data.publicUrl}?t=${Date.now()}`;

      // Update the profile with the new avatar URL
      const {
        error: updateError
      } = await supabase.from('profiles').upsert({
        id: user.id,
        avatar_url: avatarUrlWithCache,
        full_name: profileData.name,
        email: profileData.email
      });
      if (updateError) throw updateError;
      setAvatar(avatarUrlWithCache);
      setShowCropper(false);
      toast({
        title: "Profile picture updated",
        description: "Your profile picture has been updated successfully."
      });
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast({
        title: "Upload failed",
        description: "Failed to upload profile picture. Please try again.",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };
  const handleSave = async () => {
    if (!user?.id) return;
    try {
      const {
        error
      } = await supabase.from('profiles').upsert({
        id: user.id,
        full_name: profileData.name,
        email: profileData.email,
        avatar_url: avatar
      });
      if (error) throw error;
      setIsEditing(false);
      toast({
        title: "Profile Updated",
        description: "Your profile information has been saved successfully."
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Update failed",
        description: "Failed to update profile. Please try again.",
        variant: "destructive"
      });
    }
  };
  const handleClearCache = async () => {
    await clearCache({
      preserveAuth: true
    });
  };
  const availablePages = [
    { value: "home", label: t('dashboard') },
    { value: "products", label: t('products') },
    { value: "forum", label: t('community_forum') },
    { value: "plant-scanner", label: t('plant_scanner') },
    { value: "profile", label: t('profile') },
    { value: "news", label: t('news') }
  ];
  const [activityData, setActivityData] = useState([{
    action: "Logged in",
    item: "Daily streak updated",
    time: "Today"
  }, {
    action: "Profile updated",
    item: "Personal information",
    time: "Recently"
  }]);
  const achievements = [{
    title: "Early Adopter",
    description: "First 100 users on Gemini",
    icon: Award
  }, {
    title: "Active Reader",
    description: "Read 50+ articles",
    icon: Award
  }, {
    title: "Product Explorer",
    description: "Viewed 20+ products",
    icon: Award
  }];
  const menuItems = [
    { icon: Heart, label: t('favourites'), action: () => {} },
    { icon: Download, label: t('downloads'), action: () => {} },
    { icon: Globe, label: t('language'), action: () => setShowLanguageModal(true) },
    { icon: MapPin, label: t('location'), action: () => {} },
    { icon: Monitor, label: t('display'), action: () => {} },
    { icon: Rss, label: t('feed_preference'), action: () => {} },
    { icon: Bell, label: t('subscription'), action: () => {} }
  ];
  const accountItems = [
    { icon: Trash2, label: t('clear_cache'), action: handleClearCache, loading: clearingCache },
    { icon: History, label: t('clear_history'), action: clearUserData, loading: clearingCache },
    { icon: Download, label: t('refresh'), action: () => clearCacheAndReload(true), loading: clearingCache },
    { icon: LogOut, label: t('log_out'), action: logout, className: "text-destructive" }
  ];
  const drawerMenuItems = [{
    icon: Phone,
    label: "Need Help?",
    subtitle: "Chat support live 24/7",
    action: () => navigate('/inbox')
  }, {
    icon: Edit,
    label: "Edit Profile",
    subtitle: "Update your personal information",
    action: () => {
      setIsEditing(true);
      setIsDrawerOpen(false);
    }
  }, {
    icon: Trophy,
    label: "Achievements",
    subtitle: "Achieve more every day",
    action: () => {
      setShowAchievements(true);
      setIsDrawerOpen(false);
    }
  }, {
    icon: Shield,
    label: "Gemini Policies",
    subtitle: "Terms and privacy policies",
    action: () => navigate('/gemini-policies')
  }, {
    icon: Fingerprint,
    label: "Enable Biometrics / Face ID",
    subtitle: "Login made easy",
    action: () => setShowBiometricSettings(true)
  }, {
    icon: HelpCircle,
    label: "Show App Tutorial",
    subtitle: "Restart onboarding guide",
    action: () => {
      resetOnboarding();
      toast({
        title: "Tutorial Reset",
        description: "The app tutorial will show on your next login."
      });
    }
  }, {
    icon: Star,
    label: "Rate Us",
    subtitle: "Share your mobile experience",
    action: () => setShowRatingModal(true)
  }];

  // Admin-specific menu items
  const adminMenuItems = [{
    icon: Monitor,
    label: "Admin Dashboard",
    subtitle: "Manage system settings",
    action: () => window.location.href = "/admin"
  }];
  return <div className="min-h-screen bg-background">
      {/* Profile Content - Full Screen */}
      <div className="min-h-screen bg-background">
        {/* Full Width Cover Photo */}
        <div className="relative w-full h-40">
          <img src="/lovable-uploads/da604e03-f80f-4472-b4bf-4ff292fdfd5a.png" alt="Agricultural landscape cover" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
          
          {/* Settings Menu Button - Positioned over Cover Photo */}
          <div className="absolute top-4 right-4 z-20">
            <Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
              <DrawerTrigger asChild>
                <Button variant="ghost" size="sm" className="text-white bg-black/20 hover:bg-black/30 backdrop-blur-sm text-left">
                  <Menu className="w-4 h-4" />
                </Button>
              </DrawerTrigger>
              <DrawerContent className="bg-background border-none max-h-[90vh]">
                <div className="p-6 overflow-y-auto max-h-[80vh] scrollbar-hide">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-semibold text-primary">Menu</h2>
                    <p className="text-sm text-muted-foreground">Welcome back, {profileData.name}!</p>
                  </div>
                  
                  {/* Admin Section */}
                  {userRole === 'admin' && <>
                      <div className="mb-4">
                        <h3 className="text-sm font-medium text-destructive mb-2 flex items-center gap-2">
                          <Shield className="w-4 h-4" />
                          Admin Dashboard
                        </h3>
                        <div className="space-y-1">
                          {adminMenuItems.map((item, index) => <button key={`admin-${index}`} onClick={() => {
                        item.action();
                        setIsDrawerOpen(false);
                      }} className="w-full flex items-center justify-between p-3 hover:bg-destructive/10 transition-colors rounded-lg group">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-destructive/10 flex items-center justify-center group-hover:bg-destructive/20 transition-colors">
                                  <item.icon className="w-4 h-4 text-destructive" />
                                </div>
                                <div className="flex flex-col items-start">
                                  <span className="text-sm font-medium text-foreground">{item.label}</span>
                                  {item.subtitle && <span className="text-xs text-muted-foreground">{item.subtitle}</span>}
                                </div>
                              </div>
                              <ChevronRight className="w-4 h-4 text-muted-foreground" />
                            </button>)}
                        </div>
                      </div>
                      <Separator className="my-4" />
                    </>}
                  
                   {/* Regular Menu Items */}
                  <div className="space-y-1">
                    {drawerMenuItems.map((item, index) => <button key={index} onClick={() => {
                    item.action();
                    setIsDrawerOpen(false);
                  }} className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors rounded-lg group">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                            <item.icon className="w-4 h-4 text-muted-foreground group-hover:text-primary" />
                          </div>
                          <div className="flex flex-col items-start">
                            <span className="text-sm font-medium text-foreground">{item.label}</span>
                            {item.subtitle && <span className="text-xs text-muted-foreground">{item.subtitle}</span>}
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-muted-foreground" />
                      </button>)}
                  </div>
                  
                  {/* Settings Section */}
                  <Separator className="my-4" />
                  <ProfileSettingsSection />
                  
                  {/* Logout Section */}
                  <Separator className="my-4" />
                  <button onClick={() => {
                  logout();
                  setIsDrawerOpen(false);
                }} className="w-full flex items-center justify-between p-4 hover:bg-destructive/10 transition-colors rounded-lg group">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-destructive/10 flex items-center justify-center group-hover:bg-destructive/20 transition-colors">
                        <LogOut className="w-4 h-4 text-destructive" />
                      </div>
                      <span className="text-sm font-medium text-destructive">Logout</span>
                    </div>
                  </button>
                </div>
              </DrawerContent>
            </Drawer>
          </div>
        </div>

        <div className="px-6 -mt-12 relative z-10 pb-8">
          {/* Profile Section */}
          <div className="flex items-start gap-4 mb-4">
            {/* Profile Image - Left Side */}
            <div className="relative flex-shrink-0 mt-6">
              <Avatar className="w-[99px] h-[99px] shadow-lg border-[3px] border-white">
                <AvatarImage src={avatar || undefined} alt="Profile" />
                <AvatarFallback className="bg-primary/10 text-primary text-xl font-semibold">
                  {profileData.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <Button size="sm" variant="outline" onClick={() => setShowCropper(true)} disabled={uploading} className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full p-0 backdrop-blur-sm shadow-md hover:shadow-lg border-0 text-primary-foreground bg-primary hover:bg-primary/90">
                <Camera className="w-4 h-4 text-primary-foreground" />
              </Button>
            </div>

            {/* Name and Info - Right Side */}
            <div className="flex-1 pt-14">
              <h2 className="text-xl font-bold text-foreground mb-1">
                {profileData.name}
              </h2>
              <p className="text-xs text-muted-foreground mb-0">
                Member since {profileData.memberSince}
              </p>
              
              {/* Role Badge */}
              {userRole && <div className="mb-2 pt-[3%]">
                  <Badge className={`font-medium px-2 py-0.5 flex items-center gap-1 w-fit text-xs ${
                    userRole === 'admin' 
                      ? 'text-primary border-primary/20 bg-amber-100' 
                      : userRole === 'field_technician'
                      ? 'text-blue-600 border-blue-500/20 bg-blue-100'
                      : 'text-green-500 border-green-500 bg-green-500/10'
                  }`}>
                    {userRole === 'admin' 
                      ? <Crown className="w-3 h-3 text-amber-500" /> 
                      : userRole === 'field_technician'
                      ? <Headphones className="w-3 h-3 text-blue-600" />
                      : <User className="w-3 h-3 text-green-500" />
                    }
                    {userRole === 'field_technician' ? 'Field Technician' : userRole.charAt(0).toUpperCase() + userRole.slice(1)}
                  </Badge>
                </div>}
            </div>
          </div>

          <div className="text-center">
            {/* Stats */}
            <div className="grid grid-cols-4 gap-3 mb-6">
              <div className="text-center">
                <div className="flex items-center justify-center mb-1">
                  <Target className="w-4 h-4 mr-1 text-white" />
                </div>
                <div className="text-2xl font-bold text-foreground">{streakData.currentStreak}d</div>
                <div className="text-xs text-muted-foreground">Current
Streak</div>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center mb-1">
                  <Trophy className="w-4 h-4 mr-1 text-white" />
                </div>
                <div className="text-2xl font-bold text-foreground">{streakData.longestStreak}</div>
                <div className="text-xs text-muted-foreground">Longest
Streak</div>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center mb-1">
                  <Gift className="w-4 h-4 mr-1 text-white" />
                </div>
                <div className="text-2xl font-bold text-foreground">{streakData.vouchersEarned}</div>
                <div className="text-xs text-muted-foreground">Vouchers Earned</div>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center mb-1">
                  <PhilippinePeso className="w-4 h-4 mr-1 text-white" />
                </div>
                <div className="text-2xl font-bold text-foreground">{earnedPoints}</div>
                <div className="text-xs text-muted-foreground">Earned Points</div>
              </div>
            </div>

            {/* Streak Progress Card */}
            <div className="bg-muted/50 rounded-2xl p-4 mb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center">
                    <Target className="w-4 h-4 text-primary" />
                  </div>
                  <div className="text-left">
                    <div className="text-sm font-semibold text-foreground">
                      {streakData.currentStreak > 0 ? `${streakData.currentStreak} Day Streak!` : "Start Your Streak"}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {streakData.currentStreak >= 7 ? "Keep it up! Voucher earned every 7 days" : `${7 - streakData.currentStreak % 7} days until next voucher`}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-primary">{streakData.currentStreak % 7}/7</div>
                  <div className="text-xs text-muted-foreground">Progress</div>
                </div>
              </div>
            </div>

            {/* Streak Progress */}
            <div className="text-left">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-6 h-6 bg-accent/20 rounded-full flex items-center justify-center">
                  <div className="w-3 h-3 bg-accent rounded-full"></div>
                </div>
                <span className="text-sm font-semibold text-foreground">
                  You're on your {streakData.currentStreak}d streak!
                </span>
              </div>
              <p className="text-xs text-muted-foreground mb-3">
                Keep using the app to get benefits & bonus! Vouchers earned: {streakData.vouchersEarned}
              </p>
              <div className="w-full bg-muted rounded-full h-2">
                <div className="bg-accent h-2 rounded-full" style={{
                width: `${Math.min(streakData.currentStreak / 7 * 100, 100)}%`
              }}></div>
              </div>
            </div>
          </div>

          {/* Order Status Tracker - Hidden during vacation mode */}
          {!vacationMode && (
            <div className="mt-6">
              <OrderStatusTracker />
            </div>
          )}

          {/* Support Section */}
          <div className="mt-6 mb-16">
            <Card className="p-0 overflow-hidden">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <HelpCircle className="w-5 h-5 text-primary" />
                  Support
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0 pb-4">
                <div className="space-y-2">
                  <Link to="/help-centre" className="flex items-center justify-between p-3 hover:bg-muted/50 transition-colors rounded-lg group">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                        <HelpCircle className="w-4 h-4 text-primary" />
                      </div>
                      <div className="flex flex-col items-start">
                        <span className="text-sm font-medium text-foreground">Help Centre</span>
                        <span className="text-xs text-muted-foreground">FAQs, guides & support articles</span>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Profile Image Cropper */}
      <ProfileImageCropper isOpen={showCropper} onClose={() => setShowCropper(false)} onSave={handleCroppedImageSave} currentImage={avatar || undefined} />

      {/* Edit Profile Modal/Overlay */}
      {isEditing && <div className="fixed inset-0 bg-black/50 z-50 flex items-end">
          <div className="bg-background w-full rounded-t-2xl p-4 space-y-4 animate-slide-in-right">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Edit Profile</h2>
              <Button variant="ghost" size="sm" onClick={() => setIsEditing(false)}>
                Cancel
              </Button>
            </div>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-name" className="text-sm font-medium">Full Name</Label>
                <Input id="edit-name" name="name" value={profileData.name} onChange={handleInputChange} className="mt-1" />
              </div>
              
              <div>
                <Label htmlFor="edit-email" className="text-sm font-medium">Email</Label>
                <Input id="edit-email" name="email" type="email" value={profileData.email} onChange={handleInputChange} className="mt-1" />
              </div>

              
              <div>
                <Label htmlFor="edit-phone" className="text-sm font-medium">Phone</Label>
                <Input id="edit-phone" name="phone" value={profileData.phone} onChange={handleInputChange} className="mt-1" />
              </div>
              
              <div>
                <Label htmlFor="edit-location" className="text-sm font-medium">Location</Label>
                <Input id="edit-location" name="location" value={profileData.location} onChange={handleInputChange} className="mt-1" />
              </div>
              
              <Button onClick={handleSave} className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
                Save Changes
              </Button>
            </div>
          </div>
        </div>}


      {/* Biometric Settings Modal */}
      <BiometricSettingsModal 
        open={showBiometricSettings} 
        onOpenChange={setShowBiometricSettings} 
      />

      {/* Achievements Modal */}
      <AchievementsModal isOpen={showAchievements} onClose={() => setShowAchievements(false)} currentPoints={earnedPoints} />

      {/* Rating Modal */}
      <RatingModal open={showRatingModal} onOpenChange={setShowRatingModal} />


    </div>;
};
export default Profile;