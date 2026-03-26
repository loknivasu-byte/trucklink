require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Load = require('../models/Load');
const Payment = require('../models/Payment');
const Rating = require('../models/Rating');
const connectDB = require('../config/db');

const seed = async () => {
  await connectDB();

  // Clear existing data
  await User.deleteMany({});
  await Load.deleteMany({});
  await Payment.deleteMany({});
  await Rating.deleteMany({});

  console.log('Cleared existing data...');

  // Hash password once at runtime using hashSync.
  // We insert directly via the native collection driver (insertOne) to bypass
  // Mongoose's pre-save hook — if we used User.create() the hook would hash
  // the already-hashed password a second time, breaking login.
  const hashedPassword = bcrypt.hashSync('password123', 10);

  const { insertedId: driver1Id } = await User.collection.insertOne({
    name: 'Marcus Johnson',
    email: 'marcus@driver.com',
    password: hashedPassword,
    role: 'driver',
    cdlNumber: 'CDL-TX-448821',
    truckType: 'Dry Van',
    currentLocation: 'Dallas, TX',
    trustScore: 4.8,
    totalDeliveries: 142,
    totalEarnings: 87450,
    isAvailable: true,
    createdAt: new Date(),
  });

  const { insertedId: driver2Id } = await User.collection.insertOne({
    name: 'Sarah Mitchell',
    email: 'sarah@driver.com',
    password: hashedPassword,
    role: 'driver',
    cdlNumber: 'CDL-IL-229934',
    truckType: 'Refrigerated',
    currentLocation: 'Chicago, IL',
    trustScore: 4.6,
    totalDeliveries: 98,
    totalEarnings: 64200,
    isAvailable: true,
    createdAt: new Date(),
  });

  const { insertedId: shipper1Id } = await User.collection.insertOne({
    name: 'Robert Chen',
    email: 'robert@shipper.com',
    password: hashedPassword,
    role: 'shipper',
    companyName: 'Chen Industrial Supply',
    rating: 4.7,
    createdAt: new Date(),
  });

  const { insertedId: shipper2Id } = await User.collection.insertOne({
    name: 'Amanda Torres',
    email: 'amanda@shipper.com',
    password: hashedPassword,
    role: 'shipper',
    companyName: 'Torres Fresh Produce',
    rating: 4.9,
    createdAt: new Date(),
  });

  await User.collection.insertOne({
    name: 'Big Dave Trucking',
    email: 'dave@owner.com',
    password: hashedPassword,
    role: 'owner',
    companyName: 'Big Dave Logistics LLC',
    fleetSize: 12,
    createdAt: new Date(),
  });

  console.log('Created users...');

  // Create loads
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);

  const load1 = await Load.create({
    shipper: shipper1Id,
    pickupCity: 'Chicago',
    deliveryCity: 'Dallas',
    pickupAddress: '1200 W Fulton Market, Chicago, IL 60607',
    deliveryAddress: '4500 Maple Ave, Dallas, TX 75219',
    pickupDate: tomorrow,
    miles: 921,
    ratePerMile: 3.20,
    totalPay: 2947.20,
    weight: 38000,
    truckType: 'Dry Van',
    commodity: 'Industrial Equipment',
    status: 'available',
  });

  const load2 = await Load.create({
    shipper: shipper2Id,
    pickupCity: 'Los Angeles',
    deliveryCity: 'Phoenix',
    pickupAddress: '2800 S Main St, Los Angeles, CA 90007',
    deliveryAddress: '1100 N Central Ave, Phoenix, AZ 85004',
    pickupDate: tomorrow,
    miles: 372,
    ratePerMile: 4.10,
    totalPay: 1525.20,
    weight: 22000,
    truckType: 'Refrigerated',
    commodity: 'Fresh Produce',
    status: 'available',
  });

  const load3 = await Load.create({
    shipper: shipper1Id,
    pickupCity: 'Atlanta',
    deliveryCity: 'New York',
    pickupAddress: '750 Peachtree St NE, Atlanta, GA 30308',
    deliveryAddress: '890 Atlantic Ave, Brooklyn, NY 11238',
    pickupDate: tomorrow,
    miles: 876,
    ratePerMile: 3.75,
    totalPay: 3285.00,
    weight: 42000,
    truckType: 'Dry Van',
    commodity: 'Consumer Electronics',
    status: 'available',
  });

  const load4 = await Load.create({
    shipper: shipper2Id,
    pickupCity: 'Houston',
    deliveryCity: 'Chicago',
    pickupAddress: '5000 Navigation Blvd, Houston, TX 77011',
    deliveryAddress: '2200 S Halsted St, Chicago, IL 60608',
    pickupDate: tomorrow,
    miles: 1092,
    ratePerMile: 2.90,
    totalPay: 3166.80,
    weight: 35000,
    truckType: 'Flatbed',
    commodity: 'Steel Coils',
    status: 'available',
  });

  const load5 = await Load.create({
    shipper: shipper1Id,
    pickupCity: 'Seattle',
    deliveryCity: 'Los Angeles',
    pickupAddress: '1420 5th Ave, Seattle, WA 98101',
    deliveryAddress: '350 S Figueroa St, Los Angeles, CA 90071',
    pickupDate: tomorrow,
    miles: 1135,
    ratePerMile: 3.50,
    totalPay: 3972.50,
    weight: 40000,
    truckType: 'Dry Van',
    commodity: 'Auto Parts',
    status: 'available',
  });

  // One accepted load (Marcus has it)
  const load6 = await Load.create({
    shipper: shipper2Id,
    driver: driver1Id,
    pickupCity: 'Dallas',
    deliveryCity: 'Atlanta',
    pickupAddress: '3000 Commerce St, Dallas, TX 75226',
    deliveryAddress: '275 Baker St NW, Atlanta, GA 30313',
    pickupDate: new Date(Date.now() - 86400000), // yesterday
    miles: 780,
    ratePerMile: 3.40,
    totalPay: 2652.00,
    weight: 36000,
    truckType: 'Dry Van',
    commodity: 'Packaged Goods',
    status: 'in_transit',
  });

  console.log('Created loads...');

  // Create payment records
  await Payment.create({ load: load1._id, shipper: shipper1Id, amount: load1.totalPay, status: 'in_escrow', escrowDepositedAt: new Date() });
  await Payment.create({ load: load2._id, shipper: shipper2Id, amount: load2.totalPay, status: 'in_escrow', escrowDepositedAt: new Date() });
  await Payment.create({ load: load3._id, shipper: shipper1Id, amount: load3.totalPay, status: 'in_escrow', escrowDepositedAt: new Date() });
  await Payment.create({ load: load4._id, shipper: shipper2Id, amount: load4.totalPay, status: 'in_escrow', escrowDepositedAt: new Date() });
  await Payment.create({ load: load5._id, shipper: shipper1Id, amount: load5.totalPay, status: 'in_escrow', escrowDepositedAt: new Date() });
  await Payment.create({ load: load6._id, shipper: shipper2Id, driver: driver1Id, amount: load6.totalPay, status: 'in_escrow', escrowDepositedAt: new Date() });

  console.log('Created payment records...');
  console.log('\n--- SEED COMPLETE ---');
  console.log('Test accounts (password: password123):');
  console.log('  Driver:  marcus@driver.com  (Marcus Johnson, 142 deliveries)');
  console.log('  Driver:  sarah@driver.com   (Sarah Mitchell, 98 deliveries)');
  console.log('  Shipper: robert@shipper.com (Chen Industrial Supply)');
  console.log('  Shipper: amanda@shipper.com (Torres Fresh Produce)');
  console.log('  Owner:   dave@owner.com     (Big Dave Logistics LLC)');
  console.log('Loads created: 5 available, 1 in_transit');

  process.exit(0);
};

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
