import { forwardRef, type Ref, type TextareaHTMLAttributes } from "react";
import { twMerge } from "tailwind-merge";

export const Textarea = forwardRef(
  (props: TextareaHTMLAttributes<HTMLTextAreaElement>, ref: Ref<HTMLTextAreaElement>) => {
    const { className, ...rest } = props;

    return (
      <textarea
        ref={ref}
        className={twMerge(`bg-white text-gray-950 w-full py-[2px] px-[10px]`, className)}
        {...rest}
      />
    );
  }
);
