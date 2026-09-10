import React, { forwardRef } from 'react';
import MuiButton from '@mui/material/Button';

import type { ButtonProps as MuiButtonProps } from '@mui/material/Button';

export type ButtonProps = MuiButtonProps;

/** BHHC Button — MUI Button with design-system defaults from `theme`. */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(props, ref) {
  return <MuiButton ref={ref} {...props} />;
});
