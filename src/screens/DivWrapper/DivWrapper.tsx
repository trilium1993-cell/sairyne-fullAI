import React, { useState } from "react";

interface DivWrapperProps {
  onNext: () => void;
  onBack?: () => void;
}

export const DivWrapper = ({ onNext, onBack }: DivWrapperProps): JSX.Element => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation logic
    if (!email || !email.includes('@')) {
      return;
    }
    
    if (password !== "123456789") {
      return;
    }
    
    // Both valid, proceed to next screen
    onNext();
  };

  const handleForgotPassword = () => {
    window.open("https://sairyne.com", "_blank");
  };

  const handleSignUp = () => {
    window.open("https://sairyne.com", "_blank");
  };

  return (
    <div
      className="relative w-[383px] h-[847px] bg-[#413f42] rounded-[10px] overflow-hidden"
      data-model-id="226:7971"
    >
      <button
        className="absolute top-[calc(50.00%_-_416px)] right-[7px] w-5 h-5 cursor-pointer"
        aria-label="Close"
        type="button"
      >
        <img
          className="w-4 h-4"
          alt="Close"
          src="https://c.animaapp.com/acwfItLU/img/close-1.svg"
        />
      </button>

      <button
        className="absolute top-[calc(50.00%_-_416px)] right-[35px] w-5 h-5 cursor-pointer"
        aria-label="Expand"
        type="button"
      >
        <img
          className="w-4 h-4"
          alt="Arrows in simple"
          src="https://c.animaapp.com/acwfItLU/img/arrows-in-simple-light-1.svg"
        />
      </button>

      <h1 className="absolute top-[calc(50.00%_-_416px)] left-[11px] [font-family:'Inter',Helvetica] font-medium text-white text-[13px] text-center tracking-[0] leading-[normal]">
        Sairyne
      </h1>

      <main className="absolute top-[34px] left-[3px] w-[377px] h-[810px] bg-[#141414] rounded-[7px] overflow-hidden">
        <div className="absolute top-[calc(50.00%_-_429px)] left-[calc(50.00%_-_140px)] w-[278px] h-[278px] bg-[#6e24ab5e] rounded-[139px] blur-[122px]" />

        <div className="absolute top-[95px] left-[calc(50.00%_-_56px)] w-[110px] h-[110px] flex bg-[#141414] rounded-[59.6px] overflow-hidden border-[1.34px] border-solid border-[#9956c580]">
          <img
            className="w-[110px] h-[110px] aspect-[1]"
            alt="Profile photo"
            src="https://c.animaapp.com/acwfItLU/img/photo-2025-10-18-23-33-13-1@2x.png"
          />
        </div>

        <div className="absolute top-[244px] left-[calc(50.00%_-_154px)] w-[313px] h-[311px] flex flex-col items-center">
          <h2 className="h-9 w-full font-h1 font-[number:var(--h1-font-weight)] text-[#f7efff] text-[length:var(--h1-font-size)] text-center tracking-[var(--h1-letter-spacing)] leading-[var(--h1-line-height)] [font-style:var(--h1-font-style)]">
            Sign in
          </h2>

          <form
            onSubmit={handleSubmit}
            className="w-full flex flex-col items-center"
          >
            <div className="-ml-1.5 h-10 w-[307px] mt-[30px] flex bg-[#ffffff0d] rounded-[36px] border border-solid border-[#ffffff1c]">
              <label htmlFor="email" className="sr-only">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                className="w-full h-full px-3.5 py-2.5 bg-transparent font-body font-[number:var(--body-font-weight)] text-white text-[length:var(--body-font-size)] tracking-[var(--body-letter-spacing)] leading-[var(--body-line-height)] [font-style:var(--body-font-style)] placeholder:text-[#ffffff80]"
                required
                autoComplete="email"
              />
            </div>

            <div className="-ml-1.5 h-10 w-[307px] mt-5 flex bg-[#ffffff0d] rounded-[36px] border border-solid border-[#ffffff1c]">
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className="w-full h-full px-3.5 py-2.5 bg-transparent font-body font-[number:var(--body-font-weight)] text-white text-[length:var(--body-font-size)] tracking-[var(--body-letter-spacing)] leading-[var(--body-line-height)] [font-style:var(--body-font-style)] placeholder:text-[#ffffff80]"
                required
                autoComplete="current-password"
              />
            </div>

            <button
              type="button"
              onClick={handleForgotPassword}
              className="-ml-1.5 h-5 w-[107px] mt-[19px] font-body font-[number:var(--body-font-weight)] text-[#c387f4] text-[length:var(--body-font-size)] tracking-[var(--body-letter-spacing)] leading-[var(--body-line-height)] whitespace-nowrap [font-style:var(--body-font-style)] cursor-pointer hover:underline"
            >
              Forgot password?
            </button>

            <button
              type="submit"
              className="flex -ml-1.5 h-10 w-[307px] relative mt-[23px] items-center justify-center gap-2.5 px-2.5 py-[7px] rounded-[36px] border-[none] bg-[linear-gradient(134deg,rgba(115,34,182,1)_0%,rgba(83,12,141,1)_100%)] before:content-[''] before:absolute before:inset-0 before:p-px before:rounded-[36px] before:[background:linear-gradient(180deg,rgba(255,255,255,0.11)_0%,rgba(255,255,255,0.01)_100%)] before:[-webkit-mask:linear-gradient(#fff_0_0)_content-box,linear-gradient(#fff_0_0)] before:[-webkit-mask-composite:xor] before:[mask-composite:exclude] before:z-[1] before:pointer-events-none cursor-pointer hover:opacity-90 transition-opacity"
            >
              <span className="relative w-fit font-body font-[number:var(--body-font-weight)] text-white text-[length:var(--body-font-size)] text-center tracking-[var(--body-letter-spacing)] leading-[var(--body-line-height)] whitespace-nowrap [font-style:var(--body-font-style)]">
                Login
              </span>
            </button>
          </form>

          <div className="flex items-center gap-2.5 mt-[23px] font-body font-[number:var(--body-font-weight)] text-[length:var(--body-font-size)] tracking-[var(--body-letter-spacing)] leading-[var(--body-line-height)] [font-style:var(--body-font-style)]">
            <span className="text-[#ffffff80] whitespace-nowrap">
              Don&apos;t have an account?
            </span>

            <button
              type="button"
              onClick={handleSignUp}
              className="text-white whitespace-nowrap cursor-pointer hover:underline"
            >
              Sign up
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};
