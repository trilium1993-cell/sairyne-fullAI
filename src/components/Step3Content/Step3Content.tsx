
interface Step3ContentProps {
  onNextStep?: () => void;
}

export const Step3Content = ({ onNextStep }: Step3ContentProps): JSX.Element => {
  return (
    <div className="w-full bg-[#ffffff08] rounded-[10px] border border-solid border-[#ffffff0a] p-6 mb-4 shadow-lg">
      <header className="mb-4">
        <h1 className="[font-family:'DM_Sans-Bold',Helvetica] font-bold text-white text-[13px] tracking-[0] leading-[19px]">
          🟢 Step 3 of 7 — Project Analysis
        </h1>
      </header>

      <section className="mb-6">
        <p className="[font-family:'DM_Sans-Light',Helvetica] font-light text-white text-xs tracking-[0] leading-[19px] mb-4">
          Let Sairyne analyze your track with advanced AI features to help you create the perfect House music foundation.
        </p>
        
        <div className="bg-[#ffffff05] rounded-[8px] border border-solid border-[#ffffff0a] p-4 mb-4">
          <h3 className="[font-family:'DM_Sans-Bold',Helvetica] font-bold text-white text-xs tracking-[0] leading-[19px] mb-2">
            AI Analysis Features:
          </h3>
          <ul className="[font-family:'DM_Sans-Light',Helvetica] font-light text-white/80 text-xs space-y-1">
            <li>• Track tempo and key detection</li>
            <li>• Harmonic analysis and chord progression</li>
            <li>• Rhythm pattern recognition</li>
            <li>• Frequency spectrum analysis</li>
            <li>• Mix balance recommendations</li>
          </ul>
        </div>

        <p className="[font-family:'DM_Sans-Light',Helvetica] font-light text-white text-xs tracking-[0] leading-[19px]">
          This analysis will help us understand your track's current state and provide personalized recommendations for the next steps in your House music creation process.
        </p>
      </section>

      <div className="flex justify-end">
        <button
          className="px-6 py-3 bg-[#7e3cff] hover:bg-[#6b2cd9] text-white text-xs font-medium rounded-md transition-all duration-300 ease-out shadow-lg hover:shadow-xl transform hover:scale-105"
          type="button"
          onClick={onNextStep}
          aria-label="Start project analysis"
        >
          Start project analysis
        </button>
      </div>
    </div>
  );
};
