// THE NEW SINGLE SOURCE OF TRUTH FOR ALL SERVICE DEFINITIONS

export interface ServiceDefinition {
  key: string;
  title: string;
  icon: string;
  description: string;
  features: string[];
  questions: string[];
  exampleAnswers?: string[];
  // New agent-based configuration
  agentConfig?: {
    instructions: string;
    tools?: AgentTool[];
    handoffs?: AgentHandoff[];
    outputType?: any;
  };
}

export interface AgentTool {
  name: string;
  description: string;
  parameters: any;
  execute: (input: any) => Promise<any>;
}

export interface AgentHandoff {
  name: string;
  description: string;
  agent: any; // Will be Agent instance
}

// General Plumbing Agent that can hand off to specialists
export const createGeneralPlumbingAgent = () => {
  // This will be implemented when we integrate with the OpenAI Agents SDK
  return {
    name: 'General Plumbing Assistant',
    instructions: `You are a general plumbing assistant who helps customers identify their plumbing needs and connects them with the right specialist.

Start by understanding their general issue, then hand off to the appropriate specialist agent based on their specific problem:
- Leak issues → Leak Specialist
- Water heater problems → Water Heater Specialist
- Drain clogs → Drain Cleaning Specialist
- Pipe installation/repair → Pipe Specialist

Be conversational and helpful. Ask clarifying questions when needed, but don't overwhelm with too many questions at once.`,
    handoffs: [] // Will be populated with specialist agents
  };
};

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
    ],
    agentConfig: {
      instructions: `You are an expert plumbing assistant specializing in leak detection and repair. Your goal is to gather all necessary information to provide an accurate quote for leak repair services.

You have access to tools to help gather information. Ask questions naturally and use the information gathering tools when appropriate.

Key information you need:
- Location of the leak (under sink, wall, ceiling, outside, etc.)
- Current leak status (active dripping, water flow stopped, etc.)
- Severity assessment (drip rate, water damage extent)
- Timeline (when noticed, how long it's been leaking)
- Property details (type, age if relevant)
- Emergency status

Be conversational but thorough. Use the available tools to validate information when possible.`,
      tools: [
        {
          name: 'assess_leak_severity',
          description: 'Assess the severity of a leak based on description',
          parameters: {
            type: 'object',
            properties: {
              leak_description: { type: 'string', description: 'Description of the leak' },
              drip_rate: { type: 'string', description: 'How fast is water dripping/leaking' }
            },
            required: ['leak_description']
          },
          execute: async (input: { leak_description: string; drip_rate?: string }) => {
            const severity = input.drip_rate?.includes('steady stream') ? 'high' :
                           input.drip_rate?.includes('drip') ? 'medium' : 'low';
            return {
              severity,
              urgency: severity === 'high' ? 'immediate' : severity === 'medium' ? 'within 24 hours' : 'schedule soon',
              estimated_cost_range: severity === 'high' ? '$200-500' : severity === 'medium' ? '$100-300' : '$50-150'
            };
          }
        },
        {
          name: 'check_emergency_status',
          description: 'Determine if a leak situation qualifies as an emergency',
          parameters: {
            type: 'object',
            properties: {
              leak_location: { type: 'string', description: 'Where the leak is located' },
              water_flow: { type: 'string', description: 'Is water actively flowing' },
              property_type: { type: 'string', description: 'Type of property' }
            },
            required: ['leak_location', 'water_flow']
          },
          execute: async (input: { leak_location: string; water_flow: string; property_type?: string }) => {
            const isEmergency = input.water_flow.includes('actively') ||
                              input.leak_location.includes('ceiling') ||
                              input.leak_location.includes('wall');
            return {
              is_emergency: isEmergency,
              recommended_response_time: isEmergency ? 'within 2 hours' : 'schedule appointment',
              reason: isEmergency ? 'Risk of significant water damage' : 'Can be scheduled normally'
            };
          }
        }
      ]
    }
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
    agentConfig: {
      instructions: `You are a water heater specialist. Help customers determine their water heater needs and gather information for accurate quotes.

Focus on:
- Current system assessment (gas/electric, tank/tankless, age)
- Problem diagnosis (no hot water, leaking, strange noises, etc.)
- Replacement vs repair decision
- Energy efficiency considerations
- Safety concerns (gas leaks, electrical issues)

Be knowledgeable about different water heater types and their pros/cons. Guide customers toward the best solution for their situation.`,
      tools: [
        {
          name: 'analyze_water_heater_issue',
          description: 'Analyze water heater problems and recommend solutions',
          parameters: {
            type: 'object',
            properties: {
              symptoms: { type: 'string', description: 'What problems are you experiencing' },
              system_age: { type: 'number', description: 'How old is the water heater in years' },
              system_type: { type: 'string', description: 'Gas, electric, tankless, etc.' }
            },
            required: ['symptoms']
          },
          execute: async (input: { symptoms: string; system_age?: number; system_type?: string }) => {
            const age = input.system_age || 0;
            const shouldReplace = age > 10 || input.symptoms.includes('no hot water') || input.symptoms.includes('leaking');

            return {
              recommended_action: shouldReplace ? 'replacement' : 'repair',
              estimated_cost: shouldReplace ? '$800-2500' : '$200-800',
              reasoning: shouldReplace ?
                'Age and symptoms suggest replacement is more cost-effective' :
                'Issue appears repairable for now'
            };
          }
        },
        {
          name: 'compare_heater_types',
          description: 'Compare different water heater types and recommend best option',
          parameters: {
            type: 'object',
            properties: {
              household_size: { type: 'number', description: 'Number of people in household' },
              hot_water_usage: { type: 'string', description: 'High, medium, or low usage' },
              energy_preference: { type: 'string', description: 'Gas or electric preference' }
            },
            required: ['household_size']
          },
          execute: async (input: { household_size: number; hot_water_usage?: string; energy_preference?: string }) => {
            const size = input.household_size;
            const usage = input.hot_water_usage || 'medium';

            if (size <= 2 && usage === 'low') {
              return { recommended: 'tankless', reason: 'Energy efficient for small households' };
            } else if (size <= 4) {
              return { recommended: 'hybrid_heat_pump', reason: 'Good balance of efficiency and capacity' };
            } else {
              return { recommended: 'traditional_tank', reason: 'Best capacity for larger households' };
            }
          }
        }
      ]
    }
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