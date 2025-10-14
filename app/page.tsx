"use client";

import { Button } from "@/components/ui/button";
import { getDocs, setDoc, collection } from "firebase/firestore";
import { db, deleteDocument, getDocumentById } from "@/lib/firebase";
import { doc } from "firebase/firestore";
import { getOrCreateUserId } from "@/lib/utils";
import { useEffect, useState } from "react";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { toast } from "sonner";
import { GameData, GameDocument } from "@/lib/types";

export default function Home() {
  const [activeGames, setActiveGames] = useState<any[]>([]);

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

  useEffect(() => {
    getOrCreateUserId();

    const fetchGames = async () => {
      const games = await getDocs(collection(db, "games"));
      setActiveGames(games.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    };
    fetchGames();
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 gap-6 sm:gap-8">
      <div className="text-center space-y-2">
        <h1 className="text-3xl sm:text-4xl font-bold text-foreground">
          Imposter Game
        </h1>
        <p className="text-muted-foreground text-sm sm:text-base">
          A fun word guessing game
        </p>
      </div>

      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-3">
          <h2 className="text-lg sm:text-xl font-semibold">Join Game</h2>
          <p className="text-sm text-muted-foreground">
            Enter the 4-digit game code
          </p>
          <InputOTP
            maxLength={4}
            onComplete={async (value) => {
              const gameData = await getDocumentById("games", value);
              if (gameData) {
                window.location.href = `/${value}/play`;
              } else {
                toast.error("Game not found");
              }
            }}
            className="justify-center"
          >
            <InputOTPGroup className="mx-auto">
              <InputOTPSlot index={0} className="w-12 h-12 text-lg" />
              <InputOTPSlot index={1} className="w-12 h-12 text-lg" />
              <InputOTPSlot index={2} className="w-12 h-12 text-lg" />
              <InputOTPSlot index={3} className="w-12 h-12 text-lg" />
            </InputOTPGroup>
          </InputOTP>
        </div>

        <div className="text-center">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Or
              </span>
            </div>
          </div>
        </div>

        <div>
          <h2 className="mb-2 text-lg font-semibold text-center">
            Join Active Game
          </h2>
          <div className="flex flex-col gap-2">
            {activeGames.map((doc, idx) => {
              if (doc.users.length > 0) {
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
        </div>
        <div className="text-center">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
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
    </div>
  );
}
