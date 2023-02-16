import type { Chats, Rooms, User } from "@prisma/client";
import type {
  RealtimeChannel,
  RealtimePostgresChangesPayload,
} from "@supabase/supabase-js";
import type { FC } from "react";
import { useRef } from "react";
import { useState } from "react";
import { useEffect } from "react";
import React from "react";
import { supabase } from "../../context/supabase";
import { isObjectEmpty } from "../../utils/helpers";
import { useSession } from "next-auth/react";
import { Field, Form, Formik } from "formik";
import { toFormikValidationSchema } from "zod-formik-adapter";
import { z } from "zod";
import { api } from "../../utils/api";
import { useAppContext } from "../../context/AppContext";
import { ChatBubble } from "./ChatBubble";

const sound = "/audio/message.wav";

interface Props {
  room: Rooms;
}

type ChatWithUser = Chats & { user: User };

export const Chat: FC<Props> = ({ room }) => {
  const createChatMutation = api.chats.createChat.useMutation();
  const chatsMutation = api.chats.chatsByRoomId.useMutation();
  const chatByIdMutation = api.chats.chatById.useMutation();
  /* -------------------------------------------------------------------------- */
  /*                                   CONTEXT                                  */
  /* -------------------------------------------------------------------------- */
  const { data: session } = useSession();
  const { fullscreen } = useAppContext();

  const [chats, setChats] = useState<ChatWithUser[]>([]);
  const [firstChatsFetched, setFirstChatsFetched] = useState<boolean>(false);

  const chatContainerEndRef = useRef<HTMLDivElement>(null);
  const audioPlayer = useRef<HTMLAudioElement>(null);
  const chatSchema = z.object({
    message: z.string(),
  });

  useEffect(() => {
    chatContainerEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chats, fullscreen]);

  useEffect(() => {
    let subscription: RealtimeChannel;
    if (room.id) {
      subscription = supabase
        .channel("public:Chats")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "Chats",
            filter: `roomId=eq.${room.id}`,
          },
          (payload: RealtimePostgresChangesPayload<Chats>) => {
            if (!isObjectEmpty(payload.new)) {
              const newChat = payload.new as Chats;
              if (newChat.userId !== session?.user?.id) {
                void getChatWithUser(newChat.id).then(() => void playAudio());
              } else {
                const newChatToAdd = Object.assign(Object.create(newChat), {
                  user: session.user,
                }) as ChatWithUser;
                setChats((chats) => [...chats, newChatToAdd]);
              }
            }
          }
        )
        .subscribe();
    }

    async function getChatWithUser(id: string) {
      const newChatToAdd = await chatByIdMutation.mutateAsync({ id: id });
      console.table(newChatToAdd);

      if (newChatToAdd) {
        setChats((chats) => [...chats, newChatToAdd]);
      }
    }

    return () => {
      void subscription?.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [room.id, session?.user?.id]);

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
    await audioPlayer.current?.play();
  }

  async function sendChat(message: string) {
    await createChatMutation.mutateAsync({
      message: message,
      roomId: room.id,
    });
  }

  return (
    <div className="h-full grow">
      <audio ref={audioPlayer} src={sound} />
      <div className="group flex h-full flex-col justify-between">
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
            await sendChat(values.message);
            setSubmitting(false);
          }}
        >
          {({ isSubmitting, errors }) => (
            <Form
              className={`flex min-h-fit ${
                fullscreen
                  ? "opacity-5 duration-150 focus-within:opacity-60 group-hover:opacity-60"
                  : ""
              }`}
            >
              <div className="flex w-full flex-col">
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
            </Form>
          )}
        </Formik>
      </div>
    </div>
  );
};
