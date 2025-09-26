"use client";

import { motion } from "framer-motion";
import { Check, Package, Layers, Settings } from "lucide-react";

interface StepProgressProps {
  currentStep: number;
  isMobile: boolean;
}

const steps = [
  { id: 1, name: "Project", icon: Package, description: "Choose or create a project" },
  { id: 2, name: "Collection", icon: Layers, description: "Define collection details" },
  { id: 3, name: "Configuration", icon: Settings, description: "Set up contract settings" },
  { id: 4, name: "Review", icon: Check, description: "Review and deploy" }
];

export function StepProgress({ currentStep, isMobile }: StepProgressProps) {
  if (isMobile) {
    return (
      <div className="px-4 pb-3">
        <div className="flex items-center justify-between mb-2">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div className={`
                w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold
                ${currentStep >= step.id
                  ? 'bg-[rgb(163,255,18)] text-black'
                  : 'bg-white/10 text-white/60'}
              `}>
                {currentStep > step.id ? <Check className="w-4 h-4" /> : step.id}
              </div>
              {index < steps.length - 1 && (
                <div className={`w-full h-0.5 mx-1 ${
                  currentStep > step.id ? 'bg-[rgb(163,255,18)]' : 'bg-white/10'
                }`} />
              )}
            </div>
          ))}
        </div>
        <p className="text-xs text-white/60 text-center">{steps[currentStep - 1].description}</p>
      </div>
    );
  }

  return (
    <div className="px-8 py-4 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => (
          <div key={step.id} className="flex items-center flex-1">
            <div className="flex items-center">
              <motion.div
                className={`
                  w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all
                  ${currentStep >= step.id
                    ? 'bg-[rgb(163,255,18)] text-black'
                    : 'bg-white/10 text-white/60'}
                `}
                animate={{
                  scale: currentStep === step.id ? 1.1 : 1,
                  backgroundColor: currentStep >= step.id ? 'rgb(163,255,18)' : 'rgba(255,255,255,0.1)'
                }}
                transition={{ duration: 0.3 }}
              >
                {currentStep > step.id ? <Check className="w-5 h-5" /> : step.id}
              </motion.div>
              <div className="ml-3">
                <p className={`font-semibold ${currentStep >= step.id ? 'text-white' : 'text-white/60'}`}>
                  {step.name}
                </p>
                <p className="text-xs text-white/40">{step.description}</p>
              </div>
            </div>
            {index < steps.length - 1 && (
              <div className="flex-1 mx-4">
                <motion.div
                  className={`h-0.5 transition-all ${
                    currentStep > step.id ? 'bg-[rgb(163,255,18)]' : 'bg-white/10'
                  }`}
                  animate={{
                    backgroundColor: currentStep > step.id ? 'rgb(163,255,18)' : 'rgba(255,255,255,0.1)'
                  }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}