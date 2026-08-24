import { io } from "socket.io-client";
import { generateDriverToken, generateParentToken } from "../src/utils/auth";
import { v4 as uuidv4 } from "uuid";

const SOCKET_URL = "http://localhost:3000";

const runTest = async () => {
    const rideId = uuidv4();

    // Generate tokens
    const driverToken = generateDriverToken({
        id: uuidv4(),
        name: "Test Driver",
        organizationId: uuidv4()
    });

    const parentToken = generateParentToken({
        id: uuidv4(),
        name: "Test Parent",
        email: "parent@test.com"
    });

    // Connect Parent
    const parentSocket = io(SOCKET_URL, {
        auth: { token: parentToken }
    });

    // Connect Driver
    const driverSocket = io(SOCKET_URL, {
        auth: { token: driverToken }
    });

    parentSocket.on("connect", () => {
        console.log("Parent connected");
        parentSocket.emit("joinRide", rideId);
    });

    driverSocket.on("connect", () => {
        console.log("Driver connected");

        // Send location update after a short delay
        setTimeout(() => {
            console.log("Driver sending location update...");
            driverSocket.emit("updateLocation", {
                rideId,
                lat: 30.0444,
                lng: 31.2357
            });
        }, 1000);
    });

    parentSocket.on("locationUpdate", (data) => {
        console.log("Parent received location update:", data);
        if (data.rideId === rideId && data.lat === 30.0444 && data.lng === 31.2357) {
            console.log("✅ Test Passed!");
            process.exit(0);
        } else {
            console.error("❌ Test Failed: Data mismatch");
            process.exit(1);
        }
    });

    // Timeout
    setTimeout(() => {
        console.error("❌ Test Timed Out");
        process.exit(1);
    }, 15000);
};

runTest();