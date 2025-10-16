"use client";

import { use, useEffect } from "react";
import { db, subscribeToDocument, setDocument } from "@/lib/firebase";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Edit3, User } from "lucide-react";

import { GameDocument, GamePageProps } from "@/lib/types";
import { impostorPairs, getWordPairsByTheme, ThemeKey } from "@/lib/words";

export default function JoinGamePage({ params }: GamePageProps) {
  const { gameid } = use(params);

  const [gameData, setGameData] = useState<GameDocument | null>();
  const [userId, setUserId] = useState<string>("");
  const [isEditingName, setIsEditingName] = useState<boolean>(false);
  const [newName, setNewName] = useState<string>("");

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
        const gameData = gameSnap.data() as GameDocument["data"];

        // Initialize user names if not exists
        const userNames = gameData.userNames || {};
        if (!userNames[userId]) {
          userNames[userId] = userId; // Default to userId as display name
        }

        // Add the userId to the users array and update user names
        await updateDoc(gameRef, {
          users: arrayUnion(userId),
          userNames: userNames,
        });
      }
    }

    joinGame();
  }, [gameid]);

  const updatePlayerName = async () => {
    if (!newName.trim() || !gameData) return;

    try {
      const updatedUserNames = {
        ...gameData.data.userNames,
        [userId]: newName.trim(),
      };

      await setDocument("games", gameid, {
        ...gameData.data,
        userNames: updatedUserNames,
      });

      setIsEditingName(false);
      setNewName("");
    } catch (error) {
      console.error("Error updating name:", error);
    }
  };

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
          <h1 className="text-2xl sm:text-3xl font-bold">Odd 1 Out Player</h1>
          <div className="bg-muted rounded-lg p-3">
            <p className="text-sm text-muted-foreground">Game Code</p>
            <p className="text-xl font-mono font-bold tracking-wider">
              {gameid}
            </p>
          </div>
          <div className="flex items-center justify-center gap-2">
            <p className="text-muted-foreground">
              Welcome,{" "}
              <span className="font-semibold text-foreground">
                {gameData?.data.userNames?.[userId] || userId}
              </span>
            </p>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setIsEditingName(true);
                setNewName(gameData?.data.userNames?.[userId] || userId);
              }}
              className="h-6 w-6 p-0"
            >
              <Edit3 className="h-3 w-3" />
            </Button>
          </div>

          {/* Name Edit Modal */}
          {isEditingName && (
            <Card className="mt-4">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Change Your Name
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="player-name">Display Name</Label>
                  <Input
                    id="player-name"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="Enter your name"
                    maxLength={20}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        updatePlayerName();
                      } else if (e.key === "Escape") {
                        setIsEditingName(false);
                        setNewName("");
                      }
                    }}
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={updatePlayerName}
                    size="sm"
                    className="flex-1"
                  >
                    Save
                  </Button>
                  <Button
                    onClick={() => {
                      setIsEditingName(false);
                      setNewName("");
                    }}
                    variant="outline"
                    size="sm"
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {gameData?.data.start ? (
          /* Game Started State */
          <div className="space-y-6">
            <div className="bg-muted border rounded-lg p-4 text-center">
              <p className="font-semibold text-lg">Game Started!</p>
            </div>

            {/* Impostor Status Card */}
            {gameData.data.impostors?.includes(userId) && (
              <Card className="border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-800">
                <CardContent className="p-4 text-center">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                    <p className="font-bold text-red-700 dark:text-red-400 text-lg">
                      YOU ARE THE ODD ONE OUT!
                    </p>
                    <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                  </div>
                  <p className="text-sm text-red-600 dark:text-red-300">
                    You have a different word than everyone else. Try to blend
                    in!
                  </p>
                </CardContent>
              </Card>
            )}

            <div className="bg-card border rounded-lg p-4 space-y-3">
              {gameData.data.impostors?.includes(userId) ? (
                <div className="text-center space-y-2">
                  <p className="text-sm text-muted-foreground">Your word is:</p>
                  <p className="text-2xl font-bold text-red-700">
                    {
                      getWordPairsByTheme(
                        (gameData.data.theme as ThemeKey) || "random"
                      )[gameData.data.wordIndex][1]
                    }
                  </p>
                  <p className="text-xs text-muted-foreground">
                    (Everyone else has a different word)
                  </p>
                </div>
              ) : (
                <div className="text-center space-y-2">
                  <p className="text-sm text-muted-foreground">The word is:</p>
                  <p className="text-2xl font-bold">
                    {
                      getWordPairsByTheme(
                        (gameData.data.theme as ThemeKey) || "random"
                      )[gameData.data.wordIndex][0]
                    }
                  </p>
                  <p className="text-xs text-muted-foreground">
                    (Find the odd one out with a different word!)
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
                  Last Game&apos;s Word
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
                      <span className="font-medium truncate">
                        {gameData.data.userNames?.[s] || s}
                      </span>
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
                        {gameData.data.impostors?.includes(s) && (
                          <Badge variant="destructive" className="text-xs">
                            Odd One Out
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
