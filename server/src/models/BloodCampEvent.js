import mongoose from 'mongoose';

const bloodCampEventSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Event title is required'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Event description is required']
  },
  organizer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  eventDate: {
    type: Date,
    required: [true, 'Event date is required']
  },
  startTime: {
    type: String,
    required: true
  },
  endTime: {
    type: String,
    required: true
  },
  venue: {
    name: { type: String, required: true },
    address: { type: String, required: true },
    city: { type: String, required: true },
    contactNumber: String,
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point'
      },
      coordinates: {
        type: [Number],
        required: true
      }
    }
  },
  expectedDonors: {
    type: Number,
    default: 0
  },
  registeredDonors: [{
    donor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    registeredAt: { type: Date, default: Date.now },
    attended: { type: Boolean, default: false },
    donated: { type: Boolean, default: false }
  }],
  bloodTypes: [{
    type: String,
    enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']
  }],
  targetUnits: {
    type: Number,
    default: 0
  },
  collectedUnits: {
    type: Number,
    default: 0
  },
  bannerImage: String,
  status: {
    type: String,
    enum: ['upcoming', 'ongoing', 'completed', 'cancelled'],
    default: 'upcoming'
  },
  isPublished: {
    type: Boolean,
    default: false
  },
  publishedAt: Date,
  cancelReason: String,
  organizers: [{
    name: String,
    contact: String,
    role: String
  }],
  sponsors: [{
    name: String,
    logo: String,
    website: String
  }]
}, {
  timestamps: true
});

// Indexes
bloodCampEventSchema.index({ eventDate: 1 });
bloodCampEventSchema.index({ status: 1 });
bloodCampEventSchema.index({ 'venue.location': '2dsphere' });
bloodCampEventSchema.index({ organizer: 1 });

// Virtual for registration count
bloodCampEventSchema.virtual('registrationCount').get(function() {
  return this.registeredDonors.length;
});

// Virtual for attendance count
bloodCampEventSchema.virtual('attendanceCount').get(function() {
  return this.registeredDonors.filter(r => r.attended).length;
});

// Method to register donor
bloodCampEventSchema.methods.registerDonor = function(donorId) {
  const alreadyRegistered = this.registeredDonors.some(
    r => r.donor.toString() === donorId.toString()
  );

  if (alreadyRegistered) {
    throw new Error('Donor already registered');
  }

  this.registeredDonors.push({ donor: donorId });
  return this.save();
};

// Pre-save middleware to update status
bloodCampEventSchema.pre('save', function(next) {
  const now = new Date();
  const eventDate = new Date(this.eventDate);

  if (this.status !== 'cancelled') {
    if (eventDate < now && this.status === 'upcoming') {
      this.status = 'ongoing';
    }
  }

  next();
});

const BloodCampEvent = mongoose.model('BloodCampEvent', bloodCampEventSchema);

export default BloodCampEvent;
