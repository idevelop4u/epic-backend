const socketIO = require('socket.io');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Task = require('../models/Task');
const Message = require('../models/Message');
const Notification = require('../models/Notification');

let io;

// Initialize Socket.IO
const initializeSocket = (server) => {
  io = socketIO(server, {
    cors: {
      origin: process.env.FRONTEND_URL || '*',
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  // Authentication middleware for socket connections
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];

      if (!token) {
        return next(new Error('Authentication required'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.userId).select('-password');

      if (!user) {
        return next(new Error('User not found'));
      }

      socket.userId = user._id.toString();
      socket.user = user;
      next();
    } catch (error) {
      next(new Error('Invalid token'));
    }
  });

  // Connection handler
  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.userId}`);

    // Join user's personal room for notifications
    socket.join(`user:${socket.userId}`);

    // Join task room
    socket.on('join:task', async (data) => {
      try {
        const { taskId } = data;
        const task = await Task.findById(taskId);

        if (!task) {
          return socket.emit('error', { message: 'Task not found' });
        }

        // Check if user is requester or assigned helper
        const isRequester = task.requester.toString() === socket.userId;
        const isHelper = task.assignedHelper?.toString() === socket.userId;
        const isAdditionalHelper = task.additionalHelpers?.some(
          (helper) => helper.toString() === socket.userId
        );

        if (!isRequester && !isHelper && !isAdditionalHelper) {
          return socket.emit('error', { message: 'Access denied to this task' });
        }

        socket.join(`task:${taskId}`);
        socket.emit('joined:task', { taskId, message: 'Successfully joined task room' });
        console.log(`User ${socket.userId} joined task:${taskId}`);
      } catch (error) {
        console.error('Error joining task:', error);
        socket.emit('error', { message: 'Error joining task' });
      }
    });

    // Leave task room
    socket.on('leave:task', (data) => {
      const { taskId } = data;
      socket.leave(`task:${taskId}`);
      socket.emit('left:task', { taskId, message: 'Successfully left task room' });
      console.log(`User ${socket.userId} left task:${taskId}`);
    });

    // Update helper location
    socket.on('update:location', async (data) => {
      try {
        const { taskId, location } = data;
        const task = await Task.findById(taskId);

        if (!task) {
          return socket.emit('error', { message: 'Task not found' });
        }

        // Verify user is assigned helper
        const isHelper = task.assignedHelper?.toString() === socket.userId;
        const isAdditionalHelper = task.additionalHelpers?.some(
          (helper) => helper.toString() === socket.userId
        );

        if (!isHelper && !isAdditionalHelper) {
          return socket.emit('error', { message: 'Only assigned helpers can update location' });
        }

        // Update user location
        await User.findByIdAndUpdate(socket.userId, {
          location: {
            type: 'Point',
            coordinates: [location.longitude, location.latitude],
          },
          locationUpdatedAt: new Date(),
        });

        // Broadcast location update to task room
        io.to(`task:${taskId}`).emit('helper:location', {
          taskId,
          helperId: socket.userId,
          location: {
            latitude: location.latitude,
            longitude: location.longitude,
          },
          timestamp: new Date(),
        });

        console.log(`Helper ${socket.userId} updated location for task ${taskId}`);
      } catch (error) {
        console.error('Error updating location:', error);
        socket.emit('error', { message: 'Error updating location' });
      }
    });

    // Send message
    socket.on('send:message', async (data) => {
      try {
        const { taskId, content, messageType = 'text' } = data;
        const task = await Task.findById(taskId)
          .populate('requester', 'username profilePhoto')
          .populate('assignedHelper', 'username profilePhoto');

        if (!task) {
          return socket.emit('error', { message: 'Task not found' });
        }

        // Determine receiver
        let receiverId;
        if (task.requester._id.toString() === socket.userId) {
          receiverId = task.assignedHelper?._id;
        } else if (task.assignedHelper?._id.toString() === socket.userId) {
          receiverId = task.requester._id;
        } else {
          return socket.emit('error', { message: 'Access denied to this chat' });
        }

        if (!receiverId) {
          return socket.emit('error', { message: 'No receiver found for this task' });
        }

        // Create and save message
        const message = new Message({
          task: taskId,
          sender: socket.userId,
          receiver: receiverId,
          content,
          messageType,
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        });

        await message.save();
        await message.populate('sender', 'username profilePhoto');

        // Emit to task room
        io.to(`task:${taskId}`).emit('message:new', {
          _id: message._id,
          taskId,
          sender: {
            _id: message.sender._id,
            username: message.sender.username,
            profilePhoto: message.sender.profilePhoto,
          },
          content: message.content,
          messageType: message.messageType,
          createdAt: message.createdAt,
          read: false,
        });

        // Send notification to receiver
        const notification = new Notification({
          user: receiverId,
          type: 'chat_message',
          title: 'New Message',
          body: `${socket.user.username}: ${content.substring(0, 50)}${content.length > 50 ? '...' : ''}`,
          data: {
            taskId,
            messageId: message._id,
          },
        });

        await notification.save();

        // Emit notification to receiver
        io.to(`user:${receiverId}`).emit('notification:new', {
          _id: notification._id,
          type: notification.type,
          title: notification.title,
          body: notification.body,
          data: notification.data,
          createdAt: notification.createdAt,
        });

        console.log(`Message sent in task ${taskId} from ${socket.userId} to ${receiverId}`);
      } catch (error) {
        console.error('Error sending message:', error);
        socket.emit('error', { message: 'Error sending message' });
      }
    });

    // Mark messages as read
    socket.on('messages:read', async (data) => {
      try {
        const { taskId } = data;

        await Message.updateMany(
          { task: taskId, receiver: socket.userId, read: false },
          { read: true }
        );

        io.to(`task:${taskId}`).emit('messages:marked_read', {
          taskId,
          userId: socket.userId,
        });
      } catch (error) {
        console.error('Error marking messages as read:', error);
        socket.emit('error', { message: 'Error marking messages as read' });
      }
    });

    // Disconnect handler
    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.userId}`);
    });
  });

  return io;
};

// Get Socket.IO instance
const getIO = () => {
  if (!io) {
    throw new Error('Socket.io not initialized');
  }
  return io;
};

// Helper function to emit task status updates
const emitTaskStatusUpdate = (taskId, status, data = {}) => {
  if (io) {
    io.to(`task:${taskId}`).emit('task:status', {
      taskId,
      status,
      ...data,
      timestamp: new Date(),
    });
  }
};

// Helper function to send notification to user
const sendNotificationToUser = (userId, notification) => {
  if (io) {
    io.to(`user:${userId}`).emit('notification:new', {
      _id: notification._id,
      type: notification.type,
      title: notification.title,
      body: notification.body,
      data: notification.data,
      createdAt: notification.createdAt,
    });
  }
};

module.exports = {
  initializeSocket,
  getIO,
  emitTaskStatusUpdate,
  sendNotificationToUser,
};
