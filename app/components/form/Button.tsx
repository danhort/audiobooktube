import { forwardRef, type ButtonHTMLAttributes, type ReactNode, type Ref } from "react";

type ButtonProps = {
  children: ReactNode | ReactNode[];
} & ButtonHTMLAttributes<HTMLButtonElement>;

export const Button = forwardRef((props: ButtonProps, ref: Ref<HTMLButtonElement>) => {
  const { children, ...rest } = props;

  return (
    <button
      ref={ref}
      className="
          p-[5px_20px] 
          rounded-[20px] border border-white 
          cursor-pointer disabled:cursor-not-allowed 
          disabled:text-gray-500 disabled:border-gray-500 disabled:bg-gray-200
          hover:text-gray-500 hover:border-gray-500 hover:bg-gray-200
        "
      {...rest}
    >
      {children}
    </button>
  );
});
