// scripts/seedBlogs.js
const mongoose = require("mongoose");
const Blog = require("../models/Blog");
const User = require("../models/User");

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/yourdb";

const blogs = (authorId) => [
  // ── EDUCATION ───────────────────────────────────────────
  {
    title: "Why Critical Thinking Should Be Taught Before Calculus",
    slug: "critical-thinking-before-calculus",
    content: `<h2>The Gap in Modern Education</h2>
<p>Schools across the world prioritise memorisation and standardised testing over the one skill that matters most in the real world — the ability to reason clearly. A student who can solve a quadratic equation but cannot evaluate a flawed argument is not truly educated.</p>
<h2>What Critical Thinking Looks Like in the Classroom</h2>
<p>It means asking students to defend their answers, not just provide them. It means presenting two conflicting sources and asking which is more credible and why. It means rewarding intellectual honesty over correct guesses.</p>
<h2>The Research Backs This Up</h2>
<p>Studies from Stanford and Oxford consistently show that students taught reasoning skills early outperform peers in problem-solving across all subjects — including mathematics. The skill is transferable in a way that most curriculum content is not.</p>`,
    excerpt: "We drill formulas into students for years, yet most adults struggle to identify a logical fallacy. Something is wrong with our priorities.",
    tags: ["education", "critical-thinking", "schools", "learning"],
    featuredImage: { url: "https://placehold.co/800x400?text=Education", fileId: "seed_edu_001" },
    views: 312, likes: 47, author: authorId,
  },

  {
    title: "The Hidden Cost of Free University Education",
    slug: "hidden-cost-of-free-university-education",
    content: `<h2>Free Is Never Actually Free</h2>
<p>Several countries have introduced tuition-free university programmes to wide public applause. But the money has to come from somewhere — and too often it comes from underfunding primary and secondary schools where inequality is actually rooted.</p>
<h2>Who Really Benefits</h2>
<p>University attendance correlates strongly with family income. Free tuition disproportionately benefits middle and upper-class families whose children were already likely to attend. The poorest families gain little, because the barriers they face are not tuition fees — they are food security, working jobs through school, and lack of career networks.</p>
<h2>A Smarter Investment</h2>
<p>Redirecting that funding toward early childhood education, school meals, and teacher pay would do more for equality than free degrees for students already privileged enough to get there.</p>`,
    excerpt: "Free tuition sounds progressive. But look at who actually collects those free degrees — and who foots the bill.",
    tags: ["education", "university", "policy", "inequality"],
    featuredImage: { url: "https://placehold.co/800x400?text=University+Policy", fileId: "seed_edu_002" },
    views: 198, likes: 29, author: authorId,
  },

  // ── POLITICS ────────────────────────────────────────────
  {
    title: "Term Limits Are Not the Democracy Fix People Think They Are",
    slug: "term-limits-not-a-democracy-fix",
    content: `<h2>The Popular Appeal</h2>
<p>Term limits are politically popular across the spectrum. Tired of career politicians? Limit their terms. It sounds clean, democratic, and obvious. The reality is more complicated.</p>
<h2>What the Evidence Shows</h2>
<p>States and countries that have implemented strict term limits often find that power does not disappear — it migrates. Lobbyists and unelected advisors gain enormous influence because incoming politicians have no institutional memory and depend on experienced outsiders to navigate complex legislation.</p>
<h2>The Real Problem Is Accountability</h2>
<p>The issue with career politicians is not time served — it is lack of meaningful accountability. Electoral systems with strong independent oversight, campaign finance reform, and genuine voter access produce better governance than blunt term restrictions alone.</p>`,
    excerpt: "Voters love the idea of term limits. Political scientists are considerably less enthusiastic — and the data explains why.",
    tags: ["politics", "democracy", "governance", "elections"],
    featuredImage: { url: "https://placehold.co/800x400?text=Politics", fileId: "seed_pol_001" },
    views: 540, likes: 83, author: authorId,
  },

  {
    title: "Why Young People Are Abandoning Traditional Political Parties",
    slug: "young-people-abandoning-political-parties",
    content: `<h2>A Generational Break</h2>
<p>Party membership across established democracies has fallen sharply among people under 35. In the UK, Germany, and Nigeria alike, the pattern repeats: young voters turn out for specific issues — climate, debt, corruption — but refuse to commit to a party banner.</p>
<h2>What They Want Instead</h2>
<p>Research from the Pew Research Center and similar bodies shows this generation wants direct engagement on policy, not tribal loyalty. They follow individual politicians and movements, not institutions. They are perfectly willing to vote — just not to join.</p>
<h2>Implications for Parties</h2>
<p>Any party waiting for young people to "mature into" party membership is misreading the room. The parties that win the next generation will be the ones that offer genuine participation, not just voter mobilisation on election day.</p>`,
    excerpt: "Young people are not apathetic. They are disgusted — and they are making a deliberate choice to stay unaligned.",
    tags: ["politics", "youth", "democracy", "nigeria"],
    featuredImage: { url: "https://placehold.co/800x400?text=Youth+Politics", fileId: "seed_pol_002" },
    views: 405, likes: 61, author: authorId,
  },

  // ── ACHIEVEMENT / INSPIRATION ───────────────────────────
  {
    title: "From Dropout to CTO: How I Rewrote My Story",
    slug: "from-dropout-to-cto",
    content: `<h2>The Day I Left School</h2>
<p>I was 19 when I walked out of my computer science programme. Not dramatically — I just stopped going. The university was teaching Java with textbooks from 2009 and I had already shipped two small web apps that real people were using. The classroom felt like a waiting room.</p>
<h2>The Years Between</h2>
<p>What followed were four years of contract work, failed side projects, one near-bankruptcy, and more rejection emails than I can count. I am not going to dress it up as a heroic hustle journey. Much of it was frightening and isolating.</p>
<h2>What Actually Changed</h2>
<p>I started writing publicly about what I was building and learning. That writing led to a conversation, which led to a contract, which led to a full-time role, which led — six years later — to a CTO title at a company I genuinely believe in. The degree never mattered. The work always did.</p>`,
    excerpt: "I left university at 19 and spent years convinced I had made a catastrophic mistake. Here is what I learned on the other side.",
    tags: ["achievement", "career", "tech", "inspiration"],
    featuredImage: { url: "https://placehold.co/800x400?text=Achievement", fileId: "seed_ach_001" },
    views: 891, likes: 134, author: authorId,
  },

  // ── TECHNOLOGY ──────────────────────────────────────────
  {
    title: "The Problem with AI Hype Is Not AI — It Is the Hype",
    slug: "problem-with-ai-hype",
    content: `<h2>Two Kinds of AI Pessimists</h2>
<p>There are people who believe AI is overhyped because it cannot live up to science fiction fantasies of general intelligence. And there are people who believe it is underhyped because the world has not yet grasped how profoundly narrow AI will reshape specific industries within the next decade. Both groups are worth listening to.</p>
<h2>What Is Actually Happening</h2>
<p>Language models are genuinely transforming knowledge work. Code generation, document drafting, data summarisation — these are not demos anymore. They are workflows. The hype problem is not that the tools do not work; it is that inflated expectations lead to poor deployment decisions and eventual backlash against tools that were actually useful.</p>
<h2>The Honest Framing</h2>
<p>AI in 2025 is powerful, limited, and widely misapplied. The companies using it quietly to automate specific bottlenecks are winning. The companies announcing AI-first strategies without a concrete use case are burning budget.</p>`,
    excerpt: "AI is not magic and it is not useless. The hype cycle is obscuring what it actually does well — and that is costing real businesses real money.",
    tags: ["technology", "ai", "software", "opinion"],
    featuredImage: { url: "https://placehold.co/800x400?text=AI+Technology", fileId: "seed_tech_001" },
    views: 672, likes: 95, author: authorId,
  },

  // ── HEALTH ──────────────────────────────────────────────
  {
    title: "Sleep Is the Performance Drug Nobody Wants to Talk About",
    slug: "sleep-is-the-performance-drug",
    content: `<h2>The Productivity Culture Blind Spot</h2>
<p>Productivity culture celebrates early rising, hustle, and output. It has almost nothing to say about sleep — except occasionally to frame it as something successful people have optimised down to a minimum. This is backwards, and the neuroscience is not subtle about it.</p>
<h2>What Chronic Sleep Deprivation Actually Does</h2>
<p>Matthew Walker's research at UC Berkeley, alongside dozens of independent studies, shows that sleeping fewer than seven hours per night measurably impairs decision-making, emotional regulation, memory consolidation, and immune function. The effects compound. A week of six-hour nights produces cognitive impairment equivalent to 24 hours of total deprivation.</p>
<h2>The Simple Ask</h2>
<p>Before you buy a focus supplement, optimise your morning routine, or sign up for another productivity course — protect your sleep. It is the highest-return habit available and it costs nothing.</p>`,
    excerpt: "Every serious study on human performance points to the same thing. We keep ignoring it because it does not sell a product.",
    tags: ["health", "sleep", "productivity", "wellness"],
    featuredImage: { url: "https://placehold.co/800x400?text=Health+Wellness", fileId: "seed_health_001" },
    views: 447, likes: 72, author: authorId,
  },

  // ── CULTURE ─────────────────────────────────────────────
  {
    title: "Nollywood Is No Longer a Punchline — It Is a Blueprint",
    slug: "nollywood-is-a-blueprint",
    content: `<h2>From Mockery to Model</h2>
<p>For years, Nollywood was treated internationally as a curiosity — a high-volume, low-budget industry churning out melodrama on shoestring production values. That framing missed the point entirely. Nollywood was solving a problem Hollywood never had: how do you create a sustainable film industry for an audience with low average disposable income and unreliable cinema infrastructure?</p>
<h2>The Answer Was Distribution</h2>
<p>Straight-to-video, then straight-to-streaming, then platform partnerships with Netflix. Nollywood did not wait for multiplex infrastructure that was never coming. It built distribution channels that fit its actual market. That is not a compromise — it is strategy.</p>
<h2>What Other Industries Can Learn</h2>
<p>The Nollywood model — fast production, culturally specific content, direct-to-consumer distribution — is now the model every streaming platform is chasing globally. Africa's film industry figured this out by necessity twenty years ago. The rest of the world is catching up.</p>`,
    excerpt: "The world spent two decades laughing at Nollywood's production values. Now everyone is copying its business model.",
    tags: ["culture", "nollywood", "film", "africa", "nigeria"],
    featuredImage: { url: "https://placehold.co/800x400?text=Nollywood", fileId: "seed_culture_001" },
    views: 523, likes: 88, author: authorId,
  },
];

async function seed() {
  await mongoose.connect(MONGO_URI);
  console.log("Connected.");

  let user = await User.findOne();
  if (!user) {
    console.error("No user found — create a user first or adjust the seed.");
    process.exit(1);
  }

  await Blog.deleteMany({});
  const inserted = await Blog.insertMany(blogs(user._id));

  console.log(`\nSeeded ${inserted.length} blogs:\n`);
  inserted.forEach(b => console.log(`  [${b.tags[0].padEnd(12)}]  /${b.slug}`));

  await mongoose.disconnect();
  console.log("\nDone.");
}

seed().catch(err => { console.error(err); process.exit(1); });