import type { Chats, User } from "@prisma/client";
import { useSession } from "next-auth/react";
import type { FC } from "react";
import { useEffect, useState } from "react";
import React from "react";
import { useAppContext } from "../../context/AppContext";

interface Props {
  chat: ChatWithUser;
}

type ChatWithUser = Chats & { user: User };

export const ChatBubble: FC<Props> = ({ chat }) => {
  const { data: session } = useSession();
  const { fullscreen } = useAppContext();

  const [showChatFullscreen, setShowChatFullscreen] = useState(true);

  useEffect(() => {
    void new Promise((resolve) => setTimeout(resolve, 10000)).then(() =>
      setShowChatFullscreen(false)
    );
  }, []);

  return (
    <div>
      <div
        className={`chat duration-500 ${
          chat.userId !== session?.user?.id ? "chat-start" : "chat-end"
        } ${
          fullscreen
            ? `hover:opacity-90 ${
                showChatFullscreen ? "opacity-90" : "opacity-20"
              }`
            : "opacity-100"
        }`}
      >
        <div className="chat-footer">{chat.user.name}</div>
        <div
          className={`chat-bubble ${
            chat.userId !== session?.user?.id ? "chat-bubble-accent" : ""
          }`}
        >
          {chat.message}
        </div>
      </div>
    </div>
  );
};
