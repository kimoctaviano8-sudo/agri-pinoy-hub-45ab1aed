import { useState } from "react";
import { MessageCircle, Phone, PhoneCall, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

interface TechnicianContactDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const TechnicianContactDialog = ({ open, onOpenChange }: TechnicianContactDialogProps) => {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [showContactList, setShowContactList] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleContactOption = (option: string) => {
    setSelectedOption(option);
    
    if (option === "chat") {
      // Navigate to inbox for chat
      setTimeout(() => {
        onOpenChange(false);
        setSelectedOption(null);
        navigate("/inbox");
      }, 500);
      return;
    }
    
    if (option === "call") {
      // Show contact list modal
      setTimeout(() => {
        setSelectedOption(null);
        setShowContactList(true);
      }, 500);
      return;
    }
    
    // Handle callback option
    setTimeout(() => {
      toast({
        title: "Contact Request Sent",
        description: "Callback request submitted. A technician will contact you within 2-4 hours.",
      });
      
      onOpenChange(false);
      setSelectedOption(null);
    }, 1000);
  };

  const handleCallTechnician = (phoneNumber: string, name: string) => {
    window.location.href = `tel:${phoneNumber}`;
    toast({
      title: "Calling...",
      description: `Initiating call to ${name}`,
    });
  };

  const contacts = [
    { name: "Relan Rivas", phone: "0999 885 2599", region: "Region IV-A" },
    { name: "Preach Tibayan", phone: "0998 985 3740", region: "Region IV-A" },
    { name: "Conrado Vasquez", phone: "0998 954 5137", region: "Region V" },
    { name: "Rey Mark Uno", phone: "0930 089 4709", region: "Region V" },
  ];

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-sm mx-auto sm:max-w-md px-4 py-0 top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
          <DialogHeader className="p-4 pb-2">
            <DialogTitle className="text-center text-base sm:text-lg font-semibold text-foreground">
              Need Expert Assistance?
            </DialogTitle>
          </DialogHeader>
          
          <div className="px-4 pb-4 space-y-3">
            <p className="text-center text-xs sm:text-sm text-gray-600 mb-4">
              Get personalized advice from our agricultural field technicians about your plant diagnosis.
            </p>
            
            <div className="space-y-2">
              {/* Chat Option */}
              <Card className="transition-all duration-200 hover:shadow-md cursor-pointer">
                <CardContent className="p-3">
                  <Button
                    variant="ghost"
                    className="w-full h-auto p-0 justify-start hover:bg-transparent"
                    onClick={() => handleContactOption("chat")}
                    disabled={selectedOption === "chat"}
                  >
                    <div className="flex items-center gap-3 w-full">
                      <div className="p-2 rounded-full">
                        <MessageCircle className="w-5 h-5 text-green-600" />
                      </div>
                      <div className="text-left flex-1">
                        <h3 className="text-sm font-medium text-gray-900">Start Chat</h3>
                        <p className="text-xs text-gray-500">Instant messaging with a technician</p>
                      </div>
                      {selectedOption === "chat" && (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600"></div>
                      )}
                    </div>
                  </Button>
                </CardContent>
              </Card>

              {/* Call Option */}
              <Card className="transition-all duration-200 hover:shadow-md cursor-pointer">
                <CardContent className="p-3">
                  <Button
                    variant="ghost"
                    className="w-full h-auto p-0 justify-start hover:bg-transparent"
                    onClick={() => handleContactOption("call")}
                    disabled={selectedOption === "call"}
                  >
                    <div className="flex items-center gap-3 w-full">
                      <div className="p-2 bg-blue-100 rounded-full">
                        <Phone className="w-5 h-5 text-blue-600" />
                      </div>
                      <div className="text-left flex-1">
                        <h3 className="text-sm font-medium text-gray-900">Call Now</h3>
                        <p className="text-xs text-gray-500">Direct phone consultation</p>
                      </div>
                      {selectedOption === "call" && (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                      )}
                    </div>
                  </Button>
                </CardContent>
              </Card>

            </div>
            
            <div className="pt-3 border-t">
              <Button
                variant="outline"
                className="w-full text-sm"
                onClick={() => onOpenChange(false)}
              >
                Maybe Later
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Contact List Modal */}
      <Dialog open={showContactList} onOpenChange={setShowContactList}>
        <DialogContent className="max-w-sm mx-auto sm:max-w-md px-4 py-0 top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
          <DialogHeader className="p-4 pb-2">
            <DialogTitle className="text-center text-base sm:text-lg font-semibold text-gray-900">
              Field Technicians Directory
            </DialogTitle>
          </DialogHeader>
          
          <div className="px-4 pb-4 space-y-3">
            <p className="text-center text-xs sm:text-sm text-gray-600 mb-4">
              Choose a field technician from your region to call directly.
            </p>
            
            <div className="space-y-3">
              {contacts.map((contact, index) => (
                <Card key={index} className="transition-all duration-200 hover:shadow-md">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-lg">📞</span>
                          <h3 className="text-sm font-semibold text-gray-900">{contact.name}</h3>
                        </div>
                        <p className="text-sm text-gray-700 font-medium">{contact.phone}</p>
                        <p className="text-xs text-gray-500">{contact.region}</p>
                      </div>
                      <Button
                        size="sm"
                        className="ml-3 bg-blue-600 hover:bg-blue-700 text-white"
                        onClick={() => handleCallTechnician(contact.phone.replace(/\s/g, ''), contact.name)}
                      >
                        <Phone className="w-4 h-4 mr-1" />
                        Call
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            
            <div className="pt-3 border-t">
              <Button
                variant="outline"
                className="w-full text-sm"
                onClick={() => setShowContactList(false)}
              >
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};