# Design Guidelines: Car Rental Platform (Zoomcar-Inspired)

## Design Approach
**Reference-Based Strategy** drawing from established booking platforms:
- **Primary Inspiration**: Zoomcar (car rental flow and listing presentation)
- **Secondary References**: Airbnb (booking experience), Uber (clean dashboard patterns), OYO (search and filters)
- **Principle**: Build trust through professional polish, clear information hierarchy, and seamless booking flow

## Typography System

**Font Families** (via Google Fonts):
- **Primary**: Inter (400, 500, 600, 700) - UI elements, body text, forms
- **Accent**: Poppins (600, 700) - Headlines, hero text, CTAs

**Type Scale**:
- Hero Headline: text-5xl md:text-6xl lg:text-7xl (Poppins Bold)
- Page Title: text-3xl md:text-4xl (Poppins SemiBold)
- Section Header: text-2xl md:text-3xl (Poppins SemiBold)
- Card Title: text-xl md:text-2xl (Inter SemiBold)
- Body Large: text-lg (Inter Regular)
- Body: text-base (Inter Regular)
- Small: text-sm (Inter Medium)
- Micro: text-xs (Inter Medium)

## Layout & Spacing System

**Spacing Primitives**: Use Tailwind units of 2, 4, 6, 8, 12, 16, 20, 24 for consistent rhythm
- Component padding: p-4, p-6, p-8
- Section spacing: py-12 md:py-16 lg:py-24
- Card gaps: gap-4, gap-6, gap-8
- Element margins: mb-4, mb-6, mb-8

**Container Strategy**:
- Full-width sections: w-full with max-w-7xl mx-auto px-4 md:px-6 lg:px-8
- Content sections: max-w-6xl mx-auto
- Forms/narrow content: max-w-2xl mx-auto
- Dashboard panels: max-w-7xl with grid layouts

**Grid Patterns**:
- Car listings: grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6
- Feature sections: grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8
- Dashboard stats: grid-cols-2 md:grid-cols-4 gap-4
- Reviews: grid-cols-1 lg:grid-cols-2 gap-6

## Component Library

### Navigation
**Desktop Header**: Fixed top, full-width, h-20
- Logo (left, h-8 or h-10)
- Main nav links (center, flex gap-8)
- User menu + CTA button (right, flex gap-4)
- Search bar integrated or accessible via icon

**Mobile Header**: h-16
- Hamburger menu (left)
- Logo (center)
- User icon (right)
- Full-screen overlay menu with stacked links

### Hero Section
**Layout**: Full-width, min-h-[500px] md:min-h-[600px]
- Large background image (high-quality car photography, slightly dimmed overlay)
- Centered content with max-w-4xl
- Hero headline + subheadline stack (mb-6, mb-4)
- Booking widget (see below) OR primary CTA with blurred background

**Booking Widget** (if in hero):
- Elevated card (shadow-xl, rounded-2xl, p-6 md:p-8)
- Single row on desktop: Location | Pick-up Date | Drop-off Date | Search Button
- Stacked on mobile with full-width inputs
- Date pickers with calendar icon
- Large search/find cars button (w-full md:w-auto)

### Car Listing Cards
**Card Structure**: Rounded-xl, shadow-md, overflow-hidden, hover:shadow-xl transition
- Image section: aspect-[4/3], object-cover with gradient overlay on hover
- Quick action badge (top-right absolute): "Available Now" or "Instant Booking"
- Content section: p-4 md:p-6
  - Car name: text-xl font-semibold mb-2
  - Brand + Year: text-sm mb-3
  - Icon row: Transmission | Fuel | Seats (flex gap-4, text-sm with icons)
  - Rating: Stars (★★★★☆) + review count inline
  - Pricing: Large price/day + "View Details" button (mt-4)

### Car Detail Page
**Image Gallery**: 
- Main image: aspect-[16/9] or aspect-[4/3] on desktop, full-width
- Thumbnail strip: grid-cols-4 md:grid-cols-6 gap-2 (scrollable horizontally on mobile)
- Zoom functionality on click (modal with large image)
- 6-8 images minimum (exterior, interior, dashboard, trunk)

**Details Layout**: Two-column (lg:grid-cols-3)
- Left column (lg:col-span-2):
  - Car specifications: grid-cols-2 gap-4 (Brand, Model, Year, Registration, Type, etc.)
  - Features list: grid-cols-2 md:grid-cols-3 with checkmark icons
  - Owner information card (avatar, name, rating, "Owned since" date)
  - Reviews section (full width)
- Right column (lg:col-span-1, sticky top-24):
  - Booking card with date selection, price breakdown, total, book button
  - Need help section with owner contact options

### Dashboard Layouts

**User Dashboard**:
- Sidebar navigation (w-64, hidden on mobile, slide-out drawer)
- Main content area with stats cards row (grid-cols-1 md:grid-cols-3 gap-4)
- Tabs for: My Bookings | Payment History | Reviews | Profile
- Booking cards: Timeline style with car thumbnail, dates, status badge

**Owner Dashboard**:
- Revenue chart (full-width, h-64 md:h-80)
- My Cars section: List view with thumbnail, key details, action buttons (Edit, Remove, View Stats)
- Add Car button (prominent, top-right)
- Customer feedback feed

**Admin Dashboard**:
- Multi-metric overview (grid-cols-2 md:grid-cols-4)
- Data tables for Users, Cars, Bookings with search/filter
- Action dropdowns for each row

### Forms

**Input Fields**: 
- Height: h-12, rounded-lg, border-2
- Label: text-sm font-medium mb-2
- Error state: border-red + error text below
- Focus: ring-4 effect

**File Upload** (Car images):
- Drag-and-drop zone: border-2 border-dashed, rounded-xl, p-8, min-h-[200px]
- Preview grid below: grid-cols-3 md:grid-cols-4 gap-4
- Reorder capability with drag handles

**Buttons**:
- Primary CTA: h-12 px-8 rounded-lg font-semibold text-base
- Secondary: h-12 px-6 rounded-lg font-medium (outline style)
- Icon buttons: h-10 w-10 rounded-full
- All with subtle shadow and hover:scale-105 transition

### Search & Filters
**Filter Sidebar** (Desktop: w-72, Mobile: Full-screen modal):
- Collapsible sections: Brand, Price Range, Car Type, Seats, Transmission, Fuel
- Checkboxes with count badges
- Price range: Dual-thumb slider
- Apply/Reset buttons at bottom (sticky)

**Search Bar**: 
- Height: h-12 md:h-14
- Icon (left, pl-12)
- Autocomplete dropdown with recent searches + suggestions
- Clear button (right, visible when typing)

### Review System
**Review Card**:
- User avatar + name + date (flex items-center gap-3)
- Star rating (large, mb-3)
- Review text (prose max-w-none)
- Owner response (ml-8 md:ml-12, border-l-4, pl-4, mt-4) if present
- Helpful buttons (thumbs up/down count)

### Additional Elements

**Empty States**: Centered, max-w-md
- Large icon (h-24 w-24, mb-4)
- Headline + description
- CTA button

**Loading States**: Skeleton screens matching actual content layout

**Toast Notifications**: Fixed top-right, stack vertically, slide-in animation
- Success/Error/Info variants
- Icon + message + close button
- Auto-dismiss after 5s

**Modals**: max-w-2xl md:max-w-4xl for booking confirmation, payment
- Overlay with blur effect
- Rounded-2xl, p-6 md:p-8
- Close button (absolute top-right)

## Icons
**Library**: Heroicons (via CDN)
- Use outline style for default states
- Solid style for active/selected states
- Consistent sizing: h-5 w-5 for inline, h-6 w-6 for standalone

## Images

**Hero Section**: Wide-angle shot of premium cars in modern setting (1920x800px minimum), professionally lit
**Car Listings**: High-quality photos from 3/4 front angle showing full vehicle (800x600px)
**Car Details Gallery**: 6-8 images including exterior (front, rear, side), interior (dashboard, seats, trunk)
**Dashboard Avatars**: Professional user/owner photos (circular crop)
**About/Team Section**: Candid team photos in modern office or with cars
**Testimonials**: Customer photos (authentic, diverse representation)

**Image Treatment**: All images should have subtle border radius (rounded-lg to rounded-xl), proper aspect ratios maintained, lazy loading implemented, srcset for responsive delivery