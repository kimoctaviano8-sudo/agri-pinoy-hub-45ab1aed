import { Clock, Eye, User } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface NewsCardProps {
  id: string;
  title: string;
  excerpt: string;
  category: string;
  author: string;
  publishedAt: string;
  readTime: string;
  views: number;
  image?: string;
  featured?: boolean;
}

const NewsCard = ({
  id,
  title,
  excerpt,
  category,
  author,
  publishedAt,
  readTime,
  views,
  image,
  featured = false,
}: NewsCardProps) => {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/news/${id}`);
  };
  return (
    <Card className="group cursor-pointer transition-smooth hover:scale-[1.02] active:scale-[0.98] touch-manipulation" onClick={handleClick}>
      <CardContent className="p-0">{/* Mobile-optimized layout */}
        {image && (
          <div className="relative overflow-hidden rounded-t-lg">
            <img
              src={image}
              alt={title}
              className="w-full h-32 object-cover transition-smooth group-hover:scale-105 rounded-t-lg"
              onError={(e) => {
                // Hide image container on load failure
                const img = e.currentTarget;
                if (img.src && img.src.includes('geminiagri.com')) {
                  const parent = img.parentElement;
                  if (parent) {
                    parent.style.display = 'none';
                  }
                }
              }}
            />
            <div className="absolute top-2 left-2 z-10">
              <Badge 
                variant="secondary" 
                className="bg-primary text-primary-foreground shadow-sm text-xs px-2 py-1"
              >
                {category}
              </Badge>
            </div>
          </div>
        )}
        {!image && (
          <div className="w-full h-32 bg-muted flex items-center justify-center rounded-t-lg">
            <p className="text-muted-foreground text-xs">No image available</p>
          </div>
        )}
        <div className="p-3 space-y-2">
          <h3 className="font-semibold text-sm line-clamp-2 group-hover:text-primary transition-smooth leading-tight">
            {title}
          </h3>
          
          <p className="text-muted-foreground text-xs line-clamp-2 leading-relaxed">
            {excerpt}
          </p>
          
          <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
            <div className="flex items-center space-x-2">
              <span className="flex items-center">
                <Clock className="w-3 h-3 mr-1" />
                {readTime}
              </span>
              <span className="flex items-center">
                <Eye className="w-3 h-3 mr-1" />
                {views > 1000 ? `${(views/1000).toFixed(1)}k` : views}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default NewsCard;