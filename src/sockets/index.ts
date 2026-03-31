import http from 'http';
import { Server } from 'socket.io';
import { env } from '../config/env';
import { verifyAccessToken } from '../common/utils/jwt';
import { logger } from '../common/utils/logger';

let io: Server | null = null;

export const initSocketServer = (server: http.Server): Server => {
  io = new Server(server, {
    cors: {
      origin: env.corsOrigin,
      credentials: true
    }
  });

  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth.token as string | undefined;
      if (!token) {
        next(new Error('Missing token'));
        return;
      }

      const payload = verifyAccessToken(token);
      socket.data.userId = payload.sub;
      next();
    } catch (error) {
      next(new Error('Unauthorized socket connection'));
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.data.userId as string;
    socket.join(`user:${userId}`);

    socket.on('disconnect', () => {
      logger.info('Socket disconnected', { userId, socketId: socket.id });
    });
  });

  logger.info('Socket server initialized');
  return io;
};

export const emitToUser = (userId: string, event: string, payload: unknown): void => {
  if (!io) {
    return;
  }

  io.to(`user:${userId}`).emit(event, payload);
};

export const getIo = (): Server | null => io;
