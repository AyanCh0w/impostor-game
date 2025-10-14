import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { generateUsername } from "./nameMaker";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Just get or create a user ID using cookies, nothing fancy
export function getOrCreateUserId(): string {
  // Always return empty string during SSR to prevent hydration mismatch
  if (typeof window === "undefined") {
    return "";
  }

  let userId = "";
  // Get cookie value
  const cookies = document.cookie.split(";");
  const userIdCookie = cookies.find((cookie) =>
    cookie.trim().startsWith("userId=")
  );
  userId = userIdCookie ? userIdCookie.split("=")[1] : "";

  if (!userId) {
    console.log("CREATEING USERNAME");
    userId = generateUsername();
    // Set cookie with 1 year expiration
    document.cookie = `userId=${userId}; expires=${new Date(
      Date.now() + 365 * 24 * 60 * 60 * 1000
    ).toUTCString()}; path=/`;
  } else {
    console.log("ALREADY MADE USERNAME");
  }
  console.log(userId);
  return userId;
}
