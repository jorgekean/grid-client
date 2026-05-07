// ============================================================================
// 🎯 USE PRODUCT TOUR HOOK
// ============================================================================
// 
// A reusable React hook for managing product tours across the application.
// 
// 📚 USAGE EXAMPLE:
// 
// ```tsx
// import { useProductTour } from '../../hooks/useProductTour';
// 
// function MyPage() {
//     const { 
//         showTour, 
//         startTour, 
//         TourComponent 
//     } = useProductTour('gradebook');
// 
//     return (
//         <div>
//             <button onClick={startTour}>Need Help?</button>
//             {TourComponent}
//         </div>
//     );
// }
// ```
// 
// ✨ FEATURES:
// - Auto-start for first-time users
// - Completion tracking
// - Easy integration
// - TypeScript support
// ============================================================================

import { useState, useEffect, createElement } from 'react';
import { ProductTour } from '../components/ui/ProductTour';
import { getTourConfig } from '../config/tours';
import { toast } from 'sonner';

interface UseProductTourReturn {
    showTour: boolean;
    startTour: () => void;
    closeTour: () => void;
    isCompleted: boolean;
    TourComponent: React.ReactElement | null;
}

/**
 * Hook for managing product tours
 * 
 * @param tourId - The ID of the tour (from tours.ts config)
 * @param onComplete - Optional callback when tour is completed
 * @returns Tour state and control functions
 */
export function useProductTour(
    tourId: string,
    onComplete?: () => void
): UseProductTourReturn {
    const [showTour, setShowTour] = useState(false);
    const [isCompleted, setIsCompleted] = useState(false);

    const config = getTourConfig(tourId);

    // Check completion status and auto-start
    useEffect(() => {
        if (!config) return;

        const completed = localStorage.getItem(config.storageKey) === 'true';
        setIsCompleted(completed);

        // Auto-start if not completed and autoStart is enabled
        if (!completed && config.autoStart) {
            const timer = setTimeout(() => {
                setShowTour(true);
            }, config.delay || 1000);

            return () => clearTimeout(timer);
        }
    }, [config]);

    const startTour = () => {
        setShowTour(true);
    };

    const closeTour = () => {
        setShowTour(false);
    };

    const handleComplete = () => {
        setIsCompleted(true);
        if (onComplete) {
            onComplete();
        } else {
            toast.success('🎉 Tour completed! You\'re all set!');
        }
    };

    // Create the tour component
    const TourComponent = config && showTour ? createElement(ProductTour, {
        steps: config.steps,
        isOpen: showTour,
        onClose: closeTour,
        onComplete: handleComplete,
        storageKey: config.storageKey,
    }) : null;

    return {
        showTour,
        startTour,
        closeTour,
        isCompleted,
        TourComponent,
    };
}
