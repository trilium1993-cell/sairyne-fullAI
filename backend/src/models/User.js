import mongoose from 'mongoose';
import bcryptjs from 'bcryptjs';

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email']
  },
  password: {
    type: String,
    required: true,
    minlength: 8,
    select: false // Don't return password by default
  },
  nick: {
    type: String,
    required: false,
    unique: true,
    sparse: true, // Allow null for incomplete registrations
    minlength: 3,
    maxlength: 20,
    match: [/^[a-zA-Z0-9_-]+$/, 'Nick can only contain letters, numbers, underscores, and hyphens']
  },
  firstName: {
    type: String,
    required: false
  },
  lastName: {
    type: String,
    required: false
  },
  country: {
    type: String,
    required: false
  },
  operatingSystem: {
    type: String,
    enum: ['Windows', 'MacOS', null],
    required: false
  },
  daw: {
    type: String,
    required: false // DAW used during initial signup
  },
  emailVerified: {
    type: Boolean,
    default: false
  },
  emailVerificationToken: {
    type: String,
    select: false
  },
  emailVerificationExpiry: {
    type: Date,
    select: false
  },
  registrationStatus: {
    type: String,
    enum: ['pending', 'email-verified', 'completed'],
    default: 'pending'
  },
  apiKey: {
    type: String,
    unique: true,
    sparse: true,
    select: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcryptjs.genSalt(10);
    this.password = await bcryptjs.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare passwords
userSchema.methods.comparePassword = async function(enteredPassword) {
  return await bcryptjs.compare(enteredPassword, this.password);
};

// Method to get public user data
userSchema.methods.toJSON = function() {
  const user = this.toObject();
  delete user.password;
  delete user.emailVerificationToken;
  delete user.emailVerificationExpiry;
  return user;
};

const User = mongoose.model('User', userSchema);

export default User;

