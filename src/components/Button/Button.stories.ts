import { fn } from 'storybook/test';

import { Button } from './Button';

import type { Meta, StoryObj } from '@storybook/react-vite';

const meta = {
  title: 'Components/Button',
  component: Button,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  args: {
    onClick: fn(),
    variant: 'contained',
    children: 'Save changes',
  },
} satisfies Meta<typeof Button>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Contained: Story = {};

export const Outlined: Story = {
  args: {
    variant: 'outlined',
    children: 'Cancel',
  },
};

export const Text: Story = {
  args: {
    variant: 'text',
    children: 'Learn more',
  },
};

export const Large: Story = {
  args: {
    size: 'large',
    children: 'Continue',
  },
};

export const Small: Story = {
  args: {
    size: 'small',
    children: 'Edit',
  },
};

export const Disabled: Story = {
  args: {
    children: 'Unavailable',
    disabled: true,
  },
};
