import React from "react";
import "./style.css";

interface Props {
  className: any;
  frame: string;
}

export const FrameWrapper = ({
  className,
  frame = "https://c.animaapp.com/S4VxTiAY/img/frame-16715.svg",
}: Props): JSX.Element => {
  return (
    <div className={`frame-wrapper ${className}`}>
      <div className="text-wrapper-3">New project</div>

      <img
        className="polygon-2"
        alt="Polygon"
        src="https://c.animaapp.com/S4VxTiAY/img/polygon-1-3.svg"
      />

      <img
        className="line"
        alt="Line"
        src="https://c.animaapp.com/S4VxTiAY/img/line-21-1.svg"
      />

      <img className="frame-2" alt="Frame" src={frame} />

      <div className="text-wrapper-4">Steps</div>

      <div className="text-wrapper-5">1/7</div>

      <img
        className="list-check"
        alt="List check"
        src="https://c.animaapp.com/S4VxTiAY/img/list-check-1-1.svg"
      />

      <img
        className="line-2"
        alt="Line"
        src="https://c.animaapp.com/S4VxTiAY/img/line-28-1.svg"
      />
    </div>
  );
};
