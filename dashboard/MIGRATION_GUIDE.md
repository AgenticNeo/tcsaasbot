# Migration Guide: Updating Pages to Connecteam Theme

This guide helps you update existing pages and components to use the new Connecteam-inspired design system.

---

## Quick Start

### 1. Import New Components
```tsx
import { 
  PrimaryButton, 
  SecondaryButton, 
  FeatureCard,
  StatCard,
  SectionHeader,
  Badge 
} from '@/components/ConnecteamUIKit';
```

### 2. Update Button Styling
**Before:**
```tsx
<button className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded">
  Click Me
</button>
```

**After:**
```tsx
<PrimaryButton>Click Me</PrimaryButton>
```

### 3. Update Card Styling
**Before:**
```tsx
<div className="rounded-lg shadow-md p-4 bg-white">
  Content
</div>
```

**After:**
```tsx
<div className="card-elevated">
  Content
</div>
```

---

## Step-by-Step Migration

### Phase 1: Color Variables
Replace all hardcoded colors with Tailwind classes or CSS variables.

**Replace These Patterns:**
```tsx
// ❌ Hardcoded hex colors
style={{ color: '#1E40AF' }}
className="bg-blue-500"

// ✅ Use CSS variables or custom classes
className="text-primary"
className="bg-primary"
style={{ color: 'hsl(var(--primary))' }}
```

### Phase 2: Button Components
Replace all button implementations with the new component library.

**Pattern 1: Simple Button**
```tsx
// ❌ Before
<button className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600">
  Submit
</button>

// ✅ After
<PrimaryButton onClick={handleSubmit}>Submit</PrimaryButton>
```

**Pattern 2: Secondary Button**
```tsx
// ❌ Before
<button className="bg-gray-200 text-gray-900 px-4 py-2 rounded-lg hover:bg-gray-300">
  Cancel
</button>

// ✅ After
<SecondaryButton onClick={handleCancel}>Cancel</SecondaryButton>
```

**Pattern 3: Different Sizes**
```tsx
// ✅ Size options: sm, md, lg
<PrimaryButton size="sm">Small</PrimaryButton>
<PrimaryButton size="md">Medium</PrimaryButton>
<PrimaryButton size="lg">Large</PrimaryButton>
```

### Phase 3: Card Components
Update card styling across the application.

**Pattern 1: Feature Cards**
```tsx
// ❌ Before
<div className="rounded-lg p-6 border border-gray-200 bg-white">
  <div className="text-blue-500 mb-4">
    <Zap size={32} />
  </div>
  <h3 className="text-xl font-bold mb-2">Feature Title</h3>
  <p className="text-gray-600">Feature description</p>
</div>

// ✅ After
<FeatureCard
  icon={Zap}
  title="Feature Title"
  description="Feature description"
/>
```

**Pattern 2: Data/Stat Cards**
```tsx
// ❌ Before
<div className="p-4 bg-white rounded-lg border border-gray-200">
  <p className="text-sm text-gray-600">Users</p>
  <p className="text-2xl font-bold text-gray-900">1,234</p>
</div>

// ✅ After
<StatCard
  label="Users"
  value="1,234"
  icon={Users}
/>
```

**Pattern 3: Content Cards**
```tsx
// ❌ Before
<div className="p-6 rounded-lg shadow bg-white">
  {content}
</div>

// ✅ After
<div className="card-elevated">
  {content}
</div>
```

### Phase 4: Text & Typography
Standardize heading and text styling.

**Heading Hierarchy:**
```tsx
// Page title
<h1 className="text-5xl font-bold text-foreground">Title</h1>

// Section header
<h2 className="text-3xl font-bold text-foreground mb-6">Section</h2>

// Subsection
<h3 className="text-2xl font-bold text-foreground mb-4">Subsection</h3>

// Component header
<h4 className="text-lg font-bold text-foreground mb-2">Header</h4>
```

**Text Styling:**
```tsx
// Primary text
<p className="text-foreground">Main content</p>

// Secondary text (muted)
<p className="text-muted-foreground">Secondary content</p>

// Small text/captions
<p className="text-sm text-muted-foreground">Caption</p>

// Emphasis
<span className="font-semibold text-foreground">Important</span>
```

### Phase 5: Sections & Layouts
Organize page content with proper structure.

**Section Header Pattern:**
```tsx
<SectionHeader
  title="Main Features"
  description="Everything you need"
  action={<PrimaryButton>Add New</PrimaryButton>}
/>
```

**Feature Grid:**
```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  <FeatureCard icon={Zap} title="Fast" description="Quick setup" />
  <FeatureCard icon={Shield} title="Safe" description="Secure data" />
  <FeatureCard icon={Users} title="Team" description="Collaborate" />
</div>
```

**Stats Grid:**
```tsx
<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
  <StatCard label="Users" value="1.2K" icon={Users} />
  <StatCard label="Revenue" value="$50K" icon={TrendingUp} />
  <StatCard label="Growth" value="+23%" icon={BarChart3} />
  <StatCard label="Uptime" value="99.9%" icon={CheckCircle} />
</div>
```

### Phase 6: Special Elements
Update badges, tags, and special components.

**Badges:**
```tsx
// Variants: primary, secondary, success, warning, error
<Badge variant="primary">Active</Badge>
<Badge variant="success">Completed</Badge>
<Badge variant="warning">Pending</Badge>
```

**Inputs & Forms:**
```tsx
<input
  className="
    px-3 py-2 rounded-lg
    bg-input text-foreground
    border border-input
    focus:outline-none focus:ring-2 focus:ring-primary
    dark:bg-gray-800 dark:border-gray-700
  "
  placeholder="Enter text"
/>
```

---

## Common Pages to Update

### 1. Dashboard Page
```tsx
// ✅ Updated structure
<div className="min-h-screen bg-background">
  <SectionHeader title="Dashboard" description="Overview of your system" />
  
  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
    <StatCard label="Active Bots" value="24" icon={Bot} />
    <StatCard label="Conversations" value="1.2K" icon={MessageSquare} />
    <StatCard label="Success Rate" value="94%" icon={TrendingUp} />
    <StatCard label="Uptime" value="99.9%" icon={Shield} />
  </div>

  <SectionHeader title="Recent Activity" />
  {/* Activity list */}
</div>
```

### 2. Features/Services Page
```tsx
// ✅ Updated structure
<div>
  <SectionHeader 
    title="Our Features"
    description="Everything you need to succeed"
  />
  
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    <FeatureCard icon={Zap} title="Fast" description="Quick setup" />
    <FeatureCard icon={Shield} title="Secure" description="Protected data" />
    <FeatureCard icon={Users} title="Team" description="Collaborate easily" />
  </div>
</div>
```

### 3. CTA/Action Page
```tsx
// ✅ Updated structure
<div className="text-center py-16">
  <h2 className="text-4xl font-bold text-foreground mb-4">Ready to start?</h2>
  <p className="text-lg text-muted-foreground mb-8">Join thousands of teams</p>
  <div className="flex gap-4 justify-center">
    <PrimaryButton size="lg">Get Started</PrimaryButton>
    <SecondaryButton size="lg">Learn More</SecondaryButton>
  </div>
</div>
```

---

## CSS Classes Reference

### Colors
```tsx
// Text colors
className="text-foreground"        // Primary text
className="text-muted-foreground"  // Secondary text
className="text-primary"           // Primary accent
className="text-secondary"         // Secondary accent

// Background colors
className="bg-background"          // Page background
className="bg-card"                // Card background
className="bg-primary"             // Primary background
className="bg-secondary"           // Secondary background

// Border colors
className="border-border"          // Default border
className="border-primary"         // Primary border
```

### Sizing
```tsx
// Padding
className="p-4"      // All sides
className="px-4"     // Horizontal
className="py-4"     // Vertical
className="pt-4"     // Top

// Margin
className="m-4"      // All sides
className="mb-6"     // Bottom
className="mt-3"     // Top
className="gap-4"    // Grid/flex gap

// Sizing
className="w-full"   // Full width
className="max-w-xl" // Max width container
className="h-64"     // Height
```

### Effects
```tsx
// Shadows
className="shadow-sm"
className="shadow-md"
className="shadow-lg"
className="hover:shadow-xl"

// Rounded corners
className="rounded-lg"    // 12px
className="rounded-full"  // Pill shape

// Transitions
className="transition-all"
className="duration-200"
```

---

## Migration Checklist

- [ ] Import new components in page file
- [ ] Replace all button components
- [ ] Replace all card components
- [ ] Update color references to use CSS variables
- [ ] Update typography hierarchy
- [ ] Add section headers with SectionHeader component
- [ ] Update grid layouts with proper responsive classes
- [ ] Add hover effects to interactive elements
- [ ] Test dark mode (add `dark` class)
- [ ] Test mobile responsiveness
- [ ] Verify accessibility (focus states, contrast)
- [ ] Test in Safari, Chrome, Firefox

---

## Common Issues & Solutions

### Issue: Colors look different
**Solution**: Ensure you're using the CSS variable names, not hardcoded colors
```tsx
// ❌ Wrong
className="bg-blue-500"

// ✅ Correct
className="bg-primary"
```

### Issue: Buttons don't look right
**Solution**: Use the button components from ConnecteamUIKit
```tsx
// ❌ Wrong
<button className="bg-blue-500">

// ✅ Correct
<PrimaryButton>
```

### Issue: Dark mode doesn't work
**Solution**: Add `dark` class to `<html>` element (handled automatically)
```tsx
// Verify in layout.tsx
<html className={isDark ? 'dark' : ''}>
```

### Issue: Spacing looks off
**Solution**: Use consistent spacing from the scale (4, 8, 12, 16, 24, 32, 48px)
```tsx
// ❌ Random values
className="p-5 mb-7"

// ✅ From scale
className="p-4 mb-6"
```

---

## Testing Your Changes

### Visual Regression
- Take screenshots before and after
- Compare on desktop and mobile
- Test all interactive states (hover, active, focus)

### Functionality
- Verify all buttons work
- Check links still navigate
- Test form submissions

### Accessibility
- Tab through page (keyboard navigation)
- Check focus states are visible
- Test color contrast (use WebAIM)
- Test with screen reader

### Performance
- Check no console errors
- Verify images load properly
- Test page load time

---

## Support & Questions

Refer to these files for more information:
- **Design System**: `lib/design-system.ts`
- **Components**: `components/ConnecteamUIKit.tsx`
- **Visual Guide**: `CONNECTEAM_VISUAL_REFERENCE.md`
- **Main Guide**: `CONNECTEAM_THEME_UPDATE.md`
