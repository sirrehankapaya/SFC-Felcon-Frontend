// Seed data for local/dev use. In the real deployment this all comes from the
// Express + MongoDB API - see /docs/API_CONTRACT.md for the shape the backend
// team agreed on. Kept here so the UI has something to render against.

export const seedSociety = {
  name: 'Clifton Heights Society',
  address: 'Block 7, Clifton, Karachi',
  blocks: ['A', 'B', 'C'],
};

export const seedUsers = [
  { id: 'u_admin1', username: 'admin', password: 'admin123', role: 'admin', name: 'Sarah Khalid', phone: '+92 300 1112233' },
  { id: 'u_res1', username: 'ahmed.raza', password: 'resident123', role: 'resident', name: 'Ahmed Raza', flatId: 'f_a101', phone: '+92 321 4455667' },
  { id: 'u_res2', username: 'fatima.malik', password: 'resident123', role: 'resident', name: 'Fatima Malik', flatId: 'f_b204', phone: '+92 333 8899001' },
  { id: 'u_res3', username: 'bilal.siddiqui', password: 'resident123', role: 'resident', name: 'Bilal Siddiqui', flatId: 'f_a102', phone: '+92 312 7766554' },
  { id: 'u_guard1', username: 'gate.usman', password: 'guard123', role: 'guard', name: 'Usman Tariq', phone: '+92 345 1122334' },
];

export const seedFlats = [
  { id: 'f_a101', block: 'A', number: 'A-101', occupancyType: 'Owner' },
  { id: 'f_a102', block: 'A', number: 'A-102', occupancyType: 'Owner' },
  { id: 'f_a103', block: 'A', number: 'A-103', occupancyType: 'Tenant' },
  { id: 'f_b204', block: 'B', number: 'B-204', occupancyType: 'Tenant' },
  { id: 'f_b205', block: 'B', number: 'B-205', occupancyType: 'Owner' },
  { id: 'f_c301', block: 'C', number: 'C-301', occupancyType: 'Owner' },
];

export const seedResidents = [
  {
    id: 'r_ahmed', userId: 'u_res1', flatId: 'f_a101', name: 'Ahmed Raza', phone: '+92 321 4455667',
    email: 'ahmed.raza@example.com', vehicleNumber: 'KHI-2234', tenant: false,
    emergencyContact: { name: 'Nadia Raza', phone: '+92 321 9988776', relation: 'Spouse' },
    familyMembers: [
      { name: 'Nadia Raza', relation: 'Spouse' },
      { name: 'Zain Raza', relation: 'Son' },
    ],
  },
  {
    id: 'r_fatima', userId: 'u_res2', flatId: 'f_b204', name: 'Fatima Malik', phone: '+92 333 8899001',
    email: 'fatima.malik@example.com', vehicleNumber: 'KHI-9981', tenant: true,
    emergencyContact: { name: 'Imran Malik', phone: '+92 300 5566778', relation: 'Brother' },
    familyMembers: [{ name: 'Imran Malik', relation: 'Brother' }],
  },
  {
    id: 'r_bilal', userId: 'u_res3', flatId: 'f_a102', name: 'Bilal Siddiqui', phone: '+92 312 7766554',
    email: 'bilal.siddiqui@example.com', vehicleNumber: 'KHI-4471', tenant: false,
    emergencyContact: { name: 'Sana Siddiqui', phone: '+92 312 1231231', relation: 'Sister' },
    familyMembers: [],
  },
];

const today = new Date();
function monthsAgo(n) {
  const d = new Date(today.getFullYear(), today.getMonth() - n, 5);
  return d.toISOString();
}
function inDays(n) {
  const d = new Date(today);
  d.setDate(d.getDate() + n);
  return d.toISOString();
}

export const seedBills = [
  { id: 'bill_1', flatId: 'f_a101', period: monthsAgo(2), amountDue: 8500, dueDate: monthsAgo(2), paymentStatus: 'Paid', paidOn: monthsAgo(2), breakdown: { water: 1200, security: 3000, repairs: 1800, other: 2500 } },
  { id: 'bill_2', flatId: 'f_a101', period: monthsAgo(1), amountDue: 8500, dueDate: monthsAgo(1), paymentStatus: 'Paid', paidOn: monthsAgo(1), breakdown: { water: 1200, security: 3000, repairs: 1800, other: 2500 } },
  { id: 'bill_3', flatId: 'f_a101', period: inDays(0), amountDue: 9200, dueDate: inDays(10), paymentStatus: 'Unpaid', paidOn: null, breakdown: { water: 1400, security: 3000, repairs: 2200, other: 2600 } },
  { id: 'bill_4', flatId: 'f_b204', period: monthsAgo(1), amountDue: 7800, dueDate: monthsAgo(1), paymentStatus: 'Overdue', paidOn: null, breakdown: { water: 1100, security: 3000, repairs: 1200, other: 2500 } },
  { id: 'bill_5', flatId: 'f_b204', period: inDays(0), amountDue: 7800, dueDate: inDays(12), paymentStatus: 'Unpaid', paidOn: null, breakdown: { water: 1100, security: 3000, repairs: 1200, other: 2500 } },
  { id: 'bill_6', flatId: 'f_a102', period: inDays(0), amountDue: 8100, dueDate: inDays(9), paymentStatus: 'Unpaid', paidOn: null, breakdown: { water: 1300, security: 3000, repairs: 1300, other: 2500 } },
];

export const seedVisitors = [
  { id: 'v_1', flatId: 'f_a101', name: 'Kamran Ali', phone: '+92 301 0001111', vehicleNumber: 'KHI-7712', purpose: 'Guest', passCode: '482913', validFrom: inDays(0), validTo: inDays(1), status: 'Active' },
  { id: 'v_2', flatId: 'f_b204', name: 'TCS Courier', phone: '+92 302 0002222', vehicleNumber: '—', purpose: 'Delivery', passCode: '119284', validFrom: inDays(0), validTo: inDays(0), status: 'Used' },
];

export const seedGateLogs = [
  { id: 'g_1', visitorId: 'v_2', name: 'TCS Courier', phone: '+92 302 0002222', vehicleNumber: '—', flatId: 'f_b204', type: 'Delivery', checkIn: monthsAgo(0), checkOut: monthsAgo(0), overstay: false },
  { id: 'g_2', visitorId: null, name: 'Careem - Waqas', phone: '+92 303 5551212', vehicleNumber: 'KHI-3391', flatId: 'f_a102', type: 'Cab', checkIn: inDays(0), checkOut: null, overstay: true },
];

export const seedStaff = [
  { id: 's_1', name: 'Rashid Mehmood', specialty: 'Plumbing' },
  { id: 's_2', name: 'Junaid Iqbal', specialty: 'Electrical' },
  { id: 's_3', name: 'Waseem Anjum', specialty: 'General / Elevator' },
];

export const seedComplaints = [
  {
    id: 'c_1', residentId: 'r_ahmed', flatId: 'f_a101', category: 'Plumbing',
    description: 'Kitchen sink pipe leaking under the counter since Monday.',
    status: 'In-Progress', createdAt: monthsAgo(0), assignedTo: 's_1', photo: null,
    history: [{ ts: monthsAgo(0), note: 'Ticket raised by resident', status: 'Pending' }, { ts: inDays(-1), note: 'Assigned to Rashid Mehmood', status: 'In-Progress' }],
  },
  {
    id: 'c_2', residentId: 'r_fatima', flatId: 'f_b204', category: 'Electrical',
    description: 'Living room light flickers, might be the switchboard.',
    status: 'Pending', createdAt: inDays(-2), assignedTo: null, photo: null,
    history: [{ ts: inDays(-2), note: 'Ticket raised by resident', status: 'Pending' }],
  },
  {
    id: 'c_3', residentId: 'r_bilal', flatId: 'f_a102', category: 'Elevator',
    description: 'Elevator in Block A makes a grinding noise on the 3rd floor stop.',
    status: 'Resolved', createdAt: monthsAgo(1), assignedTo: 's_3', photo: null,
    history: [
      { ts: monthsAgo(1), note: 'Ticket raised by resident', status: 'Pending' },
      { ts: monthsAgo(1), note: 'Assigned to Waseem Anjum', status: 'In-Progress' },
      { ts: inDays(-20), note: 'Technician replaced the door sensor', status: 'Resolved' },
    ],
  },
];

export const seedAmenities = [
  { id: 'am_1', name: 'Clubhouse', description: 'Main hall, seats up to 80 for functions and gatherings.', capacity: 80, openTime: '09:00', closeTime: '22:00' },
  { id: 'am_2', name: 'Swimming Pool', description: 'Open lap pool, one hour slots.', capacity: 15, openTime: '06:00', closeTime: '20:00' },
  { id: 'am_3', name: 'Tennis Court', description: 'Single hard court, booked in 1 hour slots.', capacity: 4, openTime: '06:00', closeTime: '21:00' },
  { id: 'am_4', name: 'Party Hall', description: 'Smaller hall for birthdays and family events.', capacity: 40, openTime: '10:00', closeTime: '23:00' },
];

export const seedBookings = [
  { id: 'bk_1', amenityId: 'am_2', flatId: 'f_a101', residentId: 'r_ahmed', date: inDays(1), slot: '17:00 - 18:00', status: 'Confirmed', createdAt: inDays(-1) },
  { id: 'bk_2', amenityId: 'am_1', flatId: 'f_b204', residentId: 'r_fatima', date: inDays(6), slot: '18:00 - 22:00', status: 'Confirmed', createdAt: inDays(-3) },
];

export const seedNotices = [
  { id: 'n_1', title: 'Water Tank Cleaning - Block A', body: 'Water supply to Block A will be suspended on Saturday from 10am to 2pm for annual tank cleaning.', category: 'Maintenance', createdAt: inDays(-1), pinned: true },
  { id: 'n_2', title: 'Annual Society Elections', body: 'Nominations for the next management committee open from the 1st. Drop your form at the admin office.', category: 'General', createdAt: inDays(-5), pinned: false },
  { id: 'n_3', title: 'Eid Milan Party - Clubhouse', body: 'All residents are invited to the Eid Milan gathering at the clubhouse, 7pm onwards.', category: 'Event', createdAt: inDays(-8), pinned: false },
];

export const seedPolls = [
  {
    id: 'p_1',
    question: 'Should we install solar panels on the clubhouse roof?',
    options: [{ id: 'o1', text: 'Yes, go ahead', votes: 14 }, { id: 'o2', text: 'No, too costly', votes: 4 }, { id: 'o3', text: 'Need more details first', votes: 7 }],
    votesBy: [],
    closesAt: inDays(10),
  },
];

export const seedEmergencyContacts = [
  { id: 'e_1', name: 'Main Gate Security', role: 'Security Desk', phone: '+92 21 111 222 333' },
  { id: 'e_2', name: 'Fire Brigade - Karachi', role: 'Fire', phone: '16' },
  { id: 'e_3', name: 'Edhi Ambulance', role: 'Ambulance', phone: '115' },
  { id: 'e_4', name: 'Society Admin Office', role: 'Management', phone: '+92 21 3455 6677' },
];
