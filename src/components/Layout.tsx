import { type User } from "next-auth";
import { signOut } from "next-auth/react";
import Link from "next/link";
import React, { type PropsWithChildren, type FC } from "react";
import { useAppContext } from "../context/AppContext";

interface Props {
  user: User;
}

export const Layout: FC<PropsWithChildren<Props>> = ({ user, children }) => {
  const { darkMode, updateDarkMode } = useAppContext();

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
    </div>
  );
};
