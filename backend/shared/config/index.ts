export const config = {
  env: process.env.NODE_ENV || "development",
  timezone: process.env.DEFAULT_TIMEZONE || "America/Phoenix",
  companyName: "SolarPeak",
  mapProvider: process.env.MAP_PROVIDER || process.env.VITE_MAP_PROVIDER || "google",
  geocodingProvider: process.env.GEOCODING_PROVIDER || process.env.VITE_GEOCODING_PROVIDER || "google",
  googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY || process.env.VITE_GOOGLE_MAPS_API_KEY || "YOUR_GOOGLE_MAPS_API_KEY_HERE",
  nominatimBaseUrl: process.env.NOMINATIM_BASE_URL || process.env.VITE_NOMINATIM_BASE_URL || "https://nominatim.openstreetmap.org",
  nominatimUserAgent: process.env.NOMINATIM_USER_AGENT || process.env.VITE_NOMINATIM_USER_AGENT || "SolarFlowDashboard/1.0",
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
