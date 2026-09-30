import test from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import mongoose from 'mongoose';
import app from '../app.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js';
import { generateAccessToken } from '../utils/tokenUtils.js';

test('In-App Notifications (Queue 15): retrieval, unread count & status updates', async (t) => {
  const userId = new mongoose.Types.ObjectId();
  const notifId = new mongoose.Types.ObjectId();

  const mockUser = new User({
    _id: userId,
    name: 'Citizen Meera',
    email: 'meera@civicresolve.org',
    role: 'citizen',
    isActive: true,
  });

  const userToken = generateAccessToken(mockUser);

  const originalUserFindById = User.findById;
  const originalNotifFind = Notification.find;
  const originalNotifFindOne = Notification.findOne;
  const originalNotifCountDocuments = Notification.countDocuments;
  const originalNotifUpdateMany = Notification.updateMany;

  await t.test('GET /api/notifications requires authentication with 401', async () => {
    const res = await request(app).get('/api/notifications');
    assert.equal(res.status, 401);
    assert.equal(res.body.success, false);
  });

  await t.test('GET /api/notifications returns user notifications with unreadCount', async () => {
    User.findById = () => ({
      select: () => Promise.resolve(mockUser),
      then: (resolve) => resolve(mockUser),
    });

    Notification.countDocuments = (q) => {
      if (q && q.isRead === false) return Promise.resolve(2);
      return Promise.resolve(5);
    };

    Notification.find = () => ({
      sort: () => ({
        skip: () => ({
          limit: () =>
            Promise.resolve([
              {
                _id: notifId,
                title: 'Issue Dispatched to Field Crew',
                message: 'Field personnel assigned to CIVIC-2026-000123',
                type: 'assignment',
                isRead: false,
                createdAt: new Date(),
              },
            ]),
        }),
      }),
    });

    const res = await request(app)
      .get('/api/notifications')
      .set('Authorization', `Bearer ${userToken}`);

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.unreadCount, 2);
    assert.equal(res.body.data.notifications.length, 1);
  });

  await t.test('PATCH /api/notifications/:id/read marks notification as read', async () => {
    User.findById = () => ({
      select: () => Promise.resolve(mockUser),
      then: (resolve) => resolve(mockUser),
    });

    const mockNotif = {
      _id: notifId,
      recipient: userId,
      isRead: false,
      save: function () {
        this.isRead = true;
        return Promise.resolve(this);
      },
    };

    Notification.findOne = () => Promise.resolve(mockNotif);
    Notification.countDocuments = () => Promise.resolve(1);

    const res = await request(app)
      .patch(`/api/notifications/${notifId}/read`)
      .set('Authorization', `Bearer ${userToken}`);

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.notification.isRead, true);
  });

  await t.test('PATCH /api/notifications/read-all marks all notifications as read', async () => {
    User.findById = () => ({
      select: () => Promise.resolve(mockUser),
      then: (resolve) => resolve(mockUser),
    });

    Notification.updateMany = () => Promise.resolve({ matchedCount: 3, modifiedCount: 3 });

    const res = await request(app)
      .patch('/api/notifications/read-all')
      .set('Authorization', `Bearer ${userToken}`);

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.unreadCount, 0);
  });

  // Restore mocks
  User.findById = originalUserFindById;
  Notification.find = originalNotifFind;
  Notification.findOne = originalNotifFindOne;
  Notification.countDocuments = originalNotifCountDocuments;
  Notification.updateMany = originalNotifUpdateMany;
});
