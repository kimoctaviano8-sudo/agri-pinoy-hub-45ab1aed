import React, { useState, useEffect } from "react";
import { AlertTriangle, MapPin, TrendingUp, Clock, Users, X, Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface DiseaseReport {
  id: string;
  disease_type: string;
  severity_level: string;
  crop_type: string;
  location_name: string;
  distance_km: number;
  created_at: string;
  report_count: number;
}

interface OutbreakPrediction {
  id: string;
  disease_type: string;
  crop_type: string;
  region: string;
  risk_level: string;
  confidence_score: number;
  predicted_start_date: string;
  predicted_peak_date: string;
  prevention_tips: string[];
}

const CommunityAlerts = () => {
  const [nearbyReports, setNearbyReports] = useState<DiseaseReport[]>([]);
  const [predictions, setPredictions] = useState<OutbreakPrediction[]>([]);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [loading, setLoading] = useState(false);
  const [radius, setRadius] = useState(25); // km
  const { toast } = useToast();
  const { user } = useAuth();

  // Report form states
  const [reportForm, setReportForm] = useState({
    disease_type: '',
    severity_level: 'moderate',
    crop_type: '',
    location_name: '',
    description: '',
    anonymous: true
  });

  useEffect(() => {
    getUserLocation();
    fetchOutbreakPredictions();
  }, []);

  useEffect(() => {
    if (userLocation) {
      fetchNearbyReports();
    }
  }, [userLocation, radius]);

  const getUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          console.error('Error getting location:', error);
          // Use default location (Philippines center) if geolocation fails
          setUserLocation({ lat: 12.8797, lng: 121.7740 });
        }
      );
    } else {
      // Default to Philippines center
      setUserLocation({ lat: 12.8797, lng: 121.7740 });
    }
  };

  const fetchNearbyReports = async () => {
    if (!userLocation) return;

    try {
      const { data, error } = await supabase.rpc('get_nearby_disease_reports', {
        user_lat: userLocation.lat,
        user_lng: userLocation.lng,
        radius_km: radius
      });

      if (error) throw error;
      setNearbyReports(data || []);
    } catch (error) {
      console.error('Error fetching nearby reports:', error);
    }
  };

  const fetchOutbreakPredictions = async () => {
    try {
      const { data, error } = await supabase
        .from('outbreak_predictions')
        .select('*')
        .eq('active', true)
        .order('risk_level', { ascending: false })
        .limit(5);

      if (error) throw error;
      setPredictions(data || []);
    } catch (error) {
      console.error('Error fetching predictions:', error);
    }
  };

  const submitReport = async () => {
    if (!user || !userLocation) return;

    setLoading(true);
    try {
      const { error } = await supabase.from('disease_reports').insert({
        user_id: user.id,
        disease_type: reportForm.disease_type,
        severity_level: reportForm.severity_level,
        crop_type: reportForm.crop_type,
        location_latitude: userLocation.lat,
        location_longitude: userLocation.lng,
        location_name: reportForm.location_name,
        description: reportForm.description,
        anonymous: reportForm.anonymous
      });

      if (error) throw error;

      toast({
        title: "Report Submitted",
        description: "Thank you for contributing to community safety. Your report will be verified soon."
      });

      setShowReportDialog(false);
      setReportForm({
        disease_type: '',
        severity_level: 'moderate',
        crop_type: '',
        location_name: '',
        description: '',
        anonymous: true
      });

      // Refresh nearby reports
      fetchNearbyReports();
    } catch (error) {
      console.error('Error submitting report:', error);
      toast({
        title: "Submission Failed",
        description: "Failed to submit report. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'mild': return 'bg-yellow-500';
      case 'moderate': return 'bg-warning';
      case 'severe': return 'bg-destructive';
      default: return 'bg-muted-foreground';
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low': return 'bg-green-500';
      case 'medium': return 'bg-yellow-500';
      case 'high': return 'bg-warning';
      case 'critical': return 'bg-destructive';
      default: return 'bg-muted-foreground';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className="space-y-6">
      {/* Header with Report Button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-primary" />
          <h2 className="text-lg font-medium text-foreground">Community Alerts</h2>
        </div>
        <Dialog open={showReportDialog} onOpenChange={setShowReportDialog}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1 text-xs">
              <Plus className="w-3 h-3" />
              Report
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-lg">Report Plant Disease</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="disease_type" className="text-sm">Disease Type</Label>
                <Input
                  id="disease_type"
                  value={reportForm.disease_type}
                  onChange={(e) => setReportForm({ ...reportForm, disease_type: e.target.value })}
                  placeholder="e.g., Late Blight, Leaf Spot"
                />
              </div>
              
              <div>
                <Label htmlFor="crop_type" className="text-sm">Crop Type</Label>
                <Input
                  id="crop_type"
                  value={reportForm.crop_type}
                  onChange={(e) => setReportForm({ ...reportForm, crop_type: e.target.value })}
                  placeholder="e.g., Tomato, Rice, Corn"
                />
              </div>
              
              <div>
                <Label htmlFor="severity_level" className="text-sm">Severity Level</Label>
                <Select
                  value={reportForm.severity_level}
                  onValueChange={(value) => 
                    setReportForm({ ...reportForm, severity_level: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mild">Mild</SelectItem>
                    <SelectItem value="moderate">Moderate</SelectItem>
                    <SelectItem value="severe">Severe</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="location_name" className="text-sm">Location</Label>
                <Input
                  id="location_name"
                  value={reportForm.location_name}
                  onChange={(e) => setReportForm({ ...reportForm, location_name: e.target.value })}
                  placeholder="Barangay, City, Province"
                />
              </div>
              
              <div>
                <Label htmlFor="description" className="text-sm">Description (Optional)</Label>
                <Textarea
                  id="description"
                  value={reportForm.description}
                  onChange={(e) => setReportForm({ ...reportForm, description: e.target.value })}
                  placeholder="Additional details about the disease..."
                  rows={3}
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="anonymous"
                  checked={reportForm.anonymous}
                  onCheckedChange={(checked) => setReportForm({ ...reportForm, anonymous: checked })}
                />
                <Label htmlFor="anonymous" className="text-sm">Submit anonymously</Label>
              </div>
              
              <Button 
                onClick={submitReport} 
                disabled={loading || !reportForm.disease_type || !reportForm.crop_type}
                className="w-full text-sm"
              >
                {loading ? "Submitting..." : "Submit Report"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Nearby Disease Reports */}
      <Card>
        <CardHeader className="pb-3">
          <div className="space-y-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <MapPin className="w-4 h-4" />
              Nearby Disease Reports
            </CardTitle>
            <div className="flex items-center gap-2">
              <Label htmlFor="radius" className="text-xs">Radius:</Label>
              <Select
                value={radius.toString()}
                onValueChange={(value) => setRadius(parseInt(value))}
              >
                <SelectTrigger className="w-20 h-7 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5km</SelectItem>
                  <SelectItem value="25">25km</SelectItem>
                  <SelectItem value="50">50km</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-2">
          {nearbyReports.length === 0 ? (
            <p className="text-muted-foreground text-center py-3 text-sm">
              No disease reports found in your area. Great news!
            </p>
          ) : (
            <div className="space-y-2">
              {nearbyReports.slice(0, 5).map((report) => (
                <div key={report.id} className="p-2 border rounded-lg bg-muted/50">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={`${getSeverityColor(report.severity_level)} text-white text-xs`}>
                          {report.severity_level}
                        </Badge>
                        <span className="font-medium text-sm">{report.disease_type}</span>
                        <span className="text-xs text-muted-foreground">in {report.crop_type}</span>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {report.location_name} ({Math.round(report.distance_km)}km away)
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatDate(report.created_at)}
                        </div>
                      </div>
                    </div>
                    {report.report_count > 1 && (
                      <Badge variant="secondary" className="text-xs">
                        {report.report_count} reports
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Outbreak Predictions */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <TrendingUp className="w-4 h-4" />
            Seasonal Outbreak Predictions
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-2">
          {predictions.length === 0 ? (
            <p className="text-muted-foreground text-center py-3 text-sm">
              No active outbreak predictions at this time.
            </p>
          ) : (
            <div className="space-y-2">
              {predictions.map((prediction) => (
                <div key={prediction.id} className="p-3 border rounded-lg bg-muted/50">
                  <div className="flex items-start justify-between mb-2">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge className={`${getRiskColor(prediction.risk_level)} text-white text-xs`}>
                          {prediction.risk_level} risk
                        </Badge>
                        <span className="font-medium text-sm">{prediction.disease_type}</span>
                        <span className="text-xs text-muted-foreground">in {prediction.crop_type}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {prediction.region} • Confidence: {Math.round(prediction.confidence_score * 100)}%
                      </p>
                    </div>
                    <AlertTriangle className={`w-4 h-4 ${
                      prediction.risk_level === 'critical' ? 'text-red-500' :
                      prediction.risk_level === 'high' ? 'text-orange-500' :
                      prediction.risk_level === 'medium' ? 'text-yellow-500' :
                      'text-green-500'
                    }`} />
                  </div>
                  
                  {prediction.predicted_start_date && (
                    <div className="text-xs text-muted-foreground mb-2">
                      Expected: {formatDate(prediction.predicted_start_date)} - {formatDate(prediction.predicted_peak_date)}
                    </div>
                  )}
                  
                  {prediction.prevention_tips && prediction.prevention_tips.length > 0 && (
                    <div className="mt-2">
                      <p className="text-xs font-medium mb-1">Prevention Tips:</p>
                      <ul className="text-xs text-muted-foreground space-y-1">
                        {prediction.prevention_tips.map((tip, index) => (
                          <li key={index} className="flex items-start gap-1">
                            <span className="text-primary">•</span>
                            {tip}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CommunityAlerts;