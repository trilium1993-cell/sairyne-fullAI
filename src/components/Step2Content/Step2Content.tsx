import React from "react";
import "./Step2Content.css";

interface Step2ContentProps {
  onNextStep?: () => void;
}

export const Step2Content = ({ onNextStep }: Step2ContentProps): JSX.Element => {
  return (
    <div className="step2-content">
      {/* AI Avatar */}
      <div className="bf-d-wrapper">
        <img
          className="bf-d"
          alt="Bf d"
          src="https://c.animaapp.com/S4VxTiAY/img/b56f1665-0403-49d2-b00e-ec2a27378422-1@2x.png"
        />
      </div>

      {/* Step Title */}
      <div className="text-wrapper-12">🟢 Step 2 of 7 — Kick Drum</div>
      
      {/* Step Description */}
      <div className="text-wrapper-13">
        The kick drum is the foundation of any House track - it provides the
        driving force that makes people move on the dancefloor. In House
        music, the kick typically hits on every beat (1-2-3-4), creating
        that signature four-on-the-floor rhythm.
      </div>

      {/* Horizontal Lines */}
      <img
        className="line-4"
        alt="Line"
        src="https://c.animaapp.com/S4VxTiAY/img/line-26.svg"
      />
      <img
        className="line-5"
        alt="Line"
        src="https://c.animaapp.com/S4VxTiAY/img/line-26.svg"
      />
      <img
        className="line-6"
        alt="Line"
        src="https://c.animaapp.com/S4VxTiAY/img/line-26.svg"
      />

      {/* Here's our plan section */}
      <div className="flexcontainer-2">
        <p className="span-wrapper">
          <span className="text-wrapper-14">Here's our plan:</span>
        </p>
        <p className="span-wrapper">
          <span className="text-wrapper-15">
            Add Drum Rack - Set up your drum container
          </span>
        </p>
        <p className="span-wrapper">
          <span className="text-wrapper-15">
            Load kick sample - Find the perfect House kick sound
          </span>
        </p>
        <p className="span-wrapper">
          <span className="text-wrapper-15">
            Create MIDI pattern - Program the classic 4/4 rhythm
          </span>
        </p>
      </div>

      {/* Instructions */}
      <div className="flexcontainer">
        <p className="text">
          <span className="span">
            Each step builds on the previous one, so we'll take it nice
            and slow. I'll show you exactly where to click and what to
            drag.
          </span>
        </p>
        <p className="text">
          <span className="span">
            Let's start by adding the Drum Rack instrument! Check out
            the visual guide on the right to see exactly how to do it. →
          </span>
        </p>
        <p className="text">
          <span className="span">
            Once you've added the Drum Rack, let me know and we'll
            move on to finding the perfect kick sample!
          </span>
        </p>
      </div>
    </div>
  );
};