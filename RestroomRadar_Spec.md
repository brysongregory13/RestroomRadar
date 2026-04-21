# RestroomRadar — Full Product Specification
> Version 1.0 · Ready for Claude Code

---

## 1. App Overview

**Name:** RestroomRadar  
**Tagline:** Find clean restrooms wherever you are.  
**Platform:** iOS + Android (React Native via Expo)  
**Purpose:** A community-driven map app that lets users find, rate, and add public restrooms nearby — with details on cleanliness, access type, amenities, and hours. Think Yelp meets Waze, for bathrooms.

---

## 2. Tech Stack

| Layer | Technology |
|---|---|
| Framework | React Native (Expo SDK) |
| Navigation | React Navigation v6 (Stack + Bottom Tabs) |
| Map | Google Maps SDK (`react-native-maps`) |
| Backend / Database | Firebase Firestore |
| Auth | Firebase Authentication (Email/Password + Google + Apple) |
| Storage | Firebase Storage (restroom photos) |
| Location | Expo Location |
| Route Planning | Google Directions API |
| Geocoding | Google Geocoding API |
| State Management | React Context + useReducer |
| Forms | React Hook Form |
| Styling | StyleSheet (custom design system — Aqua Fresh theme) |

---

## 3. Design System

### Colors
```
Primary:      #00897B  (teal)
Primary Dark: #00695C
Primary Light:#E0F2F1
Accent:       #FFA726  (amber — star ratings)
Success:      #43A047  (open status)
Danger:       #E53935  (closed status / errors)
Background:   #F5F7F5
Surface:      #FFFFFF
Text Primary: #212121
Text Secondary:#555555
Text Hint:    #888888
Border:       #E0E0E0
```

### Typography
- Font: System default (SF Pro on iOS, Roboto on Android)
- Weights: 400 (regular), 600 (semibold), 700 (bold)
- Base size: 14px

### Components
- Buttons: Rounded pill (`borderRadius: 24`), full-width primary actions
- Cards: `borderRadius: 12`, `border: 0.5px solid #E0E0E0`
- Badges: Small pills, color-coded by category
- Inputs: `borderRadius: 10`, `border: 1px solid #DDD`
- Pins: Teal for open, red for closed

---

## 4. Navigation Structure

```
Root Navigator (Stack)
├── Auth Stack
│   ├── SignInScreen
│   └── SignUpScreen
└── Main App (Bottom Tab Navigator)
    ├── Tab 1: Explore (Stack)
    │   ├── MapScreen          ← default
    │   ├── ListScreen         ← toggled from MapScreen
    │   └── DetailScreen       ← opened from pin or list card
    │       ├── ReportScreen
    │       └── SuggestEditScreen
    ├── Tab 2: Add (Stack)
    │   ├── AuthGateScreen     ← shown if not logged in
    │   └── AddRestroomScreen
    │       └── ConfirmScreen
    └── Tab 3: Route (Stack)
        └── RoutePlannerScreen
            └── DetailScreen   ← same Detail component, shared

Top Bar (all main screens)
├── 👤 Profile → ProfileScreen (modal stack)
└── ⚙ Settings → SettingsScreen (modal stack)
```

---

## 5. Screens

### 5.1 MapScreen (Home)
**Route:** `/explore/map`  
**Default screen on launch.**

**Features:**
- Full-screen Google Map centered on user's current location
- Teal pins for open restrooms, red pins for closed
- Blue dot for user location
- Map / List toggle (top right)
- Tapping a pin opens `DetailScreen`
- Top bar: app logo, 👤 Profile icon, ⚙ Settings icon

**Behavior:**
- On load: request location permission, center map, fetch nearby restrooms within user's saved search radius (default 2 miles)
- Re-fetch pins when map is panned significantly
- Pins filtered by active Settings filters

---

### 5.2 ListScreen
**Route:** `/explore/list`  
**Toggled from MapScreen via Map/List toggle.**

**Features:**
- Scrollable list of nearby restrooms
- Sort bar: Closest first / Highest rated / Most recent
- Each card shows: name, open/closed status, star rating + review count, distance, gender badge, access badge, handicap and baby change icons
- Tap card → `DetailScreen`

---

### 5.3 DetailScreen
**Route:** `/explore/detail/:id`  
**Shared between Explore and Route tabs.**

**Features:**
- Photo banner (placeholder icon if no photo uploaded)
- Restroom name + address
- Star rating + total review count
- Info grid (2-column):
  - Gender | Access Type
  - Stalls | Urinals
  - Hours | Open/Closed status
- Amenities badges: ♿ Handicap, 👶 Baby Changing, Free/Paid, Gender Neutral
- Reviews list — each review shows:
  - Reviewer name
  - Star rating (1–5)
  - Time ago (e.g. "2 days ago")
  - Review text
- Action buttons: "Report Issue" | "Suggest Edit"

---

### 5.4 AddRestroomScreen
**Route:** `/add`  
**Requires authentication. Shows `AuthGateScreen` if not logged in.**

**Form Fields:**
- Mini map with draggable pin (auto-placed at current location)
- Cleanliness Rating: 1–5 star tap selector
- Gender: toggle buttons (Male / Female / Unisex — multi-select)
- # of Stalls: stepper (0–20)
- # of Urinals: stepper (0–20)
- Access Type: toggle buttons (Public / Customer Only / Key Required / Password — single select)
- Hours Open: text inputs for open time and close time
- Amenities: checkboxes (Handicap Access / Baby Changing / Paid Entry / Free to Use)
- Photo: camera/gallery picker (optional, max 3 photos)
- Description: multiline text input

**Submit:**
- Validates required fields (location, at least one gender, access type)
- Uploads photo to Firebase Storage if provided
- Writes document to Firestore `restrooms` collection
- Navigates to `ConfirmScreen`

---

### 5.5 ConfirmScreen
**Route:** `/add/confirm`

- Large teal checkmark
- "Restroom added!" heading
- Thank you message
- "View on Map" button → returns to MapScreen
- "Add Another" button → returns to AddRestroomScreen

---

### 5.6 RoutePlannerScreen
**Route:** `/route`

**Features:**
- Start input (text, with "Use current location" default)
- Destination input (text)
- Connector line between the two inputs (visual only)
- Corridor width slider: 1–25 miles (default 5)
- "Find Restrooms Along Route" button
- On search:
  - Calls Google Directions API to get route polyline
  - Queries Firestore for restrooms within N miles of the route path
  - Shows route on map with a shaded corridor overlay
  - START and END markers on the route
  - Numbered teal pins at each matching restroom
  - Results list below map: numbered stops, name, rating, access type, open/closed status
  - Tap any stop → `DetailScreen`

**Validation:** Both fields required before search. Highlights empty field in red.

---

### 5.7 ReportScreen
**Route:** `/detail/:id/report`  
**Requires authentication.**

**Radio options:**
1. Restroom is closed / no longer exists
2. Wrong location
3. Incorrect hours
4. Not accessible to public
5. Spam or inappropriate content
6. Other

- Optional additional notes textarea
- "Submit Report" → writes to Firestore `reports` collection → `ConfirmScreen`

---

### 5.8 SuggestEditScreen
**Route:** `/detail/:id/edit`  
**Requires authentication.**

**Editable fields:**
- Name / Location (text input, pre-filled)
- Hours Open (pre-filled)
- Access Type (toggle buttons, pre-filled)
- Notes for reviewer (textarea)

- "Submit Suggestion" → writes to Firestore `suggested_edits` collection → `ConfirmScreen`

---

### 5.9 ProfileScreen
**Route:** Modal from top bar 👤 icon  
**Requires authentication. Shows `SignInScreen` if not logged in.**

**Sections:**
- Header: avatar initials circle, display name, member since date
- Stats row: # Added | # Reviews | # Edits
- My Activity: My Submissions / My Reviews / My Suggested Edits (list views)
- Account: Edit Profile / Change Password / Settings & Filters
- Sign Out button

---

### 5.10 SettingsScreen
**Route:** Modal from top bar ⚙ icon

**Map Filters (applied globally to map pins and list):**
- Open now only (toggle, default ON)
- Gender filter (All / Male / Female / Unisex — multi-select toggles)
- Access type filter (All / Public / Customer / Key+Code — multi-select toggles)
- Min star rating (1–5 star tap selector, default Any)
- Amenities required (checkboxes: Handicap / Baby Change / Free Entry / Gender Neutral)

**Search:**
- Search radius slider: 1–25 miles (default 2)

**Preferences:**
- Distance units: mi / km toggle
- Dark mode toggle

- "Reset all filters" link at bottom

---

### 5.11 AuthScreens (Sign In / Sign Up)
**SignInScreen:**
- Email + password inputs
- "Sign In" button
- Google SSO button
- Apple SSO button
- Link to SignUpScreen

**SignUpScreen:**
- Full name + email + password inputs
- "Create Account" button
- Link back to SignInScreen

---

## 6. Authentication Rules

| Action | Auth Required |
|---|---|
| View map / pins | No |
| View restroom details | No |
| View reviews | No |
| Add a restroom | Yes |
| Leave a review | Yes |
| Suggest an edit | Yes |
| Report an issue | Yes |
| View profile | Yes |

- On any auth-gated action, show `AuthGateScreen` with Sign In / Create Account options
- After login, return user to the action they were trying to take

---

## 7. Firestore Data Model

### Collection: `users`
```
users/{userId}
  displayName:    string
  email:          string
  photoURL:       string | null
  createdAt:      timestamp
  restroomsAdded: number
  reviewCount:    number
  editCount:      number
```

### Collection: `restrooms`
```
restrooms/{restroomId}
  name:           string
  address:        string
  lat:            number
  lng:            number
  geohash:        string        ← for geo queries
  gender:         string[]      ← ["male","female","unisex"]
  accessType:     string        ← "public"|"customer"|"key"|"password"
  stalls:         number
  urinals:        number
  hoursOpen:      string        ← "6:00 AM"
  hoursClose:     string        ← "10:00 PM"
  isOpen:         boolean       ← computed or manually set
  amenities:      string[]      ← ["handicap","baby_change","free","gender_neutral"]
  photos:         string[]      ← Firebase Storage URLs
  description:    string
  avgRating:      number        ← denormalized, updated on each review
  reviewCount:    number        ← denormalized
  addedBy:        string        ← userId
  createdAt:      timestamp
  updatedAt:      timestamp
  isClosed:       boolean       ← flagged by reports
```

### Subcollection: `restrooms/{restroomId}/reviews`
```
reviews/{reviewId}
  userId:         string
  displayName:    string
  rating:         number        ← 1–5
  text:           string
  createdAt:      timestamp
```

### Collection: `reports`
```
reports/{reportId}
  restroomId:     string
  userId:         string
  reason:         string        ← enum of report reasons
  notes:          string
  createdAt:      timestamp
  status:         string        ← "pending"|"resolved"
```

### Collection: `suggested_edits`
```
suggested_edits/{editId}
  restroomId:     string
  userId:         string
  changes:        map           ← only the fields being changed
  notes:          string
  createdAt:      timestamp
  status:         string        ← "pending"|"approved"|"rejected"
```

### Firestore Indexes Required
- `restrooms` — geohash ASC + avgRating DESC
- `restrooms` — geohash ASC + isOpen DESC
- `reviews` — restroomId + createdAt DESC
- `reports` — status + createdAt DESC

---

## 8. Key Logic

### Geo Queries
Use the `geofire-common` package to:
1. Compute a geohash when a restroom is added
2. Query restrooms within N miles of a lat/lng using geohash bounding boxes
3. Filter results client-side to exact radius

### Route Corridor Query
1. Call Google Directions API → get encoded polyline
2. Decode polyline into array of lat/lng points
3. Sample every Nth point along the route
4. Run geo queries from each sampled point with radius = corridor width
5. Deduplicate results by `restroomId`
6. Return sorted list

### Average Rating Update
- Use a Firestore Cloud Function triggered on `reviews` write
- Recalculates `avgRating` and `reviewCount` on the parent restroom document

### Open/Closed Status
- Compute `isOpen` client-side by comparing current time to `hoursOpen`/`hoursClose`
- Store `isClosed: true` if reported and confirmed by admin

---

## 9. Permissions

| Permission | When Requested |
|---|---|
| Location (foreground) | On first app launch |
| Camera | When tapping photo upload in Add form |
| Photo library | When tapping photo upload in Add form |

---

## 10. File Structure

```
RestroomRadar/
├── app/
│   ├── (auth)/
│   │   ├── SignInScreen.tsx
│   │   └── SignUpScreen.tsx
│   ├── (tabs)/
│   │   ├── explore/
│   │   │   ├── MapScreen.tsx
│   │   │   ├── ListScreen.tsx
│   │   │   └── detail/
│   │   │       ├── DetailScreen.tsx
│   │   │       ├── ReportScreen.tsx
│   │   │       └── SuggestEditScreen.tsx
│   │   ├── add/
│   │   │   ├── AuthGateScreen.tsx
│   │   │   ├── AddRestroomScreen.tsx
│   │   │   └── ConfirmScreen.tsx
│   │   └── route/
│   │       └── RoutePlannerScreen.tsx
├── components/
│   ├── RestroomPin.tsx
│   ├── RestroomCard.tsx
│   ├── StarRating.tsx
│   ├── ReviewItem.tsx
│   ├── BadgePill.tsx
│   ├── InfoCell.tsx
│   ├── NumStepper.tsx
│   ├── ToggleGroup.tsx
│   └── AuthGate.tsx
├── hooks/
│   ├── useLocation.ts
│   ├── useNearbyRestrooms.ts
│   ├── useRouteRestrooms.ts
│   └── useAuth.ts
├── services/
│   ├── firebase.ts
│   ├── restroomService.ts
│   ├── reviewService.ts
│   ├── reportService.ts
│   ├── geoService.ts
│   └── directionsService.ts
├── context/
│   ├── AuthContext.tsx
│   └── FiltersContext.tsx
├── constants/
│   ├── Colors.ts
│   └── Theme.ts
└── types/
    ├── Restroom.ts
    ├── Review.ts
    └── User.ts
```

---

## 11. Environment Variables

```
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=
EXPO_PUBLIC_GOOGLE_DIRECTIONS_API_KEY=
FIREBASE_API_KEY=
FIREBASE_AUTH_DOMAIN=
FIREBASE_PROJECT_ID=
FIREBASE_STORAGE_BUCKET=
FIREBASE_MESSAGING_SENDER_ID=
FIREBASE_APP_ID=
```

---

## 12. v1 Scope — In / Out

### In Scope (v1)
- Map with geo-queried pins
- Add restroom with full details + photo
- Restroom detail view
- Star ratings + text reviews
- Report issue
- Suggest edit
- Route planner with corridor search
- Settings / filters (radius, gender, access, rating, open now, units)
- Email + Google + Apple auth
- User profile with activity stats

### Out of Scope (v2+)
- Push notifications
- Admin dashboard for reviewing reports/edits
- Offline mode
- Restroom verification badges
- Social features (following users, likes on reviews)
- Paid/premium tier
- Web version
