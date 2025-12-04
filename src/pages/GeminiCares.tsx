import { useState, useRef, useEffect } from 'react';
import { Send, Paperclip, Smile, ChevronLeft, MoreVertical, Phone, Video, Image, Camera } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

interface Message {
  id: string;
  content: string;
  type: 'text' | 'image' | 'file';
  sender: 'user' | 'agent';
  timestamp: Date;
  status?: 'sending' | 'sent' | 'delivered' | 'read';
}

interface SupportAgent {
  id: string;
  name: string;
  avatar: string;
  status: 'online' | 'busy' | 'offline';
  speciality: string;
}

const GeminiCares = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isConnected, setIsConnected] = useState(true);
  const [agent] = useState<SupportAgent>({
    id: '1',
    name: 'Maria Santos',
    avatar: '',
    status: 'online',
    speciality: 'Agricultural Expert'
  });
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Initial welcome message
  useEffect(() => {
    const welcomeMessage: Message = {
      id: '1',
      content: 'Hello! I\'m Maria from Gemini Cares. How can I help you today? Whether you have questions about our products, need technical support, or want agricultural advice, I\'m here to assist you! 🌱',
      type: 'text',
      sender: 'agent',
      timestamp: new Date(),
      status: 'delivered'
    };
    setMessages([welcomeMessage]);
  }, []);

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: newMessage,
      type: 'text',
      sender: 'user',
      timestamp: new Date(),
      status: 'sending'
    };

    setMessages(prev => [...prev, userMessage]);
    setNewMessage('');

    // Simulate message sent
    setTimeout(() => {
      setMessages(prev => 
        prev.map(msg => 
          msg.id === userMessage.id 
            ? { ...msg, status: 'delivered' }
            : msg
        )
      );
    }, 500);

    // Simulate agent typing and response
    setTimeout(() => {
      setIsTyping(true);
    }, 1000);

    setTimeout(() => {
      setIsTyping(false);
      const agentResponse: Message = {
        id: (Date.now() + 1).toString(),
        content: getAgentResponse(newMessage),
        type: 'text',
        sender: 'agent',
        timestamp: new Date(),
        status: 'delivered'
      };
      setMessages(prev => [...prev, agentResponse]);
    }, 2500);
  };

  const getAgentResponse = (userMessage: string): string => {
    const message = userMessage.toLowerCase();
    
    if (message.includes('order') || message.includes('purchase')) {
      return 'I\'d be happy to help you with your order! Could you please provide your order number? You can find it in your "My Purchases" section or in your confirmation email.';
    } else if (message.includes('plant') || message.includes('disease') || message.includes('scan')) {
      return 'For plant-related questions, I recommend using our Plant Scanner feature. Take a clear photo of the affected area, and our AI will provide detailed diagnosis and treatment recommendations. Would you like me to guide you through using the scanner?';
    } else if (message.includes('payment') || message.includes('refund')) {
      return 'I can help you with payment and refund inquiries. We support various payment methods including GCash, PayMaya, and credit cards. What specific payment issue are you experiencing?';
    } else if (message.includes('account') || message.includes('profile')) {
      return 'I can assist you with account-related questions. You can update your profile information by going to your Profile page and clicking "Edit Profile". Is there something specific you\'d like to change?';
    } else {
      return 'Thank you for reaching out! I\'m here to help with any questions about Gemini Agriculture. Could you please provide more details about what you need assistance with?';
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please select a file smaller than 10MB.",
        variant: "destructive"
      });
      return;
    }

    const fileMessage: Message = {
      id: Date.now().toString(),
      content: file.name,
      type: file.type.startsWith('image/') ? 'image' : 'file',
      sender: 'user',
      timestamp: new Date(),
      status: 'sending'
    };

    setMessages(prev => [...prev, fileMessage]);

    // Simulate upload
    setTimeout(() => {
      setMessages(prev => 
        prev.map(msg => 
          msg.id === fileMessage.id 
            ? { ...msg, status: 'delivered' }
            : msg
        )
      );
      
      toast({
        title: "File uploaded",
        description: "Your file has been sent successfully."
      });
    }, 1500);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-background border-b">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(-1)}
              className="rounded-full"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Avatar className="w-10 h-10">
              <AvatarImage src={agent.avatar} alt={agent.name} />
              <AvatarFallback className="bg-green-100 text-green-600">
                {agent.name.split(' ').map(n => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h1 className="text-base font-semibold">{agent.name}</h1>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${
                  agent.status === 'online' ? 'bg-green-500' : 
                  agent.status === 'busy' ? 'bg-yellow-500' : 'bg-gray-400'
                }`} />
                <p className="text-sm text-muted-foreground">{agent.speciality}</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Connection Status */}
        {!isConnected && (
          <div className="px-4 pb-2">
            <Badge variant="destructive" className="text-xs">
              Connection lost - Attempting to reconnect...
            </Badge>
          </div>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`max-w-[80%] ${message.sender === 'user' ? 'order-2' : 'order-1'}`}>
              {message.sender === 'agent' && (
                <div className="flex items-center gap-2 mb-1">
                  <Avatar className="w-6 h-6">
                    <AvatarImage src={agent.avatar} alt={agent.name} />
                    <AvatarFallback className="bg-green-100 text-green-600 text-xs">
                      {agent.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-xs text-muted-foreground">{agent.name}</span>
                </div>
              )}
              
              <Card className={`p-3 ${
                message.sender === 'user' 
                  ? 'bg-primary text-primary-foreground ml-2' 
                  : 'bg-muted mr-2'
              }`}>
                {message.type === 'image' ? (
                  <div className="space-y-2">
                    <div className="w-8 h-8 bg-muted rounded flex items-center justify-center">
                      <Image className="w-4 h-4" />
                    </div>
                    <p className="text-sm">{message.content}</p>
                  </div>
                ) : message.type === 'file' ? (
                  <div className="flex items-center gap-2">
                    <Paperclip className="w-4 h-4" />
                    <span className="text-sm">{message.content}</span>
                  </div>
                ) : (
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                )}
              </Card>
              
              <div className={`flex items-center gap-1 mt-1 text-xs text-muted-foreground ${
                message.sender === 'user' ? 'justify-end' : 'justify-start'
              }`}>
                <span>{formatTime(message.timestamp)}</span>
                {message.sender === 'user' && message.status && (
                  <span className={`${
                    message.status === 'read' ? 'text-blue-500' : 
                    message.status === 'delivered' ? 'text-green-500' : 
                    'text-muted-foreground'
                  }`}>
                    •
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}

        {/* Typing Indicator */}
        {isTyping && (
          <div className="flex justify-start">
            <div className="flex items-center gap-2 bg-muted rounded-lg p-3 max-w-[80%]">
              <Avatar className="w-6 h-6">
                <AvatarFallback className="bg-green-100 text-green-600 text-xs">
                  {agent.name.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce [animation-delay:0.1s]" />
                <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce [animation-delay:0.2s]" />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="border-t bg-background p-4">
        <div className="flex items-end gap-2">
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              className="rounded-full w-8 h-8 p-0"
            >
              <Paperclip className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              className="rounded-full w-8 h-8 p-0"
            >
              <Camera className="w-4 h-4" />
            </Button>
          </div>
          
          <div className="flex-1 relative">
            <Input
              placeholder="Type your message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              className="pr-10"
            />
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-1 top-1/2 transform -translate-y-1/2 rounded-full w-8 h-8 p-0"
            >
              <Smile className="w-4 h-4" />
            </Button>
          </div>
          
          <Button
            onClick={handleSendMessage}
            disabled={!newMessage.trim()}
            className="rounded-full w-10 h-10 p-0"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
        
        {/* File Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,.pdf,.doc,.docx,.txt"
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>
    </div>
  );
};

export default GeminiCares;