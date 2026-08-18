import heroCampus from "@/assets/hero-campus.jpg";
import aboutClassroom from "@/assets/about-classroom.jpg";
import facilityLab from "@/assets/facility-lab.jpg";
import facilityLibrary from "@/assets/facility-library.jpg";
import facilityIct from "@/assets/facility-ict.jpg";
import facilitySports from "@/assets/facility-sports.jpg";
import facilityArts from "@/assets/facility-arts.jpg";
import facilityEvents from "@/assets/facility-events.jpg";

export { heroCampus, aboutClassroom };

/** Facility showcase. Images are placeholders until official campus photography is supplied. */
export const facilities = [
  {
    title: "Modern Classrooms",
    description: "Bright, well-equipped teaching spaces designed for focused learning.",
    image: aboutClassroom,
    alt: "Teacher guiding students seated at desks in a bright modern classroom",
  },
  {
    title: "Science Laboratories",
    description: "Practical laboratory spaces for hands-on scientific enquiry.",
    image: facilityLab,
    alt: "Students in lab coats and safety goggles conducting a science experiment",
  },
  {
    title: "ICT & Technology",
    description: "Computer facilities supporting digital literacy and computing.",
    image: facilityIct,
    alt: "Students working at desktop computers in a school ICT laboratory",
  },
  {
    title: "Library",
    description: "A quiet, resource-rich space for reading, research and study.",
    image: facilityLibrary,
    alt: "School library interior with tall bookshelves and students reading at tables",
  },
  {
    title: "Sports Facilities",
    description: "Outdoor space for team sport, athletics and physical education.",
    image: facilitySports,
    alt: "Students playing football on a school sports field at golden hour",
  },
  {
    title: "Creative Arts Spaces",
    description: "Studios for visual art, music and performance.",
    image: facilityArts,
    alt: "Students painting at easels in a naturally lit school art studio",
  },
  {
    title: "Student Common Areas",
    description: "Shared spaces for assembly, collaboration and community events.",
    image: facilityEvents,
    alt: "Students seated in rows in a school assembly hall during an event",
  },
] as const;

export type GalleryCategory =
  "Campus" | "Classroom" | "Academics" | "Sports" | "Events" | "Student Life";

/**
 * Gallery items. Component architecture is ready to be sourced from
 * cloud storage in a later phase — shape: { id, image, alt, category }.
 */
export const galleryItems: {
  id: string;
  image: string;
  alt: string;
  category: GalleryCategory;
}[] = [
  {
    id: "g1",
    image: heroCampus,
    alt: "Students walking together across the school campus courtyard",
    category: "Campus",
  },
  {
    id: "g2",
    image: aboutClassroom,
    alt: "A lesson in progress in a modern classroom",
    category: "Classroom",
  },
  {
    id: "g3",
    image: facilityLab,
    alt: "Students conducting an experiment in the science laboratory",
    category: "Academics",
  },
  {
    id: "g4",
    image: facilityLibrary,
    alt: "Students reading and studying in the school library",
    category: "Academics",
  },
  {
    id: "g5",
    image: facilityIct,
    alt: "Students working on computers in the ICT laboratory",
    category: "Classroom",
  },
  {
    id: "g6",
    image: facilitySports,
    alt: "A football match on the school sports field",
    category: "Sports",
  },
  {
    id: "g7",
    image: facilityArts,
    alt: "Students painting during an art studio session",
    category: "Student Life",
  },
  {
    id: "g8",
    image: facilityEvents,
    alt: "Students gathered in the assembly hall for a school event",
    category: "Events",
  },
];
