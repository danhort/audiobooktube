import { forwardRef, type LabelHTMLAttributes, type Ref } from "react";
import { twMerge } from "tailwind-merge";

type LabelProps = LabelHTMLAttributes<HTMLLabelElement> & {
  required?: boolean;
};

export const Label = forwardRef((props: LabelProps, ref: Ref<HTMLLabelElement>) => {
  const { required, className, ...rest } = props;

  return (
    <label
      ref={ref}
      className={twMerge(`${required ? "after:content-['_*'] after:text-red-600" : ""}`, className)}
      {...rest}
    />
  );
});
