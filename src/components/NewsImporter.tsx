import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { NewsScraperService } from '@/services/NewsScraperService';
import { Download, Loader2, RefreshCw, Globe, CheckCircle, XCircle, Clock } from 'lucide-react';

export const NewsImporter = () => {
  const [isImporting, setIsImporting] = useState(false);
  const [lastImport, setLastImport] = useState<{
    success: boolean;
    count: number;
    timestamp: string;
    error?: string;
  } | null>(null);
  
  const { toast } = useToast();

  const handleImportNews = async () => {
    setIsImporting(true);
    
    try {
      const result = await NewsScraperService.importFromScrapedContent();
      
      setLastImport({
        ...result,
        timestamp: new Date().toLocaleString()
      });
      
      if (result.success) {
        toast({
          title: "News Import Successful",
          description: `Successfully imported ${result.count} news articles from Gemini Agri website`,
          duration: 5000,
        });
      } else {
        toast({
          title: "Import Failed",
          description: result.error || "Failed to import news articles",
          variant: "destructive",
          duration: 5000,
        });
      }
    } catch (error) {
      console.error('Error importing news:', error);
      toast({
        title: "Import Error",
        description: "An unexpected error occurred while importing news",
        variant: "destructive",
        duration: 5000,
      });
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <Card className="w-full shadow-md border hover:shadow-lg transition-all duration-200">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <div className="p-1.5 bg-primary/15 rounded-md">
            <Download className="w-4 h-4 text-primary" />
          </div>
          Gemini Agri News Importer
        </CardTitle>
        <p className="text-sm text-muted-foreground leading-snug">
          Import latest Gemini Agri news articles automatically
        </p>
      </CardHeader>
      
      <CardContent className="space-y-3">
        {/* Import Button */}
        <Button 
          onClick={handleImportNews}
          disabled={isImporting}
          className="w-full h-10 text-sm font-medium transition-all duration-200"
        >
          {isImporting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Importing...
            </>
          ) : (
            <>
              <RefreshCw className="w-4 h-4 mr-2" />
              Import Latest News
            </>
          )}
        </Button>
        
        {/* Source Badge */}
        <div className="flex justify-center">
          <Badge variant="outline" className="text-xs px-2 py-1">
            <Globe className="w-3 h-3 mr-1" />
            geminiagri.com/blog-standard/
          </Badge>
        </div>
        
        {/* Last Import Status */}
        {lastImport && (
          <div className={`p-3 rounded-lg border transition-all duration-300 ${
            lastImport.success 
              ? 'bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-800' 
              : 'bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-800'
          }`}>
            <div className="flex items-start gap-2">
              <div className="flex-shrink-0 mt-0.5">
                {lastImport.success ? (
                  <CheckCircle className="w-4 h-4 text-green-600" />
                ) : (
                  <XCircle className="w-4 h-4 text-red-600" />
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1 mb-1">
                  <span className="text-sm font-medium">
                    {lastImport.success ? 'Success' : 'Failed'}
                  </span>
                  <Badge variant={lastImport.success ? "default" : "destructive"} className="text-xs px-1.5 py-0.5">
                    {lastImport.count} articles
                  </Badge>
                </div>
                
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="w-3 h-3" />
                  <span className="truncate">{lastImport.timestamp}</span>
                </div>
                
                {!lastImport.success && lastImport.error && (
                  <p className="text-xs text-red-600 mt-1 line-clamp-2">
                    {lastImport.error}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
        
        {/* Compact Info */}
        <div className="bg-muted/20 rounded-md p-2 border">
          <div className="text-xs text-muted-foreground space-y-0.5">
            <p>✓ Checks for duplicates</p>
            <p>✓ Preserves original dates</p>
            <p>✓ Imports new articles only</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};