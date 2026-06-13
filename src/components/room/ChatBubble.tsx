import type { Chats, User } from "../../generated/client";
import { useSession } from "next-auth/react";
import type { FC } from "react";
import { useEffect, useState } from "react";
import React from "react";
import { useAppContext } from "../../context/AppContext";

interface Props {
  chat: ChatWithUser;
  isConsecutive?: boolean;
}

type ChatWithUser = Chats & { user: User };

export const ChatBubble: FC<Props> = ({ chat, isConsecutive }) => {
  const { data: session } = useSession();
  const { fullscreen, darkMode } = useAppContext();

  const [showChatFullscreen, setShowChatFullscreen] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowChatFullscreen(false);
    }, 10000);
    return () => clearTimeout(timer);
  }, []);

  const isMe = chat.userId === session?.user?.id;

  return (
    <div className={`px-1 ${isConsecutive ? "py-0" : "py-0.5"}`}>
      <div
        className={`chat transition-all duration-300 ${
          isMe ? "chat-end" : "chat-start"
        } ${
          fullscreen
            ? `hover:opacity-100 ${
                showChatFullscreen ? "opacity-90" : "opacity-10"
              }`
            : "opacity-100"
        } ${isConsecutive ? "gap-y-0.5" : ""}`}
      >
        {/* Chat Avatar / Spacer */}
        <div className="chat-image avatar">
          {!isConsecutive ? (
            <div className="w-7 h-7 rounded-full ring-1 ring-primary/20 overflow-hidden shadow-sm flex items-center justify-center bg-gradient-to-br from-yellow-400 to-amber-600 font-black text-slate-950 text-[10px]">
              {chat.user.image ? (
                <img src={chat.user.image} alt={chat.user.name || "User"} referrerPolicy="no-referrer" />
              ) : (
                <span>{chat.user.name ? chat.user.name[0]?.toUpperCase() : "🐥"}</span>
              )}
            </div>
          ) : (
            <div className="w-7 h-7" />
          )}
        </div>

        {/* Chat Sender Name */}
        {!isConsecutive && (
          <div className="chat-header text-[10px] opacity-50 mb-0.5 px-1 font-semibold">
            {chat.user.name || "User"}
          </div>
        )}
        {/* Chat Bubble */}
        <div
          className={`chat-bubble text-sm py-2 px-3.5 min-h-fit shadow-sm rounded-2xl ${
            isMe
              ? "chat-bubble-primary text-slate-950 font-semibold rounded-tr-none glow-primary"
              : darkMode
                ? "bg-slate-800 text-slate-100 rounded-tl-none border border-slate-700/30"
                : "bg-slate-200 text-slate-900 rounded-tl-none border border-slate-300"
          }`}
        >
          {chat.message}
        </div>
      </div>
    </div>
  );
};
