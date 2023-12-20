import { VariantProps, tv } from 'tailwind-variants';
import { InputHTMLAttributes, forwardRef } from 'react';

const input = tv({
  base: 'rounded w-full border border-gray-300 text-gray-600 placeholder:text-gray-400',
  variants: {
    size: {
      lg: 'h-[51px] px-6 py-3 text-xl',
      sm: 'h-[38px] px-3 py-2',
    },
    disabled: { true: 'cursor-not-allowed bg-gray-150' },
  },
  defaultVariants: { size: 'lg' },
});

type Props = InputHTMLAttributes<HTMLInputElement> & {
  variantProps?: VariantProps<typeof input>;
};

const Input = forwardRef<HTMLInputElement, Props>(function Input(props, ref) {
  const { variantProps, ...rest } = props;

  return (
    <input
      {...rest}
      ref={ref}
      className={input({ ...variantProps, className: props.className })}
    />
  );
});

export default Input;
