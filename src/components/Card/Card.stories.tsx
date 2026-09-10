import React from 'react';
import { CardContent, Typography } from '@mui/material';

import { Card } from './Card';

import type { Meta, StoryObj } from '@storybook/react-vite';

const meta = {
  title: 'Components/Card',
  component: Card,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Card>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    sx: { maxWidth: 320 },
    children: (
      <CardContent>
        <Typography gutterBottom variant="h6" component="h3">
          Policy summary
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Review coverage details, deductibles, and next renewal date in one place.
        </Typography>
      </CardContent>
    ),
  },
};

export const WithEyebrow: Story = {
  args: {
    sx: { maxWidth: 320 },
    children: (
      <CardContent>
        <Typography variant="overline" color="primary">
          New
        </Typography>
        <Typography gutterBottom variant="h6" component="h3">
          Claims status
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Track open claims and see the latest activity without leaving this page.
        </Typography>
      </CardContent>
    ),
  },
};
