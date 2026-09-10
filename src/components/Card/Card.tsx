import React, { forwardRef } from 'react';
import MuiCard from '@mui/material/Card';

import type { CardProps as MuiCardProps } from '@mui/material/Card';

export type CardProps = MuiCardProps;

/** BHHC Card — MUI Card with design-system defaults from `theme`. */
export const Card = forwardRef<HTMLDivElement, CardProps>(function Card(props, ref) {
  return <MuiCard ref={ref} {...props} />;
});
