type Position = [number, number];
type Island = Position[];

let imageData: ImageData;

import { TurtleCommand, TurtleCommands, TurtleJsonType } from '../types';

function decodeBase64Image(imageBase64: string): Promise<ImageData> {
  return new Promise((resolve, reject) => {
    const binaryString = window.atob(imageBase64);
    const length = binaryString.length;
    const bytes = new Uint8Array(length);

    for (let i = 0; i < length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    const blob = new Blob([bytes], { type: 'image/png' });
    const img = new Image();
    img.src = URL.createObjectURL(blob);

    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;

      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, img.width, img.height);
      resolve(imageData);
    };

    img.onerror = (error) => {
      reject(new Error("Failed to load image"));
    };
  });
}


function findIslands(): Island[] {
  const { width, height, data } = imageData;
  const visited: boolean[][] = Array.from({ length: height }, () => Array(width).fill(false));
  const islands: Island[] = [];

  const bfs = (startX: number, startY: number): Island => {
    const queue: Position[] = [[startX, startY]];
    const island: Island = [];

    while (queue.length > 0) {
      const [x, y] = queue.shift()!;
      if (visited[y][x]) continue;

      visited[y][x] = true;
      island.push([x, y]);

      const directions: Position[] = [[0, 1], [1, 0], [0, -1], [-1, 0]];
      for (const [dx, dy] of directions) {
        const nx = x + dx;
        const ny = y + dy;

        if (nx >= 0 && ny >= 0 && nx < width && ny < height && data[(ny * width + nx) * 4] === 0 && !visited[ny][nx]) {
          queue.push([nx, ny]);
        }
      }
    }
    return island;
  };

  // imageDataには、RGBAの順でデータがはいってる
  // Rだけ確かめればいい
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (data[(y * width + x) * 4] === 0 && !visited[y][x]) {
        const island = bfs(x, y);
        islands.push(island);
      }
    }
  }
  return islands;
}

function calculateDistance(p1: Position, p2: Position): number {
  return Math.max(Math.abs(p1[0] - p2[0]), Math.abs(p1[1] - p2[1]));
}

function findNearestIsland(currentPos: Position, islands: Island[]): Island | null {
  let minDistance = Infinity;
  let nearestIsland: Island | null = null;

  for (const island of islands) {
    const distance = calculateDistance(currentPos, island[0]);
    if (distance < minDistance) {
      minDistance = distance;
      nearestIsland = island;
    }
  }

  return nearestIsland;
}

function getDirection(dx: number, dy: number): number {
  if (Math.abs(dx) > Math.abs(dy)) {
    return dx > 0 ? 0 : 180;
  } else {
    return dy > 0 ? 90 : 270;
  }
}

function generateRoute(start: Position, end: Position, currentAngle: number): [TurtleCommand[], number] {
  const commands: TurtleCommand[] = [];
  let [x1, y1] = start;
  const [x2, y2] = end;

  while (x1 !== x2 || y1 !== y2) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const direction = getDirection(dx, dy);
    const angleDiff = (direction - currentAngle + 360) % 360;

    if (angleDiff !== 0) {
      if (angleDiff === 180) {
        commands.push('r180');
      } else if (angleDiff > 180) {
        commands.push(`l${360 - angleDiff}`);
      } else {
        commands.push(`r${angleDiff}`);
      }
    }

    if (direction === 0 || direction === 180) {
      x1 += dx > 0 ? 1 : -1;
    } else {
      y1 += dy > 0 ? 1 : -1;
    }

    commands.push('m1');
    currentAngle = direction;
  }

  return [commands, currentAngle];
}

// function isBlackPixel(pos: Position): boolean {
//   const [x, y] = pos;
//   const index = (y * imageData.width + x) * 4;
//   return imageData.data[index] === 0 && imageData.data[index + 1] === 0 && imageData.data[index + 2] === 0;
// }



function generateCommands(islands: Island[]): TurtleCommands {
  const commands: TurtleCommand[] = [];
  let currentPos: Position = [0, 0];
  let currentAngle = 0;
  // commands.push('u');

  while (islands.length > 0) {
    const nearestIsland = findNearestIsland(currentPos, islands);
    if (!nearestIsland) break;
    islands.splice(islands.indexOf(nearestIsland), 1);

    commands.push('u');
    let [route, newAngle] = generateRoute(currentPos, nearestIsland[0], currentAngle);
    commands.push(...route);
    // え、こっちにも問題ないの

    // ペンを下ろす前に確認
    // if (isBlackPixel(nearestIsland[0])) {
    //   commands.push('d');
    // }
    commands.push('d');
    for (let i = 1; i < nearestIsland.length; i++) {
      [route, newAngle] = generateRoute(nearestIsland[i - 1], nearestIsland[i], newAngle);
      // ここが絶対問題 2024 10/09 20:41

      // if (isBlackPixel(nearestIsland[i])) {
      //   commands.push(...route);
      // }
      commands.push(...route);
    }
    // commands.push('u');

    currentPos = nearestIsland[nearestIsland.length - 1];
    currentAngle = newAngle;
  }

  // やっぱ1ずつのほうが見栄えがいい
  // // m1 の連続をまとめる処理
  // const optimizedCommands: TurtleCommand[] = [];
  // let moveCount = 0;

  // for (let i = 0; i < commands.length; i++) {
  //   if (commands[i] === 'm1') {
  //     moveCount++;
  //   } else {
  //     if (moveCount > 0) {
  //       optimizedCommands.push(`m${moveCount}`);
  //       moveCount = 0;
  //     }
  //     optimizedCommands.push(commands[i]);
  //   }
  // }

  // if (moveCount > 0) {
  //   optimizedCommands.push(`m${moveCount}`);
  // }

  return commands;
}

interface GenerateTurtleCommandsProps {
  imageBase64: string;
}

export default async function generateTurtleCommands({ imageBase64 }: GenerateTurtleCommandsProps): Promise<TurtleJsonType> {
  imageData = await decodeBase64Image(imageBase64);
  const islands = findIslands();
  const commands = generateCommands(islands);
  const width = imageData.width;
  const height = imageData.height;
  const turtleJson: TurtleJsonType = {
    "size": [width, height],
    "data": commands,
  };
  return turtleJson;
}