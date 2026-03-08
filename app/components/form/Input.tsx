import { forwardRef, type InputHTMLAttributes, type Ref } from "react";
import { twMerge } from "tailwind-merge";

export const Input = forwardRef(
  (props: InputHTMLAttributes<HTMLInputElement>, ref: Ref<HTMLInputElement>) => {
    const { className, ...rest } = props;

    return (
      <input
        ref={ref}
        className={twMerge(`bg-white text-gray-950 w-full py-[2px] px-[10px]`, className)}
        {...rest}
      />
    );
  }
);
