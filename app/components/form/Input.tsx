import { forwardRef, type Ref } from "react";

export const Input = forwardRef(
  (props: React.InputHTMLAttributes<HTMLInputElement>, ref: Ref<HTMLInputElement>) => {
    return (
      <input ref={ref} className="bg-white text-gray-950 w-full py-[2px] px-[10px]" {...props} />
    );
  }
);
