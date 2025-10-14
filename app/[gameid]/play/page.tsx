"use client";

import { use, useEffect } from "react";
import { db, subscribeToDocument } from "@/lib/firebase";
import { getOrCreateUserId } from "@/lib/utils";
import {
  doc,
  getDoc,
  updateDoc,
  arrayUnion,
  arrayRemove,
} from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";

import { GameDocument, GamePageProps } from "@/lib/types";
import { impostorPairs } from "@/lib/words";

export default function JoinGamePage({ params }: GamePageProps) {
  const { gameid } = use(params);

  const [gameData, setGameData] = useState<GameDocument | null>();
  const [userId, setUserId] = useState<string>("");

  useEffect(() => {
    // Set userId on client side to avoid hydration mismatch
    setUserId(getOrCreateUserId());

    // Subscribe to real-time updates
    const unsubscribe = subscribeToDocument("games", gameid, (data) => {
      setGameData(data as GameDocument | null);
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, [gameid]);

  // When the component mounts, add the user to the game doc
  useEffect(() => {
    async function joinGame() {
      const userId = getOrCreateUserId();
      const gameRef = doc(db, "games", gameid);
      const gameSnap = await getDoc(gameRef);

      if (gameSnap.exists()) {
        // Add the userId to the users array using arrayUnion to prevent duplicates
        await updateDoc(gameRef, {
          users: arrayUnion(userId),
        });
      }
    }

    joinGame();
  }, [gameid]);

  const leaveGame = async () => {
    try {
      const gameRef = doc(db, "games", gameid);
      await updateDoc(gameRef, {
        users: arrayRemove(userId),
      });
      window.location.href = "/";
    } catch (error) {
      console.error("Error leaving game:", error);
    }
  };

  return (
    <div className="flex flex-col min-h-screen p-4">
      <div className="max-w-md mx-auto w-full space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-2xl sm:text-3xl font-bold">Impostor Player</h1>
          <div className="bg-muted rounded-lg p-3">
            <p className="text-sm text-muted-foreground">Game Code</p>
            <p className="text-xl font-mono font-bold tracking-wider">
              {gameid}
            </p>
          </div>
          <p className="text-muted-foreground">
            Welcome,{" "}
            <span className="font-semibold text-foreground">{userId}</span>
          </p>
        </div>

        {gameData?.data.start ? (
          /* Game Started State */
          <div className="space-y-6">
            <div className="bg-muted border rounded-lg p-4 text-center">
              <p className="font-semibold text-lg">Game Started!</p>
            </div>

            <div className="bg-card border rounded-lg p-4 space-y-3">
              {gameData.data.impostor === userId ? (
                <div className="text-center space-y-2">
                  <p className="text-sm text-muted-foreground">The word is:</p>
                  <p className="text-2xl font-bold text-red-700">
                    {impostorPairs[gameData.data.wordIndex][0]}
                  </p>
                </div>
              ) : (
                <div className="text-center space-y-2">
                  <p className="text-sm text-muted-foreground">The word is:</p>
                  <p className="text-2xl font-bold">
                    {impostorPairs[gameData.data.wordIndex][0]}
                  </p>
                </div>
              )}
            </div>

            <Button
              onClick={leaveGame}
              variant="outline"
              className="w-full h-12"
              size="lg"
            >
              Leave Game
            </Button>
          </div>
        ) : (
          /* Waiting for Game to Start */
          <div className="space-y-6">
            {/* Last Game Word Display */}
            {gameData?.data.lastWord && (
              <div className="bg-muted border rounded-lg p-4 text-center">
                <p className="text-sm text-muted-foreground mb-1">
                  Last Game's Word
                </p>
                <p className="text-xl font-bold text-primary">
                  {gameData.data.lastWord}
                </p>
              </div>
            )}

            <div className="bg-muted border rounded-lg p-4 text-center">
              <p className="font-semibold">
                Waiting for host to start the game
              </p>
            </div>

            <div className="space-y-3">
              <h2 className="text-lg font-semibold text-center">
                Players ({gameData?.data.users.length || 0})
              </h2>
              {gameData && (
                <div className="space-y-2">
                  {gameData.data.users.map((s, idx) => (
                    <div
                      key={idx}
                      className="border rounded-lg p-3 flex items-center justify-between bg-card"
                    >
                      <span className="font-medium truncate">{s}</span>
                      <div className="flex gap-1 flex-shrink-0">
                        {s === gameData.data.creator ? (
                          <Badge variant="default" className="text-xs">
                            Host
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs">
                            Player
                          </Badge>
                        )}
                        {s === gameData.data.impostor && (
                          <Badge variant="destructive" className="text-xs">
                            Impostor
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <Button
              onClick={leaveGame}
              variant="outline"
              className="w-full h-12"
              size="lg"
            >
              Leave Game
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
