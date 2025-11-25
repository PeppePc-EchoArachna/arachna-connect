import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowLeft, Send } from "lucide-react";
import { toast } from "sonner";

interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  read: boolean;
  created_at: string;
  sender?: {
    full_name: string;
    avatar_url?: string;
  };
}

interface Conversation {
  userId: string;
  userName: string;
  userAvatar?: string;
  lastMessage: string;
  unreadCount: number;
}

export default function Messages() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }

    fetchConversations();
    setupRealtimeSubscription();
  }, [user, navigate]);

  const fetchConversations = async () => {
    try {
      const { data: messagesData, error } = await supabase
        .from('messages')
        .select('*, sender:profiles!sender_id(full_name, avatar_url), receiver:profiles!receiver_id(full_name, avatar_url)')
        .or(`sender_id.eq.${user?.id},receiver_id.eq.${user?.id}`)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const conversationMap = new Map<string, Conversation>();
      
      messagesData?.forEach((msg: any) => {
        const otherUserId = msg.sender_id === user?.id ? msg.receiver_id : msg.sender_id;
        const otherUser = msg.sender_id === user?.id ? msg.receiver : msg.sender;
        
        if (!conversationMap.has(otherUserId)) {
          conversationMap.set(otherUserId, {
            userId: otherUserId,
            userName: otherUser.full_name,
            userAvatar: otherUser.avatar_url,
            lastMessage: msg.content,
            unreadCount: msg.receiver_id === user?.id && !msg.read ? 1 : 0
          });
        }
      });

      setConversations(Array.from(conversationMap.values()));
    } catch (error) {
      console.error('Error fetching conversations:', error);
      toast.error("Erro ao carregar conversas");
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (otherUserId: string) => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*, sender:profiles!sender_id(full_name, avatar_url)')
        .or(`and(sender_id.eq.${user?.id},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${user?.id})`)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);

      // Mark as read
      await supabase
        .from('messages')
        .update({ read: true })
        .eq('receiver_id', user?.id)
        .eq('sender_id', otherUserId);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const setupRealtimeSubscription = () => {
    const channel = supabase
      .channel('messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `receiver_id=eq.${user?.id}`
        },
        (payload) => {
          const newMsg = payload.new as Message;
          if (selectedConversation === newMsg.sender_id) {
            setMessages(prev => [...prev, newMsg]);
          }
          fetchConversations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return;

    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          sender_id: user?.id,
          receiver_id: selectedConversation,
          content: newMessage.trim()
        });

      if (error) throw error;

      setNewMessage("");
      fetchMessages(selectedConversation);
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error("Erro ao enviar mensagem");
    }
  };

  if (loading) {
    return <div className="min-h-screen bg-background flex items-center justify-center">
      <p className="text-muted-foreground">Carregando...</p>
    </div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-4 h-screen flex flex-col">
        <div className="flex items-center gap-4 mb-4">
          <Button variant="ghost" onClick={() => navigate("/feed")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold">Mensagens</h1>
        </div>

        <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4 overflow-hidden">
          <Card className="p-4 overflow-y-auto">
            <h2 className="font-semibold mb-4">Conversas</h2>
            {conversations.map((conv) => (
              <button
                key={conv.userId}
                onClick={() => {
                  setSelectedConversation(conv.userId);
                  fetchMessages(conv.userId);
                }}
                className={`w-full flex items-center gap-3 p-3 rounded-lg hover:bg-accent transition-colors ${
                  selectedConversation === conv.userId ? 'bg-accent' : ''
                }`}
              >
                <Avatar>
                  <AvatarImage src={conv.userAvatar} />
                  <AvatarFallback>{conv.userName[0]}</AvatarFallback>
                </Avatar>
                <div className="flex-1 text-left">
                  <p className="font-medium">{conv.userName}</p>
                  <p className="text-sm text-muted-foreground truncate">{conv.lastMessage}</p>
                </div>
                {conv.unreadCount > 0 && (
                  <span className="bg-primary text-primary-foreground text-xs rounded-full px-2 py-1">
                    {conv.unreadCount}
                  </span>
                )}
              </button>
            ))}
          </Card>

          <Card className="md:col-span-2 p-4 flex flex-col">
            {selectedConversation ? (
              <>
                <div className="flex-1 overflow-y-auto mb-4 space-y-4">
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[70%] p-3 rounded-lg ${
                          msg.sender_id === user?.id
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted'
                        }`}
                      >
                        <p>{msg.content}</p>
                        <p className="text-xs opacity-70 mt-1">
                          {new Date(msg.created_at).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex gap-2">
                  <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Digite sua mensagem..."
                    onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                  />
                  <Button onClick={sendMessage}>
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-muted-foreground">
                Selecione uma conversa para começar
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
