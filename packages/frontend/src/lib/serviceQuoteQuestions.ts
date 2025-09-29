export interface ServiceQuoteCategory {
  key: string;
  label: string;
  questions: string[];
  exampleAnswers?: string[]; // For E2E testing - example answers for each question
}

export interface GenericQuestion {
  key: string;
  question: string;
  choices?: string[];
  textarea?: boolean;
  exampleAnswer?: string; // For E2E testing - shows expected answer format
}

export const GENERIC_QUESTIONS: GenericQuestion[] = [
  {
    key: 'property_type',
    question: 'What type of property is this service for?',
    choices: ['Residential', 'Apartment', 'Commercial', 'Other'],
    exampleAnswer: 'Residential' // Button selection
  },
  {
    key: 'is_homeowner',
    question: 'Do you own this property?',
    choices: ['Yes', 'No'],
    exampleAnswer: 'Yes' // Button selection
  },
  {
    key: 'preferred_timing',
    question: 'When would you like this service to be scheduled?',
    exampleAnswer: 'This week' // Text input
  },
];

export const SERVICE_QUOTE_CATEGORIES: ServiceQuoteCategory[] = [
  {
    key: "bathroom_reno",
    label: "Bathroom Renovation",
    questions: [
      "Are you changing the plumbing layout (e.g., moving the toilet, sink, or shower location)?",
      "Are you replacing the main shower/tub valve that is inside the wall?",
      "What specific fixtures does the homeowner plan to use, or would they like options/recommendations?",
      "Will any additional renovations be happening simultaneously that might affect the plumbing work?",
      "Are there any known issues with the existing plumbing that might complicate the renovation process?"
    ],
    exampleAnswers: [
      "Yes, moving the toilet 6 inches to the left and adding a new shower stall",
      "Yes, the old valve is corroded and needs replacement",
      "Kohler Memoirs toilet, Delta shower fixtures, and a vessel sink basin",
      "Yes, tile work and electrical updates happening at the same time",
      "The existing pipes are galvanized steel and may need upgrading to PEX"
    ]
  },
  {
    key: "perimeter_drains",
    label: "Perimeter Drains",
    questions: [
      "Have you experienced flooding or pooling water near the foundation?",
      "What is the ground surface around the foundation (e.g., grass, concrete patio, garden beds)?",
      "Do you have a sump pump, or does the system drain directly to a city storm connection?",
      "Do you know the approximate age of your property?",
    ],
    exampleAnswers: [
      "Yes, water pools along the foundation after heavy rain",
      "Grass lawn with some concrete walkways",
      "We have a sump pump in the basement that discharges to a dry well",
      "The house was built in 1995"
    ]
  },
  {
    key: "water_heater_install",
    label: "Water Heater Installation",
    questions: [
      "Is the new water heater gas or electric?",
      "Will you be providing the new water heater, or should we include one in the quote?",
      "Is this a replacement for an existing water heater, or a new installation?",
      "What is the size of the new unit (e.g., 40-gallon, 50-gallon tank), if you know?",
      "Where is the installation location, and are there any space or access constraints?"
    ],
    exampleAnswers: [
      "Gas - we have natural gas available",
      "Please include a new water heater in the quote",
      "Replacement for existing unit that's 15 years old",
      "50-gallon tank to serve a family of 4",
      "Garage utility room with good access, about 6 feet of clearance"
    ]
  },
  {
    key: "leak_repair",
    label: "Leak Repair",
    questions: [
      "Where is the leak located (e.g., under a sink, in a wall/ceiling, outside)?",
      "Is water actively leaking right now, and have you been able to shut off the main water valve?",
      "How severe is the leak (e.g., slow drip, steady stream)?",
      "When did you first notice the leak?",
    ],
    exampleAnswers: [
      "Under the kitchen sink, appears to be from the supply line connection",
      "Yes, water is dripping steadily, and I've shut off the valve under the sink",
      "Slow but steady drip, about 1 drop per second",
      "I noticed it yesterday morning when I was doing dishes"
    ]
  },
  {
    key: "fixture_install",
    label: "Fixture Installation",
    questions: [
      "What type of fixture do you need installed (e.g., faucet, toilet, shower head, garburator)?",
      "Do you already have the new fixture and all its parts on-site?",
      "Is this a replacement for an old fixture or a brand new installation?",
      "Is the new fixture the same size and configuration as the old one (e.g., 4-inch vs 8-inch faucet spread)?",
    ],
    exampleAnswers: [
      "Kitchen faucet - single handle with pull-out sprayer",
      "Yes, I purchased a Moen Brantford faucet with all necessary parts",
      "Replacement for an old faucet that's leaking",
      "Same 4-inch centerset configuration as the old one"
    ]
  },
  {
    key: "main_line_repair",
    label: "Main Line (Sewer/Water) Repair",
    questions: [
      "What issues are you experiencing (e.g., slow drains everywhere, water in the yard, backup)?",
      "Where is the main line located on your property (e.g., under the front lawn, in the basement slab, in a crawlspace)?",
      "Do you know the approximate age of your home?",
      "Has the main line been repaired or cleared recently?",
    ],
    exampleAnswers: [
      "Slow drains in all bathrooms and kitchen, sewage backing up into basement floor drain",
      "Under the front lawn, runs from the house to the street",
      "The house was built in 1985",
      "Had a drain cleaning service out 6 months ago but problems returned"
    ]
  },
  {
    key: "emergency_service",
    label: "Emergency Service",
    questions: [
      "Please describe the nature of your plumbing emergency in detail.",
      "Is water currently shut off to the affected area or the whole house?",
      "Is there any risk of significant water damage occurring?",
    ],
    exampleAnswers: [
      "EMERGENCY: Burst pipe flooding the basement!",
      "No",
      "Yes"
    ]
  },
  {
    key: "other",
    label: "Other (Describe Your Request)",
    questions: [
      "Please describe your plumbing request or issue in detail.",
      "Are there any specific requirements or concerns?",
      "When would you like the service performed?"
    ],
    exampleAnswers: [
      "Need help with a custom plumbing installation for a home brewery setup",
      "Must comply with local building codes and health department regulations",
      "As soon as possible, project deadline approaching"
    ]
  }
];