import { Formik, Form, Field, ErrorMessage } from "formik";
import { useRouter } from "next/router";
import React from "react";
import { toast } from "react-hot-toast";
import { z } from "zod";
import { toFormikValidationSchema } from "zod-formik-adapter";
import { api } from "../utils/api";

export default function HomePageComponent() {
  const { push } = useRouter();

  const videoActivityMutation = api.rooms.createVideoActivity.useMutation();

  const urlSchema = z.object({
    url: z.string(),
  });
  const roomIdSchema = z.object({
    roomId: z.string(),
  });

  async function createVideoActivityRoom(url: string) {
    const videoActivity = await toast.promise(
      videoActivityMutation.mutateAsync({
        url: url,
      }),
      {
        loading: "Loading...",
        success: "Room created!",
        error: "Failed to create the room",
      }
    );
    console.log(videoActivity);
  }

  return (
    <div>
      <div>
        <h1 className="text-center text-4xl font-extrabold leading-10 tracking-tight text-white sm:text-5xl sm:leading-none md:text-6xl xl:text-7xl">
          <span className="block">Simplify the way you</span>{" "}
          <span className="relative mt-3 inline-block text-white">
            hang together
          </span>
        </h1>
        <div
          className="mx-auto mt-6 max-w-lg text-center text-sm text-indigo-200 sm:text-base md:mt-12 md:max-w-xl md:text-lg xl:text-xl"
          data-primary="indigo-200"
        >
          this simple website was built by Ducki to help you do activities with
          your loved ones like watching your favorite movies and TV shows
          together. (manga coming soon)
        </div>
      </div>
      <div className="mx-auto mt-20 flex max-w-xl flex-col items-center gap-6">
        <Formik
          initialValues={{ url: "" }}
          validationSchema={toFormikValidationSchema(urlSchema)}
          onSubmit={async (values, { setSubmitting }) => {
            await createVideoActivityRoom(values.url);

            setSubmitting(false);
          }}
        >
          {({ isSubmitting, errors }) => (
            <Form className="flex">
              <div className="flex flex-col">
                <Field
                  className={`input-bordered input rounded-r-none ${
                    errors.url ? "input-error" : ""
                  }`}
                  type="text"
                  name="url"
                  placeholder="URL"
                />
                <ErrorMessage
                  className="label-text-alt text-error"
                  name="url"
                  component="label"
                />
              </div>

              <button
                className={`btn-primary btn rounded-l-none ${
                  isSubmitting ? "loading" : ""
                }`}
                type="submit"
                disabled={isSubmitting}
              >
                Watch
              </button>
            </Form>
          )}
        </Formik>

        <div className="divider">OR</div>
        <Formik
          initialValues={{ roomId: "" }}
          validationSchema={toFormikValidationSchema(roomIdSchema)}
          onSubmit={async (values, { setSubmitting }) => {
            await push(`/rooms/${values.roomId}`);
            setSubmitting(false);
          }}
        >
          {({ isSubmitting, errors }) => (
            <Form className="flex">
              <div className="flex flex-col">
                <Field
                  className={`input-bordered input rounded-r-none ${
                    errors.roomId ? "input-error" : ""
                  }`}
                  type="text"
                  name="roomId"
                  placeholder="Room Id"
                />
                <ErrorMessage
                  className="label-text-alt text-error"
                  name="roomId"
                  component="label"
                />
              </div>

              <button
                className={`btn-secondary btn rounded-l-none ${
                  isSubmitting ? "loading" : ""
                }`}
                type="submit"
                disabled={isSubmitting}
              >
                Join
              </button>
            </Form>
          )}
        </Formik>
      </div>
    </div>
  );
}
