import { FileText, Package, Users, MessageSquare } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface StatsProps {
  news: { published: boolean }[];
  products: { active: boolean }[];
  users: { role?: string }[];
  forumPosts: { published: boolean }[];
}

export const AdminStats = ({ news, products, users, forumPosts }: StatsProps) => {
  const stats = [
    { 
      title: "News", 
      value: news.length.toString(), 
      icon: FileText, 
      published: news.filter(n => n.published).length 
    },
    { 
      title: "Products", 
      value: products.length.toString(), 
      icon: Package, 
      active: products.filter(p => p.active).length 
    },
    { 
      title: "Users", 
      value: users.length.toString(), 
      icon: Users, 
      admins: users.filter(u => u.role === 'admin').length 
    },
    { 
      title: "Forum", 
      value: forumPosts.length.toString(), 
      icon: MessageSquare, 
      published: forumPosts.filter(f => f.published).length 
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 mb-6">
      {stats.map((stat) => (
        <Card key={stat.title} className="p-3">
          <CardContent className="p-0">
            <div className="text-center">
              <div className="p-2 bg-primary/10 rounded-lg w-8 h-8 flex items-center justify-center mx-auto mb-2">
                <stat.icon className="w-4 h-4 text-primary" />
              </div>
              <div className="text-lg font-bold text-foreground">{stat.value}</div>
              <div className="text-xs text-muted-foreground mb-1">{stat.title}</div>
              {'published' in stat && (
                <div className="text-xs text-primary">{stat.published} active</div>
              )}
              {'active' in stat && (
                <div className="text-xs text-primary">{stat.active} active</div>
              )}
              {'admins' in stat && (
                <div className="text-xs text-primary">{stat.admins} admins</div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};