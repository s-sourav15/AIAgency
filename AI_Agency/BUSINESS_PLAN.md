# AI Content Engine — Business Plan

## One line: "Give us one product photo. Get 30 days of on-brand content across every platform."

---

## 1. Problem Statement

Indian D2C brands and SMBs face a broken content pipeline:

**The math doesn't work:**
- A growing D2C brand needs 60-90 pieces of content/month (Instagram, Twitter, LinkedIn, ads, email)
- Hiring a freelance designer + copywriter = INR 40-80K/month
- Design agencies (Design Pickle, Kimp) = INR 42K-1.6L/month
- Most SMBs budget only INR 10-50K/month for content at early stage

**The tools are fragmented:**
- Video repurposing tools (Opus Clip, Munch) only output video clips
- Design tools (Canva, Predis) only output visuals, one at a time
- Writing tools (Jasper, Copy.ai) only output text, no design
- A brand needs 3-5 tools stitched together, each requiring manual work per piece

**AI tools produce slop:**
- 73% of consumers can spot and reject AI-generated marketing (SmythOS 2025)
- 52% disengage when they suspect content is AI-generated (Bynder study)
- "AI slop" was 2025's word of the year — 2.4M mentions, 82% negative sentiment (Meltwater)
- Detected AI content makes brands look "impersonal" (26%), "lazy" (20%), "untrustworthy" (20%)

**The result:** SMBs either post inconsistently, spend too much on agencies, or produce
generic AI content that hurts their brand. There is no middle ground.

---

## 2. Competitive Landscape

### Content Repurposing Tools
| Competitor | Price | Does | Doesn't |
|---|---|---|---|
| Repurpose.io | $29-149/mo | Redistribute video across platforms | Create anything — just reshares |
| Opus Clip | $15-29/mo | Clip long video into shorts | Text, design, email, strategy |
| Automata | $32/mo | 150+ text-to-text repurposing combos | Visual design, video, brand kit |
| Lately.ai | $239/mo | Atomize long-form into social posts | Visuals, design. Enterprise-only |
| Blaze.ai | $26-150/mo | "Turn Into" multi-format conversion | Video, quality design, India focus |

### AI Design Platforms
| Competitor | Price | Does | Doesn't |
|---|---|---|---|
| Canva AI | $15/mo | Best design tool, brand kit | Automated content strategy, repurposing |
| Predis.ai | $32-249/mo | One-click social posts, Indian-origin | Video, email, quality is mediocre |
| Simplified | $24-199/mo | Design + write + schedule | True repurposing workflow |

### Done-For-You Services
| Competitor | Price | Does | Doesn't |
|---|---|---|---|
| Design Pickle | $1,918/mo | Dedicated human designers | Affordable. No text, no video |
| Penji | $499/mo | Unlimited design requests | Content writing, video, AI-native |
| Kimp | $699-1,195/mo | Graphics + video combo | Fast. No content writing, no strategy |
| Rocketium (India) | $5/creative | AI + human review at scale | SMB-friendly. Enterprise only |

### Enterprise AI Content
| Competitor | Price | Does | Doesn't |
|---|---|---|---|
| Typeface AI | Custom ($1B val) | Best brand consistency in the market | Serve SMBs. No public pricing |
| Jasper AI | $39-59/mo | Strong brand voice for text | Design, video, moved upmarket |
| Sprinklr | $249+/user/mo | Enterprise social management | Anything affordable for SMBs |

---

## 3. The Gaps — Where Nobody Is Playing

### Gap 1: One Input to Full Month
No tool takes ONE input (product photo, blog post, video) and produces a complete
30-day content calendar spanning ALL formats — creatives, ad variants, threads,
LinkedIn posts, carousels, video scripts, AND email copy. Nobody.

### Gap 2: Product Photo as Primary Input
D2C brands live and die by product photography. Yet zero repurposing tools accept a
product photo and generate a month of content from it — lifestyle mockups, ad variants,
carousel images, social creatives.

### Gap 3: Indian SMB Focus
No tool understands Indian festival calendars (Diwali, Holi, Navratri), generates
Hinglish copy, prices in INR, or offers Indian D2C aesthetic templates.
The market is served by either overpriced global SaaS or traditional agencies.

### Gap 4: Brand Consistency at SMB Price
Typeface AI does brand consistency at $1B valuation for enterprises.
Nobody offers brand learning + automated generation for SMBs at INR 5-30K/month.

### Gap 5: Quality Between "Cheap AI Slop" and "Expensive Human Agency"
AI tools cost $25-50/mo but output is mediocre and detectable.
Human agencies cost $500-2000/mo but are slow.
Nobody sits in the middle with agency-quality output at tool-level pricing.

---

## 4. Our Solution

### The Product
An AI content engine that takes one input and produces a full month of on-brand,
multi-format content — with a built-in quality validation loop that ensures output
doesn't read like AI slop.

### How It Works
```
1. BRAND ONBOARDING (5 minutes)
   Upload: logo, colors, 2-3 past posts or product descriptions
   AI extracts: tone, vocabulary, emoji patterns, CTA style, hashtag habits
   Result: a persistent brand voice profile

2. INPUT (30 seconds)
   Upload ONE of: product photo, blog post URL, or text description
   Select platforms: Instagram, Twitter, LinkedIn, Ads, Email

3. CREATION (2-3 minutes)
   - Content strategist LLM plans 30-day calendar with themes and hooks
   - Creator LLM generates platform-specific copy for each day
   - Image generator produces visual variants (product lifestyle, quotes, banners)

4. VALIDATION LOOP (automatic, 1-2 minutes)
   - Validator LLM scores each piece: brand voice match, platform compliance,
     engagement potential, CTA presence, originality, factual accuracy
   - Score < 0.8? Regenerate with specific feedback (max 3 loops)
   - This loop is the difference between slop and professional content

5. OUTPUT
   - 30-day content calendar (visual)
   - Platform-ready copy and images
   - Export: CSV (Buffer/Hootsuite), ZIP, or Notion
```

### The Anti-Slop System (Our Core Differentiator)

The #1 complaint across every AI content tool is: "output needs too much manual editing."
Our validator loop directly solves this.

**How we avoid AI slop:**

1. BANNED WORD LIST (enforced in every prompt)
   "delve", "tapestry", "landscape", "harness", "seamlessly", "robust", "holistic",
   "leverage", "game-changing", "cutting-edge", "moreover", "furthermore",
   "it's worth noting", "in today's fast-paced world"

2. BRAND VOICE INJECTION
   Every generation prompt includes 5-10 samples of the brand's actual past content.
   The AI reverse-engineers voice patterns from real examples, not generic templates.
   First-party data forces the model to build on something fresh, not remix the internet.

3. CONSTRAINED GENERATION
   - Specific word counts per platform (not "write a caption" but "write 120-150 chars")
   - Mandatory elements (CTA type, hashtag count, tone descriptor)
   - Forbidden patterns (no em-dash overuse, no rule-of-three everywhere,
     no "zhuzhed up" emoji headers)

4. MULTI-STEP CREATION (never ask for a final draft in one shot)
   Step 1: Generate content strategy outline
   Step 2: Draft copy per platform with constraints
   Step 3: Validate and score
   Step 4: Regenerate weak pieces with specific validator feedback

5. HUMAN IMPERFECTION INJECTION
   - Deliberately vary sentence structure (fragments, colloquialisms)
   - Mix formal and informal within a piece (like real humans write)
   - Include Hinglish where appropriate for Indian brands
   - Avoid perfectly parallel structure everywhere

6. PLATFORM-NATIVE VOICE
   - Instagram: casual, emoji-friendly, hashtag-heavy
   - LinkedIn: professional but not corporate, thought-leadership angle
   - Twitter: punchy, opinionated, conversation-starting
   - Ads: benefit-led, urgency, clear CTA
   - Email: personal, value-first, minimal design
   (same brand, different register per platform — like a real marketer would do)

**Key insight from research:** 56% of people prefer AI content when they don't know
it's AI. The problem isn't AI quality — it's AI detectability. Our validator
specifically targets the patterns that signal "this was made by AI."

---

## 5. Target Market

### Primary: Indian D2C Brands (1K-50K Instagram followers)
- Budget: INR 10-50K/month for content
- Pain: posting inconsistently, spending too much time on creatives
- Currently using: Canva free + ChatGPT + manual effort, or nothing

### Secondary: Digital Marketing Agencies Managing D2C Clients
- Budget: INR 50K+/month
- Pain: scaling content delivery across multiple clients
- Currently using: human designers + fragmented tools

### Market Size
- Indian digital ad spend: INR 70,000 crore by 2026 (FICCI-EY)
- Indian SMBs spending 8-12% of revenue on marketing
- D2C brands specifically: INR 10K-2L/month on content at growth stage

---

## 6. Pricing

| Plan | Price | For | Includes |
|---|---|---|---|
| Starter | INR 4,999/mo | Solo D2C founders | 1 brand, 30 posts, 3 platforms |
| Growth | INR 14,999/mo | Growing D2C (5-50L rev) | 90 posts, all platforms, ads, email |
| Pro | INR 29,999/mo | Established D2C (50L-5Cr) | Unlimited, human QA review |
| Agency | INR 49,999/mo | Agencies with D2C clients | 10 brands, white-label, API |

Cost per generation: ~INR 250-350 (Claude API + FLUX images)
Gross margin: 93-97% across all tiers

### Why This Pricing Works
- Starter undercuts Predis.ai ($32/mo) while offering multi-format (not just social)
- Growth beats Lately.ai ($239/mo) at 1/3 the price with 10x more output types
- Pro competes with Kimp ($699/mo) at less than half, with AI speed
- All priced in INR — zero currency friction

---

## 7. Go-To-Market

### Phase 1: Validate (Week 1-2)
- Build MVP pipeline (FastAPI + Claude + FLUX)
- Use Pluto (our own app) as Case Study #1
- Generate Pluto's 30-day content calendar as portfolio piece

### Phase 2: First Clients (Week 3-6)
- Pick 10-15 D2C brands on Instagram (1K-50K followers, mediocre content)
- Generate free sample content using their product photos
- DM/email: "Here's your content for next month. Free. No strings."
- Demo: show their brand going through the pipeline live
- Close 2-3 clients at Starter/Growth tier

### Phase 3: Iterate (Month 2-3)
- Tune prompts based on real client feedback
- Build simple client portal (brand upload + content download)
- Collect testimonials and case studies
- Start content marketing with real results

### Phase 4: Scale (Month 4-6)
- Automated onboarding
- Add video script generation
- Launch on ProductHunt
- Target: 10-15 clients = INR 1.5-4.5L/month

---

## 8. Technical Architecture (MVP)

### Stack
- Backend: Python FastAPI (same as Pluto ML API — no new stack)
- Database: Supabase PostgreSQL (shared infra with Pluto)
- Storage: Supabase Storage (brand assets, generated images)
- LLM: Claude Sonnet (creation) + Claude Haiku (validation)
- Image: FLUX via Replicate API (pay-per-use)
- Frontend: None for MVP. Deliver via Google Drive + Notion

### Core Loop
```
Input → Brand Context → Creator LLM → Validator LLM → Output
                                ↑              |
                                └── feedback ←─┘  (max 3 loops)
```

### What We Build in 2 Weeks
Week 1: Brand ingestion + Creator module + Validator loop
Week 2: Output formatter + Pluto case study + Demo script

### What We DON'T Build Yet
- Frontend portal (after 5 paying clients)
- Auto-publishing to platforms (after clients ask)
- Video generation (after static content is validated)
- Vector DB for brand memory (after 10+ brands)

---

## 9. Risks and Mitigations

| Risk | Mitigation |
|---|---|
| Output still feels like AI slop | Validator loop + banned word lists + brand voice injection. Human QA on Pro tier. Iterate prompts aggressively based on client rejection data |
| Consumer backlash against AI content | Position as "AI-assisted, human-approved." Pro tier includes human review. Never claim "fully automated" publicly |
| Canva/Adobe add similar features | They're horizontal tools. We're vertical (Indian D2C + full calendar from one input). Speed of niche focus beats feature parity |
| Client churn | Store brand kits, past content, learned preferences. Switching cost = rebuilding from scratch. Monthly content calendars create ongoing dependency |
| Price sensitivity in Indian SMB | INR 4,999 starter is less than one freelancer day rate. ROI argument: 30 posts for the price of 2-3 manual ones |
| LLM costs increase | 93-97% margins give massive buffer. Can switch models (Claude/GPT/Llama). Costs have only decreased historically |
