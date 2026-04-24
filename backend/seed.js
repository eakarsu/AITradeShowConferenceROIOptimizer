const pool = require('./db');
const bcrypt = require('bcryptjs');

async function seed() {
  console.log('Seeding database...');

  // Drop and recreate tables
  await pool.query(`
    DROP TABLE IF EXISTS budgets, followups, competitors, materials, sponsors, staff, expenses, leads, booths, events, users CASCADE;

    CREATE TABLE users (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      role VARCHAR(50) DEFAULT 'user',
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE events (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      description TEXT,
      location VARCHAR(255),
      venue VARCHAR(255),
      start_date DATE,
      end_date DATE,
      event_type VARCHAR(100),
      expected_attendees INTEGER,
      registration_fee DECIMAL(10,2),
      status VARCHAR(50) DEFAULT 'upcoming',
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE booths (
      id SERIAL PRIMARY KEY,
      event_id INTEGER REFERENCES events(id) ON DELETE CASCADE,
      booth_number VARCHAR(50),
      size VARCHAR(50),
      location_in_venue VARCHAR(255),
      rental_cost DECIMAL(10,2),
      setup_cost DECIMAL(10,2),
      booth_type VARCHAR(100),
      amenities TEXT,
      status VARCHAR(50) DEFAULT 'reserved',
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE leads (
      id SERIAL PRIMARY KEY,
      event_id INTEGER REFERENCES events(id) ON DELETE CASCADE,
      contact_name VARCHAR(255),
      company VARCHAR(255),
      email VARCHAR(255),
      phone VARCHAR(50),
      job_title VARCHAR(255),
      interest_level VARCHAR(50),
      notes TEXT,
      estimated_value DECIMAL(12,2),
      status VARCHAR(50) DEFAULT 'new',
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE expenses (
      id SERIAL PRIMARY KEY,
      event_id INTEGER REFERENCES events(id) ON DELETE CASCADE,
      category VARCHAR(100),
      description TEXT,
      amount DECIMAL(10,2),
      vendor VARCHAR(255),
      expense_date DATE,
      payment_method VARCHAR(50),
      receipt_number VARCHAR(100),
      status VARCHAR(50) DEFAULT 'pending',
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE staff (
      id SERIAL PRIMARY KEY,
      event_id INTEGER REFERENCES events(id) ON DELETE CASCADE,
      name VARCHAR(255),
      role VARCHAR(100),
      department VARCHAR(100),
      email VARCHAR(255),
      phone VARCHAR(50),
      travel_cost DECIMAL(10,2),
      hotel_cost DECIMAL(10,2),
      per_diem DECIMAL(10,2),
      status VARCHAR(50) DEFAULT 'confirmed',
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE sponsors (
      id SERIAL PRIMARY KEY,
      event_id INTEGER REFERENCES events(id) ON DELETE CASCADE,
      company_name VARCHAR(255),
      contact_name VARCHAR(255),
      email VARCHAR(255),
      phone VARCHAR(50),
      sponsorship_level VARCHAR(50),
      amount DECIMAL(12,2),
      benefits TEXT,
      contract_status VARCHAR(50) DEFAULT 'pending',
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE materials (
      id SERIAL PRIMARY KEY,
      event_id INTEGER REFERENCES events(id) ON DELETE CASCADE,
      name VARCHAR(255),
      material_type VARCHAR(100),
      quantity INTEGER,
      unit_cost DECIMAL(10,2),
      vendor VARCHAR(255),
      design_status VARCHAR(50) DEFAULT 'draft',
      print_status VARCHAR(50) DEFAULT 'pending',
      notes TEXT,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE competitors (
      id SERIAL PRIMARY KEY,
      event_id INTEGER REFERENCES events(id) ON DELETE CASCADE,
      company_name VARCHAR(255),
      booth_location VARCHAR(255),
      booth_size VARCHAR(50),
      products_displayed TEXT,
      marketing_tactics TEXT,
      staff_count INTEGER,
      estimated_budget DECIMAL(10,2),
      threat_level VARCHAR(50) DEFAULT 'medium',
      notes TEXT,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE followups (
      id SERIAL PRIMARY KEY,
      event_id INTEGER REFERENCES events(id) ON DELETE CASCADE,
      contact_name VARCHAR(255),
      company VARCHAR(255),
      email VARCHAR(255),
      followup_type VARCHAR(100),
      priority VARCHAR(50),
      due_date DATE,
      assigned_to VARCHAR(255),
      notes TEXT,
      status VARCHAR(50) DEFAULT 'pending',
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE budgets (
      id SERIAL PRIMARY KEY,
      event_id INTEGER REFERENCES events(id) ON DELETE CASCADE,
      category VARCHAR(100),
      planned_amount DECIMAL(12,2),
      actual_amount DECIMAL(12,2) DEFAULT 0,
      variance_notes TEXT,
      fiscal_year INTEGER,
      quarter VARCHAR(10),
      approval_status VARCHAR(50) DEFAULT 'draft',
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );
  `);

  // Seed users
  const hashedPassword = await bcrypt.hash('password123', 10);
  await pool.query(`
    INSERT INTO users (name, email, password, role) VALUES
    ('Admin User', 'admin@tradeshow.com', $1, 'admin'),
    ('Sarah Johnson', 'sarah@tradeshow.com', $1, 'manager'),
    ('Mike Chen', 'mike@tradeshow.com', $1, 'user')
  `, [hashedPassword]);

  // Seed events (16 items)
  await pool.query(`
    INSERT INTO events (name, description, location, venue, start_date, end_date, event_type, expected_attendees, registration_fee, status) VALUES
    ('CES 2026', 'Consumer Electronics Show - World''s largest tech trade show', 'Las Vegas, NV', 'Las Vegas Convention Center', '2026-01-06', '2026-01-09', 'Trade Show', 180000, 500.00, 'upcoming'),
    ('Mobile World Congress', 'Global mobile industry conference', 'Barcelona, Spain', 'Fira Gran Via', '2026-02-23', '2026-02-26', 'Conference', 110000, 799.00, 'upcoming'),
    ('SXSW Interactive', 'South by Southwest Interactive Festival', 'Austin, TX', 'Austin Convention Center', '2026-03-13', '2026-03-22', 'Festival', 75000, 1295.00, 'upcoming'),
    ('RSA Conference', 'World''s leading cybersecurity conference', 'San Francisco, CA', 'Moscone Center', '2026-04-06', '2026-04-09', 'Conference', 45000, 2495.00, 'upcoming'),
    ('NAB Show', 'National Association of Broadcasters Annual Show', 'Las Vegas, NV', 'Las Vegas Convention Center', '2026-04-18', '2026-04-22', 'Trade Show', 90000, 150.00, 'upcoming'),
    ('Hannover Messe', 'World''s leading industrial technology trade fair', 'Hannover, Germany', 'Hannover Fairground', '2025-04-22', '2025-04-26', 'Trade Fair', 130000, 350.00, 'completed'),
    ('Google Cloud Next', 'Google Cloud annual conference', 'San Francisco, CA', 'Moscone Center', '2025-04-09', '2025-04-11', 'Conference', 30000, 1299.00, 'completed'),
    ('AWS re:Invent', 'Amazon Web Services annual conference', 'Las Vegas, NV', 'The Venetian', '2025-12-01', '2025-12-05', 'Conference', 65000, 1899.00, 'completed'),
    ('Dreamforce', 'Salesforce annual mega-conference', 'San Francisco, CA', 'Moscone Center', '2025-09-16', '2025-09-18', 'Conference', 170000, 2199.00, 'completed'),
    ('Web Summit', 'One of the largest tech conferences globally', 'Lisbon, Portugal', 'Altice Arena', '2025-11-11', '2025-11-14', 'Conference', 70000, 945.00, 'completed'),
    ('NRF Big Show', 'National Retail Federation annual conference', 'New York, NY', 'Javits Center', '2026-01-11', '2026-01-13', 'Trade Show', 40000, 500.00, 'upcoming'),
    ('Collision', 'North America''s fastest-growing tech conference', 'Toronto, Canada', 'Enercare Centre', '2026-06-23', '2026-06-26', 'Conference', 40000, 895.00, 'upcoming'),
    ('HIMSS Global', 'Health Information Technology Conference', 'Orlando, FL', 'Orange County Convention Center', '2026-03-09', '2026-03-13', 'Conference', 45000, 1195.00, 'upcoming'),
    ('Black Hat USA', 'Premier cybersecurity event', 'Las Vegas, NV', 'Mandalay Bay', '2026-08-01', '2026-08-06', 'Conference', 20000, 2995.00, 'upcoming'),
    ('Gartner IT Symposium', 'World''s most important gathering of CIOs', 'Orlando, FL', 'Walt Disney World', '2025-10-20', '2025-10-23', 'Symposium', 12000, 4795.00, 'completed'),
    ('Adobe MAX', 'Adobe''s annual creativity conference', 'Los Angeles, CA', 'LA Convention Center', '2025-10-14', '2025-10-16', 'Conference', 16000, 1895.00, 'completed')
  `);

  // Seed booths (16 items)
  await pool.query(`
    INSERT INTO booths (event_id, booth_number, size, location_in_venue, rental_cost, setup_cost, booth_type, amenities, status) VALUES
    (1, 'A-101', '20x30', 'Main Hall - Front Row', 45000.00, 15000.00, 'Island', 'Electricity, WiFi, LED Wall, Meeting Room', 'confirmed'),
    (2, 'H3-220', '10x20', 'Hall 3 - Center', 32000.00, 12000.00, 'Peninsula', 'Electricity, WiFi, Storage, Demo Area', 'confirmed'),
    (3, 'B-450', '10x10', 'Exhibit Hall B', 8500.00, 5000.00, 'Inline', 'Electricity, WiFi, Counter', 'confirmed'),
    (4, 'N-1050', '20x20', 'North Hall - Premium', 28000.00, 18000.00, 'Island', 'Electricity, WiFi, Theater, Lounge', 'confirmed'),
    (5, 'C-789', '10x15', 'Central Hall', 12000.00, 7000.00, 'Corner', 'Electricity, WiFi, Demo Stations', 'confirmed'),
    (6, 'H12-340', '15x20', 'Hall 12', 22000.00, 10000.00, 'Peninsula', 'Electricity, WiFi, LED Screens', 'completed'),
    (7, 'S-200', '10x10', 'South Hall', 15000.00, 8000.00, 'Inline', 'Electricity, WiFi, Kiosk', 'completed'),
    (8, 'V-1800', '30x40', 'Venetian Expo - Spotlight', 75000.00, 35000.00, 'Island', 'Full AV, Meeting Rooms, Lounge, Kitchen', 'completed'),
    (9, 'M-500', '20x30', 'Moscone West', 55000.00, 25000.00, 'Island', 'Electricity, WiFi, Theater, Demo Lab', 'completed'),
    (10, 'P-120', '10x10', 'Pavilion 1', 9500.00, 4500.00, 'Inline', 'Electricity, WiFi, Counter', 'completed'),
    (11, 'J-340', '15x15', 'Level 3 - Hall A', 18000.00, 9000.00, 'Corner', 'Electricity, WiFi, Demo Area', 'reserved'),
    (12, 'E-600', '10x20', 'Exhibition Hall', 14000.00, 7500.00, 'Peninsula', 'Electricity, WiFi, Storage', 'reserved'),
    (13, 'O-250', '20x20', 'Orange Hall - Center', 22000.00, 12000.00, 'Island', 'Electricity, WiFi, Theater', 'confirmed'),
    (14, 'MB-420', '10x15', 'Mandalay Bay - Business Hall', 16000.00, 8000.00, 'Corner', 'Electricity, WiFi, Demo Stations', 'confirmed'),
    (15, 'D-180', '15x20', 'Disney Coronado Springs', 28000.00, 14000.00, 'Island', 'Full AV, Lounge, Private Meeting Room', 'completed'),
    (16, 'LA-330', '10x10', 'West Hall', 11000.00, 6000.00, 'Inline', 'Electricity, WiFi, Display Wall', 'completed')
  `);

  // Seed leads (18 items)
  await pool.query(`
    INSERT INTO leads (event_id, contact_name, company, email, phone, job_title, interest_level, notes, estimated_value, status) VALUES
    (6, 'Jennifer Adams', 'TechCorp Industries', 'jadams@techcorp.com', '555-0101', 'VP of Engineering', 'hot', 'Very interested in enterprise solution. Wants demo next week.', 150000.00, 'qualified'),
    (7, 'Robert Kim', 'CloudFirst Solutions', 'rkim@cloudfirst.io', '555-0102', 'CTO', 'hot', 'Current customer looking to expand. Ready for upsell.', 280000.00, 'qualified'),
    (8, 'Maria Garcia', 'DataStream Analytics', 'mgarcia@datastream.com', '555-0103', 'Director of Operations', 'warm', 'Interested in analytics platform. Budget approval pending.', 95000.00, 'contacted'),
    (9, 'David Wilson', 'Quantum Dynamics', 'dwilson@quantumd.com', '555-0104', 'CEO', 'hot', 'Enterprise deal potential. Schedule board presentation.', 500000.00, 'qualified'),
    (8, 'Lisa Thompson', 'NexGen Software', 'lthompson@nexgen.dev', '555-0105', 'Product Manager', 'warm', 'Evaluating multiple vendors. Need competitive positioning.', 120000.00, 'new'),
    (10, 'James Brown', 'European Tech AG', 'jbrown@eurotech.de', '555-0106', 'Head of Innovation', 'warm', 'Exploring US market entry. Partnership potential.', 200000.00, 'contacted'),
    (6, 'Anna Kowalski', 'ManufacturePro GmbH', 'akowalski@mpro.de', '555-0107', 'Plant Manager', 'hot', 'Immediate need for automation solution.', 350000.00, 'qualified'),
    (9, 'Chen Wei', 'Pacific Rim Trading', 'cwei@pacrim.com', '555-0108', 'Procurement Director', 'cold', 'Long-term prospect. Building relationship.', 75000.00, 'new'),
    (15, 'Patricia Martinez', 'Innovate Health', 'pmartinez@innovhealth.com', '555-0109', 'Chief Digital Officer', 'hot', 'Healthcare vertical opportunity. Compliance requirements.', 420000.00, 'qualified'),
    (7, 'Thomas Anderson', 'Matrix Systems', 'tanderson@matrix.io', '555-0110', 'Solutions Architect', 'warm', 'Technical evaluation phase. Good fit.', 180000.00, 'contacted'),
    (16, 'Sophie Laurent', 'Creative Agency Paris', 'slaurent@creativeparis.fr', '555-0111', 'Creative Director', 'warm', 'Needs design tool integration. Mid-market.', 65000.00, 'new'),
    (8, 'Michael Scott', 'Dunder Mifflin Tech', 'mscott@dundermifflin.com', '555-0112', 'Regional Manager', 'cold', 'Small business. Potential SMB tier customer.', 25000.00, 'new'),
    (10, 'Emma Johansson', 'Nordic Digital AS', 'ejohansson@nordicdig.no', '555-0113', 'VP Sales', 'hot', 'Scandinavian market expansion opportunity.', 310000.00, 'qualified'),
    (9, 'Raj Patel', 'TechVentures India', 'rpatel@techventures.in', '555-0114', 'Managing Director', 'warm', 'APAC partnership opportunity. High volume potential.', 450000.00, 'contacted'),
    (6, 'Karen Mueller', 'AutoTech Bavaria', 'kmueller@autotech.de', '555-0115', 'R&D Director', 'hot', 'Automotive vertical. Complex integration needs.', 275000.00, 'qualified'),
    (15, 'John Baker', 'Summit Consulting', 'jbaker@summitconsult.com', '555-0116', 'Partner', 'warm', 'Channel partner potential. Could drive referrals.', 100000.00, 'contacted'),
    (7, 'Yuki Tanaka', 'Tokyo Digital Corp', 'ytanaka@tokyodigital.jp', '555-0117', 'Division Head', 'cold', 'Japanese market entry. Long sales cycle.', 550000.00, 'new'),
    (16, 'Alex Rivera', 'DesignFlow Studio', 'arivera@designflow.co', '555-0118', 'Founder', 'warm', 'Startup. Early adopter potential. Influencer.', 35000.00, 'contacted')
  `);

  // Seed expenses (18 items)
  await pool.query(`
    INSERT INTO expenses (event_id, category, description, amount, vendor, expense_date, payment_method, receipt_number, status) VALUES
    (1, 'Booth Rental', 'CES 2026 Island Booth A-101 Rental', 45000.00, 'CES Management', '2025-11-15', 'Wire Transfer', 'CES-2026-001', 'approved'),
    (1, 'Booth Setup', 'Custom booth construction and installation', 15000.00, 'ExhibitPro Inc', '2025-12-20', 'Credit Card', 'EP-4521', 'approved'),
    (2, 'Travel', 'Team flights to Barcelona (6 people)', 18500.00, 'Corporate Travel Inc', '2026-01-10', 'Credit Card', 'CTI-8834', 'approved'),
    (2, 'Hotel', 'Hotel rooms Barcelona - 5 nights x 6 rooms', 21600.00, 'Hilton Barcelona', '2026-01-10', 'Credit Card', 'HIL-2026-442', 'approved'),
    (1, 'Marketing Materials', 'Brochures, banners, swag bags', 8500.00, 'PrintMax Solutions', '2025-12-01', 'Purchase Order', 'PM-7823', 'approved'),
    (3, 'Registration', 'SXSW Interactive badges x 4', 5180.00, 'SXSW LLC', '2025-09-15', 'Credit Card', 'SXSW-REG-4401', 'approved'),
    (4, 'Booth Rental', 'RSA Conference Booth N-1050', 28000.00, 'RSA Conference', '2025-12-01', 'Wire Transfer', 'RSA-BK-2026', 'approved'),
    (4, 'Catering', 'In-booth catering for 4 days', 4200.00, 'Moscone Catering', '2026-03-20', 'Credit Card', 'MC-1123', 'pending'),
    (6, 'Shipping', 'Booth materials shipping to Hannover', 6800.00, 'DHL Express', '2025-04-10', 'Credit Card', 'DHL-9927231', 'approved'),
    (8, 'Booth Rental', 'AWS re:Invent Spotlight Booth', 75000.00, 'AWS Events', '2025-08-01', 'Wire Transfer', 'AWS-RI-2025-SP', 'approved'),
    (8, 'Swag', 'Custom merchandise and giveaways', 12000.00, 'SwagUp Co', '2025-11-01', 'Credit Card', 'SU-8834', 'approved'),
    (9, 'Sponsorship', 'Dreamforce Silver Sponsorship', 35000.00, 'Salesforce Events', '2025-06-01', 'Wire Transfer', 'DF-SILVER-2025', 'approved'),
    (5, 'AV Equipment', 'LED wall rental and AV setup', 9500.00, 'ProAV Solutions', '2026-03-15', 'Purchase Order', 'PAV-2210', 'pending'),
    (10, 'Travel', 'Team flights to Lisbon (3 people)', 7200.00, 'Corporate Travel Inc', '2025-10-01', 'Credit Card', 'CTI-7721', 'approved'),
    (13, 'Registration', 'HIMSS badges x 5', 5975.00, 'HIMSS Organization', '2025-12-15', 'Credit Card', 'HIMSS-5521', 'approved'),
    (11, 'Booth Design', 'Custom booth design and 3D rendering', 4500.00, 'DesignStudio NYC', '2025-11-01', 'Credit Card', 'DS-3321', 'pending'),
    (14, 'Training', 'Security certifications for demo team', 3200.00, 'CyberCert Academy', '2026-06-01', 'Credit Card', 'CCA-1102', 'pending'),
    (1, 'Insurance', 'Event liability insurance', 2800.00, 'EventGuard Insurance', '2025-11-01', 'Wire Transfer', 'EGI-44521', 'approved')
  `);

  // Seed staff (16 items)
  await pool.query(`
    INSERT INTO staff (event_id, name, role, department, email, phone, travel_cost, hotel_cost, per_diem, status) VALUES
    (1, 'Sarah Johnson', 'Event Lead', 'Marketing', 'sarah@company.com', '555-1001', 890.00, 1200.00, 300.00, 'confirmed'),
    (1, 'Mike Chen', 'Technical Demo', 'Engineering', 'mike@company.com', '555-1002', 890.00, 1200.00, 300.00, 'confirmed'),
    (1, 'Emily Watson', 'Sales Rep', 'Sales', 'emily@company.com', '555-1003', 890.00, 1200.00, 300.00, 'confirmed'),
    (2, 'Carlos Mendez', 'Event Lead', 'Marketing', 'carlos@company.com', '555-1004', 2100.00, 1800.00, 400.00, 'confirmed'),
    (2, 'Priya Sharma', 'Product Specialist', 'Product', 'priya@company.com', '555-1005', 2100.00, 1800.00, 400.00, 'confirmed'),
    (3, 'Jason Park', 'Brand Ambassador', 'Marketing', 'jason@company.com', '555-1006', 450.00, 1500.00, 350.00, 'confirmed'),
    (4, 'Amanda Foster', 'Security Expert', 'Engineering', 'amanda@company.com', '555-1007', 650.00, 1100.00, 300.00, 'confirmed'),
    (4, 'Ryan O''Brien', 'Sales Director', 'Sales', 'ryan@company.com', '555-1008', 650.00, 1100.00, 300.00, 'confirmed'),
    (5, 'Nicole Adams', 'Demo Specialist', 'Engineering', 'nicole@company.com', '555-1009', 890.00, 1200.00, 300.00, 'confirmed'),
    (8, 'David Kim', 'VP of Sales', 'Sales', 'david@company.com', '555-1010', 890.00, 2000.00, 400.00, 'confirmed'),
    (8, 'Laura Stevens', 'Solutions Architect', 'Engineering', 'laura@company.com', '555-1011', 890.00, 2000.00, 400.00, 'confirmed'),
    (9, 'Mark Thompson', 'Account Executive', 'Sales', 'mark@company.com', '555-1012', 650.00, 1100.00, 300.00, 'confirmed'),
    (13, 'Dr. Susan Park', 'Healthcare Specialist', 'Product', 'susan@company.com', '555-1013', 480.00, 1000.00, 300.00, 'confirmed'),
    (14, 'Alex Novak', 'Security Researcher', 'Engineering', 'alex@company.com', '555-1014', 890.00, 1500.00, 350.00, 'pending'),
    (11, 'Rachel Green', 'Retail Specialist', 'Sales', 'rachel@company.com', '555-1015', 350.00, 900.00, 250.00, 'confirmed'),
    (1, 'Tom Bradley', 'Videographer', 'Marketing', 'tom@company.com', '555-1016', 890.00, 1200.00, 300.00, 'confirmed')
  `);

  // Seed sponsors (16 items)
  await pool.query(`
    INSERT INTO sponsors (event_id, company_name, contact_name, email, phone, sponsorship_level, amount, benefits, contract_status) VALUES
    (1, 'TechGiant Corp', 'Bill Stevens', 'bstevens@techgiant.com', '555-2001', 'Platinum', 150000.00, 'Keynote slot, premium booth location, logo on all materials, VIP dinner', 'signed'),
    (1, 'CloudBase Inc', 'Amy Chen', 'achen@cloudbase.io', '555-2002', 'Gold', 75000.00, 'Panel speaking slot, booth upgrade, logo on website', 'signed'),
    (2, 'MobileFirst Ltd', 'Hans Weber', 'hweber@mobilefirst.eu', '555-2003', 'Silver', 35000.00, 'Logo on materials, booth signage, social media mention', 'signed'),
    (3, 'InnovateTech', 'Jessica Wong', 'jwong@innovatetech.com', '555-2004', 'Gold', 60000.00, 'Workshop hosting, premium placement, video coverage', 'signed'),
    (4, 'SecureShield', 'Igor Petrov', 'ipetrov@secureshield.com', '555-2005', 'Platinum', 120000.00, 'Keynote, booth, VIP access, lead sharing', 'signed'),
    (5, 'BroadcastPro', 'Diana Ross', 'dross@broadcastpro.com', '555-2006', 'Bronze', 15000.00, 'Logo on website, social media mentions', 'pending'),
    (8, 'DataLake Solutions', 'Kevin Zhang', 'kzhang@datalake.io', '555-2007', 'Gold', 85000.00, 'Speaking slot, demo theater, lead scanning', 'signed'),
    (9, 'CRM Global', 'Olivia Brown', 'obrown@crmglobal.com', '555-2008', 'Silver', 40000.00, 'Booth sponsorship, app listing, email blast', 'signed'),
    (1, 'AI Dynamics', 'Satoshi Nakamura', 'snakamura@aidynamics.jp', '555-2009', 'Silver', 35000.00, 'Logo placement, networking event co-host', 'negotiating'),
    (11, 'RetailNext', 'Maria Santos', 'msantos@retailnext.com', '555-2010', 'Gold', 55000.00, 'Panel moderation, booth, attendee bag insert', 'signed'),
    (13, 'HealthTech Ventures', 'Dr. James Lee', 'jlee@htventures.com', '555-2011', 'Platinum', 100000.00, 'Keynote, booth, research poster sponsorship', 'signed'),
    (14, 'CyberDefense Corp', 'Elena Volkov', 'evolkov@cyberdefense.com', '555-2012', 'Gold', 70000.00, 'CTF sponsorship, speaking slot, recruitment booth', 'negotiating'),
    (2, 'ConnectAll Telecom', 'Pierre Dubois', 'pdubois@connectall.fr', '555-2013', 'Bronze', 20000.00, 'Logo on badges, social media campaign', 'signed'),
    (12, 'StartupHub', 'Aiden Murphy', 'amurphy@startuphub.ca', '555-2014', 'Silver', 30000.00, 'Startup pavilion naming rights, mentoring sessions', 'pending'),
    (10, 'WebScale Technologies', 'Luisa Ferreira', 'lferreira@webscale.pt', '555-2015', 'Gold', 65000.00, 'Main stage branding, VIP lounge naming', 'signed'),
    (15, 'Enterprise Insights', 'Robert Chapman', 'rchapman@entinsights.com', '555-2016', 'Platinum', 130000.00, 'Exclusive CIO dinner sponsor, premium placement', 'signed')
  `);

  // Seed materials (16 items)
  await pool.query(`
    INSERT INTO materials (event_id, name, material_type, quantity, unit_cost, vendor, design_status, print_status, notes) VALUES
    (1, 'Product Brochure 2026', 'Brochure', 5000, 1.25, 'PrintMax Solutions', 'approved', 'printed', 'Full color tri-fold, updated product lineup'),
    (1, 'Company Overview Flyer', 'Flyer', 3000, 0.45, 'PrintMax Solutions', 'approved', 'printed', 'Single page, double-sided'),
    (1, 'Trade Show Banner - Large', 'Banner', 4, 250.00, 'SignCraft Pro', 'approved', 'printed', '10ft retractable banners'),
    (2, 'MWC Presentation Deck', 'Digital', 1, 500.00, 'Internal Design', 'approved', 'n/a', '45-slide keynote presentation'),
    (1, 'Branded USB Drives', 'Swag', 2000, 3.50, 'SwagUp Co', 'approved', 'shipped', '16GB, preloaded with demo software'),
    (3, 'SXSW Sticker Pack', 'Swag', 10000, 0.15, 'StickerMule', 'approved', 'shipped', 'Die-cut logo stickers, 3 designs'),
    (4, 'Security Whitepaper', 'Document', 1000, 2.00, 'PrintMax Solutions', 'approved', 'printed', '12-page research whitepaper'),
    (1, 'Demo Video - Product Tour', 'Video', 1, 8000.00, 'VideoForge Studio', 'approved', 'n/a', '3-minute product tour video'),
    (8, 'AWS re:Invent Booth Backdrop', 'Signage', 2, 1500.00, 'SignCraft Pro', 'approved', 'printed', 'Custom fabric backdrop with LED integration'),
    (9, 'Dreamforce Case Study Cards', 'Brochure', 2000, 1.75, 'PrintMax Solutions', 'approved', 'printed', '5 customer case studies, card format'),
    (5, 'NAB Demo Reel', 'Video', 1, 12000.00, 'VideoForge Studio', 'in-progress', 'n/a', '5-minute broadcast quality demo reel'),
    (11, 'NRF Retail Innovation Guide', 'Brochure', 1500, 3.00, 'PrintMax Solutions', 'in-progress', 'pending', '24-page guide with retail use cases'),
    (13, 'HIMSS Compliance Checklist', 'Document', 2000, 0.80, 'PrintMax Solutions', 'draft', 'pending', 'HIPAA compliance quick reference'),
    (14, 'Black Hat Threat Report', 'Document', 500, 4.50, 'PrintMax Solutions', 'draft', 'pending', 'Annual threat landscape report'),
    (1, 'Branded Tote Bags', 'Swag', 3000, 2.25, 'SwagUp Co', 'approved', 'shipped', 'Canvas tote bags with company logo'),
    (2, 'MWC Interactive Touchscreen App', 'Digital', 1, 15000.00, 'AppDev Solutions', 'in-progress', 'n/a', 'Interactive product explorer for booth kiosks')
  `);

  // Seed competitors (16 items)
  await pool.query(`
    INSERT INTO competitors (event_id, company_name, booth_location, booth_size, products_displayed, marketing_tactics, staff_count, estimated_budget, threat_level, notes) VALUES
    (1, 'RivalTech Inc', 'Main Hall A-200', '30x40', 'Enterprise Platform v5, Mobile Suite, Analytics Dashboard', 'Live demos, celebrity speaker, VR experience', 15, 120000.00, 'high', 'Major competitor. New product launch expected.'),
    (1, 'CompeteCorp', 'Main Hall A-150', '20x20', 'Cloud Platform, DevOps Tools, Security Suite', 'Hands-on workshops, free certifications, swag wall', 10, 85000.00, 'high', 'Aggressive pricing strategy targeting our customers'),
    (2, 'MobileMaster EU', 'Hall 3-100', '15x20', '5G Solutions, IoT Platform, Edge Computing', 'Partner showcase, research presentations', 8, 60000.00, 'medium', 'Strong in European market. Growing US presence.'),
    (4, 'SecureNet Systems', 'North Hall N-980', '20x30', 'SIEM Platform, Threat Intelligence, SOC Tools', 'Live hacking demos, bug bounty, CTF contest', 12, 95000.00, 'high', 'Recently acquired AI security startup'),
    (8, 'CloudCompete AWS', 'Venetian V-1200', '40x50', 'Multi-cloud Management, Cost Optimizer, Migration Tools', 'Customer panels, hands-on labs, certification exams', 25, 200000.00, 'critical', 'AWS preferred partner. Massive booth presence.'),
    (9, 'SalesForce Rival', 'Moscone M-300', '25x30', 'CRM Alternative, Marketing Automation, Service Cloud', 'Customer testimonials, ROI calculator, free trials', 18, 150000.00, 'high', 'Direct competitor in CRM space'),
    (6, 'IndustrialTech AG', 'Hall 8-500', '20x25', 'Industry 4.0 Platform, Robotics Control, Digital Twin', 'Factory simulation, robotics showcase', 14, 110000.00, 'medium', 'Strong in manufacturing vertical'),
    (10, 'WebTech Global', 'Pavilion 2-60', '10x15', 'Web Platform, API Gateway, Developer Tools', 'Code challenges, open source contributions', 6, 35000.00, 'low', 'Startup competitor. Limited enterprise presence.'),
    (11, 'RetailGenius', 'Javits J-200', '20x20', 'POS System, Inventory AI, Customer Analytics', 'Live retail demos, pop-up store concept', 10, 70000.00, 'medium', 'Growing fast in retail vertical'),
    (13, 'HealthData Corp', 'Orange O-400', '15x20', 'EHR Integration, Telehealth, Clinical Analytics', 'Patient outcome demos, compliance workshops', 8, 55000.00, 'medium', 'HIPAA-certified. Government contracts.'),
    (14, 'CyberGuard Pro', 'MB-500', '15x15', 'Endpoint Protection, Zero Trust, Cloud Security', 'Red team demonstrations, capture the flag', 7, 48000.00, 'medium', 'Niche player but growing rapidly'),
    (1, 'DataFirst Analytics', 'Main Hall B-300', '10x10', 'Business Intelligence, Data Warehouse, ML Platform', 'Data visualization showcase, free tier signup', 5, 30000.00, 'low', 'Small competitor in analytics space'),
    (5, 'MediaStream Co', 'Central C-600', '15x20', 'Streaming Platform, Content Delivery, Encoding', 'Live streaming demos, content creator partnerships', 9, 65000.00, 'medium', 'Competitor in media technology'),
    (2, 'ConnectPlus Asia', 'Hall 5-800', '10x15', 'Connectivity Platform, 5G Management, Network AI', 'Partner ecosystem demos, joint showcases', 6, 40000.00, 'low', 'Regional player expanding globally'),
    (4, 'ThreatBlock Inc', 'South S-750', '10x10', 'Firewall, IDS/IPS, Threat Hunting', 'Attack simulation, threat briefings', 4, 25000.00, 'low', 'Legacy product. Declining market share.'),
    (15, 'GartnerCompete', 'Disney D-100', '20x20', 'IT Service Management, Digital Workplace, Governance', 'Analyst presentations, maturity assessments', 10, 80000.00, 'medium', 'Well-positioned with analyst community')
  `);

  // Seed followups (16 items)
  await pool.query(`
    INSERT INTO followups (event_id, contact_name, company, email, followup_type, priority, due_date, assigned_to, notes, status) VALUES
    (6, 'Jennifer Adams', 'TechCorp Industries', 'jadams@techcorp.com', 'Demo Scheduling', 'high', '2025-05-05', 'Sarah Johnson', 'Schedule enterprise platform demo. She needs IT director present.', 'in-progress'),
    (7, 'Robert Kim', 'CloudFirst Solutions', 'rkim@cloudfirst.io', 'Proposal', 'critical', '2025-04-20', 'David Kim', 'Send upsell proposal for additional 500 seats.', 'pending'),
    (8, 'Maria Garcia', 'DataStream Analytics', 'mgarcia@datastream.com', 'Email Follow-up', 'medium', '2025-12-15', 'Emily Watson', 'Send product comparison and pricing details.', 'completed'),
    (9, 'David Wilson', 'Quantum Dynamics', 'dwilson@quantumd.com', 'Executive Meeting', 'critical', '2025-10-01', 'Ryan O''Brien', 'Arrange CEO-to-CEO meeting. Board presentation needed.', 'in-progress'),
    (10, 'James Brown', 'European Tech AG', 'jbrown@eurotech.de', 'Partnership Proposal', 'high', '2025-12-01', 'Carlos Mendez', 'Draft EMEA partnership proposal with revenue sharing model.', 'pending'),
    (6, 'Anna Kowalski', 'ManufacturePro GmbH', 'akowalski@mpro.de', 'Technical Assessment', 'high', '2025-05-10', 'Mike Chen', 'Send technical requirements questionnaire for automation integration.', 'pending'),
    (9, 'Raj Patel', 'TechVentures India', 'rpatel@techventures.in', 'Partnership Discussion', 'medium', '2025-10-15', 'David Kim', 'Discuss APAC distribution partnership terms.', 'pending'),
    (15, 'Patricia Martinez', 'Innovate Health', 'pmartinez@innovhealth.com', 'Compliance Review', 'high', '2025-11-10', 'Dr. Susan Park', 'Review HIPAA compliance requirements and send documentation.', 'in-progress'),
    (8, 'Lisa Thompson', 'NexGen Software', 'lthompson@nexgen.dev', 'Competitive Analysis', 'medium', '2025-12-20', 'Emily Watson', 'Prepare competitive comparison document.', 'pending'),
    (16, 'Sophie Laurent', 'Creative Agency Paris', 'slaurent@creativeparis.fr', 'Product Demo', 'low', '2025-11-01', 'Tom Bradley', 'Schedule virtual demo of design tools integration.', 'completed'),
    (7, 'Thomas Anderson', 'Matrix Systems', 'tanderson@matrix.io', 'Technical POC', 'high', '2025-04-25', 'Laura Stevens', 'Set up proof of concept environment for evaluation.', 'in-progress'),
    (10, 'Emma Johansson', 'Nordic Digital AS', 'ejohansson@nordicdig.no', 'Proposal', 'high', '2025-12-05', 'Carlos Mendez', 'Send Scandinavian market expansion proposal with local support plan.', 'pending'),
    (9, 'Chen Wei', 'Pacific Rim Trading', 'cwei@pacrim.com', 'Nurture Email', 'low', '2025-11-30', 'Mark Thompson', 'Add to newsletter list and send quarterly industry reports.', 'pending'),
    (6, 'Karen Mueller', 'AutoTech Bavaria', 'kmueller@autotech.de', 'Technical Workshop', 'high', '2025-05-15', 'Mike Chen', 'Organize on-site technical workshop at their Munich facility.', 'pending'),
    (15, 'John Baker', 'Summit Consulting', 'jbaker@summitconsult.com', 'Channel Partner', 'medium', '2025-11-20', 'Ryan O''Brien', 'Draft channel partner agreement and commission structure.', 'pending'),
    (7, 'Yuki Tanaka', 'Tokyo Digital Corp', 'ytanaka@tokyodigital.jp', 'Market Entry Support', 'medium', '2025-05-30', 'David Kim', 'Provide Japanese market entry analysis and localization roadmap.', 'pending')
  `);

  // Seed budgets (16 items)
  await pool.query(`
    INSERT INTO budgets (event_id, category, planned_amount, actual_amount, variance_notes, fiscal_year, quarter, approval_status) VALUES
    (1, 'Booth & Space', 60000.00, 60000.00, 'On budget', 2026, 'Q1', 'approved'),
    (1, 'Travel & Accommodation', 25000.00, 22500.00, 'Under budget - negotiated group hotel rate', 2026, 'Q1', 'approved'),
    (1, 'Marketing Materials', 15000.00, 14750.00, 'Slight savings on print run', 2026, 'Q1', 'approved'),
    (1, 'Catering & Entertainment', 8000.00, 0.00, 'Pending event', 2026, 'Q1', 'approved'),
    (2, 'Booth & Space', 44000.00, 44000.00, 'On budget', 2026, 'Q1', 'approved'),
    (2, 'Travel & Accommodation', 42000.00, 40100.00, 'Under budget on flights', 2026, 'Q1', 'approved'),
    (3, 'Registration & Fees', 6000.00, 5180.00, 'Early bird discount applied', 2026, 'Q1', 'approved'),
    (4, 'Booth & Space', 46000.00, 46000.00, 'On budget', 2026, 'Q2', 'approved'),
    (4, 'Security Demo Equipment', 12000.00, 0.00, 'Pending procurement', 2026, 'Q2', 'pending'),
    (8, 'Total Event Budget', 180000.00, 175000.00, 'Saved on AV equipment rental', 2025, 'Q4', 'approved'),
    (9, 'Total Event Budget', 140000.00, 142500.00, 'Slight overage on last-minute sponsorship add-on', 2025, 'Q3', 'approved'),
    (11, 'Booth & Space', 27000.00, 0.00, 'Pending vendor confirmation', 2026, 'Q1', 'pending'),
    (13, 'Total Event Budget', 55000.00, 0.00, 'Budget allocated, pending approval', 2026, 'Q1', 'draft'),
    (14, 'Total Event Budget', 48000.00, 0.00, 'Security event budget', 2026, 'Q3', 'draft'),
    (5, 'AV & Technology', 15000.00, 9500.00, 'Partial spend - additional items pending', 2026, 'Q2', 'approved'),
    (12, 'Total Event Budget', 35000.00, 0.00, 'First-time attendance', 2026, 'Q2', 'pending')
  `);

  console.log('Database seeded successfully!');
  await pool.end();
}

seed().catch(err => {
  console.error('Seed error:', err);
  process.exit(1);
});
