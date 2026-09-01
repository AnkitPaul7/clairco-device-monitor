import { Card, CardContent, Stack, Typography } from '@mui/material';
import './StatsCard.css';

function StatsCard({ title, value, icon, tone = 'neutral' }) {
  return (
    <Card className={`stats-card stats-card-${tone}`}>
      <CardContent>
        <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2}>
          <div>
            <Typography variant="body2" color="text.secondary">
              {title}
            </Typography>
            <Typography variant="h4">{value}</Typography>
          </div>
          <div className="stats-card-icon">{icon}</div>
        </Stack>
      </CardContent>
    </Card>
  );
}

export default StatsCard;
