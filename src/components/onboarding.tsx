"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Sparkles, Calendar, TrendingUp, ThumbsUp, ChevronRight } from "lucide-react";

interface OnboardingProps {
  open: boolean;
  onComplete: () => void;
}

const steps = [
  {
    icon: Sparkles,
    title: "Welcome to Success Tracker",
    description: "Track your daily wins and build momentum towards your goals. Let's get you started!",
  },
  {
    icon: ThumbsUp,
    title: "Log Your Days",
    description: "Each day, reflect on whether it was a success. Tap the thumbs up for a win, thumbs down for a loss.",
  },
  {
    icon: Calendar,
    title: "Track Your Progress",
    description: "View your history on the calendar. Green days are wins, red days are losses. Tap any past day to log it.",
  },
  {
    icon: TrendingUp,
    title: "Build Your Streak",
    description: "Consecutive successful days build your streak. Stay consistent and watch your streak grow!",
  },
];

export function Onboarding({ open, onComplete }: OnboardingProps) {
  const [step, setStep] = useState(0);
  const isLastStep = step === steps.length - 1;
  const currentStep = steps[step];
  const Icon = currentStep.icon;

  const handleNext = () => {
    if (isLastStep) {
      localStorage.setItem("onboarding-complete", "true");
      onComplete();
    } else {
      setStep(step + 1);
    }
  };

  const handleSkip = () => {
    localStorage.setItem("onboarding-complete", "true");
    onComplete();
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md" showCloseButton={false}>
        <div className="flex flex-col items-center text-center py-4">
          {/* Icon */}
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white mb-6">
            <Icon className="h-8 w-8" />
          </div>

          {/* Content */}
          <DialogHeader className="text-center">
            <DialogTitle className="text-xl font-semibold text-slate-900 dark:text-white">
              {currentStep.title}
            </DialogTitle>
            <DialogDescription className="text-slate-500 dark:text-slate-400 mt-2">
              {currentStep.description}
            </DialogDescription>
          </DialogHeader>

          {/* Progress Dots */}
          <div className="flex gap-2 my-6">
            {steps.map((_, i) => (
              <div
                key={i}
                className={`h-2 w-2 rounded-full transition-colors ${
                  i === step
                    ? "bg-emerald-500"
                    : i < step
                    ? "bg-emerald-300"
                    : "bg-slate-200 dark:bg-slate-700"
                }`}
              />
            ))}
          </div>

          {/* Actions */}
          <div className="flex gap-3 w-full">
            {!isLastStep && (
              <Button variant="ghost" onClick={handleSkip} className="flex-1">
                Skip
              </Button>
            )}
            <Button onClick={handleNext} className="flex-1 bg-emerald-600 hover:bg-emerald-700">
              {isLastStep ? "Get Started" : "Next"}
              {!isLastStep && <ChevronRight className="ml-1 h-4 w-4" />}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function useOnboarding() {
  const [showOnboarding, setShowOnboarding] = useState(() => {
    if (typeof window === "undefined") return false;
    return !localStorage.getItem("onboarding-complete");
  });

  return {
    showOnboarding,
    completeOnboarding: () => setShowOnboarding(false),
  };
}
