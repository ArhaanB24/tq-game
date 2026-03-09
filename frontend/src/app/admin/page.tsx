"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { floors, isClickable } from "@/data/floors";
import { getImageUrl, type GameRoom } from "@/data/gameData";

const ADMIN_USER = "kartikfaggot";
const ADMIN_PASS = "kartikfaggot";
const AUTH_KEY = "admin_authed";

function useAuth() {
  const [authed, setAuthed] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem(AUTH_KEY) === "1") setAuthed(true);
  }, []);

  function login(user: string, pass: string) {
    if (user === ADMIN_USER && pass === ADMIN_PASS) {
      sessionStorage.setItem(AUTH_KEY, "1");
      setAuthed(true);
      setError(false);
    } else {
      setError(true);
    }
  }

  return { authed, error, login };
}

function LoginGate({ onLogin, error }: { onLogin: (u: string, p: string) => void; error: boolean }) {
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
      <form
        onSubmit={(e) => { e.preventDefault(); onLogin(user, pass); }}
        className="w-full max-w-sm rounded-xl border border-zinc-800 bg-zinc-900/50 p-6"
      >
        <h1 className="text-xl font-bold text-zinc-100 mb-1">Admin Login</h1>
        <p className="text-sm text-zinc-500 mb-6">Enter credentials to continue</p>
        <input
          type="text"
          placeholder="Username"
          value={user}
          onChange={(e) => setUser(e.target.value)}
          className="w-full mb-3 bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5 text-sm text-zinc-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
        />
        <input
          type="password"
          placeholder="Password"
          value={pass}
          onChange={(e) => setPass(e.target.value)}
          className="w-full mb-4 bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5 text-sm text-zinc-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
        />
        {error && (
          <p className="text-red-400 text-sm mb-3">Invalid credentials.</p>
        )}
        <button
          type="submit"
          className="w-full py-2.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-semibold text-sm transition-colors"
        >
          Log in
        </button>
      </form>
    </div>
  );
}

export default function AdminPage() {
  const { authed, error, login } = useAuth();
  const [rooms, setRooms] = useState<GameRoom[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedFloor, setSelectedFloor] = useState<number | null>(null);
  const [selectedRoomValue, setSelectedRoomValue] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchRooms();
  }, []);

  async function fetchRooms() {
    try {
      const res = await fetch("/api/rooms");
      const data = await res.json();
      setRooms(data);
    } catch {
      setRooms([]);
    } finally {
      setLoading(false);
    }
  }

  const visibleFloorIndices =
    selectedFloor !== null
      ? [selectedFloor]
      : floors.map((_, i) => i);

  const dropdownGroups = visibleFloorIndices.map((floorIdx) => {
    const f = floors[floorIdx];
    const existingOnFloor = rooms.filter((r) => r.floorIdx === floorIdx);
    const newRooms = Object.entries(f.rooms)
      .filter(([, info]) => isClickable(info.type))
      .filter(
        ([area]) => !existingOnFloor.some((r) => r.gridArea === area),
      );
    return { floorIdx, floor: f, existingRooms: existingOnFloor, newRooms };
  });

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f) {
      setFile(f);
      setPreview(URL.createObjectURL(f));
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f && f.type.startsWith("image/")) {
      setFile(f);
      setPreview(URL.createObjectURL(f));
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file || !selectedRoomValue) return;

    setUploading(true);
    setMessage(null);

    try {
      const formData = new FormData();
      formData.set("file", file);

      const isExisting = selectedRoomValue.startsWith("existing:");

      if (isExisting) {
        const roomId = selectedRoomValue.replace("existing:", "");
        const room = rooms.find((r) => r.id === roomId);
        formData.set("floorNumber", String(room?.floorNumber ?? 0));
        formData.set("floorIdx", String(room?.floorIdx ?? 0));
        formData.set("roomId", roomId);
        formData.set("roomName", room?.name || "");
        formData.set("gridArea", room?.gridArea || "");
        formData.set("isNew", "false");
      } else {
        const rest = selectedRoomValue.replace("new:", "");
        const sepIdx = rest.indexOf(":");
        const floorIdx = parseInt(rest.substring(0, sepIdx));
        const gridArea = rest.substring(sepIdx + 1);
        const f = floors[floorIdx];
        const roomInfo = f.rooms[gridArea];
        formData.set("floorNumber", String(f.floorNumber));
        formData.set("floorIdx", String(floorIdx));
        formData.set("roomId", "");
        formData.set("roomName", roomInfo.name);
        formData.set("gridArea", gridArea);
        formData.set("isNew", "true");
      }

      const res = await fetch("/api/rooms", { method: "POST", body: formData });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Upload failed");
      }

      const updatedRooms = await res.json();
      setRooms(updatedRooms);
      setFile(null);
      setPreview(null);
      setSelectedRoomValue("");
      if (fileInputRef.current) fileInputRef.current.value = "";
      setMessage({ type: "success", text: "Image added successfully!" });
    } catch (err) {
      setMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Failed to upload image.",
      });
    } finally {
      setUploading(false);
    }
  }

  async function handleDeleteImage(roomId: string, imageName: string) {
    if (!confirm(`Remove "${imageName}" from this room?`)) return;

    try {
      const res = await fetch("/api/rooms", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomId, imageName }),
      });
      if (!res.ok) throw new Error("Delete failed");
      const updatedRooms = await res.json();
      setRooms(updatedRooms);
      setMessage({ type: "success", text: "Image removed." });
    } catch {
      setMessage({ type: "error", text: "Failed to remove image." });
    }
  }

  const groupedByFloor = [...floors].reverse().map((f) => ({
    floorNumber: f.floorNumber,
    floorName: f.name,
    rooms: rooms.filter((r) => r.floorNumber === f.floorNumber),
  }));

  if (!authed) return <LoginGate onLogin={login} error={error} />;

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="mx-auto max-w-[960px] px-4 py-6">
        <header className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Admin Panel</h1>
            <p className="mt-0.5 text-sm text-zinc-500">
              Manage game rooms & images
            </p>
          </div>
          <Link
            href="/"
            className="px-4 py-2 text-sm rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors"
          >
            &larr; Back to Game
          </Link>
        </header>

        <form
          onSubmit={handleSubmit}
          className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 mb-8"
        >
          <h2 className="text-lg font-semibold mb-5">Add New Image</h2>

          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors mb-5 ${
              file
                ? "border-sky-500/50 bg-sky-500/5"
                : "border-zinc-700 hover:border-zinc-500 bg-zinc-900/50"
            }`}
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
            {preview ? (
              <div className="flex flex-col items-center gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={preview}
                  alt="Preview"
                  className="max-h-48 rounded-lg object-contain"
                />
                <p className="text-sm text-zinc-400">{file?.name}</p>
                <p className="text-xs text-zinc-500">
                  Click or drop to replace
                </p>
              </div>
            ) : (
              <div>
                <p className="text-zinc-400 mb-1">
                  Drop an image here or click to browse
                </p>
                <p className="text-xs text-zinc-500">
                  JPG, PNG, JPEG supported
                </p>
              </div>
            )}
          </div>

          <div className="mb-5">
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              Floor filter
            </label>
            <div className="flex gap-2 overflow-x-auto pb-1">
              <button
                type="button"
                onClick={() => {
                  setSelectedFloor(null);
                  setSelectedRoomValue("");
                }}
                className={`px-4 py-2 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                  selectedFloor === null
                    ? "bg-sky-600 text-white"
                    : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200"
                }`}
              >
                All
              </button>
              {floors.map((f, idx) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => {
                    setSelectedFloor(idx);
                    setSelectedRoomValue("");
                  }}
                  className={`px-4 py-2 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                    idx === selectedFloor
                      ? "bg-sky-600 text-white"
                      : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200"
                  }`}
                >
                  {f.name}
                </button>
              ))}
            </div>
          </div>

          <div className="mb-5">
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              Room
            </label>
            <select
              value={selectedRoomValue}
              onChange={(e) => setSelectedRoomValue(e.target.value)}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5 text-sm text-zinc-200 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
            >
              <option value="">Select a room...</option>
              {dropdownGroups.map((group) => {
                const hasExisting = group.existingRooms.length > 0;
                const hasNew = group.newRooms.length > 0;
                if (!hasExisting && !hasNew) return null;
                return (
                  <optgroup
                    key={group.floorIdx}
                    label={group.floor.name}
                  >
                    {group.existingRooms.map((r) => (
                      <option key={r.id} value={`existing:${r.id}`}>
                        {r.name} ({r.images.length} image
                        {r.images.length !== 1 ? "s" : ""})
                      </option>
                    ))}
                    {group.newRooms.map(([area, info]) => (
                      <option
                        key={`${group.floorIdx}:${area}`}
                        value={`new:${group.floorIdx}:${area}`}
                      >
                        {info.name}
                      </option>
                    ))}
                  </optgroup>
                );
              })}
            </select>
          </div>

          {message && (
            <div
              className={`mb-4 p-3 rounded-lg text-sm ${
                message.type === "success"
                  ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-300"
                  : "bg-red-500/10 border border-red-500/30 text-red-300"
              }`}
            >
              {message.text}
            </div>
          )}

          <button
            type="submit"
            disabled={!file || !selectedRoomValue || uploading}
            className="w-full py-3 rounded-lg bg-sky-600 hover:bg-sky-500 disabled:bg-zinc-700 disabled:text-zinc-500 text-white font-semibold text-sm transition-colors"
          >
            {uploading ? "Uploading..." : "Upload & Add Image"}
          </button>
        </form>

        <div>
          <h2 className="text-lg font-semibold mb-4">Current Rooms</h2>

          {loading ? (
            <p className="text-zinc-500 text-sm">Loading...</p>
          ) : rooms.length === 0 ? (
            <p className="text-zinc-500 text-sm">No rooms added yet.</p>
          ) : (
            <div className="space-y-6">
              {groupedByFloor
                .filter((g) => g.rooms.length > 0)
                .map((group) => (
                  <div key={group.floorNumber}>
                    <h3 className="text-sm font-medium text-zinc-400 mb-3">
                      {group.floorName} &middot; {group.rooms.length}{" "}
                      room{group.rooms.length !== 1 ? "s" : ""}
                    </h3>
                    <div className="space-y-3">
                      {group.rooms.map((room) => (
                        <div
                          key={room.id}
                          className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4"
                        >
                          <div className="flex items-center justify-between mb-3">
                            <div>
                              <span className="font-medium text-zinc-200">
                                {room.name}
                              </span>
                              <span className="ml-2 text-xs text-zinc-500">
                                {room.gridArea}
                              </span>
                            </div>
                            <span className="text-xs text-zinc-500">
                              {room.images.length} image
                              {room.images.length !== 1 ? "s" : ""}
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-3">
                            {room.images.map((img) => (
                              <div key={img} className="relative group">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src={getImageUrl(img)}
                                  alt={img}
                                  className="w-20 h-20 object-cover rounded-md border border-zinc-700"
                                />
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleDeleteImage(room.id, img)
                                  }
                                  className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500 hover:bg-red-400 text-white text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                  title={`Remove ${img}`}
                                >
                                  &times;
                                </button>
                                <p className="text-[9px] text-zinc-500 mt-1 max-w-[80px] truncate">
                                  {img}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
