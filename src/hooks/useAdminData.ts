import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface NewsItem {
  id: string;
  title: string;
  content: string;
  category: string;
  published: boolean;
  created_at: string;
}

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  active: boolean;
  created_at: string;
  stock_quantity: number;
  low_stock_threshold: number;
}

interface ForumPost {
  id: string;
  title: string;
  content: string;
  category: string;
  published: boolean;
  created_at: string;
}

interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  created_at: string;
  role?: string;
  user_roles?: Array<{ role: string }>;
}

interface ProfanityWord {
  id: string;
  word: string;
  severity: string;
  created_at: string;
}

export const useAdminData = () => {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [forumPosts, setForumPosts] = useState<ForumPost[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [profanityWords, setProfanityWords] = useState<ProfanityWord[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      
      const [newsData, productsData, forumData, usersData, profanityData, adminRolesData] = await Promise.all([
        supabase.from('news').select('*').order('created_at', { ascending: false }).limit(50),
        supabase.from('products').select('*').order('created_at', { ascending: false }).limit(50),
        supabase.from('forum_posts').select('*').order('created_at', { ascending: false }).limit(50),
        supabase.from('profiles').select('*').order('created_at', { ascending: false }).limit(100),
        supabase.from('profanity_words').select('*').order('created_at', { ascending: false }).limit(50),
        supabase.from('user_roles').select('user_id, role').eq('role', 'admin')
      ]);

      if (newsData.data) setNews(newsData.data);
      if (productsData.data) setProducts(productsData.data);
      if (forumData.data) setForumPosts(forumData.data);
      if (usersData.data) {
        const adminUserIds = new Set(
          adminRolesData.data?.map(role => role.user_id) || []
        );
        
        const usersWithRoles = usersData.data.map(userProfile => ({
          ...userProfile,
          role: adminUserIds.has(userProfile.id) ? 'admin' : 'user'
        }));
        
        setUsers(usersWithRoles);
      }
      if (profanityData.data) setProfanityWords(profanityData.data);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Error",
        description: "Failed to load admin data.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const toggleNewsPublished = useCallback(async (id: string, published: boolean) => {
    const { error } = await supabase
      .from('news')
      .update({ published: !published })
      .eq('id', id);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to update news status.",
        variant: "destructive",
      });
      return;
    }

    setNews(news.map(item => 
      item.id === id ? { ...item, published: !published } : item
    ));
    
    toast({
      title: "Success",
      description: `News ${!published ? 'published' : 'unpublished'} successfully.`,
    });
  }, [news, toast]);

  const toggleProductActive = useCallback(async (id: string, active: boolean) => {
    const { error } = await supabase
      .from('products')
      .update({ active: !active })
      .eq('id', id);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to update product status.",
        variant: "destructive",
      });
      return;
    }

    setProducts(products.map(item => 
      item.id === id ? { ...item, active: !active } : item
    ));
    
    toast({
      title: "Success",
      description: `Product ${!active ? 'activated' : 'deactivated'} successfully.`,
    });
  }, [products, toast]);

  const deleteItem = useCallback(async (table: 'news' | 'products' | 'forum_posts', id: string, type: string) => {
    const { error } = await supabase
      .from(table)
      .delete()
      .eq('id', id);

    if (error) {
      toast({
        title: "Error",
        description: `Failed to delete ${type}.`,
        variant: "destructive",
      });
      return;
    }

    if (table === 'news') {
      setNews(news.filter(item => item.id !== id));
    } else if (table === 'products') {
      setProducts(products.filter(item => item.id !== id));
    } else if (table === 'forum_posts') {
      setForumPosts(forumPosts.filter(item => item.id !== id));
    }

    toast({
      title: "Success",
      description: `${type} deleted successfully.`,
    });
  }, [news, products, forumPosts, toast]);

  const toggleUserRole = useCallback(async (userId: string, currentRole: string) => {
    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    
    if (newRole === 'admin') {
      const { error } = await supabase
        .from('user_roles')
        .insert({ user_id: userId, role: 'admin' });
      
      if (error) {
        toast({
          title: "Error",
          description: "Failed to grant admin privileges.",
          variant: "destructive",
        });
        return;
      }
    } else {
      const { error } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId)
        .eq('role', 'admin');
      
      if (error) {
        toast({
          title: "Error",
          description: "Failed to revoke admin privileges.",
          variant: "destructive",
        });
        return;
      }
    }

    setUsers(users.map(user => 
      user.id === userId ? { ...user, role: newRole } : user
    ));
    
    toast({
      title: "Success",
      description: `User ${newRole === 'admin' ? 'granted' : 'revoked'} admin privileges.`,
    });
  }, [users, toast]);

  const addProfanityWord = useCallback(async (wordInput: string, severity: string, userId?: string) => {
    if (!wordInput.trim()) {
      toast({
        title: "Error",
        description: "Please enter word(s) to add.",
        variant: "destructive",
      });
      return;
    }

    // Parse bulk input: split by commas, newlines, or both
    const words = wordInput
      .split(/[,\n]+/)
      .map(w => w.toLowerCase().trim())
      .filter(w => w.length > 0);

    if (words.length === 0) {
      toast({
        title: "Error",
        description: "No valid words found.",
        variant: "destructive",
      });
      return;
    }

    // Remove duplicates from input
    const uniqueWords = [...new Set(words)];

    try {
      const rows = uniqueWords.map(word => ({
        word,
        severity,
        created_by: userId,
      }));

      const { error } = await supabase
        .from('profanity_words')
        .upsert(rows, { onConflict: 'word', ignoreDuplicates: true });

      if (error) throw error;

      const { data } = await supabase
        .from('profanity_words')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (data) setProfanityWords(data);
      
      toast({
        title: "Success",
        description: `${uniqueWords.length} word${uniqueWords.length > 1 ? 's' : ''} added to filter.`,
      });
    } catch (error) {
      console.error('Error adding profanity words:', error);
      toast({
        title: "Error",
        description: "Failed to add profanity word(s).",
        variant: "destructive",
      });
    }
  }, [toast]);

  const deleteProfanityWord = useCallback(async (id: string, word: string) => {
    try {
      const { error } = await supabase
        .from('profanity_words')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setProfanityWords(profanityWords.filter(item => item.id !== id));
      
      toast({
        title: "Success",
        description: `Profanity word "${word}" removed successfully.`,
      });
    } catch (error) {
      console.error('Error deleting profanity word:', error);
      toast({
        title: "Error",
        description: "Failed to delete profanity word.",
        variant: "destructive",
      });
    }
  }, [profanityWords, toast]);

  return {
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
  };
};