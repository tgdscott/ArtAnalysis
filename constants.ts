import { PromptConfig } from "./types";

export const SYSTEM_INSTRUCTION = `
You are "The Projective Art Analyst," an expert AI system trained in art therapy principles, specifically loosely based on the Formal Elements Art Therapy Scale (FEATS).

Your Goal:
Analyze a photograph of a completed coloring page uploaded by a user. The coloring pages are intentionally ambiguous and lack instructions. You must analyze *how* the user colored the image, not *what* they drew. You will then synthesize these visual observations into a concise, insightful personality snapshot.

Analytical Framework (The "Rules" of Interpretation):

VECTOR 1: Boundary Adherence (The "Lines")
- Observation: Does the color stay perfectly within the pre-printed black lines, or does it bleed over? Is the coloring frenetic and messy, or careful and precise?
- Interpretation Guide:
    - High Precision/Staying inside lines: Suggests conscientiousness, respect for rules, perfectionism, or potential anxiety/rigidity.
    - Low Precision/Messy/Bleeding over: Suggests high energy, impulsiveness, "big picture" thinking, rebellion against constraints, or a free spirit.

VECTOR 2: Color Palette & Energy
- Observation: Which colors dominate? Are they warm (reds, oranges, yellows) or cool (blues, greens, purples)? Are they highly saturated (bold markers) or muted (light colored pencils)? How many distinct colors were used?
- Interpretation Guide:
    - Warm/Saturated: High outward energy, extroversion, passion, intensity.
    - Cool/Muted: Introspection, calmness, potential sadness, or calculated thought.
    - Monochromatic: Intense focus, obsession, or a need for simplicity.
    - Rainbow/Many Colors: Playfulness, scattered attention, or high creativity.

VECTOR 3: Space Utilization (The "Void")
- Observation: How much of the white paper was left uncolored? Did they fill every available pixel?
- Interpretation Guide:
    - Leaving significant white space: Comfort with ambiguity, risk aversion, or a "minimalist" approach to tasks.
    - Filling all space (Horror Vacui): A need for control, anxiety about emptiness, or thoroughness.

VECTOR 4: Interaction with Ambiguity
- Observation: The base images are abstract blobs. Did the user try to turn the blob into something concrete (e.g., drawing eyes on it to make it a face)? Or did they treat it purely as abstract shapes?
- Interpretation Guide:
    - Concretization (making it a "thing"): A practical mind that seeks to define the unknown; discomfort with pure abstraction.
    - Abstract treatment: Comfort with the unknown; intuitive or conceptual thinking.
`;

export const USER_PROMPT = `
Analyze the attached image based on the 4 vectors (Boundary Adherence, Color Palette, Space Utilization, Interaction with Ambiguity).
Provide a response structured exactly as JSON.
`;

// Shared negative prompt to ensure clean coloring pages
const STYLE_GUIDE = "Style: Clean vector line art for a children's coloring book. Bold, enclosed outlines. High contrast. NO shading, NO stippling, NO dotwork, NO hatching, NO tiny debris, NO grayscale fills. Pure white background.";

export const ART_STYLES: PromptConfig[] = [
  {
    id: "rorschach_inkblot",
    label: "The Rorschach",
    description: "Symmetrical, organic inkblot. Imagination & Projection.",
    prompt: `${STYLE_GUIDE} A symmetrical, organic Rorschach inkblot shape in the center. Thick, uniform black contours. The shape is ambiguous and fluid but uses clear, closed curves suitable for coloring. No internal texture or noise.`
  },
  {
    id: "shattered_glass",
    label: "Shattered Geometry",
    description: "Abstract geometric chaos. Order vs. Chaos.",
    prompt: `${STYLE_GUIDE} Abstract geometric chaos. A cluster of large intersecting triangles and sharp polygons. Clean, uniform black lines. Looks like a cracked mirror. Large open spaces to color. No small shards or dust.`
  },
  {
    id: "subconscious_flow",
    label: "The Thread",
    description: "Single continuous line. Anxiety & Flow.",
    prompt: `${STYLE_GUIDE} A single, continuous black line that meanders across the page, looping over itself to create a tangle of large enclosed blobs. smooth, fluid motion. Minimalist. No sharp angles, no scratchy lines.`
  },
  {
    id: "cellular_density",
    label: "The Micro-Cell",
    description: "Dense organic texture. Focus & Obsession.",
    prompt: `${STYLE_GUIDE} A dense, organic texture resembling plant cells or stones. Many tightly packed irregular circles and ovals, but each shape is distinct and colorable. Uniform line weight. No tiny specks or grit.`
  },
  {
    id: "impossible_structure",
    label: "The Escher",
    description: "Optical illusion. Logic & Conflict.",
    prompt: `${STYLE_GUIDE} An abstract, impossible shape resembling an optical illusion. Clean geometric lines that twist in non-Euclidean ways. Minimalist, centered. Large geometric planes to color. No shading lines.`
  }
];

const FADE_GUIDE = "Style: Professional coloring book line art. The image must feature solid black outlines that transition into THIN, FAINT GRAY OUTLINES and then into empty white space. Do NOT use dots, stippling, or texture to show fading. Use line weight reduction only. Clean, open shapes.";

export const FADING_STYLES: PromptConfig[] = [
  {
    id: "enchanted_forest",
    label: "Enchanted Forest",
    description: "Nature fading into mist.",
    prompt: `${FADE_GUIDE} A twisted tree with roots. The trunk has bold black outlines. The branches and leaves gradually become faint gray sketch lines and then disappear into white. No bark texture or shading dots.`
  },
  {
    id: "cyberpunk_city",
    label: "Cyberpunk City",
    description: "Structure fading into digital noise.",
    prompt: `${FADE_GUIDE} A futuristic building or robot. The foreground has sharp black vector lines. The background dissolves into faint wireframe lines and incomplete geometric shapes. No pixel noise or dithering.`
  },
  {
    id: "underwater_abyss",
    label: "Underwater Abyss",
    description: "Marine life fading into the deep.",
    prompt: `${FADE_GUIDE} A large fish or coral reef. Foreground details are bold black ink. Background elements fade into simple, faint gray wave lines and bubbles before vanishing. No sand texture or tiny specks.`
  },
  {
    id: "steampunk_machinery",
    label: "Steampunk Machinery",
    description: "Gears fading into schematics.",
    prompt: `${FADE_GUIDE} Clockwork gears and pipes. Main gears are bold black. Peripheral gears fade into faint, thin technical diagram lines (blueprints) and then white space. No rust texture or hatching.`
  },
  {
    id: "celestial_bodies",
    label: "Celestial Bodies",
    description: "Planets fading into cosmic dust.",
    prompt: `${FADE_GUIDE} Planets and stars. The main planet has a clear black rim. The rings and surrounding stars fade into faint, broken orbit lines and simple open circles. No stardust dots or splatter.`
  },
  {
    id: "ancient_ruins",
    label: "Ancient Ruins",
    description: "History fading into time.",
    prompt: `${FADE_GUIDE} A Greek column or statue. The base is solid black line art. The top fades into faint, broken gray outlines suggesting erosion, eventually becoming invisible. No stone texture or gravel.`
  },
  {
    id: "mythical_creatures",
    label: "Mythical Creatures",
    description: "Beasts fading into spirit.",
    prompt: `${FADE_GUIDE} A dragon or gryphon. The head is drawn in bold black lines. The wings and tail fade into simple, sweeping gray motion lines and then white air. No scales texture or fur shading.`
  },
  {
    id: "botanical_garden",
    label: "Botanical Garden",
    description: "Growth fading into light.",
    prompt: `${FADE_GUIDE} Large flowers and vines. The center blooms are bold black. The outer leaves fade into faint, thin gray contours and then pure white. No pollen dots or leaf veins.`
  },
  {
    id: "dreamscape_surrealism",
    label: "Dreamscape Surrealism",
    description: "Logic fading into dreams.",
    prompt: `${FADE_GUIDE} Surreal melting clocks or stairs. The objects are solid black vector art in the center, melting into faint, liquid-like gray lines at the bottom. No shading or dribble dots.`
  },
  {
    id: "portrait_emotion",
    label: "Portrait of Emotion",
    description: "Identity fading into abstraction.",
    prompt: `${FADE_GUIDE} A human face. The left side is drawn with bold black contour lines. The right side dissolves into faint, large abstract geometric shapes and open space. No skin texture, hair strands, or shading.`
  }
];

// Nested 3-Tier Emotion Wheel (Primary -> Secondary -> Tertiary)
interface EmotionNode {
  [key: string]: string[];
}

export const EMOTION_WHEEL: Record<string, EmotionNode> = {
  "Happy": {
    "Playful": ["Aroused", "Cheeky"],
    "Content": ["Free", "Joyful"],
    "Interested": ["Curious", "Inquisitive"],
    "Proud": ["Successful", "Confident"],
    "Accepted": ["Respected", "Valued"],
    "Powerful": ["Courageous", "Creative"],
    "Peaceful": ["Loving", "Thankful"],
    "Trusting": ["Sensitive", "Intimate"],
    "Optimistic": ["Hopeful", "Inspired"]
  },
  "Surprised": {
    "Startled": ["Shocked", "Dismayed"],
    "Confused": ["Disillusioned", "Perplexed"],
    "Amazed": ["Astonished", "Awe"],
    "Excited": ["Eager", "Energetic"]
  },
  "Bad": {
    "Bored": ["Indifferent", "Apathetic"],
    "Busy": ["Pressured", "Rushed"],
    "Stressed": ["Overwhelmed", "Out of control"],
    "Tired": ["Sleepy", "Unfocussed"]
  },
  "Fearful": {
    "Scared": ["Helpless", "Frightened"],
    "Anxious": ["Overwhelmed", "Worried"],
    "Insecure": ["Inadequate", "Inferior"],
    "Weak": ["Worthless", "Insignificant"],
    "Rejected": ["Excluded", "Persecuted"],
    "Threatened": ["Nervous", "Exposed"]
  },
  "Angry": {
    "Let down": ["Betrayed", "Resentful"],
    "Humiliated": ["Disrespected", "Ridiculed"],
    "Bitter": ["Indignant", "Violated"],
    "Mad": ["Furious", "Jealous"],
    "Aggressive": ["Provoked", "Hostile"],
    "Frustrated": ["Infuriated", "Annoyed"],
    "Distant": ["Withdrawn", "Numb"],
    "Critical": ["Skeptical", "Dismissive"]
  },
  "Disgusted": {
    "Disapproving": ["Judgmental", "Embarrassed"],
    "Disappointed": ["Appalled", "Revolted"],
    "Awful": ["Nauseated", "Detestable"],
    "Repelled": ["Horrified", "Hesitant"]
  },
  "Sad": {
    "Lonely": ["Abandoned", "Isolated"],
    "Vulnerable": ["Victimised", "Fragile"],
    "Despair": ["Grief", "Powerless"],
    "Guilty": ["Ashamed", "Remorseful"],
    "Depressed": ["Empty", "Inferior"],
    "Hurt": ["Sensative", "Pained"]
  }
};
