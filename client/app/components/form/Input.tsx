import { forwardRef, type InputHTMLAttributes, type ReactNode, type Ref } from "react";
import { twMerge } from "tailwind-merge";

export const Input = forwardRef(
  (
    props: InputHTMLAttributes<HTMLInputElement> & { children?: ReactNode },
    ref: Ref<HTMLInputElement>
  ) => {
    const { className, children, ...rest } = props;

    return (
      <div
        className={twMerge(
          `w-full relative rounded-md overflow-hidden flex justify-between`,
          className
        )}
      >
        <input ref={ref} className="bg-white text-gray-950 py-2 px-3 w-full rounded-md" {...rest} />
        {children}
      </div>
    );
  }
);
