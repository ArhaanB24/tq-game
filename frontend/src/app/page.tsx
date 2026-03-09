"use client";

import { useState, useCallback, useEffect } from "react";
import Link from "next/link";
import { floors } from "@/data/floors";
import {
  pickRandomRoom,
  pickRandom,
  getImageUrl,
  evaluateGuess,
  floorDisplayName,
  type GameRoom,
  type GuessResult,
} from "@/data/gameData";
import FloorMap from "@/components/FloorMap";

export default function Home() {
  const [rooms, setRooms] = useState<GameRoom[]>([]);
  const [currentRoom, setCurrentRoom] = useState<GameRoom | null>(null);
  const [currentImage, setCurrentImage] = useState<string | null>(null);
  const [phase, setPhase] = useState<"playing" | "result">("playing");
  const [activeFloorIdx, setActiveFloorIdx] = useState(9);
  const [selectedRoom, setSelectedRoom] = useState<string | null>(null);
  const [result, setResult] = useState<GuessResult | null>(null);
  const [guessFloorIdx, setGuessFloorIdx] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [round, setRound] = useState(0);
  const [mapOpen, setMapOpen] = useState(false);

  useEffect(() => {
    fetch("/api/rooms")
      .then((res) => res.json())
      .then((data: GameRoom[]) => {
        setRooms(data);
        if (data.length > 0) {
          const room = pickRandomRoom(data);
          const image = pickRandom(room.images);
          setCurrentRoom(room);
          setCurrentImage(image);
          setRound(1);
        }
      })
      .catch(() => setRooms([]));
  }, []);

  function startNewRound(prev: GameRoom | null) {
    if (rooms.length === 0) return;
    const room = pickRandomRoom(rooms, prev ?? undefined);
    const image = pickRandom(room.images);
    setCurrentRoom(room);
    setCurrentImage(image);
    setPhase("playing");
    setSelectedRoom(null);
    setResult(null);
    setGuessFloorIdx(null);
    setMapOpen(false);
    setRound((r) => r + 1);
  }

  const handleFloorChange = useCallback((idx: number) => {
    setActiveFloorIdx(idx);
    setSelectedRoom(null);
  }, []);

  const handleRoomClick = useCallback(
    (areaId: string) => {
      if (phase !== "playing" || !currentRoom) return;

      const activeFloor = floors[activeFloorIdx];
      const guessResult = evaluateGuess(
        activeFloor.floorNumber,
        areaId,
        currentRoom,
      );

      setSelectedRoom(areaId);
      setGuessFloorIdx(activeFloorIdx);
      setResult(guessResult);
      setPhase("result");

      if (guessResult.isCorrect) {
        setScore((s) => s + 1);
      }

      setTimeout(() => {
        setActiveFloorIdx(currentRoom.floorIdx);
      }, 300);
    },
    [phase, currentRoom, activeFloorIdx],
  );

  const handleNextRound = useCallback(() => {
    startNewRound(currentRoom);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentRoom, rooms]);

  if (!currentRoom || !currentImage) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-zinc-400 text-lg">Loading...</div>
      </div>
    );
  }

  const activeFloor = floors[activeFloorIdx];
  const showCorrectArea =
    phase === "result" && activeFloorIdx === currentRoom.floorIdx
      ? currentRoom.gridArea
      : null;
  const showWrongGuess =
    phase === "result" &&
    guessFloorIdx === activeFloorIdx &&
    selectedRoom !== currentRoom.gridArea
      ? selectedRoom
      : null;

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="mx-auto max-w-[960px] px-4 py-6">
        <header className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              College GeoGuesser
            </h1>
            <p className="mt-0.5 text-sm text-zinc-500">
              Guess the room from the photo
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/admin"
              className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              Admin
            </Link>
            <div className="text-sm text-zinc-400">
              Round{" "}
              <span className="text-zinc-200 font-semibold">{round}</span>
            </div>
            <div className="px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-sm">
              Score{" "}
              <span className="text-emerald-400 font-bold">
                {score}/{round}
              </span>
            </div>
          </div>
        </header>

        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
          <div className="relative w-full flex justify-center bg-black/40 rounded-lg overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={getImageUrl(currentImage)}
              alt="Guess this location"
              className="max-h-[480px] w-auto object-contain rounded-lg"
            />
          </div>

          <div className="mt-4 flex items-center justify-center gap-3">
            {phase === "playing" && (
              <button
                onClick={() => setMapOpen(true)}
                className="px-6 py-2.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-sm font-semibold transition-colors shadow-lg"
              >
                Make a Guess
              </button>
            )}
            {phase === "result" && (
              <button
                onClick={handleNextRound}
                className="px-6 py-2.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-sm font-semibold transition-colors"
              >
                Next Round &rarr;
              </button>
            )}
          </div>
        </div>
      </div>

      {mapOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget) setMapOpen(false);
          }}
        >
          <div className="relative w-full max-w-[900px] bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800">
              <div className="flex gap-1 rounded-lg bg-zinc-800 p-1 overflow-x-auto">
                {floors.map((floor, idx) => (
                  <button
                    key={floor.id}
                    onClick={() => handleFloorChange(idx)}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-150 whitespace-nowrap ${
                      idx === activeFloorIdx
                        ? "bg-zinc-600 text-white shadow-sm"
                        : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700"
                    }`}
                  >
                    {floor.name}
                  </button>
                ))}
              </div>
              <button
                onClick={() => setMapOpen(false)}
                className="ml-4 p-1.5 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
                aria-label="Close map"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <div className="relative p-5 overflow-x-auto">
              <FloorMap
                floor={activeFloor}
                selectedRoom={phase === "playing" ? selectedRoom : null}
                onRoomClick={handleRoomClick}
                correctArea={showCorrectArea}
                wrongGuessArea={showWrongGuess}
                revealed={phase === "result"}
                disabled={phase === "result"}
              />

              {phase === "result" && result && (
                <div className="absolute inset-0 flex items-end justify-center pb-5 pointer-events-none">
                  <div className="pointer-events-auto w-full max-w-md mx-4 rounded-xl shadow-2xl backdrop-blur-md border animate-in">
                    <ResultPopup result={result} onNextRound={handleNextRound} />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ResultPopup({
  result,
  onNextRound,
}: {
  result: GuessResult;
  onNextRound: () => void;
}) {
  const config = result.isCorrect
    ? {
        bg: "bg-emerald-950/90 border-emerald-500/40",
        title: "Correct!",
        titleColor: "text-emerald-300",
        textColor: "text-emerald-200/80",
        message: (
          <>
            That&apos;s the <strong>{result.correctRoom.name}</strong> on{" "}
            {floorDisplayName(result.correctRoom.floorNumber)}.
          </>
        ),
      }
    : result.isCorrectFloor
      ? {
          bg: "bg-amber-950/90 border-amber-500/40",
          title: "Right floor, wrong room!",
          titleColor: "text-amber-300",
          textColor: "text-amber-200/80",
          message: (
            <>
              The correct answer was{" "}
              <strong>{result.correctRoom.name}</strong> on{" "}
              {floorDisplayName(result.correctRoom.floorNumber)}.
            </>
          ),
        }
      : {
          bg: "bg-red-950/90 border-red-500/40",
          title: `Off by ${result.floorDiff} floor${result.floorDiff > 1 ? "s" : ""}!`,
          titleColor: "text-red-300",
          textColor: "text-red-200/80",
          message: (
            <>
              You guessed {floorDisplayName(result.guessedFloorNumber)}, but the
              correct answer was <strong>{result.correctRoom.name}</strong> on{" "}
              {floorDisplayName(result.correctRoom.floorNumber)}.
            </>
          ),
        };

  return (
    <div className={`p-4 rounded-xl ${config.bg}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <span className={`${config.titleColor} font-bold text-lg`}>
            {config.title}
          </span>
          <p className={`${config.textColor} text-sm mt-0.5`}>{config.message}</p>
        </div>
        <button
          onClick={onNextRound}
          className="shrink-0 px-5 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-sm font-semibold transition-colors"
        >
          Next Round &rarr;
        </button>
      </div>
    </div>
  );
}
