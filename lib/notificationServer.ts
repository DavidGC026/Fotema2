import { getConnection } from './database';

interface PushNotificationPayload {
  title: string;
  body: string;
  data?: Record<string, any>;
}

export async function sendNotificationToGroup(
  groupId: number, 
  notification: PushNotificationPayload
) {
  try {
    const conn = await getConnection();
    
    // Get all group members except the sender
    const [members] = await conn.execute(`
      SELECT u.id, u.username, u.push_token
      FROM users u
      JOIN group_members gm ON u.id = gm.user_id
      WHERE gm.group_id = ? AND u.push_token IS NOT NULL
    `, [groupId]) as any;

    // In a real implementation, you would:
    // 1. Send push notifications using Expo's push service
    // 2. Store notifications in database for offline users
    // 3. Use WebSocket for real-time updates

    console.log(`Sending notification to ${members.length} members:`, notification);

    // Simulate sending push notifications
    for (const member of members) {
      console.log(`Notification sent to ${member.username}`);
      // Here you would use Expo's push notification service:
      // await sendExpoPushNotification(member.push_token, notification);
    }

    // Store notification in database for persistence
    await conn.execute(`
      INSERT INTO notifications (group_id, title, body, data, created_at)
      VALUES (?, ?, ?, ?, NOW())
    `, [
      groupId,
      notification.title,
      notification.body,
      JSON.stringify(notification.data || {})
    ]);

  } catch (error) {
    console.error('Error sending group notification:', error);
  }
}

export async function sendExpoPushNotification(
  pushToken: string,
  notification: PushNotificationPayload
) {
  const message = {
    to: pushToken,
    sound: 'default',
    title: notification.title,
    body: notification.body,
    data: notification.data,
  };

  try {
    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    });

    const result = await response.json();
    console.log('Push notification sent:', result);
  } catch (error) {
    console.error('Error sending push notification:', error);
  }
}