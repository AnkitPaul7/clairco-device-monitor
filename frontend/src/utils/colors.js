const statusColors = {
  online: {
    color: '#1f7a53',
    background: '#dcf5e7',
    border: '#9fe3bf'
  },
  offline: {
    color: '#b13b5c',
    background: '#fbdfe6',
    border: '#f2aec2'
  },
  pending: {
    color: '#a9711b',
    background: '#faedd3',
    border: '#f0cd8c'
  },
  active: {
    color: '#b13b5c',
    background: '#fbdfe6',
    border: '#f2aec2'
  },
  resolved: {
    color: '#1f7a53',
    background: '#dcf5e7',
    border: '#9fe3bf'
  },
  acknowledged: {
    color: '#2d55a8',
    background: '#dfe8fd',
    border: '#aec4f5'
  }
};

export function getStatusColor(status) {
  return (
    statusColors[status] || {
      color: '#5b6178',
      background: '#eceef5',
      border: '#d6dae8'
    }
  );
}

export default statusColors;
