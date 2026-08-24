"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendPushNotification = void 0;
// src/utils/firebase.ts
const firebase_admin_1 = __importDefault(require("firebase-admin"));
// Initialize Firebase Admin (إذا لم يكن مُهيأ)
if (!firebase_admin_1.default.apps.length) {
    firebase_admin_1.default.initializeApp({
        credential: firebase_admin_1.default.credential.cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
        }),
    });
}
const sendPushNotification = async (tokens, title, body, data) => {
    if (!tokens || tokens.length === 0) {
        console.log("[FCM] No tokens provided");
        return;
    }
    try {
        const message = {
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
        const response = await firebase_admin_1.default.messaging().sendEachForMulticast(message);
        console.log(`[FCM] Success: ${response.successCount}, Failed: ${response.failureCount}`);
        // Log failures
        response.responses.forEach((resp, idx) => {
            if (!resp.success) {
                console.error(`[FCM] Failed to send to token ${idx}:`, resp.error);
            }
        });
    }
    catch (error) {
        console.error("[FCM] Error sending notification:", error);
    }
};
exports.sendPushNotification = sendPushNotification;
