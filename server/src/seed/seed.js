import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';
import DonorProfile from '../models/DonorProfile.js';
import RecipientProfile from '../models/RecipientProfile.js';
import Administrator from '../models/Administrator.js';
import BloodRequest from '../models/BloodRequest.js';
import DonationHistory from '../models/DonationHistory.js';
import Blog from '../models/Blog.js';
import BloodCampEvent from '../models/BloodCampEvent.js';
import Leaderboard from '../models/Leaderboard.js';
import LeaderboardEntry from '../models/LeaderboardEntry.js';

dotenv.config();

const DHAKA_COORDS = [90.4125, 23.8103];
const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

/**
 * Generate random coordinates near Dhaka
 */
const getRandomCoordinates = () => {
  const offset = 0.05;
  return [
    DHAKA_COORDS[0] + (Math.random() - 0.5) * offset,
    DHAKA_COORDS[1] + (Math.random() - 0.5) * offset
  ];
};

/**
 * Seed database with sample data
 */
const seedDatabase = async () => {
  try {
    console.log('🌱 Starting database seed...');

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Clear existing data
    await User.deleteMany({});
    await BloodRequest.deleteMany({});
    await DonationHistory.deleteMany({});
    await Blog.deleteMany({});
    await BloodCampEvent.deleteMany({});
    await Leaderboard.deleteMany({});
    await LeaderboardEntry.deleteMany({});
    console.log('🗑️  Cleared existing data');

    // Create Admin
    const admin = await Administrator.create({
      email: 'admin@bloodlink.com',
      password: 'Admin@123',
      role: 'admin',
      name: 'System Administrator',
      phone: '01700000000',
      dateOfBirth: '1985-01-01',
      gender: 'male',
      bloodType: 'O+',
      address: {
        street: '123 Admin Street',
        city: 'Dhaka',
        state: 'Dhaka',
        zipCode: '1000',
        country: 'Bangladesh'
      },
      location: {
        type: 'Point',
        coordinates: DHAKA_COORDS
      },
      department: 'Operations',
      employeeId: 'ADM001',
      permissions: [
        'verify_users',
        'manage_requests',
        'view_analytics',
        'manage_content',
        'manage_events',
        'manage_blogs',
        'handle_reports',
        'system_config',
        'user_management'
      ],
      verificationStatus: 'verified'
    });
    console.log('👨‍💼 Created admin user');

    // Create Donors
    const donors = [];
    const donorNames = [
      'Ahmed Rahman',
      'Sarah Khan',
      'Mohammad Ali',
      'Fatima Hasan',
      'Karim Ahmed',
      'Nadia Islam',
      'Rafiq Uddin',
      'Amina Begum',
      'Hassan Sheikh',
      'Zara Chowdhury',
      'Ibrahim Malik',
      'Ayesha Sultana',
      'Omar Farooq',
      'Sadia Rahman',
      'Tariq Hussain'
    ];

    for (let i = 0; i < donorNames.length; i++) {
      const donor = await DonorProfile.create({
        email: `donor${i + 1}@example.com`,
        password: 'Donor@123',
        role: 'donor',
        name: donorNames[i],
        phone: `0171${String(i + 1).padStart(7, '0')}`,
        dateOfBirth: new Date(1990 + Math.floor(Math.random() * 10), Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1),
        gender: i % 2 === 0 ? 'male' : 'female',
        bloodType: BLOOD_TYPES[i % BLOOD_TYPES.length],
        address: {
          city: 'Dhaka',
          state: 'Dhaka',
          country: 'Bangladesh'
        },
        location: {
          type: 'Point',
          coordinates: getRandomCoordinates()
        },
        verificationStatus: i < 12 ? 'verified' : 'pending',
        isAvailable: i < 13,
        lastDonationDate: i < 5 ? new Date(Date.now() - 180 * 24 * 60 * 60 * 1000) : null,
        totalDonations: Math.floor(Math.random() * 10)
      });
      donors.push(donor);
    }
    console.log(`👥 Created ${donors.length} donors`);

    // Create Recipients
    const recipients = [];
    const recipientNames = ['Kamal Hossain', 'Rina Akter', 'Jamal Ahmed', 'Mina Begum', 'Shafiq Rahman'];

    for (let i = 0; i < recipientNames.length; i++) {
      const recipient = await RecipientProfile.create({
        email: `recipient${i + 1}@example.com`,
        password: 'Recipient@123',
        role: 'recipient',
        name: recipientNames[i],
        phone: `0172${String(i + 1).padStart(7, '0')}`,
        dateOfBirth: new Date(1985 + Math.floor(Math.random() * 15), Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1),
        gender: i % 2 === 0 ? 'male' : 'female',
        bloodType: BLOOD_TYPES[i % BLOOD_TYPES.length],
        address: {
          city: 'Dhaka',
          state: 'Dhaka',
          country: 'Bangladesh'
        },
        location: {
          type: 'Point',
          coordinates: getRandomCoordinates()
        },
        emergencyContact: {
          name: `Emergency Contact ${i + 1}`,
          phone: `0173${String(i + 1).padStart(7, '0')}`,
          relationship: i % 2 === 0 ? 'Spouse' : 'Sibling'
        },
        verificationStatus: 'verified'
      });
      recipients.push(recipient);
    }
    console.log(`👥 Created ${recipients.length} recipients`);

    // Create Blood Requests
    const hospitals = [
      { name: 'Dhaka Medical College Hospital', coords: [90.4125, 23.8103] },
      { name: 'Square Hospital', coords: [90.4065, 23.7515] },
      { name: 'United Hospital', coords: [90.4206, 23.8161] },
      { name: 'Apollo Hospital Dhaka', coords: [90.4158, 23.8133] }
    ];

    const requests = [];
    for (let i = 0; i < 8; i++) {
      const hospital = hospitals[i % hospitals.length];
      const request = await BloodRequest.create({
        recipient: recipients[i % recipients.length]._id,
        patientName: `Patient ${i + 1}`,
        bloodType: BLOOD_TYPES[i % BLOOD_TYPES.length],
        unitsRequired: Math.floor(Math.random() * 3) + 1,
        urgency: i < 2 ? 'critical' : i < 5 ? 'urgent' : 'normal',
        status: i < 3 ? 'fulfilled' : i < 6 ? 'matched' : 'pending',
        hospital: {
          name: hospital.name,
          address: 'Dhaka, Bangladesh',
          contactNumber: `0174${String(i).padStart(7, '0')}`,
          location: {
            type: 'Point',
            coordinates: hospital.coords
          }
        },
        requiredBy: new Date(Date.now() + (i + 1) * 24 * 60 * 60 * 1000),
        medicalReason: i % 2 === 0 ? 'Surgery' : 'Emergency Treatment',
        additionalNotes: 'Urgent need for blood donation'
      });
      requests.push(request);
    }
    console.log(`🩸 Created ${requests.length} blood requests`);

    // Create Donation History
    const donations = [];
    for (let i = 0; i < 10; i++) {
      const donation = await DonationHistory.create({
        donor: donors[i]._id,
        recipient: recipients[i % recipients.length]._id,
        bloodRequest: i < requests.length ? requests[i]._id : null,
        donationDate: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000),
        bloodType: donors[i].bloodType,
        unitsProvided: 1,
        donationCenter: {
          name: hospitals[i % hospitals.length].name,
          address: 'Dhaka, Bangladesh',
          location: {
            type: 'Point',
            coordinates: hospitals[i % hospitals.length].coords
          }
        },
        verificationStatus: i < 8 ? 'verified' : 'pending',
        pointsEarned: 100
      });
      donations.push(donation);
    }
    console.log(`📋 Created ${donations.length} donation records`);

    // Create Blogs
    const blogTopics = [
      {
        title: 'Why Blood Donation Matters',
        category: 'Education',
        excerpt: 'Understanding the critical importance of blood donation in saving lives.'
      },
      {
        title: 'Blood Donation Success Story',
        category: 'Success Stories',
        excerpt: 'How one donation saved three lives in Dhaka Medical College.'
      },
      {
        title: 'Preparing for Your First Blood Donation',
        category: 'Donation Guide',
        excerpt: 'A comprehensive guide for first-time blood donors.'
      }
    ];

    const blogs = [];
    for (let i = 0; i < blogTopics.length; i++) {
      const blog = await Blog.create({
        title: blogTopics[i].title,
        content: `This is a detailed article about ${blogTopics[i].title.toLowerCase()}. Blood donation is one of the most important contributions anyone can make to society. Every donation can save up to three lives...`,
        excerpt: blogTopics[i].excerpt,
        author: admin._id,
        category: blogTopics[i].category,
        tags: ['blood donation', 'healthcare', 'community'],
        status: 'published',
        isPublished: true,
        publishedAt: new Date()
      });
      blogs.push(blog);
    }
    console.log(`📝 Created ${blogs.length} blog posts`);

    // Create Blood Camp Events
    const events = [];
    for (let i = 0; i < 3; i++) {
      const eventDate = new Date(Date.now() + (i + 5) * 24 * 60 * 60 * 1000);
      const event = await BloodCampEvent.create({
        title: `Blood Donation Camp ${i + 1}`,
        description: 'Join us for a community blood donation drive to help save lives.',
        organizer: admin._id,
        eventDate,
        startTime: '09:00',
        endTime: '17:00',
        venue: {
          name: hospitals[i].name,
          address: 'Dhaka, Bangladesh',
          city: 'Dhaka',
          contactNumber: `0175${String(i).padStart(7, '0')}`,
          location: {
            type: 'Point',
            coordinates: hospitals[i].coords
          }
        },
        expectedDonors: 50,
        targetUnits: 50,
        bloodTypes: BLOOD_TYPES,
        status: 'upcoming',
        isPublished: true,
        publishedAt: new Date()
      });
      events.push(event);
    }
    console.log(`📅 Created ${events.length} blood camp events`);

    // Create Leaderboard
    const leaderboard = await Leaderboard.create({
      period: 'all-time',
      isActive: true
    });

    const leaderboardEntries = [];
    for (let i = 0; i < Math.min(10, donors.length); i++) {
      const entry = await LeaderboardEntry.create({
        leaderboard: leaderboard._id,
        donor: donors[i]._id,
        rank: i + 1,
        points: (10 - i) * 100,
        totalDonations: 10 - i,
        pointsBreakdown: {
          donationPoints: (10 - i) * 100,
          bonusPoints: 0,
          milestonePoints: 0,
          reviewPoints: 0
        }
      });
      leaderboardEntries.push(entry);
    }
    console.log(`🏆 Created leaderboard with ${leaderboardEntries.length} entries`);

    console.log('\n✨ Database seeded successfully!');
    console.log('\n📊 Summary:');
    console.log(`   - Admin: 1 user`);
    console.log(`   - Donors: ${donors.length} users`);
    console.log(`   - Recipients: ${recipients.length} users`);
    console.log(`   - Blood Requests: ${requests.length}`);
    console.log(`   - Donations: ${donations.length}`);
    console.log(`   - Blogs: ${blogs.length}`);
    console.log(`   - Events: ${events.length}`);
    console.log(`   - Leaderboard Entries: ${leaderboardEntries.length}`);
    console.log('\n🔑 Login Credentials:');
    console.log('   Admin: admin@bloodlink.com / Admin@123');
    console.log('   Donor: donor1@example.com / Donor@123');
    console.log('   Recipient: recipient1@example.com / Recipient@123');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
};

// Run seed
seedDatabase();
