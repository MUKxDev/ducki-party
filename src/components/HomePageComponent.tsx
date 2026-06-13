import { Formik, Form, Field, ErrorMessage } from "formik";
import { useRouter } from "next/router";
import React from "react";
import { toast } from "react-hot-toast";
import { z } from "zod";
import { toFormikValidationSchema } from "zod-formik-adapter";
import { api } from "../utils/api";
import { useAppContext } from "../context/AppContext";

export default function HomePageComponent() {
  const { push } = useRouter();
  const { darkMode } = useAppContext();
  const videoActivityMutation = api.rooms.createVideoActivity.useMutation();

  const urlSchema = z.object({
    url: z.string().url("Must be a valid video URL"),
  });
  const roomIdSchema = z.object({
    roomId: z.string().min(4, "Room code must be at least 4 characters"),
  });

  async function createVideoActivityRoom(url: string) {
    await toast
      .promise(
        videoActivityMutation.mutateAsync({
          url: url,
        }),
        {
          loading: "Creating room...",
          success: "Party room created!",
          error: "Failed to create the room",
        }
      )
      .then(async (videoActivity) => {
        await push(`/rooms/${videoActivity.roomId}`);
      });
  }

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-8 md:py-16">
      {/* Header Area */}
      <div className="text-center mb-12 md:mb-16">
        <h1 className="text-4xl font-black leading-tight tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
          <span className="block">Simplify the way you</span>
          <span className="relative mt-2 inline-block bg-gradient-to-r from-yellow-400 via-amber-400 to-orange-500 bg-clip-text text-transparent">
            hang together.
          </span>
        </h1>
        <p className={`mx-auto mt-4 max-w-lg text-sm sm:text-base md:text-lg opacity-75`}>
          Watch your favorite videos and movies with loved ones, synchronized in real-time. Simply create a room or type a code to join.
        </p>
      </div>

      {/* Cards Layout */}
      <div className="grid gap-8 md:grid-cols-2">
        {/* Card 1: Create Watch Party */}
        <div className={`card shadow-xl border transition-all duration-300 ${
          darkMode 
            ? "glass-panel hover:shadow-yellow-500/5 text-slate-100" 
            : "glass-panel-light hover:shadow-amber-500/5 text-slate-900"
        }`}>
          <div className="card-body p-6 md:p-8 justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="text-3xl">🎬</span>
                <h2 className="card-title text-xl font-bold">Start a Watch Party</h2>
              </div>
              <p className="text-sm opacity-75 mb-6">
                Paste any public video link (.mp4, YouTube, etc.) to set up a synchronized cinema.
              </p>
            </div>

            <Formik
              initialValues={{ url: "" }}
              validationSchema={toFormikValidationSchema(urlSchema)}
              onSubmit={async (values, { setSubmitting }) => {
                await createVideoActivityRoom(values.url);
                setSubmitting(false);
              }}
            >
              {({ isSubmitting, errors }) => (
                <Form className="flex flex-col gap-3">
                  <div className="form-control w-full">
                    <Field
                      className={`input input-bordered focus:input-primary transition-all duration-200 ${
                        darkMode 
                          ? "bg-slate-950/40 border-slate-700/50 text-slate-200" 
                          : "bg-white border-slate-300 text-slate-900"
                      } ${errors.url ? "input-error" : ""}`}
                      type="text"
                      name="url"
                      placeholder="https://example.com/movie.mp4"
                    />
                    <ErrorMessage
                      className="label-text-alt text-error mt-1.5 pl-1 font-semibold"
                      name="url"
                      component="label"
                    />
                  </div>

                  <button
                    className="btn btn-primary w-full text-slate-950 font-bold shadow-lg glow-primary hover:scale-[1.01] active:scale-[0.99] transition-all duration-200"
                    type="submit"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <span className="loading loading-spinner"></span>
                    ) : (
                      "Create Watch Room"
                    )}
                  </button>
                </Form>
              )}
            </Formik>
          </div>
        </div>

        {/* Card 2: Join Existing Room */}
        <div className={`card shadow-xl border transition-all duration-300 ${
          darkMode 
            ? "glass-panel hover:shadow-cyan-500/5 text-slate-100" 
            : "glass-panel-light hover:shadow-cyan-500/5 text-slate-900"
        }`}>
          <div className="card-body p-6 md:p-8 justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="text-3xl">🔑</span>
                <h2 className="card-title text-xl font-bold">Join an Existing Room</h2>
              </div>
              <p className="text-sm opacity-75 mb-6">
                Enter the short 5-character code sent by your friend to jump directly into their lobby.
              </p>
            </div>

            <Formik
              initialValues={{ roomId: "" }}
              validationSchema={toFormikValidationSchema(roomIdSchema)}
              onSubmit={async (values, { setSubmitting }) => {
                await push(`/rooms/${values.roomId.toUpperCase()}`);
                setSubmitting(false);
              }}
            >
              {({ isSubmitting, errors }) => (
                <Form className="flex flex-col gap-3">
                  <div className="form-control w-full">
                    <Field
                      className={`input input-bordered focus:input-secondary transition-all duration-200 uppercase ${
                        darkMode 
                          ? "bg-slate-950/40 border-slate-700/50 text-slate-200" 
                          : "bg-white border-slate-300 text-slate-900"
                      } ${errors.roomId ? "input-error" : ""}`}
                      type="text"
                      name="roomId"
                      placeholder="e.g. EM4XK"
                    />
                    <ErrorMessage
                      className="label-text-alt text-error mt-1.5 pl-1 font-semibold"
                      name="roomId"
                      component="label"
                    />
                  </div>

                  <button
                    className="btn btn-secondary w-full text-slate-950 font-bold shadow-lg glow-secondary hover:scale-[1.01] active:scale-[0.99] transition-all duration-200"
                    type="submit"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <span className="loading loading-spinner"></span>
                    ) : (
                      "Join Party Room"
                    )}
                  </button>
                </Form>
              )}
            </Formik>
          </div>
        </div>
      </div>
    </div>
  );
}
