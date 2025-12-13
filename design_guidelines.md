# Design Guidelines: Virtual Try-On D2C Platform

## Design Approach
**Reference-Based Strategy** drawing from modern fashion tech leaders (Warby Parker AR features, Allbirds clean aesthetic, Shopify commerce) combined with tech product clarity (Apple's minimalism). The design must balance technical functionality with fashion-forward appeal to build trust in both the technology and the brand.

## Typography System
**Primary Font:** Inter or DM Sans via Google Fonts CDN - modern, clean sans-serif
**Headings:** 
- H1: text-5xl md:text-6xl font-bold tracking-tight
- H2: text-3xl md:text-4xl font-semibold
- H3: text-xl md:text-2xl font-medium

**Body:** text-base md:text-lg leading-relaxed
**UI Elements:** text-sm font-medium for buttons, labels
**Product Prices:** text-2xl font-bold with currency in slightly smaller weight

## Layout System
**Spacing Units:** Tailwind primitives - 4, 6, 8, 12, 16, 24 (as in p-4, mb-8, gap-6)
**Containers:** max-w-7xl mx-auto px-4 for main content, max-w-4xl for focused sections
**Grid Systems:** 
- Product grids: grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6
- Try-on interface: Full viewport utilization with sidebar product selector

## Core Page Structures

### Homepage/Landing
**Hero Section:** Full-viewport (min-h-screen) split layout
- Left: Compelling lifestyle image showing brand aesthetic (not try-on UI)
- Right: Value proposition + "Try On Now" CTA
- Below fold: Three-column feature grid (Camera Try-On, Perfect Fit, Easy Shopping)
- Product showcase: 2-column grid on mobile, 4-column on desktop with hover elevation
- Trust section: Customer testimonials in cards with centered layout
- Footer: Newsletter signup, social links, size guide access, contact info

### Virtual Try-On Interface (Main Feature)
**Layout:** Asymmetric split-screen design
- Camera viewport: 70% width on desktop, full-width on mobile
- Product selector sidebar: 30% width (right side), vertical scroll
- Control overlay on camera: Bottom-aligned controls with frosted glass effect
- Size recommendation badge: Top-right corner with subtle animation on change

**Camera Feed Container:**
- Rounded corners (rounded-2xl) with subtle shadow
- Real-time pose keypoints: Minimal visual indicators (small dots on shoulders)
- Garment overlay: Centered, auto-scaled with smooth transitions
- Control panel: Fixed bottom position with backdrop-blur-xl, p-6 spacing

**Product Selector Sidebar:**
- Vertical scrolling grid: grid-cols-1 gap-4
- Product thumbnails: Aspect square with rounded-xl borders
- Active state: Ring offset with scale transform
- Navigation arrows: Large, clear left/right buttons (h-16 w-16)
- Quick filters: Size/color chips at top of sidebar

### Product Detail Page
**Layout:** Two-column split (1:1 on desktop)
- Left: Large product image with 4-5 thumbnail gallery below
- Right: Product info hierarchy (name → price → size selector → color swatches → add to cart)
- Size chart: Expandable accordion component
- Below: "Try On" CTA button (prominent, full-width on mobile)
- Related products: 4-column grid at page bottom

### Shopping Cart
**Design:** Slide-out drawer (right side) or dedicated page
- Cart items: List layout with product thumbnail (left), details (center), quantity controls (right)
- Sticky footer: Subtotal + checkout button
- Empty state: Centered illustration with "Start Trying On" CTA

### Admin Panel
**Layout:** Dashboard grid with sidebar navigation
- Product upload: Drag-drop zone (border-dashed, border-2, h-64)
- Product management: Table view with inline editing
- Analytics cards: 3-column grid showing try-ons, conversions, popular items

## Component Library

### Navigation
**Header:** Fixed top, backdrop-blur-md with border-b
- Logo (left), nav links (center on desktop), cart icon + counter badge (right)
- Mobile: Hamburger menu with slide-out drawer

### Buttons
**Primary CTA:** px-8 py-4 rounded-full font-semibold with hover scale (scale-105)
**Secondary:** px-6 py-3 rounded-lg border-2 with hover effects
**Icon buttons:** p-3 rounded-full for controls
**Try-on overlays:** Buttons on camera feed use backdrop-blur-lg with semi-transparent backgrounds

### Product Cards
**Structure:** Vertical layout with aspect-square image container
- Image: Object-cover with rounded-t-xl
- Content: p-4 spacing
- Hover: Subtle scale and shadow elevation (hover:scale-102 hover:shadow-xl)
- "Quick Try-On" button appears on hover (absolute positioning)

### Form Elements
**Inputs:** px-4 py-3 rounded-lg border with focus ring
**Size Selectors:** Grid of radio buttons styled as chips (px-4 py-2, rounded-full)
**Color Swatches:** Circular buttons (w-10 h-10) with checkmark on selected state
**Dropdowns:** Custom styled select with chevron icon

### Camera Controls
**Control Bar:** Frosted glass panel at bottom of camera viewport
- Icon buttons arranged horizontally with gap-4
- Labels below icons (text-xs)
- Toggle buttons with clear on/off states
- Capture/screenshot button: Larger, centered position

### Size Recommendation Badge
**Design:** Floating card (absolute positioning, top-right)
- Rounded-xl with shadow-lg
- Icon + "Recommended: Size M" text
- Subtle pulse animation on size change
- p-4 spacing with compact layout

### Overlays & Modals
**Size Chart Modal:** Centered overlay with backdrop blur
- Table layout with clear size measurements
- Close button (top-right, rounded-full)
- max-w-2xl container

## Interactions & Animations
**Minimize animations** - only use where essential:
- Product image transitions: 200ms ease-in-out
- Garment overlay changes: 300ms cross-fade
- Button hover states: 150ms scale transform
- Cart drawer: Slide-in from right (300ms)
**No scroll-triggered animations** on try-on interface

## Accessibility
- Camera permission prompts: Clear, centered with explanation
- Size selectors: Keyboard navigable with visible focus states
- Product images: Descriptive alt text
- High contrast for all text on camera overlays
- Touch targets: Minimum 44px for all interactive elements

## Images
**Hero Image:** Lifestyle shot showing someone wearing brand apparel in aspirational setting (outdoor, urban, or studio depending on brand personality) - wide format, professional photography
**Product Images:** All transparent PNGs loaded from GridFS via `/api/images/{fileId}`
**Trust Section:** Customer photo testimonials (authentic, not stock)
**Empty States:** Simple illustration for empty cart, no products found

## Responsive Breakpoints
**Mobile (< 768px):** 
- Stack all columns vertically
- Full-width camera feed
- Bottom sheet for product selector
- Simplified navigation

**Tablet (768px - 1024px):**
- Two-column grids where applicable
- Condensed sidebar for try-on interface

**Desktop (> 1024px):**
- Full multi-column layouts
- Side-by-side try-on experience
- Expanded product grids

## Key Design Principles
1. **Camera-First:** Try-on interface is the hero experience - prioritize viewport space
2. **Trust Through Clarity:** Clean, uncluttered layouts build confidence in the technology
3. **Seamless Commerce:** Shopping actions integrate naturally without disrupting try-on flow
4. **Performance Perception:** Instant visual feedback for all interactions, loading states for image fetching
5. **Brand Consistency:** Typography and spacing create cohesive identity across try-on tool and commerce pages