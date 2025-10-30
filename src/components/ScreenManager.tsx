import { useState } from "react";
import { Step, NEXT } from "../flow/steps";
import { getScreenComponent } from "../flow/registry";

export default function ScreenManager() {
  const [currentStep, setCurrentStep] = useState<Step>("SignIn");
  const [history, setHistory] = useState<Step[]>([]);

  const onNext = () => {
    const nextStep = NEXT[currentStep];
    if (nextStep) {
      setHistory(prev => [...prev, currentStep]);
      setCurrentStep(nextStep);
    }
  };

  const onBack = () => {
    if (history.length > 0) {
      const previousStep = history[history.length - 1];
      setHistory(prev => prev.slice(0, -1));
      setCurrentStep(previousStep);
    }
  };


  // Get the component for current step
  const ScreenComponent = getScreenComponent(currentStep);

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#0b0a0f',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <ScreenComponent onNext={onNext} onBack={onBack} />
    </div>
  );
}
