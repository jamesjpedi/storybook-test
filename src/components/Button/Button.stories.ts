import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';

import { Button } from './Button';

const meta = {
  title: 'Components/Button',
  component: Button,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  args: {
    onClick: fn(),
  },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {
  args: {
    variant: 'primary',
    label: 'Save changes',
  },
};

export const Secondary: Story = {
  args: {
    variant: 'secondary',
    label: 'Cancel',
  },
};

export const Large: Story = {
  args: {
    size: 'large',
    label: 'Continue',
  },
};

export const Small: Story = {
  args: {
    size: 'small',
    label: 'Edit',
  },
};

export const Disabled: Story = {
  args: {
    label: 'Unavailable',
    disabled: true,
  },
};
