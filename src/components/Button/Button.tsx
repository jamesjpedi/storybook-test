import { Button as MuiButton, type ButtonProps as MuiButtonProps } from '@mui/material';
import { forwardRef } from 'react';

export type ButtonProps = MuiButtonProps;

/** BHHC Button — MUI Button with design-system defaults from `theme`. */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(props, ref) {
    return <MuiButton ref={ref} {...props} />;
  },
);
