import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useTranslations } from "@/hooks/use-translations";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { SendHorizontal, User } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

// Interfaces for our message data
interface Message {
  id: number;
  userId: number;
  consultantId: number;
  content: string;
  createdAt: string;
  isFromConsultant: boolean;
  isRead: boolean;
}

interface MessageConsultantProps {
  consultantId: number;
  consultantName: string;
  consultantPhoto: string;
}

export default function MessageConsultant({ consultantId, consultantName, consultantPhoto }: MessageConsultantProps) {
  const { user } = useAuth();
  const { language } = useTranslations();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [message, setMessage] = useState("");

  // Fetch messages
  const { data: messages = [], isLoading } = useQuery<Message[]>({
    queryKey: [`/api/messages/${consultantId}`],
    enabled: !!user && !!consultantId,
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/messages/${consultantId}`);
      if (!res.ok) throw new Error("Failed to fetch messages");
      return res.json();
    },
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      const res = await apiRequest("POST", `/api/messages/${consultantId}`, { content });
      if (!res.ok) throw new Error("Failed to send message");
      return res.json();
    },
    onSuccess: (newMessage) => {
      queryClient.setQueryData<Message[]>([`/api/messages/${consultantId}`], (old = []) => [
        ...old,
        newMessage,
      ]);
      setMessage("");
      toast({
        title: language === "en" ? "Message sent" : "訊息已發送",
        description: language === "en" 
          ? "Your message has been sent to the consultant" 
          : "您的訊息已發送給顧問",
      });
    },
    onError: (error) => {
      toast({
        title: language === "en" ? "Failed to send message" : "訊息發送失敗",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSendMessage = () => {
    if (!message.trim()) return;
    sendMessageMutation.mutate(message);
  };

  if (!user) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center">
            <p className="text-muted-foreground mb-4">
              {language === "en" 
                ? "Please sign in to message this consultant" 
                : "請登入以向此顧問發送訊息"}
            </p>
            <Button variant="outline" asChild>
              <a href="/auth">
                {language === "en" ? "Sign In" : "登入"}
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">
          {language === "en" ? "Message" : "訊息"} {consultantName}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-grow overflow-auto space-y-4 pb-0">
        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-pulse h-5 w-24 bg-muted rounded"></div>
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            {language === "en" 
              ? "No messages yet. Start a conversation with this consultant." 
              : "尚無訊息。開始與此顧問的對話。"}
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3 ${
                msg.isFromConsultant ? "flex-row" : "flex-row-reverse"
              }`}
            >
              <Avatar className="h-8 w-8 mt-1">
                {msg.isFromConsultant ? (
                  <AvatarImage src={consultantPhoto} alt={consultantName} />
                ) : (
                  <AvatarFallback className="bg-primary/10">
                    <User className="h-4 w-4 text-primary" />
                  </AvatarFallback>
                )}
              </Avatar>
              <div
                className={`rounded-lg px-4 py-2 max-w-[80%] ${
                  msg.isFromConsultant
                    ? "bg-muted"
                    : "bg-primary text-primary-foreground"
                }`}
              >
                <p className="text-sm">{msg.content}</p>
                <span className="text-xs opacity-70 block mt-1">
                  {new Date(msg.createdAt).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
            </div>
          ))
        )}
      </CardContent>
      <CardFooter className="border-t mt-4 p-3">
        <div className="flex w-full gap-2">
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={language === "en" ? "Type your message..." : "輸入您的訊息..."}
            className="min-h-10 flex-1"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
          />
          <Button 
            size="icon" 
            onClick={handleSendMessage} 
            disabled={!message.trim() || sendMessageMutation.isPending}
          >
            <SendHorizontal className="h-4 w-4" />
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}