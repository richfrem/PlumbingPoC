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
      "What specific fixtures does the homeowner plan to use, or would they like options/recommendations?",
      "Are there any special requirements or features the homeowner is interested in, such as water-saving or smart fixtures?",
      "Is there an existing blueprint or design plan to follow for the renovation?",
      "Will any additional renovations be happening simultaneously that might affect the plumbing work?",
      "Are there any known issues with the existing plumbing that might complicate the renovation process?"
    ]
  },
  {
    key: "perimeter_drains",
    label: "Perimeter Drains",
    questions: [
      "Is there an existing drainage system?",
      "Have you experienced flooding or pooling water?",
      "What is the age of your property?",
      "Are there any known issues with soil or grading?"
    ]
  },
  {
    key: "water_heater_install",
    label: "Water Heater Installation",
    questions: [
      "What type of water heater do you want installed?",
      "Is there an existing water heater to be replaced?",
      "What is the location for installation?",
      "Are there any space or access constraints?"
    ]
  },
  {
    key: "leak_repair",
    label: "Leak Repair",
    questions: [
      "Where is the leak located?",
      "How severe is the leak?",
      "When did you first notice the leak?",
      "Has any previous repair been attempted?"
    ]
  },
  {
    key: "fixture_install",
    label: "Fixture Installation",
    questions: [
      "What type of fixture do you need installed? (e.g., faucet, toilet, shower)",
      "Is this a replacement or a new installation?",
      "Are there any special features required?",
      "Is the location ready for installation?"
    ]
  },
  {
    key: "main_line_repair",
    label: "Main Line Repair",
    questions: [
      "What issues are you experiencing with the main line?",
      "How old is the main line?",
      "Has the main line been repaired before?",
      "Are there any access issues to the main line?"
    ]
  },
  {
    key: "emergency_service",
    label: "Emergency Service",
    questions: [
      "What is the nature of your emergency?",
      "When did the issue start?",
      "Is water currently shut off?",
      "Have you contacted us before for this issue?"
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
