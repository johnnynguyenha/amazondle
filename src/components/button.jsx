import * as React from "react";

export function Button({ className = "", children, ...props }) {
  return (
    <button
      className={`bg-black text-white rounded-xl px-4 py-2 font-semibold hover:opacity-80 transition ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
