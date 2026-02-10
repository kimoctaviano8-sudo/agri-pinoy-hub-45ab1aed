import { useState, useEffect, useRef } from "react";
import { Send, ArrowLeft, Inbox as InboxIcon, MessageSquare, Clock, CheckCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { ScrollArea } from "@/components/ui/scroll-area";

interface SupportTicket {
  id: string;
  user_id: string;
  subject: string;
  message: string;
  status: 'open' | 'in_progress' | 'closed';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  created_at: string;
  updated_at: string;
  profiles?: {
    full_name: string;
    email: string;
  };
}

interface TicketResponse {
  id: string;
  ticket_id: string;
  user_id: string;
  message: string;
  created_at: string;
  profiles?: {
    full_name: string;
  };
}

const Inbox = () => {
  const { user, userRole } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const selectedTicketRef = useRef<SupportTicket | null>(null);
  const [responses, setResponses] = useState<TicketResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [techniciansMap, setTechniciansMap] = useState<Map<string, boolean>>(new Map());
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // For users creating new tickets
  const [newTicket, setNewTicket] = useState({
    subject: '',
    message: '',
    priority: 'normal' as const
  });

  // For responses
  const [replyMessage, setReplyMessage] = useState('');

  const isFieldTechnician = userRole === 'field_technician' || userRole === 'admin';

  useEffect(() => {
    if (user) {
      fetchTickets();
      const cleanup = setupRealtimeSubscription();
      return cleanup;
    }
  }, [user, userRole]);

  useEffect(() => {
    if (selectedTicket && user) {
      selectedTicketRef.current = selectedTicket;
      fetchResponses(selectedTicket.id);

      // Mark this ticket as read in localStorage and notify Navigation
      const readTimestamps: Record<string, string> = JSON.parse(
        localStorage.getItem(`ticket_read_times_${user.id}`) || '{}'
      );
      readTimestamps[selectedTicket.id] = new Date().toISOString();
      localStorage.setItem(`ticket_read_times_${user.id}`, JSON.stringify(readTimestamps));
      window.dispatchEvent(new Event('ticket-read'));
    }
  }, [selectedTicket]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [responses, selectedTicket?.id]);

  const setupRealtimeSubscription = () => {
    const ticketsChannel = supabase
      .channel('tickets-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'support_tickets'
        },
        async (payload) => {
          console.log('Ticket change detected:', payload);
          // Optimistically update if possible, or refetch
          if (payload.eventType === 'INSERT') {
            fetchTickets();
          } else if (payload.eventType === 'UPDATE' && payload.new) {
            // Update the specific ticket in state
            setTickets(prev => prev.map(t => 
              t.id === payload.new.id ? { ...t, ...payload.new } : t
            ));
            if (selectedTicket?.id === payload.new.id) {
              setSelectedTicket({ ...selectedTicket, ...payload.new } as SupportTicket);
            }
          } else {
            fetchTickets();
          }
        }
      )
      .subscribe();

    const responsesChannel = supabase
      .channel('responses-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'ticket_responses'
        },
        async (payload) => {
          console.log('New response detected:', payload);
          const currentTicket = selectedTicketRef.current;

          if (currentTicket && payload.new.ticket_id === currentTicket.id) {
            // Fetch profile for the new response
            const { data: profileData } = await supabase
              .from('public_profiles')
              .select('id, full_name')
              .eq('id', payload.new.user_id)
              .single();

            // Check if user is a technician
            const { data: roleData } = await supabase
              .from('user_roles')
              .select('role')
              .eq('user_id', payload.new.user_id)
              .single();

            if (roleData?.role === 'field_technician' || roleData?.role === 'admin') {
              setTechniciansMap(prev => new Map(prev).set(payload.new.user_id, true));
            }

            // Add the new response to state
            const newResponse: TicketResponse = {
              id: payload.new.id,
              ticket_id: payload.new.ticket_id,
              user_id: payload.new.user_id,
              message: payload.new.message,
              created_at: payload.new.created_at,
              profiles: profileData || undefined
            };
            setResponses(prev => [...prev, newResponse]);
          } else if (!currentTicket) {
            // If we're in ticket list view, update ticket status or counts
            fetchTickets();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(ticketsChannel);
      supabase.removeChannel(responsesChannel);
    };
  };

  const fetchTickets = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('support_tickets')
        .select('*')
        .order('created_at', { ascending: false });

      if (!isFieldTechnician) {
        query = query.eq('user_id', user!.id);
      }

      const { data: ticketsData, error } = await query;

      if (error) throw error;

      // Fetch profiles separately using public_profiles for field technicians
      if (ticketsData && ticketsData.length > 0) {
        const userIds = [...new Set(ticketsData.map(t => t.user_id))];
        const { data: profilesData } = await supabase
          .from('public_profiles')
          .select('id, full_name, avatar_url')
          .in('id', userIds);

        const profilesMap = new Map(profilesData?.map(p => [p.id, p]) || []);
        
        const enrichedTickets = ticketsData.map(ticket => ({
          ...ticket,
          profiles: profilesMap.get(ticket.user_id)
        }));

        setTickets(enrichedTickets as any);
      } else {
        setTickets([]);
      }
    } catch (error) {
      console.error('Error fetching tickets:', error);
      toast({
        title: "Error",
        description: "Failed to load support tickets",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchResponses = async (ticketId: string) => {
    try {
      const { data: responsesData, error } = await supabase
        .from('ticket_responses')
        .select('*')
        .eq('ticket_id', ticketId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Fetch profiles separately using public_profiles
      if (responsesData && responsesData.length > 0) {
        const userIds = [...new Set(responsesData.map(r => r.user_id))];
        const { data: profilesData } = await supabase
          .from('public_profiles')
          .select('id, full_name')
          .in('id', userIds);

        // Fetch roles to determine if users are technicians
        const { data: rolesData } = await supabase
          .from('user_roles')
          .select('user_id, role')
          .in('user_id', userIds);

        const profilesMap = new Map(profilesData?.map(p => [p.id, p]) || []);
        const techMap = new Map<string, boolean>();
        rolesData?.forEach(r => {
          if (r.role === 'field_technician' || r.role === 'admin') {
            techMap.set(r.user_id, true);
          }
        });
        setTechniciansMap(techMap);
        
        const enrichedResponses = responsesData.map(response => ({
          ...response,
          profiles: profilesMap.get(response.user_id)
        }));

        setResponses(enrichedResponses as any);
      } else {
        setResponses([]);
      }
    } catch (error) {
      console.error('Error fetching responses:', error);
    }
  };

  const handleCreateTicket = async () => {
    if (!newTicket.subject || !newTicket.message) {
      toast({
        title: "Missing Information",
        description: "Please fill in both subject and message",
        variant: "destructive",
      });
      return;
    }

    try {
      setSending(true);
      const { error } = await supabase
        .from('support_tickets')
        .insert({
          user_id: user!.id,
          subject: newTicket.subject,
          message: newTicket.message,
          priority: newTicket.priority,
          status: 'open'
        });

      if (error) throw error;

      toast({
        title: "Ticket Created",
        description: "Your support ticket has been submitted successfully",
      });

      setNewTicket({ subject: '', message: '', priority: 'normal' });
      fetchTickets();
    } catch (error) {
      console.error('Error creating ticket:', error);
      toast({
        title: "Error",
        description: "Failed to create support ticket",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  const handleSendReply = async () => {
    if (!replyMessage.trim() || !selectedTicket || !user) return;

    const messageToSend = replyMessage.trim();
    setReplyMessage(''); // Clear immediately for better UX

    try {
      const { error } = await supabase
        .from('ticket_responses')
        .insert({
          ticket_id: selectedTicket.id,
          user_id: user.id,
          message: messageToSend,
          is_internal_note: false,
        });

      if (error) throw error;

      // Update ticket status if technician is replying
      if (isFieldTechnician && selectedTicket.status === 'open') {
        await supabase
          .from('support_tickets')
          .update({ status: 'in_progress' })
          .eq('id', selectedTicket.id);
      }
      // Don't call fetchResponses - realtime subscription will handle it
    } catch (error) {
      console.error('Error sending reply:', error);
      setReplyMessage(messageToSend); // Restore message on error
      toast({
        title: "Error",
        description: "Failed to send reply",
        variant: "destructive",
      });
    }
  };

  const handleUpdateStatus = async (ticketId: string, status: string) => {
    try {
      const { error } = await supabase
        .from('support_tickets')
        .update({ status })
        .eq('id', ticketId);

      if (error) throw error;

      toast({
        title: "Status Updated",
        description: `Ticket marked as ${status.replace('_', ' ')}`,
      });

      fetchTickets();
      if (selectedTicket?.id === ticketId) {
        setSelectedTicket({ ...selectedTicket, status: status as any });
      }
    } catch (error) {
      console.error('Error updating status:', error);
      toast({
        title: "Error",
        description: "Failed to update ticket status",
        variant: "destructive",
      });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open':
        return <AlertCircle className="w-4 h-4 text-orange-500" />;
      case 'in_progress':
        return <Clock className="w-4 h-4 text-blue-500" />;
      case 'closed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      default:
        return <MessageSquare className="w-4 h-4" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-destructive/10 text-destructive border-destructive/20';
      case 'high':
        return 'bg-warning/10 text-warning border-warning/20';
      case 'normal':
        return 'bg-primary/10 text-primary border-primary/20';
      case 'low':
        return 'bg-muted text-muted-foreground border-border';
      default:
        return 'bg-muted text-muted-foreground border-border';
    }
  };

  // User View: Create new ticket
  if (!isFieldTechnician && !selectedTicket) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border">
          <div className="flex items-center gap-3 p-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex-1">
              <h1 className="text-lg font-bold text-foreground">Support</h1>
              <p className="text-xs text-muted-foreground">Get help from our team</p>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-6 max-w-2xl">
          <Tabs defaultValue="new" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="new">New Ticket</TabsTrigger>
              <TabsTrigger value="my-tickets">My Tickets</TabsTrigger>
            </TabsList>

            <TabsContent value="new" className="space-y-4 mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Create Support Ticket</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Subject</label>
                    <Input
                      placeholder="Brief description of your issue"
                      value={newTicket.subject}
                      onChange={(e) => setNewTicket({ ...newTicket, subject: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">Priority</label>
                    <Select
                      value={newTicket.priority}
                      onValueChange={(value: any) => setNewTicket({ ...newTicket, priority: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="normal">Normal</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="urgent">Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">Message</label>
                    <Textarea
                      placeholder="Describe your issue in detail..."
                      rows={6}
                      value={newTicket.message}
                      onChange={(e) => setNewTicket({ ...newTicket, message: e.target.value })}
                    />
                  </div>

                  <Button
                    onClick={handleCreateTicket}
                    disabled={sending}
                    className="w-full"
                  >
                    {sending ? 'Submitting...' : 'Submit Ticket'}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="my-tickets" className="mt-4">
              {loading ? (
                <div className="text-center py-8 text-muted-foreground">Loading...</div>
              ) : tickets.length === 0 ? (
                <Card>
                  <CardContent className="text-center py-12">
                    <InboxIcon className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground">No support tickets yet</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3">
                  {tickets.map((ticket) => (
                    <Card
                      key={ticket.id}
                      className="cursor-pointer hover:border-primary transition-colors"
                      onClick={() => setSelectedTicket(ticket)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              {getStatusIcon(ticket.status)}
                              <h3 className="font-semibold text-sm truncate">{ticket.subject}</h3>
                            </div>
                            <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                              {ticket.message}
                            </p>
                            <div className="flex gap-2">
                              <Badge variant="outline" className={getPriorityColor(ticket.priority)}>
                                {ticket.priority}
                              </Badge>
                              <Badge variant="outline">{ticket.status.replace('_', ' ')}</Badge>
                            </div>
                          </div>
                          <div className="text-xs text-muted-foreground whitespace-nowrap">
                            {new Date(ticket.created_at).toLocaleDateString()}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    );
  }

  // Field Technician View: Show all tickets
  if (isFieldTechnician && !selectedTicket) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border">
          <div className="flex items-center gap-3 p-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex-1">
              <h1 className="text-lg font-bold text-foreground">Support Tickets</h1>
              <p className="text-xs text-muted-foreground">Manage user inquiries</p>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-6 max-w-4xl">
          <Tabs defaultValue="open" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="open">Open</TabsTrigger>
              <TabsTrigger value="in_progress">In Progress</TabsTrigger>
              <TabsTrigger value="closed">Closed</TabsTrigger>
            </TabsList>

            {(['open', 'in_progress', 'closed'] as const).map((status) => (
              <TabsContent key={status} value={status} className="mt-4">
                {loading ? (
                  <div className="text-center py-8 text-muted-foreground">Loading...</div>
                ) : tickets.filter(t => t.status === status).length === 0 ? (
                  <Card>
                    <CardContent className="text-center py-12">
                      <InboxIcon className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                      <p className="text-muted-foreground">No {status.replace('_', ' ')} tickets</p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-3">
                    {tickets.filter(t => t.status === status).map((ticket) => (
                      <Card
                        key={ticket.id}
                        className="cursor-pointer hover:border-primary transition-colors"
                        onClick={() => setSelectedTicket(ticket)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                {getStatusIcon(ticket.status)}
                                <h3 className="font-semibold text-sm truncate">{ticket.subject}</h3>
                              </div>
                              <p className="text-xs text-muted-foreground mb-2">
                                From: {ticket.profiles?.full_name || 'Unknown User'}
                              </p>
                              <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                                {ticket.message}
                              </p>
                              <Badge variant="outline" className={getPriorityColor(ticket.priority)}>
                                {ticket.priority}
                              </Badge>
                            </div>
                            <div className="text-xs text-muted-foreground whitespace-nowrap">
                              {new Date(ticket.created_at).toLocaleDateString()}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>
            ))}
          </Tabs>
        </div>
      </div>
    );
  }

  // Conversation View: Show selected ticket with responses
  if (selectedTicket) {
    return (
      <div className="fixed inset-x-0 top-0 bottom-16 bg-background flex flex-col z-[60]">
        <div className="flex-none bg-background/95 backdrop-blur-sm border-b border-border">
          <div className="flex items-center gap-3 p-4">
            <Button variant="ghost" size="icon" onClick={() => setSelectedTicket(null)}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex-1 min-w-0">
              <h1 className="text-sm font-semibold text-foreground truncate">{selectedTicket.subject}</h1>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline" className={getPriorityColor(selectedTicket.priority)}>
                  {selectedTicket.priority}
                </Badge>
                {isFieldTechnician && (
                  <Select
                    value={selectedTicket.status}
                    onValueChange={(value) => handleUpdateStatus(selectedTicket.id, value)}
                  >
                    <SelectTrigger className="h-6 text-xs w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="open">Open</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="closed">Closed</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="max-w-3xl mx-auto p-4 space-y-4 pb-4">
              {/* Original ticket message */}
              <div className={`flex ${selectedTicket.user_id === user!.id ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] rounded-lg p-3 ${selectedTicket.user_id === user!.id ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                  <div className={`text-xs mb-1 ${selectedTicket.user_id === user!.id ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                    {selectedTicket.profiles?.full_name || 'User'} • {new Date(selectedTicket.created_at).toLocaleString()}
                  </div>
                  <p className="text-sm">{selectedTicket.message}</p>
                </div>
              </div>

              {/* Responses */}
              {responses.map((response) => {
                const isOwnMessage = response.user_id === user!.id;
                const isTechnicianMessage = techniciansMap.get(response.user_id);
                const isTicketCreator = response.user_id === selectedTicket.user_id;
                
                // Determine message alignment and style
                // Own messages: right side, primary color
                // Other technician messages: right side, secondary style
                // Ticket creator messages: left side, muted
                const alignRight = isOwnMessage || (isTechnicianMessage && !isTicketCreator);
                const bgStyle = isOwnMessage 
                  ? 'bg-primary text-primary-foreground' 
                  : isTechnicianMessage && !isTicketCreator
                    ? 'bg-secondary text-secondary-foreground'
                    : 'bg-muted';
                const textStyle = isOwnMessage 
                  ? 'text-primary-foreground/70' 
                  : isTechnicianMessage && !isTicketCreator
                    ? 'text-secondary-foreground/70'
                    : 'text-muted-foreground';
                
                return (
                  <div key={response.id} className={`flex ${alignRight ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] rounded-lg p-3 ${bgStyle}`}>
                      <div className={`text-xs mb-1 ${textStyle}`}>
                        {response.profiles?.full_name || 'User'} • {new Date(response.created_at).toLocaleString()}
                      </div>
                      <p className="text-sm whitespace-pre-wrap">{response.message}</p>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>
        </div>

        <div className="flex-none border-t border-border bg-background p-4">
          <div className="max-w-3xl mx-auto flex gap-2">
            <Textarea
              placeholder="Type your reply..."
              value={replyMessage}
              onChange={(e) => setReplyMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendReply();
                }
              }}
              rows={2}
              className="flex-1"
            />
            <Button
              onClick={handleSendReply}
              disabled={!replyMessage.trim()}
              size="icon"
              className="self-end"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default Inbox;
