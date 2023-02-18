import Head from "next/head";
import type { FC, PropsWithChildren } from "react";
import { signIn, useSession } from "next-auth/react";
import { Layout } from "./Layout";
import { Toaster } from "react-hot-toast";
import { useAppContext } from "../context/AppContext";

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
  const { darkMode, fullscreen } = useAppContext();

  return (
    <>
      <Head>
        <title>{title}</title>
      </Head>
      <main>
        <Toaster />
        <div
          data-theme={
            fullscreen ? "halloween" : darkMode ? "dracula" : "bumblebee"
          }
        >
          {status === "loading" ? (
            <div className="flex h-screen w-screen flex-col items-center justify-center">
              <progress className="progress mx-auto w-56"></progress>
            </div>
          ) : (
            <div>
              {!sessionData?.user ? (
                <div className="flex min-h-screen flex-col items-center justify-center">
                  <div className="prose flex flex-col gap-4 text-center">
                    <h1>Ducki Party</h1>
                    <div>You need to sign in to view this website</div>
                    <button
                      className="btn-accent btn"
                      type="button"
                      onClick={() => void signIn()}
                    >
                      Sign in
                    </button>
                  </div>
                </div>
              ) : (
                <Layout user={sessionData.user} room={room}>
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
