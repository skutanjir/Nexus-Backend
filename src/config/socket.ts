import { Server as SocketServer } from 'socket.io';

let io: SocketServer;

export function setIO(instance: SocketServer): void {
  io = instance;
}

export function getIO(): SocketServer {
  if (!io) {
    throw new Error('Socket.io not initialized');
  }
  return io;
}
