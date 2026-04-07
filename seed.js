/**
 * Seed script — populates the database with sample data for development and demo.
 * 
 * Run: node seed.js
 * 
 * Creates:
 *   - 3 users (admin, engineer, viewer)
 *   - 10 sample tools
 *   - 8 sample faults
 *   - 3 sample tool checks
 */

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Fault = require('./models/Fault');
const { Tool, ToolCheck } = require('./models/Tool');
const AuditLog = require('./models/AuditLog');

const seedDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear existing data
    await Promise.all([
      User.deleteMany({}),
      Fault.deleteMany({}),
      Tool.deleteMany({}),
      ToolCheck.deleteMany({}),
      AuditLog.deleteMany({})
    ]);
    console.log('Cleared existing data');

    // --- USERS ---
    const users = await User.create([
      {
        email: 'admin@busdepot.com',
        password: 'Admin123!',
        name: 'Sarah Mitchell',
        role: 'admin',
        depot: 'Bournemouth Main Depot'
      },
      {
        email: 'engineer@busdepot.com',
        password: 'Engineer123!',
        name: 'James Roberts',
        role: 'engineer',
        depot: 'Bournemouth Main Depot'
      },
      {
        email: 'viewer@busdepot.com',
        password: 'Viewer123!',
        name: 'Emily Chen',
        role: 'viewer',
        depot: 'Bournemouth Main Depot'
      }
    ]);
    console.log(`Created ${users.length} users`);

    const admin = users[0];
    const engineer = users[1];

    // --- TOOLS ---
    const tools = await Tool.create([
      { name: 'Socket Wrench Set', category: 'hand_tool', serialNumber: 'HT-001', status: 'available', depot: 'Bournemouth Main Depot' },
      { name: 'Torque Wrench', category: 'hand_tool', serialNumber: 'HT-002', status: 'available', depot: 'Bournemouth Main Depot' },
      { name: 'Multimeter', category: 'diagnostic', serialNumber: 'DG-001', status: 'available', depot: 'Bournemouth Main Depot' },
      { name: 'OBD-II Scanner', category: 'diagnostic', serialNumber: 'DG-002', status: 'checked_out', depot: 'Bournemouth Main Depot' },
      { name: 'Impact Driver', category: 'power_tool', serialNumber: 'PT-001', status: 'available', depot: 'Bournemouth Main Depot' },
      { name: 'Angle Grinder', category: 'power_tool', serialNumber: 'PT-002', status: 'maintenance', depot: 'Bournemouth Main Depot' },
      { name: 'Safety Goggles', category: 'safety_equipment', serialNumber: 'SE-001', status: 'available', depot: 'Bournemouth Main Depot' },
      { name: 'High-Vis Vest', category: 'safety_equipment', serialNumber: 'SE-002', status: 'available', depot: 'Bournemouth Main Depot' },
      { name: 'Tyre Pressure Gauge', category: 'diagnostic', serialNumber: 'DG-003', status: 'available', depot: 'Bournemouth Main Depot' },
      { name: 'Brake Calliper Tool', category: 'hand_tool', serialNumber: 'HT-003', status: 'missing', depot: 'Bournemouth Main Depot' }
    ]);
    console.log(`Created ${tools.length} tools`);

    // --- FAULTS ---
    const faults = await Fault.create([
      {
        title: 'Body panel corrosion — left rear quarter',
        description: 'Visible rust formation on the lower left rear quarter panel. Approximately 15cm x 10cm area affected. Paint bubbling suggests subsurface corrosion.',
        type: 'structural',
        severity: 'medium',
        status: 'confirmed',
        location: { area: 'Bus exterior — left rear quarter panel', depot: 'Bournemouth Main Depot', vehicleId: 'YX23 BUS' },
        detectedBy: engineer._id,
        arData: { markerType: 'image_marker', confidence: 0.92 }
      },
      {
        title: 'Suspension fault — front axle vibration',
        description: 'Excessive vibration detected at speeds above 30mph. Suspected worn front shock absorber or bush.',
        type: 'mechanical',
        severity: 'high',
        status: 'in_progress',
        location: { area: 'Undercarriage — front axle', depot: 'Bournemouth Main Depot', vehicleId: 'YX23 BUS' },
        detectedBy: engineer._id,
        assignedTo: engineer._id,
        arData: { markerType: 'image_marker', confidence: 0.88 }
      },
      {
        title: 'Interior emergency exit light failure',
        description: 'Rear emergency exit illumination sign not functioning. Bulb or wiring fault suspected.',
        type: 'electrical',
        severity: 'critical',
        status: 'detected',
        location: { area: 'Bus interior — rear emergency exit', depot: 'Bournemouth Main Depot', vehicleId: 'BF22 YTR' },
        detectedBy: admin._id,
        arData: { markerType: 'image_marker', confidence: 0.95 }
      },
      {
        title: 'Tyre wear — front nearside below limit',
        description: 'Front nearside tyre tread depth measured at 1.4mm. Legal minimum is 1.6mm. Requires immediate replacement.',
        type: 'wear',
        severity: 'critical',
        status: 'detected',
        location: { area: 'Front nearside wheel', depot: 'Bournemouth Main Depot', vehicleId: 'BF22 YTR' },
        detectedBy: engineer._id,
        arData: { markerType: 'image_marker', confidence: 0.97 }
      },
      {
        title: 'Windscreen wiper mechanism stiff',
        description: 'Driver-side wiper arm showing resistance. Possible linkage wear or motor strain.',
        type: 'mechanical',
        severity: 'low',
        status: 'detected',
        location: { area: 'Front windscreen — driver side', depot: 'Bournemouth Main Depot', vehicleId: 'GN21 XRM' },
        detectedBy: engineer._id,
        arData: { markerType: 'image_marker', confidence: 0.78 }
      },
      {
        title: 'Engine bay — coolant leak trace',
        description: 'Small coolant stain visible beneath radiator hose junction. No active drip observed but residue suggests intermittent leak.',
        type: 'mechanical',
        severity: 'high',
        status: 'confirmed',
        location: { area: 'Engine bay — radiator area', depot: 'Bournemouth Main Depot', vehicleId: 'GN21 XRM' },
        detectedBy: engineer._id,
        annotations: [{ text: 'Monitored over 2 days. Leak rate appears to increase after sustained running.', author: engineer._id }],
        arData: { markerType: 'image_marker', confidence: 0.85 }
      },
      {
        title: 'CCTV camera 3 — image distortion',
        description: 'Onboard CCTV camera 3 (upper deck rear) showing image distortion. Possible lens damage or connection issue.',
        type: 'electrical',
        severity: 'medium',
        status: 'resolved',
        location: { area: 'Upper deck — rear CCTV mount', depot: 'Bournemouth Main Depot', vehicleId: 'YX23 BUS' },
        detectedBy: admin._id,
        resolvedBy: engineer._id,
        resolvedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        arData: { markerType: 'image_marker', confidence: 0.91 }
      },
      {
        title: 'Fire extinguisher expired — lower deck',
        description: 'Lower deck fire extinguisher past inspection date. Due for replacement or re-certification.',
        type: 'safety',
        severity: 'high',
        status: 'detected',
        location: { area: 'Lower deck — front nearside', depot: 'Bournemouth Main Depot', vehicleId: 'BF22 YTR' },
        detectedBy: engineer._id,
        arData: { markerType: 'image_marker', confidence: 0.99 }
      }
    ]);
    console.log(`Created ${faults.length} faults`);

    // --- TOOL CHECKS ---
    const toolChecks = await ToolCheck.create([
      {
        performedBy: engineer._id,
        checkType: 'pre_shift',
        depot: 'Bournemouth Main Depot',
        vehicleId: 'YX23 BUS',
        expectedTools: tools.slice(0, 5).map(t => ({ tool: t._id, name: t.name })),
        detectedTools: tools.slice(0, 5).map(t => ({ tool: t._id, name: t.name, confidence: 0.9 + Math.random() * 0.1 })),
        missingTools: [],
        totalExpected: 5,
        totalDetected: 5,
        totalMissing: 0,
        passed: true,
        notes: 'All tools present and accounted for.'
      },
      {
        performedBy: engineer._id,
        checkType: 'post_shift',
        depot: 'Bournemouth Main Depot',
        vehicleId: 'YX23 BUS',
        expectedTools: tools.slice(0, 5).map(t => ({ tool: t._id, name: t.name })),
        detectedTools: tools.slice(0, 4).map(t => ({ tool: t._id, name: t.name, confidence: 0.85 + Math.random() * 0.15 })),
        missingTools: [{ tool: tools[4]._id, name: tools[4].name }],
        totalExpected: 5,
        totalDetected: 4,
        totalMissing: 1,
        passed: false,
        notes: 'Impact Driver not found after shift. Engineer to search vehicle.'
      },
      {
        performedBy: admin._id,
        checkType: 'spot_check',
        depot: 'Bournemouth Main Depot',
        expectedTools: tools.slice(6, 9).map(t => ({ tool: t._id, name: t.name })),
        detectedTools: tools.slice(6, 9).map(t => ({ tool: t._id, name: t.name, confidence: 0.92 + Math.random() * 0.08 })),
        missingTools: [],
        totalExpected: 3,
        totalDetected: 3,
        totalMissing: 0,
        passed: true,
        notes: 'Spot check of safety equipment. All items present.'
      }
    ]);
    console.log(`Created ${toolChecks.length} tool checks`);

    console.log('\n✅ Database seeded successfully!');
    console.log('\nTest accounts:');
    console.log('  Admin:    admin@busdepot.com    / Admin123!');
    console.log('  Engineer: engineer@busdepot.com / Engineer123!');
    console.log('  Viewer:   viewer@busdepot.com   / Viewer123!\n');

    process.exit(0);

  } catch (error) {
    console.error('Seed error:', error);
    process.exit(1);
  }
};

seedDB();
