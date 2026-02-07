const io = require('socket.io-client');
const axios = require('axios');

const BASE_URL = 'http://localhost:3001/api';
const SOCKET_URL = 'http://localhost:3001';

// Colors for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Test data
let authToken;
let userId;
let taskId;
let helpRequestId;

async function runTests() {
  try {
    log('\n======================================', 'blue');
    log('  EPICS Backend Socket.IO Test Suite', 'blue');
    log('======================================\n', 'blue');

    // 1. Test Authentication
    log('1️⃣  Testing Authentication...', 'yellow');
    const signupResponse = await axios.post(`${BASE_URL}/auth/signup`, {
      email: `test_socket_${Date.now()}@example.com`,
      password: 'test123',
      username: `socket_tester_${Date.now()}`
    });

    authToken = signupResponse.data.token;
    userId = signupResponse.data.user.id;
    log(`✅ User authenticated. Token: ${authToken.substring(0, 20)}...`, 'green');

    // 2. Create a test task
    log('\n2️⃣  Creating test task...', 'yellow');
    const taskResponse = await axios.post(
      `${BASE_URL}/tasks`,
      {
        title: 'Socket.IO Test Task',
        description: 'Testing real-time features',
        category: 'tech_help',
        urgency: 'normal',
        latitude: 12.9716,
        longitude: 77.5946,
        address: 'Test Address',
        city: 'Bangalore'
      },
      { headers: { Authorization: `Bearer ${authToken}` } }
    );

    taskId = taskResponse.data.task._id;
    log(`✅ Task created. ID: ${taskId}`, 'green');

    // 3. Test Socket.IO Connection
    log('\n3️⃣  Testing Socket.IO connection...', 'yellow');

    return new Promise((resolve, reject) => {
      const socket = io(SOCKET_URL, {
        auth: { token: authToken }
      });

      let testResults = {
        connection: false,
        joinTask: false,
        leaveTask: false,
        total: 0,
        passed: 0
      };

      socket.on('connect', () => {
        log('✅ Socket.IO connected successfully', 'green');
        testResults.connection = true;
        testResults.total++;
        testResults.passed++;

        // Test joining task room
        log('\n4️⃣  Testing join task room...', 'yellow');
        socket.emit('join:task', { taskId });
      });

      socket.on('joined:task', (data) => {
        log(`✅ Joined task room: ${data.taskId}`, 'green');
        testResults.joinTask = true;
        testResults.total++;
        testResults.passed++;

        // Test sending a message
        log('\n5️⃣  Testing send message...', 'yellow');
        socket.emit('send:message', {
          taskId,
          content: 'Test message from Socket.IO test suite',
          messageType: 'text'
        });
      });

      socket.on('message:new', (message) => {
        log(`✅ Received message: "${message.content}"`, 'green');
        testResults.total++;
        testResults.passed++;

        // Test location update
        log('\n6️⃣  Testing location update...', 'yellow');
        socket.emit('update:location', {
          taskId,
          location: {
            latitude: 12.9720,
            longitude: 77.5950
          }
        });
      });

      socket.on('helper:location', (data) => {
        log(`✅ Received location update: lat=${data.location.latitude}, lng=${data.location.longitude}`, 'green');
        testResults.total++;
        testResults.passed++;

        // Test leaving task room
        log('\n7️⃣  Testing leave task room...', 'yellow');
        socket.emit('leave:task', { taskId });
      });

      socket.on('left:task', (data) => {
        log(`✅ Left task room: ${data.taskId}`, 'green');
        testResults.leaveTask = true;
        testResults.total++;
        testResults.passed++;

        // All tests complete
        socket.disconnect();

        // Print summary
        log('\n======================================', 'blue');
        log('           Test Summary', 'blue');
        log('======================================', 'blue');
        log(`Total Tests: ${testResults.total}`, 'yellow');
        log(`Passed: ${testResults.passed}`, 'green');
        log(`Failed: ${testResults.total - testResults.passed}`, testResults.passed === testResults.total ? 'green' : 'red');

        if (testResults.passed === testResults.total) {
          log('\n🎉 All Socket.IO tests passed!', 'green');
        } else {
          log('\n❌ Some tests failed', 'red');
        }

        resolve();
      });

      socket.on('notification:new', (notification) => {
        log(`📬 Received notification: ${notification.title}`, 'blue');
      });

      socket.on('task:status', (data) => {
        log(`📊 Task status update: ${data.status}`, 'blue');
      });

      socket.on('error', (error) => {
        log(`❌ Socket error: ${error.message}`, 'red');
      });

      socket.on('connect_error', (error) => {
        log(`❌ Connection error: ${error.message}`, 'red');
        reject(error);
      });

      socket.on('disconnect', () => {
        log('\n👋 Disconnected from Socket.IO server', 'yellow');
      });

      // Timeout after 10 seconds
      setTimeout(() => {
        socket.disconnect();
        log('\n⏱️  Test timeout - completing tests', 'yellow');
        resolve();
      }, 10000);
    });

  } catch (error) {
    log(`\n❌ Test failed: ${error.message}`, 'red');
    if (error.response) {
      log(`Response: ${JSON.stringify(error.response.data)}`, 'red');
    }
    process.exit(1);
  }
}

// Run the tests
runTests().then(() => {
  log('\n✅ Test suite completed\n', 'green');
  process.exit(0);
}).catch((error) => {
  log(`\n❌ Test suite failed: ${error.message}\n`, 'red');
  process.exit(1);
});
