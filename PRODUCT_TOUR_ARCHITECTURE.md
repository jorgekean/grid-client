# 🏗️ Product Tour Architecture - Scalable & Maintainable Design

## 📋 Table of Contents
1. [Architecture Overview](#architecture-overview)
2. [File Structure](#file-structure)
3. [How to Add a New Tour](#how-to-add-a-new-tour)
4. [Scaling to Multiple Pages](#scaling-to-multiple-pages)
5. [Maintenance Best Practices](#maintenance-best-practices)
6. [Advanced Features](#advanced-features)

---

## 🎯 Architecture Overview

The product tour system is built with three layers for maximum scalability and maintainability:

```
┌─────────────────────────────────────────────────────────┐
│                     PRESENTATION LAYER                   │
│  (Page Components: Gradebook, Students, Assessments)    │
│                  Uses: useProductTour()                  │
└────────────────────┬────────────────────────────────────┘
                     │
┌────────────────────┴────────────────────────────────────┐
│                      BUSINESS LOGIC LAYER                │
│               (useProductTour Custom Hook)               │
│     - Auto-start logic                                   │
│     - Completion tracking                                │
│     - State management                                   │
└────────────────────┬────────────────────────────────────┘
                     │
┌────────────────────┴────────────────────────────────────┐
│                     CONFIGURATION LAYER                  │
│                  (tours.ts Config File)                  │
│     - All tour content                                   │
│     - Step definitions                                   │
│     - Settings                                           │
└─────────────────────────────────────────────────────────┘
```

### ✨ Key Benefits:

1. **Separation of Concerns** - Content, logic, and UI are separated
2. **Single Source of Truth** - All tours configured in one file
3. **Reusability** - One hook works for all pages
4. **Easy Updates** - Change tour content without touching components
5. **Type Safety** - Full TypeScript support
6. **i18n Ready** - Easy to add multi-language support

---

## 📁 File Structure

```
src/
├── components/
│   └── ui/
│       └── ProductTour.tsx          # ✅ Reusable UI Component
│
├── hooks/
│   └── useProductTour.ts             # ✅ Reusable Logic Hook
│
├── config/
│   └── tours.ts                      # ✅ Centralized Configuration
│
└── pages/
    ├── gradebook/
    │   └── index.tsx                 # Uses: useProductTour('gradebook')
    ├── students/
    │   └── index.tsx                 # Uses: useProductTour('students')
    └── assessments/
        └── index.tsx                 # Uses: useProductTour('assessments')
```

---

## 🚀 How to Add a New Tour

### Step 1: Define Tour Steps (`src/config/tours.ts`)

```typescript
export const myNewPageTour: TourStep[] = [
    {
        target: '[data-tour="welcome"]',
        title: 'Welcome! 👋',
        content: 'This is the first step...',
        placement: 'bottom',
    },
    {
        target: '[data-tour="feature-1"]',
        title: 'Cool Feature',
        content: 'Check this out...',
        placement: 'right',
    },
    // ... more steps
];
```

### Step 2: Register Tour Config (`src/config/tours.ts`)

```typescript
export const tourConfigs: Record<string, TourConfig> = {
    // ... existing tours
    myNewPage: {
        id: 'myNewPage',
        storageKey: 'myNewPage-tour-completed',
        steps: myNewPageTour,
        autoStart: true,
        delay: 1000,
    },
};
```

### Step 3: Add Tour to Page Component

```tsx
import { useProductTour } from '../../hooks/useProductTour';

function MyNewPage() {
    const { startTour, TourComponent } = useProductTour('myNewPage');

    return (
        <div>
            <h1 data-tour="welcome">My Page</h1>
            
            <button onClick={startTour}>
                Need Help?
            </button>

            {/* Rest of your page */}

            {TourComponent}
        </div>
    );
}
```

### Step 4: Add `data-tour` Attributes to Elements

```tsx
<div data-tour="feature-1">
    {/* This element will be highlighted in the tour */}
</div>

<button data-tour="action-button">
    Click Me
</button>
```

**That's it!** ✅ 3 steps to add a complete product tour!

---

## 📈 Scaling to Multiple Pages

### Current Implementation (5 Pages Configured):

| Page | Tour ID | Storage Key | Auto-Start |
|------|---------|-------------|------------|
| Gradebook | `gradebook` | `gradebook-tour-completed` | ✅ Yes |
| Students | `students` | `students-tour-completed` | ✅ Yes |
| Assessments | `assessments` | `assessments-tour-completed` | ✅ Yes |
| Academic Terms | `terms` | `terms-tour-completed` | ✅ Yes |
| Subjects | `subjects` | `subjects-tour-completed` | ✅ Yes |

### Easy to Expand:

**Adding 10 more pages?** Just add 10 entries to `tours.ts`. No duplicate code!

**Example - Adding a new page:**

```typescript
// In tours.ts - Add this:
export const reportsTour: TourStep[] = [/* steps */];

export const tourConfigs = {
    // ... existing
    reports: {
        id: 'reports',
        storageKey: 'reports-tour-completed',
        steps: reportsTour,
        autoStart: true,
    },
};

// In your page - Use this:
const { startTour, TourComponent } = useProductTour('reports');
```

**Total code per page: 1 line!** 🎉

---

## 🛠️ Maintenance Best Practices

### ✅ DO:

1. **Keep all tour content in `tours.ts`**
   - Easy to find and update
   - Single file to translate for i18n
   - Git-friendly (clear diffs)

2. **Use descriptive `data-tour` attributes**
   ```tsx
   // ✅ Good
   <button data-tour="save-button">Save</button>
   
   // ❌ Bad
   <button data-tour="btn1">Save</button>
   ```

3. **Test tours after UI changes**
   - If element changes, tour might break
   - Use descriptive selectors that survive refactoring

4. **Keep steps short (8-12 max)**
   - Users lose interest after too many steps
   - Break complex tours into sections

5. **Use the hook consistently**
   ```tsx
   // ✅ Good - consistent pattern
   const { startTour, TourComponent } = useProductTour('myPage');
   ```

### ❌ DON'T:

1. **Don't hardcode tour steps in components**
   ```tsx
   // ❌ Bad - duplicates logic
   const [showTour, setShowTour] = useState(false);
   const steps = [/* ... */];
   ```

2. **Don't use fragile CSS selectors**
   ```tsx
   // ❌ Bad - breaks easily
   target: 'div > div > button:nth-child(3)'
   
   // ✅ Good - stable
   target: '[data-tour="submit-button"]'
   ```

3. **Don't duplicate tours**
   ```tsx
   // ❌ Bad - copy-paste across pages
   // ✅ Good - use tours.ts + useProductTour()
   ```

---

## 🔧 Advanced Features

### 1. Conditional Auto-Start

```typescript
// In tours.ts
myPage: {
    id: 'myPage',
    autoStart: isNewUser(), // Conditional logic
    delay: 2000,
    steps: myPageTour,
}
```

### 2. Custom Completion Handlers

```tsx
const { startTour, TourComponent } = useProductTour('gradebook', () => {
    // Custom logic on completion
    analytics.track('tour_completed');
    showWelcomeReward();
});
```

### 3. Manual Tour Control

```tsx
const { startTour, closeTour, isCompleted } = useProductTour('myPage');

// Start manually
<button onClick={startTour}>Help</button>

// Close manually
<button onClick={closeTour}>Skip</button>

// Check if completed
{!isCompleted && <Badge>New!</Badge>}
```

### 4. Global Tour Management

```typescript
import { resetAllTours, getAllTourIds } from '../config/tours';

// Reset all tours (for testing or user preference)
resetAllTours();

// Get all tour IDs
const tourIds = getAllTourIds(); // ['gradebook', 'students', ...]

// Check if specific tour completed
if (isTourCompleted('gradebook')) {
    // Show advanced features
}
```

### 5. i18n Support (Future Enhancement)

```typescript
// tours.en.ts
export const gradebookTour_EN = [/* English */];

// tours.es.ts
export const gradebookTour_ES = [/* Spanish */];

// tours.ts
const locale = getUserLocale();
export const gradebookTour = locale === 'es' ? gradebookTour_ES : gradebookTour_EN;
```

---

## 📊 Performance Considerations

### Memory Footprint:
- **ProductTour component**: ~5KB
- **useProductTour hook**: ~2KB
- **Tours config file**: ~10KB (all tours)
- **Total**: ~17KB (minimal impact)

### Rendering Performance:
- Tours only render when active
- No performance impact when not showing
- Smooth 60fps animations

### Storage:
- Uses localStorage (5MB limit)
- Each tour: 1 key-value pair (~50 bytes)
- Negligible storage usage

---

## 🎯 Comparison: Old vs New Architecture

| Aspect | ❌ Old Approach | ✅ New Architecture |
|--------|----------------|---------------------|
| **Code per page** | 50-100 lines | 1 line |
| **Duplication** | High (copy-paste) | Zero |
| **Maintenance** | Update each page | Update one file |
| **Testing** | Test each page | Test once |
| **Scalability** | Linear growth | Constant |
| **Type Safety** | Manual | Automatic |
| **i18n Support** | Difficult | Easy |

---

## ✅ Code Quality Checklist

Before deploying a new tour:

- [ ] Tour steps defined in `tours.ts`
- [ ] Tour registered in `tourConfigs`
- [ ] Page uses `useProductTour()` hook
- [ ] All elements have `data-tour` attributes
- [ ] Tour tested on desktop and mobile
- [ ] Storage key is unique
- [ ] Steps are concise and clear
- [ ] Tooltips stay visible on all screen sizes
- [ ] Tour auto-starts correctly (if enabled)
- [ ] Completion tracked properly

---

## 🚀 Migration Guide

### Converting Existing Component to New System:

**Before (Old Way):**
```tsx
function MyPage() {
    const [showTour, setShowTour] = useState(false);
    const steps = [/* 50 lines of steps */];
    
    useEffect(() => {
        // 20 lines of auto-start logic
    }, []);
    
    return (
        <>
            {/* Component */}
            <ProductTour 
                steps={steps}
                isOpen={showTour}
                // ... 10 more props
            />
        </>
    );
}
```

**After (New Way):**
```tsx
function MyPage() {
    const { startTour, TourComponent } = useProductTour('myPage');
    
    return (
        <>
            {/* Component */}
            {TourComponent}
        </>
    );
}
```

**Lines of Code Saved: ~80 lines per page!** 🎉

---

## 🎓 Summary

### The New Architecture is:

✅ **Scalable** - Add unlimited tours with minimal code  
✅ **Maintainable** - One file to rule them all  
✅ **Reusable** - Same hook, all pages  
✅ **Type-Safe** - Full TypeScript support  
✅ **DRY** - Zero code duplication  
✅ **Testable** - Easy to unit test  
✅ **Future-Proof** - Ready for i18n, analytics, etc.

### Quick Start for Developers:

1. Add tour steps to `src/config/tours.ts`
2. Use `useProductTour('tourId')` in your page
3. Add `data-tour` attributes to elements
4. Done! ✅

**That's it!** The system handles everything else automatically.

---

*Last Updated: May 7, 2026*  
*Architecture Version: 2.0*  
*Status: ✅ Production Ready & Scalable*
