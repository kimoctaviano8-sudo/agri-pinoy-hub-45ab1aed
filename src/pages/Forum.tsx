import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Heart, MessageCircle, Share2, Send, MoreHorizontal, Image as ImageIcon, X, Trash2, CheckCircle, XCircle, AlertTriangle, RefreshCw, BookOpen, Star, Edit3, Flag, ShieldBan } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { ReactionPicker } from "@/components/ReactionPicker";
import { ShareModal } from "@/components/ShareModal";
import { TypingIndicator } from "@/components/TypingIndicator";
import { useTypingIndicator } from "@/hooks/useTypingIndicator";
import { CommentInput } from "@/components/CommentInput";
import { CommunityEulaModal } from "@/components/CommunityEulaModal";
import { ReportContentModal } from "@/components/ReportContentModal";
import { BlockUserModal } from "@/components/BlockUserModal";
import Lottie from "lottie-react";
interface Comment {
  id: string;
  content: string;
  author: string;
  author_id: string;
  timestamp: string;
  avatar_url?: string;
}
interface Reaction {
  emoji_code: string;
  count: number;
  users: string[];
}
interface Post {
  id: string;
  title: string;
  content: string;
  author: string;
  author_id: string;
  timestamp: string;
  likes: number;
  liked: boolean;
  reactions: Reaction[];
  userReactions: string[];
  comments: Comment[];
  images?: string[];
  category?: string;
  moderation_status?: string;
  flagged_content?: string[];
  avatar_url?: string;
}
const Forum = () => {
  const {
    user
  } = useAuth();
  const {
    toast
  } = useToast();
  const navigate = useNavigate();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [newPost, setNewPost] = useState("");
  const [newTitle, setNewTitle] = useState("");
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [commentTexts, setCommentTexts] = useState<{
    [key: string]: string;
  }>({});
  const [typingStates, setTypingStates] = useState<{
    [key: string]: boolean;
  }>({});
  const [uploading, setUploading] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [profanityWords, setProfanityWords] = useState<string[]>([]);
  const [currentUserAvatar, setCurrentUserAvatar] = useState<string | null>(null);

  // Real-time state
  const [realtimeChannel, setRealtimeChannel] = useState<any>(null);

  // Edit post state
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [editImages, setEditImages] = useState<string[]>([]);
  const [newEditImages, setNewEditImages] = useState<File[]>([]);

  // Lottie animation state
  const [lottieAnimationData, setLottieAnimationData] = useState(null);

  // EULA state
  const [showEula, setShowEula] = useState(false);
  const [eulaAccepted, setEulaAccepted] = useState<boolean | null>(null); // null = loading

  // Block & Report state
  const [blockedUserIds, setBlockedUserIds] = useState<string[]>([]);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportTarget, setReportTarget] = useState<{ postId?: string; commentId?: string; type: "post" | "comment" } | null>(null);
  const [blockModalOpen, setBlockModalOpen] = useState(false);
  const [blockTarget, setBlockTarget] = useState<{ userId: string; userName: string } | null>(null);

  // Pull to refresh state
  const [isPulling, setIsPulling] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const touchStartY = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const checkForProfanity = (text: string): string[] => {
    const flaggedWords: string[] = [];
    const words = text.toLowerCase().split(/\s+/);
    words.forEach(word => {
      const cleanWord = word.replace(/[^\w]/g, '');
      if (profanityWords.some(badWord => cleanWord.includes(badWord.toLowerCase()) || badWord.toLowerCase().includes(cleanWord))) {
        flaggedWords.push(word);
      }
    });
    return flaggedWords;
  };

  // Check EULA acceptance and load blocked users
  useEffect(() => {
    if (user?.id) {
      checkEulaAcceptance();
      fetchBlockedUsers();
    } else {
      setEulaAccepted(true); // Non-logged in users don't need EULA (they can't post)
    }
  }, [user?.id]);

  const checkEulaAcceptance = async () => {
    if (!user?.id) return;
    const { data } = await supabase
      .from('forum_eula_acceptance')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle();
    if (data) {
      setEulaAccepted(true);
    } else {
      setEulaAccepted(false);
      setShowEula(true);
    }
  };

  const handleEulaAccept = async () => {
    if (!user?.id) return;
    await supabase.from('forum_eula_acceptance').insert({ user_id: user.id });
    setEulaAccepted(true);
    setShowEula(false);
    toast({ title: "Welcome!", description: "You can now participate in the community." });
  };

  const fetchBlockedUsers = async () => {
    if (!user?.id) return;
    const { data } = await supabase
      .from('user_blocks')
      .select('blocked_user_id')
      .eq('blocker_id', user.id);
    setBlockedUserIds(data?.map(b => b.blocked_user_id) || []);
  };

  const handleReportContent = async (reason: string, details: string) => {
    if (!user?.id || !reportTarget) return;
    const { error } = await supabase.from('content_flags').insert({
      reporter_id: user.id,
      post_id: reportTarget.postId || null,
      comment_id: reportTarget.commentId || null,
      reason,
      details: details || null,
    });
    if (error) {
      toast({ variant: "destructive", title: "Error", description: "Failed to submit report." });
    } else {
      toast({ title: "Report submitted", description: "Our team will review this within 24 hours." });
    }
  };

  const handleBlockUser = async (reason: string) => {
    if (!user?.id || !blockTarget) return;
    const { error } = await supabase.from('user_blocks').insert({
      blocker_id: user.id,
      blocked_user_id: blockTarget.userId,
      reason: reason || null,
    });
    if (error) {
      if (error.message.includes('duplicate')) {
        toast({ title: "Already blocked", description: "This user is already blocked." });
      } else {
        toast({ variant: "destructive", title: "Error", description: "Failed to block user." });
      }
      return;
    }
    // Also create a content flag to notify admins
    await supabase.from('content_flags').insert({
      reporter_id: user.id,
      post_id: null,
      reason: `User blocked: ${blockTarget.userName}`,
      details: reason || 'User blocked by community member',
    });
    setBlockedUserIds(prev => [...prev, blockTarget.userId]);
    // Immediately remove blocked user's posts from the feed
    setPosts(prev => prev.filter(p => p.author_id !== blockTarget.userId));
    toast({ title: "User blocked", description: `${blockTarget.userName}'s content has been hidden from your feed.` });
  };

  // Fetch forum posts from database
  useEffect(() => {
    fetchPosts();
    fetchProfanityWords();
    if (user?.id) {
      fetchCurrentUserAvatar();
    }
    setupRealtime();
    loadLottieAnimation();
    return () => {
      if (realtimeChannel) {
        supabase.removeChannel(realtimeChannel);
      }
    };
  }, [user?.id]);
  const loadLottieAnimation = async () => {
    try {
      // Use a working Lottie animation URL instead of creating complex JSON
      const response = await fetch('https://lottie.host/6e6fb534-0357-46a5-aad1-fd178cd2313d/2ZTKyQAytB.json');
      if (response.ok) {
        const animationData = await response.json();
        setLottieAnimationData(animationData);
      } else {
        // Fallback to a simpler approach
        setLottieAnimationData(null);
      }
    } catch (error) {
      console.error("Failed to load Lottie animation:", error);
      setLottieAnimationData(null);
    }
  };

  // Fetch profanity words from database
  const fetchProfanityWords = async () => {
    try {
      const {
        data,
        error
      } = await supabase.from('profanity_words').select('word').order('created_at', {
        ascending: false
      });
      if (error) {
        console.error('Error fetching profanity words:', error);
        return;
      }
      setProfanityWords(data?.map(item => item.word) || []);
    } catch (error) {
      console.error('Error fetching profanity words:', error);
    }
  };
  const fetchCurrentUserAvatar = async () => {
    if (!user?.id) return;
    try {
      const {
        data: profile
      } = await supabase.from('profiles').select('avatar_url').eq('id', user.id).single();
      if (profile?.avatar_url) {
        setCurrentUserAvatar(profile.avatar_url);
      }
    } catch (error) {
      console.error('Error fetching current user avatar:', error);
    }
  };

  // Check if user is admin
  // NOTE: This isAdmin state is for UI visibility ONLY (e.g., showing delete buttons).
  // Real authorization is enforced server-side via RLS policies using has_role() function.
  // Never rely on this client state for actual authorization decisions.
  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!user) {
        setIsAdmin(false);
        return;
      }
      try {
        const {
          data,
          error
        } = await supabase.from('user_roles').select('role').eq('user_id', user.id).eq('role', 'admin').single();
        // UI only - real authorization enforced by RLS policies
        setIsAdmin(!!data && !error);
      } catch (error) {
        setIsAdmin(false);
      }
    };
    checkAdminStatus();
  }, [user]);
  const setupRealtime = () => {
    const channel = supabase.channel('forum-changes').on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'forum_posts'
    }, () => {
      fetchPosts();
    }).on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'forum_comments'
    }, () => {
      fetchPosts();
    }).on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'forum_reactions'
    }, () => {
      fetchPosts();
    }).subscribe();
    setRealtimeChannel(channel);
  };
  const uploadImages = async (files: File[]): Promise<string[]> => {
    const uploadedUrls: string[] = [];
    for (const file of files) {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user!.id}/${Math.random()}.${fileExt}`;
      const {
        error: uploadError
      } = await supabase.storage.from('forum-images').upload(fileName, file);
      if (uploadError) {
        console.error('Error uploading image:', uploadError);
        throw uploadError;
      }
      const {
        data: {
          publicUrl
        }
      } = supabase.storage.from('forum-images').getPublicUrl(fileName);
      uploadedUrls.push(publicUrl);
    }
    return uploadedUrls;
  };
  const fetchPosts = async () => {
    try {
      // Get published forum posts
      const {
        data: forumPosts,
        error
      } = await supabase.from('forum_posts').select('*').eq('published', true).order('created_at', {
        ascending: false
      });
      if (error) {
        console.error('Error fetching posts:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load forum posts."
        });
        return;
      }

      // Also fetch user's own pending/unpublished posts
      let userPendingPosts: typeof forumPosts = [];
      if (user?.id) {
        const { data: pendingData } = await supabase
          .from('forum_posts')
          .select('*')
          .eq('author_id', user.id)
          .eq('published', false)
          .order('created_at', { ascending: false });
        userPendingPosts = pendingData || [];
      }

      // Merge and deduplicate
      const allPostIds = new Set(forumPosts?.map(p => p.id) || []);
      const mergedPosts = [...(forumPosts || [])];
      for (const p of userPendingPosts || []) {
        if (!allPostIds.has(p.id)) {
          mergedPosts.push(p);
        }
      }
      // Re-sort by created_at descending
      mergedPosts.sort((a, b) => new Date(b.created_at!).getTime() - new Date(a.created_at!).getTime());

      // Get unique author IDs
      const authorIds = [...new Set(mergedPosts?.map(post => post.author_id).filter(Boolean))];

      // Fetch profile data for all authors
      let profilesMap: {
        [key: string]: any;
      } = {};
      if (authorIds.length > 0) {
        const {
          data: profiles
        } = await supabase.from('public_profiles').select('id, full_name, avatar_url').in('id', authorIds);
        profilesMap = profiles?.reduce((acc, profile) => {
          acc[profile.id] = profile;
          return acc;
        }, {} as {
          [key: string]: any;
        }) || {};
      }

      // Fetch comments for all posts
      const postIds = mergedPosts?.map(post => post.id) || [];
      let commentsMap: {
        [key: string]: Comment[];
      } = {};
      if (postIds.length > 0) {
        // First get all comments for these posts
        const {
          data: comments
        } = await supabase.from('forum_comments').select('*').in('post_id', postIds).order('created_at', {
          ascending: true
        });
        if (comments && comments.length > 0) {
          // Get unique comment author IDs
          const commentAuthorIds = [...new Set(comments.map(comment => comment.author_id))];

          // Fetch profiles for comment authors
          const {
            data: commentProfiles
          } = await supabase.from('public_profiles').select('id, full_name, avatar_url').in('id', commentAuthorIds);
          const commentProfilesMap = commentProfiles?.reduce((acc, profile) => {
            acc[profile.id] = profile;
            return acc;
          }, {} as {
            [key: string]: any;
          }) || {};
          commentsMap = comments.reduce((acc, comment) => {
            const profile = commentProfilesMap[comment.author_id];
            const formattedComment: Comment = {
              id: comment.id,
              content: comment.content,
              author: profile?.full_name || profile?.email?.split('@')[0] || 'Anonymous',
              author_id: comment.author_id,
              timestamp: new Date(comment.created_at).toLocaleDateString(),
              avatar_url: profile?.avatar_url
            };
            if (!acc[comment.post_id]) {
              acc[comment.post_id] = [];
            }
            acc[comment.post_id].push(formattedComment);
            return acc;
          }, {} as {
            [key: string]: Comment[];
          });
        }
      }

      // Fetch reactions for all posts
      let reactionsMap: {
        [key: string]: Reaction[];
      } = {};
      let likesMap: {
        [key: string]: {
          count: number;
          liked: boolean;
        };
      } = {};
      let userReactionsMap: {
        [key: string]: string[];
      } = {};
      if (postIds.length > 0) {
        // Fetch new reactions
        const {
          data: reactions
        } = await supabase.from('forum_reactions').select('post_id, user_id, emoji_code').in('post_id', postIds);
        if (reactions) {
          // Group reactions by post and emoji
          reactionsMap = reactions.reduce((acc, reaction) => {
            if (!acc[reaction.post_id]) {
              acc[reaction.post_id] = [];
            }
            const existingReaction = acc[reaction.post_id].find(r => r.emoji_code === reaction.emoji_code);
            if (existingReaction) {
              existingReaction.count++;
              existingReaction.users.push(reaction.user_id);
            } else {
              acc[reaction.post_id].push({
                emoji_code: reaction.emoji_code,
                count: 1,
                users: [reaction.user_id]
              });
            }
            return acc;
          }, {} as {
            [key: string]: Reaction[];
          });

          // Track user's reactions
          userReactionsMap = reactions.reduce((acc, reaction) => {
            if (user && reaction.user_id === user.id) {
              if (!acc[reaction.post_id]) {
                acc[reaction.post_id] = [];
              }
              acc[reaction.post_id].push(reaction.emoji_code);
            }
            return acc;
          }, {} as {
            [key: string]: string[];
          });
        }

        // Still fetch likes for backward compatibility
        const {
          data: likes
        } = await supabase.from('forum_likes').select('post_id, user_id').in('post_id', postIds);
        likesMap = likes?.reduce((acc, like) => {
          if (!acc[like.post_id]) {
            acc[like.post_id] = {
              count: 0,
              liked: false
            };
          }
          acc[like.post_id].count++;
          if (user && like.user_id === user.id) {
            acc[like.post_id].liked = true;
          }
          return acc;
        }, {} as {
          [key: string]: {
            count: number;
            liked: boolean;
          };
        }) || {};
      }

      // Transform data to match our Post interface
      const transformedPosts: Post[] = mergedPosts?.map(post => {
        const profile = profilesMap[post.author_id];
        const likeData = likesMap[post.id] || {
          count: 0,
          liked: false
        };
        const postReactions = reactionsMap[post.id] || [];
        const postUserReactions = userReactionsMap[post.id] || [];
        return {
          id: post.id,
          title: post.title,
          content: post.content,
          author: profile?.full_name || profile?.email?.split('@')[0] || 'Community Member',
          author_id: post.author_id,
          timestamp: new Date(post.created_at).toLocaleDateString(),
          likes: likeData.count,
          liked: likeData.liked,
          reactions: postReactions,
          userReactions: postUserReactions,
          comments: commentsMap[post.id] || [],
          images: post.images || [],
          category: post.category,
          moderation_status: post.moderation_status,
          flagged_content: post.flagged_content,
          avatar_url: profile?.avatar_url
        };
      }) || [];
      // Filter out posts from blocked users
      const filteredPosts = transformedPosts.filter(p => !blockedUserIds.includes(p.author_id));
      setPosts(filteredPosts);
    } catch (error) {
      console.error('Error fetching posts:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load forum posts."
      });
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  // Pull to refresh handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    if (containerRef.current && containerRef.current.scrollTop === 0) {
      touchStartY.current = e.touches[0].clientY;
      setIsPulling(true);
    }
  };
  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isPulling || !containerRef.current) return;
    const currentY = e.touches[0].clientY;
    const pullDistance = Math.max(0, currentY - touchStartY.current);

    // Limit pull distance to 120px
    const limitedDistance = Math.min(pullDistance, 120);
    setPullDistance(limitedDistance);

    // Prevent default scrolling when pulling down from top
    if (pullDistance > 0 && containerRef.current.scrollTop === 0) {
      e.preventDefault();
    }
  };
  const handleTouchEnd = () => {
    if (!isPulling) return;
    setIsPulling(false);

    // Trigger refresh if pulled down enough (60px threshold)
    if (pullDistance > 60) {
      setIsRefreshing(true);
      fetchPosts();
      toast({
        title: "Refreshing",
        description: "Loading latest posts..."
      });
    }
    setPullDistance(0);
  };
  const handleCreatePost = async () => {
    if (!newTitle.trim() || !newPost.trim()) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please enter both title and content for your post."
      });
      return;
    }
    if (!user) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please log in to create a post."
      });
      return;
    }
    setUploading(true);
    try {
      let imageUrls: string[] = [];

      // Upload images if any are selected
      if (selectedImages.length > 0) {
        imageUrls = await uploadImages(selectedImages);
      }

      // Check for profanity in title and content
      const titleFlags = checkForProfanity(newTitle);
      const contentFlags = checkForProfanity(newPost);
      const allFlags = [...titleFlags, ...contentFlags];

      // Determine moderation status
      const moderationStatus = allFlags.length > 0 ? 'pending' : 'approved';
      const {
        error
      } = await supabase.from('forum_posts').insert({
        title: newTitle,
        content: newPost,
        author_id: user.id,
        category: 'general',
        published: true,
        images: imageUrls.length > 0 ? imageUrls : null,
        moderation_status: moderationStatus,
        flagged_content: allFlags.length > 0 ? allFlags : null
      });
      if (error) {
        console.error('Error creating post:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to create post. Please try again."
        });
        return;
      }
      setNewPost("");
      setNewTitle("");
      setSelectedImages([]);
      if (moderationStatus === 'pending') {
        toast({
          title: "Post submitted for review",
          description: "Your post contains content that needs admin approval before being published.",
          variant: "default"
        });
      } else {
        toast({
          title: "Post created!",
          description: "Your post has been shared with the community."
        });
      }

      // Refresh posts
      fetchPosts();
    } catch (error) {
      console.error('Error creating post:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create post. Please try again."
      });
    } finally {
      setUploading(false);
    }
  };
  const handleReaction = async (postId: string, emojiCode: string) => {
    if (!user) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please log in to react to posts."
      });
      return;
    }
    try {
      const post = posts.find(p => p.id === postId);
      if (!post) return;
      const hasReacted = post.userReactions.includes(emojiCode);
      if (hasReacted) {
        // Remove reaction
        await supabase.from('forum_reactions').delete().eq('post_id', postId).eq('user_id', user.id).eq('emoji_code', emojiCode);
      } else {
        // Add reaction
        await supabase.from('forum_reactions').insert({
          post_id: postId,
          user_id: user.id,
          emoji_code: emojiCode
        });
      }

      // Real-time will update the UI automatically
    } catch (error) {
      console.error('Error toggling reaction:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update reaction. Please try again."
      });
    }
  };
  const handleLike = async (postId: string) => {
    // Use the heart emoji for likes
    await handleReaction(postId, '❤️');
  };
  const handleComment = async (postId: string) => {
    const commentText = commentTexts[postId];
    if (!commentText?.trim()) return;
    if (!user) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please log in to comment."
      });
      return;
    }
    try {
      // Insert the comment
      const {
        data: newComment,
        error: insertError
      } = await supabase.from('forum_comments').insert({
        post_id: postId,
        author_id: user.id,
        content: commentText
      }).select('*').single();
      if (insertError) throw insertError;

      // Fetch the author's profile data separately
      const {
        data: profile
      } = await supabase.from('public_profiles').select('full_name, avatar_url').eq('id', user.id).single();
      const formattedComment: Comment = {
        id: newComment.id,
        content: newComment.content,
        author: profile?.full_name || 'Anonymous',
        author_id: newComment.author_id,
        timestamp: "just now",
        avatar_url: profile?.avatar_url
      };
      setPosts(posts.map(post => post.id === postId ? {
        ...post,
        comments: [...post.comments, formattedComment]
      } : post));
      setCommentTexts({
        ...commentTexts,
        [postId]: ""
      });
      toast({
        title: "Comment added!",
        description: "Your comment has been posted."
      });
    } catch (error) {
      console.error('Error adding comment:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to add comment. Please try again."
      });
    }
  };
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    setSelectedImages(prev => [...prev, ...imageFiles].slice(0, 4)); // Max 4 images
  };
  const removeImage = (index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
  };
  const handleDeletePost = async (postId: string) => {
    const post = posts.find(p => p.id === postId);
    if (!user || !isAdmin && post?.author_id !== user.id) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "You don't have permission to delete this post."
      });
      return;
    }
    try {
      const {
        error
      } = await supabase.from('forum_posts').delete().eq('id', postId);
      if (error) throw error;

      // Remove the post from local state
      setPosts(posts.filter(post => post.id !== postId));
      toast({
        title: "Post deleted",
        description: "The post has been removed."
      });
    } catch (error) {
      console.error('Error deleting post:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete post. Please try again."
      });
    }
  };
  const handleApprovePost = async (postId: string) => {
    if (!isAdmin) return;
    try {
      const {
        error
      } = await supabase.from('forum_posts').update({
        moderation_status: 'approved',
        moderated_by: user?.id,
        moderated_at: new Date().toISOString()
      }).eq('id', postId);
      if (error) throw error;

      // Update local state
      setPosts(posts.map(post => post.id === postId ? {
        ...post,
        moderation_status: 'approved'
      } : post));
      toast({
        title: "Post approved",
        description: "The post is now visible to all users."
      });
    } catch (error) {
      console.error('Error approving post:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to approve post."
      });
    }
  };
  const handleRejectPost = async (postId: string) => {
    if (!isAdmin) return;
    try {
      const {
        error
      } = await supabase.from('forum_posts').update({
        moderation_status: 'rejected',
        moderated_by: user?.id,
        moderated_at: new Date().toISOString()
      }).eq('id', postId);
      if (error) throw error;

      // Update local state
      setPosts(posts.map(post => post.id === postId ? {
        ...post,
        moderation_status: 'rejected'
      } : post));
      toast({
        title: "Post rejected",
        description: "The post has been hidden from public view."
      });
    } catch (error) {
      console.error('Error rejecting post:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to reject post."
      });
    }
  };
  const handleEditPost = (post: Post) => {
    setEditingPostId(post.id);
    setEditTitle(post.title);
    setEditContent(post.content);
    setEditImages(post.images || []);
    setNewEditImages([]);
  };
  const handleCancelEdit = () => {
    setEditingPostId(null);
    setEditTitle("");
    setEditContent("");
    setEditImages([]);
    setNewEditImages([]);
  };
  const handleSaveEdit = async () => {
    if (!editTitle.trim() || !editContent.trim() || !editingPostId) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please enter both title and content."
      });
      return;
    }
    if (!user) return;
    setUploading(true);
    try {
      let allImageUrls = [...editImages];

      // Upload new images if any
      if (newEditImages.length > 0) {
        const newImageUrls = await uploadImages(newEditImages);
        allImageUrls = [...allImageUrls, ...newImageUrls];
      }

      // Check for profanity in edited content
      const titleFlags = checkForProfanity(editTitle);
      const contentFlags = checkForProfanity(editContent);
      const allFlags = [...titleFlags, ...contentFlags];

      // Determine moderation status for edited content
      const moderationStatus = allFlags.length > 0 ? 'pending' : 'approved';
      const {
        error
      } = await supabase.from('forum_posts').update({
        title: editTitle,
        content: editContent,
        images: allImageUrls.length > 0 ? allImageUrls : null,
        moderation_status: moderationStatus,
        flagged_content: allFlags.length > 0 ? allFlags : null,
        updated_at: new Date().toISOString()
      }).eq('id', editingPostId);
      if (error) throw error;

      // Update local state
      setPosts(posts.map(post => post.id === editingPostId ? {
        ...post,
        title: editTitle,
        content: editContent,
        images: allImageUrls,
        moderation_status: moderationStatus,
        flagged_content: allFlags
      } : post));
      handleCancelEdit();
      if (moderationStatus === 'pending') {
        toast({
          title: "Post updated and submitted for review",
          description: "Your edited post contains content that needs admin approval.",
          variant: "default"
        });
      } else {
        toast({
          title: "Post updated!",
          description: "Your changes have been saved."
        });
      }
    } catch (error) {
      console.error('Error updating post:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update post. Please try again."
      });
    } finally {
      setUploading(false);
    }
  };
  const handleEditImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    const totalImages = editImages.length + newEditImages.length;
    const availableSlots = 4 - totalImages;
    setNewEditImages(prev => [...prev, ...imageFiles].slice(0, availableSlots));
  };
  const removeEditImage = (index: number, isExisting: boolean) => {
    if (isExisting) {
      setEditImages(prev => prev.filter((_, i) => i !== index));
    } else {
      const adjustedIndex = index - editImages.length;
      setNewEditImages(prev => prev.filter((_, i) => i !== adjustedIndex));
    }
  };
  return <div ref={containerRef} className="min-h-screen bg-background pb-20 overflow-auto" onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd} style={{
    transform: `translateY(${pullDistance * 0.5}px)`,
    transition: isPulling ? 'none' : 'transform 0.3s ease-out'
  }}>
      {/* Pull to Refresh Indicator */}
      {(isPulling || isRefreshing) && <div className="fixed top-0 left-0 right-0 z-50 flex items-center justify-center py-4 bg-background/95 backdrop-blur-md border-b border-border/50" style={{
      transform: `translateY(${Math.max(-50, pullDistance - 100)}px)`,
      opacity: Math.min(1, pullDistance / 60)
    }}>
          <div className="flex items-center space-x-3">
            <RefreshCw className={`w-5 h-5 text-primary ${isRefreshing ? 'animate-spin' : ''}`} />
            <span className="text-sm font-medium text-foreground">
              {isRefreshing ? 'Refreshing...' : pullDistance > 60 ? 'Release to refresh' : 'Pull to refresh'}
            </span>
          </div>
        </div>}

      {/* Mobile-optimized header */}
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-md border-b border-border/50 px-4 py-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-foreground">Gemini Community
          </h1>
            <p className="text-xs text-muted-foreground">Share experiences & get advice</p>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant="secondary" className="text-xs px-2 py-1">
              {posts.length} posts
            </Badge>
          </div>
        </div>
      </div>

      <div className="container max-w-2xl mx-auto px-4 pt-6 space-y-6 bg-background">
        {/* Knowledge Base Banner */}
        <Card className="mb-4 bg-primary cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/knowledge-base')}>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-card rounded-full flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-bold text-white">Knowledge Base</h3>
                <p className="text-xs text-white/80">Expert farming tips & guides</p>
              </div>
              <Badge className="bg-card text-primary text-xs">
                Resources
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Enhanced Create Post Card */}
        <Card className="border-border/60 shadow-sm backdrop-blur-sm bg-card">
          <CardHeader className="pb-4">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <Avatar className="w-12 h-12 ring-2 ring-primary/20">
                  <AvatarImage src={currentUserAvatar || ''} alt="Your avatar" />
                  <AvatarFallback className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground font-semibold text-lg">
                    {user?.email?.charAt(0).toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-background"></div>
              </div>
              <div className="flex-1">
                <p className="font-semibold text-foreground text-sm">{user?.email?.split('@')[0] || "Anonymous"}</p>
                <p className="text-xs text-muted-foreground">What's growing in your mind?</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0 space-y-4">
            {/* Enhanced Title Input */}
            <div className="space-y-2">
              <Input placeholder="What's your topic? 🌱" value={newTitle} onChange={e => setNewTitle(e.target.value)} className="h-10 text-sm font-medium border-border/60 focus:border-primary/60 bg-background/80" />
            </div>
            
            {/* Enhanced Content Textarea */}
            <div className="space-y-2">
              <Textarea placeholder="Share your farming wisdom, ask questions, or connect with fellow farmers... 🚜" value={newPost} onChange={e => setNewPost(e.target.value)} className="min-h-[100px] resize-none border-border/60 focus:border-primary/60 bg-background/80 leading-relaxed text-sm" />
            </div>
            
            {/* Enhanced Image Preview */}
            {selectedImages.length > 0 && <div className="space-y-3">
                <div className="flex items-center text-sm text-muted-foreground">
                  <ImageIcon className="w-4 h-4 mr-2" />
                  {selectedImages.length} image{selectedImages.length > 1 ? 's' : ''} selected
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {selectedImages.map((file, index) => <div key={index} className="relative group overflow-hidden rounded-lg">
                      <img src={URL.createObjectURL(file)} alt={`Preview ${index + 1}`} className="w-full h-28 object-cover transition-transform duration-200 group-hover:scale-105" />
                      <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                      <Button variant="destructive" size="sm" className="absolute top-2 right-2 w-7 h-7 p-0 opacity-80 hover:opacity-100 transition-opacity" onClick={() => removeImage(index)} disabled={uploading}>
                        <X className="w-4 h-4" />
                      </Button>
                    </div>)}
                </div>
              </div>}
            
            {/* Enhanced Action Bar */}
            <div className="flex flex-col space-y-3 sm:flex-row sm:justify-between sm:items-center sm:space-y-0 pt-2">
              <div className="flex items-center justify-start gap-3">
                <input type="file" accept="image/*" multiple onChange={handleImageSelect} className="hidden" id="image-upload" disabled={uploading || selectedImages.length >= 4} />
                <label htmlFor="image-upload">
                  <Button variant="outline" size="sm" className="cursor-pointer h-9 px-3 bg-background/80 hover:bg-muted/80 transition-colors rounded-full" type="button" disabled={uploading || selectedImages.length >= 4} asChild>
                    <span className="flex items-center">
                      <ImageIcon className="w-4 h-4" />
                      {selectedImages.length > 0 && <span className="ml-2 text-xs">({selectedImages.length}/4)</span>}
                    </span>
                  </Button>
                </label>
                <Button onClick={handleCreatePost} disabled={!newTitle.trim() || !newPost.trim() || uploading} className="px-8 h-9 font-semibold bg-primary hover:bg-primary/90 transition-all duration-200 hover:scale-105 rounded-full w-full sm:w-auto">
                  {uploading ? <div className="flex items-center justify-center">
                      <div className="w-4 h-4 border-2 border-primary-foreground/20 border-t-primary-foreground rounded-full animate-spin mr-2" />
                      Posting...
                    </div> : "Share Post"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Enhanced Posts Feed */}
        {loading ? <div className="space-y-4">
            {[1, 2, 3].map(i => <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-muted rounded-full"></div>
                    <div className="space-y-2 flex-1">
                      <div className="h-4 bg-muted rounded w-1/3"></div>
                      <div className="h-3 bg-muted rounded w-1/4"></div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="h-4 bg-muted rounded w-3/4"></div>
                    <div className="h-20 bg-muted rounded"></div>
                    <div className="h-8 bg-muted rounded w-1/2"></div>
                  </div>
                </CardContent>
              </Card>)}
          </div> : posts.length === 0 ? <div className="text-center py-6">
              <div className="space-y-3">
                <div>
                  <h3 className="text-sm font-medium text-foreground">No posts yet</h3>
                  <p className="text-xs text-muted-foreground">Be the first to share!</p>
                </div>
                <Button size="sm" variant="outline" onClick={() => {
            const titleInput = document.querySelector('input[placeholder*="topic"]') as HTMLInputElement;
            titleInput?.focus();
          }} className="text-xs px-3 py-1">
                  Create First Post
                </Button>
              </div>
            </div> : <div className="space-y-6">
          {posts.map((post, index) => <Card key={post.id} className="border-border/60 shadow-sm bg-card/50 backdrop-blur-sm hover:shadow-md transition-shadow duration-200 animate-fade-in" style={{
          animationDelay: `${index * 0.1}s`
        }}>
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Avatar className="w-12 h-12 ring-2 ring-border/20">
                      <AvatarImage src={post.avatar_url || ''} alt={`${post.author}'s avatar`} />
                      <AvatarFallback className="bg-gradient-to-br from-secondary to-secondary/80 text-secondary-foreground font-semibold text-lg">
                        {post.author.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="font-semibold text-foreground text-sm">{post.author}</p>
                      <p className="text-xs text-muted-foreground">{post.timestamp}</p>
                      <div className="flex items-center gap-2 mt-2">
                        {/* Enhanced Moderation Status Indicators */}
                        {post.moderation_status === 'pending' && <>
                            <Badge variant="outline" className="text-xs px-2 py-1 text-amber-700 bg-amber-50 border-amber-200 dark:text-amber-400 dark:bg-amber-950/50 dark:border-amber-800">
                              <AlertTriangle className="w-3 h-3 mr-1" />
                              Under Review
                            </Badge>
                            <p className="text-[11px] text-muted-foreground mt-1">This post is hidden and only you can see it.</p>
                          </>}
                        {post.moderation_status === 'rejected' && isAdmin && <Badge variant="destructive" className="text-xs px-2 py-1">
                            <XCircle className="w-3 h-3 mr-1" />
                            Rejected
                          </Badge>}
                      </div>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-9 w-9 hover:bg-muted/80">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      {/* Admin Moderation Controls */}
                      {isAdmin && post.moderation_status === 'pending' && <>
                          <DropdownMenuItem onClick={() => handleApprovePost(post.id)} className="text-emerald-600 focus:text-emerald-600 dark:text-emerald-400">
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Approve Post
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleRejectPost(post.id)} className="text-red-600 focus:text-red-600 dark:text-red-400">
                            <XCircle className="w-4 h-4 mr-2" />
                            Reject Post
                          </DropdownMenuItem>
                        </>}
                      {isAdmin && post.moderation_status === 'rejected' && <DropdownMenuItem onClick={() => handleApprovePost(post.id)} className="text-emerald-600 focus:text-emerald-600 dark:text-emerald-400">
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Approve Post
                        </DropdownMenuItem>}
                      {(isAdmin || post.author_id === user?.id) && <>
                        <DropdownMenuItem onClick={() => handleEditPost(post)} className="text-blue-600 focus:text-blue-600 dark:text-blue-400">
                          <Edit3 className="w-4 h-4 mr-2" />
                          Edit Post
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDeletePost(post.id)} className="text-destructive focus:text-destructive">
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete Post
                        </DropdownMenuItem>
                      </>}
                      {/* Report & Block - visible to everyone except post author */}
                      {user && post.author_id !== user.id && <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => {
                          setReportTarget({ postId: post.id, type: "post" });
                          setReportModalOpen(true);
                        }}>
                          <Flag className="w-4 h-4 mr-2" />
                          Report Post
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => {
                          setBlockTarget({ userId: post.author_id, userName: post.author });
                          setBlockModalOpen(true);
                        }} className="text-destructive focus:text-destructive">
                          <ShieldBan className="w-4 h-4 mr-2" />
                          Block User
                        </DropdownMenuItem>
                      </>}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              
              <CardContent className="pt-0 space-y-4">
                {editingPostId === post.id ? (/* Edit Mode */
            <div className="space-y-4">
                    <Input value={editTitle} onChange={e => setEditTitle(e.target.value)} placeholder="Post title" className="font-semibold text-lg" />
                    <Textarea value={editContent} onChange={e => setEditContent(e.target.value)} placeholder="Post content" className="min-h-[100px] resize-none" />
                    
                    {/* Edit Images Preview */}
                    {(editImages.length > 0 || newEditImages.length > 0) && <div className="space-y-3">
                        <div className="flex items-center text-sm text-muted-foreground">
                          <ImageIcon className="w-4 h-4 mr-2" />
                          {editImages.length + newEditImages.length} image{editImages.length + newEditImages.length > 1 ? 's' : ''}
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          {editImages.map((imageUrl, index) => <div key={`existing-${index}`} className="relative group overflow-hidden rounded-lg">
                              <img src={imageUrl} alt={`Edit image ${index + 1}`} className="w-full h-28 object-cover" />
                              <Button variant="destructive" size="sm" className="absolute top-2 right-2 w-7 h-7 p-0 opacity-80 hover:opacity-100" onClick={() => removeEditImage(index, true)} disabled={uploading}>
                                <X className="w-4 h-4" />
                              </Button>
                            </div>)}
                          {newEditImages.map((file, index) => <div key={`new-${index}`} className="relative group overflow-hidden rounded-lg">
                              <img src={URL.createObjectURL(file)} alt={`New image ${index + 1}`} className="w-full h-28 object-cover" />
                              <Button variant="destructive" size="sm" className="absolute top-2 right-2 w-7 h-7 p-0 opacity-80 hover:opacity-100" onClick={() => removeEditImage(editImages.length + index, false)} disabled={uploading}>
                                <X className="w-4 h-4" />
                              </Button>
                            </div>)}
                        </div>
                      </div>}
                    
                    {/* Edit Actions */}
                    <div className="flex items-center justify-between pt-2">
                      <div className="flex items-center gap-2">
                        <input type="file" accept="image/*" multiple onChange={handleEditImageSelect} className="hidden" id={`edit-image-upload-${post.id}`} disabled={uploading || editImages.length + newEditImages.length >= 4} />
                        <label htmlFor={`edit-image-upload-${post.id}`}>
                          <Button variant="outline" size="sm" className="cursor-pointer" type="button" disabled={uploading || editImages.length + newEditImages.length >= 4} asChild>
                            <span className="flex items-center">
                              <ImageIcon className="w-4 h-4" />
                              {editImages.length + newEditImages.length > 0 && <span className="ml-2 text-xs">({editImages.length + newEditImages.length}/4)</span>}
                            </span>
                          </Button>
                        </label>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={handleCancelEdit} disabled={uploading}>
                          Cancel
                        </Button>
                        <Button size="sm" onClick={handleSaveEdit} disabled={!editTitle.trim() || !editContent.trim() || uploading}>
                          {uploading ? <div className="flex items-center">
                              <div className="w-4 h-4 border-2 border-primary-foreground/20 border-t-primary-foreground rounded-full animate-spin mr-2" />
                              Saving...
                            </div> : "Save Changes"}
                        </Button>
                      </div>
                    </div>
                  </div>) : (/* View Mode */
            <>
                    {/* Enhanced Post Title */}
                    {post.title && <h3 className="text-base font-semibold text-foreground leading-tight">{post.title}</h3>}
                    
                    {/* Enhanced Post Content */}
                    <p className="text-foreground/90 leading-relaxed text-sm">{post.content}</p>
                  </>)}
                
                {/* Enhanced Post Images */}
                {post.images && post.images.length > 0 && <div className={`grid gap-3 ${post.images.length === 1 ? 'grid-cols-1' : post.images.length === 2 ? 'grid-cols-2' : post.images.length === 3 ? 'grid-cols-2' : 'grid-cols-2'}`}>
                    {post.images.map((image, imgIndex) => <div key={imgIndex} className={`group relative overflow-hidden rounded-xl ${post.images!.length === 3 && imgIndex === 0 ? 'col-span-2' : ''}`}>
                        <img src={image} alt={`Post image ${imgIndex + 1}`} className="w-full h-48 object-cover cursor-pointer transition-transform duration-300 group-hover:scale-105" onClick={() => window.open(image, '_blank')} />
                        <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none" />
                      </div>)}
                  </div>}
                
                {/* Enhanced Reactions */}
                {post.reactions.length > 0 && <div className="flex items-center gap-2 flex-wrap">
                    {post.reactions.map(reaction => <Button key={reaction.emoji_code} variant="ghost" size="sm" className={`h-8 px-2 rounded-full transition-all duration-200 hover:scale-105 ${post.userReactions.includes(reaction.emoji_code) ? 'bg-primary/10 ring-1 ring-primary/20 text-primary' : 'hover:bg-muted/50'}`} onClick={() => handleReaction(post.id, reaction.emoji_code)}>
                        <span className="text-base mr-1">{reaction.emoji_code}</span>
                        <span className="text-xs">{reaction.count}</span>
                      </Button>)}
                  </div>}

                {/* Enhanced Post Actions */}
                <div className="flex items-center justify-between border-t border-border/40 pt-4">
                  <div className="flex items-center space-x-4">
                    <ReactionPicker onReactionSelect={emoji => handleReaction(post.id, emoji)} userReactions={post.userReactions} postId={post.id} reactionCount={post.reactions.find(r => r.emoji_code === '❤️')?.count || 0} hasReacted={post.userReactions.includes('❤️')} />
                    
                    <Button variant="ghost" size="sm" className="flex items-center space-x-2 h-8 px-2 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950/20 transition-all duration-200">
                      <MessageCircle className="w-4 h-4" />
                      <span className="text-sm">{post.comments.length}</span>
                    </Button>
                    
                    <ShareModal postId={post.id} postTitle={post.title} postContent={post.content} />
                  </div>
                </div>

                {/* Enhanced Comments Section */}
                {post.comments.length > 0 && <div className="space-y-4 border-t border-border/40 pt-4">
                    <h4 className="text-sm font-semibold text-muted-foreground mb-3">
                      Comments ({post.comments.length})
                    </h4>
                    {post.comments.map(comment => <div key={comment.id} className="flex space-x-3">
                        <Avatar className="w-9 h-9 ring-1 ring-border/20">
                          <AvatarImage src={comment.avatar_url || ''} alt={`${comment.author}'s avatar`} />
                          <AvatarFallback className="bg-gradient-to-br from-muted to-muted/80 text-muted-foreground text-sm font-semibold">
                            {comment.author.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="bg-muted/60 rounded-2xl px-4 py-3 backdrop-blur-sm">
                            <p className="text-xs font-semibold text-foreground mb-1">{comment.author}</p>
                            <p className="text-xs text-foreground/90 leading-relaxed">{comment.content}</p>
                          </div>
                          <p className="text-xs text-muted-foreground mt-2 ml-4">{comment.timestamp}</p>
                        </div>
                      </div>)}
                  </div>}

                {/* Typing Indicator */}
                <TypingIndicator postId={post.id} currentUserId={user?.id || ''} isAuthor={post.author_id === user?.id} />
                
                {/* Enhanced Add Comment */}
                <div className="flex items-center space-x-3 pt-3 border-t border-border/40">
                  <Avatar className="w-9 h-9 ring-2 ring-primary/20">
                    <AvatarImage src={currentUserAvatar || ''} alt="Your avatar" />
                    <AvatarFallback className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground text-sm font-semibold">
                      {user?.email?.charAt(0).toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 flex space-x-2">
                    <CommentInput postId={post.id} value={commentTexts[post.id] || ""} onChange={value => setCommentTexts({
                  ...commentTexts,
                  [post.id]: value
                })} onSubmit={() => handleComment(post.id)} disabled={!commentTexts[post.id]?.trim()} currentUserId={user?.id || ''} />
                  </div>
                </div>
              </CardContent>
            </Card>)}
        </div>}
        
        {/* Mobile-friendly spacing at bottom */}
        <div className="h-8"></div>
      </div>

      {/* EULA Modal */}
      <CommunityEulaModal open={showEula} onAccept={handleEulaAccept} />

      {/* Report Modal */}
      <ReportContentModal
        open={reportModalOpen}
        onOpenChange={setReportModalOpen}
        onSubmit={handleReportContent}
        type={reportTarget?.type || "post"}
      />

      {/* Block Modal */}
      {blockTarget && (
        <BlockUserModal
          open={blockModalOpen}
          onOpenChange={setBlockModalOpen}
          onConfirm={handleBlockUser}
          userName={blockTarget.userName}
        />
      )}
    </div>;
};
export default Forum;