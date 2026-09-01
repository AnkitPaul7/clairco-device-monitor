import { useMemo } from 'react';
import { useTheme } from '@mui/material/styles';
import { Card, CardContent, Typography } from '@mui/material';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { bucketAlertsByDay } from '../../utils/helpers';
import './AlertsTrendChart.css';

function AlertsTrendChart({ alerts }) {
  const theme = useTheme();
  const data = useMemo(() => bucketAlertsByDay(alerts, 7), [alerts]);

  return (
    <Card className="alerts-trend-chart">
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Alerts — last 7 days
        </Typography>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="4 4" vertical={false} stroke={theme.palette.divider} />
            <XAxis dataKey="label" tick={{ fontSize: 12 }} stroke={theme.palette.text.secondary} />
            <YAxis
              allowDecimals={false}
              tick={{ fontSize: 12 }}
              stroke={theme.palette.text.secondary}
            />
            <Tooltip
              cursor={{ fill: theme.palette.action.hover }}
              contentStyle={{
                borderRadius: 12,
                border: `1px solid ${theme.palette.divider}`,
                background: theme.palette.background.paper
              }}
            />
            <Bar
              dataKey="count"
              name="Alerts"
              fill={theme.palette.warning.main}
              radius={[8, 8, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

export default AlertsTrendChart;
