export interface GameRoom {
  id: string;
  name: string;
  floorNumber: number;
  floorIdx: number;
  gridArea: string;
  images: string[];
}

export function getImageUrl(filename: string): string {
  return "/images/" + encodeURIComponent(filename);
}

export function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function pickRandomRoom(
  rooms: GameRoom[],
  exclude?: GameRoom,
): GameRoom {
  if (rooms.length <= 1) return rooms[0];
  let room: GameRoom;
  do {
    room = pickRandom(rooms);
  } while (exclude && room.id === exclude.id);
  return room;
}

export interface GuessResult {
  isCorrect: boolean;
  isCorrectFloor: boolean;
  floorDiff: number;
  guessedFloorNumber: number;
  correctRoom: GameRoom;
}

export function floorDisplayName(floorNumber: number): string {
  if (floorNumber === -1) return "Lower Ground";
  if (floorNumber === 0) return "Ground Floor";
  return `Floor ${floorNumber}`;
}

export function evaluateGuess(
  guessFloorNumber: number,
  guessArea: string,
  correctRoom: GameRoom,
): GuessResult {
  const isCorrectFloor = guessFloorNumber === correctRoom.floorNumber;
  const isCorrect = isCorrectFloor && guessArea === correctRoom.gridArea;
  const floorDiff = Math.abs(guessFloorNumber - correctRoom.floorNumber);

  return {
    isCorrect,
    isCorrectFloor,
    floorDiff,
    guessedFloorNumber: guessFloorNumber,
    correctRoom,
  };
}
