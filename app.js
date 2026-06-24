/**
 * CareerAI — AI Job Assistant
 * Open-source AI integration (HuggingFace Inference API)
 * with intelligent built-in fallback engine
 */

/* ════════════════════════════════════════════
   STATE
════════════════════════════════════════════ */
const state = {
  messages: [],
  hfToken: localStorage.getItem('hf_token') || '',
  model: localStorage.getItem('hf_model') || 'mistralai/Mistral-7B-Instruct-v0.2',
  isTyping: false,
  useHF: false,
};

/* ════════════════════════════════════════════
   DOM REFERENCES
════════════════════════════════════════════ */
const $ = id => document.getElementById(id);
const chatMessages   = $('chat-messages');
const chatInput      = $('chat-input');
const sendBtn        = $('send-btn');
const welcomeScreen  = $('welcome-screen');
const toast          = $('toast');
const apiModal       = $('api-modal');
const hfTokenInput   = $('hf-token-input');
const modelSelect    = $('model-select');
const modelBadgeName = $('model-badge-name');
const modelStatusTxt = $('model-status-text');
const headerStatus   = $('header-status');
const apiBtnText     = $('api-btn-text');
const charCount      = $('char-count');

/* ════════════════════════════════════════════
   INIT
════════════════════════════════════════════ */
function init() {
  updateModelBadge();

  // Restore token if saved
  if (state.hfToken) {
    hfTokenInput.value = state.hfToken;
    state.useHF = true;
    updateModelBadge();
  }

  if (modelSelect) {
    modelSelect.value = state.model;
  }

  setupEventListeners();
  autoResizeInput();
}

/* ════════════════════════════════════════════
   EVENT LISTENERS
════════════════════════════════════════════ */
function setupEventListeners() {
  // Send button
  sendBtn.addEventListener('click', handleSend);

  // Enter key (Shift+Enter = newline)
  chatInput.addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  });

  // Auto-resize textarea
  chatInput.addEventListener('input', () => {
    autoResizeInput();
    const len = chatInput.value.length;
    charCount.textContent = `${len} / 1000`;
    sendBtn.disabled = len === 0 || state.isTyping;
  });

  // Quick prompt cards
  document.querySelectorAll('[data-prompt]').forEach(el => {
    el.addEventListener('click', () => {
      const prompt = el.getAttribute('data-prompt');
      if (prompt) {
        chatInput.value = prompt;
        autoResizeInput();
        charCount.textContent = `${prompt.length} / 1000`;
        sendBtn.disabled = false;
        handleSend();
      }
    });
  });

  // Sidebar topic buttons
  document.querySelectorAll('[data-topic]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('[data-topic]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const topic = btn.getAttribute('data-topic');
      const suggestions = getTopicSuggestion(topic);
      if (suggestions && chatInput) {
        chatInput.value = suggestions;
        chatInput.focus();
        autoResizeInput();
        charCount.textContent = `${suggestions.length} / 1000`;
        sendBtn.disabled = false;
      }
    });
  });

  // Clear chat
  [$('clear-chat-btn'), $('header-clear-btn')].forEach(btn => {
    if (btn) btn.addEventListener('click', clearChat);
  });

  // Export chat
  const exportBtn = $('export-chat-btn');
  if (exportBtn) exportBtn.addEventListener('click', exportChat);

  // Open API modal
  [$('open-api-btn'), $('header-api-btn')].forEach(btn => {
    if (btn) btn.addEventListener('click', () => openModal());
  });

  // Modal close
  $('modal-close-btn').addEventListener('click', closeModal);
  $('use-fallback-btn').addEventListener('click', () => {
    state.useHF = false;
    state.hfToken = '';
    localStorage.removeItem('hf_token');
    updateModelBadge();
    closeModal();
    showToast('✅ Using built-in intelligent engine');
  });

  $('save-token-btn').addEventListener('click', saveApiKey);

  // Click outside modal
  apiModal.addEventListener('click', e => {
    if (e.target === apiModal) closeModal();
  });

  // Sidebar btn ids
  $('btn-all') && document.querySelectorAll('.sidebar-btn[data-topic]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.sidebar-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });
}

/* ════════════════════════════════════════════
   SEND MESSAGE
════════════════════════════════════════════ */
async function handleSend() {
  const text = chatInput.value.trim();
  if (!text || state.isTyping) return;

  // Hide welcome, add user message
  hideWelcome();
  addMessage('user', text);

  chatInput.value = '';
  autoResizeInput();
  charCount.textContent = '0 / 1000';
  sendBtn.disabled = true;
  state.isTyping = true;

  // Show typing
  const typingEl = showTypingIndicator();

  try {
    let response;
    if (state.useHF && state.hfToken) {
      response = await callHuggingFace(text);
    } else {
      // Simulate a small delay for realism
      await delay(800 + Math.random() * 600);
      response = getFallbackResponse(text);
    }

    removeTypingIndicator(typingEl);
    addMessage('ai', response);

  } catch (err) {
    removeTypingIndicator(typingEl);
    console.error('AI Error:', err);

    // Graceful fallback on API error
    const fallback = getFallbackResponse(text);
    addMessage('ai', fallback + '\n\n*Note: AI API is unavailable, using built-in engine.*');
    showToast('⚠️ API unavailable — using built-in engine', true);
  }

  state.isTyping = false;
  sendBtn.disabled = chatInput.value.length === 0;
}

/* ════════════════════════════════════════════
   HUGGING FACE INFERENCE API
════════════════════════════════════════════ */
async function callHuggingFace(userMessage) {
  const systemPrompt = `You are CareerAI, an expert job assistant. You help users with:
- Resume writing and optimization
- Interview preparation and practice
- Salary negotiation strategies
- Career growth and planning
- LinkedIn profile optimization
- Cover letter writing
- Career transitions and switching
- Job search strategies

Provide detailed, actionable, and encouraging advice. Use bullet points and clear structure.
Keep responses focused, practical and motivating. Be professional yet friendly.`;

  const prompt = `<s>[INST] <<SYS>>\n${systemPrompt}\n<</SYS>>\n\n${userMessage} [/INST]`;

  const response = await fetch(
    `https://api-inference.huggingface.co/models/${state.model}`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${state.hfToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputs: prompt,
        parameters: {
          max_new_tokens: 512,
          temperature: 0.7,
          top_p: 0.92,
          repetition_penalty: 1.15,
          return_full_text: false,
        },
      }),
    }
  );

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error || `HTTP ${response.status}`);
  }

  const data = await response.json();

  // Extract generated text
  let text = '';
  if (Array.isArray(data) && data[0]?.generated_text) {
    text = data[0].generated_text;
  } else if (data.generated_text) {
    text = data.generated_text;
  } else {
    throw new Error('Unexpected API response format');
  }

  return text.trim();
}

/* ════════════════════════════════════════════
   FALLBACK INTELLIGENT ENGINE
   Covers 40+ job-related questions
════════════════════════════════════════════ */
function getFallbackResponse(input) {
  const q = input.toLowerCase();

  // ── RESUME ──
  if (matches(q, ['resume mistake', 'resume error', 'resume wrong', 'avoid in resume'])) {
    return formatResponse('📝 Top 5 Resume Mistakes to Avoid', [
      '**1. Using a Generic Objective Statement** — Replace with a punchy *Professional Summary* tailored to each role.',
      '**2. Listing Duties Instead of Achievements** — Use action verbs + metrics. Instead of "Managed team", write "Led a team of 8, increasing output by 35%."',
      '**3. Including Irrelevant Information** — No photos, marital status, or unrelated jobs older than 10 years.',
      '**4. Poor Formatting & ATS Incompatibility** — Use a clean single-column format. Avoid tables, graphics, or unusual fonts that break ATS parsers.',
      '**5. Typos and Inconsistencies** — Proofread 3× and use tools like Grammarly. Check date formats are consistent throughout.',
    ], '💡 Pro tip: Tailor your resume keywords to match each job description — ATS systems scan for exact matches!');
  }

  if (matches(q, ['how to write a resume', 'write my resume', 'good resume', 'strong resume', 'resume tips'])) {
    return formatResponse('📄 How to Write a Winning Resume', [
      '**Header** — Name, phone, professional email, LinkedIn URL, and city/state (not full address).',
      '**Professional Summary** — 2-3 sentences highlighting your top skills and value proposition.',
      '**Work Experience** — Reverse chronological order. Use the formula: *Action Verb + Task + Result with Numbers*.',
      '**Skills Section** — Hard skills (tools, languages, software) + soft skills relevant to the role.',
      '**Education** — Degree, institution, graduation year. Add GPA only if above 3.5.',
      '**Certifications & Projects** — Include relevant courses, certifications, and personal projects with links.',
      '**Length** — 1 page for <10 years exp; 2 pages for senior professionals.',
    ], '🎯 Always customize your resume for each application. Use keywords from the job description!');
  }

  if (matches(q, ['ats', 'applicant tracking', 'pass ats', 'beat ats'])) {
    return formatResponse('🤖 How to Beat ATS (Applicant Tracking Systems)', [
      '**Use Standard Section Headings** — "Work Experience", "Education", "Skills" — not creative names.',
      '**Mirror Job Description Keywords** — Copy exact phrases from the posting into your resume.',
      '**Avoid Graphics & Tables** — Use plain text. ATS cannot read images, text boxes, or columns.',
      '**Use Standard Fonts** — Arial, Calibri, Times New Roman. Size 10-12pt body, 14-16pt headers.',
      '**File Format** — Submit .docx or .pdf as specified. .docx is safest for ATS.',
      '**No Headers/Footers** — Put your contact info in the main body, not in header/footer areas.',
    ], '📊 Studies show 75% of resumes are rejected by ATS before a human sees them. Optimization is critical!');
  }

  // ── INTERVIEW ──
  if (matches(q, ['interview question', 'common interview', 'interview answer', 'interview prepare', 'prepare for interview'])) {
    return formatResponse('🎯 Top Interview Questions & How to Answer Them', [
      '**"Tell me about yourself"** — 60-second pitch: your background → key achievements → why this role excites you.',
      '**"Why do you want this job?"** — Research the company. Connect their mission to your passion and skills.',
      '**"What\'s your greatest strength?"** — Give a specific strength + real example + measurable result.',
      '**"What\'s your weakness?"** — Choose a real weakness you\'ve actively improved. Show self-awareness.',
      '**"Where do you see yourself in 5 years?"** — Show ambition aligned with the company\'s growth trajectory.',
      '**"Why are you leaving your current job?"** — Keep it positive. Focus on growth, not complaints.',
      '**"Tell me about a challenge you faced"** — Use the STAR method: Situation → Task → Action → Result.',
    ], '⭐ Use the STAR method (Situation, Task, Action, Result) for behavioral questions — it\'s the gold standard!');
  }

  if (matches(q, ['star method', 'behavioral question', 'tell me about a time'])) {
    return formatResponse('⭐ Mastering the STAR Method', [
      '**S — Situation:** Set the scene briefly. What was the context? (1-2 sentences)',
      '**T — Task:** What was YOUR specific responsibility in that situation?',
      '**A — Action:** Describe the specific steps YOU took. Use "I" not "we".',
      '**R — Result:** What was the measurable outcome? Quantify whenever possible.',
      '',
      '**Example:** "Tell me about a time you handled conflict"',
      '*S: Two team members disagreed on project direction.*',
      '*T: As team lead, I needed to resolve it quickly.*',
      '*A: I facilitated a 30-min meeting, heard both sides, and proposed a hybrid approach.*',
      '*R: The project delivered on time with both team members satisfied.*',
    ], '💡 Prepare 5-6 STAR stories before any interview. Most behavioral questions can be answered with them!');
  }

  if (matches(q, ['interview tip', 'ace interview', 'nail interview', 'interview advice'])) {
    return formatResponse('🎤 Interview Tips to Stand Out', [
      '**Research Deeply** — Know the company\'s mission, recent news, products, and competitors.',
      '**Prepare Smart Questions** — Ask about team culture, growth opportunities, and success metrics for the role.',
      '**Dress Appropriately** — When in doubt, dress one level above the company culture.',
      '**Arrive Early** — 10-15 minutes for in-person; test tech 30 mins before virtual interviews.',
      '**Mirror & Match** — Match the interviewer\'s energy and communication style.',
      '**Send a Thank-You Email** — Within 24 hours, thank each interviewer by name with a specific callback.',
      '**Follow Up** — If no response in a week, send a polite follow-up email.',
    ], '🏆 Remember: An interview is a two-way conversation. You\'re also evaluating if THEY\'re right for you!');
  }

  // ── SALARY ──
  if (matches(q, ['salary negotiat', 'negotiate salary', 'negotiate pay', 'negotiate offer', 'higher salary'])) {
    return formatResponse('💰 How to Negotiate Your Salary Successfully', [
      '**Research First** — Use Glassdoor, Levels.fyi, LinkedIn Salary, and PayScale to know the market rate.',
      '**Let Them Go First** — Avoid sharing your number first. Say "I\'d love to understand the budgeted range."',
      '**Anchor High** — Start 15-20% above your target. It anchors the negotiation in your favor.',
      '**Silence is Power** — After stating your number, stop talking. Let them respond.',
      '**Never Accept on the Spot** — "I\'m very excited! Can I have 24-48 hours to review the full package?"',
      '**Negotiate the Full Package** — Bonus, equity, remote work, vacation days, signing bonus, learning budget.',
      '**If They Can\'t Move on Salary** — Ask for a 3-month review with a raise target tied to milestones.',
    ], '📈 Research shows 70% of employers expect negotiation. Not negotiating costs the average professional $1M+ over their career!');
  }

  if (matches(q, ['what salary', 'salary expectation', 'expected salary', 'salary range'])) {
    return formatResponse('💵 How to Handle "What Are Your Salary Expectations?"', [
      '**Do Research First** — Know the market rate for your role, location, and experience level.',
      '**Deflect Initially** — "I\'m flexible. Could you share the budgeted range for this role?"',
      '**Give a Range if Pressed** — Make the low end your target. E.g., if you want $85K, say "$85K-$95K."',
      '**Justify Your Number** — "Based on my X years in [skill], and market data from [source], I\'m targeting..."',
      '**Don\'t Lowball Yourself** — Underselling is worse than overshooting slightly.',
      '**Consider Total Comp** — Base salary + bonus + equity + benefits = total compensation.',
    ], '💡 Pro tip: "I\'m open to discussing compensation based on the full scope of the role" buys you time to research!');
  }

  // ── LINKEDIN ──
  if (matches(q, ['linkedin', 'linked in profile', 'linkedin tip', 'linkedin optimization', 'linkedin recruiter'])) {
    return formatResponse('🔗 LinkedIn Profile Optimization Guide', [
      '**Profile Photo** — Professional headshot. Smiling, well-lit, simple background. Gets 14x more views.',
      '**Headline** — Don\'t just put job title. Use: *Role | Key Skill | Value you offer*. Ex: "Full-Stack Dev | React & Node.js | Building Scalable Web Apps"',
      '**About Section** — First 2 lines hook the reader (they show without clicking "more"). Tell your story + what you offer.',
      '**Experience** — Same achievement-focused bullets as your resume. Add media (links, images, videos).',
      '**Skills & Endorsements** — Add 15+ relevant skills. Get endorsements from colleagues for top skills.',
      '**Open to Work** — Set to "Recruiters only" if currently employed. Dramatically increases recruiter outreach.',
      '**Creator Mode** — Turn it on to grow your audience and rank higher in search.',
      '**Engage Weekly** — Comment thoughtfully on 5 posts/week. Post content 1-2x per week to boost visibility.',
    ], '📊 LinkedIn profiles with a photo get 21x more views. Profiles with skills get 5x more connection requests!');
  }

  // ── COVER LETTER ──
  if (matches(q, ['cover letter', 'application letter', 'write cover', 'cover lette'])) {
    return formatResponse('✉️ How to Write a Compelling Cover Letter', [
      '**Opening Hook (Paragraph 1)** — Don\'t start with "I am applying for..." Instead: "When I saw [Company]\'s mission to [X], I knew I had to reach out."',
      '**Your Value Proposition (Paragraph 2)** — 2-3 specific achievements that directly address their needs.',
      '**Why THIS Company (Paragraph 3)** — Show genuine research. Reference their products, culture, recent news.',
      '**Strong Closing** — State your enthusiasm, availability, and a confident call-to-action.',
      '**Length** — 3-4 paragraphs, under 400 words. Hiring managers spend 30-60 seconds on cover letters.',
      '**Customize Each One** — A generic cover letter is worse than none. Personalize every application.',
      '**Match Their Tone** — Startup = casual & bold. Corporate = professional & formal.',
    ], '✨ A great cover letter tells the story your resume can\'t — personality, passion, and cultural fit!');
  }

  // ── CAREER SWITCH ──
  if (matches(q, ['career switch', 'career change', 'change career', 'switch career', 'different career', 'new field', 'transition'])) {
    return formatResponse('🔄 How to Successfully Switch Careers', [
      '**Assess Transferable Skills** — List skills from your current career that apply to the new field.',
      '**Fill the Gap** — Take online courses (Coursera, edX, LinkedIn Learning, Udemy) for missing skills.',
      '**Build a Portfolio** — Do freelance projects, open-source contributions, or personal projects to show, not tell.',
      '**Network Strategically** — LinkedIn + industry meetups + informational interviews with people in your target role.',
      '**Reframe Your Story** — Your "unrelated" background is a unique advantage. Emphasize cross-industry perspective.',
      '**Target Transition-Friendly Companies** — Startups and growth-stage companies are more open to non-traditional backgrounds.',
      '**Consider a Bridge Role** — A role that combines elements of both careers eases the transition.',
      '**Be Patient** — Most career transitions take 6-18 months. Consistency beats urgency.',
    ], '💪 Many successful people switched careers mid-life. Your diverse background is a strength, not a weakness!');
  }

  // ── JOB SEARCH ──
  if (matches(q, ['job search', 'find job', 'how to find', 'job hunting', 'job application', 'apply for job'])) {
    return formatResponse('🔍 Smart Job Search Strategy', [
      '**Use Multiple Channels** — LinkedIn (35%), Indeed, Glassdoor, company websites, niche job boards for your industry.',
      '**The 80/20 Rule** — 80% of jobs are filled through networking, not job boards. Prioritize people over portals.',
      '**Set Up Job Alerts** — On LinkedIn and Indeed for your target role + location. Apply within 24-48 hours of posting.',
      '**Tailor Each Application** — Customize your resume and cover letter for every role (especially top targets).',
      '**Track Everything** — Use a spreadsheet or Notion to track applications, follow-ups, and status.',
      '**Reach Out Directly** — Find the hiring manager on LinkedIn and send a personalized connection note.',
      '**Company-First Strategy** — Make a list of 20-30 dream companies and target them proactively.',
      '**Apply Consistently** — Aim for 5-10 quality applications per week over many weeks.',
    ], '📌 Quality > Quantity. 10 tailored applications beat 100 generic ones every time!');
  }

  // ── CAREER GROWTH ──
  if (matches(q, ['career growth', 'get promoted', 'promotion', 'career development', 'advance career', 'career advice'])) {
    return formatResponse('🚀 Career Growth & Getting Promoted', [
      '**Exceed Expectations** — Don\'t just meet your KPIs. Find ways to deliver 20-30% more value.',
      '**Build Visibility** — Great work in silence gets overlooked. Share wins with your manager regularly.',
      '**Develop Leadership Skills** — Volunteer to lead projects, mentor juniors, or run meetings.',
      '**Expand Your Network** — Internal relationships matter as much as external ones for promotions.',
      '**Get a Mentor** — Find someone 2-3 levels above you for guidance, sponsorship, and career intel.',
      '**Ask for Feedback** — Schedule regular 1:1s and explicitly ask "What do I need to do to reach the next level?"',
      '**Document Your Impact** — Keep a "wins journal" — you\'ll need it for performance reviews and negotiations.',
      '**Upskill Continuously** — Stay ahead of your industry with courses, certifications, and conferences.',
    ], '🎯 The biggest career mistake is waiting to be noticed. Advocate for yourself actively and consistently!');
  }

  // ── NETWORKING ──
  if (matches(q, ['network', 'networking', 'connect with people', 'build connection', 'informational interview'])) {
    return formatResponse('🤝 How to Network Effectively', [
      '**Lead with Giving** — Offer help, share articles, make introductions before asking for anything.',
      '**Informational Interviews** — "Could we have a 20-min chat? I\'m exploring roles in [field] and would love your insights."',
      '**LinkedIn Cold Outreach** — Personalized note referencing something specific about them. Keep it short.',
      '**Attend Events** — Industry conferences, meetups, webinars, alumni events. Show up consistently.',
      '**Follow Up** — After meeting someone, connect on LinkedIn within 24 hours with a personal note.',
      '**Maintain Relationships** — Comment on their posts, share relevant articles, check in every 3-6 months.',
      '**Your Alumni Network** — Your college alumni are one of the most underused career resources.',
    ], '💬 "Your network is your net worth." The majority of jobs are filled through referrals!');
  }

  // ── REMOTE WORK ──
  if (matches(q, ['remote job', 'work from home', 'remote work', 'remote position', 'remote opportunity'])) {
    return formatResponse('🏠 How to Land Remote Jobs', [
      '**Best Platforms** — Remote.co, We Work Remotely, Flex Jobs, Remote OK, LinkedIn (filter: remote).',
      '**Highlight Remote Skills** — Self-management, async communication, video conferencing tools (Zoom, Slack, Notion).',
      '**Time Zone Flexibility** — Many remote companies value overlap availability. Mention your flexibility.',
      '**Home Office Setup** — Mention a professional home office setup — it signals you\'re ready to work remotely.',
      '**Showcase Async Communication** — Strong written communication is the #1 remote work skill. Let your emails/cover letters demonstrate it.',
      '**Research Remote Culture** — Check if the company is truly remote-first or just remote-tolerant.',
    ], '🌍 Remote work has exploded post-2020. Tech, marketing, finance, and design are most remote-friendly fields!');
  }

  // ── FRESHER / FIRST JOB ──
  if (matches(q, ['first job', 'fresher', 'no experience', 'entry level', 'fresh graduate', 'new graduate', 'student'])) {
    return formatResponse('🎓 Landing Your First Job as a Fresher', [
      '**Focus on Projects** — No work experience? Build projects! GitHub, portfolio sites, hackathons, and case studies count.',
      '**Internships First** — Even unpaid internships open doors. They convert to jobs 60% of the time.',
      '**Leverage Campus Resources** — Career fairs, alumni networks, placement cells, and professor referrals.',
      '**Certifications Matter** — Google, AWS, HubSpot, and Coursera certs demonstrate initiative and skill.',
      '**Tailor the Resume** — Lead with skills and projects, then education. Work experience section can be thin.',
      '**Apply Widely** — Entry-level is competitive. Apply to 15-20 roles per week consistently.',
      '**Be Open to Smaller Companies** — Startups offer more learning, responsibility, and career growth early on.',
      '**LinkedIn at Day 1** — Build your profile now. Many recruiters specifically source fresh graduates.',
    ], '💡 Everyone starts somewhere. Focus on demonstrating *potential* and *willingness to learn* — that\'s what freshers win on!');
  }

  // ── SOFT SKILLS ──
  if (matches(q, ['soft skill', 'communication skill', 'leadership skill', 'teamwork', 'emotional intelligence'])) {
    return formatResponse('🧠 Top Soft Skills Employers Want in 2025', [
      '**Communication** — Clear written + verbal communication. Crucial for remote and hybrid environments.',
      '**Adaptability** — The ability to learn and adjust quickly in a changing workplace.',
      '**Emotional Intelligence (EQ)** — Self-awareness, empathy, and relationship management.',
      '**Problem-Solving** — Creative thinking and structured approach to finding solutions.',
      '**Collaboration** — Working effectively across teams, cultures, and functions.',
      '**Time Management** — Prioritizing tasks and meeting deadlines consistently.',
      '**Leadership** — Taking initiative, influencing others, and driving outcomes even without formal authority.',
      '**Growth Mindset** — Embracing feedback and continuous learning without defensiveness.',
    ], '📊 93% of employers say soft skills are equally important or more important than technical skills!');
  }

  // ── REJECTION ──
  if (matches(q, ['rejection', 'rejected', 'not selected', 'ghosted', 'no response', 'didn\'t get the job'])) {
    return formatResponse('💪 Handling Job Rejection Like a Pro', [
      '**It\'s Normal** — Even top candidates get rejected. Every rejection is statistically closer to your yes.',
      '**Ask for Feedback** — Email: "Thank you for the opportunity. Could you share any feedback to help me improve?"',
      '**Review & Improve** — Look for patterns in rejections. Resume? Interview stage? Culture fit?',
      '**Reframe Rejection** — It often means misalignment, not failure. The wrong role is a blessing.',
      '**Maintain Momentum** — Keep applying. Stopping after rejection is the biggest job search killer.',
      '**Process the Emotion** — It\'s okay to feel disappointed. Give yourself 24 hours, then get back to it.',
      '**Build Resilience** — Most people find their jobs after 50-100+ applications and 3-10+ interviews.',
    ], '🌟 J.K. Rowling was rejected 12 times. Steve Jobs was fired. Every successful career has rejection in it. Keep going!');
  }

  // ── SKILLS / LEARNING ──
  if (matches(q, ['what skill', 'learn skill', 'in demand skill', 'top skill', 'skill 2024', 'skill 2025', 'trending skill'])) {
    return formatResponse('📈 Most In-Demand Skills in 2025', [
      '**AI & Machine Learning** — Prompt engineering, LLMs, Python for AI, TensorFlow/PyTorch.',
      '**Data & Analytics** — SQL, Power BI, Tableau, Python (pandas, numpy), data storytelling.',
      '**Cloud Computing** — AWS, Azure, GCP certifications. Cloud is now the standard infrastructure.',
      '**Cybersecurity** — Ethical hacking, network security, compliance. Massive global shortage of talent.',
      '**Full-Stack Development** — React, Node.js, TypeScript, REST APIs, databases.',
      '**Product Management** — Market research, roadmapping, Agile/Scrum, stakeholder management.',
      '**Digital Marketing** — SEO, paid ads, content strategy, email marketing, analytics.',
      '**UX/UI Design** — Figma, user research, accessibility, design systems.',
    ], '🔥 AI skills are the hottest in 2025. Even non-tech roles benefit from knowing how to use AI tools!');
  }

  // ── GENERAL JOB QUESTIONS ──
  if (matches(q, ['what is cv', 'cv vs resume', 'difference between cv', 'cv or resume'])) {
    return formatResponse('📋 CV vs. Resume — Key Differences', [
      '**Resume:** Short (1-2 pages), tailored to a specific job, highlights relevant experience only.',
      '**CV (Curriculum Vitae):** Comprehensive (2-10+ pages), lists entire academic/professional history.',
      '**When to use Resume:** Most private sector jobs in the US, Canada, and Australia.',
      '**When to use CV:** Academic positions, research roles, medical/scientific fields, and jobs in Europe/Asia.',
      '**In India:** "CV" and "Resume" are often used interchangeably, but keep it to 2 pages max.',
    ], '💡 For most job applications, a well-crafted 1-2 page resume is the standard. Save the full CV for academia!');
  }

  if (matches(q, ['freelance', 'freelancing', 'work freelance', 'self employed', 'side hustle'])) {
    return formatResponse('💼 Getting Started with Freelancing', [
      '**Choose Your Niche** — Be specific. "Web developer for SaaS startups" wins over "web developer".',
      '**Build a Portfolio First** — Do 2-3 free or discounted projects to showcase your work.',
      '**Use Platforms** — Upwork, Toptal, Fiverr (creative work), 99designs (design), Gun.io (developers).',
      '**Set Your Rate** — Calculate: (annual salary goal + expenses + taxes) ÷ billable hours = hourly rate.',
      '**Network Locally** — Local businesses often prefer local freelancers they can meet in person.',
      '**Create a Simple Website** — Your portfolio site is your most powerful freelance sales tool.',
      '**Treat it Like a Business** — Track income, set aside 25-30% for taxes, create contracts for every client.',
    ], '🚀 Freelancing income can equal or exceed full-time salaries within 1-2 years of consistent effort!');
  }

  // ── DEFAULT ──
  return formatResponse('🤖 CareerAI at Your Service!', [
    'I\'m your dedicated job assistant, ready to help with:',
    '',
    '📄 **Resume Writing** — Crafting ATS-optimized, achievement-focused resumes',
    '🎯 **Interview Preparation** — Mock questions, STAR method, insider tips',
    '💰 **Salary Negotiation** — Research, scripts, and strategies to get paid more',
    '🔗 **LinkedIn Optimization** — Profile tips to attract recruiters',
    '✉️ **Cover Letters** — Compelling stories that get you noticed',
    '🔄 **Career Switching** — Roadmap for transitioning to a new field',
    '🚀 **Career Growth** — How to get promoted and advance faster',
    '🔍 **Job Search Strategy** — Smart tactics to land interviews',
  ], 'Try asking me a specific question like: *"How do I write a resume for my first job?"* or *"How do I negotiate salary?"*');
}

/* ════════════════════════════════════════════
   RESPONSE FORMATTER
════════════════════════════════════════════ */
function formatResponse(title, bullets, tip = '') {
  let html = `<h3>${title}</h3>`;
  html += '<ul>';
  bullets.forEach(b => {
    if (b === '') { html += '</ul><ul>'; return; }
    const formatted = b
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>');
    html += `<li>${formatted}</li>`;
  });
  html += '</ul>';
  if (tip) {
    const formattedTip = tip
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>');
    html += `<p style="margin-top:10px; padding: 8px 12px; border-left: 3px solid #7c3aed; color: #c4b5fd;">${formattedTip}</p>`;
  }
  return html;
}

/* Keyword matcher */
function matches(q, keywords) {
  return keywords.some(kw => q.includes(kw));
}

/* ════════════════════════════════════════════
   TOPIC SUGGESTIONS
════════════════════════════════════════════ */
function getTopicSuggestion(topic) {
  const suggestions = {
    resume:    'How do I write a strong, ATS-optimized resume?',
    interview: 'What are the most common interview questions and how should I answer them?',
    salary:    'How do I negotiate a higher salary without losing the job offer?',
    career:    'How can I grow my career and get promoted faster?',
    linkedin:  'How do I optimize my LinkedIn profile to attract recruiters?',
    cover:     'How do I write a compelling cover letter that gets noticed?',
    switch:    'How do I switch careers successfully with transferable skills?',
    all:       '',
  };
  return suggestions[topic] || '';
}

/* ════════════════════════════════════════════
   MESSAGE RENDERING
════════════════════════════════════════════ */
function addMessage(role, content) {
  const isUser = role === 'user';
  const id = `msg-${Date.now()}`;
  const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  state.messages.push({ role, content, time });

  const el = document.createElement('div');
  el.className = `message ${isUser ? 'user-message' : 'ai-message'}`;
  el.id = id;

  const avatarEl = `<div class="msg-avatar" aria-hidden="true">${isUser ? '👤' : '🤖'}</div>`;
  const formattedContent = isUser
    ? escapeHtml(content).replace(/\n/g, '<br>')
    : formatAIContent(content);

  const actionsHtml = `
    <div class="msg-actions">
      <button class="msg-action-btn" onclick="copyMessage('${id}')" aria-label="Copy message">📋 Copy</button>
      ${!isUser ? `<button class="msg-action-btn" onclick="rateMessage('${id}', 'up')" aria-label="Thumbs up">👍</button>` : ''}
    </div>`;

  el.innerHTML = `
    ${avatarEl}
    <div class="msg-content">
      <div class="msg-bubble" id="bubble-${id}">${formattedContent}</div>
      <div class="msg-meta">
        <span>${isUser ? 'You' : 'CareerAI'}</span>
        <span>•</span>
        <span>${time}</span>
      </div>
      ${actionsHtml}
    </div>`;

  chatMessages.appendChild(el);
  scrollToBottom();
}

/* Format AI response (Markdown-ish) */
function formatAIContent(text) {
  if (text.startsWith('<')) return text; // Already HTML

  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h3>$1</h3>')
    .replace(/^\* (.+)$/gm, '<li>$1</li>')
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    .replace(/^(\d+)\. (.+)$/gm, '<li>$2</li>')
    .replace(/(<li>.*<\/li>\n?)+/g, match => `<ul>${match}</ul>`)
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br>');
}

function escapeHtml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/* ── Typing Indicator ── */
function showTypingIndicator() {
  const el = document.createElement('div');
  el.className = 'typing-indicator';
  el.id = 'typing-indicator';
  el.innerHTML = `
    <div class="msg-avatar" aria-hidden="true">🤖</div>
    <div class="typing-bubble" aria-label="AI is thinking">
      <div class="typing-dot"></div>
      <div class="typing-dot"></div>
      <div class="typing-dot"></div>
    </div>`;
  chatMessages.appendChild(el);
  scrollToBottom();
  return el;
}

function removeTypingIndicator(el) {
  if (el && el.parentNode) el.parentNode.removeChild(el);
}

/* ── Copy Message ── */
function copyMessage(id) {
  const bubble = document.getElementById(`bubble-${id}`);
  if (!bubble) return;
  const text = bubble.innerText || bubble.textContent;
  navigator.clipboard.writeText(text).then(() => {
    showToast('✅ Copied to clipboard!');
  }).catch(() => {
    showToast('❌ Copy failed', true);
  });
}

/* ── Rate Message (thumbs up/down) ── */
function rateMessage(id, dir) {
  showToast(dir === 'up' ? '👍 Thanks for the feedback!' : '👎 Got it, I\'ll improve!');
}

/* ── Scroll ── */
function scrollToBottom() {
  setTimeout(() => {
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }, 50);
}

/* ── Hide Welcome ── */
function hideWelcome() {
  if (welcomeScreen && welcomeScreen.parentNode === chatMessages) {
    welcomeScreen.style.animation = 'fadeInUp 0.3s ease reverse';
    setTimeout(() => {
      if (welcomeScreen.parentNode) welcomeScreen.parentNode.removeChild(welcomeScreen);
    }, 280);
  }
}

/* ── Clear Chat ── */
function clearChat() {
  state.messages = [];
  chatMessages.innerHTML = '';
  chatMessages.appendChild(welcomeScreen);
  welcomeScreen.style.display = 'flex';
  welcomeScreen.style.animation = 'fadeInUp 0.4s ease';
}

/* ── Export Chat ── */
function exportChat() {
  if (!state.messages.length) {
    showToast('💬 No messages to export yet!', true);
    return;
  }
  const text = state.messages
    .map(m => `[${m.role === 'user' ? 'You' : 'CareerAI'}] (${m.time})\n${m.content.replace(/<[^>]+>/g, '')}`)
    .join('\n\n---\n\n');

  const blob = new Blob([`CareerAI Chat Export\n${'='.repeat(40)}\n\n${text}`], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `career-ai-chat-${new Date().toISOString().slice(0, 10)}.txt`;
  a.click();
  URL.revokeObjectURL(url);
  showToast('💾 Chat exported!');
}

/* ════════════════════════════════════════════
   AUTO-RESIZE TEXTAREA
════════════════════════════════════════════ */
function autoResizeInput() {
  chatInput.style.height = 'auto';
  chatInput.style.height = Math.min(chatInput.scrollHeight, 140) + 'px';
}

/* ════════════════════════════════════════════
   API MODAL
════════════════════════════════════════════ */
function openModal() {
  apiModal.classList.remove('hidden');
  hfTokenInput.focus();
}

function closeModal() {
  apiModal.classList.add('hidden');
}

function saveApiKey() {
  const token = hfTokenInput.value.trim();
  const model = modelSelect.value;

  if (!token) {
    showToast('⚠️ Please enter a HuggingFace token', true);
    hfTokenInput.focus();
    return;
  }

  if (!token.startsWith('hf_')) {
    showToast('⚠️ Token should start with "hf_"', true);
    return;
  }

  state.hfToken = token;
  state.model = model;
  state.useHF = true;
  localStorage.setItem('hf_token', token);
  localStorage.setItem('hf_model', model);
  updateModelBadge();
  closeModal();
  showToast('✅ AI model connected! Using ' + model.split('/')[1]);
}

/* ════════════════════════════════════════════
   MODEL BADGE UPDATE
════════════════════════════════════════════ */
function updateModelBadge() {
  if (state.useHF && state.hfToken) {
    const shortName = state.model.split('/')[1] || state.model;
    modelBadgeName.textContent = shortName;
    modelStatusTxt.textContent = 'AI Connected';
    headerStatus.textContent = `${shortName} • Open-source AI active`;
    apiBtnText.textContent = 'AI Connected';
  } else {
    modelBadgeName.textContent = 'Built-in Engine';
    modelStatusTxt.textContent = 'Ready';
    headerStatus.textContent = 'Built-in intelligent engine • Ready to help';
    apiBtnText.textContent = 'Connect AI';
  }
}

/* ════════════════════════════════════════════
   TOAST
════════════════════════════════════════════ */
let toastTimeout;
function showToast(message, isError = false) {
  clearTimeout(toastTimeout);
  toast.textContent = message;
  toast.className = `toast${isError ? ' error' : ''}`;
  toast.classList.remove('hidden');
  toastTimeout = setTimeout(() => toast.classList.add('hidden'), 3500);
}

/* ════════════════════════════════════════════
   UTILITY
════════════════════════════════════════════ */
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/* Expose functions for inline onclick handlers */
window.copyMessage = copyMessage;
window.rateMessage = rateMessage;

/* ════════════════════════════════════════════
   BOOT
════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', init);
