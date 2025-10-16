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
import {
  impostorPairs,
  getWordPairsByTheme,
  themes,
  ThemeKey,
} from "@/lib/words";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function GamePage({ params }: GamePageProps) {
  const { gameid } = use(params);
  const [userId, setUserId] = useState<string>("");
  const [gameData, setGameData] = useState<GameDocument | null>();

  // Game settings state
  const [impostorCount, setImpostorCount] = useState<number>(1);
  const [selectedTheme, setSelectedTheme] = useState<ThemeKey>("random");

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
    const startedGame = gameData;
    if (startedGame) {
      const userList = startedGame.data.users;
      const wordPairs = getWordPairsByTheme(selectedTheme);

      // Select a random word pair index from the selected theme
      const randomWordIndex = Math.floor(Math.random() * wordPairs.length);

      // Select random impostors based on the count
      const shuffledUsers = [...userList].sort(() => Math.random() - 0.5);
      const selectedImpostors = shuffledUsers.slice(
        0,
        Math.min(impostorCount, userList.length)
      );

      // Initialize user names if not exists
      const userNames: Record<string, string> =
        startedGame.data.userNames || {};
      userList.forEach((userId) => {
        if (!userNames[userId]) {
          userNames[userId] = userId; // Default to userId as display name
        }
      });

      startedGame.data.start = true;
      startedGame.data.wordIndex = randomWordIndex;
      startedGame.data.impostor = selectedImpostors[0] || ""; // Keep for backward compatibility
      startedGame.data.impostors = selectedImpostors;
      startedGame.data.impostorCount = impostorCount;
      startedGame.data.theme = selectedTheme;
      startedGame.data.userNames = userNames;

      setDocument("games", gameid, startedGame.data);
    } else {
      console.error("Error starting game");
    }
  };

  const endGame = async (): Promise<void> => {
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
          <h1 className="text-2xl sm:text-3xl font-bold">Odd 1 Out Host</h1>
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
              {gameData.data.impostors?.includes(userId) ? (
                <div className="text-center space-y-2">
                  <p className="text-sm text-muted-foreground">The word is:</p>
                  <p className="text-2xl font-bold text-red-700">
                    {
                      getWordPairsByTheme(
                        (gameData.data.theme as ThemeKey) || "random"
                      )[gameData.data.wordIndex][1]
                    }
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
                </div>
              )}
            </div>

            <div className="space-y-3">
              <Button
                onClick={async () => {
                  if (gameData) {
                    // Store the current word as the last word when stopping the game
                    const currentWord = getWordPairsByTheme(
                      (gameData.data.theme as ThemeKey) || "random"
                    )[gameData.data.wordIndex][0];
                    const updatedData = {
                      ...gameData.data,
                      start: false,
                      lastWord: currentWord,
                    };
                    await setDocument("games", gameid, updatedData);
                  }
                }}
                variant="outline"
                className="w-full h-12"
                size="lg"
              >
                Stop Game
              </Button>
            </div>
          </div>
        ) : (
          /* Game Setup State */
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

            {/* Game Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Game Settings</CardTitle>
                <CardDescription>
                  Configure your game before starting
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Impostor Count Toggle */}
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label
                      htmlFor="impostor-count"
                      className="text-sm font-medium"
                    >
                      Number of Odd Ones Out
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      {impostorCount === 1
                        ? "1 Odd One Out (Classic)"
                        : impostorCount === 2
                        ? "2 Odd Ones Out (Recommended for 6+ players)"
                        : "3 Odd Ones Out (For large groups)"}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setImpostorCount(Math.max(1, impostorCount - 1))
                      }
                      disabled={impostorCount <= 1}
                    >
                      -
                    </Button>
                    <span className="w-8 text-center font-medium">
                      {impostorCount}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setImpostorCount(Math.min(3, impostorCount + 1))
                      }
                      disabled={
                        impostorCount >= 3 ||
                        (gameData?.data.users.length || 0) < 6
                      }
                    >
                      +
                    </Button>
                  </div>
                </div>

                {/* Theme Selector */}
                <div className="space-y-2">
                  <Label htmlFor="theme-select" className="text-sm font-medium">
                    Game Theme
                  </Label>
                  <Select
                    value={selectedTheme}
                    onValueChange={(value: ThemeKey) => setSelectedTheme(value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a theme" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(themes).map(([key, label]) => (
                        <SelectItem key={key} value={key}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

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
