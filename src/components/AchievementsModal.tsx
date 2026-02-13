import { useState, useEffect } from "react";
import { Trophy, Star, Target, Gift, Coins, ShoppingCart, Scan, BookOpen, Crown, Lock, CheckCircle, X, Zap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  points: number;
  earned: boolean;
  progress: number;
  maxProgress: number;
  category: string;
  rarity: "common" | "uncommon" | "rare" | "legendary" | "bronze" | "silver" | "gold" | "platinum";
}

interface AchievementsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPoints: number;
}

const AchievementsModal = ({ isOpen, onClose, currentPoints }: AchievementsModalProps) => {
  const [activeTab, setActiveTab] = useState("achievements");
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (isOpen && user) {
      fetchAchievements();
    }
  }, [isOpen, user]);

  const fetchAchievements = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      // Initialize achievements for the user
      await supabase.rpc('initialize_user_achievements', {
        user_id_param: user.id
      });

      const { data, error } = await supabase
        .from('user_achievements')
        .select('*')
        .eq('user_id', user.id)
        .order('earned', { ascending: false })
        .order('points', { ascending: false });

      if (error) throw error;

      if (data) {
        const formattedAchievements: Achievement[] = data.map(a => ({
          id: a.achievement_id,
          title: a.title,
          description: a.description,
          icon: getIconComponent(a.category),
          points: a.points,
          earned: a.earned,
          progress: a.progress,
          maxProgress: a.target,
          category: a.category,
          rarity: a.rarity as 'common' | 'uncommon' | 'rare' | 'legendary'
        }));
        setAchievements(formattedAchievements);
      }
    } catch (error) {
      console.error('Error fetching achievements:', error);
      toast.error('Failed to load achievements');
    } finally {
      setIsLoading(false);
    }
  };

  const getIconComponent = (category: string) => {
    switch (category) {
      case 'Scanner': return Scan;
      case 'Engagement': return Zap;
      default: return Trophy;
    }
  };

  const hardcodedAchievements: Achievement[] = [
    {
      id: "first-scan",
      title: "Plant Doctor",
      description: "Complete your first plant disease scan",
      icon: Scan,
      points: 10,
      earned: true,
      progress: 1,
      maxProgress: 1,
      category: "farming",
      rarity: "bronze"
    },
    {
      id: "scan-master",
      title: "Scan Master",
      description: "Complete 50 plant scans",
      icon: Target,
      points: 100,
      earned: false,
      progress: 23,
      maxProgress: 50,
      category: "farming",
      rarity: "gold"
    },
    {
      id: "first-purchase",
      title: "First Purchase",
      description: "Make your first product purchase",
      icon: ShoppingCart,
      points: 25,
      earned: true,
      progress: 1,
      maxProgress: 1,
      category: "shopping",
      rarity: "bronze"
    },
    {
      id: "big-spender",
      title: "Big Spender",
      description: "Spend ₱5,000 on products",
      icon: Coins,
      points: 200,
      earned: false,
      progress: 2450,
      maxProgress: 5000,
      category: "shopping",
      rarity: "platinum"
    },
    {
      id: "knowledge-seeker",
      title: "Knowledge Seeker",
      description: "Read 20 agricultural articles",
      icon: BookOpen,
      points: 50,
      earned: false,
      progress: 8,
      maxProgress: 20,
      category: "learning",
      rarity: "silver"
    },
    {
      id: "community-helper",
      title: "Community Helper",
      description: "Help 10 farmers in the forum",
      icon: Star,
      points: 75,
      earned: false,
      progress: 4,
      maxProgress: 10,
      category: "social",
      rarity: "gold"
    }
  ];

  const pointsGuide = [
    { action: "Plant Disease Scan", points: 5, icon: Scan },
    { action: "Purchase Product", points: 10, icon: ShoppingCart },
    { action: "Daily Login", points: 2, icon: Target },
    { action: "Forum Post", points: 8, icon: Star },
    { action: "Article Read", points: 3, icon: BookOpen },
    { action: "Complete Profile", points: 20, icon: Crown }
  ];


  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case "common": return "text-muted-foreground bg-muted";
      case "uncommon": return "text-success-foreground bg-success/20";
      case "rare": return "text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/20";
      case "legendary": return "text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-900/20";
      case "bronze": return "text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/20";
      case "silver": return "text-muted-foreground bg-muted";
      case "gold": return "text-yellow-600 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-900/20";
      case "platinum": return "text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-900/20";
      default: return "text-muted-foreground bg-muted";
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "farming": return Target;
      case "social": return Star;
      case "shopping": return ShoppingCart;
      case "learning": return BookOpen;
      default: return Trophy;
    }
  };

  const earnedAchievements = achievements.filter(a => a.earned);
  const lockedAchievements = achievements.filter(a => !a.earned);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-end z-50">
      <div className="bg-background w-full rounded-t-2xl max-h-[90vh] overflow-hidden animate-slide-in-right">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
              <Trophy className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">Achievements</h2>
              <p className="text-sm text-muted-foreground">Your progress and rewards</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Points Display */}
        <div className="p-4 bg-gradient-to-r from-primary/10 to-accent/10">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Points Earned</p>
              <p className="text-2xl font-bold text-primary">{currentPoints}</p>
            </div>
            <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center">
              <Coins className="w-6 h-6 text-primary" />
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
          <div className="px-4 mt-4">
            <TabsList className="w-full justify-between">
              <TabsTrigger value="achievements" className="text-xs">Achievements</TabsTrigger>
              <TabsTrigger value="earn" className="text-xs">Earn Points</TabsTrigger>
            </TabsList>
          </div>

          <div className="p-4 overflow-y-auto max-h-[60vh] scrollbar-hide">
            <TabsContent value="achievements" className="mt-0 space-y-4">
              {/* Loading State */}
              {isLoading ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">Loading achievements...</p>
                </div>
              ) : (
                <>
                  {/* Earned Achievements */}
                  {earnedAchievements.length > 0 && (
                    <div>
                      <h3 className="text-base font-semibold text-foreground mb-3 flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        Earned ({earnedAchievements.length})
                      </h3>
                <div className="space-y-3">
                  {earnedAchievements.map((achievement) => {
                    const IconComponent = achievement.icon;
                    return (
                      <Card key={achievement.id} className="p-3 bg-green-50 border-green-200">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                            <IconComponent className="w-5 h-5 text-green-600" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-medium text-foreground text-sm">{achievement.title}</h4>
                              <Badge className={`text-xs ${getRarityColor(achievement.rarity)}`}>
                                {achievement.rarity}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground">{achievement.description}</p>
                            <div className="flex items-center gap-1 mt-1">
                              <Coins className="w-3 h-3 text-primary" />
                              <span className="text-xs font-medium text-primary">+{achievement.points} points</span>
                            </div>
                          </div>
                          <CheckCircle className="w-5 h-5 text-green-500" />
                        </div>
                      </Card>
                    );
                  })}
                </div>
                    </div>
                  )}

                  {earnedAchievements.length > 0 && lockedAchievements.length > 0 && <Separator />}

                  {/* Locked Achievements */}
                  {lockedAchievements.length > 0 && (
                    <div>
                <h3 className="text-base font-semibold text-foreground mb-3 flex items-center gap-2">
                  <Lock className="w-4 h-4 text-muted-foreground" />
                  In Progress ({lockedAchievements.length})
                </h3>
                <div className="space-y-3">
                  {lockedAchievements.map((achievement) => {
                    const IconComponent = achievement.icon;
                    const progressPercentage = (achievement.progress / achievement.maxProgress) * 100;
                    return (
                      <Card key={achievement.id} className="p-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center">
                            <IconComponent className="w-5 h-5 text-muted-foreground" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-medium text-foreground text-sm">{achievement.title}</h4>
                              <Badge className={`text-xs ${getRarityColor(achievement.rarity)}`}>
                                {achievement.rarity}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground mb-2">{achievement.description}</p>
                            <div className="space-y-1">
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-muted-foreground">
                                  {achievement.progress}/{achievement.maxProgress}
                                </span>
                                <span className="text-primary font-medium">+{achievement.points} points</span>
                              </div>
                              <Progress value={progressPercentage} className="h-2" />
                            </div>
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
                    </div>
                  )}
                </>
              )}
            </TabsContent>

            <TabsContent value="earn" className="mt-0 space-y-4">
              <div>
                <h3 className="text-base font-semibold text-foreground mb-3">How to Earn Points</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Complete these activities to earn points and unlock achievements!
                </p>
                <div className="space-y-3">
                  {pointsGuide.map((item, index) => {
                    const IconComponent = item.icon;
                    return (
                      <Card key={index} className="p-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                              <IconComponent className="w-4 h-4 text-primary" />
                            </div>
                            <span className="text-sm font-medium text-foreground">{item.action}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Coins className="w-4 h-4 text-primary" />
                            <span className="text-sm font-bold text-primary">+{item.points}</span>
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
};

export default AchievementsModal;