import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Edit, Trash2, Eye, EyeOff, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { NewsImporter } from "@/components/NewsImporter";

interface NewsItem {
  id: string;
  title: string;
  content: string;
  category: string;
  published: boolean;
  created_at: string;
}

interface AdminNewsTabProps {
  news: NewsItem[];
  onTogglePublished: (id: string, published: boolean) => void;
  onDelete: (id: string) => void;
}

export const AdminNewsTab = ({ news, onTogglePublished, onDelete }: AdminNewsTabProps) => {
  const navigate = useNavigate();

  return (
    <div className="space-y-3">
      {/* News Importer */}
      <div className="mb-4">
        <NewsImporter />
      </div>
      
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">News Articles</h2>
        <Button size="sm" onClick={() => navigate('/admin/news/new')} className="h-8">
          <Plus className="w-4 h-4 mr-1" />
          Add
        </Button>
      </div>
      
      <div className="space-y-3">
        {news.map((item) => (
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
                    onClick={() => onTogglePublished(item.id, item.published)}
                  >
                    {item.published ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 w-7 p-0"
                    onClick={() => navigate(`/admin/news/${item.id}`)}
                  >
                    <Edit className="w-3 h-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    className="h-7 w-7 p-0"
                    onClick={() => onDelete(item.id)}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        ))}
        {news.length === 0 && (
          <div className="text-center py-8">
            <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
            <p className="text-muted-foreground">No news articles yet</p>
          </div>
        )}
      </div>
    </div>
  );
};