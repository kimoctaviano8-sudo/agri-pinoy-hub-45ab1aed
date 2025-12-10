import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "@/contexts/TranslationContext";
import { useToast } from "@/hooks/use-toast";
import { useAdminData } from "@/hooks/useAdminData";
import { supabase } from "@/integrations/supabase/client";

// Import refactored components
import { AdminStats } from "@/components/admin/AdminStats";
import { AdminAnalytics } from "@/components/admin/AdminAnalytics";
import { AdminNewsTab } from "@/components/admin/AdminNewsTab";
import { AdminProductsTab } from "@/components/admin/AdminProductsTab";
import { AdminForumTab } from "@/components/admin/AdminForumTab";
import { AdminUsersTab } from "@/components/admin/AdminUsersTab";
import { AdminOrdersTab } from "@/components/admin/AdminOrdersTab";
import { StockManagement } from "@/components/admin/StockManagement";
import { AdminCarouselTab } from "@/components/admin/AdminCarouselTab";
import { AdminVouchersTab } from "@/components/admin/AdminVouchersTab";
const AdminDashboard = () => {
  const {
    user,
    userRole
  } = useAuth();
  const navigate = useNavigate();
  const {
    toast
  } = useToast();

  // Profanity word state
  const [newProfanityWord, setNewProfanityWord] = useState("");
  const [newWordSeverity, setNewWordSeverity] = useState("medium");


  // Use the custom hook for data management
  const {
    news,
    products,
    forumPosts,
    users,
    profanityWords,
    loading,
    fetchData,
    toggleNewsPublished,
    toggleProductActive,
    deleteItem,
    toggleUserRole,
    addProfanityWord,
    deleteProfanityWord
  } = useAdminData();

  useEffect(() => {
    console.log('AdminDashboard useEffect - user:', !!user, 'userRole:', userRole, 'loading:', loading);
    if (!user) {
      console.log('AdminDashboard: No user, still loading');
      return;
    }
    if (userRole === null) {
      console.log('AdminDashboard: userRole is null, setting loading to true');
      return;
    }
    if (userRole !== 'admin') {
      console.log('AdminDashboard: User is not admin, role:', userRole);
      toast({
        title: "Access Denied",
        description: "You don't have admin privileges.",
        variant: "destructive"
      });
      navigate('/');
      return;
    }
    console.log('AdminDashboard: User is admin, fetching data');
    fetchData();
  }, [user, userRole, navigate, toast, fetchData]);

  // Loading state
  if (userRole !== 'admin' || loading) {
    return <div className="min-h-screen bg-gradient-earth flex items-center justify-center pb-20">
        <div className="text-center p-6">
          <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-4">
            <div className="w-8 h-8 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin"></div>
          </div>
          <h2 className="text-xl font-semibold text-primary mb-2">Loading Admin Dashboard</h2>
          <p className="text-muted-foreground">Verifying permissions...</p>
        </div>
      </div>;
  }

  // Handler functions
  const handleDeleteNews = (id: string) => deleteItem('news', id, 'News article');
  const handleDeleteProduct = (id: string) => deleteItem('products', id, 'Product');
  const handleDeleteForumPost = (id: string) => deleteItem('forum_posts', id, 'Forum post');
  const handleAddProfanityWord = () => {
    addProfanityWord(newProfanityWord, newWordSeverity, user?.id);
    setNewProfanityWord("");
    setNewWordSeverity("medium");
  };
  return <div className="min-h-screen bg-gradient-earth pb-20">
      <div className="px-4 py-6 bg-background">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground mb-1">Admin Panel</h1>
          <p className="text-sm text-muted-foreground">Manage your app content</p>
        </div>

        {/* Stats */}
        <AdminStats news={news} products={products} users={users} forumPosts={forumPosts} />

        {/* Main Tabs */}
        <Tabs defaultValue="orders" className="space-y-4">
          <div className="w-full overflow-hidden">
            <div className="overflow-x-auto scrollbar-hide">
          <TabsList className="inline-flex h-auto p-1 gap-1 w-max min-w-full">
                <TabsTrigger value="orders" className="text-xs px-3 py-2 whitespace-nowrap flex-shrink-0">Orders</TabsTrigger>
                <TabsTrigger value="analytics" className="text-xs px-3 py-2 whitespace-nowrap flex-shrink-0">Analytics</TabsTrigger>
                <TabsTrigger value="news" className="text-xs px-3 py-2 whitespace-nowrap flex-shrink-0">News</TabsTrigger>
                <TabsTrigger value="products" className="text-xs px-3 py-2 whitespace-nowrap flex-shrink-0">Products</TabsTrigger>
                <TabsTrigger value="stock" className="text-xs px-3 py-2 whitespace-nowrap flex-shrink-0">Stock</TabsTrigger>
                <TabsTrigger value="vouchers" className="text-xs px-3 py-2 whitespace-nowrap flex-shrink-0">Vouchers</TabsTrigger>
                <TabsTrigger value="carousel" className="text-xs px-3 py-2 whitespace-nowrap flex-shrink-0">Carousel</TabsTrigger>
                <TabsTrigger value="forum" className="text-xs px-3 py-2 whitespace-nowrap flex-shrink-0">Community</TabsTrigger>
                <TabsTrigger value="users" className="text-xs px-3 py-2 whitespace-nowrap flex-shrink-0">Users</TabsTrigger>
              </TabsList>
            </div>
          </div>

          {/* Orders Tab */}
          <TabsContent value="orders" className="space-y-3">
            <AdminOrdersTab />
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-4">
            <AdminAnalytics news={news} products={products} users={users} forumPosts={forumPosts} />
          </TabsContent>

          {/* News Tab */}
          <TabsContent value="news" className="space-y-3">
            <AdminNewsTab news={news} onTogglePublished={toggleNewsPublished} onDelete={handleDeleteNews} />
          </TabsContent>

          {/* Products Tab */}
          <TabsContent value="products" className="space-y-3">
            <AdminProductsTab products={products} onToggleActive={toggleProductActive} onDelete={handleDeleteProduct} />
          </TabsContent>

          {/* Stock Management Tab */}
          <TabsContent value="stock" className="space-y-3">
            <StockManagement products={products} onRefresh={fetchData} />
          </TabsContent>

          {/* Vouchers Tab */}
          <TabsContent value="vouchers" className="space-y-3">
            <AdminVouchersTab />
          </TabsContent>

          {/* Carousel Tab */}
          <TabsContent value="carousel" className="space-y-3">
            <AdminCarouselTab />
          </TabsContent>

          {/* Forum Tab */}
          <TabsContent value="forum" className="space-y-3">
            <AdminForumTab forumPosts={forumPosts} profanityWords={profanityWords} onDeletePost={handleDeleteForumPost} onAddProfanityWord={handleAddProfanityWord} onDeleteProfanityWord={deleteProfanityWord} newProfanityWord={newProfanityWord} setNewProfanityWord={setNewProfanityWord} newWordSeverity={newWordSeverity} setNewWordSeverity={setNewWordSeverity} />
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-3">
            <AdminUsersTab users={users} onToggleUserRole={toggleUserRole} />
          </TabsContent>
        </Tabs>
      </div>
    </div>;
};
export default AdminDashboard;