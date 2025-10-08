// THE NEW SINGLE SOURCE OF TRUTH FOR ALL SERVICE DEFINITIONS

export interface ServiceDefinition {
  key: string;
  title: string;
  icon: string;
  description: string;
  features: string[];
  questions: string[];
  exampleAnswers?: string[];
}

export interface GenericQuestion {
  key: string;
  question: string;
  choices?: string[];
  textarea?: boolean;
  exampleAnswer?: string;
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

export const services: ServiceDefinition[] = [
  {
    key: "leak_repair",
    title: "Leak Detection & Repair",
    icon: "Droplets",
    description: "Fast detection and repair of water leaks to prevent damage and save water.",
    features: ["Emergency leak repair", "Pipe inspection", "Slab leak detection"],
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
    key: "pipe_installation",
    title: "Pipe Installation & Repiping",
    icon: "Wrench",
    description: "Professional installation and replacement for new construction or aging systems.",
    features: ["Full home repiping", "New construction plumbing", "System upgrades"],
    questions: [
        "Is this for a new construction, a renovation, or a repair of an existing pipe?",
        "What type of piping material are you considering (e.g., PEX, copper, PVC)?",
        "What is the approximate length of pipe that needs to be installed or replaced?",
    ],
  },
  {
    key: "drain_cleaning",
    title: "Drain Cleaning",
    icon: "Wind",
    description: "Clear clogged drains and prevent future blockages with our expert services.",
    features: ["Kitchen & bathroom drains", "Main line sewer cleaning", "Hydro-jetting"],
    questions: [
        "Which fixture is clogged (e.g., kitchen sink, toilet, shower)?",
        "Is the drain completely blocked or just draining slowly?",
        "Have you tried any chemical drain cleaners yourself?",
    ],
  },
  {
    key: "water_heater",
    title: "Water Heater Services",
    icon: "Thermometer",
    description: "Reliable installation and repair for tankless and traditional water heaters.",
    features: ["New installations", "24/7 emergency repairs", "Regular maintenance"],
    questions: [
      "Is your current water heater gas or electric?",
      "Are you looking to repair your existing unit or install a new one?",
      "If installing a new one, are you considering a traditional tank or a tankless system?",
    ],
  },
  {
    key: "fixture_install",
    title: "Fixture Repair & Installation",
    icon: "ShowerHead",
    description: "We service all types of plumbing fixtures for your home or business.",
    features: ["Faucets & sinks", "Toilets & bidets", "Showers & tubs"],
     questions: [
      "What type of fixture do you need installed or repaired (e.g., faucet, toilet, shower head)?",
      "Do you already have the new fixture, or should we supply one?",
      "Is this a simple replacement or does it require moving plumbing lines?",
    ],
  },
  {
    key: "gas_line_services",
    title: "Gas Line Services",
    icon: "Settings",
    description: "Safe and certified installation and repair of natural gas lines.",
    features: ["New appliance hookups", "Leak detection & repair", "System installations"],
    questions: [
        "Is this for a new gas line installation, an extension, or a repair?",
        "What appliance is the gas line for (e.g., BBQ, stove, fireplace)?",
        "Do you currently have natural gas service at your property?",
    ],
  },
  {
    key: "perimeter_drains",
    title: "Perimeter Drains",
    icon: "Wind", // Using the drain icon for consistency
    description: "Protect your foundation with expert installation and repair of perimeter drainage systems.",
    features: ["Camera inspection & diagnosis", "Sump pump solutions", "Foundation water-proofing"],
    questions: [
      "Have you experienced flooding or pooling water near the foundation?",
      "What is the ground surface around the foundation (e.g., grass, concrete)?",
      "Do you have a sump pump, or does the system drain to a city storm connection?",
    ],
  },
  // --- THESE CATEGORIES ARE FOR THE MODAL ONLY AND WILL NOT RENDER ON THE HOMEPAGE ---
  {
    key: "bathroom_reno",
    title: "Bathroom Renovation",
    icon: "Wrench", // Placeholder icon
    description: "Full-scale bathroom plumbing renovations.",
    features: [],
    questions: [
      "Are you changing the plumbing layout (e.g., moving the toilet, sink, or shower location)?",
      "Are you replacing the main shower/tub valve that is inside the wall?",
    ],
  },
  {
    key: "main_line_repair",
    title: "Main Line (Sewer/Water) Repair",
    icon: "Wrench", // Placeholder icon
    description: "Repair and replacement of main water and sewer lines.",
    features: [],
    questions: [
      "What issues are you experiencing (e.g., slow drains everywhere, water in the yard, backup)?",
      "Do you know the approximate age of your home?",
    ],
  },
  {
    key: "emergency_service",
    title: "Emergency Service",
    icon: "Droplets", // Placeholder icon
    description: "Urgent response for plumbing emergencies.",
    features: [],
    questions: [
      "Please describe the nature of your plumbing emergency in detail.",
      "Is water currently shut off to the affected area or the whole house?",
    ],
  },
  {
    key: "other",
    title: "Other (Describe Your Request)",
    icon: "Wrench", // Placeholder icon
    description: "For any other plumbing needs not listed.",
    features: [],
    questions: ["Please describe your plumbing request or issue in detail."],
  },
];