import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'http';
import { initSocket, getIO, emitIssueEvent, emitLiveNotification } from '../socket.js';

describe('Real-Time Socket.IO Subsystem (Queue 16)', () => {
  let server;

  before(() => {
    server = http.createServer();
    initSocket(server);
  });

  after((done) => {
    const io = getIO();
    if (io) {
      io.close(() => {
        server.close(done);
      });
    } else {
      server.close(done);
    }
  });

  test('initSocket initializes the Socket.IO instance successfully', () => {
    const io = getIO();
    assert.ok(io, 'Socket.IO server instance should be defined');
  });

  test('emitIssueEvent handles populated issue payloads gracefully without crashing', () => {
    const mockIssue = {
      _id: '6abc55f4365b5ddfc8d96c6c',
      issueNumber: 'CIVIC-2026-000042',
      title: 'Water Main Leak Test',
      status: 'in_progress',
      reporter: { _id: '6abc55f4365b5ddfc8d96c60' },
      assignedWorker: { _id: '6abc55f4365b5ddfc8d96c61' },
    };

    assert.doesNotThrow(() => {
      emitIssueEvent('issue_updated', mockIssue);
    });
  });

  test('emitLiveNotification handles user notifications gracefully without crashing', () => {
    const mockNotification = {
      _id: '6abc55f4365b5ddfc8d96c99',
      recipient: '6abc55f4365b5ddfc8d96c60',
      title: 'Status Updated',
      message: 'Your civic issue CIVIC-2026-000042 has been marked in progress.',
      isRead: false,
    };

    assert.doesNotThrow(() => {
      emitLiveNotification('6abc55f4365b5ddfc8d96c60', mockNotification);
    });
  });

  test('emitIssueEvent handles missing or null issue gracefully', () => {
    assert.doesNotThrow(() => {
      emitIssueEvent('issue_updated', null);
    });
  });
});
