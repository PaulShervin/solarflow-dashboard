You are modifying an existing full-stack solar customer acquisition and lifecycle platform.

IMPORTANT:
DO NOT replace, delete, rewrite, or break the existing Google Maps / Google Maps Platform pipeline.

The existing Google Maps implementation must remain fully functional.

Your task is to introduce a PROVIDER-AGNOSTIC MAP/GEOLOCATION ARCHITECTURE so that the platform can switch between:

1. Google Maps
2. OpenStreetMap + Leaflet + Nominatim

using environment variables, without changing the rest of the application.

The final architecture must allow us to switch providers by changing .env configuration and restarting the application.

============================================================
OBJECTIVE
============================================================

Current behavior:

The platform already uses Google Maps APIs for location/property/map functionality.

We now want to add a second pipeline:

OpenStreetMap-based property selection:

Customer
  ↓
Browser asks for location permission
  ↓
GPS latitude/longitude
  ↓
OpenStreetMap/Leaflet map opens around current location
  ↓
Customer can pan/zoom
  ↓
Building/property footprint is displayed where available
  ↓
Customer selects their building
  ↓
Selected building polygon is highlighted
  ↓
Customer can adjust/edit the polygon if necessary
  ↓
Customer confirms property
  ↓
Frontend produces normalized GeoJSON
  ↓
Backend stores the property geometry
  ↓
Existing solar-analysis pipeline consumes the normalized geometry

The exact same conceptual workflow must be possible with Google Maps.

The rest of the platform must not care whether the underlying provider is Google or OSM.

============================================================
CORE ARCHITECTURAL PRINCIPLE
============================================================

Create a provider abstraction.

The application must NOT contain logic like:

if (provider === "google") {
   ... hundreds of lines ...
}

inside business logic.

Instead implement:

MapProvider
  ├── GoogleMapsProvider
  └── OpenStreetMapProvider

And similarly, where appropriate:

GeocodingProvider
  ├── GoogleGeocodingProvider
  └── NominatimGeocodingProvider

The application should consume provider interfaces, not provider-specific implementations.

The normalized output of both providers must be identical.

============================================================
ENVIRONMENT CONFIGURATION
============================================================

Inspect the existing global .env / environment configuration first.

Do not create duplicate configuration systems.

Add provider configuration to the existing environment configuration.

Use something equivalent to:

MAP_PROVIDER=google

Allowed values:

MAP_PROVIDER=google
MAP_PROVIDER=osm

Also support separate configuration where necessary:

GEOCODING_PROVIDER=google
GEOCODING_PROVIDER=nominatim

If the architecture benefits from keeping map rendering and geocoding separate, keep them separate.

Do NOT force them to be the same provider.

For example:

MAP_PROVIDER=osm
GEOCODING_PROVIDER=nominatim

or:

MAP_PROVIDER=google
GEOCODING_PROVIDER=google

should both work.

Potential configuration:

MAP_PROVIDER=google
GEOCODING_PROVIDER=google

GOOGLE_MAPS_API_KEY=...

NOMINATIM_BASE_URL=https://nominatim.openstreetmap.org

NOMINATIM_USER_AGENT=YourApplicationName/1.0 contact@example.com

OSM_TILE_URL=...

OSM_ATTRIBUTION=...

Do not hardcode secrets.

Do not expose server-only secrets to the browser.

Inspect the current frontend build system and use the correct public environment variable mechanism already used by the project.

For example, if this is Vite, follow VITE_* conventions.
If Next.js, follow NEXT_PUBLIC_* conventions.
If CRA, follow REACT_APP_* conventions.

Do not blindly create VITE variables if the project does not use Vite.

============================================================
STEP 1 — AUDIT THE EXISTING CODEBASE
============================================================

Before changing anything:

1. Inspect the complete repository structure.
2. Identify frontend and backend.
3. Find all Google Maps imports.
4. Find Google Maps API initialization.
5. Find Google Places usage.
6. Find Google Geocoding usage.
7. Find Google Maps polygons.
8. Find markers.
9. Find map state management.
10. Find current property-selection workflow.
11. Find current GPS/geolocation workflow.
12. Find existing API routes related to property/location.
13. Find existing database models for property/location.
14. Find existing solar-analysis input structures.
15. Find current environment configuration.
16. Find existing reusable UI components.

DO NOT immediately modify files.

First understand the existing architecture.

Then implement the provider abstraction with minimal disruption.

============================================================
STEP 2 — NORMALIZED GEOLOCATION MODEL
============================================================

Create a provider-independent location model.

Example:

Location:

{
  latitude: number,
  longitude: number,
  accuracy?: number,
  altitude?: number,
  heading?: number,
  speed?: number,
  source: "browser-gps" | "map-selection" | "address-search",
  provider?: "google" | "osm"
}

The rest of the application should consume this model.

============================================================
STEP 3 — NORMALIZED BUILDING GEOMETRY
============================================================

Introduce a provider-independent building footprint representation.

Use GeoJSON.

Example:

{
  "type": "Feature",
  "properties": {
    "source": "osm",
    "sourceId": "...",
    "confidence": null
  },
  "geometry": {
    "type": "Polygon",
    "coordinates": [...]
  }
}

Support:

Polygon
MultiPolygon

Do NOT store Google-specific polygon classes or Leaflet-specific objects in the database.

Convert everything into GeoJSON before sending it to the backend.

============================================================
STEP 4 — PROPERTY GEOMETRY MODEL
============================================================

Create/extend the property model to distinguish:

1. GPS location
2. Building footprint
3. Roof geometry
4. Customer-adjusted geometry
5. Solar-analysis geometry

Do NOT call the OSM building footprint a "roof".

Use terminology:

buildingFootprint

and separately:

roofSegments

usableRoofSegments

solarAnalysisGeometry

Example:

property:

{
  location: {
    latitude,
    longitude,
    accuracy,
    source
  },

  buildingFootprint: {
    type: "Feature",
    geometry: {
      type: "Polygon",
      coordinates: [...]
    },
    source: "osm"
  },

  customerConfirmedGeometry: {
    type: "Feature",
    geometry: {
      type: "Polygon",
      coordinates: [...]
    },
    source: "customer"
  },

  roofAssessment: {
    status: "pending",
    roofSegments: [],
    usableArea: null,
    orientation: null,
    tilt: null,
    shading: null
  }
}

Do not assume building footprint = roof footprint.

============================================================
STEP 5 — MAP PROVIDER INTERFACE
============================================================

Create a provider interface.

Conceptually:

interface MapProvider {
    initialize(...)
    destroy(...)
    setCenter(...)
    setZoom(...)
    getCenter(...)
    getZoom(...)
    addMarker(...)
    removeMarker(...)
    displayGeoJSON(...)
    selectBuilding(...)
    highlightBuilding(...)
    fitBounds(...)
}

Adapt this to the project's language/framework.

Do not over-engineer the interface with methods that neither provider needs.

The interface should cover the actual functionality required by the platform.

============================================================
STEP 6 — GOOGLE MAPS PROVIDER
============================================================

Create:

GoogleMapsProvider

Move/adapt the EXISTING Google Maps functionality behind this provider.

IMPORTANT:

Do not change the existing Google Maps behavior unnecessarily.

The user must see the same Google Maps functionality when:

MAP_PROVIDER=google

The provider should support:

- map initialization
- current location
- center/zoom
- markers
- polygons
- GeoJSON
- property selection
- polygon visualization
- polygon editing if the existing system supports it
- existing Google-specific functionality
- existing Places/geocoding integration where applicable

Do not use Google's deprecated DrawingManager as the foundation for new functionality.

Prefer the current Maps JavaScript API capabilities and the application's own polygon editing implementation.

============================================================
STEP 7 — OPENSTREETMAP PROVIDER
============================================================

Create:

OpenStreetMapProvider

Use Leaflet for map rendering unless the existing project already contains a suitable map abstraction/library that can cleanly support OSM.

Use OpenStreetMap-compatible map tiles with proper attribution.

The OSM provider should support:

- initialize map
- set center
- zoom
- browser GPS location
- markers
- GeoJSON
- polygon visualization
- building selection
- polygon editing
- fit bounds
- current location marker
- property confirmation

Use GeoJSON as the canonical geometry format.

Leaflet supports GeoJSON directly, which makes it appropriate for this abstraction.

============================================================
STEP 8 — GPS LOCATION
============================================================

Use browser Geolocation API for:

"Use my current location"

The flow:

navigator.geolocation.getCurrentPosition(...)

should produce normalized:

{
  latitude,
  longitude,
  accuracy,
  source: "browser-gps"
}

Do not assume GPS coordinates are the building coordinates.

They are only the user's current location.

The user must still be able to:

- pan
- zoom
- select the correct building
- adjust the building polygon

This distinction is important.

============================================================
STEP 9 — OPENSTREETMAP BUILDING DISCOVERY
============================================================

Implement an OSM building discovery mechanism appropriate for the selected location.

Do NOT blindly use Nominatim search to discover all buildings around the user.

Nominatim is primarily a geocoding/search service.

For building geometry discovery, use an appropriate OSM data/query mechanism.

Evaluate the simplest reliable implementation for the current project.

Possible architecture:

GPS coordinate
   ↓
OSM building data query
   ↓
candidate building polygons
   ↓
render candidates
   ↓
customer selects one

If using Overpass or another OSM data endpoint, isolate it behind:

OSMBuildingProvider

or:

BuildingGeometryProvider

Do not leak Overpass-specific response formats into frontend components.

Normalize the result into GeoJSON.

============================================================
STEP 10 — NOMINATIM
============================================================

Implement a separate:

NominatimGeocodingProvider

Support:

1. Forward geocoding

address
  ↓
latitude/longitude

2. Reverse geocoding

latitude/longitude
  ↓
address

Use:

NOMINATIM_BASE_URL

from environment variables.

Do not hardcode the public endpoint throughout the application.

Use a proper identifying User-Agent/Referer as required.

Do not implement public Nominatim autocomplete.

Do not send a request on every keystroke.

For the public Nominatim service:

- enforce rate limiting
- cache responses
- avoid unnecessary calls
- do not perform bulk geocoding
- make provider switching possible

If the application needs high-volume production geocoding, design the provider so that it can later point to a self-hosted Nominatim instance or another provider.

============================================================
STEP 11 — BUILDING SELECTION UX
============================================================

Create a reusable property selection component.

UX:

------------------------------------------------

Find Your Property

[ Use My Current Location ]

or

[ Search Address ]

------------------------------------------------

After GPS:

Map opens around user.

Show:

"You are here"

Then:

"Select your building"

User can:

- pan
- zoom
- click/tap building
- select building polygon

When selected:

highlight polygon

Show:

"Is this your property?"

[ Confirm Property ]

[ Adjust Outline ]

------------------------------------------------

If "Adjust Outline":

allow polygon vertices to be dragged.

Also support:

- add vertex if practical
- delete vertex if practical
- reset to detected footprint
- cancel editing

Then:

[ Confirm Outline ]

============================================================
STEP 12 — PROVIDER-INDEPENDENT PROPERTY SELECTION
============================================================

The property-selection component must NOT know whether it is Google or OSM.

Bad:

if (MAP_PROVIDER === "google") {
    ...
}

inside UI business logic.

Good:

<PropertyMap
    provider={configuredProvider}
    onPropertySelected={...}
/>

or equivalent architecture.

The component receives normalized:

Location

and

GeoJSON Feature

regardless of provider.

============================================================
STEP 13 — API DESIGN
============================================================

Create/extend backend APIs where necessary.

Possible routes:

POST /api/property/location

POST /api/property/building-footprint

POST /api/property/confirm

POST /api/property/reverse-geocode

GET /api/property/:id

Adapt to the existing project's route conventions.

Do not blindly create duplicate APIs if equivalent routes already exist.

The backend should receive normalized data.

Example:

POST /api/property/confirm

{
  "propertyId": "...",

  "location": {
    "latitude": 13.x,
    "longitude": 80.x,
    "accuracy": 12
  },

  "buildingFootprint": {
    "type": "Feature",
    "geometry": {
      "type": "Polygon",
      "coordinates": [...]
    }
  },

  "customerConfirmed": true,

  "source": "osm"
}

============================================================
STEP 14 — DATABASE
============================================================

Inspect the existing database.

Do not create duplicate property tables/models.

Extend the existing model where appropriate.

Store:

location.latitude
location.longitude
location.accuracy

buildingFootprint.geometry

buildingFootprint.source

buildingFootprint.sourceId

customerConfirmedGeometry.geometry

customerConfirmedGeometry.source

geometryVersion

updatedAt

Do not store provider-specific objects.

Store normalized GeoJSON.

Add provenance metadata.

Example:

{
  source: "osm",
  sourceId: "way:123456",
  retrievedAt: "...",
  confirmedByCustomer: true
}

============================================================
STEP 15 — SOLAR PIPELINE INTEGRATION
============================================================

IMPORTANT:

Do NOT rewrite the existing solar-analysis pipeline.

The solar engine should receive a normalized property geometry.

For example:

SolarAnalysisInput:

{
  latitude,
  longitude,
  buildingGeometry,
  roofGeometry
}

The solar-analysis engine should not care whether:

buildingGeometry came from:

Google

or

OpenStreetMap

or

customer-drawn geometry.

This is the key abstraction.

============================================================
STEP 16 — ROOF ANALYSIS
============================================================

Do NOT claim that OSM building polygons are automatically accurate roof polygons.

The system should distinguish:

building footprint

from:

roof segments

from:

usable solar area

from:

final engineering design

OSM is a geographic/building-data source.

Satellite imagery / solar APIs / computer vision / engineering analysis may provide additional roof information.

The architecture must allow those later stages to consume the confirmed building polygon.

============================================================
STEP 17 — PROVIDER TOGGLE
============================================================

The system must support:

MAP_PROVIDER=google

and:

MAP_PROVIDER=osm

Changing the value and restarting the application should switch the implementation.

No code changes should be required.

Example:

# Google
MAP_PROVIDER=google
GEOCODING_PROVIDER=google

# OSM
MAP_PROVIDER=osm
GEOCODING_PROVIDER=nominatim

Do not create two separate application flows.

There must be one unified workflow.

============================================================
STEP 18 — OPTIONAL ADMIN DEBUG TOGGLE
============================================================

If practical, add an admin/developer-only provider indicator.

Example:

Map Provider: Google

or:

Map Provider: OpenStreetMap

This should be informational.

Do NOT allow arbitrary users to change the provider unless the existing authorization architecture explicitly permits it.

Environment variables remain the source of truth for deployment configuration.

============================================================
STEP 19 — ERROR FALLBACK
============================================================

Do not silently switch providers when an API call fails unless explicitly configured.

For example:

MAP_PROVIDER=osm

If OSM fails:

DO NOT silently use Google.

Instead show an appropriate error.

Optionally support:

MAP_PROVIDER_FALLBACK=none

or:

MAP_PROVIDER_FALLBACK=google

but only if this is implemented cleanly and documented.

Never unexpectedly incur Google API charges.

============================================================
STEP 20 — ATTRIBUTION
============================================================

When OSM is active, make sure required OpenStreetMap attribution is visible.

Do not hide attribution.

Use the project's UI conventions.

The OSM provider should own the attribution configuration.

============================================================
STEP 21 — CACHING
============================================================

Implement caching where appropriate for:

- reverse geocoding
- address geocoding
- building geometry lookup

Use the existing caching infrastructure if the project has one.

Do not add Redis just for the sake of adding Redis.

If there is no cache infrastructure, implement a simple provider-level cache only if appropriate for the project's scale.

============================================================
STEP 22 — SECURITY
============================================================

Never expose server-side API credentials unnecessarily.

Validate:

latitude
longitude
GeoJSON
polygon coordinates

on the backend.

Prevent malformed or excessively large polygons.

Do not trust frontend geometry blindly.

Validate:

- valid GeoJSON
- valid geometry type
- coordinate ranges
- reasonable polygon size
- no invalid NaN/infinite values

============================================================
STEP 23 — TESTING
============================================================

Add tests for:

1. Google provider initialization
2. OSM provider initialization
3. provider selection
4. environment configuration
5. GPS normalization
6. GeoJSON normalization
7. building polygon selection
8. polygon editing
9. property confirmation
10. reverse geocoding
11. provider-independent API payload
12. invalid geometry
13. missing GPS permission
14. OSM unavailable
15. Google unavailable
16. provider switching

At minimum, verify:

MAP_PROVIDER=google

and:

MAP_PROVIDER=osm

both work.

============================================================
STEP 24 — ACCEPTANCE CRITERIA
============================================================

The implementation is complete only when all of these are true:

[ ] Existing Google Maps functionality still works.

[ ] MAP_PROVIDER=google loads Google Maps.

[ ] MAP_PROVIDER=osm loads OpenStreetMap/Leaflet.

[ ] The rest of the application does not need to know which provider is active.

[ ] Browser GPS works for both providers.

[ ] User can move around the map.

[ ] User can select a building/property.

[ ] Building geometry is normalized into GeoJSON.

[ ] User can confirm the detected building.

[ ] User can adjust the building polygon.

[ ] Adjusted polygon is stored as customer-confirmed geometry.

[ ] Google and OSM produce the same normalized property payload.

[ ] Solar analysis consumes normalized geometry.

[ ] No Google-specific map objects are persisted in the database.

[ ] No Leaflet-specific map objects are persisted in the database.

[ ] OSM attribution appears when OSM is active.

[ ] Nominatim requests are rate limited/cached appropriately.

[ ] No Nominatim autocomplete is implemented against the public service.

[ ] API keys remain secure.

[ ] Environment variables control provider selection.

[ ] No existing unrelated functionality is broken.

============================================================
STEP 25 — DOCUMENTATION
============================================================

Create/update documentation:

docs/map-provider-architecture.md

Explain:

1. Provider architecture
2. Google provider
3. OSM provider
4. Environment configuration
5. GPS flow
6. Building selection flow
7. GeoJSON data model
8. Provider switching
9. Nominatim limitations
10. OSM attribution
11. Production considerations
12. How to add another provider later

Also update:

.env.example

with all required variables.

Do NOT commit actual API keys.

============================================================
STEP 26 — FINAL OUTPUT
============================================================

After implementation, report:

1. Files created
2. Files modified
3. Existing Google functionality preserved
4. New OSM functionality
5. Environment variables added
6. How to switch to Google
7. How to switch to OSM
8. Database/schema changes
9. API changes
10. Tests added
11. Any limitations
12. Any assumptions

Also explicitly state if any existing code could not be cleanly abstracted and why.

============================================================
CRITICAL CONSTRAINTS
============================================================

1. DO NOT delete the existing Google Maps implementation.

2. DO NOT rewrite unrelated application code.

3. DO NOT duplicate the entire property workflow for OSM.

4. DO NOT create Google-specific and OSM-specific database schemas.

5. DO NOT store provider-specific map objects.

6. DO NOT make OSM the default unless explicitly configured.

7. Keep the current default behavior unchanged.

8. Use GeoJSON as the provider-independent geometry format.

9. Keep map rendering, geocoding, building geometry discovery, and solar analysis as separate concerns.

10. Do not equate building footprint with roof geometry.

11. Do not use the public Nominatim API for autocomplete.

12. Do not silently fall back to Google and create unexpected API costs.

13. Do not expose secret API keys in frontend source.

14. Inspect the existing repository before making architectural changes.

15. Reuse existing components/services/models whenever possible.

16. Prefer a clean adapter/provider architecture over conditional logic scattered throughout the codebase.

============================================================
DESIRED FINAL ARCHITECTURE
============================================================

                    APPLICATION
                         │
                         ↓
              Property Map Service
                         │
                 Provider Factory
                         │
             ┌───────────┴───────────┐
             ↓                       ↓
      Google Maps Provider      OSM Provider
             │                       │
             ↓                       ↓
       Google Maps API        Leaflet + OSM
                                     │
                              ┌──────┴──────┐
                              ↓             ↓
                         OSM Data       Nominatim
                              │             │
                              └──────┬──────┘
                                     ↓
                              NORMALIZED DATA
                                     │
                                     ↓
                                  GeoJSON
                                     │
                                     ↓
                              Property Service
                                     │
                                     ↓
                              Solar Analysis
                                     │
                                     ↓
                              Proposal Engine

The important architectural property is:

Google ───────┐
              ├──> Normalized GeoJSON ──> Property ──> Solar
OSM ──────────┘

The provider should be replaceable without changing downstream business logic.

Implement this carefully, incrementally, and verify the existing application after each major change.