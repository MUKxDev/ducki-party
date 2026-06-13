import type { Chats, Rooms, User } from "../../generated/client";
import type { FC } from "react";
import { useRef } from "react";
import { useState } from "react";
import { useEffect } from "react";
import React from "react";
import { useSession } from "next-auth/react";
import { Field, Form, Formik } from "formik";
import { toFormikValidationSchema } from "zod-formik-adapter";
import { z } from "zod";
import { api } from "../../utils/api";
import { useAppContext } from "../../context/AppContext";
import { ChatBubble } from "./ChatBubble";
import EmojiPicker, { Theme } from "emoji-picker-react";
import { ReactionBarSelector } from "@charkour/react-reactions";
import { useWebSocket, type PresenceUser } from "../../context/WebSocketContext";
import { toast } from "react-hot-toast";

const sound = "/audio/message.wav";

interface Props {
  room: Rooms;
}

type ChatWithUser = Chats & { user: User };

export const Chat: FC<Props> = ({ room }) => {
  const createChatMutation = api.chats.createChat.useMutation();
  const chatsMutation = api.chats.chatsByRoomId.useMutation();
  const emojiByRoomIdMutation = api.rooms.updateRoomEmoji.useMutation();

  /* -------------------------------------------------------------------------- */
  /*                                   CONTEXT                                  */
  /* -------------------------------------------------------------------------- */
  const { data: session } = useSession();
  const { fullscreen, darkMode } = useAppContext();
  const { sendBroadcast, subscribe: subscribeWS, connectedUsers } = useWebSocket();

  /* -------------------------------------------------------------------------- */
  /*                                   STATES                                   */
  /* -------------------------------------------------------------------------- */
  const [chats, setChats] = useState<ChatWithUser[]>([]);
  const [firstChatsFetched, setFirstChatsFetched] = useState<boolean>(false);
  const [showEmojis, setShowEmojis] = useState<boolean>(false);
  const [showPresenceList, setShowPresenceList] = useState<boolean>(false);
  const prevUsersRef = useRef<PresenceUser[]>([]);

  /* -------------------------------------------------------------------------- */
  /*                                    REFS                                    */
  /* -------------------------------------------------------------------------- */
  const chatContainerEndRef = useRef<HTMLDivElement>(null);
  const audioPlayer = useRef<HTMLAudioElement>(null);

  const chatSchema = z.object({
    message: z.string().min(1, "Message cannot be empty"),
  });

  useEffect(() => {
    chatContainerEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chats, fullscreen]);

  // Detect join/leave events from presence changes
  useEffect(() => {
    const prevIds = new Set(prevUsersRef.current.map(u => u.id));
    const currIds = new Set(connectedUsers.map(u => u.id));

    // Find joins
    for (const user of connectedUsers) {
      if (!prevIds.has(user.id) && user.id !== session?.user?.id) {
        toast(`${user.name || 'Someone'} joined`, {
          icon: '🟢',
          duration: 2500,
          position: 'top-center',
          style: {
            background: darkMode ? 'rgba(17, 24, 39, 0.9)' : 'rgba(255, 255, 255, 0.9)',
            color: darkMode ? '#a5f3fc' : '#0f766e',
            backdropFilter: 'blur(12px)',
            border: darkMode ? '1px solid rgba(34,211,238,0.15)' : '1px solid rgba(20,184,166,0.2)',
            borderRadius: '999px',
            padding: '6px 16px',
            fontWeight: '600',
            fontSize: '13px',
          },
        });
      }
    }

    // Find leaves
    for (const user of prevUsersRef.current) {
      if (!currIds.has(user.id) && user.id !== session?.user?.id) {
        toast(`${user.name || 'Someone'} left`, {
          icon: '🔴',
          duration: 2500,
          position: 'top-center',
          style: {
            background: darkMode ? 'rgba(17, 24, 39, 0.9)' : 'rgba(255, 255, 255, 0.9)',
            color: darkMode ? '#fca5a5' : '#b91c1c',
            backdropFilter: 'blur(12px)',
            border: darkMode ? '1px solid rgba(248,113,113,0.15)' : '1px solid rgba(239,68,68,0.2)',
            borderRadius: '999px',
            padding: '6px 16px',
            fontWeight: '600',
            fontSize: '13px',
          },
        });
      }
    }

    prevUsersRef.current = connectedUsers;
  }, [connectedUsers, session?.user?.id, darkMode]);

  useEffect(() => {
    const unsubscribe = subscribeWS("CHAT_CREATED", (payload: unknown) => {
      const chatPayload = payload as { chat: ChatWithUser };
      const newChat = chatPayload?.chat;
      if (newChat && newChat.userId !== session?.user?.id) {
        setChats((chats) => [...chats, newChat]);
        void playAudio();
      }
    });

    return () => {
      unsubscribe();
    };
  }, [subscribeWS, session?.user?.id]);

  useEffect(() => {
    async function initChats() {
      await chatsMutation.mutateAsync({ roomId: room.id }).then((initChats) => {
        setChats(initChats);
      });
    }
    if (!firstChatsFetched) {
      setFirstChatsFetched(true);
      void initChats();
    }
  }, [chatsMutation, firstChatsFetched, room.id]);

  async function playAudio() {
    await audioPlayer.current?.play().catch(() => {
      // Browser autoplay policy might block audio until interaction
    });
  }

  async function sendChat(message: string) {
    const newChat = await createChatMutation.mutateAsync({
      message: message,
      roomId: room.id,
    });

    if (newChat && session?.user) {
      const chatWithUser = {
        ...newChat,
        user: {
          id: session.user.id,
          name: session.user.name ?? null,
          email: session.user.email ?? null,
          image: session.user.image ?? null,
          emailVerified: null,
          password: null,
        },
      } as ChatWithUser;

      setChats((chats) => [...chats, chatWithUser]);
      sendBroadcast("CHAT_CREATED", { chat: chatWithUser });
    }
  }

  async function setEmoji(label: string) {
    let emoji = "";
    switch (label) {
      case "haha":
        emoji = "😂";
        break;
      case "love":
        emoji = "😍";
        break;
      case "starts":
        emoji = "✨";
        break;
      case "wow":
        emoji = "😲";
        break;
      case "cry":
        emoji = "😭";
        break;
      case "angry":
        emoji = "😡";
        break;
    }

    await emojiByRoomIdMutation.mutateAsync({ roomId: room.id, emoji: emoji });
    sendBroadcast("EMOJI_UPDATED", { emoji: emoji });
  }

  return (
    <div className="flex flex-col h-full w-full overflow-hidden relative">
      <audio ref={audioPlayer} src={sound} />
      
      {/* Chat Header with Connected Users */}
      {!fullscreen && (
        <div className="pb-2 mb-2 border-b border-base-300 shrink-0">
          <div className="flex items-center justify-between">
            <span className="font-bold text-sm tracking-tight flex items-center gap-1.5">
              💬 Live Chat
            </span>
            <button
              type="button"
              onClick={() => setShowPresenceList(!showPresenceList)}
              className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-semibold transition-all duration-200 cursor-pointer ${
                showPresenceList
                  ? darkMode
                    ? 'bg-cyan-500/15 text-cyan-400 ring-1 ring-cyan-500/30'
                    : 'bg-teal-500/15 text-teal-600 ring-1 ring-teal-500/30'
                  : darkMode
                    ? 'bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20'
                    : 'bg-teal-500/10 text-teal-600 hover:bg-teal-500/20'
              }`}
            >
              {/* Stacked Avatars */}
              <div className="flex -space-x-1.5">
                {connectedUsers.slice(0, 3).map((u) => (
                  <div
                    key={u.id}
                    className={`w-4 h-4 rounded-full flex items-center justify-center text-[7px] font-bold ring-1 ${
                      darkMode
                        ? 'bg-gradient-to-br from-cyan-500 to-blue-600 text-white ring-slate-900'
                        : 'bg-gradient-to-br from-teal-400 to-emerald-500 text-white ring-white'
                    }`}
                    title={u.name}
                  >
                    {(u.name || '?')[0]?.toUpperCase()}
                  </div>
                ))}
              </div>
              <span className="tabular-nums">{connectedUsers.length}</span>
              <span className="hidden sm:inline">online</span>
              <svg
                className={`w-3 h-3 transition-transform duration-200 ${
                  showPresenceList ? 'rotate-180' : ''
                }`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>

          {/* Expandable Presence List */}
          {showPresenceList && (
            <div className={`mt-2 p-2 rounded-xl border animate-fade-in max-h-32 overflow-y-auto scrollbar-hide ${
              darkMode
                ? 'bg-slate-900/60 border-slate-800'
                : 'bg-slate-50 border-slate-200'
            }`}>
              <div className="flex flex-wrap gap-1.5">
                {connectedUsers.map((u) => (
                  <div
                    key={u.id}
                    className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium transition-all ${
                      u.id === session?.user?.id
                        ? darkMode
                          ? 'bg-cyan-500/20 text-cyan-300 ring-1 ring-cyan-500/30'
                          : 'bg-teal-500/20 text-teal-700 ring-1 ring-teal-500/30'
                        : darkMode
                          ? 'bg-slate-800/80 text-slate-300'
                          : 'bg-white text-slate-700 shadow-sm'
                    }`}
                  >
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold ${
                      darkMode
                        ? 'bg-gradient-to-br from-cyan-500 to-blue-600 text-white'
                        : 'bg-gradient-to-br from-teal-400 to-emerald-500 text-white'
                    }`}>
                      {(u.name || '?')[0]?.toUpperCase()}
                    </div>
                    <span className="max-w-[80px] truncate">
                      {u.id === session?.user?.id ? 'You' : (u.name || 'User')}
                    </span>
                    {u.id === session?.user?.id && (
                      <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Messages Scroll Area */}
      <div
        className={`flex-1 overflow-y-auto mb-3 pr-1 ${
          fullscreen ? "scrollbar-hide" : "scrollbar-default"
        }`}
      >
        <div className="flex flex-col gap-1">
          {chats.map((chat, index) => {
            const prevChat = index > 0 ? chats[index - 1] : null;
            const isConsecutive = prevChat?.userId === chat.userId;
            return (
              <ChatBubble
                key={chat.id}
                chat={chat}
                isConsecutive={isConsecutive}
              />
            );
          })}
          <div ref={chatContainerEndRef}></div>
        </div>
      </div>

      {/* Chat Input Area */}
      <Formik
        initialValues={{ message: "" }}
        validationSchema={toFormikValidationSchema(chatSchema)}
        onSubmit={async (values, { setSubmitting, resetForm }) => {
          resetForm();
          setShowEmojis(false);
          await sendChat(values.message);
          setSubmitting(false);
        }}
      >
        {({ isSubmitting, errors, setFieldValue, values }) => (
          <Form
            className={`flex flex-col gap-2 shrink-0 p-1.5 overflow-visible ${
              fullscreen
                ? "opacity-25 focus-within:opacity-100 hover:opacity-100 transition-opacity duration-300"
                : ""
            }`}
          >
            {/* Quick Reactions Bar */}
            <div className="flex gap-2.5 px-1 items-center select-none">
              <span className="text-[10px] uppercase font-bold tracking-wider opacity-50 mr-1">React:</span>
              {["😂", "😍", "😭", "😡", "✨", "😲"].map((emojiChar) => {
                const labels = ["haha", "love", "cry", "angry", "starts", "wow"];
                const idx = ["😂", "😍", "😭", "😡", "✨", "😲"].indexOf(emojiChar);
                return (
                  <button
                    key={emojiChar}
                    type="button"
                    onClick={() => {
                      toast(`${emojiChar} Sent!`, {
                        duration: 1000,
                        position: "bottom-center",
                        style: {
                          background: darkMode ? "#1e293b" : "#ffffff",
                          color: darkMode ? "#f8fafc" : "#0f172a",
                          border: darkMode ? "1px solid rgba(255,255,255,0.1)" : "1px solid rgba(0,0,0,0.1)",
                          borderRadius: "9999px",
                          padding: "6px 12px",
                          fontWeight: "bold",
                        }
                      });
                      void setEmoji(labels[idx]!);
                    }}
                    className="hover:scale-130 active:scale-90 transition-all text-xl p-0.5"
                  >
                    {emojiChar}
                  </button>
                );
              })}
            </div>

            {/* Input Row */}
            <div className="flex items-center gap-2 w-full overflow-visible p-0.5">
              {/* Emoji Trigger Button */}
              <button
                type="button"
                onClick={() => setShowEmojis(!showEmojis)}
                className={`btn btn-circle btn-ghost btn-sm md:btn-md transition-transform hover:scale-105 active:scale-95 ${
                  showEmojis ? "text-error" : "text-primary text-lg"
                }`}
              >
                {showEmojis ? "✕" : "🐥"}
              </button>

              {/* Input Field */}
              <div className="flex-1" onFocus={() => setShowEmojis(false)}>
                <Field
                  className={`input input-bordered focus:input-primary w-full transition-all duration-200 ${
                    darkMode 
                      ? "bg-slate-950/40 border-slate-700/50 text-slate-200" 
                      : "bg-white border-slate-300 text-slate-900"
                  }`}
                  type="text"
                  name="message"
                  placeholder="Send a message..."
                  autoComplete="off"
                />
              </div>

              {/* Send Button */}
              <button
                className="btn btn-secondary text-slate-950 font-bold shadow-lg glow-secondary hover:scale-[1.02] active:scale-[0.98] transition"
                type="submit"
                disabled={isSubmitting || typeof errors.message === "string"}
              >
                Send
              </button>
            </div>

            {/* Slide-Up Emoji Reaction Overlay */}
            {showEmojis && (
              <div className={`absolute inset-0 z-30 flex flex-col p-4 animate-fade-in rounded-2xl ${
                darkMode ? "bg-slate-900/95 border border-slate-800" : "bg-slate-50/95 border border-slate-200"
              }`}>
                <div className="flex items-center justify-between mb-3 shrink-0">
                  <h3 className="font-bold text-sm tracking-tight">Express Yourself</h3>
                  <button 
                    type="button" 
                    onClick={() => setShowEmojis(false)}
                    className="btn btn-xs btn-circle btn-ghost hover:bg-error/10 hover:text-error"
                  >
                    ✕
                  </button>
                </div>
                
                {/* Reactions Row */}
                <div className={`mb-3 p-2 rounded-xl border shrink-0 ${
                  darkMode ? "bg-slate-950/40 border-slate-800" : "bg-slate-100 border-slate-200"
                }`}>
                  <ReactionBarSelector
                    style={{
                      width: "100%",
                      justifyContent: "space-around",
                      backgroundColor: "transparent",
                      boxShadow: "none",
                      padding: "0px",
                    }}
                    reactions={[
                      {
                        label: "haha",
                        node: <div className="text-2xl hover:scale-125 active:scale-95 transition-transform duration-100 cursor-pointer">😂</div>,
                        key: "haha",
                      },
                      {
                        label: "love",
                        node: <div className="text-2xl hover:scale-125 active:scale-95 transition-transform duration-100 cursor-pointer">😍</div>,
                        key: "love",
                      },
                      {
                        label: "cry",
                        node: <div className="text-2xl hover:scale-125 active:scale-95 transition-transform duration-100 cursor-pointer">😭</div>,
                        key: "cry",
                      },
                      {
                        label: "angry",
                        node: <div className="text-2xl hover:scale-125 active:scale-95 transition-transform duration-100 cursor-pointer">😡</div>,
                        key: "angry",
                      },
                      {
                        label: "starts",
                        node: <div className="text-2xl hover:scale-125 active:scale-95 transition-transform duration-100 cursor-pointer">✨</div>,
                        key: "starts",
                      },
                      {
                        label: "wow",
                        node: <div className="text-2xl hover:scale-125 active:scale-95 transition-transform duration-100 cursor-pointer">😲</div>,
                        key: "wow",
                      },
                    ]}
                    onSelect={(emoji) => {
                      setShowEmojis(false);
                      void setEmoji(emoji);
                    }}
                  />
                </div>

                {/* Full Emoji Picker */}
                <div className={`grow overflow-hidden rounded-xl border flex flex-col ${
                  darkMode ? "bg-slate-950 border-slate-800" : "bg-white border-slate-200"
                }`}>
                  <EmojiPicker
                    theme={darkMode ? Theme.DARK : Theme.LIGHT}
                    width="100%"
                    height="100%"
                    skinTonesDisabled
                    searchDisabled={false}
                    previewConfig={{ showPreview: false }}
                    onEmojiClick={(emoji) => {
                      void setFieldValue(
                        "message",
                        `${values.message}${emoji.emoji}`
                      );
                    }}
                  />
                </div>
              </div>
            )}
          </Form>
        )}
      </Formik>
    </div>
  );
};
