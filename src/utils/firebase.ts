// src/utils/firebase.ts
import admin from "firebase-admin";

// Initialize Firebase Admin (إذا لم يكن مُهيأ)
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    }),
  });
}

export const sendPushNotification = async (
  tokens: string[],
  title: string,
  body: string,
  data?: Record<string, string>
): Promise<void> => {
  if (!tokens || tokens.length === 0) {
    console.log("[FCM] No tokens provided");
    return;
  }

  try {
    const message: admin.messaging.MulticastMessage = {
      tokens,
      notification: {
        title,
        body,
      },
      data: data || {},
      android: {
        priority: "high",
        notification: {
          sound: "default",
          channelId: "default",
        },
      },
      apns: {
        payload: {
          aps: {
            sound: "default",
            badge: 1,
          },
        },
      },
    };

    const response = await admin.messaging().sendEachForMulticast(message);
    
    console.log(`[FCM] Success: ${response.successCount}, Failed: ${response.failureCount}`);
    
    // Log failures
    response.responses.forEach((resp, idx) => {
      if (!resp.success) {
        console.error(`[FCM] Failed to send to token ${idx}:`, resp.error);
      }
    });
  } catch (error) {
    console.error("[FCM] Error sending notification:", error);
  }
};
