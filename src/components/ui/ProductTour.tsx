import React, { useState, useEffect } from 'react';
import { X, ChevronRight, ChevronLeft, Check } from 'lucide-react';

export interface TourStep {
    target: string;          // CSS selector for the element to highlight
    title: string;           // Step title
    content: string;         // Step description
    placement?: 'top' | 'bottom' | 'left' | 'right';  // Where to show the tooltip
    spotlightPadding?: number;  // Padding around the highlighted element
}

interface ProductTourProps {
    steps: TourStep[];
    isOpen: boolean;
    onClose: () => void;
    onComplete?: () => void;
    storageKey?: string;     // LocalStorage key to remember if tour was completed
}

export function ProductTour({
    steps,
    isOpen,
    onClose,
    onComplete,
    storageKey = 'product-tour-completed'
}: ProductTourProps) {
    const [currentStep, setCurrentStep] = useState(0);
    const [targetRect, setTargetRect] = useState<DOMRect | null>(null);

    // Reset to step 1 when tour opens
    useEffect(() => {
        if (isOpen) {
            setCurrentStep(0);
        }
    }, [isOpen]);

    useEffect(() => {
        if (!isOpen) return;

        const updatePosition = () => {
            const step = steps[currentStep];
            if (!step) return;

            const element = document.querySelector(step.target);
            if (element) {
                const rect = element.getBoundingClientRect();
                setTargetRect(rect);

                // Scroll element into view smoothly
                element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        };

        updatePosition();
        window.addEventListener('resize', updatePosition);
        window.addEventListener('scroll', updatePosition, true);

        return () => {
            window.removeEventListener('resize', updatePosition);
            window.removeEventListener('scroll', updatePosition, true);
        };
    }, [currentStep, isOpen, steps]);

    const handleNext = () => {
        if (currentStep < steps.length - 1) {
            setCurrentStep(currentStep + 1);
        } else {
            handleComplete();
        }
    };

    const handlePrev = () => {
        if (currentStep > 0) {
            setCurrentStep(currentStep - 1);
        }
    };

    const handleComplete = () => {
        if (storageKey) {
            localStorage.setItem(storageKey, 'true');
        }
        if (onComplete) {
            onComplete();
        }
        onClose();
    };

    const handleSkip = () => {
        if (storageKey) {
            localStorage.setItem(storageKey, 'true');
        }
        onClose();
    };

    if (!isOpen || !targetRect) return null;

    const step = steps[currentStep];
    const padding = step.spotlightPadding || 8;

    // Calculate tooltip position with screen boundary detection
    const getTooltipStyle = () => {
        const placement = step.placement || 'bottom';
        const offset = 20;
        const tooltipWidth = 380; // Match the tooltip width
        const tooltipHeight = 400; // Approximate tooltip height
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        const margin = 16; // Margin from screen edge

        let left = 0;
        let top = 0;
        let transform = '';

        switch (placement) {
            case 'top':
                left = targetRect.left + targetRect.width / 2;
                top = targetRect.top - offset;
                transform = 'translate(-50%, -100%)';

                // Check if tooltip goes off top
                if (top - tooltipHeight < margin) {
                    // Switch to bottom
                    top = targetRect.bottom + offset;
                    transform = 'translate(-50%, 0)';
                }
                break;

            case 'bottom':
                left = targetRect.left + targetRect.width / 2;
                top = targetRect.bottom + offset;
                transform = 'translate(-50%, 0)';

                // Check if tooltip goes off bottom
                if (top + tooltipHeight > viewportHeight - margin) {
                    // Switch to top
                    top = targetRect.top - offset;
                    transform = 'translate(-50%, -100%)';
                }
                break;

            case 'left':
                left = targetRect.left - offset;
                top = targetRect.top + targetRect.height / 2;
                transform = 'translate(-100%, -50%)';

                // Check if tooltip goes off left
                if (left - tooltipWidth < margin) {
                    // Switch to right
                    left = targetRect.right + offset;
                    transform = 'translate(0, -50%)';
                }
                break;

            case 'right':
                left = targetRect.right + offset;
                top = targetRect.top + targetRect.height / 2;
                transform = 'translate(0, -50%)';

                // Check if tooltip goes off right
                if (left + tooltipWidth > viewportWidth - margin) {
                    // Switch to left
                    left = targetRect.left - offset;
                    transform = 'translate(-100%, -50%)';
                }
                break;

            default:
                left = targetRect.left + targetRect.width / 2;
                top = targetRect.bottom + offset;
                transform = 'translate(-50%, 0)';
        }

        // Final boundary checks to keep tooltip on screen
        // Horizontal boundaries
        if (transform.includes('-50%')) {
            // Centered horizontally
            const halfWidth = tooltipWidth / 2;
            if (left - halfWidth < margin) {
                left = halfWidth + margin;
            } else if (left + halfWidth > viewportWidth - margin) {
                left = viewportWidth - halfWidth - margin;
            }
        } else if (transform.includes('-100%')) {
            // Positioned to the left
            if (left - tooltipWidth < margin) {
                left = tooltipWidth + margin;
            }
        } else if (!transform.includes('translate-x')) {
            // Positioned to the right
            if (left + tooltipWidth > viewportWidth - margin) {
                left = viewportWidth - tooltipWidth - margin;
            }
        }

        // Vertical boundaries
        if (transform.includes('translate(-50%, -50%)')) {
            // Centered vertically
            const halfHeight = tooltipHeight / 2;
            if (top - halfHeight < margin) {
                top = halfHeight + margin;
            } else if (top + halfHeight > viewportHeight - margin) {
                top = viewportHeight - halfHeight - margin;
            }
        } else if (transform.includes('-100%)')) {
            // Positioned above
            if (top - tooltipHeight < margin) {
                top = tooltipHeight + margin;
            }
        } else {
            // Positioned below
            if (top + tooltipHeight > viewportHeight - margin) {
                top = viewportHeight - tooltipHeight - margin;
            }
        }

        return { left, top, transform };
    };

    return (
        <div className="fixed inset-0 z-[9999]">
            {/* Overlay with spotlight cutout effect */}
            <div
                className="absolute inset-0 pointer-events-none"
                style={{
                    background: `
                        linear-gradient(to right, 
                            rgba(0, 0, 0, 0.7) 0%, 
                            transparent ${targetRect.left - padding}px, 
                            transparent ${targetRect.right + padding}px, 
                            rgba(0, 0, 0, 0.7) 100%
                        ),
                        linear-gradient(to bottom, 
                            rgba(0, 0, 0, 0.7) 0%, 
                            transparent ${targetRect.top - padding}px, 
                            transparent ${targetRect.bottom + padding}px, 
                            rgba(0, 0, 0, 0.7) 100%
                        )
                    `,
                }}
            />

            {/* Spotlight border animation */}
            <div
                className="absolute border-4 border-primary-500 rounded-xl animate-pulse pointer-events-none"
                style={{
                    left: targetRect.left - padding,
                    top: targetRect.top - padding,
                    width: targetRect.width + padding * 2,
                    height: targetRect.height + padding * 2,
                    boxShadow: '0 0 0 4px rgba(59, 130, 246, 0.3), 0 0 30px rgba(59, 130, 246, 0.5)',
                }}
            />

            {/* Tooltip Card */}
            <div
                className="absolute w-[380px] max-w-[90vw] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border-2 border-primary-500 dark:border-primary-400 animate-in fade-in zoom-in duration-300"
                style={getTooltipStyle()}
            >
                {/* Progress bar */}
                <div className="h-1 bg-slate-200 dark:bg-slate-700 rounded-t-2xl overflow-hidden">
                    <div
                        className="h-full bg-primary-500 transition-all duration-300"
                        style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
                    />
                </div>

                <div className="p-6">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-primary-500 text-white flex items-center justify-center text-sm font-bold">
                                {currentStep + 1}
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                                    {step.title}
                                </h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                    Step {currentStep + 1} of {steps.length}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={handleSkip}
                            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                            title="Skip tour"
                        >
                            <X className="w-5 h-5 text-slate-400" />
                        </button>
                    </div>

                    {/* Content */}
                    <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-6">
                        {step.content}
                    </p>

                    {/* Navigation */}
                    <div className="flex items-center justify-between gap-3">
                        <button
                            onClick={handlePrev}
                            disabled={currentStep === 0}
                            className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
                        >
                            <ChevronLeft className="w-4 h-4" />
                            Back
                        </button>

                        {/* Step indicators */}
                        <div className="flex gap-1.5">
                            {steps.map((_, index) => (
                                <button
                                    key={index}
                                    onClick={() => setCurrentStep(index)}
                                    className={`w-2 h-2 rounded-full transition-all ${index === currentStep
                                            ? 'bg-primary-500 w-6'
                                            : index < currentStep
                                                ? 'bg-primary-300'
                                                : 'bg-slate-300 dark:bg-slate-700'
                                        }`}
                                    title={`Go to step ${index + 1}`}
                                />
                            ))}
                        </div>

                        {currentStep < steps.length - 1 ? (
                            <button
                                onClick={handleNext}
                                className="px-4 py-2 text-sm font-bold text-white bg-primary-500 hover:bg-primary-600 rounded-xl transition-all flex items-center gap-2 shadow-lg shadow-primary-500/30"
                            >
                                Next
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        ) : (
                            <button
                                onClick={handleComplete}
                                className="px-4 py-2 text-sm font-bold text-white bg-green-500 hover:bg-green-600 rounded-xl transition-all flex items-center gap-2 shadow-lg shadow-green-500/30"
                            >
                                <Check className="w-4 h-4" />
                                Got it!
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Skip tour button at bottom */}
            <button
                onClick={handleSkip}
                className="absolute bottom-8 left-1/2 -translate-x-1/2 px-6 py-3 text-sm font-medium text-white bg-slate-800/80 hover:bg-slate-800 backdrop-blur-sm rounded-full transition-all shadow-xl"
            >
                Skip Tour
            </button>
        </div>
    );
}
