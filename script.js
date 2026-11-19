/**
 * SYNTRIX – AI Multi-Agent Collaboration Platform
 * "One Intelligence. Many Agents."
 * -------------------------------------------------------------
 * Built with plain Vanilla JavaScript, organized into one class.
 * Saves your data using LocalStorage (no server needed).
 * Simulates AI agents working together on your requests.
 * Uses Chart.js for the stats & reports section.
 *
 * NOTE: This is a classroom demo. All AI responses are simulated.
 */

// ============================================================================
// 1. HELPER TOOLS – Simple functions used throughout the app
// ============================================================================

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => Array.from(document.querySelectorAll(selector));

function escapeHTML(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

// Sound effects engine (plays small chimes when actions happen)
class AudioEngine {
    constructor() {
        this.ctx = null;
        this.enabled = true;
    }

    init() {
        if (!this.ctx && (window.AudioContext || window.webkitAudioContext)) {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            this.ctx = new AudioCtx();
        }
    }

    playTone(frequency = 880, duration = 0.08, type = 'sine') {
        if (!this.enabled) return;
        try {
            this.init();
            if (!this.ctx) return;
            if (this.ctx.state === 'suspended') {
                this.ctx.resume();
            }
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = type;
            osc.frequency.setValueAtTime(frequency, this.ctx.currentTime);
            gain.gain.setValueAtTime(0.04, this.ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start();
            osc.stop(this.ctx.currentTime + duration);
        } catch (e) {
            // Sound not available in this browser — that's okay
        }
    }

    playChime() {
        if (!this.enabled) return;
        this.playTone(523.25, 0.06); // C5
        setTimeout(() => this.playTone(659.25, 0.06), 60); // E5
        setTimeout(() => this.playTone(783.99, 0.12), 120); // G5
    }

    playWarning() {
        if (!this.enabled) return;
        this.playTone(330, 0.12, 'sawtooth');
    }
}

const audio = new AudioEngine();

// Pop-up notification at the top right corner of the screen
function showToast(message, icon = 'bi-info-circle-fill', isSuccess = true) {
    const toastEl = $('#syntrixToast');
    if (!toastEl) return;
    const msgEl = $('#toastMessage');
    const iconEl = $('#toastIcon');
    if (msgEl) msgEl.textContent = message;
    if (iconEl) {
        iconEl.className = `bi ${icon} ${isSuccess ? 'text-neon' : 'text-danger'}`;
    }
    if (window.bootstrap && bootstrap.Toast) {
        const toast = bootstrap.Toast.getOrCreateInstance(toastEl);
        toast.show();
    }
    if (isSuccess) audio.playTone(880, 0.04);
}

// ============================================================================
// 2. THE AI HELPERS – Specialized SYNTRIX AI Agents
// ============================================================================

const AGENTS = [
    {
        id: "orchestrator",
        name: "Syntrix Coordinator Agent",
        badge: "Syntrix Lead",
        icon: "bi bi-gear-wide-connected",
        color: "#F59E0B",
        role: "Team Leader & Problem Solver",
        description: "Understands your questions, breaks down real-world problems into clear steps, and coordinates the whole SYNTRIX team.",
        capabilities: ["Solves Real-World Problems", "Clear Explanations", "Assigns Tasks", "Combines All Results"],
        status: "idle",
        latency: "18ms",
        load: "12%",
        model: "Syntrix-Coordinator-v2.5"
    },
    {
        id: "research",
        name: "Syntrix Research Agent",
        badge: "Syntrix Web",
        icon: "bi bi-globe2",
        color: "#FBBF24",
        role: "Web Surfer & Knowledge Finder",
        description: "Surfs the web, searches live tech docs, checks official libraries, and gathers verified facts and examples.",
        capabilities: ["Live Web Surfing", "Searches Documentation", "Finds Tech Libraries", "Verifies Information"],
        status: "idle",
        latency: "42ms",
        load: "28%",
        model: "Syntrix-Research-v3"
    },
    {
        id: "strategy",
        name: "Syntrix Coder Agent",
        badge: "Syntrix Code",
        icon: "bi bi-code-slash",
        color: "#D97706",
        role: "Code Generator & Programmer",
        description: "Writes clean, working, copy-pasteable code in HTML, CSS, JavaScript, and Python to solve your exact request.",
        capabilities: ["Generates Working Code", "HTML / CSS / JavaScript", "Python Automation", "Explains Code Line-by-Line"],
        status: "idle",
        latency: "25ms",
        load: "15%",
        model: "Syntrix-Coder-v3"
    },
    {
        id: "analysis",
        name: "Syntrix Analyst Agent",
        badge: "Syntrix Logic",
        icon: "bi bi-calculator-fill",
        color: "#EAB308",
        role: "Checks Math, Budget & Costs",
        description: "Calculates budgets, estimates hosting costs, checks server speed, and optimizes your solution with deep logic.",
        capabilities: ["Budget & Cost Estimation", "Performance Optimization", "Trade-Off Analysis", "Math & Logic Checks"],
        status: "idle",
        latency: "31ms",
        load: "22%",
        model: "Syntrix-Analyst-v4"
    },
    {
        id: "planning",
        name: "Syntrix Planner Agent",
        badge: "Syntrix Plan",
        icon: "bi bi-kanban-fill",
        color: "#B45309",
        role: "Actionable Roadmap & Checklist",
        description: "Organizes your project into a simple day-by-day checklist, timeline, and actionable milestones.",
        capabilities: ["Step-by-Step Roadmaps", "Task Checklists", "Timeline Deadlines", "Project Milestones"],
        status: "idle",
        latency: "21ms",
        load: "19%",
        model: "Syntrix-Planner-v3"
    },
    {
        id: "evaluator",
        name: "Syntrix Review Agent",
        badge: "Syntrix QA",
        icon: "bi bi-shield-check",
        color: "#F59E0B",
        role: "Code Tester & Quality Gate",
        description: "Reviews the generated code for syntax errors and bugs, checks security, and gives final verification.",
        capabilities: ["Bug Detection", "Code Quality Check", "Security Verification", "Ready to Copy & Run"],
        status: "idle",
        latency: "19ms",
        load: "10%",
        model: "Syntrix-Review-v2"
    }
];

// Ready-made demo examples that solve real-world problems and generate working code
const DEMO_SCENARIOS = {
    startup: {
        title: "🚀 Real-World Startup: Drone Delivery & Web Dispatch App",
        prompt: "Help me research a startup idea for an autonomous drone delivery service, analyze competitors, estimate a budget, and write working website code for our launch.",
        contributions: [
            {
                agent: "Syntrix Coordinator Agent",
                title: "Deconstructing Your Startup Idea",
                content: "I've structured your drone startup into 5 practical stages: regulatory safety approvals, equipment supply chains, unit economics, building a web dispatch app, and running a 30-day alpha pilot."
            },
            {
                agent: "Syntrix Research Agent",
                title: "Live Web & Competitor Research",
                content: "Analyzed global web data: Drone delivery TAM is $14.2B growing at 24.8% annually. Major competitors focus on long-range hospital routes, leaving a huge open niche for rapid local restaurant & small business package delivery."
            },
            {
                agent: "Syntrix Coder Agent",
                title: "Ready-to-Run Drone Dispatch Web App (HTML/CSS/JS)",
                content: "Here is complete, working frontend code for your launch website's Live Dispatch & Order Tracking widget. Copy and paste it right into your website:",
                codeLang: "html",
                code: `<!-- SYNTRIX Coder: Live Drone Dispatch Tracker -->
<div class="drone-tracker" style="max-width:440px; background:#1C1610; border:1px solid #F59E0B; border-radius:14px; padding:20px; color:#FDFBF7; font-family:sans-serif;">
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px;">
        <h4 style="margin:0; font-size:16px; color:#FBBF24;">🛸 SwiftDrone Dispatch #804</h4>
        <span style="background:#10b981; color:#fff; font-size:11px; padding:3px 8px; border-radius:12px;">IN FLIGHT</span>
    </div>
    <div style="background:#120E0A; padding:12px; border-radius:8px; margin-bottom:12px; border:1px solid rgba(245,158,11,0.15);">
        <div style="font-size:12px; color:#C5B5A5;">Route: Downtown Hub &rarr; Tech Park B</div>
        <div style="font-size:14px; font-weight:bold; margin-top:4px; color:#FDFBF7;">ETA: 6 Minutes (Altitude 80m)</div>
    </div>
    <div style="height:6px; background:#272018; border-radius:3px; overflow:hidden; margin-bottom:15px;">
        <div style="width:72%; height:100%; background:linear-gradient(90deg,#FBBF24,#F59E0B);"></div>
    </div>
    <button onclick="alert('Drone telemetry live: Battery 94%, Speed 42km/h')" style="width:100%; background:linear-gradient(135deg,#F59E0B,#D97706); color:#120E0A; border:none; padding:10px; border-radius:8px; cursor:pointer; font-weight:700;">
        View Live Telemetry
    </button>
</div>`
            },
            {
                agent: "Syntrix Analyst Agent",
                title: "Financial Model & Delivery Economics",
                content: "Starting capital required: $145,000 for a 90-day pilot fleet of 4 drones. Cost per delivery is $3.42 (compared to $9.80 for van couriers). Breakeven happens at Month 7 with 85 daily deliveries."
            },
            {
                agent: "Syntrix Planner Agent",
                title: "30-Day Step-by-Step Launch Roadmap",
                content: "Days 1–7: File local flight corridor exemptions. Days 8–16: Bench-test avionics and payload release. Days 17–24: Sign 5 local merchants. Days 25–30: Run first live commercial deliveries!"
            },
            {
                agent: "Syntrix Review Agent",
                title: "Code & Flight Safety Verification",
                content: "Code Audit: Passed ✅ (No syntax errors, responsive on mobile). Safety verification: Verified weather backup plan. Final verdict: 98.4% ready for launch."
            }
        ]
    },
    website: {
        title: "🌐 Web Development: Interactive AI Collaboration App",
        prompt: "Build a responsive modern web app with a live chat interface, real-time agent status pills, and working JavaScript code.",
        contributions: [
            {
                agent: "Syntrix Coordinator Agent",
                title: "Web App Architecture & Requirements",
                content: "To build a responsive AI collaboration app, we need: a clean glassmorphism chat interface, dynamic message bubbles, working input fields, and real-time status feedback."
            },
            {
                agent: "Syntrix Research Agent",
                title: "Tech Stack & Library Selection",
                content: "Researched top developer tools: Bootstrap 5 for rapid responsive grid layouts, Bootstrap Icons for crisp visuals, and Vanilla JavaScript with LocalStorage for fast state management without heavy frameworks."
            },
            {
                agent: "Syntrix Coder Agent",
                title: "Working Interactive AI Chatbot Component",
                content: "Here is the complete HTML, CSS, and JavaScript code for a working interactive chat widget that you can drop into any web page:",
                codeLang: "html",
                code: `<!-- SYNTRIX Coder: Interactive Chatbot Widget -->
<div id="ai-chat-box" style="max-width:400px; background:#1C1610; border:1px solid #F59E0B; border-radius:14px; overflow:hidden; font-family:sans-serif;">
    <div style="background:#120E0A; padding:12px 16px; border-bottom:1px solid rgba(245,158,11,0.15); display:flex; justify-content:space-between; align-items:center;">
        <span style="color:#FDFBF7; font-weight:bold; font-size:14px;">💬 SYNTRIX Assistant</span>
        <span style="color:#10b981; font-size:11px;">● Online</span>
    </div>
    <div id="chat-messages" style="height:180px; overflow-y:auto; padding:12px; display:flex; flex-direction:column; gap:8px;">
        <div style="background:#272018; color:#FDFBF7; border:1px solid rgba(245,158,11,0.12); padding:8px 12px; border-radius:10px 10px 10px 2px; font-size:13px; max-width:80%;">
            Hello! Ask me any coding or real-world problem.
        </div>
    </div>
    <div style="padding:10px; border-top:1px solid rgba(245,158,11,0.15); display:flex; gap:6px;">
        <input type="text" id="chat-msg-input" placeholder="Type a message..." style="flex:1; background:#120E0A; border:1px solid rgba(245,158,11,0.25); border-radius:8px; padding:8px 12px; color:#fff; font-size:13px; outline:none;">
        <button onclick="sendSampleMsg()" style="background:linear-gradient(135deg,#FBBF24,#F59E0B); border:none; border-radius:8px; padding:0 14px; color:#120E0A; font-weight:bold; cursor:pointer;">Send</button>
    </div>
</div>
<script>
    function sendSampleMsg() {
        const inp = document.getElementById('chat-msg-input');
        const list = document.getElementById('chat-messages');
        if (!inp.value.trim()) return;
        
        // Add user bubble
        list.innerHTML += '<div style="align-self:flex-end; background:linear-gradient(135deg,#F59E0B,#D97706); color:#120E0A; font-weight:500; padding:8px 12px; border-radius:10px 10px 2px 10px; font-size:13px; max-width:80%;">' + inp.value + '</div>';
        const userQ = inp.value;
        inp.value = '';
        list.scrollTop = list.scrollHeight;
        
        // Simulated AI response
        setTimeout(() => {
            list.innerHTML += '<div style="background:#272018; color:#FDFBF7; border:1px solid rgba(245,158,11,0.12); padding:8px 12px; border-radius:10px 10px 10px 2px; font-size:13px; max-width:80%;">Received: ' + userQ + '. SYNTRIX Coder can generate complete code for this!</div>';
            list.scrollTop = list.scrollHeight;
        }, 500);
    }
</script>`
            },
            {
                agent: "Syntrix Analyst Agent",
                title: "Capacity Planning & Speed Estimates",
                content: "Hosting cost on Vercel / Netlify: $0/month on free tier; scales to $20/month for up to 100,000 monthly visits. Page load speed is 98/100 on Google PageSpeed."
            },
            {
                agent: "Syntrix Planner Agent",
                title: "8-Week Development Roadmap",
                content: "Weeks 1–2: Project scaffold & basic design. Weeks 3–4: Core JavaScript logic & message handling. Weeks 5–6: LocalStorage persistence & styling. Weeks 7–8: Testing & deployment."
            },
            {
                agent: "Syntrix Review Agent",
                title: "Code Review & Quality Gate",
                content: "Lighthouse Performance Target: 98/100. Clean semantic code verified. Zero dependencies required. Ready for production."
            }
        ]
    },
    productivity: {
        title: "📅 Real-World Productivity: Task Tracker & Weekly Planner",
        prompt: "Create a personal productivity system with an interactive weekly task tracker web tool and an energy-optimized schedule.",
        contributions: [
            {
                agent: "Syntrix Coordinator Agent",
                title: "Identifying Productivity Roadblocks",
                content: "The biggest productivity killers are multitasking, lack of protected focus time, and losing track of priorities. We solve this with the 'Rule of 3' (maximum 3 important tasks per day)."
            },
            {
                agent: "Syntrix Research Agent",
                title: "Circadian Science & Time Blocking",
                content: "Researched peak mental performance studies: 08:30–11:30 is the daily peak for complex problem solving and coding. 14:00–15:30 is the natural energy dip — ideal for short breaks or admin tasks."
            },
            {
                agent: "Syntrix Coder Agent",
                title: "Interactive Daily Focus & Habit Tracker Code",
                content: "Here is a complete, runnable Daily Focus & Habit Tracker web app with checkboxes and streak counting that you can use right now:",
                codeLang: "html",
                code: `<!-- SYNTRIX Coder: Daily Focus & Habit Tracker -->
<div class="habit-tracker" style="max-width:380px; background:#1C1610; border:1px solid #F59E0B; border-radius:14px; padding:18px; color:#FDFBF7; font-family:sans-serif;">
    <h4 style="margin:0 0 12px 0; color:#FBBF24; font-size:16px;">🎯 Today's 3 Must-Do Priorities</h4>
    <div id="habit-list" style="display:flex; flex-direction:column; gap:8px;">
        <label style="display:flex; align-items:center; gap:10px; background:#120E0A; border:1px solid rgba(245,158,11,0.15); padding:10px; border-radius:8px; cursor:pointer;">
            <input type="checkbox" onchange="toggleHabit(this)" style="accent-color:#F59E0B;">
            <span>Deep Work: Code 90 mins (09:00 - 10:30)</span>
        </label>
        <label style="display:flex; align-items:center; gap:10px; background:#120E0A; border:1px solid rgba(245,158,11,0.15); padding:10px; border-radius:8px; cursor:pointer;">
            <input type="checkbox" onchange="toggleHabit(this)" style="accent-color:#F59E0B;">
            <span>Walk outside for 20 mins (14:00 energy reset)</span>
        </label>
        <label style="display:flex; align-items:center; gap:10px; background:#120E0A; border:1px solid rgba(245,158,11,0.15); padding:10px; border-radius:8px; cursor:pointer;">
            <input type="checkbox" onchange="toggleHabit(this)" style="accent-color:#F59E0B;">
            <span>Review day & plan tomorrow (17:30)</span>
        </label>
    </div>
    <div id="habit-progress" style="margin-top:14px; font-size:12px; color:#C5B5A5; text-align:center;">
        0 / 3 Priorities Completed Today
    </div>
</div>
<script>
    function toggleHabit(cb) {
        cb.parentElement.style.opacity = cb.checked ? '0.5' : '1';
        cb.parentElement.style.textDecoration = cb.checked ? 'line-through' : 'none';
        const total = document.querySelectorAll('#habit-list input').length;
        const checked = document.querySelectorAll('#habit-list input:checked').length;
        document.getElementById('habit-progress').innerText = checked + ' / ' + total + ' Priorities Completed Today';
        if (checked === total) alert('🎉 Fantastic! All your top priorities are done!');
    }
</script>`
            },
            {
                agent: "Syntrix Analyst Agent",
                title: "Time-Budget Allocation Matrix",
                content: "Optimal weekly breakdown: 20 hrs Deep Focus Work (40%), 8 hrs Routine Tasks (16%), 7 hrs Meetings (14%), 15 hrs Rest & Recovery (30%). Projected focus gain: +38%."
            },
            {
                agent: "Syntrix Planner Agent",
                title: "Weekly Operating Schedule",
                content: "Mon: Strategic Planning. Tue & Thu: Teamwork & Meetings. Wed: No-Meeting Deep Work Day. Fri: Review & Delegation. Sat/Sun: Full Recharge."
            },
            {
                agent: "Syntrix Review Agent",
                title: "Habit Feasibility & Sustainability Audit",
                content: "Burnout Risk: Reduced by 74%. Code tested and verified to run in any browser with zero dependencies. Feasibility score: 9.8 / 10."
            }
        ]
    }
};

// ============================================================================
// DYNAMIC CODE & PROBLEM SOLVING ENGINE (For Any User Prompt)
// ============================================================================

function generateDynamicContributions(prompt) {
    const p = prompt.toLowerCase();
    let code = '';
    let codeLang = 'javascript';
    let codeTitle = 'Generated Working Solution';

    if (p.includes('python') || p.includes('scrape') || p.includes('script') || p.includes('automate') || p.includes('file') || p.includes('download') || p.includes('data')) {
        codeLang = 'python';
        codeTitle = 'Python Automation Script (Ready to Run)';
        code = `# SYNTRIX Coder Agent - Python Solution
# Task: ${prompt}
# Requirements: pip install requests

import requests
import json
import time

def run_task():
    print("[*] Starting automated task: '${prompt.replace(/'/g, "\\'")}'...")
    
    # 1. Setup session and headers
    session = requests.Session()
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) SYNTRIX/2.5'
    }
    
    try:
        # Example structured process
        data = {
            "task": "${prompt.replace(/"/g, '')}",
            "status": "Success",
            "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
            "items_processed": 5
        }
        
        # Save output to file
        with open("syntrix_output.json", "w", encoding="utf-8") as f:
            json.dump(data, f, indent=4)
            
        print("[+] Task finished successfully! Output saved to 'syntrix_output.json'.")
        return data
        
    except Exception as err:
        print(f"[-] Error: {err}")
        return None

if __name__ == "__main__":
    run_task()
`;
    } else if (p.includes('calc') || p.includes('calculator') || p.includes('math')) {
        codeLang = 'html';
        codeTitle = 'Interactive Modern Calculator (HTML/CSS/JS)';
        code = `<!-- SYNTRIX Coder: Modern Glassmorphic Calculator -->
<div class="calculator-card" style="max-width:300px; background:#1C1610; padding:20px; border-radius:16px; border:1px solid #F59E0B; box-shadow:0 10px 30px rgba(0,0,0,0.5);">
    <input type="text" id="calc-screen" readonly value="0" style="width:100%; height:50px; background:#120E0A; color:#FBBF24; font-size:22px; text-align:right; padding:10px; border-radius:8px; border:1px solid rgba(245,158,11,0.2); margin-bottom:15px; outline:none;">
    <div style="display:grid; grid-template-columns:repeat(4, 1fr); gap:8px;">
        <button onclick="clearScreen()" style="background:#ef4444; color:#fff; border:none; padding:12px; border-radius:8px; cursor:pointer;">C</button>
        <button onclick="pressOp('/')" style="background:#D97706; color:#fff; border:none; padding:12px; border-radius:8px; cursor:pointer;">&divide;</button>
        <button onclick="pressOp('*')" style="background:#D97706; color:#fff; border:none; padding:12px; border-radius:8px; cursor:pointer;">&times;</button>
        <button onclick="pressOp('-')" style="background:#D97706; color:#fff; border:none; padding:12px; border-radius:8px; cursor:pointer;">-</button>
        
        <button onclick="pressNum('7')" style="background:#272018; color:#FDFBF7; border:1px solid rgba(245,158,11,0.1); padding:12px; border-radius:8px; cursor:pointer;">7</button>
        <button onclick="pressNum('8')" style="background:#272018; color:#FDFBF7; border:1px solid rgba(245,158,11,0.1); padding:12px; border-radius:8px; cursor:pointer;">8</button>
        <button onclick="pressNum('9')" style="background:#272018; color:#FDFBF7; border:1px solid rgba(245,158,11,0.1); padding:12px; border-radius:8px; cursor:pointer;">9</button>
        <button onclick="pressOp('+')" style="background:#D97706; color:#fff; border:none; padding:12px; border-radius:8px; cursor:pointer;">+</button>
        
        <button onclick="pressNum('4')" style="background:#272018; color:#FDFBF7; border:1px solid rgba(245,158,11,0.1); padding:12px; border-radius:8px; cursor:pointer;">4</button>
        <button onclick="pressNum('5')" style="background:#272018; color:#FDFBF7; border:1px solid rgba(245,158,11,0.1); padding:12px; border-radius:8px; cursor:pointer;">5</button>
        <button onclick="pressNum('6')" style="background:#272018; color:#FDFBF7; border:1px solid rgba(245,158,11,0.1); padding:12px; border-radius:8px; cursor:pointer;">6</button>
        <button onclick="calculateResult()" style="grid-row:span 2; background:linear-gradient(135deg,#FBBF24,#F59E0B); color:#120E0A; border:none; padding:12px; border-radius:8px; cursor:pointer; font-weight:bold;">=</button>
        
        <button onclick="pressNum('1')" style="background:#272018; color:#FDFBF7; border:1px solid rgba(245,158,11,0.1); padding:12px; border-radius:8px; cursor:pointer;">1</button>
        <button onclick="pressNum('2')" style="background:#272018; color:#FDFBF7; border:1px solid rgba(245,158,11,0.1); padding:12px; border-radius:8px; cursor:pointer;">2</button>
        <button onclick="pressNum('3')" style="background:#272018; color:#FDFBF7; border:1px solid rgba(245,158,11,0.1); padding:12px; border-radius:8px; cursor:pointer;">3</button>
        
        <button onclick="pressNum('0')" style="grid-column:span 2; background:#272018; color:#FDFBF7; border:1px solid rgba(245,158,11,0.1); padding:12px; border-radius:8px; cursor:pointer;">0</button>
        <button onclick="pressNum('.')" style="background:#272018; color:#FDFBF7; border:1px solid rgba(245,158,11,0.1); padding:12px; border-radius:8px; cursor:pointer;">.</button>
    </div>
</div>
<script>
    let curExpr = '';
    const scr = document.getElementById('calc-screen');
    function pressNum(n) { if (scr.value === '0') curExpr = ''; curExpr += n; scr.value = curExpr; }
    function pressOp(op) { curExpr += op; scr.value = curExpr; }
    function clearScreen() { curExpr = ''; scr.value = '0'; }
    function calculateResult() { try { scr.value = eval(curExpr); curExpr = String(scr.value); } catch(e) { scr.value = 'Error'; } }
</script>`;
    } else if (p.includes('login') || p.includes('form') || p.includes('signup') || p.includes('auth')) {
        codeLang = 'html';
        codeTitle = 'Futuristic Glassmorphic Login Component (HTML/CSS/JS)';
        code = `<!-- SYNTRIX Coder: Responsive Glassmorphic Login Card -->
<div class="login-box" style="max-width:360px; margin:auto; background:rgba(28,22,16,0.92); backdrop-filter:blur(16px); padding:26px; border-radius:16px; border:1px solid rgba(245,158,11,0.3); box-shadow:0 10px 30px rgba(0,0,0,0.5); font-family:sans-serif;">
    <h3 style="color:#FDFBF7; font-weight:700; margin:0 0 6px 0; text-align:center;">Welcome Back</h3>
    <p style="color:#C5B5A5; font-size:12px; text-align:center; margin:0 0 20px 0;">Sign in to your account</p>
    
    <div style="margin-bottom:14px;">
        <label style="color:#FDFBF7; font-size:12px; display:block; margin-bottom:5px;">Email</label>
        <input type="email" placeholder="you@domain.com" style="width:100%; padding:10px 12px; background:#120E0A; border:1px solid rgba(245,158,11,0.2); border-radius:8px; color:#fff; outline:none;" required>
    </div>
    
    <div style="margin-bottom:18px;">
        <label style="color:#FDFBF7; font-size:12px; display:block; margin-bottom:5px;">Password</label>
        <div style="position:relative;">
            <input type="password" id="user-password" placeholder="••••••••" style="width:100%; padding:10px 12px; background:#120E0A; border:1px solid rgba(245,158,11,0.2); border-radius:8px; color:#fff; outline:none;" required>
            <button type="button" onclick="togglePassView()" style="position:absolute; right:10px; top:10px; background:none; border:none; color:#FBBF24; cursor:pointer; font-size:11px;">Show</button>
        </div>
    </div>
    
    <button type="button" onclick="alert('Signed in successfully!')" style="width:100%; padding:11px; background:linear-gradient(135deg, #FBBF24, #F59E0B); border:none; border-radius:8px; color:#120E0A; font-weight:700; cursor:pointer;">Sign In</button>
</div>
<script>
    function togglePassView() {
        const f = document.getElementById('user-password');
        f.type = f.type === 'password' ? 'text' : 'password';
    }
</script>`;
    } else if (p.includes('timer') || p.includes('stopwatch') || p.includes('clock')) {
        codeLang = 'html';
        codeTitle = 'Digital Stopwatch & Timer (HTML/CSS/JS)';
        code = `<!-- SYNTRIX Coder: Digital Stopwatch Web App -->
<div style="max-width:320px; background:#1C1610; border:1px solid #F59E0B; border-radius:14px; padding:20px; text-align:center; color:#fff; font-family:monospace;">
    <div id="stopwatch-display" style="font-size:36px; color:#FBBF24; margin-bottom:16px;">00:00.0</div>
    <div style="display:flex; justify-content:center; gap:8px;">
        <button id="sw-start" onclick="toggleTimer()" style="background:linear-gradient(135deg,#F59E0B,#D97706); color:#120E0A; border:none; padding:8px 16px; border-radius:8px; cursor:pointer; font-weight:bold;">Start</button>
        <button onclick="resetTimer()" style="background:#272018; border:1px solid rgba(245,158,11,0.3); color:#FDFBF7; padding:8px 16px; border-radius:8px; cursor:pointer; font-weight:bold;">Reset</button>
    </div>
</div>
<script>
    let timerInterval = null, elapsedMs = 0;
    function updateDisplay() {
        const ms = Math.floor((elapsedMs % 1000) / 100);
        const sec = Math.floor((elapsedMs / 1000) % 60);
        const min = Math.floor(elapsedMs / 60000);
        document.getElementById('stopwatch-display').innerText = 
            String(min).padStart(2,'0') + ':' + String(sec).padStart(2,'0') + '.' + ms;
    }
    function toggleTimer() {
        const btn = document.getElementById('sw-start');
        if (timerInterval) {
            clearInterval(timerInterval);
            timerInterval = null;
            btn.innerText = 'Start';
            btn.style.background = 'linear-gradient(135deg,#F59E0B,#D97706)';
        } else {
            const start = Date.now() - elapsedMs;
            timerInterval = setInterval(() => { elapsedMs = Date.now() - start; updateDisplay(); }, 100);
            btn.innerText = 'Pause';
            btn.style.background = '#FBBF24';
        }
    }
    function resetTimer() {
        clearInterval(timerInterval);
        timerInterval = null;
        elapsedMs = 0;
        updateDisplay();
        document.getElementById('sw-start').innerText = 'Start';
        document.getElementById('sw-start').style.background = 'linear-gradient(135deg,#F59E0B,#D97706)';
    }
</script>`;
    } else {
        codeLang = 'javascript';
        codeTitle = 'Tailored JavaScript Solution (Clean & Modular)';
        code = `// SYNTRIX Coder Agent - Custom Solution for:
// "${prompt.replace(/"/g, '')}"

class SolutionEngine {
    constructor() {
        this.objective = "${prompt.replace(/"/g, '')}";
        this.status = "Ready";
        this.results = [];
    }

    async execute() {
        console.log("[Syntrix Coordinator Agent] Initiating workflow for:", this.objective);
        console.log("[Syntrix Research Agent] Verified real-world requirements & live web docs.");
        
        // 1. Process and format key deliverables
        this.results = [
            { step: 1, action: "Parsed user requirements", done: true },
            { step: 2, action: "Applied modern best practices", done: true },
            { step: 3, action: "Verified code with Syntrix Review Agent", done: true }
        ];

        console.log("[Syntrix Coder Agent] Generated clean, optimized code.");
        return {
            success: true,
            summary: "Task executed successfully",
            data: this.results
        };
    }
}

// Quick run
const engine = new SolutionEngine();
engine.execute().then(res => console.log("Final Verdict:", res));
`;
    }

    return [
        {
            agent: "Syntrix Coordinator Agent",
            title: "Problem Breakdown & Direct Answer",
            content: `I've analyzed your request: "${prompt}". Here is the real-world strategy: we break this problem down into a clear technical foundation, source verified tools, write ready-to-run code, calculate efficiency, and review it for production quality.`
        },
        {
            agent: "Syntrix Research Agent",
            title: "Live Web & Documentation Search",
            content: `Searched web documentation and modern GitHub repositories for "${prompt}". Verified the latest syntax, community-tested design patterns, and standard APIs to make sure your solution is fast and future-proof.`
        },
        {
            agent: "Syntrix Coder Agent",
            title: codeTitle,
            content: `Here is the clean, complete, ready-to-run code I wrote according to your request. You can copy it directly using the button below:`,
            code: code,
            codeLang: codeLang
        },
        {
            agent: "Syntrix Analyst Agent",
            title: "Performance & Cost Breakdown",
            content: `Execution metrics: Execution latency estimated at <25ms. Memory footprint is minimal (<2.8MB). If deployed on free tiers (GitHub Pages / Vercel / PythonAnywhere), hosting cost is $0.00/month.`
        },
        {
            agent: "Syntrix Planner Agent",
            title: "3-Step Action Plan to Run This",
            content: `1. Copy the code above using the 'Copy Code' button. 2. Paste into your local project file (e.g. index.html or script.py). 3. Run it in your browser or terminal to see live results!`
        },
        {
            agent: "Syntrix Review Agent",
            title: "Code Review & Safety Verification",
            content: `Code Audit: Passed ✅. Syntax verified: 100% valid. Security check: No unsafe inputs or deprecated functions detected. Ready for immediate deployment.`
        }
    ];
}

// ============================================================================
// 3. SAMPLE DOCUMENTS – Default files in the My Documents section
// ============================================================================

const DEFAULT_DOCUMENTS = [
    {
        id: "doc-1",
        title: "Drone Delivery Business Guide",
        category: "Research",
        type: "PDF",
        size: "3.4 MB",
        date: "2026-02-14",
        summary: "A complete guide to starting a drone delivery service — including safety rules, what equipment you need, how batteries work, and how to get permission to fly in your area.",
        keywords: ["drone", "delivery", "business", "rules", "autonomous"]
    },
    {
        id: "doc-2",
        title: "AI Tools Market Report 2026",
        category: "Strategy",
        type: "PDF",
        size: "5.1 MB",
        date: "2026-03-01",
        summary: "A market research report showing that AI assistant tools are growing very quickly — 42% more businesses are using them every year. Explains what businesses struggle with and what features they want most.",
        keywords: ["market", "growth", "AI", "tools", "business", "2026"]
    },
    {
        id: "doc-3",
        title: "How to Build a Multi-Agent App",
        category: "Engineering",
        type: "MD",
        size: "820 KB",
        date: "2026-03-10",
        summary: "A developer's guide to building apps where multiple AI agents work together. Covers how to connect them, how they share information, and what to do if one stops working.",
        keywords: ["build", "app", "agents", "developer", "guide"]
    },
    {
        id: "doc-4",
        title: "Startup Budget & Funding Basics",
        category: "Finance",
        type: "JSON",
        size: "420 KB",
        date: "2026-03-15",
        summary: "Simple financial models for new startups. Explains how much it costs to get customers, how much revenue you need to stay profitable, and how to track your spending.",
        keywords: ["finance", "budget", "startup", "money", "funding"]
    },
    {
        id: "doc-5",
        title: "How to Work Smarter Every Day",
        category: "Research",
        type: "PDF",
        size: "2.1 MB",
        date: "2026-03-18",
        summary: "A practical guide based on brain science — explains the best times to do hard work, how to avoid burnout, and how to organize your day so you get more done without feeling exhausted.",
        keywords: ["productivity", "schedule", "habits", "work", "rest"]
    }
];

// ============================================================================
// 4. SAMPLE PROJECTS – Starting projects shown in To-Do & Projects
// ============================================================================

const DEFAULT_PROJECTS = [
    {
        id: "proj-101",
        name: "SYNTRIX App – Version 3.0 Upgrade",
        desc: "Improve the AI team speed and add better memory so agents remember what they worked on before.",
        lead: "Orchestrator Agent",
        deadline: "2026-04-15",
        tasks: [
            { id: "t-1", title: "Test how fast agents respond when many users are active", completed: true, priority: "High" },
            { id: "t-2", title: "Add a quality review step before every final answer", completed: true, priority: "High" },
            { id: "t-3", title: "Set up a backup system so the app never goes offline", completed: false, priority: "Medium" },
            { id: "t-4", title: "Write a simple help guide for new users", completed: false, priority: "Low" }
        ]
    },
    {
        id: "proj-102",
        name: "Drone Delivery – Test Launch",
        desc: "Run a test delivery service with 5 local shops across a small area to prove the idea works.",
        lead: "Planning Agent",
        deadline: "2026-05-01",
        tasks: [
            { id: "t-5", title: "Submit safety documents to get permission to fly", completed: true, priority: "High" },
            { id: "t-6", title: "Test drones in rainy and windy conditions", completed: false, priority: "High" },
            { id: "t-7", title: "Sign agreements with 5 test partner businesses", completed: false, priority: "Medium" }
        ]
    }
];

// Quick prompt ideas that solve real-world problems and generate working code
const SUGGESTED_PROMPTS = [
    "Write a responsive modern To-Do web app with localStorage saving and checkboxes",
    "Create a Python script to scrape product prices and track when prices drop",
    "Generate a futuristic glassmorphic user login component in HTML & CSS",
    "Build a live digital stopwatch and countdown timer in JavaScript",
    "Help me research a startup idea, analyze costs, and write launch website code"
];

// ============================================================================
// 5. APP STATE & STARTUP
// ============================================================================

class SyntrixApp {
    constructor() {
        this.currentSection = 'overview';
        this.isWorkflowRunning = false;
        this.projects = [];
        this.documents = [];
        this.recentWorkflows = [];
        this.activities = [];
        this.charts = {};
    }

    init() {
        this.loadState();
        this.bindEvents();
        this.renderAgentCards();
        this.renderSuggestedPrompts();
        this.renderRecentWorkflows();
        this.renderActivityStream();
        this.renderVault();
        this.renderProjects();
        this.updateStatsDisplay();
        this.initTheme();

        // Switch to initial section
        this.navigateTo('overview');

        // Log that the app is ready
        this.logActivity("SYNTRIX is ready! All 6 AI helpers are online and waiting.", "Orchestrator");
    }

    // ------------------------------------------------------------------------
    // LocalStorage State Management
    // ------------------------------------------------------------------------
    loadState() {
        try {
            this.projects = JSON.parse(localStorage.getItem('syntrix_projects')) || DEFAULT_PROJECTS;
            this.documents = JSON.parse(localStorage.getItem('syntrix_documents')) || DEFAULT_DOCUMENTS;
            this.recentWorkflows = JSON.parse(localStorage.getItem('syntrix_recent_workflows')) || [
                {
                    title: "🚀 Launch a Startup – Drone Delivery Service",
                    date: "Today, 10:15 AM",
                    status: "Completed",
                    agents: 6
                },
                {
                    title: "🌐 Build a Website – AI Collaboration Tool",
                    date: "Yesterday, 04:30 PM",
                    status: "Completed",
                    agents: 6
                }
            ];
            this.activities = JSON.parse(localStorage.getItem('syntrix_activities')) || [
                { text: "AI read and saved 5 new documents to your library", time: "10 mins ago", agent: "Research" },
                { text: "Strategy helper finished making a plan for your request", time: "25 mins ago", agent: "Strategy" },
                { text: "Reviewer gave everything a thumbs up — quality check passed!", time: "1 hour ago", agent: "Evaluator" }
            ];
        } catch (e) {
            this.projects = DEFAULT_PROJECTS;
            this.documents = DEFAULT_DOCUMENTS;
            this.recentWorkflows = [];
            this.activities = [];
        }
    }

    saveProjects() {
        localStorage.setItem('syntrix_projects', JSON.stringify(this.projects));
    }

    saveDocuments() {
        localStorage.setItem('syntrix_documents', JSON.stringify(this.documents));
    }

    saveRecentWorkflows() {
        localStorage.setItem('syntrix_recent_workflows', JSON.stringify(this.recentWorkflows));
    }

    saveActivities() {
        localStorage.setItem('syntrix_activities', JSON.stringify(this.activities));
    }

    // ------------------------------------------------------------------------
    // Navigation & Section Router
    // ------------------------------------------------------------------------
    navigateTo(sectionId) {
        const targetSection = $(`#${sectionId}`);
        if (!targetSection) return;

        // Hide all sections
        $$('.app-section').forEach(sec => sec.classList.add('d-none'));

        // Show target section
        targetSection.classList.remove('d-none');
        this.currentSection = sectionId;

        // Update navigation active state
        $$('.nav-link-custom').forEach(link => {
            const isMatch = link.dataset.section === sectionId;
            link.classList.toggle('active', isMatch);
        });

        // Update breadcrumbs title
        const titleEl = $('#current-section-title');
        if (titleEl) {
            const titles = {
                overview: "Overview Dashboard",
                workspace: "AI Workspace",
                agents: "Agent Control Center",
                vault: "Knowledge Vault",
                planner: "Project Planner",
                analytics: "Analytics & Telemetry",
                settings: "Platform Settings"
            };
            titleEl.textContent = titles[sectionId] || "Dashboard";
        }

        // Initialize Analytics charts when entering Analytics
        if (sectionId === 'analytics') {
            setTimeout(() => this.renderAnalyticsCharts(), 150);
        }

        // On mobile, collapse sidebar after navigating
        if (window.innerWidth < 992) {
            $('#wrapper').classList.remove('toggled');
        }

        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // ------------------------------------------------------------------------
    // Event Binding
    // ------------------------------------------------------------------------
    bindEvents() {
        // Sidebar toggle
        const toggleBtn = $('#sidebarToggle');
        if (toggleBtn) {
            toggleBtn.addEventListener('click', () => {
                $('#wrapper').classList.toggle('toggled');
            });
        }

        // Navigation links
        $$('.nav-link-custom').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const section = link.dataset.section;
                if (section) this.navigateTo(section);
            });
        });

        // Quick action / switch buttons
        $$('[data-switch]').forEach(btn => {
            btn.addEventListener('click', () => {
                const target = btn.dataset.switch;
                if (target) this.navigateTo(target);
            });
        });

        const quickStartBtn = $('#quickStartBtn');
        if (quickStartBtn) {
            quickStartBtn.addEventListener('click', () => {
                this.navigateTo('overview');
                const promptInp = $('#prompt-input');
                if (promptInp) promptInp.focus();
            });
        }

        const overviewLaunchBtn = $('#overview-launch-btn');
        if (overviewLaunchBtn) {
            overviewLaunchBtn.addEventListener('click', () => {
                const promptInp = $('#prompt-input');
                if (promptInp && !promptInp.value.trim()) {
                    promptInp.value = "Formulate a comprehensive market expansion strategy for our AI product suite.";
                }
                this.startWorkflow();
            });
        }

        // Start Agent Workflow button
        const startWorkflowBtn = $('#start-workflow');
        if (startWorkflowBtn) {
            startWorkflowBtn.addEventListener('click', () => this.startWorkflow());
        }

        // Enter key to trigger workflow on prompt input
        const promptInput = $('#prompt-input');
        if (promptInput) {
            promptInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    this.startWorkflow();
                }
            });
        }

        // Clickable demo scenario cards
        $$('.clickable-card[data-demo]').forEach(card => {
            card.addEventListener('click', () => {
                const demoKey = card.dataset.demo;
                this.runDemoScenario(demoKey);
            });
        });

        // Workspace Chat Input & Send Button
        const sendChatBtn = $('#send-chat');
        const chatInput = $('#chat-input');
        if (sendChatBtn && chatInput) {
            sendChatBtn.addEventListener('click', () => this.handleSendMessage());
            chatInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    this.handleSendMessage();
                }
            });
        }

        // Clear Chat & Export Chat
        const clearChatBtn = $('#clearChatBtn');
        if (clearChatBtn) {
            clearChatBtn.addEventListener('click', () => {
                if (confirm("Clear all active workspace conversation history?")) {
                    const chatWin = $('#chat-window');
                    if (chatWin) {
                        chatWin.innerHTML = `
                            <div class="chat-bubble ai">
                                <div class="bubble-header d-flex align-items-center gap-2 mb-1">
                                    <span class="badge bg-violet-subtle text-violet px-2"><i class="bi bi-robot me-1"></i>SYNTRIX CORE</span>
                                    <small class="text-secondary">Just now</small>
                                </div>
                                <div class="bubble-content">
                                    Conversation reset. All 6 agents are standing by for your next objective.
                                </div>
                            </div>
                        `;
                    }
                    showToast("Conversation cleared", "bi-trash3");
                }
            });
        }

        const exportChatBtn = $('#exportChatBtn');
        if (exportChatBtn) {
            exportChatBtn.addEventListener('click', () => this.exportConversation());
        }

        // Agent Control Center Actions
        const pingAllBtn = $('#pingAllAgentsBtn');
        if (pingAllBtn) {
            pingAllBtn.addEventListener('click', () => this.pingAllAgents());
        }

        const resetStatusesBtn = $('#resetAgentStatusesBtn');
        if (resetStatusesBtn) {
            resetStatusesBtn.addEventListener('click', () => this.resetAllAgentStatuses());
        }

        // Knowledge Vault Search & Filters
        const vaultSearch = $('#vault-search-input');
        const vaultCatFilter = $('#vault-category-filter');
        const vaultTypeFilter = $('#vault-type-filter');
        if (vaultSearch) vaultSearch.addEventListener('input', () => this.renderVault());
        if (vaultCatFilter) vaultCatFilter.addEventListener('change', () => this.renderVault());
        if (vaultTypeFilter) vaultTypeFilter.addEventListener('change', () => this.renderVault());

        // Document Upload Form
        const uploadDocForm = $('#upload-doc-form');
        if (uploadDocForm) {
            uploadDocForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleDocumentUpload();
            });
        }

        // Document Q&A (RAG Simulator)
        const vaultQaBtn = $('#vault-qa-btn');
        const vaultQaInput = $('#vault-qa-input');
        if (vaultQaBtn && vaultQaInput) {
            vaultQaBtn.addEventListener('click', () => this.handleVaultQA());
            vaultQaInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    this.handleVaultQA();
                }
            });
        }

        // Project Planner: New Project Form
        const projectForm = $('#project-form');
        if (projectForm) {
            projectForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleCreateProject();
            });
        }

        // Clear Recent Workflows
        const clearRecentBtn = $('#clearRecentWorkflowsBtn');
        if (clearRecentBtn) {
            clearRecentBtn.addEventListener('click', () => {
                this.recentWorkflows = [];
                this.saveRecentWorkflows();
                this.renderRecentWorkflows();
                showToast("Recent workflows cleared", "bi-check2-circle");
            });
        }

        // Settings Actions
        const themeSelect = $('#theme-select');
        if (themeSelect) {
            themeSelect.addEventListener('change', (e) => this.setTheme(e.target.value));
        }

        const soundToggle = $('#soundEffectsToggle');
        if (soundToggle) {
            soundToggle.addEventListener('change', (e) => {
                audio.enabled = e.target.checked;
                showToast(`Audio synthesis ${audio.enabled ? 'enabled' : 'disabled'}`);
            });
        }

        const ambientToggle = $('#ambientAnimationsToggle');
        if (ambientToggle) {
            ambientToggle.addEventListener('change', (e) => {
                document.body.classList.toggle('no-animations', !e.target.checked);
            });
        }

        const saveProfileBtn = $('#saveProfileBtn');
        if (saveProfileBtn) {
            saveProfileBtn.addEventListener('click', () => {
                const name = $('#setting-operator-name')?.value.trim();
                localStorage.setItem('syntrix_operator_name', name || 'Senior AI Architect');
                showToast("Architect profile updated successfully", "bi-person-check-fill");
            });
        }

        const seedDemoBtn = $('#seedDemoDataBtn');
        if (seedDemoBtn) {
            seedDemoBtn.addEventListener('click', () => {
                this.projects = JSON.parse(JSON.stringify(DEFAULT_PROJECTS));
                this.documents = JSON.parse(JSON.stringify(DEFAULT_DOCUMENTS));
                this.saveProjects();
                this.saveDocuments();
                this.renderProjects();
                this.renderVault();
                showToast("Sample demo data re-seeded", "bi-database-check");
            });
        }

        const resetDataBtn = $('#reset-data');
        if (resetDataBtn) {
            resetDataBtn.addEventListener('click', () => {
                if (confirm("Are you sure you want to perform a factory reset? This will clear all local storage.")) {
                    localStorage.clear();
                    location.reload();
                }
            });
        }

        // Executive Statistics Report Actions (Gold, Yellow, Brown & White Edition)
        const exportCsvBtn = $('#exportReportCsvBtn');
        if (exportCsvBtn) {
            exportCsvBtn.addEventListener('click', () => this.exportStatisticsCSV());
        }

        const printReportBtn = $('#printReportBtn');
        if (printReportBtn) {
            printReportBtn.addEventListener('click', () => window.print());
        }
    }

    // ------------------------------------------------------------------------
    // Theme Management
    // ------------------------------------------------------------------------
    initTheme() {
        const savedTheme = localStorage.getItem('syntrix_theme') || 'dark';
        this.setTheme(savedTheme, false);
        const themeSelect = $('#theme-select');
        if (themeSelect) themeSelect.value = savedTheme;
    }

    setTheme(theme, save = true) {
        document.documentElement.setAttribute('data-bs-theme', theme);
        if (save) {
            localStorage.setItem('syntrix_theme', theme);
            showToast(`Theme switched to ${theme === 'dark' ? 'Cyber Midnight' : 'Solar Clean'}`);
        }
        // Update Chart.js color palettes if initialized
        if (this.charts.distribution) {
            this.renderAnalyticsCharts();
        }
    }

    // ------------------------------------------------------------------------
    // Statistics & Counters
    // ------------------------------------------------------------------------
    updateStatsDisplay() {
        const sessions = Number(localStorage.getItem('syntrix_stat_sessions') || 28);
        const workflows = Number(localStorage.getItem('syntrix_stat_workflows') || 14);
        const tokens = localStorage.getItem('syntrix_stat_tokens') || "248.5K";

        const sessEl = $('#stat-sessions');
        const wfEl = $('#stat-workflows');
        const agentsEl = $('#stat-agents');
        const tokEl = $('#stat-tokens');

        if (sessEl) sessEl.textContent = sessions;
        if (wfEl) wfEl.textContent = workflows;
        if (agentsEl) agentsEl.textContent = AGENTS.length;
        if (tokEl) tokEl.textContent = tokens;
    }

    incrementWorkflowStats() {
        let sessions = Number(localStorage.getItem('syntrix_stat_sessions') || 28) + 1;
        let workflows = Number(localStorage.getItem('syntrix_stat_workflows') || 14) + 1;
        localStorage.setItem('syntrix_stat_sessions', sessions);
        localStorage.setItem('syntrix_stat_workflows', workflows);

        // Random simulated token increment
        const currentK = parseFloat(localStorage.getItem('syntrix_stat_tokens') || '248.5');
        const nextK = (currentK + 12.8).toFixed(1) + 'K';
        localStorage.setItem('syntrix_stat_tokens', nextK);

        this.updateStatsDisplay();
    }

    // ------------------------------------------------------------------------
    // Activity Stream Logger
    // ------------------------------------------------------------------------
    logActivity(text, agent = "Orchestrator") {
        const item = { text, time: "Just now", agent };
        this.activities.unshift(item);
        if (this.activities.length > 8) this.activities.pop();
        this.saveActivities();
        this.renderActivityStream();
    }

    renderActivityStream() {
        const container = $('#live-activity-stream');
        if (!container) return;
        container.innerHTML = this.activities.map(act => `
            <div class="activity-item">
                <span class="activity-dot"></span>
                <div class="d-flex justify-content-between align-items-center">
                    <span class="badge bg-dark border border-glass text-secondary xsmall-tag">${escapeHTML(act.agent)}</span>
                    <small class="text-secondary" style="font-size:0.75rem;">${escapeHTML(act.time)}</small>
                </div>
                <div class="text-light small mt-1">${escapeHTML(act.text)}</div>
            </div>
        `).join('');
    }

    // ------------------------------------------------------------------------
    // Recent Workflows List
    // ------------------------------------------------------------------------
    renderRecentWorkflows() {
        const list = $('#recent-workflows-list');
        if (!list) return;

        if (this.recentWorkflows.length === 0) {
            list.innerHTML = `<div class="p-4 text-center text-secondary small">No recent workflows recorded yet. Enter a request above to launch one.</div>`;
            return;
        }

        list.innerHTML = this.recentWorkflows.slice(0, 5).map((wf, idx) => `
            <div class="list-group-item bg-transparent border-glass text-light px-2 py-3 d-flex justify-content-between align-items-center">
                <div class="d-flex align-items-center gap-3">
                    <div class="stat-icon-wrapper bg-violet-subtle text-violet">
                        <i class="bi bi-diagram-3"></i>
                    </div>
                    <div>
                        <div class="fw-semibold small">${escapeHTML(wf.title)}</div>
                        <small class="text-secondary">${escapeHTML(wf.date)} &bull; 6 Agents Coordinated</small>
                    </div>
                </div>
                <span class="badge bg-success-subtle text-success small">${escapeHTML(wf.status)}</span>
            </div>
        `).join('');
    }

    // ------------------------------------------------------------------------
    // 6. MAIN FEATURE: MULTI-AGENT WORKFLOW COLLABORATION
    // ------------------------------------------------------------------------
    setAgentStatus(agentId, status) {
        const agent = AGENTS.find(a => a.id === agentId);
        if (agent) agent.status = status;

        // Update badge on Agent Control Center card if present
        const badge = $(`#agent-status-badge-${agentId}`);
        if (badge) {
            badge.className = `badge badge-status-${status.toLowerCase()}`;
            badge.textContent = status;
        }

        // Update mini tracker pill in Overview timeline if present
        const miniPill = $(`#tracker-pill-${agentId}`);
        if (miniPill) {
            miniPill.className = `col-4 col-md-2 agent-mini-pill ${status.toLowerCase()}`;
            const iconEl = miniPill.querySelector('i');
            if (iconEl) {
                if (status === 'Working') {
                    iconEl.className = 'bi bi-arrow-repeat text-neon spinner-border spinner-border-sm';
                } else if (status === 'Completed') {
                    iconEl.className = 'bi bi-check2-circle text-success';
                } else {
                    iconEl.className = 'bi bi-dash-circle text-secondary';
                }
            }
        }
    }

    startWorkflow(customPrompt = null, customScenario = null) {
        if (this.isWorkflowRunning) {
            showToast("A collaborative workflow is currently in progress", "bi-hourglass-split", false);
            return;
        }

        const promptInput = $('#prompt-input');
        const prompt = customPrompt || (promptInput ? promptInput.value.trim() : '');

        if (!prompt) {
            showToast("Please enter an objective or problem statement", "bi-exclamation-circle", false);
            audio.playWarning();
            return;
        }

        this.isWorkflowRunning = true;
        audio.playChime();

        // Reveal the timeline progress UI
        const timeline = $('#workflow-timeline');
        const progressBar = $('#workflow-progress-bar');
        const progressPercent = $('#workflow-progress-percent');
        const stepDesc = $('#workflow-step-desc');
        const trackerPills = $('#agent-tracker-pills');

        if (timeline) timeline.classList.remove('d-none');
        if (progressBar) progressBar.style.width = '0%';
        if (progressPercent) progressPercent.textContent = '0%';

        // Render mini tracker pills for the 6 agents
        if (trackerPills) {
            trackerPills.innerHTML = AGENTS.map(a => `
                <div class="col-6 col-md-2">
                    <div class="agent-mini-pill text-center pending" id="tracker-pill-${a.id}">
                        <div class="d-flex align-items-center justify-content-center gap-1 mb-1">
                            <i class="bi bi-dash-circle text-secondary"></i>
                            <span class="fw-semibold text-truncate">${escapeHTML(a.name.replace(' Agent', ''))}</span>
                        </div>
                        <small class="text-secondary" style="font-size:0.68rem;">Pending</small>
                    </div>
                </div>
            `).join('');
        }

        // Reset all agent statuses to Pending
        AGENTS.forEach(a => this.setAgentStatus(a.id, 'Pending'));

        // Prepare contributions (use curated scenario or dynamic code generator)
        const contributions = customScenario ? customScenario.contributions : generateDynamicContributions(prompt);

        // Sequential multi-agent activation loop
        let currentStep = 0;
        const totalSteps = AGENTS.length;

        const executeStep = () => {
            if (currentStep < totalSteps) {
                const agent = AGENTS[currentStep];
                const contrib = contributions[currentStep];

                // Set agent to Working
                this.setAgentStatus(agent.id, 'Working');
                if (stepDesc) {
                    stepDesc.textContent = `${agent.name} is ${agent.role.toLowerCase()}...`;
                }
                audio.playTone(440 + currentStep * 70, 0.05);

                // Progress update
                const percent = Math.round(((currentStep + 0.5) / totalSteps) * 100);
                if (progressBar) progressBar.style.width = `${percent}%`;
                if (progressPercent) progressPercent.textContent = `${percent}%`;

                setTimeout(() => {
                    // Complete step
                    this.setAgentStatus(agent.id, 'Completed');
                    const completedPercent = Math.round(((currentStep + 1) / totalSteps) * 100);
                    if (progressBar) progressBar.style.width = `${completedPercent}%`;
                    if (progressPercent) progressPercent.textContent = `${completedPercent}%`;

                    this.logActivity(`${agent.name} completed: ${contrib.title}`, agent.name.replace(' Agent', ''));

                    currentStep++;
                    executeStep();
                }, 900);
            } else {
                // All agents completed
                this.finishWorkflow(prompt, contributions);
            }
        };

        executeStep();
    }

    finishWorkflow(prompt, contributions) {
        const stepDesc = $('#workflow-step-desc');
        const progressBar = $('#workflow-progress-bar');
        const progressPercent = $('#workflow-progress-percent');

        if (stepDesc) stepDesc.textContent = "Workflow synthesized successfully. Response dispatched.";
        if (progressBar) {
            progressBar.style.width = '100%';
            progressBar.classList.remove('progress-bar-animated');
        }
        if (progressPercent) progressPercent.textContent = '100%';

        audio.playChime();
        this.isWorkflowRunning = false;

        // Increment stats & persist
        this.incrementWorkflowStats();

        // Record in recent workflows
        const newWorkflowRecord = {
            title: prompt.length > 55 ? prompt.substring(0, 52) + '...' : prompt,
            date: "Just now",
            status: "Completed",
            agents: 6
        };
        this.recentWorkflows.unshift(newWorkflowRecord);
        if (this.recentWorkflows.length > 8) this.recentWorkflows.pop();
        this.saveRecentWorkflows();
        this.renderRecentWorkflows();

        // Also append structured result into the AI Workspace chat
        this.appendWorkflowResultToChat(prompt, contributions);

        showToast("Multi-Agent Collaborative Workflow completed!", "bi-check-circle-fill");
    }

    appendWorkflowResultToChat(prompt, contributions) {
        const chatWindow = $('#chat-window');
        if (!chatWindow) return;

        // User message bubble
        const userBubble = document.createElement('div');
        userBubble.className = 'chat-bubble user';
        userBubble.innerHTML = `
            <div class="bubble-header d-flex align-items-center justify-content-between mb-1">
                <span class="fw-semibold small"><i class="bi bi-person-fill me-1"></i>You</span>
                <small class="text-white-50">Just now</small>
            </div>
            <div class="bubble-content">${escapeHTML(prompt)}</div>
        `;
        chatWindow.appendChild(userBubble);

        // Multi-Agent Synthesis AI Card Bubble
        const aiBubble = document.createElement('div');
        aiBubble.className = 'chat-bubble ai workflow-card';
        aiBubble.innerHTML = `
            <div class="bubble-header d-flex justify-content-between align-items-center mb-3 pb-2 border-bottom border-glass">
                <div class="d-flex align-items-center gap-2">
                    <span class="badge bg-neon-pill px-2 py-1"><i class="bi bi-stars me-1"></i>AI TEAM COLLABORATION</span>
                    <span class="badge bg-success-subtle text-success">6/6 Agents Responded</span>
                </div>
                <button class="btn btn-sm btn-outline-glass py-0 px-2 copy-workflow-btn" title="Copy full response">
                    <i class="bi bi-clipboard me-1"></i> Copy All
                </button>
            </div>
            <div class="bubble-content">
                <p class="text-light small mb-3">
                    Here is the complete solution prepared by your <strong>SYNTRIX Agent Team</strong> (Coordinator, Research, Coder, Analyst, Planner & Review):
                </p>
                <div class="row g-3 mb-3">
                    ${contributions.map(c => {
                        const agentObj = AGENTS.find(a => a.name === c.agent);
                        const icon = agentObj ? agentObj.icon : 'bi-cpu';
                        const color = agentObj ? agentObj.color : '#F59E0B';
                        const badgeText = agentObj ? agentObj.badge : 'AI Agent';
                        const isCodeBlock = !!c.code;

                        return `
                            <div class="${isCodeBlock ? 'col-12' : 'col-12 col-md-6'}">
                                <div class="p-3 rounded glass border-glass h-100" style="border-left: 3px solid ${color} !important;">
                                    <div class="d-flex align-items-center justify-content-between mb-2">
                                        <div class="d-flex align-items-center gap-2">
                                            <i class="${icon}" style="color:${color}; font-size:1.15rem;"></i>
                                            <strong class="text-light small">${escapeHTML(c.agent)}</strong>
                                            <span class="badge bg-dark border border-glass text-secondary" style="font-size:0.68rem;">${escapeHTML(badgeText)}</span>
                                        </div>
                                        <span class="badge bg-success-subtle text-success" style="font-size:0.68rem;"><i class="bi bi-check2"></i> Done</span>
                                    </div>
                                    <h6 class="text-neon small fw-semibold mb-1">${escapeHTML(c.title)}</h6>
                                    <p class="text-secondary small mb-2" style="line-height:1.45;">${escapeHTML(c.content)}</p>
                                    
                                    ${c.code ? `
                                        <div class="code-container">
                                            <div class="code-header">
                                                <span class="lang-tag"><i class="bi bi-file-earmark-code me-1"></i>${escapeHTML(c.codeLang || 'CODE')}</span>
                                                <button class="btn-copy-code" type="button" title="Copy code snippet">
                                                    <i class="bi bi-clipboard me-1"></i>Copy Code
                                                </button>
                                            </div>
                                            <pre class="code-block"><code>${escapeHTML(c.code)}</code></pre>
                                        </div>
                                    ` : ''}
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
                <div class="p-2 rounded bg-dark border border-glass d-flex justify-content-between align-items-center small text-secondary">
                    <span><i class="bi bi-shield-check text-success me-1"></i> Inspector Review: Passed with zero errors</span>
                    <span>Ready to copy & run directly</span>
                </div>
            </div>
        `;
        chatWindow.appendChild(aiBubble);
        chatWindow.scrollTop = chatWindow.scrollHeight;

        // Bind copy button for the entire workflow
        const copyBtn = aiBubble.querySelector('.copy-workflow-btn');
        if (copyBtn) {
            copyBtn.addEventListener('click', () => {
                let plainText = `=== SYNTRIX AI TEAM SOLUTION ===\nPrompt: ${prompt}\n\n`;
                contributions.forEach(c => {
                    plainText += `[${c.agent} - ${c.title}]\n${c.content}\n`;
                    if (c.code) {
                        plainText += `\n--- CODE (${c.codeLang || 'code'}) ---\n${c.code}\n--------------------\n`;
                    }
                    plainText += `\n`;
                });
                navigator.clipboard.writeText(plainText).then(() => {
                    showToast("Full report & code copied to clipboard!", "bi-clipboard-check");
                });
            });
        }

        // Bind individual code block copy buttons
        aiBubble.querySelectorAll('.btn-copy-code').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const codeEl = btn.closest('.code-container').querySelector('code');
                if (codeEl) {
                    navigator.clipboard.writeText(codeEl.innerText).then(() => {
                        const originalHtml = btn.innerHTML;
                        btn.innerHTML = '<i class="bi bi-check2 text-success me-1"></i>Copied!';
                        showToast("Code copied to clipboard!", "bi-check2-circle");
                        setTimeout(() => { btn.innerHTML = originalHtml; }, 2000);
                    });
                }
            });
        });
    }

    // ------------------------------------------------------------------------
    // Curated Demo Scenarios
    // ------------------------------------------------------------------------
    runDemoScenario(key) {
        const scenario = DEMO_SCENARIOS[key];
        if (!scenario) return;

        const promptInput = $('#prompt-input');
        if (promptInput) promptInput.value = scenario.prompt;

        showToast(`Running Curated Scenario: ${scenario.title}`, "bi-play-circle-fill");
        this.startWorkflow(scenario.prompt, scenario);
    }

    // ------------------------------------------------------------------------
    // 7. AI WORKSPACE & CHAT
    // ------------------------------------------------------------------------
    renderSuggestedPrompts() {
        const container = $('#workspace-suggestions');
        if (!container) return;

        container.innerHTML = SUGGESTED_PROMPTS.map(p => `
            <button type="button" class="prompt-pill-btn" data-prompt="${escapeHTML(p)}">
                <i class="bi bi-chevron-right me-1 text-neon"></i>${escapeHTML(p)}
            </button>
        `).join('');

        container.querySelectorAll('.prompt-pill-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const prompt = btn.dataset.prompt;
                const chatInput = $('#chat-input');
                if (chatInput) {
                    chatInput.value = prompt;
                    chatInput.focus();
                }
            });
        });
    }

    handleSendMessage() {
        const chatInput = $('#chat-input');
        if (!chatInput) return;
        const text = chatInput.value.trim();
        if (!text) return;

        const multiAgentMode = $('#multiAgentToggle')?.checked ?? true;

        if (multiAgentMode) {
            // Trigger multi-agent pipeline
            chatInput.value = '';
            this.startWorkflow(text);
        } else {
            // Direct single-agent response
            chatInput.value = '';
            this.appendSingleUserMessage(text);
            setTimeout(() => {
                this.appendSingleAIMessage(text);
            }, 700);
        }
    }

    appendSingleUserMessage(text) {
        const chatWindow = $('#chat-window');
        if (!chatWindow) return;
        const bubble = document.createElement('div');
        bubble.className = 'chat-bubble user';
        bubble.innerHTML = `
            <div class="bubble-header d-flex align-items-center justify-content-between mb-1">
                <span class="fw-semibold small"><i class="bi bi-person-fill me-1"></i>You (Architect)</span>
                <small class="text-white-50">Just now</small>
            </div>
            <div class="bubble-content">${escapeHTML(text)}</div>
        `;
        chatWindow.appendChild(bubble);
        chatWindow.scrollTop = chatWindow.scrollHeight;
        audio.playTone(660, 0.04);
    }

    appendSingleAIMessage(userText) {
        const chatWindow = $('#chat-window');
        if (!chatWindow) return;
        const bubble = document.createElement('div');
        bubble.className = 'chat-bubble ai';

        // Generate dynamic helpful answer with code if appropriate
        const dynamic = generateDynamicContributions(userText);
        const coderPart = dynamic.find(d => d.code);

        bubble.innerHTML = `
            <div class="bubble-header d-flex align-items-center gap-2 mb-2">
                <span class="badge bg-violet-subtle text-violet px-2"><i class="bi bi-robot me-1"></i>SYNTRIX AGENT</span>
                <small class="text-secondary">Just now</small>
            </div>
            <div class="bubble-content">
                <p class="mb-2">Here is the direct answer from <strong>SYNTRIX Agent</strong> for: "<strong>${escapeHTML(userText)}</strong>":</p>
                <p class="text-secondary small mb-2">${escapeHTML(dynamic[0].content)}</p>
                
                ${coderPart && coderPart.code ? `
                    <div class="code-container my-2">
                        <div class="code-header">
                            <span class="lang-tag"><i class="bi bi-file-earmark-code me-1"></i>${escapeHTML(coderPart.codeLang.toUpperCase())}</span>
                            <button class="btn-copy-code" type="button"><i class="bi bi-clipboard me-1"></i>Copy Code</button>
                        </div>
                        <pre class="code-block"><code>${escapeHTML(coderPart.code)}</code></pre>
                    </div>
                ` : ''}

                <div class="p-2 rounded bg-dark border border-glass small text-secondary mt-2">
                    <i class="bi bi-info-circle text-neon me-1"></i> Tip: Want all 6 specialized SYNTRIX Agents (Coordinator, Research, Coder, Analyst, Planner, Review) to collaborate on this? Make sure <strong>"Use All 6 Helpers at Once"</strong> is checked!
                </div>
            </div>
        `;
        chatWindow.appendChild(bubble);
        chatWindow.scrollTop = chatWindow.scrollHeight;
        audio.playTone(880, 0.05);

        // Bind copy button if code block exists
        bubble.querySelectorAll('.btn-copy-code').forEach(btn => {
            btn.addEventListener('click', () => {
                const pre = btn.closest('.code-container').querySelector('code');
                if (pre) {
                    navigator.clipboard.writeText(pre.innerText).then(() => {
                        const oldHtml = btn.innerHTML;
                        btn.innerHTML = '<i class="bi bi-check2 text-success me-1"></i>Copied!';
                        showToast("Code copied to clipboard!", "bi-check2-circle");
                        setTimeout(() => { btn.innerHTML = oldHtml; }, 2000);
                    });
                }
            });
        });
    }

    exportConversation() {
        const chatWindow = $('#chat-window');
        if (!chatWindow) return;
        const text = chatWindow.innerText;
        const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `syntrix-session-${Date.now()}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        showToast("Conversation exported as text file", "bi-download");
    }

    // ------------------------------------------------------------------------
    // 8. AGENT CONTROL CENTER
    // ------------------------------------------------------------------------
    renderAgentCards() {
        const container = $('#agent-cards-grid');
        if (!container) return;

        container.innerHTML = AGENTS.map(agent => `
            <div class="col-md-6 col-xl-4">
                <div class="card glass h-100 agent-master-card p-4" id="agent-card-${agent.id}">
                    <div class="d-flex justify-content-between align-items-start mb-3">
                        <div class="agent-card-icon" style="background:${agent.color}22; color:${agent.color};">
                            <i class="${agent.icon}"></i>
                        </div>
                        <div class="d-flex flex-column align-items-end gap-1">
                            <span class="badge bg-neon-pill" style="font-size:0.7rem;">${escapeHTML(agent.badge)}</span>
                            <span class="badge badge-status-${agent.status.toLowerCase()}" id="agent-status-badge-${agent.id}">
                                ${agent.status.toUpperCase()}
                            </span>
                        </div>
                    </div>
                    <h5 class="fw-bold text-light mb-1">${escapeHTML(agent.name)}</h5>
                    <div class="text-neon small fw-semibold mb-2">${escapeHTML(agent.role)}</div>
                    <p class="text-secondary small mb-3" style="min-height: 48px;">${escapeHTML(agent.description)}</p>

                    <div class="mb-3">
                        <small class="text-secondary d-block mb-1 fw-semibold" style="font-size:0.75rem;">WHAT THIS AGENT DOES BEST</small>
                        <div class="d-flex flex-wrap gap-1">
                            ${agent.capabilities.map(cap => `
                                <span class="capability-chip">${escapeHTML(cap)}</span>
                            `).join('')}
                        </div>
                    </div>

                    <div class="p-2 rounded bg-dark border border-glass d-flex justify-content-between align-items-center small text-secondary mb-3">
                        <span><i class="bi bi-speedometer2 me-1 text-neon"></i>${escapeHTML(agent.latency)}</span>
                        <span><i class="bi bi-activity me-1 text-warning"></i>${escapeHTML(agent.load)} Busy</span>
                        <span class="text-truncate" style="max-width:95px;"><i class="bi bi-cpu me-1"></i>${escapeHTML(agent.model.split('-')[0])}</span>
                    </div>

                    <div class="d-flex gap-2 mt-auto">
                        <button class="btn btn-outline-glass btn-sm flex-grow-1 ping-single-agent-btn" data-agent="${agent.id}">
                            <i class="bi bi-broadcast me-1"></i> Check Status
                        </button>
                        <button class="btn btn-outline-violet btn-sm test-single-agent-btn" data-agent="${agent.id}">
                            <i class="bi bi-play me-1"></i> Quick Test
                        </button>
                    </div>
                </div>
            </div>
        `).join('');

        // Ping individual agent
        container.querySelectorAll('.ping-single-agent-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.dataset.agent;
                const agent = AGENTS.find(a => a.id === id);
                if (agent) {
                    showToast(`Pinged ${agent.name}: latency 14ms (Healthy)`, "bi-broadcast");
                }
            });
        });

        // Test individual agent
        container.querySelectorAll('.test-single-agent-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.dataset.agent;
                const agent = AGENTS.find(a => a.id === id);
                if (agent) {
                    this.setAgentStatus(agent.id, 'Working');
                    showToast(`Dispatched test query to ${agent.name}...`, "bi-play");
                    setTimeout(() => {
                        this.setAgentStatus(agent.id, 'Completed');
                        showToast(`${agent.name} test diagnostics verified!`, "bi-check2-circle");
                        setTimeout(() => this.setAgentStatus(agent.id, 'Idle'), 2000);
                    }, 1200);
                }
            });
        });
    }

    pingAllAgents() {
        showToast("Broadcasting cluster ping to all 6 agent nodes...", "bi-broadcast");
        audio.playTone(700, 0.08);

        AGENTS.forEach((agent, idx) => {
            setTimeout(() => {
                const badge = $(`#agent-status-badge-${agent.id}`);
                if (badge) {
                    badge.classList.add('badge-status-working');
                    setTimeout(() => badge.classList.remove('badge-status-working'), 400);
                }
            }, idx * 80);
        });

        setTimeout(() => {
            showToast("All 6 agents responded: Average cluster latency 22.4ms", "bi-check2-all");
            audio.playChime();
        }, 600);
    }

    resetAllAgentStatuses() {
        AGENTS.forEach(a => this.setAgentStatus(a.id, 'Idle'));
        showToast("All agent statuses reset to Idle", "bi-arrow-counterclockwise");
    }

    // ------------------------------------------------------------------------
    // 9. KNOWLEDGE VAULT
    // ------------------------------------------------------------------------
    renderVault() {
        const container = $('#vault-documents-list');
        if (!container) return;

        const searchVal = $('#vault-search-input')?.value.toLowerCase().trim() || '';
        const catVal = $('#vault-category-filter')?.value || 'all';
        const typeVal = $('#vault-type-filter')?.value || 'all';

        const filtered = this.documents.filter(doc => {
            const matchesSearch = !searchVal ||
                doc.title.toLowerCase().includes(searchVal) ||
                doc.summary.toLowerCase().includes(searchVal) ||
                (doc.keywords && doc.keywords.some(k => k.toLowerCase().includes(searchVal)));
            const matchesCat = (catVal === 'all') || (doc.category === catVal);
            const matchesType = (typeVal === 'all') || (doc.type === typeVal);
            return matchesSearch && matchesCat && matchesType;
        });

        if (filtered.length === 0) {
            container.innerHTML = `
                <div class="col-12">
                    <div class="p-5 text-center glass border-glass">
                        <i class="bi bi-file-earmark-x fs-1 text-secondary mb-2"></i>
                        <h6 class="text-light">No documents match the current criteria</h6>
                        <small class="text-secondary">Try adjusting your search terms or filter selection.</small>
                    </div>
                </div>
            `;
            return;
        }

        container.innerHTML = filtered.map(doc => {
            let iconClass = 'bi-file-earmark-pdf-fill text-danger';
            if (doc.type === 'MD') iconClass = 'bi-file-earmark-code-fill text-neon';
            if (doc.type === 'JSON') iconClass = 'bi-file-earmark-text-fill text-warning';

            return `
                <div class="col-md-6 col-xl-4">
                    <div class="card glass h-100 p-3">
                        <div class="d-flex justify-content-between align-items-start mb-2">
                            <div class="d-flex align-items-center gap-2">
                                <i class="bi ${iconClass} fs-4"></i>
                                <div>
                                    <h6 class="fw-bold text-light mb-0 text-truncate" style="max-width: 190px;" title="${escapeHTML(doc.title)}">
                                        ${escapeHTML(doc.title)}
                                    </h6>
                                    <small class="text-secondary">${escapeHTML(doc.category)} &bull; ${escapeHTML(doc.size || '1.2 MB')}</small>
                                </div>
                            </div>
                            <span class="badge bg-dark border border-glass text-secondary">${escapeHTML(doc.type)}</span>
                        </div>
                        <p class="text-secondary small mb-3" style="font-size:0.82rem; min-height:48px;">
                            ${escapeHTML(doc.summary.substring(0, 110))}...
                        </p>
                        <div class="d-flex justify-content-between align-items-center mt-auto pt-2 border-top border-glass">
                            <span class="small text-secondary" style="font-size:0.75rem;"><i class="bi bi-clock me-1"></i>${escapeHTML(doc.date)}</span>
                            <button class="btn btn-outline-glass btn-sm view-doc-btn" data-doc-id="${doc.id}">
                                <i class="bi bi-eye me-1"></i> View Abstract
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        // Bind View Abstract buttons
        container.querySelectorAll('.view-doc-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const docId = btn.dataset.docId;
                const doc = this.documents.find(d => d.id === docId);
                if (doc) this.openDocPreview(doc);
            });
        });
    }

    openDocPreview(doc) {
        const titleEl = $('#preview-doc-title');
        const metaEl = $('#preview-doc-meta');
        const summaryEl = $('#preview-doc-summary');
        const askBtn = $('#askDocInWorkspaceBtn');

        if (titleEl) titleEl.textContent = doc.title;
        if (metaEl) metaEl.textContent = `${doc.category} Document • Format: ${doc.type} • Indexed on ${doc.date}`;
        if (summaryEl) summaryEl.textContent = doc.summary;

        if (askBtn) {
            askBtn.onclick = () => {
                // Close modal and navigate to workspace with question
                const modalEl = $('#docPreviewModal');
                if (modalEl && window.bootstrap && bootstrap.Modal) {
                    const inst = bootstrap.Modal.getInstance(modalEl);
                    if (inst) inst.hide();
                }
                this.navigateTo('workspace');
                const chatInput = $('#chat-input');
                if (chatInput) {
                    chatInput.value = `Synthesize key takeaways from document: "${doc.title}".`;
                    chatInput.focus();
                }
            };
        }

        const modalEl = $('#docPreviewModal');
        if (modalEl && window.bootstrap && bootstrap.Modal) {
            const modal = new bootstrap.Modal(modalEl);
            modal.show();
        }
    }

    handleDocumentUpload() {
        const title = $('#doc-upload-title')?.value.trim();
        const cat = $('#doc-upload-cat')?.value || 'Research';
        const type = $('#doc-upload-type')?.value || 'PDF';
        const summary = $('#doc-upload-summary')?.value.trim();

        if (!title || !summary) {
            showToast("Please fill in document title and summary", "bi-exclamation-circle", false);
            return;
        }

        const newDoc = {
            id: `doc-${Date.now()}`,
            title,
            category: cat,
            type,
            size: `${(Math.random() * 3 + 0.5).toFixed(1)} MB`,
            date: new Date().toISOString().split('T')[0],
            summary,
            keywords: title.toLowerCase().split(' ')
        };

        this.documents.unshift(newDoc);
        this.saveDocuments();
        this.renderVault();

        // Close modal
        const modalEl = $('#uploadDocModal');
        if (modalEl && window.bootstrap && bootstrap.Modal) {
            const modal = bootstrap.Modal.getInstance(modalEl);
            if (modal) modal.hide();
        }

        // Reset form
        $('#upload-doc-form')?.reset();

        showToast(`Document "${title}" vectorized & added to Vault!`, "bi-cloud-check-fill");
        this.logActivity(`Ingested new document: ${title}`, "Research");
    }

    handleVaultQA() {
        const input = $('#vault-qa-input');
        if (!input) return;
        const q = input.value.trim().toLowerCase();
        if (!q) {
            showToast("Please enter a question to query the vault", "bi-search", false);
            return;
        }

        const responseBox = $('#vault-qa-response');
        const sourceEl = $('#vault-qa-source');
        const textEl = $('#vault-qa-text');

        // Simple simulated grounded retrieval search across documents
        let bestDoc = this.documents[0];
        let maxMatches = 0;

        this.documents.forEach(doc => {
            const fullText = (doc.title + ' ' + doc.summary + ' ' + (doc.keywords || []).join(' ')).toLowerCase();
            const words = q.split(' ');
            let score = 0;
            words.forEach(w => {
                if (w.length > 2 && fullText.includes(w)) score++;
            });
            if (score > maxMatches) {
                maxMatches = score;
                bestDoc = doc;
            }
        });

        if (responseBox && sourceEl && textEl) {
            responseBox.classList.remove('d-none');
            sourceEl.textContent = `Grounded Source: ${bestDoc.title} (${bestDoc.category})`;
            textEl.innerHTML = `
                According to the indexed knowledge in <strong>${escapeHTML(bestDoc.title)}</strong>:<br>
                "${escapeHTML(bestDoc.summary)}"<br><br>
                <em>Syntrix Neural Extractor confirms 99.1% semantic alignment with query keywords.</em>
            `;
            audio.playChime();
            showToast("Grounded answer extracted from Vault", "bi-check-circle");
        }
    }

    // ------------------------------------------------------------------------
    // 10. PROJECT PLANNER
    // ------------------------------------------------------------------------
    renderProjects() {
        const container = $('#project-planner-container');
        if (!container) return;

        if (this.projects.length === 0) {
            container.innerHTML = `
                <div class="col-12">
                    <div class="p-5 text-center glass border-glass">
                        <i class="bi bi-kanban fs-1 text-secondary mb-2"></i>
                        <h6 class="text-light">No projects in planner</h6>
                        <small class="text-secondary">Click "New Project" above to create an actionable deliverable plan.</small>
                    </div>
                </div>
            `;
            return;
        }

        container.innerHTML = this.projects.map((proj, pIdx) => {
            const completedCount = proj.tasks.filter(t => t.completed).length;
            const totalCount = proj.tasks.length;
            const percent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

            return `
                <div class="col-lg-6">
                    <div class="card glass h-100 p-4 planner-project-card" id="project-card-${pIdx}">
                        <div class="d-flex justify-content-between align-items-start mb-2">
                            <div>
                                <h5 class="fw-bold text-light mb-1">${escapeHTML(proj.name)}</h5>
                                <small class="text-secondary">
                                    <i class="bi bi-person-fill text-violet me-1"></i>${escapeHTML(proj.lead)} &bull; 
                                    <i class="bi bi-calendar3 ms-1 me-1 text-neon"></i>Due ${escapeHTML(proj.deadline || 'TBD')}
                                </small>
                            </div>
                            <button class="btn btn-sm btn-outline-glass text-danger delete-project-btn" data-pidx="${pIdx}" title="Delete Project">
                                <i class="bi bi-trash3"></i>
                            </button>
                        </div>
                        <p class="text-secondary small mb-3">${escapeHTML(proj.desc)}</p>

                        <!-- Progress Bar -->
                        <div class="mb-3">
                            <div class="d-flex justify-content-between align-items-center mb-1 small">
                                <span class="text-secondary">Execution Progress:</span>
                                <span class="fw-semibold text-neon">${completedCount}/${totalCount} Tasks (${percent}%)</span>
                            </div>
                            <div class="progress progress-glass" style="height: 8px;">
                                <div class="progress-bar bg-gradient-neon-violet" style="width: ${percent}%;"></div>
                            </div>
                        </div>

                        <!-- Tasks List -->
                        <div class="mb-3">
                            <small class="text-secondary fw-semibold d-block mb-2">ACTION ITEMS & DELIVERABLES</small>
                            <div id="project-tasks-${pIdx}">
                                ${proj.tasks.map((task, tIdx) => `
                                    <div class="task-item-row ${task.completed ? 'completed-task' : ''}">
                                        <div class="d-flex align-items-center gap-2">
                                            <input class="form-check-input task-toggle-checkbox" type="checkbox" 
                                                   data-pidx="${pIdx}" data-tidx="${tIdx}" ${task.completed ? 'checked' : ''} />
                                            <span class="task-title small text-light">${escapeHTML(task.title)}</span>
                                        </div>
                                        <div class="d-flex align-items-center gap-2">
                                            <span class="badge bg-dark border border-glass text-secondary" style="font-size:0.7rem;">${escapeHTML(task.priority || 'Med')}</span>
                                            <button class="btn btn-sm text-secondary p-0 delete-task-btn" data-pidx="${pIdx}" data-tidx="${tIdx}">
                                                <i class="bi bi-x"></i>
                                            </button>
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                        </div>

                        <!-- Add Task Input Form -->
                        <form class="mt-auto add-task-form" data-pidx="${pIdx}">
                            <div class="input-group input-group-sm">
                                <input type="text" class="form-control glass-input text-light border-glass" 
                                       placeholder="Add task to this project..." required />
                                <button class="btn btn-violet-gradient" type="submit">
                                    <i class="bi bi-plus-lg"></i>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            `;
        }).join('');

        // Bind Task Checkboxes
        container.querySelectorAll('.task-toggle-checkbox').forEach(cb => {
            cb.addEventListener('change', (e) => {
                const pIdx = parseInt(e.target.dataset.pidx, 10);
                const tIdx = parseInt(e.target.dataset.tidx, 10);
                if (this.projects[pIdx] && this.projects[pIdx].tasks[tIdx]) {
                    this.projects[pIdx].tasks[tIdx].completed = e.target.checked;
                    this.saveProjects();
                    this.renderProjects();
                    audio.playTone(e.target.checked ? 880 : 440, 0.04);
                }
            });
        });

        // Bind Delete Task Buttons
        container.querySelectorAll('.delete-task-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const pIdx = parseInt(btn.dataset.pidx, 10);
                const tIdx = parseInt(btn.dataset.tidx, 10);
                if (this.projects[pIdx]) {
                    this.projects[pIdx].tasks.splice(tIdx, 1);
                    this.saveProjects();
                    this.renderProjects();
                }
            });
        });

        // Bind Delete Project Buttons
        container.querySelectorAll('.delete-project-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const pIdx = parseInt(btn.dataset.pidx, 10);
                if (confirm(`Delete project "${this.projects[pIdx].name}"?`)) {
                    this.projects.splice(pIdx, 1);
                    this.saveProjects();
                    this.renderProjects();
                    showToast("Project deleted", "bi-trash3");
                }
            });
        });

        // Bind Add Task Forms
        container.querySelectorAll('.add-task-form').forEach(form => {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                const pIdx = parseInt(form.dataset.pidx, 10);
                const input = form.querySelector('input');
                const title = input ? input.value.trim() : '';
                if (!title) return;

                this.projects[pIdx].tasks.push({
                    id: `t-${Date.now()}`,
                    title,
                    completed: false,
                    priority: "Med"
                });
                this.saveProjects();
                this.renderProjects();
                showToast("New task added to project", "bi-plus-circle");
            });
        });
    }

    handleCreateProject() {
        const name = $('#project-name')?.value.trim();
        const desc = $('#project-desc')?.value.trim();
        const lead = $('#project-lead')?.value || 'Planning Agent';
        const deadline = $('#project-deadline')?.value || '2026-06-01';

        if (!name) {
            showToast("Project title is required", "bi-exclamation-circle", false);
            return;
        }

        const newProject = {
            id: `proj-${Date.now()}`,
            name,
            desc: desc || "Autonomous project initiatives formulated by Syntrix Agent Mesh.",
            lead,
            deadline,
            tasks: [
                { id: `t-${Date.now()}-1`, title: "Define technical milestones and success metrics", completed: false, priority: "High" },
                { id: `t-${Date.now()}-2`, title: "Conduct multi-agent feasibility simulation", completed: false, priority: "Med" }
            ]
        };

        this.projects.unshift(newProject);
        this.saveProjects();
        this.renderProjects();

        // Close modal & reset
        const modalEl = $('#newProjectModal');
        if (modalEl && window.bootstrap && bootstrap.Modal) {
            const modal = bootstrap.Modal.getInstance(modalEl);
            if (modal) modal.hide();
        }
        $('#project-form')?.reset();

        showToast(`Project "${name}" created!`, "bi-folder-check");
        this.logActivity(`Created new project: ${name}`, "Planning");
    }

    // ------------------------------------------------------------------------
    // 11. ANALYTICS & TELEMETRY CHARTS (CHART.JS)
    // ------------------------------------------------------------------------
    renderAnalyticsCharts() {
        if (typeof Chart === 'undefined') return;

        const isDark = document.documentElement.getAttribute('data-bs-theme') !== 'light';
        const textPrimary = isDark ? '#F4F4FA' : '#121226';
        const textSecondary = isDark ? '#9292A5' : '#585872';
        const gridColor = isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.06)';

        // 1. Agent Distribution Doughnut Chart
        const distCtx = $('#agentDistributionChart');
        if (distCtx) {
            if (this.charts.distribution) this.charts.distribution.destroy();
            this.charts.distribution = new Chart(distCtx, {
                type: 'doughnut',
                data: {
                    labels: AGENTS.map(a => a.name.replace(' Agent', '')),
                    datasets: [{
                        data: [28, 22, 16, 14, 12, 8],
                        backgroundColor: [
                            '#F59E0B',
                            '#FBBF24',
                            '#D97706',
                            '#EAB308',
                            '#B45309',
                            '#CA8A04'
                        ],
                        borderWidth: 2,
                        borderColor: isDark ? '#1C1610' : '#FFFFFF'
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'right',
                            labels: { color: textPrimary, font: { size: 11, family: 'Inter' } }
                        }
                    },
                    cutout: '68%'
                }
            });
        }

        // 2. Throughput Line Chart
        const tpCtx = $('#throughputChart');
        if (tpCtx) {
            if (this.charts.throughput) this.charts.throughput.destroy();
            this.charts.throughput = new Chart(tpCtx, {
                type: 'line',
                data: {
                    labels: ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00', 'Now'],
                    datasets: [{
                        label: 'Workflows Executed / hr',
                        data: [4, 7, 18, 34, 42, 38, 48],
                        borderColor: '#F59E0B',
                        backgroundColor: 'rgba(245, 158, 11, 0.15)',
                        fill: true,
                        tension: 0.4,
                        borderWidth: 2,
                        pointBackgroundColor: '#FBBF24'
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: { color: textSecondary, font: { size: 10 } },
                            grid: { color: gridColor }
                        },
                        x: {
                            ticks: { color: textSecondary, font: { size: 10 } },
                            grid: { display: false }
                        }
                    },
                    plugins: {
                        legend: { labels: { color: textPrimary, font: { size: 11 } } }
                    }
                }
            });
        }

        // 3. Token Usage Bar Chart
        const tokCtx = $('#tokenUsageChart');
        if (tokCtx) {
            if (this.charts.tokenUsage) this.charts.tokenUsage.destroy();
            this.charts.tokenUsage = new Chart(tokCtx, {
                type: 'bar',
                data: {
                    labels: AGENTS.map(a => a.name.replace(' Agent', '')),
                    datasets: [{
                        label: 'Synthesized Tokens (Thousands)',
                        data: [64.2, 88.5, 42.1, 51.0, 34.8, 18.2],
                        backgroundColor: 'rgba(217, 119, 6, 0.75)',
                        hoverBackgroundColor: '#F59E0B',
                        borderRadius: 6
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: { color: textSecondary, font: { size: 10 } },
                            grid: { color: gridColor }
                        },
                        x: {
                            ticks: { color: textSecondary, font: { size: 10 } },
                            grid: { display: false }
                        }
                    },
                    plugins: {
                        legend: { labels: { color: textPrimary, font: { size: 11 } } }
                    }
                }
            });
        }
    }
}

// ============================================================================
// 12. BOOTSTRAP INITIALIZATION
// ============================================================================

window.addEventListener('DOMContentLoaded', () => {
    window.syntrix = new SyntrixApp();
    window.syntrix.init();
});
