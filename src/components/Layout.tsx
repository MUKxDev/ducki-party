import { Formik, Form, Field } from "formik";
import { type User } from "next-auth";
import { signOut } from "next-auth/react";
import Link from "next/link";
import React, { type PropsWithChildren, type FC, useState } from "react";
import { z } from "zod";
import { toFormikValidationSchema } from "zod-formik-adapter";
import { useAppContext } from "../context/AppContext";
import type { RoomWithVideoActivity } from "../pages/rooms/[id]";
import { api } from "../utils/api";
import Maximize from "../../public/icons/maximize.svg";
import Minimize from "../../public/icons/minimize.svg";

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

  const { darkMode, updateDarkMode, fullscreen, updateFullscreen } =
    useAppContext();

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
    <div className="relative flex h-screen w-full flex-col items-center justify-center">
      <div
        className={`w-full p-3 ${
          fullscreen
            ? "absolute top-0 z-20 opacity-0 duration-150 hover:opacity-90"
            : ""
        }`}
      >
        <div className="navbar rounded-xl bg-base-300">
          <div className="flex-1">
            <Link href={"/"} className="btn-ghost btn text-xl normal-case">
              Ducki Party
            </Link>
          </div>
          <div className="flex gap-3">
            <label className="swap-rotate swap btn-ghost btn-circle btn">
              <input
                type="checkbox"
                title="fullscreen"
                name="fullscreen"
                id="fullscreen"
                checked={!fullscreen}
                onChange={() => void updateFullscreen(!fullscreen)}
              />

              <Minimize className="swap-off fill-current"></Minimize>
              <Maximize className="swap-on fill-current"></Maximize>
            </label>

            {room && room.type == "VIDEO" && (
              <label htmlFor="my-modal-4" className="btn-ghost btn-circle btn">
                URL
              </label>
            )}
            <label className="swap-rotate swap btn-ghost btn-circle btn ">
              <input
                type="checkbox"
                title="darkMode"
                name="darkMode"
                id="darkMode"
                checked={!darkMode}
                onChange={() => updateDarkMode(!darkMode)}
              />

              <svg
                className="swap-on h-6 w-6 fill-current"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
              >
                <path d="M5.64,17l-.71.71a1,1,0,0,0,0,1.41,1,1,0,0,0,1.41,0l.71-.71A1,1,0,0,0,5.64,17ZM5,12a1,1,0,0,0-1-1H3a1,1,0,0,0,0,2H4A1,1,0,0,0,5,12Zm7-7a1,1,0,0,0,1-1V3a1,1,0,0,0-2,0V4A1,1,0,0,0,12,5ZM5.64,7.05a1,1,0,0,0,.7.29,1,1,0,0,0,.71-.29,1,1,0,0,0,0-1.41l-.71-.71A1,1,0,0,0,4.93,6.34Zm12,.29a1,1,0,0,0,.7-.29l.71-.71a1,1,0,1,0-1.41-1.41L17,5.64a1,1,0,0,0,0,1.41A1,1,0,0,0,17.66,7.34ZM21,11H20a1,1,0,0,0,0,2h1a1,1,0,0,0,0-2Zm-9,8a1,1,0,0,0-1,1v1a1,1,0,0,0,2,0V20A1,1,0,0,0,12,19ZM18.36,17A1,1,0,0,0,17,18.36l.71.71a1,1,0,0,0,1.41,0,1,1,0,0,0,0-1.41ZM12,6.5A5.5,5.5,0,1,0,17.5,12,5.51,5.51,0,0,0,12,6.5Zm0,9A3.5,3.5,0,1,1,15.5,12,3.5,3.5,0,0,1,12,15.5Z" />
              </svg>

              <svg
                className="swap-off h-6 w-6 fill-current"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
              >
                <path d="M21.64,13a1,1,0,0,0-1.05-.14,8.05,8.05,0,0,1-3.37.73A8.15,8.15,0,0,1,9.08,5.49a8.59,8.59,0,0,1,.25-2A1,1,0,0,0,8,2.36,10.14,10.14,0,1,0,22,14.05,1,1,0,0,0,21.64,13Zm-9.5,6.69A8.14,8.14,0,0,1,7.08,5.22v.27A10.15,10.15,0,0,0,17.22,15.63a9.79,9.79,0,0,0,2.1-.22A8.11,8.11,0,0,1,12.14,19.73Z" />
              </svg>
            </label>

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
