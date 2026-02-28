
import React, { useState } from "react";
import { Avatar } from "@/components/ui/avatar";
import { Bot, User, Copy, Check, Edit, Pencil } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import TextToSpeechButton from "./TextToSpeechButton";
import { useLanguageStore } from "@/store/languageStore";
import { getTranslation } from "@/utils/translations";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export interface Message {
  id: string;
  content: string;
  role: "user" | "assistant";
  timestamp: Date;
}

interface ChatMessageProps {
  message: Message;
  onEdit?: (id: string, newContent: string) => void;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message, onEdit }) => {
  const isUser = message.role === "user";
  const { toast } = useToast();
  const [copied, setCopied] = React.useState(false);
  const { currentLanguage } = useLanguageStore();
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(message.content);

  // Parse and format text with markdown-like syntax
  const formatText = (text: string) => {
    // Bold: **text** or __text__
    let formattedText = text.replace(/(\*\*|__)(.*?)\1/g, '<strong>$2</strong>');
    
    // Italic: *text* or _text_
    formattedText = formattedText.replace(/(\*|_)(.*?)\1/g, '<em>$2</em>');
    
    // Strikethrough: ~~text~~
    formattedText = formattedText.replace(/~~(.*?)~~/g, '<del>$1</del>');
    
    // Code: `text`
    formattedText = formattedText.replace(/`(.*?)`/g, '<code class="bg-gray-100 dark:bg-gray-800 px-1 rounded text-sm">$1</code>');
    
    // Headers: # Header
    formattedText = formattedText.replace(/^# (.*?)$/gm, '<h1 class="text-xl font-bold mb-1">$1</h1>');
    formattedText = formattedText.replace(/^## (.*?)$/gm, '<h2 class="text-lg font-bold mb-1">$1</h2>');
    formattedText = formattedText.replace(/^### (.*?)$/gm, '<h3 class="text-base font-bold mb-1">$1</h3>');
    
    // Lists: - item or * item
    formattedText = formattedText.replace(/^[*-] (.*?)$/gm, '<li>$1</li>').replace(/<li>(.+?)(?=<li>|$)/gs, '<ul class="list-disc ml-5 my-2">$&</ul>');
    
    // Line breaks
    formattedText = formattedText.replace(/\n/g, '<br />');
    
    return formattedText;
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(message.content)
      .then(() => {
        setCopied(true);
        toast({
          title: getTranslation('copy_success', currentLanguage),
          description: getTranslation('copy_description', currentLanguage),
          duration: 2000,
        });
        setTimeout(() => setCopied(false), 2000);
      })
      .catch((error) => {
        console.error("Failed to copy text: ", error);
        toast({
          title: getTranslation('copy_failed', currentLanguage),
          description: getTranslation('copy_failed_description', currentLanguage),
          variant: "destructive",
        });
      });
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSaveEdit = () => {
    if (onEdit && editedContent.trim()) {
      onEdit(message.id, editedContent);
      setIsEditing(false);
      toast({
        title: getTranslation('edit_success', currentLanguage),
        description: getTranslation('edit_description', currentLanguage),
        duration: 2000,
      });
    }
  };

  const handleCancelEdit = () => {
    setEditedContent(message.content);
    setIsEditing(false);
  };

  return (
    <div className={cn(
      "flex gap-3 message-container p-4 group relative",
      isUser ? "bg-secondary" : "bg-white dark:bg-gray-900"
    )}>
      <Avatar className={cn(
        "h-8 w-8 rounded-full flex-shrink-0",
        isUser ? "bg-blue-600" : "bg-emerald-600"
      )}>
        <div className="flex h-full w-full items-center justify-center text-white">
          {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
        </div>
      </Avatar>
      <div className="flex flex-col max-w-[80%]">
        <span className="text-sm font-semibold mb-1">
          {isUser ? "You" : "MahmudGPT"}
        </span>
        {isEditing ? (
          <div className="flex flex-col gap-2">
            <Input 
              value={editedContent}
              onChange={(e) => setEditedContent(e.target.value)}
              className="min-h-[100px]"
            />
            <div className="flex gap-2 mt-1">
              <Button size="sm" onClick={handleSaveEdit}>Save</Button>
              <Button size="sm" variant="outline" onClick={handleCancelEdit}>Cancel</Button>
            </div>
          </div>
        ) : (
          <span 
            className="text-sm whitespace-pre-wrap prose-sm prose-p:my-0"
            dangerouslySetInnerHTML={{ __html: formatText(message.content) }}
          />
        )}
      </div>
      {!isEditing && (
        <div className="absolute right-4 top-4 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
          {isUser && onEdit && (
            <button 
              onClick={handleEdit}
              className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800"
              aria-label="Edit message"
            >
              <Pencil size={16} className="text-gray-500" />
            </button>
          )}
          {!isUser && <TextToSpeechButton text={message.content} />}
          <button 
            onClick={copyToClipboard}
            className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800"
            aria-label="Copy message"
          >
            {copied ? <Check size={16} className="text-green-500" /> : <Copy size={16} className="text-gray-500" />}
          </button>
        </div>
      )}
    </div>
  );
};

export default ChatMessage;
