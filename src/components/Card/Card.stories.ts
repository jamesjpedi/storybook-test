import type { Meta, StoryObj } from '@storybook/react-vite';

import { Card } from './Card';

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
    title: 'Policy summary',
    description: 'Review coverage details, deductibles, and next renewal date in one place.',
  },
};

export const WithEyebrow: Story = {
  args: {
    eyebrow: 'New',
    title: 'Claims status',
    description: 'Track open claims and see the latest activity without leaving this page.',
  },
};
