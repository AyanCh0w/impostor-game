"use client";

import { use, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Share2 } from "lucide-react";
import { getOrCreateUserId } from "@/lib/utils";
import {
  subscribeToDocument,
  setDocument,
  deleteDocument,
} from "@/lib/firebase";
import { GameDocument, GamePageProps } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { impostorWords } from "@/lib/words";

export default function GamePage({ params }: GamePageProps) {
  const { gameid } = use(params);
  const [userId, setUserId] = useState<string>("");

  const [gameData, setGameData] = useState<GameDocument | null>();

  useEffect(() => {
    const currentUserId = getOrCreateUserId();
    setUserId(currentUserId);

    // Subscribe to real-time updates
    const unsubscribe = subscribeToDocument("games", gameid, (data) => {
      setGameData(data as GameDocument | null);

      if (data?.data.creator !== currentUserId) {
        window.location.href = gameid + "/play";
      }
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, [gameid]);

  const startGame = (): void => {
    navigator.vibrate(30);
    const startedGame = gameData;
    if (startedGame) {
      startedGame.data.start = true;
      // Select a random word from the impostorWords array
      const randomWordIndex = Math.floor(Math.random() * impostorWords.length);
      startedGame.data.word = impostorWords[randomWordIndex];
      // Select a random user from the users array to be the impostor
      const userList = startedGame.data.users;
      const randomIndex = Math.floor(Math.random() * userList.length);
      startedGame.data.impostor = userList[randomIndex] || "";
      setDocument("games", gameid, startedGame.data);
    } else {
      console.error("Error starting game");
    }
  };

  const endGame = async (): Promise<void> => {
    navigator.vibrate(30);
    try {
      const result = await deleteDocument("games", gameid);
      if (result.success) {
        toast.success("Game ended successfully!");
        // Redirect to home page
        window.location.href = "/";
      } else {
        toast.error("Failed to end game. Please try again.");
      }
    } catch (error) {
      console.error("Error ending game:", error);
      toast.error("Failed to end game. Please try again.");
    }
  };

  return (
    <div className="flex flex-col min-h-screen p-4">
      <div className="max-w-md mx-auto w-full space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-2xl sm:text-3xl font-bold">Impostor Host</h1>
          <div className="bg-muted rounded-lg p-3">
            <p className="text-sm text-muted-foreground">Game Code</p>
            <p className="text-xl font-mono font-bold tracking-wider">
              {gameid}
            </p>
          </div>
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
                  <p className="font-bold text-lg">You are the IMPOSTOR!</p>
                  <p className="text-sm text-muted-foreground">
                    Try to figure out the word without revealing you don&apos;t
                    know it.
                  </p>
                </div>
              ) : (
                <div className="text-center space-y-2">
                  <p className="text-sm text-muted-foreground">The word is:</p>
                  <p className="text-2xl font-bold">{gameData.data.word}</p>
                </div>
              )}
            </div>

            <div className="space-y-3">
              <Button
                onClick={async () => {
                  if (gameData) {
                    const updatedData = { ...gameData.data, start: false };
                    await setDocument("games", gameid, updatedData);
                  }
                }}
                variant="outline"
                className="w-full h-12"
                size="lg"
              >
                Stop Game
              </Button>

              <Button
                onClick={endGame}
                variant="destructive"
                className="w-full h-12"
                size="lg"
              >
                End Game
              </Button>
            </div>
          </div>
        ) : (
          /* Game Setup State */
          <div className="space-y-6">
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

            <div className="space-y-3">
              <Button
                onClick={() => {
                  if (navigator.share) {
                    navigator.share({
                      title: `Join Game ${gameid}`,
                      text: `Join my imposter game!`,
                      url: window.location.href + "/play",
                    });
                  } else {
                    // Fallback for browsers that don't support Web Share API
                    navigator.clipboard.writeText(
                      window.location.href + "/play"
                    );
                    toast.success("Game link copied to clipboard!");
                  }
                }}
                variant="outline"
                className="w-full h-12 flex items-center justify-center gap-2"
                size="lg"
              >
                <Share2 className="h-4 w-4" />
                Share Game
              </Button>

              <Button
                onClick={startGame}
                className="w-full h-12 text-lg font-semibold"
                size="lg"
                disabled={!gameData || gameData.data.users.length < 3}
              >
                {!gameData || gameData.data.users.length < 3
                  ? `Need ${
                      3 - (gameData?.data.users.length || 0)
                    } more player${
                      3 - (gameData?.data.users.length || 0) === 1 ? "" : "s"
                    }`
                  : "Start Game"}
              </Button>

              <Button
                onClick={endGame}
                variant="destructive"
                className="w-full h-12"
                size="lg"
              >
                End Game
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
