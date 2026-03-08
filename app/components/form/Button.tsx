import { forwardRef, type ButtonHTMLAttributes, type ReactNode, type Ref } from "react";
import { twMerge } from "tailwind-merge";

export const Button = forwardRef(
  (props: ButtonHTMLAttributes<HTMLButtonElement>, ref: Ref<HTMLButtonElement>) => {
    const { className, ...rest } = props;

    return (
      <button
        ref={ref}
        className={twMerge(
          `
            p-[5px_20px] 
            rounded-[20px] border border-white
            cursor-pointer disabled:cursor-not-allowed
            disabled:text-gray-500 disabled:border-gray-500 disabled:bg-gray-200
            hover:text-gray-500 hover:border-gray-500 hover:bg-gray-200
          `,
          className
        )}
        {...rest}
      />
    );
  }
);
