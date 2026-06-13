import { Formik, Form, Field } from "formik";
import { type User } from "next-auth";
import { signOut } from "next-auth/react";
import Link from "next/link";
import React, { type PropsWithChildren, type FC } from "react";
import { z } from "zod";
import { toFormikValidationSchema } from "zod-formik-adapter";
import { useAppContext } from "../context/AppContext";
import type { RoomWithVideoActivity } from "../pages/rooms/[id]";
import { api } from "../utils/api";
import { Maximize2, Minimize2, Globe, Sun, Moon } from "lucide-react";
import { useOptionalWebSocket } from "../context/WebSocketContext";

interface Props {
  user: User;
  room?: RoomWithVideoActivity;
}

const urlSchema = z.object({
  url: z.string().url("Must be a valid URL"),
});

export const Layout: FC<PropsWithChildren<Props>> = ({
  user,
  children,
  room,
}) => {
  const updateURLMutation = api.video.updateUrl.useMutation();
  const ws = useOptionalWebSocket();

  const { darkMode, updateDarkMode, fullscreen, updateFullscreen } =
    useAppContext();

  async function updateURL(newUrl: string) {
    if (room)
      await updateURLMutation
        .mutateAsync({
          id: room.videoActivity.id,
          url: newUrl,
        })
        .then((newVideoActivity) => {
          document.getElementById("my-modal-4")?.click();
          ws?.sendBroadcast("VIDEO_STATE_UPDATED", { videoActivity: newVideoActivity });
        });
  }

  return (
    <div className={`relative flex min-h-screen w-full flex-col items-center justify-start overflow-x-hidden ${darkMode ? "bg-cosmic-grid text-slate-100" : "bg-cosmic-grid-light text-slate-900"
      }`}>
      {/* Floating Header */}
      <div
        className={`w-full px-4 pt-4 transition-all duration-300 ${fullscreen
          ? "absolute top-0 left-0 right-0 z-40 opacity-0 hover:opacity-100"
          : "relative"
          }`}
      >
        <div className={`navbar rounded-2xl shadow-xl transition-all border ${darkMode ? "glass-panel text-slate-100" : "glass-panel-light text-slate-900"
          }`}>
          {/* Brand/Logo */}
          <div className="flex-1">
            <Link href={"/"} className="btn btn-ghost normal-case text-xl font-black gap-2 hover:bg-transparent hover:scale-105 active:scale-95 transition-all">
              <span className="text-2xl animate-float">🐥</span>
              <span className="bg-gradient-to-r from-yellow-400 to-amber-500 bg-clip-text text-transparent">
                Ducki Party
              </span>
            </Link>
          </div>

          {/* Nav Controls */}
          <div className="flex items-center gap-2 pr-1">
            {/* Fullscreen Toggle */}
            <div className="hidden md:inline-block tooltip tooltip-bottom" data-tip="Toggle Fullscreen">
              <label className="btn btn-ghost btn-circle hover:bg-slate-700/10 dark:hover:bg-slate-300/10 transition-all">
                <input
                  type="checkbox"
                  title="fullscreen"
                  name="fullscreen"
                  id="fullscreen"
                  className="hidden"
                  checked={!fullscreen}
                  onChange={() => void updateFullscreen(!fullscreen)}
                />
                {fullscreen ? (
                  <Minimize2 className="h-5 w-5" />
                ) : (
                  <Maximize2 className="h-5 w-5" />
                )}
              </label>
            </div>

            {/* Room Settings URL Trigger */}
            {room && room.type == "VIDEO" && (
              <div className="tooltip tooltip-bottom" data-tip="Change Video URL">
                <label
                  htmlFor="my-modal-4"
                  className="btn btn-ghost btn-circle hover:bg-slate-700/10 dark:hover:bg-slate-300/10 cursor-pointer transition-all"
                >
                  <Globe className="h-5 w-5" />
                </label>
              </div>
            )}

            {/* Dark Mode Toggle */}
            {!fullscreen && (
              <div className="tooltip tooltip-bottom" data-tip={darkMode ? "Switch to Light" : "Switch to Dark"}>
                <button
                  type="button"
                  onClick={() => updateDarkMode(!darkMode)}
                  className="btn btn-ghost btn-circle hover:bg-slate-700/10 dark:hover:bg-slate-300/10 transition-all"
                >
                  {darkMode ? "☀️" : "🌙"}
                </button>
              </div>
            )}

            {/* User Dropdown */}
            <div className="dropdown dropdown-end">
              <label tabIndex={0} className="btn btn-ghost btn-circle avatar hover:scale-105 active:scale-95 transition-all focus:outline-none">
                <div className="w-9 h-9 rounded-full ring-2 ring-primary/40 hover:ring-primary/70 ring-offset-2 ring-offset-base-100 overflow-hidden shadow-lg transition-all duration-300 flex items-center justify-center">
                  {user.image ? (
                    <img src={user.image} alt={user.name ?? "User"} referrerPolicy="no-referrer" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-yellow-400 to-amber-600 flex items-center justify-center font-black text-slate-950 text-sm tracking-wider">
                      {user.name ? user.name[0]?.toUpperCase() : "🐥"}
                    </div>
                  )}
                </div>
              </label>
              <ul
                tabIndex={0}
                className={`dropdown-content menu menu-sm rounded-xl mt-3 w-52 p-2 shadow-2xl border z-50 ${darkMode
                  ? "bg-slate-900 border-slate-800 text-slate-200"
                  : "bg-white border-slate-200 text-slate-800"
                  }`}
              >
                <li className="menu-title font-bold px-3 py-1 text-xs opacity-60">Signed in as</li>
                <li className="px-3 py-1 font-semibold text-sm truncate max-w-full text-primary">
                  {user.name}
                </li>
                <div className="h-px bg-slate-700/10 dark:bg-slate-300/10 my-1"></div>
                <li>
                  <button
                    type="button"
                    onClick={() => void signOut()}
                    className="hover:bg-error/10 hover:text-error transition"
                  >
                    Logout
                  </button>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className={`flex w-full grow flex-col justify-start overflow-y-auto ${fullscreen ? "p-0" : "p-4"
        }`}>
        {children}
      </div>

      {/* UPDATE URL MODAL */}
      <input type="checkbox" id="my-modal-4" className="modal-toggle" />
      <label htmlFor="my-modal-4" className="modal cursor-pointer backdrop-blur-sm bg-black/40">
        <label className={`modal-box relative border  shadow-2xl ${darkMode ? "glass-panel text-slate-100" : "glass-panel-light text-slate-900"
          }`} htmlFor="">
          <div className="flex flex-col mb-3 items-center justify-between gap-3 p-3 rounded-xl bg-base-300/40 border border-base-300 text-xs shadow-inner">
            <div className="flex items-center gap-2.5">
              <span className="text-lg">💡</span>
              <div>
                <span className="font-bold">Pro-Tip:</span> Paste direct video stream links (.mp4, .m3u8). Use the <strong className="text-primary">FetchV Downloader</strong> Chrome extension to extract URLs from any streaming site.
              </div>
            </div>
            <a
              href="https://chromewebstore.google.com/detail/fetchv-video-downloader-f/nfmmmhanepmpifddlkkmihkalkoekpfd?hl=en-US&utm_source=ext_sidebar"
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-xs btn-primary text-slate-950 font-bold hover:scale-105 transition-all shrink-0"
            >
              Get Extension 🔌
            </a>
          </div>
          <div>
            <h3 className="text-xl font-black tracking-tight mb-2">Update Video URL</h3>
            <p className="text-sm opacity-75 mb-4">
              Change the current video source for everyone in the room. Real-time synchronization is preserved.
            </p>
          </div>


          <Formik
            initialValues={{ url: "" }}
            validationSchema={toFormikValidationSchema(urlSchema)}
            onSubmit={async (values, { setSubmitting, resetForm }) => {
              await updateURL(values.url);
              resetForm();
              setSubmitting(false);
            }}
          >
            {({ isSubmitting, errors }) => (
              <Form className="flex flex-col gap-3">

                <div className="form-control w-full">
                  <Field
                    className={`input input-bordered focus:input-primary transition-all duration-200 ${darkMode
                      ? "bg-slate-950/40 border-slate-700/50 text-slate-200"
                      : "bg-white border-slate-300 text-slate-900"
                      } ${errors.url ? "input-error" : ""}`}
                    type="text"
                    name="url"
                    placeholder="https://example.com/movie.mp4"
                    autoFocus
                  />
                  {errors.url && (
                    <label className="label-text-alt text-error mt-1.5 pl-1 font-semibold">
                      {errors.url as string}
                    </label>
                  )}
                </div>

                <div className="modal-action mt-4 gap-2">
                  <label htmlFor="my-modal-4" className="btn btn-ghost hover:bg-slate-700/10 dark:hover:bg-slate-300/10">
                    Cancel
                  </label>
                  <button
                    className="btn btn-primary text-slate-950 font-bold shadow-lg glow-primary hover:scale-[1.01] active:scale-[0.99] transition"
                    type="submit"
                    disabled={isSubmitting || typeof errors.url === "string"}
                  >
                    {isSubmitting ? (
                      <span className="loading loading-spinner"></span>
                    ) : (
                      "Update Video"
                    )}
                  </button>
                </div>

              </Form>
            )}
          </Formik>
        </label>
      </label>
    </div>
  );
};
