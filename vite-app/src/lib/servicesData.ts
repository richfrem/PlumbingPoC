// This file now contains ONLY pure data. No components, no JSX.

export interface ServiceData {
  key: string;
  icon: string; // The icon is now represented by its name (a string)
  title: string;
  description: string;
  features: string[];
}

export const services: ServiceData[] = [
  {
    key: "leak_repair",
    icon: "Droplets",
    title: "Leak Detection & Repair",
    description: "Fast detection and repair of water leaks to prevent damage and save water.",
    features: ["Emergency leak repair", "Pipe inspection", "Slab leak detection"]
  },
  {
    key: "pipe_installation",
    icon: "Wrench",
    title: "Pipe Installation & Repiping",
    description: "Professional installation and replacement for new construction or aging systems.",
    features: ["Full home repiping", "New construction plumbing", "System upgrades"]
  },
  {
    key: "drain_cleaning",
    icon: "Wind",
    title: "Drain Cleaning",
    description: "Clear clogged drains and prevent future blockages with our expert services.",
    features: ["Kitchen & bathroom drains", "Main line sewer cleaning", "Hydro-jetting"]
  },
  {
    key: "water_heater",
    icon: "Thermometer",
    title: "Water Heater Services",
    description: "Reliable installation and repair for tankless and traditional water heaters.",
    features: ["New installations", "24/7 emergency repairs", "Regular maintenance"]
  },
  {
    key: "fixture_services",
    icon: "ShowerHead",
    title: "Fixture Repair & Installation",
    description: "We service all types of plumbing fixtures for your home or business.",
    features: ["Faucets & sinks", "Toilets & bidets", "Showers & tubs"]
  },
  {
    key: "gas_line_services",
    icon: "Settings",
    title: "Gas Line Services",
    description: "Safe and certified installation and repair of natural gas lines.",
    features: ["New appliance hookups", "Leak detection & repair", "System installations"]
  }
];