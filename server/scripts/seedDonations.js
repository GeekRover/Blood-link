import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../.env') });

// Import models
import DonationHistory from '../src/models/DonationHistory.js';
import User from '../src/models/User.js';

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB Connected');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

const seedDonations = async () => {
  try {
    await connectDB();

    // Find all verified donors
    const donors = await User.find({
      role: 'donor',
      isVerified: true
    }).limit(5);

    if (donors.length === 0) {
      console.log('❌ No verified donors found. Please create and verify some donors first.');
      process.exit(1);
    }

    console.log(`📊 Found ${donors.length} verified donors`);

    // Create sample donations
    const donations = [
      {
        donor: donors[0]._id,
        bloodType: donors[0].bloodType,
        donationDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
        unitsProvided: 1,
        verificationStatus: 'pending',
        donationProof: {
          documentType: 'donation_certificate',
          documentUrl: '/uploads/documents/sample-donation-cert-1.jpg',
          uploadedAt: new Date()
        },
        donationCenter: {
          name: 'City Blood Center',
          location: {
            type: 'Point',
            coordinates: [90.4125, 23.8103]
          },
          address: '123 Main St, Dhaka'
        }
      },
      {
        donor: donors[1]._id,
        bloodType: donors[1].bloodType,
        donationDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
        unitsProvided: 1,
        verificationStatus: 'pending',
        donationProof: {
          documentType: 'donation_certificate',
          documentUrl: '/uploads/documents/sample-donation-cert-2.jpg',
          uploadedAt: new Date()
        },
        donationCenter: {
          name: 'National Blood Bank',
          location: {
            type: 'Point',
            coordinates: [90.4152, 23.7805]
          },
          address: '456 Central Rd, Dhaka'
        }
      },
      {
        donor: donors[2]._id,
        bloodType: donors[2].bloodType,
        donationDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
        unitsProvided: 2,
        verificationStatus: 'pending',
        donationProof: {
          documentType: 'donation_certificate',
          documentUrl: '/uploads/documents/sample-donation-cert-3.jpg',
          uploadedAt: new Date()
        },
        donationCenter: {
          name: 'Red Crescent Blood Center',
          location: {
            type: 'Point',
            coordinates: [90.3938, 23.7465]
          },
          address: '789 South Ave, Dhaka'
        }
      }
    ];

    // Add more donations if we have more donors
    if (donors.length > 3) {
      donations.push({
        donor: donors[3]._id,
        bloodType: donors[3].bloodType,
        donationDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
        unitsProvided: 1,
        verificationStatus: 'pending',
        donationCenter: {
          name: 'Community Health Center',
          location: {
            type: 'Point',
            coordinates: [90.4074, 23.7644]
          },
          address: '321 North Lane, Dhaka'
        }
      });
    }

    if (donors.length > 4) {
      donations.push({
        donor: donors[4]._id,
        bloodType: donors[4].bloodType,
        donationDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
        unitsProvided: 1,
        verificationStatus: 'pending',
        donationProof: {
          documentType: 'donation_certificate',
          documentUrl: '/uploads/documents/sample-donation-cert-4.jpg',
          uploadedAt: new Date()
        },
        donationCenter: {
          name: 'Hospital Blood Bank',
          location: {
            type: 'Point',
            coordinates: [90.3947, 23.7272]
          },
          address: '555 Hospital Rd, Dhaka'
        }
      });
    }

    // Insert donations
    const createdDonations = await DonationHistory.insertMany(donations);

    console.log(`\n✅ Successfully created ${createdDonations.length} pending donations!\n`);

    console.log('📋 Donation Summary:');
    createdDonations.forEach((donation, index) => {
      const donor = donors.find(d => d._id.toString() === donation.donor.toString());
      console.log(`${index + 1}. ${donor.name} - ${donation.bloodType} - ${donation.unitsProvided} unit(s) - ${donation.donationCenter.name}`);
    });

    console.log('\n💡 You can now test donation verification from the admin dashboard!');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding donations:', error);
    process.exit(1);
  }
};

seedDonations();
