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

interface Props {
  user: User;
  room?: RoomWithVideoActivity;
}

const urlSchema = z.object({
  url: z.string(),
});

export const Layout: FC<PropsWithChildren<Props>> = ({
  user,
  children,
  room,
}) => {
  const updateURLMutation = api.video.updateUrl.useMutation();

  const { darkMode, updateDarkMode } = useAppContext();

  async function updateURL(newUrl: string) {
    if (room)
      await updateURLMutation
        .mutateAsync({
          id: room.videoActivity.id,
          url: newUrl,
        })
        .then(() => {
          document.getElementById("my-modal-4")?.click();
        });
  }

  return (
    <div className="flex h-screen flex-col items-center justify-center ">
      <div className="w-full p-3">
        <div className="navbar rounded-xl bg-base-300">
          <div className="flex-1">
            <Link href={"/"} className="btn-ghost btn text-xl normal-case">
              Ducki Party
            </Link>
          </div>
          <div className="flex gap-3">
            {room && room.type == "VIDEO" && (
              <label htmlFor="my-modal-4" className="btn-ghost btn-circle btn">
                URL
              </label>
            )}
            <input
              className={`toggle ${!darkMode ? "toggle-primary" : ""}`}
              type="checkbox"
              title="darkMode"
              name="darkMode"
              id="darkMode"
              checked={!darkMode}
              onChange={() => updateDarkMode(!darkMode)}
            />
            <div className="dropdown-end dropdown">
              <label tabIndex={0} className="btn-ghost btn-circle avatar btn">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  className="inline-block h-5 w-5 stroke-current"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z"
                  ></path>
                </svg>
              </label>
              <ul
                tabIndex={0}
                className="dropdown-content menu rounded-box menu-compact mt-3 w-52 bg-primary p-2 text-primary-content shadow"
              >
                <li>
                  <p>{user.name}</p>
                </li>
                <li>
                  <a>Settings</a>
                </li>
                <li>
                  <button type="button" onClick={() => void signOut()}>
                    Logout
                  </button>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
      {
        <div className="flex w-full grow flex-col justify-center overflow-y-hidden">
          {children}
        </div>
      }

      {/* UPDATE URL */}
      <input type="checkbox" id="my-modal-4" className="modal-toggle" />
      <label htmlFor="my-modal-4" className="modal cursor-pointer">
        <label className="modal-box relative" htmlFor="">
          <h3 className="text-lg font-bold">Update the URL of the video!</h3>
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
              <Form className="mt-3 flex min-h-fit">
                <div className="flex w-full flex-col">
                  <Field
                    className={`input-bordered input w-full rounded-r-none`}
                    type="text"
                    name="url"
                    placeholder="URL..."
                    autofocus
                  />
                </div>

                <button
                  className={`btn-primary btn rounded-l-none ${
                    isSubmitting ? "loading" : ""
                  }`}
                  type="submit"
                  disabled={isSubmitting || typeof errors.url === "string"}
                >
                  Update
                </button>
              </Form>
            )}
          </Formik>
        </label>
      </label>
    </div>
  );
};
