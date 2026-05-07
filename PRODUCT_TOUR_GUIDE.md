# 🎯 Product Tour Feature

## Overview
The Gradebook now includes an **interactive product tour** that guides new users through the system step-by-step, making it easy for non-technical users to understand and use the gradebook.

## ✨ Features

### 🎪 **Interactive Spotlight**
- Highlights the specific UI element being explained
- Darkens the rest of the screen to focus attention
- Animated pulsing border draws the eye
- Beautiful visual effects

### 📱 **Smart Tooltips**
- Position automatically based on available space
- Clean, modern card design
- Shows current step number and progress
- Easy-to-read content

### 🎮 **User-Friendly Navigation**
- **Next/Back buttons** - Navigate through steps
- **Progress bar** - Visual indication of tour completion
- **Step indicators** - Click to jump to any step
- **Skip anytime** - Users can exit the tour if needed

### 💾 **Remembers Completion**
- Stores completion status in browser localStorage
- Only shows automatically on first visit
- Can be manually restarted anytime via "Take a Tour" button

## 🚀 How It Works

### For First-Time Users:
1. User opens the Gradebook page
2. Tour automatically starts after 1 second delay
3. User is guided through 10 interactive steps
4. Completion is saved to localStorage

### For Returning Users:
1. Tour doesn't auto-start
2. Click the **"Take a Tour"** button to restart
3. Sparkly button is always visible in the top-right

## 📚 Tour Steps

The tour covers these key areas:

1. **Welcome** - Introduction to the Gradebook
2. **Subject Selection** - How to choose a subject
3. **Section Selection** - How to pick a class section
4. **Quarter Selection** - How to select grading period
5. **Help Button** - Where to get help anytime
6. **Column Types** - Understanding WW, PT, QA badges
7. **Entering Grades** - How to input scores
8. **Auto Calculations** - Weighted totals explained
9. **Final Grade** - How the final grade works
10. **Completion** - Ready to start message

## 🎨 Visual Design

### Color Scheme:
- **Primary Accent**: Blue (#3B82F6)
- **Success**: Green (#10B981)
- **Gradient Button**: Blue to Purple
- **Overlay**: Semi-transparent black (70%)

### Animations:
- Fade in/zoom in entrance
- Pulsing spotlight border
- Smooth transitions between steps
- Progress bar animation

## 🔧 Technical Implementation

### Component: `ProductTour.tsx`

**Props:**
```typescript
{
  steps: TourStep[];        // Array of tour steps
  isOpen: boolean;          // Show/hide tour
  onClose: () => void;      // Called when tour closes
  onComplete?: () => void;  // Called when tour completes
  storageKey?: string;      // localStorage key for completion
}
```

**TourStep Interface:**
```typescript
{
  target: string;           // CSS selector (e.g., '[data-tour="page-title"]')
  title: string;            // Step title
  content: string;          // Step description
  placement?: 'top' | 'bottom' | 'left' | 'right';
  spotlightPadding?: number;
}
```

### Usage Example:

```tsx
// 1. Import the component
import { ProductTour, type TourStep } from '../../components/ui/ProductTour';

// 2. Define tour steps
const tourSteps: TourStep[] = [
  {
    target: '[data-tour="welcome"]',
    title: 'Welcome! 👋',
    content: 'Let me show you around...',
    placement: 'bottom',
  },
  // ... more steps
];

// 3. Add state
const [showTour, setShowTour] = useState(false);

// 4. Render component
<ProductTour
  steps={tourSteps}
  isOpen={showTour}
  onClose={() => setShowTour(false)}
  storageKey="my-tour-completed"
/>
```

### Adding Tour Markers to Elements:

Add `data-tour` attributes to elements you want to highlight:

```tsx
<h1 data-tour="page-title">Gradebook Grid</h1>
<select data-tour="subject-selector">...</select>
<button data-tour="help-button">Help</button>
```

## 💡 Best Practices

### ✅ DO:
- Keep steps short and focused (1 concept per step)
- Use friendly, conversational language
- Include emojis for visual appeal
- Test the tour on different screen sizes
- Make the "Skip" option obvious
- Auto-start for first-time users only

### ❌ DON'T:
- Make tours too long (8-12 steps max)
- Use technical jargon
- Force users to complete the tour
- Block important UI elements
- Auto-restart on every page load

## 🎯 Customization Options

### Change Colors:
Edit the classes in `ProductTour.tsx`:
- Border: `border-primary-500` → `border-blue-600`
- Button: `bg-primary-500` → `bg-indigo-600`
- Progress bar: `bg-primary-500` → `bg-green-500`

### Adjust Timing:
```tsx
// Auto-start delay
setTimeout(() => setShowTour(true), 1000); // 1 second

// Spotlight animation duration
className="animate-pulse" // Built-in pulse
```

### Modify Placement:
Change `placement` prop in tour steps:
- `'top'` - Tooltip above element
- `'bottom'` - Tooltip below element
- `'left'` - Tooltip to the left
- `'right'` - Tooltip to the right

## 📱 Mobile Responsiveness

The tour is fully responsive:
- Tooltips use `max-w-[90vw]` for small screens
- Overlay adapts to screen size
- Skip button always accessible
- Touch-friendly button sizes

## 🔐 Privacy & Storage

Tour completion is stored in browser localStorage:
- Key: `gradebook-tour-completed`
- Value: `"true"` when completed
- Persists across sessions
- Can be manually cleared via DevTools

## 🎓 User Education Benefits

1. **Reduces Support Tickets** - Users learn interactively
2. **Faster Onboarding** - No need to read manuals
3. **Better Retention** - Visual learning is more effective
4. **Increased Confidence** - Users feel guided
5. **Self-Service** - Can restart tour anytime

## 🚀 Future Enhancements

Potential improvements:
- [ ] Multi-language support
- [ ] Different tours for different user roles
- [ ] Video tutorials in tour steps
- [ ] Keyboard navigation (arrow keys)
- [ ] Voice-over option
- [ ] Analytics tracking (which steps users skip)

---

**Created:** May 7, 2026  
**Component:** `src/components/ui/ProductTour.tsx`  
**Used In:** Gradebook, and expandable to other pages
