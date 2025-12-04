import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Settings, Plus, Trash2, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface Emoji {
  code: string;
  label: string;
}

interface EmojiSet {
  id: string;
  name: string;
  emojis: Emoji[];
  is_default: boolean;
}

export const EmojiCustomizationPanel = () => {
  const [emojiSets, setEmojiSets] = useState<EmojiSet[]>([]);
  const [newSetName, setNewSetName] = useState('');
  const [newEmojis, setNewEmojis] = useState<Emoji[]>([]);
  const [newEmojiCode, setNewEmojiCode] = useState('');
  const [newEmojiLabel, setNewEmojiLabel] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    fetchEmojiSets();
    checkAdminStatus();
  }, [user]);

  const checkAdminStatus = async () => {
    if (!user) return;
    try {
      const { data } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'admin')
        .single();
      setIsAdmin(!!data);
    } catch (error) {
      setIsAdmin(false);
    }
  };

  const fetchEmojiSets = async () => {
    try {
      const { data, error } = await supabase
        .from('custom_emoji_sets')
        .select('*')
        .order('is_default', { ascending: false });

      if (error) throw error;
      setEmojiSets(data?.map(set => ({
        ...set,
        emojis: (set.emojis as unknown) as Emoji[]
      })) || []);
    } catch (error) {
      console.error('Error fetching emoji sets:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load emoji sets."
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddEmoji = () => {
    if (!newEmojiCode.trim() || !newEmojiLabel.trim()) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please enter both emoji and label."
      });
      return;
    }

    setNewEmojis([...newEmojis, { code: newEmojiCode.trim(), label: newEmojiLabel.trim() }]);
    setNewEmojiCode('');
    setNewEmojiLabel('');
  };

  const handleRemoveEmoji = (index: number) => {
    setNewEmojis(newEmojis.filter((_, i) => i !== index));
  };

  const handleCreateSet = async () => {
    if (!newSetName.trim() || newEmojis.length === 0) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please enter a set name and add at least one emoji."
      });
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from('custom_emoji_sets')
        .insert({
          name: newSetName,
          emojis: newEmojis as any,
          created_by: user?.id
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Emoji set created successfully!"
      });

      setNewSetName('');
      setNewEmojis([]);
      fetchEmojiSets();
    } catch (error) {
      console.error('Error creating emoji set:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create emoji set."
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSetAsDefault = async (setId: string) => {
    try {
      // First, unset all other defaults
      await supabase
        .from('custom_emoji_sets')
        .update({ is_default: false })
        .neq('id', '00000000-0000-0000-0000-000000000000');

      // Then set the new default
      const { error } = await supabase
        .from('custom_emoji_sets')
        .update({ is_default: true })
        .eq('id', setId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Default emoji set updated!"
      });

      fetchEmojiSets();
    } catch (error) {
      console.error('Error setting default:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update default emoji set."
      });
    }
  };

  const handleDeleteSet = async (setId: string) => {
    try {
      const { error } = await supabase
        .from('custom_emoji_sets')
        .delete()
        .eq('id', setId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Emoji set deleted successfully!"
      });

      fetchEmojiSets();
    } catch (error) {
      console.error('Error deleting emoji set:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete emoji set."
      });
    }
  };

  if (!isAdmin && !user) {
    return null;
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Settings className="w-4 h-4 mr-2" />
          Customize Reactions
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Customize Reaction Emojis</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Existing Sets */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Current Emoji Sets</h3>
            {loading ? (
              <div className="flex justify-center py-4">
                <div className="w-6 h-6 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
              </div>
            ) : (
              <div className="space-y-3">
                {emojiSets.map((set) => (
                  <Card key={set.id}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base">
                          {set.name}
                          {set.is_default && (
                            <span className="ml-2 text-xs bg-primary text-primary-foreground px-2 py-1 rounded">
                              Default
                            </span>
                          )}
                        </CardTitle>
                        <div className="flex gap-2">
                          {!set.is_default && isAdmin && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleSetAsDefault(set.id)}
                            >
                              Set as Default
                            </Button>
                          )}
                          {!set.is_default && isAdmin && (
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleDeleteSet(set.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        {set.emojis.map((emoji, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center gap-1 bg-muted px-2 py-1 rounded text-sm"
                            title={emoji.label}
                          >
                            {emoji.code} {emoji.label}
                          </span>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Create New Set */}
          {isAdmin && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Create New Emoji Set</h3>
              <Card>
                <CardContent className="pt-6 space-y-4">
                  <div>
                    <Label htmlFor="setName">Set Name</Label>
                    <Input
                      id="setName"
                      value={newSetName}
                      onChange={(e) => setNewSetName(e.target.value)}
                      placeholder="Enter set name"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Add Emojis</Label>
                    <div className="flex gap-2">
                      <Input
                        value={newEmojiCode}
                        onChange={(e) => setNewEmojiCode(e.target.value)}
                        placeholder="🌱"
                        className="w-20"
                      />
                      <Input
                        value={newEmojiLabel}
                        onChange={(e) => setNewEmojiLabel(e.target.value)}
                        placeholder="plant"
                        className="flex-1"
                      />
                      <Button onClick={handleAddEmoji} size="icon" variant="outline">
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {newEmojis.length > 0 && (
                    <div className="space-y-2">
                      <Label>Preview</Label>
                      <div className="flex flex-wrap gap-2">
                        {newEmojis.map((emoji, index) => (
                          <div
                            key={index}
                            className="inline-flex items-center gap-1 bg-muted px-2 py-1 rounded text-sm"
                          >
                            {emoji.code} {emoji.label}
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-4 w-4 p-0 ml-1"
                              onClick={() => handleRemoveEmoji(index)}
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <Button
                    onClick={handleCreateSet}
                    disabled={saving || !newSetName.trim() || newEmojis.length === 0}
                    className="w-full"
                  >
                    {saving ? (
                      <>
                        <div className="w-4 h-4 border-2 border-primary-foreground/20 border-t-primary-foreground rounded-full animate-spin mr-2" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Create Emoji Set
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
