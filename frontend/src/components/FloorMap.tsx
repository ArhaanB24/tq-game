"use client";

import { FloorConfig, RoomType, isClickable } from "@/data/floors";

interface FloorMapProps {
  floor: FloorConfig;
  selectedRoom: string | null;
  onRoomClick: (areaId: string) => void;
  correctArea?: string | null;
  wrongGuessArea?: string | null;
  revealed?: boolean;
  disabled?: boolean;
}

function getRoomClasses(
  type: RoomType,
  state: "normal" | "selected" | "correct" | "wrong" | "dimmed",
): string {
  const base =
    "flex items-center justify-center text-center rounded-md border transition-all duration-150 p-1.5 leading-tight";

  if (state === "correct") {
    const ring = "ring-2 ring-emerald-400 !border-emerald-400 !bg-emerald-500/20";
    return `${base} min-h-[52px] border-zinc-600/80 bg-zinc-900 text-zinc-300 cursor-default text-[11px] font-medium ${ring}`;
  }
  if (state === "wrong") {
    const ring = "ring-2 ring-red-400 !border-red-400 !bg-red-500/15";
    return `${base} min-h-[52px] border-zinc-600/80 bg-zinc-900 text-zinc-300 cursor-default text-[11px] font-medium ${ring}`;
  }
  if (state === "dimmed") {
    switch (type) {
      case "floorLabel":
        return `${base} min-h-[140px] bg-sky-500/60 border-sky-500/60 text-white/60 font-bold text-2xl cursor-default select-none`;
      case "label":
        return "flex items-center justify-center text-center text-zinc-500 text-[11px] tracking-wider cursor-default select-none py-1 font-medium";
      case "corridor":
        return "";
      default:
        return `${base} min-h-[52px] border-zinc-700/40 bg-zinc-900/50 text-zinc-500 cursor-default text-[11px] font-medium opacity-50`;
    }
  }

  const selectedRing =
    state === "selected"
      ? "ring-2 ring-sky-400 !border-sky-400 !bg-sky-500/15"
      : "";

  switch (type) {
    case "classroom":
      return `${base} min-h-[52px] border-zinc-600/80 bg-zinc-900 hover:bg-zinc-800 hover:border-zinc-500 text-zinc-300 cursor-pointer text-[11px] font-medium ${selectedRing}`;
    case "lab":
      return `${base} min-h-[52px] border-blue-700/50 bg-slate-900 hover:bg-blue-900/60 hover:border-blue-500 text-blue-200 cursor-pointer text-[11px] font-medium ${selectedRing}`;
    case "office":
      return `${base} min-h-[52px] border-amber-700/40 bg-zinc-900 hover:bg-amber-900/30 hover:border-amber-500 text-amber-200 cursor-pointer text-[11px] font-medium ${selectedRing}`;
    case "utility":
      return `${base} min-h-[52px] border-zinc-600 bg-zinc-900 hover:bg-zinc-800 hover:border-zinc-400 text-zinc-300 cursor-pointer text-[11px] font-medium ${selectedRing}`;
    case "restroom":
      return `${base} min-h-[40px] border-zinc-700/60 bg-zinc-900/80 text-zinc-500 cursor-default text-[10px]`;
    case "lift":
      return `${base} min-h-[36px] border-zinc-600/60 bg-zinc-900/90 text-zinc-400 cursor-default text-[11px] font-medium`;
    case "stairs":
      return `${base} min-h-[36px] border-zinc-700/50 bg-zinc-900/70 text-zinc-500 cursor-default text-[10px]`;
    case "floorLabel":
      return `${base} min-h-[140px] bg-sky-500 border-sky-500 text-white font-bold text-2xl cursor-default select-none`;
    case "label":
      return "flex items-center justify-center text-center text-zinc-400 text-[11px] tracking-wider cursor-default select-none py-1 font-medium";
    case "corridor":
      return "";
    default:
      return base;
  }
}

export default function FloorMap({
  floor,
  selectedRoom,
  onRoomClick,
  correctArea,
  wrongGuessArea,
  revealed,
  disabled,
}: FloorMapProps) {
  const gridTemplateAreas = floor.gridTemplate
    .map((row) => `"${row}"`)
    .join(" ");

  function getCellState(
    area: string,
    type: RoomType,
  ): "normal" | "selected" | "correct" | "wrong" | "dimmed" {
    if (revealed) {
      if (area === correctArea) return "correct";
      if (area === wrongGuessArea && wrongGuessArea !== correctArea)
        return "wrong";
      return "dimmed";
    }
    if (area === selectedRoom) return "selected";
    return "normal";
  }

  return (
    <div className="overflow-x-auto">
      <div
        className="min-w-[640px] rounded-lg"
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${floor.columns}, 1fr)`,
          gridTemplateAreas,
          gap: "4px",
          padding: "4px",
          backgroundColor: "rgba(63, 63, 70, 0.18)",
        }}
      >
        {Object.entries(floor.rooms).map(([area, room]) => {
          if (room.type === "corridor") {
            return (
              <div
                key={area}
                style={{ gridArea: area }}
                className="rounded-sm bg-zinc-700/15"
                aria-hidden
              />
            );
          }

          const clickable = !disabled && !revealed && isClickable(room.type);
          const state = getCellState(area, room.type);

          return (
            <button
              key={area}
              style={{ gridArea: area }}
              className={getRoomClasses(room.type, state)}
              onClick={() => clickable && onRoomClick(area)}
              disabled={!clickable}
            >
              {room.name}
            </button>
          );
        })}
      </div>
    </div>
  );
}
