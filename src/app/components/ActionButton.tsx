"use client";

import { useState } from "react";

type ActionButtonProps = {
  children: React.ReactNode;
  message: string;
  className?: string;
};

export default function ActionButton({
  children,
  message,
  className = "",
}: ActionButtonProps) {
  const [showMessage, setShowMessage] = useState(false);

  function handleClick() {
    setShowMessage(true);

    setTimeout(() => {
      setShowMessage(false);
    }, 3000);
  }

  return (
    <>
      <button onClick={handleClick} className={className}>
        {children}
      </button>

      {showMessage && (
        <div className="fixed bottom-6 right-6 z-50 rounded-xl bg-[#00b86b] px-5 py-3 font-semibold text-white shadow-lg">
          ✓ {message}
        </div>
      )}
    </>
  );
}