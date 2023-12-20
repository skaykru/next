import { VariantProps, tv } from 'tailwind-variants';
import Link, { LinkProps as NextLinkProps } from 'next/link';
import { AnchorHTMLAttributes, ButtonHTMLAttributes, FC } from 'react';

const button = tv({
  base: 'flex items-center justify-center rounded',
  variants: {
    variant: {
      primary: 'bg-green-550 text-white',
      'primary-outline':
        'border border-green-550 text-green-550 hover:bg-green-550 hover:text-white active:text-white active:bg-green-600 active:border-green-600',
      'secondary-outline':
        'border border-gray-400 text-gray-400 hover:bg-gray-400 hover:text-white active:text-white active:bg-gray-500 active:border-gray-500',
      'tertiary-outline':
        'border border-gray-400 text-black bg-gray-100 hover:bg-white active:bg-gray-300',
      'danger-outline-1':
        'border border-red-700 text-red-700 hover:bg-red-700 hover:text-white active:border-red-900 active:bg-red-900 active:text-white',
      'danger-outline-2':
        'border border-[#B85C5C] text-[#B85C5C] hover:bg-[#B85C5C] hover:text-white active:text-gray-300 active:bg-[#6a3535] active:border-[#6a3535]',
    },
    size: { lg: 'px-6 py-3 text-xl', md: 'px-4 py-2', sm: 'py-1 px-2 text-sm' },
    disabled: {
      true: 'cursor-not-allowed opacity-60',
    },
  },
  compoundVariants: [
    {
      variant: 'primary',
      disabled: false,
      className: 'hover:bg-green-600 active:bg-green-700',
    },
  ],
  defaultVariants: {
    variant: 'primary',
    size: 'lg',
    disabled: false,
  },
});

type LinkProps = Omit<
  AnchorHTMLAttributes<HTMLAnchorElement>,
  keyof NextLinkProps
> &
  NextLinkProps;

type Props = {
  variantProps?: VariantProps<typeof button>;
} & (
  | ({
      asLink?: false;
    } & ButtonHTMLAttributes<HTMLButtonElement>)
  | ({
      asLink: true;
    } & LinkProps)
);

const Button: FC<Props> = (props) => {
  const { variantProps, asLink, ...rest } = props;

  return asLink ? (
    <Link
      {...(rest as LinkProps)}
      className={button({ ...variantProps, className: props.className })}
    >
      {props.children}
    </Link>
  ) : (
    <button
      {...(rest as ButtonHTMLAttributes<HTMLButtonElement>)}
      className={button({ ...variantProps, className: props.className })}
    >
      {props.children}
    </button>
  );
};

export default Button;
