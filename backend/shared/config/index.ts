export const config = {
  env: process.env.NODE_ENV || "development",
  timezone: process.env.DEFAULT_TIMEZONE || "America/Phoenix",
  companyName: "SolarPeak",
  googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY || process.env.VITE_GOOGLE_MAPS_API_KEY || "YOUR_GOOGLE_MAPS_API_KEY_HERE",
  messagingWindow: {
    startHour: 8, // 8:00 AM local
    endHour: 20, // 8:00 PM local
  },
  limits: {
    maxSmsPerDay: 3,
    maxEmailPerDay: 5,
    maxTotalAutomatedMessagesPerLead: 20,
    minMinutesBetweenMessages: 120, // 2 hours
  },
};
