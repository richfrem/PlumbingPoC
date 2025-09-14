export interface ServiceQuoteCategory {
  key: string;
  label: string;
  questions: string[];
}

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
    ]
  },
  {
    key: "emergency_service",
    label: "Emergency Service",
    questions: [
      "Please describe the nature of your plumbing emergency in detail.",
      "Is water currently shut off to the affected area or the whole house?",
      "Is there any risk of significant water damage occurring?",
    ]
  },
  {
    key: "other",
    label: "Other (Describe Your Request)",
    questions: [
      "Please describe your plumbing request or issue in detail.",
      "Are there any specific requirements or concerns?",
      "When would you like the service performed?"
    ]
  }
];