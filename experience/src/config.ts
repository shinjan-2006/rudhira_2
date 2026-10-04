export type DestinationId =
  "blood" | "plasma" | "fractionation" | "stories" | "about";
export type ActionId = "opportunities" | "plasma-guide" | "connect";
export interface Destination {
  id: DestinationId;
  number: string;
  label: string;
  eyebrow: string;
  title: string;
  description: string;
  intro: string;
  paragraphs: string[];
  color: string;
  action: { label: string; route: ActionId };
  review: string;
}
// Replace draft copy only after owner/clinical review. Set an action URL to replace its local demo.
export const config = {
  brand: "RUDHIRA",
  headline: ["Life flows", "through us."],
  supporting: "Connecting donors, plasma partners, and possibilities for life.",
  closing: "One connected world. Many ways to give life.",
  colors: {
    burgundy: "#270812",
    crimson: "#bf324f",
    ivory: "#f6efdf",
    gold: "#dabb79",
  },
  contact: {
    email: "",
    label: "Contact details coming soon",
    review: "Add an approved contact address before launch.",
  },
  actions: {
    opportunities: {
      url: "./network.html?role=donor&view=camps",
      title: "Explore donation opportunities",
      review:
        "Connect to a verified donation directory or approved centre. No appointments are available in this demo.",
    },
    "plasma-guide": {
      url: "",
      title: "Learn about plasma donation",
      review:
        "Have a qualified clinical reviewer approve all guidance and add a verified information link.",
    },
    connect: {
      url: "./network.html",
      title: "Connect with Rudhira",
      review:
        "Connect this demo form to an approved endpoint and privacy policy before collecting data.",
    },
  },
  destinations: [
    {
      id: "blood",
      number: "01",
      label: "Blood Donation",
      eyebrow: "A gesture. A connection.",
      title: "The world begins\nwith a donor.",
      description: "Discover a place for your generosity.",
      intro:
        "Rudhira is being designed to help people find their way to donation opportunities and the organisations that coordinate them.",
      paragraphs: [
        "Giving starts with a human connection. Our intended role is to make those connections easier to discover, through a clear path from curiosity to a verified donation service.",
        "Donation is organised by qualified services. They provide the information, assessment, and care needed for each individual. This experience does not assess eligibility or offer medical advice.",
      ],
      color: "#cb3e58",
      action: {
        label: "Explore donation opportunities",
        route: "opportunities",
      },
      review:
        "Mission copy is a draft. Donation locations, availability, and eligibility guidance require verification.",
    },
    {
      id: "plasma",
      number: "02",
      label: "Plasma Donation",
      eyebrow: "A golden thread of possibility.",
      title: "A different way\nto be connected.",
      description: "Meet the golden part of this world.",
      intro:
        "Plasma is the liquid part of blood. Here, golden ribbons offer an artistic introduction to its place in a wider network of care.",
      paragraphs: [
        "Learning about plasma donation begins with a conversation with a qualified donation service. They can explain the process and answer questions about what it involves.",
        "Rudhira aims to make that first step more approachable. We are developing a route to reviewed educational resources, with clear information about who provides them.",
      ],
      color: "#e1bd74",
      action: { label: "Learn about plasma donation", route: "plasma-guide" },
      review:
        "Educational text requires clinical review. No eligibility rules or clinical benefit claims are provided.",
    },
    {
      id: "fractionation",
      number: "03",
      label: "Plasma Fractionation",
      eyebrow: "One source. Many connections.",
      title: "Where possibility\nbranches out.",
      description: "Explore the connections beyond donation.",
      intro:
        "Our gold branching form is an artistic interpretation of fractionation: a process that separates plasma into components.",
      paragraphs: [
        "This destination introduces the manufacturing side of the plasma network. It is a place to begin conversations with organisations working in fractionation and related services.",
        "Rudhira’s intended partner network is still being defined. Any future relationship, operating model, or supplied material must be reviewed and confirmed by the organisations involved.",
      ],
      color: "#d7ae5c",
      action: { label: "Connect with Rudhira", route: "connect" },
      review:
        "Partner content is a proposal. No existing partnerships, certifications, manufacturing capabilities, or supply commitments are claimed.",
    },
    {
      id: "stories",
      number: "04",
      label: "Stories of Life",
      eyebrow: "The people behind the possibility.",
      title: "Every connection\nhas a human side.",
      description: "Small gestures. Shared hope.",
      intro:
        "A place for the voices of donors, communities, and people connected by care. The stories below are illustrative editorial samples.",
      paragraphs: [
        "These sample cards show how this space could hold real, consented stories in the future. They are fictional and do not describe patient outcomes.",
      ],
      color: "#e9a9a5",
      action: { label: "Share an idea with Rudhira", route: "connect" },
      review:
        "All cards are fictional samples. Replace only with verified stories and documented consent.",
    },
    {
      id: "about",
      number: "05",
      label: "About Rudhira",
      eyebrow: "One connected world.",
      title: "Many ways\nto give life.",
      description: "Meet the idea behind this world.",
      intro:
        "Rudhira imagines a more connected world around blood donation and plasma: a place where people, knowledge, and organisations can find one another.",
      paragraphs: [
        "This concept is for people exploring donation, community organisers, blood services, and plasma manufacturing partners. Its mission is to make a complex system feel more understandable and more human.",
        "We are shaping the next chapter. The mission, audience, contact details, and operating model here are editable draft content, ready for the team’s factual review.",
      ],
      color: "#f5e6c4",
      action: { label: "Start a conversation", route: "connect" },
      review:
        "Mission and intended audience are placeholders for owner approval. Add approved contact information before launch.",
    },
  ] as Destination[],
  stories: [
    {
      title: "The first conversation",
      tag: "A donor’s perspective",
      body: "A fictional scene about someone asking their first questions and finding a welcoming place to learn.",
    },
    {
      title: "A community comes together",
      tag: "Shared purpose",
      body: "An illustrative story idea about neighbours helping one another discover a donation event.",
    },
    {
      title: "A thread of hope",
      tag: "Human connection",
      body: "A sample reflection on the small acts of care that bring a community closer.",
    },
  ],
};
export const getDestination = (id: string | null) =>
  config.destinations.find((d) => d.id === id);
