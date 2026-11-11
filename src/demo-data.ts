/**
 * CIVITAS ESTATE & MAINTENANCE
 * Fully Reconciled Demo Dataset for Testing and Verification
 * Faithfully mirrors the scenarios in the Civitas reference model.
 */

import type { OpsDatabaseState } from './store.ts';
import {
  DEFAULT_SETTINGS,
  DEFAULT_SERVICES,
  DEFAULT_FUNDING,
  DEFAULT_GRANT_BUDGET,
  DEFAULT_COMPLIANCE_PROMPTS,
  DEFAULT_USERS
} from './seed.ts';

export function createDemoState(): OpsDatabaseState {
  return {
    settings: {
      ...DEFAULT_SETTINGS,
      reportDateOverride: '2026-11-07',
      reportingYear: 2026,
      openingCashBalance: 4500,
      minimumCashReserve: 2000
    },

    services: [...DEFAULT_SERVICES],

    customers: [
      {
        customerId: 'C0001',
        customerName: 'Kofi Mensah',
        category: 'Homeowner',
        phone: '+233 24 111 2233',
        email: 'kofi.mensah@gmail.com',
        preferredChannel: 'WhatsApp',
        area: 'East Legon',
        leadSource: 'WhatsApp',
        dateAcquired: '2026-03-10',
        relationshipOwner: 'Isaac Agya Koomson',
        consentRecorded: 'Yes',
        closed: 'No',
        nextFollowUp: '2026-11-20',
        feedbackNotes: 'Very satisfied with deep cleaning; interested in monthly care.'
      },
      {
        customerId: 'C0002',
        customerName: 'Abena Osei',
        category: 'Landlord',
        phone: '+233 20 444 5566',
        email: 'abena.osei@propertygh.com',
        preferredChannel: 'Telephone',
        area: 'Spintex',
        leadSource: 'Referral',
        dateAcquired: '2026-04-15',
        relationshipOwner: 'Operations Coordinator',
        consentRecorded: 'Yes',
        closed: 'No',
        feedbackNotes: 'Manages 3 residential rental units on Spintex Road.'
      },
      {
        customerId: 'C0003',
        customerName: 'Kwame Boateng',
        category: 'Diaspora owner',
        phone: '+44 7700 900123',
        email: 'k.boateng@londonlaw.co.uk',
        preferredChannel: 'WhatsApp',
        area: 'Adenta',
        leadSource: 'Website',
        dateAcquired: '2026-06-01',
        relationshipOwner: 'Isaac Agya Koomson',
        consentRecorded: 'Yes',
        closed: 'No',
        feedbackNotes: 'Based in UK; needs scheduled Property Watch inspections.'
      },
      {
        customerId: 'C0004',
        customerName: 'Akua Darko',
        category: 'Short-let operator',
        phone: '+233 55 777 8899',
        email: 'akua@accrastays.com',
        preferredChannel: 'WhatsApp',
        area: 'Tema Community 25',
        leadSource: 'Social media',
        dateAcquired: '2026-07-20',
        relationshipOwner: 'Operations Coordinator',
        consentRecorded: 'Yes',
        closed: 'No',
        feedbackNotes: 'Runs Airbnb apartments in Tema Community 25.'
      },
      {
        customerId: 'C0005',
        customerName: 'Apex Logistics Ghana',
        category: 'Small business',
        phone: '+233 30 222 3344',
        email: 'facilities@apexlogistics.com.gh',
        preferredChannel: 'Email',
        area: 'Other Tema',
        leadSource: 'Direct outreach',
        dateAcquired: '2026-08-05',
        relationshipOwner: 'Isaac Agya Koomson',
        consentRecorded: 'Yes',
        closed: 'No',
        feedbackNotes: 'Office and warehouse facility cleaning contract.'
      }
    ],

    properties: [
      {
        propertyId: 'P0001',
        customerId: 'C0001',
        propertyType: 'House',
        addressOrDescription: '42 Boundary Road, East Legon',
        area: 'East Legon',
        propertyUse: 'Owner-occupied',
        units: 1,
        maintenanceRequirements: 'High-gloss tiled floors; AC maintenance required quarterly.',
        accessInstructions: 'Caretaker Kwesi holds keys on site.',
        nextInspectionDate: '2026-12-15',
        active: 'Yes'
      },
      {
        propertyId: 'P0002',
        customerId: 'C0002',
        propertyType: 'Apartment',
        addressOrDescription: 'Block C, Coastal Villa Estates, Spintex Road',
        area: 'Spintex',
        propertyUse: 'Rented out',
        units: 2,
        maintenanceRequirements: 'Water pump inspection and plumbing maintenance.',
        accessInstructions: 'Call tenant 24 hours in advance.',
        nextInspectionDate: '2026-11-25',
        active: 'Yes'
      },
      {
        propertyId: 'P0003',
        customerId: 'C0003',
        propertyType: 'House',
        addressOrDescription: 'Plot 18, Frafraha Hills, Adenta',
        area: 'Adenta',
        propertyUse: 'Vacant',
        units: 1,
        maintenanceRequirements: 'Perimeter wall check, roof leak inspections before rainy season.',
        accessInstructions: 'Key with neighbour Mr. Addo (024 333 4455).',
        nextInspectionDate: '2026-11-15',
        active: 'Yes'
      },
      {
        propertyId: 'P0004',
        customerId: 'C0004',
        propertyType: 'Short-let unit',
        addressOrDescription: 'Devtraco Courts, Unit 12B, Tema Community 25',
        area: 'Tema Community 25',
        propertyUse: 'Short-let',
        units: 1,
        maintenanceRequirements: 'Rapid turnaround cleaning between guest check-ins.',
        accessInstructions: 'Smart lock code provided per booking.',
        nextInspectionDate: '2026-12-01',
        active: 'Yes'
      }
    ],

    enquiries: [
      {
        enquiryId: 'E0001',
        enquiryDate: '2026-03-05',
        contactName: 'Kofi Mensah',
        phone: '+233 24 111 2233',
        customerId: 'C0001',
        leadSource: 'WhatsApp',
        serviceInterest: 'Deep cleaning',
        area: 'East Legon',
        stage: 'Accepted',
        qualified: 'Yes',
        quoteId: 'Q0001',
        owner: 'Isaac Agya Koomson',
        notes: 'Requested deep clean for 3-bedroom house.'
      },
      {
        enquiryId: 'E0002',
        enquiryDate: '2026-04-10',
        contactName: 'Abena Osei',
        phone: '+233 20 444 5566',
        customerId: 'C0002',
        leadSource: 'Referral',
        serviceInterest: 'Apartment turnaround',
        area: 'Spintex',
        stage: 'Accepted',
        qualified: 'Yes',
        quoteId: 'Q0002',
        owner: 'Operations Coordinator'
      },
      {
        enquiryId: 'E0003',
        enquiryDate: '2026-05-25',
        contactName: 'Kwame Boateng',
        phone: '+44 7700 900123',
        customerId: 'C0003',
        leadSource: 'Website',
        serviceInterest: 'Property Watch',
        area: 'Adenta',
        stage: 'Accepted',
        qualified: 'Yes',
        quoteId: 'Q0003',
        owner: 'Isaac Agya Koomson'
      },
      {
        enquiryId: 'E0004',
        enquiryDate: '2026-10-15',
        contactName: 'Dr. Edward Annan',
        phone: '+233 24 999 0011',
        leadSource: 'Google',
        serviceInterest: 'Plumbing repairs',
        area: 'East Legon',
        stage: 'Quotation Sent',
        qualified: 'Yes',
        quoteId: 'Q0004',
        owner: 'Operations Coordinator',
        notes: 'Water heater replacement and pipe realignment.'
      },
      {
        enquiryId: 'E0005',
        enquiryDate: '2026-10-28',
        contactName: 'Grace Cudjoe',
        phone: '+233 27 555 4433',
        leadSource: 'Flyer',
        serviceInterest: 'Post-construction cleaning',
        area: 'Other Accra',
        stage: 'Declined',
        qualified: 'No',
        lostReason: 'Price',
        owner: 'Operations Coordinator',
        notes: 'Client felt 1,700 cedis was above their budget.'
      }
    ],

    quotes: [
      {
        quoteId: 'Q0001',
        quoteDate: '2026-03-07',
        customerId: 'C0001',
        propertyId: 'P0001',
        enquiryId: 'E0001',
        preparedBy: 'Isaac Agya Koomson',
        status: 'Accepted',
        discountAmount: 0,
        discountApproval: 'Not required',
        acceptedDate: '2026-03-08',
        notes: 'Full residential deep clean.'
      },
      {
        quoteId: 'Q0002',
        quoteDate: '2026-04-12',
        customerId: 'C0002',
        propertyId: 'P0002',
        enquiryId: 'E0002',
        preparedBy: 'Operations Coordinator',
        status: 'Accepted',
        discountAmount: 0,
        discountApproval: 'Not required',
        acceptedDate: '2026-04-13'
      },
      {
        quoteId: 'Q0003',
        quoteDate: '2026-05-28',
        customerId: 'C0003',
        propertyId: 'P0003',
        enquiryId: 'E0003',
        preparedBy: 'Isaac Agya Koomson',
        status: 'Accepted',
        discountAmount: 0,
        discountApproval: 'Not required',
        acceptedDate: '2026-05-30'
      },
      {
        quoteId: 'Q0004',
        quoteDate: '2026-10-18',
        customerId: 'C0001',
        propertyId: 'P0001',
        enquiryId: 'E0004',
        preparedBy: 'Operations Coordinator',
        status: 'Sent',
        discountAmount: 20,
        discountApproval: 'Approved',
        notes: 'Includes loyalty discount.'
      }
    ],

    quoteLines: [
      { quoteId: 'Q0001', serviceId: 'S03', customDescription: 'Small residential deep cleaning (3 bathrooms, kitchen degreasing)', quantity: 1 },
      { quoteId: 'Q0002', serviceId: 'S02', customDescription: '2-3 bedroom cleaning for tenant move-in', quantity: 1 },
      { quoteId: 'Q0003', serviceId: 'S16', customDescription: 'Initial comprehensive property condition inspection', quantity: 1 },
      { quoteId: 'Q0004', serviceId: 'S10', customDescription: 'Minor plumbing repairs (leak fixes and valve replacement)', quantity: 1 }
    ],

    jobs: [
      {
        jobId: 'J0001',
        quoteId: 'Q0001',
        customerId: 'C0001',
        propertyId: 'P0001',
        serviceId: 'S03',
        description: 'Comprehensive deep cleaning of 3-bedroom residence',
        requestDate: '2026-03-08',
        scheduledDate: '2026-03-12',
        dueDate: '2026-03-12',
        status: 'Closed',
        estimatedLabour: 250,
        estimatedMaterials: 100,
        estimatedTransport: 50,
        completionDate: '2026-03-12',
        qualityResult: 'Pass',
        evidenceReference: 'CIV-DOC-2026-J0001-PHOTOS',
        customerRating: 5,
        reworkOrComplaint: 'No'
      },
      {
        jobId: 'J0002',
        quoteId: 'Q0002',
        customerId: 'C0002',
        propertyId: 'P0002',
        serviceId: 'S02',
        description: 'Apartment turnaround cleaning before tenant handover',
        requestDate: '2026-04-14',
        scheduledDate: '2026-04-18',
        dueDate: '2026-04-18',
        status: 'Closed',
        estimatedLabour: 180,
        estimatedMaterials: 70,
        estimatedTransport: 30,
        completionDate: '2026-04-18',
        qualityResult: 'Pass',
        evidenceReference: 'CIV-DOC-2026-J0002-PHOTOS',
        customerRating: 5,
        reworkOrComplaint: 'No'
      },
      {
        jobId: 'J0003',
        quoteId: 'Q0003',
        customerId: 'C0003',
        propertyId: 'P0003',
        serviceId: 'S16',
        description: 'Property Watch visual inspection and photographic condition report',
        requestDate: '2026-06-02',
        scheduledDate: '2026-06-05',
        dueDate: '2026-06-05',
        status: 'Invoiced',
        estimatedLabour: 120,
        estimatedMaterials: 0,
        estimatedTransport: 40,
        completionDate: '2026-06-05',
        qualityResult: 'Pass',
        evidenceReference: 'CIV-DOC-2026-IS0001-PHOTOS',
        customerRating: 5,
        reworkOrComplaint: 'No'
      },
      {
        jobId: 'J0004',
        customerId: 'C0004',
        propertyId: 'P0004',
        serviceId: 'S01',
        description: 'Urgent short-let apartment turnaround clean',
        requestDate: '2026-10-25',
        scheduledDate: '2026-10-26',
        dueDate: '2026-10-26',
        status: 'Accepted by customer',
        manualQuotedAmount: 300,
        estimatedLabour: 120,
        estimatedMaterials: 40,
        estimatedTransport: 30,
        completionDate: '2026-10-26',
        qualityResult: 'Pass',
        evidenceReference: 'CIV-DOC-2026-J0004-PHOTOS',
        customerRating: 4,
        reworkOrComplaint: 'No'
      }
    ],

    contractors: [
      {
        contractorId: 'W0001',
        contractorName: 'Emmanuel Tetteh',
        workerType: 'Independent contractor',
        trade: 'Cleaning team leader',
        phone: '+233 24 555 1122',
        coverageArea: 'East Legon',
        skillsAndQualifications: 'Certified deep cleaning & floor care; 5 years experience',
        vettingStatus: 'Verified',
        vettingDate: '2026-02-01',
        trainingStatus: 'Fully trained',
        safetyOrientationDate: '2026-02-05',
        agreedRate: 150,
        rateBasis: 'Per day',
        startDate: '2026-02-10',
        status: 'Active'
      },
      {
        contractorId: 'W0002',
        contractorName: 'Samuel Mensah',
        workerType: 'Independent contractor',
        trade: 'Plumber',
        phone: '+233 20 888 9900',
        coverageArea: 'Spintex',
        skillsAndQualifications: 'Certified residential plumbing, leak detection and pressure piping',
        vettingStatus: 'Verified',
        vettingDate: '2026-02-15',
        trainingStatus: 'Skills verified',
        safetyOrientationDate: '2026-02-18',
        agreedRate: 180,
        rateBasis: 'Per assignment',
        startDate: '2026-02-20',
        status: 'Active'
      },
      {
        contractorId: 'W0003',
        contractorName: 'David Quaye',
        workerType: 'Independent contractor',
        trade: 'Property inspector',
        phone: '+233 54 333 7788',
        coverageArea: 'Adenta',
        skillsAndQualifications: 'Building inspection, visual reporting and damp assessment',
        vettingStatus: 'Verified',
        vettingDate: '2026-03-01',
        trainingStatus: 'Fully trained',
        safetyOrientationDate: '2026-03-05',
        agreedRate: 120,
        rateBasis: 'Per assignment',
        startDate: '2026-03-10',
        status: 'Active'
      },
      {
        contractorId: 'W0004',
        contractorName: 'Grace Arthur',
        workerType: 'Salaried employee',
        trade: 'Administrative secretary',
        phone: '+233 24 000 1199',
        vettingStatus: 'Verified',
        vettingDate: '2026-01-15',
        trainingStatus: 'Fully trained',
        safetyOrientationDate: '2026-01-20',
        startDate: '2026-02-01',
        status: 'Active'
      }
    ],

    assignments: [
      {
        assignmentId: 'A0001',
        jobId: 'J0001',
        contractorId: 'W0001',
        assignmentDate: '2026-03-12',
        payBasis: 'Per day',
        quantity: 1,
        rate: 150,
        paymentStatus: 'Paid',
        paidDate: '2026-03-13',
        paymentMethod: 'Mobile money',
        paymentReference: 'MM-A0001-20260313',
        rating: 5,
        notes: 'Excellent teamwork and thorough degreasing.'
      },
      {
        assignmentId: 'A0002',
        jobId: 'J0002',
        contractorId: 'W0001',
        assignmentDate: '2026-04-18',
        payBasis: 'Per day',
        quantity: 1,
        rate: 150,
        paymentStatus: 'Paid',
        paidDate: '2026-04-19',
        paymentMethod: 'Mobile money',
        paymentReference: 'MM-A0002-20260419',
        rating: 5
      },
      {
        assignmentId: 'A0003',
        jobId: 'J0003',
        contractorId: 'W0003',
        assignmentDate: '2026-06-05',
        payBasis: 'Per assignment',
        quantity: 1,
        rate: 120,
        paymentStatus: 'Paid',
        paidDate: '2026-06-06',
        paymentMethod: 'Mobile money',
        paymentReference: 'MM-A0003-20260606',
        rating: 5,
        notes: 'Detailed photographic inspection completed on schedule.'
      },
      {
        assignmentId: 'A0004',
        jobId: 'J0004',
        contractorId: 'W0001',
        assignmentDate: '2026-10-26',
        payBasis: 'Per day',
        quantity: 1,
        rate: 120,
        paymentStatus: 'Unpaid',
        rating: 4
      }
    ],

    invoices: [
      {
        invoiceNo: 'INV0001',
        customerId: 'C0001',
        jobId: 'J0001',
        invoiceDate: '2026-03-12',
        termsDays: 7,
        amountBeforeTax: 650,
        cancelled: 'No',
        notes: 'Deep cleaning invoice'
      },
      {
        invoiceNo: 'INV0002',
        customerId: 'C0002',
        jobId: 'J0002',
        invoiceDate: '2026-04-18',
        termsDays: 7,
        amountBeforeTax: 450,
        cancelled: 'No',
        notes: 'Apartment turnaround clean'
      },
      {
        invoiceNo: 'INV0003',
        customerId: 'C0003',
        jobId: 'J0003',
        invoiceDate: '2026-06-05',
        termsDays: 7,
        amountBeforeTax: 280,
        cancelled: 'No',
        notes: 'Property Watch inspection report'
      }
    ],

    payments: [
      {
        paymentId: 'PAY0001',
        paymentDate: '2026-03-13',
        invoiceNo: 'INV0001',
        amount: 650,
        method: 'Mobile money',
        reference: 'MTN-PAY-20260313-01',
        receivedBy: 'Isaac Agya Koomson',
        reconciliationStatus: 'Reconciled',
        reconciledDate: '2026-03-31'
      },
      {
        paymentId: 'PAY0002',
        paymentDate: '2026-04-20',
        invoiceNo: 'INV0002',
        amount: 450,
        method: 'Mobile money',
        reference: 'MTN-PAY-20260420-02',
        receivedBy: 'Operations Coordinator',
        reconciliationStatus: 'Reconciled',
        reconciledDate: '2026-04-30'
      },
      {
        paymentId: 'PAY0003',
        paymentDate: '2026-06-07',
        invoiceNo: 'INV0003',
        amount: 280,
        method: 'Bank transfer',
        reference: 'GTB-TRF-20260607-03',
        receivedBy: 'Isaac Agya Koomson',
        reconciliationStatus: 'Reconciled',
        reconciledDate: '2026-06-30'
      }
    ],

    expenses: [
      {
        expenseId: 'EXP0001',
        expenseDate: '2026-03-11',
        supplier: 'CleanPro Supplies Accra',
        supplierReference: 'INV-CP-8921',
        category: 'Direct materials',
        division: 'Civitas Fix',
        jobId: 'J0001',
        amount: 85,
        paymentMethod: 'Mobile money',
        paymentStatus: 'Paid',
        approvalStatus: 'Approved',
        approvedBy: 'Isaac Agya Koomson',
        evidenceReference: 'REC-EXP0001-CLEANPRO',
        fundingSource: 'Operations (customer receipts)'
      },
      {
        expenseId: 'EXP0002',
        expenseDate: '2026-03-12',
        supplier: 'Local Ride Transport',
        supplierReference: 'TR-RIDE-104',
        category: 'Direct transport',
        division: 'Civitas Fix',
        jobId: 'J0001',
        amount: 40,
        paymentMethod: 'Cash',
        paymentStatus: 'Paid',
        approvalStatus: 'Approved',
        approvedBy: 'Isaac Agya Koomson',
        evidenceReference: 'REC-EXP0002-TRANSPORT',
        fundingSource: 'Operations (customer receipts)'
      },
      {
        expenseId: 'EXP0003',
        expenseDate: '2026-02-15',
        supplier: 'Ghana Tools & Machinery Ltd',
        supplierReference: 'GTM-INV-4412',
        category: 'Equipment (capital)',
        division: 'Shared overhead',
        amount: 2200,
        paymentMethod: 'Bank transfer',
        paymentStatus: 'Paid',
        approvalStatus: 'Approved',
        approvedBy: 'Isaac Agya Koomson',
        evidenceReference: 'REC-EXP0003-ASSET',
        fundingSource: 'Own funds',
        notes: 'Commercial wet & dry industrial vacuum cleaner'
      },
      {
        expenseId: 'EXP0004',
        expenseDate: '2026-03-31',
        supplier: 'Administrative Secretary Salary',
        category: 'Salaries and employer pension',
        division: 'Shared overhead',
        amount: 800,
        paymentMethod: 'Mobile money',
        paymentStatus: 'Paid',
        approvalStatus: 'Approved',
        approvedBy: 'Isaac Agya Koomson',
        evidenceReference: 'REC-PAYROLL-202603',
        fundingSource: 'Own funds'
      }
    ],

    budget: [
      { month: '2026-03-01', budgetCategory: 'Field labour (assignments)', amount: 600 },
      { month: '2026-03-01', budgetCategory: 'Direct materials', amount: 300 },
      { month: '2026-03-01', budgetCategory: 'Direct transport', amount: 150 },
      { month: '2026-03-01', budgetCategory: 'Marketing and customer acquisition', amount: 400 },
      { month: '2026-03-01', budgetCategory: 'Salaries and employer pension', amount: 800 }
    ],

    funding: [
      {
        fundingId: 'F0001',
        source: 'NEIP funding',
        description: 'Funding request (staged, 80,000 cedis)',
        status: 'Requested',
        amountRequested: 80000,
        amountApproved: 0,
        amountReceived: 0,
        reportingConditions: 'To be supplied by NEIP'
      },
      {
        fundingId: 'F0002',
        source: 'Founder capital',
        description: 'Pre-funding capital for preparation and the pilot',
        status: 'Not secured',
        amountRequested: 18000,
        amountApproved: 0,
        amountReceived: 0,
        notes: 'Required, not secured'
      }
    ],

    grantBudget: [...DEFAULT_GRANT_BUDGET],

    commitments: [],

    purchaseRequests: [
      {
        requestId: 'PR0001',
        requestDate: '2026-02-10',
        requestedBy: 'Isaac Agya Koomson',
        item: 'Commercial Industrial Vacuum & Carpet Extractor',
        expenseCategory: 'Equipment (capital)',
        estimatedAmount: 2200,
        quotesObtained: 2,
        supplierChosen: 'Ghana Tools & Machinery Ltd',
        approvalStatus: 'Approved',
        approvedBy: 'Isaac Agya Koomson',
        approvalDate: '2026-02-12'
      }
    ],

    assets: [
      {
        assetId: 'AS0001',
        description: 'Karcher Industrial Wet & Dry Extractor Vacuum',
        assetCategory: 'Cleaning equipment',
        purchaseDate: '2026-02-15',
        supplier: 'Ghana Tools & Machinery Ltd',
        purchaseCost: 2200,
        expenseId: 'EXP0003',
        fundingSource: 'Own funds',
        serialNumber: 'KRC-WD-88912',
        custodian: 'Emmanuel Tetteh',
        location: 'Equipment Storage Lockup, East Legon',
        condition: 'Good',
        warrantyExpiry: '2028-02-15',
        depreciationMethod: 'Straight-line',
        usefulLifeYears: 4,
        residualValue: 200,
        status: 'In use'
      }
    ],

    maintenance: [
      {
        logId: 'MT0001',
        assetId: 'AS0001',
        maintenanceDate: '2026-08-15',
        type: 'Service',
        description: 'Filter replacement, motor seal check, and suction performance test',
        cost: 60,
        performedBy: 'Certified Karcher Technician',
        nextDueDate: '2027-02-15'
      }
    ],

    boardMeetings: [
      {
        meetingId: 'BM0001',
        meetingDate: '2026-02-28',
        meetingType: 'Regular',
        membersInvited: 3,
        membersPresent: 3,
        chair: 'Advisory Board Chair',
        minutesReference: 'DOC-MINUTES-BM0001',
        nextMeetingDate: '2026-05-30',
        notes: 'First advisory session: reviewed pilot pricing and risk mitigations.'
      }
    ],

    advice: [
      {
        recId: 'AD0001',
        meetingId: 'BM0001',
        recommendationDate: '2026-02-28',
        topic: 'Finance',
        recommendation: 'Ensure all equipment purchases above 500 cedis obtain at least two quotations.',
        advisor: 'Finance Advisor',
        managementResponse: 'Accepted',
        responseDate: '2026-03-02',
        decisionId: 'DC0001',
        actionId: 'AC0001',
        owner: 'Isaac Agya Koomson',
        dueDate: '2026-03-15',
        status: 'Done',
        doneDate: '2026-03-10'
      }
    ],

    decisions: [
      {
        decisionId: 'DC0001',
        decisionDate: '2026-03-02',
        decision: 'Mandatory two-quote threshold adopted for all equipment exceeding 500 cedis.',
        decidedBy: 'Isaac Agya Koomson',
        relatedRecommendation: 'AD0001',
        rationale: 'Align with NEIP procurement rules and preserve capital discipline.',
        reviewDate: '2027-03-02',
        status: 'In force'
      }
    ],

    actions: [
      {
        actionId: 'AC0001',
        sourceType: 'Board recommendation',
        sourceId: 'AD0001',
        description: 'Configure purchase request threshold and quote verification in ops manual.',
        owner: 'Isaac Agya Koomson',
        raisedDate: '2026-03-02',
        deadline: '2026-03-15',
        status: 'Done',
        completedDate: '2026-03-10',
        evidenceReference: 'OPS-MANUAL-SEC-5'
      }
    ],

    risks: [
      {
        riskId: 'RK0001',
        riskDescription: 'Fuel and transport price volatility impacting mobile team margins.',
        category: 'Financial',
        probability: 3,
        impact: 3,
        mitigation: 'Group cleaning appointments geographically by cluster (East Legon on Mon/Thu, Spintex on Tue/Fri).',
        owner: 'Operations Coordinator',
        nextReviewDate: '2026-12-01',
        status: 'Open'
      },
      {
        riskId: 'RK0002',
        riskDescription: 'Delays in receiving NEIP grant disbursement.',
        category: 'Strategic',
        probability: 4,
        impact: 4,
        mitigation: 'Operate strictly on self-funded lean cash flow; do not commit grant expenditure ahead of cash receipt.',
        owner: 'Isaac Agya Koomson',
        nextReviewDate: '2026-11-30',
        status: 'Open'
      }
    ],

    compliance: [...DEFAULT_COMPLIANCE_PROMPTS],

    incidents: [],

    reconciliations: [
      {
        reconId: 'RC0001',
        monthEnd: '2026-03-31',
        account: 'Mobile money',
        statementBalance: 5100,
        bookBalance: 5100,
        reconcilingItems: 'Reconciled to MTN Business statement balance.',
        preparedBy: 'Operations Coordinator',
        reviewedBy: 'Isaac Agya Koomson',
        reviewDate: '2026-04-02'
      }
    ],

    periodClose: [
      {
        month: '2026-03-01',
        status: 'Closed',
        closedBy: 'Isaac Agya Koomson',
        closedDate: '2026-04-05',
        invoicesAtClose: 1,
        paymentsAtClose: 1,
        expensesAtClose: 3,
        assignmentsAtClose: 1,
        openCheckItemsAtClose: 2
      }
    ],

    inspections: [
      {
        inspectionId: 'IS0001',
        propertyId: 'P0003',
        inspectionDate: '2026-06-05',
        inspector: 'W0003',
        inspectionType: 'Scheduled Property Watch',
        jobId: 'J0003',
        roofAndCeiling: 'Good',
        plumbing: 'Good',
        electrical: 'Good',
        doorsLocksWindows: 'Good',
        dampAndPests: 'Fair',
        compoundAndExterior: 'Fair',
        observations: 'Minor weeds in compound paving; slight surface damp on exterior boundary wall from recent rain.',
        recommendations: 'Compound sweep and application of weed deterrent; check perimeter drainage slope.',
        photosFolderReference: 'CIV-PHOTOS-P0003-20260605',
        reportStatus: 'Issued',
        nextInspectionDue: '2026-11-15'
      }
    ],

    users: [...DEFAULT_USERS],

    auditLogs: [
      {
        id: 'AUD-003',
        timestamp: '2026-10-15T14:20:00Z',
        action: 'APPROVE',
        entity: 'Expense',
        entityId: 'EXP0004',
        actor: 'Isaac Agya Koomson (Founder / CEO)',
        details: 'Approved equipment expenditure above GH₵500 threshold'
      },
      {
        id: 'AUD-002',
        timestamp: '2026-04-02T18:00:00Z',
        action: 'CLOSE_PERIOD',
        entity: 'PeriodClose',
        entityId: '2026-03-01',
        actor: 'Isaac Agya Koomson (Founder / CEO)',
        details: 'Closed March 2026 accounting period'
      },
      {
        id: 'AUD-001',
        timestamp: '2026-03-12T10:00:00Z',
        action: 'CREATE',
        entity: 'Job',
        entityId: 'J0001',
        actor: 'Ama Osei (Operations Coordinator)',
        details: 'Created deep cleaning job'
      }
    ]
  };
}
