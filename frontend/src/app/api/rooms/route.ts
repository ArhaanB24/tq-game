import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

const ROOMS_FILE = path.join(process.cwd(), "..", "gameRooms.json");
const IMAGES_DIR = path.join(process.cwd(), "..", "images");

interface StoredRoom {
  id: string;
  name: string;
  floorNumber: number;
  floorIdx: number;
  gridArea: string;
  images: string[];
}

async function readRooms(): Promise<StoredRoom[]> {
  try {
    const data = await fs.readFile(ROOMS_FILE, "utf-8");
    return JSON.parse(data);
  } catch {
    return [];
  }
}

async function writeRooms(rooms: StoredRoom[]) {
  await fs.writeFile(ROOMS_FILE, JSON.stringify(rooms, null, 2));
}

export async function GET() {
  const rooms = await readRooms();
  return NextResponse.json(rooms);
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const roomId = formData.get("roomId") as string;
    const roomName = formData.get("roomName") as string;
    const floorNumber = parseInt(formData.get("floorNumber") as string);
    const floorIdx = parseInt(formData.get("floorIdx") as string);
    const gridArea = formData.get("gridArea") as string;
    const isNew = formData.get("isNew") === "true";

    if (!file || !roomName || !gridArea || isNaN(floorNumber) || isNaN(floorIdx)) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const filename = file.name;
    await fs.writeFile(path.join(IMAGES_DIR, filename), buffer);

    const rooms = await readRooms();

    if (isNew) {
      const id =
        roomId ||
        roomName
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)/g, "");
      rooms.push({
        id,
        name: roomName,
        floorNumber,
        floorIdx,
        gridArea,
        images: [filename],
      });
    } else {
      const room = rooms.find((r) => r.id === roomId);
      if (!room) {
        return NextResponse.json({ error: "Room not found" }, { status: 404 });
      }
      if (!room.images.includes(filename)) {
        room.images.push(filename);
      }
    }

    await writeRooms(rooms);
    return NextResponse.json(rooms);
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { roomId, imageName } = await request.json();
    const rooms = await readRooms();
    const room = rooms.find((r) => r.id === roomId);

    if (!room) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 });
    }

    room.images = room.images.filter((img) => img !== imageName);

    const updatedRooms = rooms.filter((r) => r.images.length > 0);
    await writeRooms(updatedRooms);
    return NextResponse.json(updatedRooms);
  } catch (error) {
    console.error("Delete error:", error);
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}
