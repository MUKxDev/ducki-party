import type { Chats, Rooms, User } from "@prisma/client";
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
import { useWebSocket } from "../../context/WebSocketContext";

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
  const { sendBroadcast, subscribe: subscribeWS } = useWebSocket();

  /* -------------------------------------------------------------------------- */
  /*                                   STATES                                   */
  /* -------------------------------------------------------------------------- */

  const [chats, setChats] = useState<ChatWithUser[]>([]);
  const [firstChatsFetched, setFirstChatsFetched] = useState<boolean>(false);
  const [showEmojis, setShowEmojis] = useState<boolean>(false);

  /* -------------------------------------------------------------------------- */
  /*                                    REFS                                    */
  /* -------------------------------------------------------------------------- */
  const chatContainerEndRef = useRef<HTMLDivElement>(null);
  const audioPlayer = useRef<HTMLAudioElement>(null);

  const chatSchema = z.object({
    message: z.string(),
  });

  useEffect(() => {
    chatContainerEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chats, fullscreen]);

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

  /**
   * If the audioPlayer.current is not null, then play the audio.
   */
  async function playAudio() {
    await audioPlayer.current?.play();
  }

  /**
   * SendChat is an async function that takes a string as an argument and calls the
   * createChatMutation.mutateAsync function with the message and roomId as arguments.
   * @param {string} message - The message to send
   */
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

  /**
   * When the user clicks on a button, the emoji is set to the corresponding emoji.
   * @param {string} label - string - this is the label of the emoji that the user clicked on.
   */
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
    <div className="h-full grow">
      <audio ref={audioPlayer} src={sound} />
      <div className="group relative flex h-full flex-col justify-between">
        <div
          className={`mb-3 grow overflow-y-scroll ${
            fullscreen ? "scrollbar-hide" : "scrollbar-default"
          }`}
        >
          <div className={`flex  flex-col gap-2`}>
            {chats.map((chat) => (
              <ChatBubble key={chat.id} chat={chat}></ChatBubble>
            ))}
            {/* To scroll to last chat */}
            <div ref={chatContainerEndRef}></div>
          </div>
        </div>

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
              className={`flex min-h-fit ${
                fullscreen
                  ? "opacity-5 duration-150 focus-within:opacity-60 group-hover:opacity-60"
                  : ""
              }`}
            >
              <label className="swap-rotate swap btn-square btn mr-3">
                <input
                  type="checkbox"
                  checked={showEmojis}
                  onChange={() => setShowEmojis(!showEmojis)}
                />

                <div className="swap-on">⛔</div>
                <div className="swap-off">🐥</div>
              </label>
              <div
                onFocus={() => setShowEmojis(false)}
                className="flex w-full flex-col"
              >
                <Field
                  className={`input-bordered input w-full rounded-r-none`}
                  type="text"
                  name="message"
                  placeholder="Message..."
                />
              </div>

              <button
                className={`btn-secondary btn rounded-l-none ${
                  isSubmitting ? "loading" : ""
                }`}
                type="submit"
                disabled={isSubmitting || typeof errors.message === "string"}
              >
                Send
              </button>
              {
                <div
                  className={`absolute left-0 bottom-14 flex origin-bottom-left flex-col gap-3 duration-200 ${
                    showEmojis ? "scale-100 opacity-100" : "scale-0 opacity-0"
                  }`}
                >
                  <div>
                    <ReactionBarSelector
                      style={{
                        paddingRight: "14px",
                        width: "100%",
                        justifyContent: "space-between",
                        backgroundColor: darkMode ? "#212121" : "#fff",
                      }}
                      reactions={[
                        {
                          label: "haha",
                          node: <div>😂</div>,
                          key: "haha",
                        },
                        {
                          label: "love",
                          node: <div>😍</div>,
                          key: "love",
                        },
                        {
                          label: "cry",
                          node: <div>😭</div>,
                          key: "cry",
                        },
                        {
                          label: "angry",
                          node: <div>😡</div>,
                          key: "angry",
                        },
                        {
                          label: "starts",
                          node: <div>✨</div>,
                          key: "starts",
                        },
                        {
                          label: "wow",
                          node: <div>😲</div>,
                          key: "wow",
                        },
                      ]}
                      onSelect={(emoji) => {
                        setShowEmojis(false);
                        void setEmoji(emoji);
                      }}
                    ></ReactionBarSelector>
                  </div>
                  <div
                    className={`h-[450px] max-w-[345px] rounded-lg ${
                      darkMode ? "bg-[#212121]" : "bg-[#fff]"
                    }`}
                  >
                    {showEmojis && (
                      <EmojiPicker
                        theme={darkMode ? Theme.DARK : Theme.LIGHT}
                        width={"345px"}
                        onEmojiClick={(emoji) => {
                          void setFieldValue(
                            "message",
                            `${values.message}${emoji.emoji}`
                          );
                        }}
                      />
                    )}
                  </div>
                </div>
              }
            </Form>
          )}
        </Formik>
      </div>
    </div>
  );
};
