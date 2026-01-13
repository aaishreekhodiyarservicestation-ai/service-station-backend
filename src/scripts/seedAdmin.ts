import mongoose from 'mongoose';
import { env } from '../config/env';
import User from '../models/User';
import Station from '../models/Station';

const seedAdmin = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Check if admin already exists
    const existingAdmin = await User.findOne({ username: 'admin' });
    if (existingAdmin) {
      console.log('Admin user already exists!');
      console.log('Username: admin');
      await mongoose.connection.close();
      return;
    }

    // Create default station if it doesn't exist
    let station = await Station.findOne({ name: 'Main Station' });
    if (!station) {
      station = await Station.create({
        name: 'Main Station',
        address: '123 Main Street',
        contactNumber: '1234567890',
        email: 'station@example.com',
        isActive: true,
      });
      console.log('Created default station:', station.name);
    }

    // Create admin user
    const admin = await User.create({
      username: 'admin',
      email: 'admin@example.com',
      password: 'Admin@123',
      fullName: 'System Administrator',
      role: 'admin',
      stationId: station._id,
      isActive: true,
    });

    console.log('\n✅ Admin user created successfully!');
    console.log('================================');
    console.log('Username: admin');
    console.log('Password: Admin@123');
    console.log('================================');
    console.log('\nPlease change the password after first login!\n');

    await mongoose.connection.close();
    process.exit(0);
  } catch (error: any) {
    console.error('Error seeding admin:', error.message);
    await mongoose.connection.close();
    process.exit(1);
  }
};

seedAdmin();
