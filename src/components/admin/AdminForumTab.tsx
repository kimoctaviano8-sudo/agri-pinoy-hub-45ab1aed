import { useNavigate } from "react-router-dom";
import { Plus, Edit, Trash2, MessageSquare, Shield, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface ForumPost {
  id: string;
  title: string;
  content: string;
  category: string;
  published: boolean;
  created_at: string;
}

interface ProfanityWord {
  id: string;
  word: string;
  severity: string;
  created_at: string;
}

interface AdminForumTabProps {
  forumPosts: ForumPost[];
  profanityWords: ProfanityWord[];
  onDeletePost: (id: string) => void;
  onAddProfanityWord: () => void;
  onDeleteProfanityWord: (id: string, word: string) => void;
  newProfanityWord: string;
  setNewProfanityWord: (word: string) => void;
  newWordSeverity: string;
  setNewWordSeverity: (severity: string) => void;
}

export const AdminForumTab = ({ 
  forumPosts, 
  profanityWords, 
  onDeletePost, 
  onAddProfanityWord,
  onDeleteProfanityWord,
  newProfanityWord,
  setNewProfanityWord,
  newWordSeverity,
  setNewWordSeverity
}: AdminForumTabProps) => {
  const navigate = useNavigate();

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Forum Posts</h2>
        <Button size="sm" onClick={() => navigate('/admin/forum/new')} className="h-8">
          <Plus className="w-4 h-4 mr-1" />
          Add
        </Button>
      </div>
      
      <div className="space-y-3">
        {forumPosts.map((item) => (
          <Card key={item.id} className="p-3">
            <div className="space-y-2">
              <div className="flex justify-between items-start">
                <div className="flex-1 min-w-0 pr-2">
                  <h3 className="font-medium text-sm leading-tight truncate">{item.title}</h3>
                  <p className="text-xs text-muted-foreground mt-1">{item.category}</p>
                </div>
                <Badge variant={item.published ? "default" : "secondary"} className="text-xs">
                  {item.published ? "Live" : "Draft"}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground">
                  {new Date(item.created_at).toLocaleDateString()}
                </span>
                <div className="flex space-x-1">
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 w-7 p-0"
                    onClick={() => navigate(`/admin/forum/${item.id}`)}
                  >
                    <Edit className="w-3 h-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    className="h-7 w-7 p-0"
                    onClick={() => onDeletePost(item.id)}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        ))}
        {forumPosts.length === 0 && (
          <div className="text-center py-8">
            <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
            <p className="text-muted-foreground">No forum posts yet</p>
          </div>
        )}
      </div>
      
      {/* Profanity Filter Management */}
      <div className="space-y-3 mt-6">
        <div className="flex justify-between items-center">
          <h3 className="text-base font-semibold flex items-center">
            <Shield className="w-4 h-4 mr-2" />
            Profanity Filter
          </h3>
          <span className="text-xs text-muted-foreground">
            {profanityWords.length} words
          </span>
        </div>
        
        {/* Add New Profanity Word */}
        <Card className="p-3">
          <div className="space-y-3">
            <h4 className="text-sm font-medium">Add Filter Word</h4>
            <div className="space-y-2">
              <Input
                placeholder="Enter word to filter..."
                value={newProfanityWord}
                onChange={(e) => setNewProfanityWord(e.target.value)}
                className="text-sm"
              />
              <div className="flex space-x-2">
                <Select value={newWordSeverity} onValueChange={setNewWordSeverity}>
                  <SelectTrigger className="flex-1 h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
                <Button 
                  size="sm" 
                  onClick={onAddProfanityWord}
                  disabled={!newProfanityWord.trim()}
                  className="h-8 px-3 text-xs"
                >
                  <Plus className="w-3 h-3 mr-1" />
                  Add
                </Button>
              </div>
            </div>
          </div>
        </Card>
        
        {/* Profanity Words List */}
        <div className="space-y-2">
          {profanityWords.map((word) => (
            <Card key={word.id} className="p-3">
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium">{word.word}</span>
                  <Badge 
                    variant={
                      word.severity === 'high' ? 'destructive' : 
                      word.severity === 'medium' ? 'default' : 
                      'secondary'
                    } 
                    className="text-xs"
                  >
                    {word.severity === 'high' && <AlertTriangle className="w-3 h-3 mr-1" />}
                    {word.severity}
                  </Badge>
                </div>
                <div className="flex items-center space-x-1">
                  <span className="text-xs text-muted-foreground">
                    {new Date(word.created_at).toLocaleDateString()}
                  </span>
                  <Button
                    size="sm"
                    variant="destructive"
                    className="h-6 w-6 p-0"
                    onClick={() => onDeleteProfanityWord(word.id, word.word)}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
          {profanityWords.length === 0 && (
            <div className="text-center py-6">
              <Shield className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No filter words configured</p>
              <p className="text-xs text-muted-foreground mt-1">Add words to automatically filter forum posts</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};