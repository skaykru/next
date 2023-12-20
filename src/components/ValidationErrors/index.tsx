import { FC } from 'react';

type Props = {
  errorMessages: string[];
  className?: string;
};

const ValidationErrors: FC<Props> = ({ errorMessages, className }) => {
  return (
    <ul className={`pl-6 ${className}`}>
      {errorMessages.map((errorMessage) => (
        <li
          className="flex items-center font-bold text-red-700"
          key={errorMessage}
        >
          <div className="mr-2 h-[5px] w-[5px] rounded-full bg-red-700" />{' '}
          {errorMessage}
        </li>
      ))}
    </ul>
  );
};

export default ValidationErrors;
