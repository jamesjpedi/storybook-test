import { forwardRef } from 'react';
import { Card as MuiCard } from '@mui/material';

import type { CardProps as MuiCardProps } from '@mui/material';

export type CardProps = MuiCardProps;

/** BHHC Card — MUI Card with design-system defaults from `theme`. */
export const Card = forwardRef<HTMLDivElement, CardProps>(function Card(props, ref) {
  return <MuiCard ref={ref} {...props} />;
});
