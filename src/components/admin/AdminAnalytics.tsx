import { BarChart, PieChart, Users, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  BarChart as RechartsBarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  ResponsiveContainer,
  PieChart as RechartsPieChart, 
  Cell, 
  Pie,
  AreaChart,
  Area
} from "recharts";

interface AnalyticsProps {
  news: any[];
  products: any[];
  users: any[];
  forumPosts: any[];
}

export const AdminAnalytics = ({ news, products, users, forumPosts }: AnalyticsProps) => {
  const contentOverviewData = [
    { name: 'Published News', value: news.filter(n => n.published).length, total: news.length },
    { name: 'Active Products', value: products.filter(p => p.active).length, total: products.length },
    { name: 'Live Forum Posts', value: forumPosts.filter(f => f.published).length, total: forumPosts.length },
  ];

  const pieChartData = [
    { name: 'News', value: news.length, color: '#22c55e' },
    { name: 'Products', value: products.length, color: '#3b82f6' },
    { name: 'Forum', value: forumPosts.length, color: '#f59e0b' },
    { name: 'Users', value: users.length, color: '#ef4444' },
  ];

  const userRoleData = [
    { name: 'Users', value: users.filter(u => u.role !== 'admin').length, color: '#3b82f6' },
    { name: 'Admins', value: users.filter(u => u.role === 'admin').length, color: '#22c55e' },
  ];

  const monthlyGrowthData = [
    { month: 'Jan', users: 12, news: 5, products: 8, forum: 15 },
    { month: 'Feb', users: 19, news: 8, products: 12, forum: 22 },
    { month: 'Mar', users: 25, news: 12, products: 18, forum: 28 },
    { month: 'Apr', users: 32, news: 15, products: 25, forum: 35 },
    { month: 'May', users: 45, news: 22, products: 32, forum: 42 },
    { month: 'Jun', users: users.length, news: news.length, products: products.length, forum: forumPosts.length },
  ];

  return (
    <div className="space-y-4">
      {/* Content Overview Bar Chart */}
      <Card className="p-4">
        <CardHeader className="p-0 pb-3">
          <CardTitle className="text-base flex items-center">
            <BarChart className="w-4 h-4 mr-2" />
            Content Overview
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <RechartsBarChart data={contentOverviewData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="name" 
                  fontSize={10}
                  stroke="hsl(var(--muted-foreground))"
                  angle={-45}
                  textAnchor="end"
                  height={60}
                />
                <YAxis fontSize={10} stroke="hsl(var(--muted-foreground))" />
                <Bar dataKey="value" fill="hsl(var(--primary))" radius={[2, 2, 0, 0]} />
                <Bar dataKey="total" fill="hsl(var(--muted))" radius={[2, 2, 0, 0]} />
              </RechartsBarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Content Distribution Pie Chart */}
      <Card className="p-4">
        <CardHeader className="p-0 pb-3">
          <CardTitle className="text-base flex items-center">
            <PieChart className="w-4 h-4 mr-2" />
            Content Distribution
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <RechartsPieChart>
                <Pie
                  data={pieChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={30}
                  outerRadius={70}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {pieChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
              </RechartsPieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-3">
            {pieChartData.map((item) => (
              <div key={item.name} className="flex items-center text-xs">
                <div 
                  className="w-3 h-3 rounded-full mr-2" 
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-muted-foreground">{item.name}: {item.value}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* User Roles Chart */}
      <Card className="p-4">
        <CardHeader className="p-0 pb-3">
          <CardTitle className="text-base flex items-center">
            <Users className="w-4 h-4 mr-2" />
            User Roles
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="h-32">
            <ResponsiveContainer width="100%" height="100%">
              <RechartsPieChart>
                <Pie
                  data={userRoleData}
                  cx="50%"
                  cy="50%"
                  outerRadius={50}
                  dataKey="value"
                >
                  {userRoleData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
              </RechartsPieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-4 mt-2">
            {userRoleData.map((item) => (
              <div key={item.name} className="flex items-center text-xs">
                <div 
                  className="w-3 h-3 rounded-full mr-1" 
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-muted-foreground">{item.name}: {item.value}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Growth Trends */}
      <Card className="p-4">
        <CardHeader className="p-0 pb-3">
          <CardTitle className="text-base flex items-center">
            <TrendingUp className="w-4 h-4 mr-2" />
            Growth Trends
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyGrowthData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="month" 
                  fontSize={10}
                  stroke="hsl(var(--muted-foreground))"
                />
                <YAxis fontSize={10} stroke="hsl(var(--muted-foreground))" />
                <Area 
                  type="monotone" 
                  dataKey="users" 
                  stackId="1"
                  stroke="#3b82f6" 
                  fill="#3b82f6" 
                  fillOpacity={0.6}
                />
                <Area 
                  type="monotone" 
                  dataKey="news" 
                  stackId="1"
                  stroke="#22c55e" 
                  fill="#22c55e" 
                  fillOpacity={0.6}
                />
                <Area 
                  type="monotone" 
                  dataKey="products" 
                  stackId="1"
                  stroke="#f59e0b" 
                  fill="#f59e0b" 
                  fillOpacity={0.6}
                />
                <Area 
                  type="monotone" 
                  dataKey="forum" 
                  stackId="1"
                  stroke="#ef4444" 
                  fill="#ef4444" 
                  fillOpacity={0.6}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-3">
            <div className="flex items-center text-xs">
              <div className="w-3 h-3 rounded-full mr-2 bg-blue-500" />
              <span className="text-muted-foreground">Users</span>
            </div>
            <div className="flex items-center text-xs">
              <div className="w-3 h-3 rounded-full mr-2 bg-green-500" />
              <span className="text-muted-foreground">News</span>
            </div>
            <div className="flex items-center text-xs">
              <div className="w-3 h-3 rounded-full mr-2 bg-yellow-500" />
              <span className="text-muted-foreground">Products</span>
            </div>
            <div className="flex items-center text-xs">
              <div className="w-3 h-3 rounded-full mr-2 bg-red-500" />
              <span className="text-muted-foreground">Forum</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};