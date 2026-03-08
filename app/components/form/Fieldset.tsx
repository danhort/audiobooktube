import { forwardRef, type FieldsetHTMLAttributes, type Ref } from "react";
import { twMerge } from "tailwind-merge";

export const Fieldset = forwardRef(
  (props: FieldsetHTMLAttributes<HTMLFieldSetElement>, ref: Ref<HTMLFieldSetElement>) => {
    const { className, ...rest } = props;

    return (
      <fieldset
        ref={ref}
        className={twMerge(`grid grid-cols-[auto_1fr] gap-[30px]`, className)}
        {...rest}
      />
    );
  }
);
