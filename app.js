/* ═══════════════════════════════════════════════════════════════════════
   TripSage AI — Frontend Application Script
   ═══════════════════════════════════════════════════════════════════════ */

"use strict";

/* ── State ─────────────────────────────────────────────────────────────── */
const state = {
  currentSection: "chat",
  theme: localStorage.getItem("tripsage-theme") || "light",
  selectedBudget: "moderate",
  selectedInterests: [],
  messageCount: 0,
  isTyping: false,
};

/* ── Destination Data ──────────────────────────────────────────────────── */
const DESTINATIONS = [
  { id:"goa",        name:"Goa",         emoji:"🏖️", type:"Beach",       country:"india",       season:"Nov–Feb",   cost:"₹15K–₹50K",   highlight:"Beaches & Nightlife",         tag:"beach" },
  { id:"manali",     name:"Manali",      emoji:"🏔️", type:"Mountain",    country:"india",       season:"May–Jun",   cost:"₹12K–₹35K",   highlight:"Snow & Adventure",            tag:"mountain" },
  { id:"kerala",     name:"Kerala",      emoji:"🌿", type:"Nature",      country:"india",       season:"Sep–Mar",   cost:"₹20K–₹60K",   highlight:"Backwaters & Ayurveda",       tag:"india" },
  { id:"rajasthan",  name:"Rajasthan",   emoji:"🏰", type:"Heritage",    country:"india",       season:"Oct–Mar",   cost:"₹18K–₹80K",   highlight:"Forts & Palaces",             tag:"heritage" },
  { id:"varanasi",   name:"Varanasi",    emoji:"🪔", type:"Spiritual",   country:"india",       season:"Oct–Mar",   cost:"₹8K–₹25K",    highlight:"Ghats & Ganga Aarti",         tag:"spiritual" },
  { id:"andaman",    name:"Andaman",     emoji:"🐠", type:"Beach",       country:"india",       season:"Nov–May",   cost:"₹25K–₹70K",   highlight:"Crystal Waters & Scuba",      tag:"beach" },
  { id:"ladakh",     name:"Ladakh",      emoji:"🏔️", type:"Mountain",    country:"india",       season:"Jun–Sep",   cost:"₹20K–₹60K",   highlight:"High Altitude & Monasteries", tag:"mountain" },
  { id:"mysore",     name:"Mysore",      emoji:"🐘", type:"Heritage",    country:"india",       season:"Oct–Feb",   cost:"₹10K–₹30K",   highlight:"Palaces & Dasara Festival",   tag:"heritage" },
  { id:"bali",       name:"Bali",        emoji:"🌺", type:"International",country:"international",season:"Apr–Oct",cost:"₹60K–₹1.5L",  highlight:"Temples & Rice Terraces",     tag:"international" },
  { id:"dubai",      name:"Dubai",       emoji:"🏙️", type:"International",country:"international",season:"Nov–Apr",cost:"₹80K–₹2.5L",  highlight:"Skyscrapers & Desert Safari", tag:"international" },
  { id:"paris",      name:"Paris",       emoji:"🗼", type:"International",country:"international",season:"Apr–Jun",cost:"₹1.5L–₹4L",   highlight:"Eiffel Tower & Cuisine",      tag:"international" },
  { id:"singapore",  name:"Singapore",   emoji:"🦁", type:"International",country:"international",season:"Feb–Apr",cost:"₹80K–₹2L",    highlight:"Gardens & Marina Bay",        tag:"international" },
  { id:"char-dham",  name:"Char Dham",   emoji:"🙏", type:"Pilgrimage",  country:"india",       season:"May–Jun",   cost:"₹15K–₹45K",   highlight:"Sacred Himalayan Shrines",    tag:"spiritual" },
  { id:"coorg",      name:"Coorg",       emoji:"☕", type:"Nature",      country:"india",       season:"Oct–Mar",   cost:"₹12K–₹35K",   highlight:"Coffee Estates & Waterfalls", tag:"india" },
  { id:"shimla",     name:"Shimla",      emoji:"❄️", type:"Mountain",    country:"india",       season:"Dec–Feb",   cost:"₹10K–₹30K",   highlight:"Snow & Colonial Heritage",    tag:"mountain" },
  { id:"thailand",   name:"Thailand",    emoji:"🐘", type:"International",country:"international",season:"Nov–Mar",cost:"₹50K–₹1.2L",  highlight:"Temples & Street Food",       tag:"international" },
];

/* ── DOM Helpers ───────────────────────────────────────────────────────── */
const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

/* ═══════════════════════════════════════════════════════════════════════
   INIT
   ═══════════════════════════════════════════════════════════════════════ */
document.addEventListener("DOMContentLoaded", () => {
  applyTheme(state.theme);
  renderExploreGrid("all");
  renderDestinationCards();
  loadProfile();
  loadItinerary();
  bindEvents();
  autoResizeTextarea($("#chatInput"));
  setDefaultDate();
});

/* ═══════════════════════════════════════════════════════════════════════
   THEME
   ═══════════════════════════════════════════════════════════════════════ */
function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  const icon = $("#themeIcon");
  if (icon) {
    icon.className = theme === "dark" ? "bi bi-sun-fill" : "bi bi-moon-stars-fill";
  }
  state.theme = theme;
  localStorage.setItem("tripsage-theme", theme);
}

/* ═══════════════════════════════════════════════════════════════════════
   SECTION NAVIGATION
   ═══════════════════════════════════════════════════════════════════════ */
function switchSection(sectionId) {
  // Hide hero, show main content
  const hero = $("#heroSection");
  const main = $("#mainContent");
  if (hero) hero.style.display = "none";
  if (main) { main.classList.add("visible"); main.style.display = "block"; }

  // Update sections
  $$(".content-section").forEach(s => s.classList.remove("active"));
  const target = $(`#section-${sectionId}`);
  if (target) target.classList.add("active");

  // Update nav pills
  $$(".nav-pill").forEach(a => a.classList.remove("active"));
  const activeLink = $$(`.nav-pill[data-section="${sectionId}"]`);
  activeLink.forEach(a => a.classList.add("active"));

  state.currentSection = sectionId;

  // Close mobile nav
  const navCollapse = document.getElementById("navMenu");
  if (navCollapse && navCollapse.classList.contains("show")) {
    const toggler = $(".navbar-toggler");
    if (toggler) toggler.click();
  }

  // Scroll to top of main
  window.scrollTo({ top: 0, behavior: "smooth" });

  // Section-specific init
  if (sectionId === "dashboard") loadDashboard();
}

/* ═══════════════════════════════════════════════════════════════════════
   BIND ALL EVENTS
   ═══════════════════════════════════════════════════════════════════════ */
function bindEvents() {

  /* Theme toggle */
  $("#themeToggle")?.addEventListener("click", () =>
    applyTheme(state.theme === "dark" ? "light" : "dark")
  );

  /* Hero → Start Planning */
  $("#startPlanningBtn")?.addEventListener("click", () => switchSection("chat"));
  $(".hero-scroll-hint")?.addEventListener("click", () => switchSection("chat"));

  /* Nav pills */
  $$(".nav-pill").forEach(link => {
    link.addEventListener("click", e => {
      e.preventDefault();
      const section = link.dataset.section;
      if (section) switchSection(section);
    });
  });

  /* ── CHAT ── */
  const sendBtn   = $("#sendBtn");
  const chatInput = $("#chatInput");

  sendBtn?.addEventListener("click", sendChatMessage);
  chatInput?.addEventListener("keydown", e => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendChatMessage();
    }
  });

  // Quick chips
  document.addEventListener("click", e => {
    if (e.target.classList.contains("chip")) {
      sendQuickMsg(e.target.dataset.msg);
    }
  });

  // Shortcut buttons
  $$(".shortcut-btn").forEach(btn => {
    btn.addEventListener("click", () => sendQuickMsg(btn.dataset.msg));
  });

  // Style cards
  $$(".style-card").forEach(card => {
    card.addEventListener("click", () => {
      const msg = card.dataset.msg;
      if (msg) { switchSection("chat"); sendQuickMsg(msg); }
    });
  });

  // Clear chat
  $("#clearChatBtn")?.addEventListener("click", clearChat);

  // Export chat
  $("#exportChatBtn")?.addEventListener("click", exportChat);

  // Voice input
  $("#voiceBtn")?.addEventListener("click", startVoiceInput);

  /* ── QUICK PLAN FORM ── */
  $("#quickPlanForm")?.addEventListener("submit", async e => {
    e.preventDefault();
    const dest = $("#qp-destination").value.trim();
    if (!dest) return;
    switchSection("chat");
    await generateQuickPlan({
      destination: dest,
      days: parseInt($("#qp-days").value) || 5,
      group_size: parseInt($("#qp-group").value) || 2,
      budget: $("#qp-budget").value,
      travel_style: $("#qp-style").value,
      start_date: $("#qp-date").value,
    });
  });

  /* ── FULL PLAN FORM (Planner) ── */
  $("#fullPlanForm")?.addEventListener("submit", async e => {
    e.preventDefault();
    const dest = $("#fp-destination").value.trim();
    if (!dest) return;
    await generateFullPlan({
      destination: dest,
      days: parseInt($("#fp-days").value) || 5,
      budget: state.selectedBudget,
      travel_style: $("#fp-style").value,
      group_size: parseInt($("#fp-group-size").value) || 2,
      start_date: $("#fp-start").value,
    });
  });

  // Budget toggle in planner
  $$(".budget-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      $$(".budget-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      state.selectedBudget = btn.dataset.val;
    });
  });

  /* ── BUDGET FORM ── */
  $("#budgetForm")?.addEventListener("submit", async e => {
    e.preventDefault();
    const dest   = $("#bg-destination").value.trim();
    const origin = $("#bg-origin").value.trim();
    if (!dest || !origin) return;
    await generateBudgetEstimate({
      origin,
      destination: dest,
      days: parseInt($("#bg-days").value) || 5,
      group_size: parseInt($("#bg-group").value) || 2,
      budget_level: $("#bg-level").value,
    });
  });

  // Copy budget
  $("#copyBudget")?.addEventListener("click", () => {
    const content = $("#budgetOutput").innerText;
    copyToClipboard(content, "Budget estimate copied!");
  });

  /* ── WEATHER ── */
  $("#checkWeatherBtn")?.addEventListener("click", checkWeather);

  /* ── PLANNER TOOLS ── */
  $("#printItinerary")?.addEventListener("click", () => window.print());
  $("#copyItinerary")?.addEventListener("click", () => {
    const content = $("#plannerOutput").innerText;
    copyToClipboard(content, "Itinerary copied to clipboard!");
  });
  $("#refreshItinerary")?.addEventListener("click", loadDashboard);

  /* ── EXPLORE FILTERS ── */
  $$(".filter-tab").forEach(tab => {
    tab.addEventListener("click", () => {
      $$(".filter-tab").forEach(t => t.classList.remove("active"));
      tab.classList.add("active");
      renderExploreGrid(tab.dataset.filter);
    });
  });

  /* ── PROFILE FORM ── */
  $("#profileForm")?.addEventListener("submit", e => {
    e.preventDefault();
    saveProfile();
  });

  $$(".interest-tag").forEach(tag => {
    tag.addEventListener("click", () => {
      tag.classList.toggle("selected");
      const val = tag.dataset.val;
      if (tag.classList.contains("selected")) {
        if (!state.selectedInterests.includes(val)) state.selectedInterests.push(val);
      } else {
        state.selectedInterests = state.selectedInterests.filter(v => v !== val);
      }
    });
  });
}

/* ═══════════════════════════════════════════════════════════════════════
   CHAT FUNCTIONS
   ═══════════════════════════════════════════════════════════════════════ */
async function sendChatMessage() {
  const input  = $("#chatInput");
  const message = input.value.trim();
  if (!message || state.isTyping) return;

  input.value  = "";
  input.style.height = "auto";

  appendUserMessage(message);
  showTyping();

  try {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message }),
    });
    const data = await res.json();
    hideTyping();

    if (data.success) {
      appendAIMessage(data.response, data.timestamp);
      state.messageCount++;
    } else {
      appendAIMessage(`⚠️ **Error:** ${data.error || data.response}`, formatTime());
    }
  } catch (err) {
    hideTyping();
    appendAIMessage("⚠️ **Connection error.** Please check your server and try again.", formatTime());
  }
}

function sendQuickMsg(msg) {
  if (!msg) return;
  const input = $("#chatInput");
  if (input) {
    input.value = msg;
    sendChatMessage();
  }
}

function appendUserMessage(text) {
  const msgs = $("#chatMessages");
  const div  = document.createElement("div");
  div.className = "message message-user";
  div.innerHTML = `
    <div class="message-bubble">
      <p>${escapeHtml(text)}</p>
      <div class="message-time">${formatTime()}</div>
    </div>
    <div class="message-avatar"><i class="bi bi-person-fill" style="color:white"></i></div>
  `;
  msgs.appendChild(div);
  scrollChat();
}

function appendAIMessage(text, time = "") {
  const msgs = $("#chatMessages");
  const div  = document.createElement("div");
  div.className = "message message-ai";
  div.innerHTML = `
    <div class="message-avatar"><span>✈</span></div>
    <div class="message-bubble">
      <div class="rendered-md">${renderMarkdown(text)}</div>
      <div class="message-time">${time || formatTime()}</div>
    </div>
  `;
  msgs.appendChild(div);
  scrollChat();
}

function showTyping() {
  state.isTyping = true;
  $("#typingIndicator")?.classList.remove("d-none");
  const sendBtn = $("#sendBtn");
  if (sendBtn) {
    sendBtn.innerHTML = '<div class="spinner-sm"></div>';
    sendBtn.disabled = true;
  }
  scrollChat();
}

function hideTyping() {
  state.isTyping = false;
  $("#typingIndicator")?.classList.add("d-none");
  const sendBtn = $("#sendBtn");
  if (sendBtn) {
    sendBtn.innerHTML = '<i class="bi bi-send-fill"></i>';
    sendBtn.disabled = false;
  }
}

function scrollChat() {
  const msgs = $("#chatMessages");
  if (msgs) setTimeout(() => msgs.scrollTo({ top: msgs.scrollHeight, behavior: "smooth" }), 100);
}

async function clearChat() {
  if (!confirm("Clear conversation history?")) return;
  try {
    await fetch("/api/clear-chat", { method: "POST" });
    const msgs = $("#chatMessages");
    if (msgs) {
      const welcome = $("#welcomeMessage");
      msgs.innerHTML = "";
      if (welcome) msgs.appendChild(welcome);
    }
    showToast("Chat cleared.", "info");
  } catch {
    showToast("Failed to clear chat.", "error");
  }
}

function exportChat() {
  const msgs = $$(".message");
  if (msgs.length === 0) { showToast("No messages to export.", "info"); return; }
  const lines = msgs.map(m => {
    const isUser = m.classList.contains("message-user");
    const text = m.querySelector(".message-bubble")?.innerText || "";
    return `[${isUser ? "You" : "TripSage AI"}]\n${text}\n`;
  });
  const blob = new Blob([lines.join("\n---\n")], { type: "text/plain" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `tripsage-chat-${Date.now()}.txt`;
  a.click();
  showToast("Chat exported!", "success");
}

/* ── Voice Input ───────────────────────────────────────────────────────── */
function startVoiceInput() {
  if (!("webkitSpeechRecognition" in window) && !("SpeechRecognition" in window)) {
    showToast("Voice input not supported in this browser.", "error");
    return;
  }
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const recognition = new SpeechRecognition();
  recognition.lang = "en-IN";
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;

  const voiceBtn = $("#voiceBtn");
  if (voiceBtn) {
    voiceBtn.innerHTML = '<i class="bi bi-mic-fill text-danger"></i>';
    voiceBtn.title = "Listening...";
  }

  recognition.onresult = e => {
    const transcript = e.results[0][0].transcript;
    const input = $("#chatInput");
    if (input) { input.value = transcript; autoResizeTextarea(input); }
    showToast(`Heard: "${transcript}"`, "info");
  };

  recognition.onend = () => {
    if (voiceBtn) {
      voiceBtn.innerHTML = '<i class="bi bi-mic"></i>';
      voiceBtn.title = "Voice Input";
    }
  };

  recognition.onerror = () => {
    showToast("Voice recognition error. Try again.", "error");
    if (voiceBtn) {
      voiceBtn.innerHTML = '<i class="bi bi-mic"></i>';
      voiceBtn.title = "Voice Input";
    }
  };

  recognition.start();
}

/* ═══════════════════════════════════════════════════════════════════════
   QUICK PLAN
   ═══════════════════════════════════════════════════════════════════════ */
async function generateQuickPlan(params) {
  showLoading("Crafting your personalized itinerary...");
  try {
    const res  = await fetch("/api/quick-plan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
    });
    const data = await res.json();
    hideLoading();
    if (data.success) {
      appendAIMessage(data.itinerary, data.timestamp);
      showToast("Itinerary generated! 🗺️", "success");
      updateDashboardStats(params);
    } else {
      appendAIMessage(`⚠️ Could not generate itinerary: ${data.error}`, formatTime());
    }
  } catch (err) {
    hideLoading();
    appendAIMessage("⚠️ Connection error while generating itinerary.", formatTime());
  }
}

/* ═══════════════════════════════════════════════════════════════════════
   FULL PLAN (PLANNER SECTION)
   ═══════════════════════════════════════════════════════════════════════ */
async function generateFullPlan(params) {
  const output = $("#plannerOutput");
  if (!output) return;
  output.innerHTML = `<div class="text-center py-4"><div class="loading-plane" style="font-size:2.5rem;display:block;margin-bottom:.75rem">✈️</div><p class="text-muted">Generating your ${params.days}-day itinerary...</p></div>`;
  showLoading(`Planning ${params.days} days in ${params.destination}...`);

  try {
    const res  = await fetch("/api/quick-plan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
    });
    const data = await res.json();
    hideLoading();

    if (data.success) {
      output.innerHTML = `<div class="itinerary-content rendered-md">${renderMarkdown(data.itinerary)}</div>`;
      showToast("Full itinerary ready! 🎉", "success");
      updateDashboardStats(params);
    } else {
      output.innerHTML = `<div class="alert alert-danger">⚠️ ${data.error}</div>`;
    }
  } catch {
    hideLoading();
    output.innerHTML = `<div class="alert alert-danger">⚠️ Connection error. Please check your server.</div>`;
  }
}

/* ═══════════════════════════════════════════════════════════════════════
   BUDGET ESTIMATE
   ═══════════════════════════════════════════════════════════════════════ */
async function generateBudgetEstimate(params) {
  const output = $("#budgetOutput");
  const chart  = $("#budgetChart");
  if (!output) return;

  output.innerHTML = `<div class="text-center py-4"><div style="font-size:2rem;margin-bottom:.5rem">💰</div><p class="text-muted">Calculating budget for ${params.destination}...</p></div>`;
  showLoading("Analyzing travel costs...");

  try {
    const res  = await fetch("/api/budget-estimate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
    });
    const data = await res.json();
    hideLoading();

    if (data.success) {
      output.innerHTML = `<div class="itinerary-content rendered-md">${renderMarkdown(data.estimate)}</div>`;
      renderBudgetChart(chart, params);
      showToast("Budget estimate ready! 💰", "success");
    } else {
      output.innerHTML = `<div class="alert alert-danger">⚠️ ${data.error}</div>`;
    }
  } catch {
    hideLoading();
    output.innerHTML = `<div class="alert alert-danger">⚠️ Connection error.</div>`;
  }
}

/* ─── Budget Bar Chart ─────────────────────────────────────────────────── */
function renderBudgetChart(container, params) {
  if (!container) return;
  const budgetMap = {
    budget:   { flights:15, accommodation:25, food:20, sightseeing:15, shopping:10, misc:15 },
    moderate: { flights:25, accommodation:30, food:18, sightseeing:12, shopping:10, misc:5  },
    luxury:   { flights:30, accommodation:35, food:15, sightseeing:10, shopping:8,  misc:2  },
  };
  const pct  = budgetMap[params.budget_level] || budgetMap.moderate;
  const colors = ["#6366f1","#10b981","#f59e0b","#ef4444","#8b5cf6","#0ea5e9"];
  const labels = ["Flights & Transport","Accommodation","Food & Dining","Sightseeing","Shopping","Miscellaneous"];

  const rows = Object.entries(pct).map(([key, val], i) => `
    <div class="budget-bar-item">
      <div class="budget-bar-label">${labels[i]}</div>
      <div class="budget-bar-track">
        <div class="budget-bar-fill" style="width:0%;background:${colors[i]};transition:width 1.2s ease ${i*0.15}s" data-width="${val}">
          ${val >= 10 ? val+"%" : ""}
        </div>
      </div>
      <div class="budget-bar-value">${val}%</div>
    </div>
  `).join("");

  container.innerHTML = `<div class="budget-bar-chart">${rows}</div>`;

  // Animate bars
  setTimeout(() => {
    $$(".budget-bar-fill", container).forEach(bar => {
      bar.style.width = bar.dataset.width + "%";
    });
  }, 100);
}

/* ═══════════════════════════════════════════════════════════════════════
   WEATHER
   ═══════════════════════════════════════════════════════════════════════ */
async function checkWeather() {
  const dest  = $("#weatherDestInput")?.value.trim();
  const month = $("#weatherMonthSelect")?.value;
  if (!dest) { showToast("Please enter a destination.", "error"); return; }

  const result = $("#weatherResult");
  const box    = result?.querySelector(".weather-info-box");
  if (!result || !box) return;

  result.classList.remove("d-none");
  box.textContent = "Loading weather information...";

  try {
    const res  = await fetch("/api/weather-tips", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ destination: dest, month: month || new Date().toLocaleString("default", { month: "long" }) }),
    });
    const data = await res.json();
    if (data.success) {
      box.innerHTML = `<div class="rendered-md">${renderMarkdown(data.weather_info)}</div>`;
    } else {
      box.textContent = `Error: ${data.error}`;
    }
  } catch {
    box.textContent = "Connection error.";
  }
}

/* ═══════════════════════════════════════════════════════════════════════
   DASHBOARD
   ═══════════════════════════════════════════════════════════════════════ */
async function loadDashboard() {
  try {
    const res  = await fetch("/api/get-itinerary");
    const data = await res.json();
    const itin = data.itinerary;

    if (itin) {
      updateDashboardStats({
        destination:  itin.destination,
        days:         itin.days,
        group_size:   itin.group_size,
        budget:       itin.budget,
      });
      const output = $("#dashItinerary");
      if (output) {
        output.innerHTML = `<div class="itinerary-content rendered-md">${renderMarkdown(itin.content)}</div>`;
      }
    }
  } catch { /* silent */ }
}

function updateDashboardStats(params) {
  const dest   = $("#stat-destination");
  const days   = $("#stat-days");
  const people = $("#stat-people");
  const budget = $("#stat-budget");

  if (dest)   dest.textContent   = params.destination || "—";
  if (days)   days.textContent   = params.days || 0;
  if (people) people.textContent = params.group_size || 0;
  if (budget) budget.textContent = params.budget ? params.budget.charAt(0).toUpperCase() + params.budget.slice(1) : "—";

  // Update saved trip info in profile panel
  const savedTripInfo = $("#savedTripInfo");
  if (savedTripInfo && params.destination) {
    savedTripInfo.innerHTML = `
      <div style="background:var(--accent-light);border-radius:var(--radius-sm);padding:.75rem;font-size:.82rem;">
        <div><strong>📍 ${params.destination}</strong></div>
        <div class="text-muted mt-1">📅 ${params.days || "?"} days · 👥 ${params.group_size || "?"} travelers</div>
        <div class="text-muted">💳 ${params.budget || "moderate"} budget</div>
      </div>
    `;
  }
}

/* ═══════════════════════════════════════════════════════════════════════
   EXPLORE GRID
   ═══════════════════════════════════════════════════════════════════════ */
function renderExploreGrid(filter) {
  const grid = $("#exploreGrid");
  if (!grid) return;

  const filtered = filter === "all"
    ? DESTINATIONS
    : DESTINATIONS.filter(d => d.country === filter || d.tag === filter || d.type.toLowerCase() === filter);

  if (filtered.length === 0) {
    grid.innerHTML = `<div class="col-12 text-center text-muted py-4">No destinations found for this filter.</div>`;
    return;
  }

  grid.innerHTML = filtered.map(d => `
    <div class="col-6 col-md-4 col-lg-3">
      <div class="explore-card" onclick="exploreDestination('${d.name}')">
        <div class="explore-card-img" style="background:${getDestGradient(d.tag)}">
          <span>${d.emoji}</span>
        </div>
        <div class="explore-card-body">
          <div class="explore-card-title">${d.name}</div>
          <div class="explore-card-meta">
            <span class="explore-card-badge">${d.type}</span>
            <span>🗓 ${d.season}</span>
          </div>
          <div class="explore-card-cost">${d.cost}</div>
          <div style="font-size:.75rem;color:var(--text-muted);margin-top:.2rem">${d.highlight}</div>
        </div>
      </div>
    </div>
  `).join("");
}

function getDestGradient(tag) {
  const gradients = {
    beach:         "linear-gradient(135deg,#0ea5e9,#22d3ee)",
    mountain:      "linear-gradient(135deg,#64748b,#94a3b8)",
    heritage:      "linear-gradient(135deg,#d97706,#fbbf24)",
    spiritual:     "linear-gradient(135deg,#7c3aed,#a78bfa)",
    india:         "linear-gradient(135deg,#16a34a,#4ade80)",
    international: "linear-gradient(135deg,#6366f1,#8b5cf6)",
  };
  return gradients[tag] || "linear-gradient(135deg,#6366f1,#8b5cf6)";
}

function exploreDestination(name) {
  switchSection("chat");
  sendQuickMsg(`Tell me everything about visiting ${name} — best time to go, must-see places, hotels, and estimated budget.`);
}

/* ─── Dashboard Destination Mini-Cards ────────────────────────────────── */
function renderDestinationCards() {
  const container = $("#destinationCards");
  if (!container) return;

  const top = DESTINATIONS.slice(0, 8);
  const emojiMap = { goa:"🏖️", manali:"🏔️", kerala:"🌿", rajasthan:"🏰", varanasi:"🪔", andaman:"🐠", bali:"🌺", dubai:"🏙️" };

  container.innerHTML = top.map(d => `
    <div class="dest-card" onclick="exploreDestination('${d.name}')">
      <span class="dest-emoji">${d.emoji}</span>
      <div class="dest-name">${d.name}</div>
      <div class="dest-type">${d.type}</div>
    </div>
  `).join("");
}

/* ═══════════════════════════════════════════════════════════════════════
   PROFILE
   ═══════════════════════════════════════════════════════════════════════ */
async function saveProfile() {
  const payload = {
    name:          $("#prof-name")?.value,
    nationality:   $("#prof-nationality")?.value,
    travel_style:  $("#prof-style")?.value,
    budget_pref:   $("#prof-budget")?.value,
    interests:     state.selectedInterests,
    dietary:       $("#prof-dietary")?.value,
    accessibility: $("#prof-accessibility")?.value,
  };
  try {
    const res  = await fetch("/api/save-profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (data.success) {
      const nameEl = $("#profileDisplayName");
      if (nameEl && payload.name) nameEl.textContent = payload.name;
      showToast("Profile saved! ✅", "success");
    }
  } catch {
    showToast("Failed to save profile.", "error");
  }
}

async function loadProfile() {
  try {
    const res  = await fetch("/api/get-profile");
    const data = await res.json();
    if (data.profile && Object.keys(data.profile).length > 0) {
      const p = data.profile;
      if (p.name)          { if ($("#prof-name")) $("#prof-name").value = p.name; if ($("#profileDisplayName")) $("#profileDisplayName").textContent = p.name; }
      if (p.nationality)   { const el = $("#prof-nationality"); if (el) el.value = p.nationality; }
      if (p.travel_style)  { const el = $("#prof-style"); if (el) el.value = p.travel_style; }
      if (p.budget_pref)   { const el = $("#prof-budget"); if (el) el.value = p.budget_pref; }
      if (p.dietary)       { const el = $("#prof-dietary"); if (el) el.value = p.dietary; }
      if (p.accessibility) { const el = $("#prof-accessibility"); if (el) el.value = p.accessibility; }
      if (p.interests)     {
        state.selectedInterests = p.interests;
        p.interests.forEach(val => {
          const tag = $(`.interest-tag[data-val="${val}"]`);
          if (tag) tag.classList.add("selected");
        });
      }
    }
  } catch { /* silent */ }
}

async function loadItinerary() {
  try {
    const res  = await fetch("/api/get-itinerary");
    const data = await res.json();
    if (data.itinerary) updateDashboardStats(data.itinerary);
  } catch { /* silent */ }
}

/* ═══════════════════════════════════════════════════════════════════════
   LOADING OVERLAY
   ═══════════════════════════════════════════════════════════════════════ */
function showLoading(text = "TripSage AI is planning your trip...") {
  const overlay = $("#loadingOverlay");
  const txtEl   = overlay?.querySelector(".loading-text");
  if (overlay) {
    overlay.classList.remove("d-none");
    overlay.style.display = "flex";
    if (txtEl) txtEl.textContent = text;
  }
}

function hideLoading() {
  const overlay = $("#loadingOverlay");
  if (overlay) {
    overlay.classList.add("d-none");
    overlay.style.display = "none";
  }
}

/* ═══════════════════════════════════════════════════════════════════════
   TOAST NOTIFICATIONS
   ═══════════════════════════════════════════════════════════════════════ */
function showToast(message, type = "info") {
  const container = $("#toastContainer");
  if (!container) return;

  const icons = { success: "✅", error: "❌", info: "ℹ️", warning: "⚠️" };
  const id    = "toast-" + Date.now();
  const div   = document.createElement("div");
  div.id = id;
  div.className = `toast toast-${type} show`;
  div.setAttribute("role", "alert");
  div.innerHTML = `
    <div class="toast-body d-flex align-items-center gap-2">
      <span>${icons[type] || "ℹ️"}</span>
      <span>${escapeHtml(message)}</span>
      <button type="button" class="btn-close ms-auto" onclick="document.getElementById('${id}').remove()"></button>
    </div>
  `;
  container.appendChild(div);
  setTimeout(() => div.remove(), 4000);
}

/* ═══════════════════════════════════════════════════════════════════════
   MARKDOWN RENDERER (lightweight, no dependencies)
   ═══════════════════════════════════════════════════════════════════════ */
function renderMarkdown(text) {
  if (!text) return "";
  let html = escapeHtml(text);

  // Headings
  html = html.replace(/^######\s(.+)$/gm, "<h6>$1</h6>");
  html = html.replace(/^#####\s(.+)$/gm,  "<h5>$1</h5>");
  html = html.replace(/^####\s(.+)$/gm,   "<h4>$1</h4>");
  html = html.replace(/^###\s(.+)$/gm,    "<h3>$1</h3>");
  html = html.replace(/^##\s(.+)$/gm,     "<h2>$1</h2>");
  html = html.replace(/^#\s(.+)$/gm,      "<h1>$1</h1>");

  // Bold, italic, strikethrough
  html = html.replace(/\*\*\*(.+?)\*\*\*/g, "<strong><em>$1</em></strong>");
  html = html.replace(/\*\*(.+?)\*\*/g,     "<strong>$1</strong>");
  html = html.replace(/\*(.+?)\*/g,         "<em>$1</em>");
  html = html.replace(/~~(.+?)~~/g,         "<del>$1</del>");

  // Inline code
  html = html.replace(/`(.+?)`/g, "<code>$1</code>");

  // Blockquote
  html = html.replace(/^&gt;\s(.+)$/gm, "<blockquote>$1</blockquote>");

  // HR
  html = html.replace(/^(---|\*\*\*|___)\s*$/gm, "<hr/>");

  // Unordered lists
  html = html.replace(/((?:^[-*+]\s.+\n?)+)/gm, match => {
    const items = match.trim().split("\n").map(l => `<li>${l.replace(/^[-*+]\s/, "").trim()}</li>`).join("");
    return `<ul>${items}</ul>`;
  });

  // Ordered lists
  html = html.replace(/((?:^\d+\.\s.+\n?)+)/gm, match => {
    const items = match.trim().split("\n").map(l => `<li>${l.replace(/^\d+\.\s/, "").trim()}</li>`).join("");
    return `<ol>${items}</ol>`;
  });

  // Tables
  html = html.replace(/((?:^\|.+\|\n?)+)/gm, match => {
    const rows = match.trim().split("\n").filter(l => !l.match(/^\|[-| :]+\|$/));
    const tableRows = rows.map((row, i) => {
      const cells = row.split("|").filter((_, idx, arr) => idx > 0 && idx < arr.length - 1);
      const tag   = i === 0 ? "th" : "td";
      return `<tr>${cells.map(c => `<${tag}>${c.trim()}</${tag}>`).join("")}</tr>`;
    });
    return `<table>${tableRows.join("")}</table>`;
  });

  // Paragraphs (wrap lines not already wrapped)
  const lines = html.split("\n");
  const result = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) { result.push(""); continue; }
    const isBlock = /^<(h[1-6]|ul|ol|li|table|tr|th|td|blockquote|hr|pre|div|p)/.test(line);
    result.push(isBlock ? line : `<p>${line}</p>`);
  }

  return result.join("\n");
}

/* ═══════════════════════════════════════════════════════════════════════
   UTILITIES
   ═══════════════════════════════════════════════════════════════════════ */
function escapeHtml(text) {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatTime() {
  return new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
}

function autoResizeTextarea(textarea) {
  if (!textarea) return;
  const resize = () => {
    textarea.style.height = "auto";
    textarea.style.height = Math.min(textarea.scrollHeight, 120) + "px";
  };
  textarea.addEventListener("input", resize);
}

function copyToClipboard(text, successMsg = "Copied!") {
  if (navigator.clipboard) {
    navigator.clipboard.writeText(text).then(() => showToast(successMsg, "success")).catch(() => legacyCopy(text, successMsg));
  } else {
    legacyCopy(text, successMsg);
  }
}

function legacyCopy(text, msg) {
  const ta = document.createElement("textarea");
  ta.value = text;
  ta.style.cssText = "position:fixed;top:-9999px;left:-9999px";
  document.body.appendChild(ta);
  ta.select();
  try { document.execCommand("copy"); showToast(msg, "success"); } catch { showToast("Copy failed.", "error"); }
  document.body.removeChild(ta);
}

function setDefaultDate() {
  const today = new Date().toISOString().split("T")[0];
  const dateInputs = ["#qp-date", "#fp-start"];
  dateInputs.forEach(sel => {
    const el = $(sel);
    if (el && !el.value) el.value = today;
  });
  const fpEnd = $("#fp-end");
  if (fpEnd && !fpEnd.value) {
    const end = new Date();
    end.setDate(end.getDate() + 5);
    fpEnd.value = end.toISOString().split("T")[0];
  }
}

/* ═══════════════════════════════════════════════════════════════════════
   KEYBOARD SHORTCUTS
   ═══════════════════════════════════════════════════════════════════════ */
document.addEventListener("keydown", e => {
  // Ctrl/Cmd + Enter → send message (when chat focused)
  if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
    const active = document.activeElement;
    if (active && active.id === "chatInput") {
      e.preventDefault();
      sendChatMessage();
    }
  }
  // Escape → hide loading overlay
  if (e.key === "Escape") hideLoading();
});

/* ═══════════════════════════════════════════════════════════════════════
   GLOBAL EXPOSE (used in inline onclick)
   ═══════════════════════════════════════════════════════════════════════ */
window.switchSection      = switchSection;
window.sendQuickMsg       = sendQuickMsg;
window.exploreDestination = exploreDestination;
