# Connecteam Theme - Visual Reference Guide

## Color Palette

### Primary Blue
```
HEX: #4A9EFF
HSL: 208° 90% 56%
RGB: 74, 158, 255
Usage: Main buttons, primary actions, focus states, links
```

### Secondary Teal
```
HEX: #06DDB8
HSL: 170° 95% 47%
RGB: 6, 221, 184
Usage: Accents, success states, highlights, secondary actions
```

### Neutral Grays (Light Mode)
```
White:        #FFFFFF    (Background)
Dark Text:    #1F2937    (Foreground)
Muted Text:   #6B7280    (Muted foreground)
Border:       #E5E7EB    (Borders)
```

### Neutral Grays (Dark Mode)
```
Dark BG:      #111827    (Background)
Light Text:   #F9FAFB    (Foreground)
Muted Text:   #D1D5DB    (Muted foreground)
Border:       #374151    (Borders)
```

---

## Component Showcase

### Buttons

#### Primary Button
- **State**: Default
- **Background**: Gradient (Blue → Dark Blue)
- **Text Color**: White
- **Padding**: 12px 16px (sm) → 16px 24px (lg)
- **Border Radius**: 8px
- **Shadow**: md (active) → lg (hover)
- **Hover Effect**: Scale + Shadow increase

#### Secondary Button
- **State**: Default
- **Background**: Gray-100 / Gray-800 (dark)
- **Border**: 1px Gray-300 / Gray-600 (dark)
- **Text Color**: Gray-900 / White (dark)
- **Hover**: Background lightens

### Cards

#### Feature Card
- **Layout**: Vertical stack (icon, title, description)
- **Background**: Gradient white to white (light) / gradient gray to gray (dark)
- **Icon Container**: Blue-to-Teal gradient with white icon
- **Border**: 1px gray border
- **Hover**: Translate up 4px, border color → primary
- **Shadow**: md (default) → lg (hover)

#### Stat Card
- **Layout**: Horizontal (icon right, content left)
- **Background**: Card background color
- **Icon Container**: Primary/10% background with primary icon
- **Values**: Large, bold text
- **Change**: Small text with green/red color

---

## Typography Scale

| Level | Size | Weight | Line Height | Usage |
|-------|------|--------|-------------|-------|
| h1 | 48px | 700 | 56px | Page titles |
| h2 | 36px | 700 | 44px | Section headers |
| h3 | 30px | 700 | 36px | Subsection titles |
| h4 | 24px | 700 | 32px | Component headers |
| body | 16px | 400 | 24px | Main text |
| small | 14px | 400 | 20px | Secondary text |
| xs | 12px | 400 | 16px | Captions, badges |

---

## Spacing System

| Token | Size | Usage |
|-------|------|-------|
| xs | 4px | Very tight spacing (icon margins) |
| sm | 8px | Tight spacing (label margins) |
| md | 12px | Content padding |
| lg | 16px | Default padding (buttons, inputs) |
| xl | 24px | Section spacing |
| 2xl | 32px | Card padding |
| 3xl | 48px | Major section spacing |

---

## Effects & Animations

### Shadows
```css
sm:   0 1px 2px 0 rgba(0, 0, 0, 0.05)
md:   0 4px 6px -1px rgba(0, 0, 0, 0.1)
lg:   0 10px 15px -3px rgba(0, 0, 0, 0.1)
xl:   0 20px 25px -5px rgba(0, 0, 0, 0.1)
2xl:  0 25px 50px -12px rgba(0, 0, 0, 0.25)
```

### Transitions
```css
fast:  150ms cubic-bezier(0.4, 0, 0.2, 1)
base:  200ms cubic-bezier(0.4, 0, 0.2, 1)
slow:  300ms cubic-bezier(0.4, 0, 0.2, 1)
```

### Glassmorphism
```css
Backdrop: blur(16px) saturate(180%)
Border: 1px rgba(255, 255, 255, 0.4) [light]
Border: 1px rgba(255, 255, 255, 0.15) [dark]
Shadow: 0 8px 32px rgba(31, 38, 135, 0.37)
```

---

## Responsive Breakpoints

| Breakpoint | Size | Usage |
|-----------|------|-------|
| Default | 0px | Mobile |
| sm | 640px | Small tablets |
| md | 768px | Tablets |
| lg | 1024px | Desktops |
| xl | 1280px | Large desktops |
| 2xl | 1536px | Extra large screens |

---

## Component Patterns

### Feature Grid
```
1 column (mobile)
2 columns (tablet)
3 columns (desktop)
Spacing: 24px gap
```

### Stats Layout
```
2 columns (mobile)
2 columns (tablet)
4 columns (desktop)
Spacing: 16px gap
```

### Hero Section
```
Centered text
Max-width: 56rem
Icon/Badge above title
Buttons below description
```

---

## Accessibility

### Color Contrast
- **WCAG AA**: Minimum 4.5:1 for normal text
- **WCAG AAA**: Minimum 7:1 for enhanced contrast
- All theme colors meet WCAG AA standards

### Focus States
- **Outline**: 2px primary color
- **Visible**: High contrast with background
- **Keyboard Navigation**: Supported on all interactive elements

### Font Sizes
- **Minimum**: 14px for body text
- **Line Height**: 1.5 minimum (150% of font size)
- **Letter Spacing**: Not condensed

---

## Dark Mode

Automatically triggered by:
- System preference (prefers-color-scheme)
- Manual toggle (add `dark` class to `<html>`)

Colors automatically adjust:
```tsx
Light: --primary: 208 90% 56%    (Blue-500)
Dark:  --primary: 208 90% 62%    (Blue-400)
```

---

## Usage Examples

### Creating a Feature Card
```tsx
<FeatureCard
  icon={Zap}
  title="Lightning Fast"
  description="Deploy in seconds with our optimized setup"
/>
```

### Creating a Stat Card
```tsx
<StatCard
  label="Total Users"
  value="12,543"
  change={{ value: 23, isPositive: true }}
  icon={Users}
/>
```

### Creating a Section
```tsx
<SectionHeader
  title="Dashboard"
  description="Your overview and key metrics"
  action={<PrimaryButton>Add New</PrimaryButton>}
/>

<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  {/* Content */}
</div>
```

### Using Colors in CSS
```css
/* Using CSS variables */
color: hsl(var(--primary));
background: hsl(var(--secondary));
border-color: hsl(var(--border));
```

---

## File References

- **Design System**: `lib/design-system.ts`
- **Components**: `components/ConnecteamUIKit.tsx`
- **Styles**: `app/globals.css`
- **Example Page**: `components/ConnecteamWelcome.tsx`
- **Documentation**: `CONNECTEAM_THEME_UPDATE.md`

---

## Testing Checklist

- [ ] All buttons have proper hover states
- [ ] Cards have shadow elevation on hover
- [ ] Focus states are visible (keyboard navigation)
- [ ] Dark mode colors are applied correctly
- [ ] Mobile responsive (test at 375px, 768px, 1024px)
- [ ] Text contrast meets WCAG AA (4.5:1)
- [ ] Animations are smooth (60fps)
- [ ] Touch targets are at least 44px
- [ ] All icons are properly sized
- [ ] Spacing is consistent throughout
