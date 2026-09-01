require('dotenv').config();

const connectDB = require('../src/config/database');
const { Device, Alert, mongoose } = require('../src/models');

const demoDevices = [
  { deviceId: 'SENSOR-001', name: 'Conference Room Sensor', expectedInterval: 60 },
  { deviceId: 'SENSOR-002', name: 'Lobby Sensor', expectedInterval: 120 },
  { deviceId: 'SENSOR-003', name: 'Server Room Sensor', expectedInterval: 30 }
];

async function seed() {
  await connectDB();
  await Alert.deleteMany({});
  await Device.deleteMany({});
  await Device.insertMany(demoDevices);
  console.log('Demo devices seeded');
  await mongoose.disconnect();
}

seed().catch(async (error) => {
  console.error('Seed failed:', error);
  await mongoose.disconnect();
  process.exit(1);
});
