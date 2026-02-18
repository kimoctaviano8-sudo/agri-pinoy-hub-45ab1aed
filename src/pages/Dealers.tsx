import { useState, useEffect } from "react";
import { MapPin, Phone, Clock, Search, Building2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface Dealer {
  id: string;
  name: string;
  address: string;
  city: string;
  province: string;
  region: string;
  phone: string;
  hours: string;
  latitude: number | null;
  longitude: number | null;
  active: boolean;
}

const Dealers = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRegion, setSelectedRegion] = useState("All Regions");
  const [dealers, setDealers] = useState<Dealer[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchDealers = async () => {
      const { data, error } = await supabase
        .from("dealers")
        .select("*")
        .eq("active", true)
        .order("name");

      if (error) {
        console.error("Error fetching dealers:", error);
      } else {
        setDealers(data || []);
      }
      setLoading(false);
    };
    fetchDealers();
  }, []);

  const regions = ["All Regions", ...Array.from(new Set(dealers.map((d) => d.region)))];

  const filteredDealers = dealers.filter((dealer) => {
    const matchesSearch =
      dealer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      dealer.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
      dealer.province.toLowerCase().includes(searchQuery.toLowerCase()) ||
      dealer.address.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesRegion = selectedRegion === "All Regions" || dealer.region === selectedRegion;

    return matchesSearch && matchesRegion;
  });

  const handleCall = (phone: string, name: string) => {
    window.location.href = `tel:${phone.replace(/\s/g, "")}`;
    toast({ title: "Calling...", description: `Initiating call to ${name}` });
  };

  const handleOpenMaps = (dealer: Dealer) => {
    if (dealer.latitude && dealer.longitude) {
      window.open(`https://www.google.com/maps/search/?api=1&query=${dealer.latitude},${dealer.longitude}`, "_blank");
    } else {
      const address = encodeURIComponent(`${dealer.address}, ${dealer.city}, ${dealer.province}`);
      window.open(`https://www.google.com/maps/search/?api=1&query=${address}`, "_blank");
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Hero Section */}
      <div className="relative h-48 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary to-primary/80"></div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center text-primary-foreground px-4">
            <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-3">
              <Building2 className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-lg font-bold mb-1">Registered Dealers</h1>
            <p className="text-[10px] text-white/90">Find authorized dealers near you</p>
          </div>
        </div>
      </div>

      <div className="px-4 py-4">
        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by city, province, or dealer name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-10 placeholder:text-xs"
          />
        </div>

        {/* Region Filter */}
        <div className="flex space-x-2 overflow-x-auto pb-3 scrollbar-hide mb-4">
          {regions.map((region) => (
            <Badge
              key={region}
              variant={selectedRegion === region ? "default" : "outline"}
              className="cursor-pointer transition-smooth hover:scale-105 whitespace-nowrap text-xs px-3 py-1 min-h-[28px] touch-manipulation"
              onClick={() => setSelectedRegion(region)}
            >
              {region}
            </Badge>
          ))}
        </div>

        {/* Results Count */}
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold text-foreground">Dealers ({filteredDealers.length})</h2>
        </div>

        {/* Dealers List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="space-y-3">
            {filteredDealers.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <Building2 className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground font-medium">No dealers found</p>
                  <p className="text-sm text-muted-foreground mt-1">Try adjusting your search or filter</p>
                </CardContent>
              </Card>
            ) : (
              filteredDealers.map((dealer) => (
                <Card key={dealer.id} className="overflow-hidden">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="font-semibold text-sm text-foreground mb-1">{dealer.name}</h3>
                        <Badge variant="secondary" className="text-xs">{dealer.region}</Badge>
                      </div>
                    </div>

                    <div className="space-y-1.5 text-xs">
                      <div className="flex items-start gap-2">
                        <MapPin className="w-3.5 h-3.5 text-muted-foreground mt-0.5 flex-shrink-0" />
                        <span className="text-muted-foreground">{dealer.address}, {dealer.city}, {dealer.province}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                        <span className="text-muted-foreground">{dealer.phone}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                        <span className="text-muted-foreground">{dealer.hours}</span>
                      </div>
                    </div>

                    <div className="flex gap-2 mt-4">
                      <Button size="sm" variant="outline" className="flex-1 text-xs" onClick={() => handleOpenMaps(dealer)}>
                        <MapPin className="w-3 h-3 mr-1" />
                        View on Map
                      </Button>
                      <Button size="sm" className="flex-1 text-xs" onClick={() => handleCall(dealer.phone, dealer.name)}>
                        <Phone className="w-3 h-3 mr-1" />
                        Call Now
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        )}

        {/* Info Card */}
        <Card className="mt-6 bg-muted/50">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                <Building2 className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-sm mb-1">Become a Dealer</h3>
                <p className="text-xs text-muted-foreground">
                  Interested in becoming an authorized Gemini dealer? Contact our main office for partnership opportunities.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dealers;
