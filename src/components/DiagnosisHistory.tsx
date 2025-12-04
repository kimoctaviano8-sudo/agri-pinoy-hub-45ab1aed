import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Calendar, AlertTriangle, CheckCircle, Eye, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface ScanHistory {
  id: string;
  image_url: string | null;
  disease_detected: string | null;
  confidence_score: number | null;
  recommendations: string | null;
  scan_date: string;
}

interface DiagnosisHistoryProps {
  onViewResult?: (result: ScanHistory) => void;
}

export function DiagnosisHistory({ onViewResult }: DiagnosisHistoryProps) {
  const [scanHistory, setScanHistory] = useState<ScanHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedScan, setSelectedScan] = useState<ScanHistory | null>(null);
  const { user } = useAuth();
  const [clearAllOpen, setClearAllOpen] = useState(false);
  useEffect(() => {
    if (user) {
      fetchScanHistory();
    }
  }, [user]);

  const fetchScanHistory = async () => {
    try {
      const { data, error } = await supabase
        .from('plant_scan_history')
        .select('*')
        .order('scan_date', { ascending: false })
        .limit(10);

      if (error) throw error;
      setScanHistory(data || []);
    } catch (error) {
      console.error('Error fetching scan history:', error);
      toast.error('Failed to load scan history');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM dd, yyyy');
    } catch {
      return 'Invalid date';
    }
  };

  const getStatusIcon = (diseaseDetected: string | null) => {
    if (!diseaseDetected || diseaseDetected.toLowerCase() === 'healthy') {
      return <CheckCircle className="w-4 h-4 text-green-500" />;
    }
    return <AlertTriangle className="w-4 h-4 text-red-500" />;
  };

  const getStatusBadge = (diseaseDetected: string | null) => {
    if (!diseaseDetected || diseaseDetected.toLowerCase() === 'healthy') {
      return <Badge variant="outline" className="text-green-600 border-green-200">Healthy</Badge>;
    }
    return <Badge variant="destructive" className="bg-red-50 text-red-600 border-red-200 whitespace-nowrap">Disease Detected</Badge>;
  };

  const deleteScanHistory = async (scanId: string) => {
    try {
      const { error } = await supabase
        .from('plant_scan_history')
        .delete()
        .eq('id', scanId);

      if (error) throw error;
      
      setScanHistory(prev => prev.filter(scan => scan.id !== scanId));
      toast.success('Scan history deleted');
    } catch (error) {
      console.error('Error deleting scan history:', error);
      toast.error('Failed to delete scan history');
    }
  };

  const clearAllHistory = async () => {
    try {
      if (!user) return;
      const { error } = await supabase
        .from('plant_scan_history')
        .delete()
        .eq('user_id', user.id);

      if (error) throw error;

      setScanHistory([]);
      toast.success('All scan history cleared');
    } catch (error) {
      console.error('Error clearing all scan history:', error);
      toast.error('Failed to clear scan history');
    } finally {
      setClearAllOpen(false);
    }
  };

  if (loading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Diagnosis History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (scanHistory.length === 0) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Diagnosis History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <AlertTriangle className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No scan history available</p>
            <p className="text-sm">Start scanning plants to see your diagnosis history</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          Diagnosis History
        </CardTitle>
        <Button
          variant="destructive"
          size="sm"
          onClick={() => setClearAllOpen(true)}
        >
          <Trash2 className="w-4 h-4 mr-1" />
          Clear All
        </Button>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px]">
          <div className="space-y-3">
            {scanHistory.map((scan) => (
              <div
                key={scan.id}
                className="border rounded-lg p-4 hover:bg-gray-50 transition-colors cursor-pointer"
                onClick={() => setSelectedScan(scan)}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    {getStatusIcon(scan.disease_detected)}
                    <div className="flex-1 min-w-0">
                      <div className="mb-1">
                        <span className="font-medium text-sm block mb-1">
                          {scan.disease_detected || 'Healthy Plant'}
                        </span>
                        {getStatusBadge(scan.disease_detected)}
                      </div>
                      <p className="text-xs text-gray-500 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatDate(scan.scan_date)}
                      </p>
                      {scan.confidence_score && (
                        <p className="text-xs text-gray-600 mt-1">
                          Confidence: {Math.round(scan.confidence_score * 100)}%
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteScanHistory(scan.id);
                      }}
                      className="shrink-0 text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        <Dialog open={!!selectedScan} onOpenChange={() => setSelectedScan(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Scan Result Details</DialogTitle>
            </DialogHeader>
            {selectedScan && (
              <div className="space-y-4">
                {selectedScan.image_url && (
                  <img 
                    src={selectedScan.image_url} 
                    alt="Scanned plant" 
                    className="w-full h-48 object-cover rounded-lg"
                  />
                )}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(selectedScan.disease_detected)}
                    <span className="font-medium">
                      {selectedScan.disease_detected || 'Healthy Plant'}
                    </span>
                    {getStatusBadge(selectedScan.disease_detected)}
                  </div>
                  <p className="text-sm text-gray-500 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {formatDate(selectedScan.scan_date)}
                  </p>
                  {selectedScan.confidence_score && (
                    <p className="text-sm text-gray-600">
                      Confidence: {Math.round(selectedScan.confidence_score * 100)}%
                    </p>
                  )}
                  {selectedScan.recommendations && (
                    <div className="mt-3">
                      <h4 className="font-medium text-sm mb-2">Recommendations:</h4>
                      <p className="text-sm text-gray-700 leading-relaxed">
                        {selectedScan.recommendations}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        <AlertDialog open={clearAllOpen} onOpenChange={setClearAllOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Clear all diagnosis history?</AlertDialogTitle>
              <AlertDialogDescription>
                This action will permanently delete all your plant scan records. This cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={clearAllHistory} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Clear All
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
}