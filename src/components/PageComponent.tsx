import Head from "next/head";
import type { FC, PropsWithChildren } from "react";
import { signIn, useSession } from "next-auth/react";
import { Layout } from "./Layout";
import { Toaster } from "react-hot-toast";
import { useAppContext } from "../context/AppContext";
import { WebSocketProvider } from "../context/WebSocketContext";

import type { RoomWithVideoActivity } from "../pages/rooms/[id]";

export interface Props {
  title: string;
  room?: RoomWithVideoActivity;
}

const PageComponent: FC<PropsWithChildren<Props>> = ({
  title,
  children,
  room,
}) => {
  const { data: sessionData, status } = useSession();
  const { darkMode } = useAppContext();

  return (
    <>
      <Head>
        <title>{title}</title>
      </Head>
      <main>
        <Toaster
          toastOptions={{
            style: {
              background: darkMode ? "rgba(17, 24, 39, 0.85)" : "rgba(255, 255, 255, 0.85)",
              color: darkMode ? "#f8fafc" : "#0f172a",
              backdropFilter: "blur(12px)",
              border: darkMode ? "1px solid rgba(255, 255, 255, 0.08)" : "1px solid rgba(0, 0, 0, 0.06)",
              borderRadius: "12px",
            },
          }}
        />
        <div
          data-theme={darkMode ? "ducki-dark" : "ducki-light"}
          className={`min-h-screen w-full transition-colors duration-300 ${
            darkMode ? "bg-cosmic-grid text-slate-100" : "bg-cosmic-grid-light text-slate-900"
          }`}
        >
          {status === "loading" ? (
            <div className="flex h-screen w-screen flex-col items-center justify-center">
              <span className="loading loading-ring loading-lg text-primary scale-150"></span>
            </div>
          ) : (
            <div className="min-h-screen w-full">
              {!sessionData?.user ? (
                <div className="flex min-h-screen flex-col items-center justify-center p-4">
                  <div className={`card w-full max-w-md p-8 text-center shadow-2xl border ${
                    darkMode ? "glass-panel text-slate-100" : "glass-panel-light text-slate-900"
                  }`}>
                    <span className="text-6xl mb-4 animate-bounce inline-block">🐥</span>
                    <h1 className="text-3xl font-extrabold mb-2 bg-gradient-to-r from-yellow-400 to-amber-500 bg-clip-text text-transparent">
                      Ducki Party
                    </h1>
                    <p className="text-sm opacity-75 mb-6">
                      Hang out, chat, and watch videos together.
                    </p>
                    <button
                      className="btn btn-primary w-full text-slate-950 font-bold shadow-lg glow-primary hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
                      type="button"
                      onClick={() => void signIn()}
                    >
                      Sign in to Enter
                    </button>
                  </div>
                </div>
              ) : room ? (
                <WebSocketProvider roomId={room.id} userId={sessionData.user.id} userName={sessionData.user.name || undefined}>
                  <Layout user={sessionData.user} room={room}>
                    {children}
                  </Layout>
                </WebSocketProvider>
              ) : (
                <Layout user={sessionData.user}>
                  {children}
                </Layout>
              )}
            </div>
          )}
        </div>
      </main>
    </>
  );
};

export default PageComponent;
