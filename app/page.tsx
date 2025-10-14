"use client";

import { Button } from "@/components/ui/button";
import { getDocs, setDoc, collection } from "firebase/firestore";
import { db, deleteDocument } from "@/lib/firebase";
import { doc } from "firebase/firestore";
import { getOrCreateUserId } from "@/lib/utils";
import { useEffect, useRef, useState } from "react";
import { animate } from "motion";
import Image from "next/image";

export default function Home() {
  const logoRef = useRef<HTMLDivElement | null>(null);
  const [activeGames, setActiveGames] = useState<
    Array<{ id: string; users?: string[]; [key: string]: unknown }>
  >([]);

  const createGame = async (): Promise<string> => {
    const newDoc = doc(db, "games", Math.random().toString(36).substring(2, 6));
    await setDoc(newDoc, {
      users: [getOrCreateUserId()],
      word: "",
      creator: getOrCreateUserId(),
      impostor: "",
      start: false,
    });

    return newDoc.id;
  };

  const fetchGames = async () => {
    const games = await getDocs(collection(db, "games"));
    setActiveGames(games.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
  };

  useEffect(() => {
    getOrCreateUserId();
    fetchGames();
  }, []);

  useEffect(() => {
    if (!logoRef.current) return;
    const frames = {
      transform: [
        "translateY(-12px) rotate(-8deg)",
        "translateY(12px) rotate(8deg)",
        "translateY(-12px) rotate(-8deg)",
      ],
    };
    const options = {
      duration: 8,
      easing: "ease-in-out",
      iterations: Infinity,
    };
    const controls = animate(logoRef.current as Element, frames, options);

    return () => {
      controls.stop();
    };
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 gap-6 sm:gap-8">
      <div className="text-center space-y-2">
        <div
          ref={logoRef}
          className="mx-auto w-24 h-24 sm:w-28 sm:h-28 select-none"
        >
          <Image
            src="/app-logo.svg"
            alt="Impostor Game Logo"
            width={112}
            height={112}
            className="w-full h-full"
            draggable={false}
            priority
          />
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold text-foreground">
          Imposter Game
        </h1>
        <p className="text-muted-foreground text-sm sm:text-base">
          A fun word guessing game
        </p>
      </div>

      <div>
        <div className="flex flex-col">
          <h2 className="mb-2 text-lg font-semibold text-center">
            Join Active Game
          </h2>
          <div className="flex flex-col gap-2">
            {activeGames.map((doc, idx) => {
              if (doc.users && doc.users.length > 0) {
                return (
                  <Button
                    key={idx}
                    variant="outline"
                    className="w-full font-mono font-bold text-lg"
                    onClick={() => {
                      window.location.href = `/${doc.id}/play`;
                    }}
                  >
                    {doc.id}
                  </Button>
                );
              } else {
                deleteDocument("games", doc.id);
              }
              return null; // Don't render anything if condition fails
            })}
          </div>
          <Button
            variant={"outline"}
            className="w-fit h-fit mx-auto mt-2"
            onClick={fetchGames}
          >
            Reload
          </Button>
        </div>
        <div className="text-center">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase my-4">
              <span className="bg-background px-2 text-muted-foreground">
                Or
              </span>
            </div>
          </div>
        </div>

        <Button
          onClick={async () => {
            const id = await createGame();
            window.location.href = `/${id}`;
          }}
          className="w-full h-12 text-base font-medium"
          size="lg"
        >
          Create New Game
        </Button>
      </div>
      <footer className="fixed bottom-2 left-0 right-0 flex justify-center pointer-events-none">
        <span className="text-xs text-muted-foreground select-none">
          v0.1.2 (Imposter + Word Overhaul)
        </span>
      </footer>
    </div>
  );
}
