import { DataGrid } from './DataGrid';

import type { GridColDef } from '@mui/x-data-grid-premium';
import type { Meta, StoryObj } from '@storybook/react-vite';

const columns: GridColDef[] = [
  { field: 'id', headerName: 'ID', width: 80 },
  { field: 'policy', headerName: 'Policy', flex: 1, minWidth: 160 },
  { field: 'status', headerName: 'Status', width: 140 },
  { field: 'premium', headerName: 'Premium', width: 120, type: 'number' },
];

const rows = [
  { id: 1, policy: 'HO-3 10021', status: 'Active', premium: 1240 },
  { id: 2, policy: 'HO-3 10022', status: 'Renewal due', premium: 980 },
  { id: 3, policy: 'DP-1 44810', status: 'Active', premium: 2100 },
];

const meta = {
  title: 'Components/DataGrid',
  component: DataGrid,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof DataGrid>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Basic: Story = {
  args: {
    rows,
    columns,
    disableRowSelectionOnClick: true,
  },
  render: (args) => (
    <div style={{ height: 400, width: '100%' }}>
      <DataGrid {...args} />
    </div>
  ),
};
