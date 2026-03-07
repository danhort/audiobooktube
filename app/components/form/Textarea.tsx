import { forwardRef, type Ref } from "react";

export const Textarea = forwardRef(
  (props: React.TextareaHTMLAttributes<HTMLTextAreaElement>, ref: Ref<HTMLTextAreaElement>) => {
    return (
      <textarea ref={ref} className="bg-white text-gray-950 w-full py-[2px] px-[10px]" {...props} />
    );
  }
);
