/* ==========================================================================
   KERALA SCIENCE CITY - DOCUMENT MANAGEMENT SYSTEM MAIN CONTROL SCRIPT
   ========================================================================== */

// --- GOOGLE SPREADSHEETS INTEGRATION CONFIGURATION ---
const SPREADSHEET_CONFIG = {
    // Submission Register Public CSV URL
    submissionsUrl: "https://docs.google.com/spreadsheets/d/1z3pMERl1HH2KKIQJtIE2gRElpjQwPRQb5VSfct521Cc/gviz/tq?tqx=out:csv",
    // Office Order Register Public CSV URL
    ordersUrl: "https://docs.google.com/spreadsheets/d/1_yeOVxT5PWre9sxlXrAEsGLgSD4OLIpsTHAtevl1qzk/gviz/tq?tqx=out:csv"
};

// --- REALISTIC DUMMY FALLBACK DATA (For offline/sandbox demonstration) ---
const MOCK_DATA = {
    submissions: [
        {
            id: "KSC/SUB/2026/001",
            timestamp: "5/31/2026 16:30:56",
            date: "5/5/2026",
            subject: "Extension of Gallery Trainees Service",
            submitter: "Sujith B Kallara",
            category: "Establishment & HR",
            document: "Request_for_Extension_of_Gallery_Trainees_Service_signed - Sujith.pdf",
            refNumber: "KSC/EST/1029",
            status: "Pending",
            remarks: "Pending Director approval. Verification of trainee logs completed.",
            officeOrderNo: "KSSTM/37/2026-HC",
            followup: "Yes"
        },
        {
            id: "KSC/SUB/2026/002",
            timestamp: "5/30/2026 11:20:12",
            date: "5/12/2026",
            subject: "Procurement of Laser Projection Systems for Space Theater",
            submitter: "Dr. Anoop S (Planetarium Admin)",
            category: "Technical & IT",
            document: "Planetarium_Laser_Projector_Tender_Specifications.pdf",
            refNumber: "PL/TEND/2026/04",
            status: "Completed",
            remarks: "Procurement finalized. Equipment delivery scheduled for mid-June.",
            officeOrderNo: "KSSTM/ORD-441-26",
            followup: "No"
        },
        {
            id: "KSC/SUB/2026/003",
            timestamp: "5/28/2026 14:15:00",
            date: "5/18/2026",
            subject: "Proposal for Science Demonstration Gallery Renovations",
            submitter: "Meera Nair (Education Officer)",
            category: "Exhibits & Education",
            document: "Renovation_Blueprint_SDG_Phase1.pdf",
            refNumber: "KSC/EDU/2026/182",
            status: "In Progress",
            remarks: "Forwarded to Finance. Layout design approved by the advisory board.",
            officeOrderNo: "",
            followup: "Yes"
        },
        {
            id: "KSC/SUB/2026/004",
            timestamp: "5/25/2026 09:30:45",
            date: "5/22/2026",
            subject: "Security Services Contract Renewal for Kerala Science City Campus",
            submitter: "R. Jayachandran (Security Officer)",
            category: "Administration & Facilities",
            document: "Security_Contract_Renewal_Terms_Draft.pdf",
            refNumber: "KSC/ADM/SEC-22",
            status: "Follow-up Required",
            remarks: "Requires revised budget justification sheet from agency.",
            officeOrderNo: "",
            followup: "Yes"
        },
        {
            id: "KSC/SUB/2026/005",
            timestamp: "5/24/2026 17:05:00",
            date: "5/24/2026",
            subject: "Installation of High-Speed Optical Fiber Internet Link",
            submitter: "Hari Prasad V (IT Systems Analyst)",
            category: "Technical & IT",
            document: "ISP_Broadband_Dedicated_Line_MoU.pdf",
            refNumber: "KSC/SYS/ISP-01",
            status: "Approved",
            remarks: "MoU signed. Initial setup works initiated.",
            officeOrderNo: "KSSTM/ORD-398-26",
            followup: "No"
        }
    ],
    orders: [
        {
            orderNo: "KSSTM/37/2026-HC",
            timestamp: "5/31/2026 10:52:14",
            date: "3/23/2026",
            subject: "വിനോദസഞ്ചാര വകുപ്പ് - VITM അറ്റകുറ്റപ്പണികൾ",
            submissionId: "KSC/SUB/2026/001",
            description: "Allocation of funds and scheduling for VITM maintenance operations, signed by Administrative Officer.",
            file: "Training order_0001 - Sujith.pdf"
        },
        {
            orderNo: "KSSTM/ORD-441-26",
            timestamp: "5/30/2026 17:40:00",
            date: "5/29/2026",
            subject: "Sanctioning Order - Planetarium Laser Projector Procurement",
            submissionId: "KSC/SUB/2026/002",
            description: "Official administrative and financial sanction of ₹42,50,000/- for importing Space Theater lasers.",
            file: "Sanction_Order_Planetarium_Laser_Projectors.pdf"
        },
        {
            orderNo: "KSSTM/ORD-398-26",
            timestamp: "5/26/2026 11:15:33",
            date: "5/25/2026",
            subject: "Work Allotment - BSNL High-Speed Dedicated Internet Fiber Leased Line",
            submissionId: "KSC/SUB/2026/005",
            description: "Official order authorizing ISP infrastructure provisioning inside Administrative Block.",
            file: "Work_Order_Fiber_MoU_Signed.pdf"
        }
    ]
};

// --- GLOBAL APPLICATION STATE ---
let AppState = {
    submissions: [],
    orders: [],
    categories: new Set(),
    activeTab: "dashboard",
    
    // Pagination states
    submissionsPage: 1,
    ordersPage: 1,
    itemsPerPage: 10,
    
    // Cached lists after filtering
    filteredSubmissions: [],
    filteredOrders: []
};

// --- UTILITIES & SECURITY ENCODING ---

// Secure HTML encoding to prevent XSS payloads
function escapeHTML(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

// Robust, self-contained CSV Parser (Handles Quotes, Commas, and Multi-line values)
function parseCSV(text) {
    if (!text || text.trim() === '') return [];
    
    const lines = [];
    let row = [""];
    let inQuotes = false;
    
    for (let i = 0; i < text.length; i++) {
        let c = text[i];
        let next = text[i+1];
        
        if (c === '"') {
            if (inQuotes && next === '"') {
                row[row.length - 1] += '"';
                i++; // Skip secondary quote
            } else {
                inQuotes = !inQuotes;
            }
        } else if (c === ',' && !inQuotes) {
            row.push("");
        } else if ((c === '\r' || c === '\n') && !inQuotes) {
            if (c === '\r' && next === '\n') { i++; }
            lines.push(row);
            row = [""];
        } else {
            row[row.length - 1] += c;
        }
    }
    
    if (row.length > 1 || row[0] !== "") {
        lines.push(row);
    }
    
    if (lines.length === 0) return [];
    
    // Process Header Row & Normalize whitespace
    const headers = lines[0].map(h => h.trim().replace(/^"|"$/g, ''));
    const records = [];
    
    for (let i = 1; i < lines.length; i++) {
        const values = lines[i];
        // Skip trailing empty rows or mismatch structures
        if (values.length < headers.length) continue;
        
        const obj = {};
        for (let j = 0; j < headers.length; j++) {
            obj[headers[j]] = values[j] ? values[j].trim() : '';
        }
        records.push(obj);
    }
    
    return records;
}

// Resilient Key Normalizer for Submissions Sheet (Case-insensitive fuzzy matching)
function normalizeSubmission(row) {
    const keys = Object.keys(row);
    const getVal = (patterns) => {
        const matchKey = keys.find(k => patterns.some(p => k.trim().toLowerCase().includes(p.toLowerCase())));
        return matchKey ? row[matchKey].trim() : '';
    };
    
    return {
        id: getVal(['submission id']),
        timestamp: getVal(['timestamp']),
        date: getVal(['submission date']) || getVal(['date']) || 'N/A',
        subject: getVal(['subject']) || 'Untitled Submission',
        submitter: getVal(['submitted by']) || 'Anonymous',
        category: getVal(['category']) || 'General',
        document: getVal(['upload submission document', 'document', 'file']),
        refNumber: getVal(['reference number']),
        status: getVal(['status']) || 'Pending',
        remarks: getVal(['remarks']),
        officeOrderNo: getVal(['office order no', 'order no']),
        followup: getVal(['follow-up required', 'followup'])
    };
}

// Resilient Key Normalizer for Office Orders Sheet
function normalizeOrder(row) {
    const keys = Object.keys(row);
    const getVal = (patterns) => {
        const matchKey = keys.find(k => patterns.some(p => k.trim().toLowerCase().includes(p.toLowerCase())));
        return matchKey ? row[matchKey].trim() : '';
    };
    
    return {
        orderNo: getVal(['office order no', 'order no']) || 'UNKNOWN-ORDER',
        timestamp: getVal(['timestamp']),
        date: getVal(['date']) || 'N/A',
        subject: getVal(['subject']) || 'No Subject',
        submissionId: getVal(['related submission id', 'submission id']),
        description: getVal(['description', 'desc']),
        file: getVal(['file', 'document', 'attachment'])
    };
}

// --- DOM CREATION UTILITIES (100% SAFE FROM XSS) ---

// Safe dynamic tag creator
function createDOMNode(tag, classes = [], text = '', attributes = {}) {
    const el = document.createElement(tag);
    classes.forEach(c => el.classList.add(c));
    if (text) el.textContent = text;
    for (const [key, val] of Object.entries(attributes)) {
        el.setAttribute(key, val);
    }
    return el;
}

// Clear and refresh an element content securely
function safeClearElement(element) {
    if (element) {
        element.replaceChildren();
    }
}

// --- DATA SERVICES & SYNCHRONIZATION ---

// Fetch data from public sheet CSV or fallback gracefully
async function syncRegistryData() {
    updateSyncStatusIndicator("Syncing data...", true);
    
    try {
        // Run parallel fetch requests to direct CSV endpoints
        const [subResponse, orderResponse] = await Promise.all([
            fetch(SPREADSHEET_CONFIG.submissionsUrl, { cache: "no-store" }),
            fetch(SPREADSHEET_CONFIG.ordersUrl, { cache: "no-store" })
        ]);
        
        if (!subResponse.ok || !orderResponse.ok) {
            throw new Error(`HTTP Error. Submissions: ${subResponse.status}, Orders: ${orderResponse.status}`);
        }
        
        const subCsvText = await subResponse.text();
        const orderCsvText = await orderResponse.text();
        
        const rawSubmissions = parseCSV(subCsvText);
        const rawOrders = parseCSV(orderCsvText);
        
        if (rawSubmissions.length === 0 && rawOrders.length === 0) {
            throw new Error("Parsed data fields are empty");
        }
        
        // Normalize rows safely
        AppState.submissions = rawSubmissions.map(normalizeSubmission);
        AppState.orders = rawOrders.map(normalizeOrder);
        
        // Save to LocalStorage cache
        localStorage.setItem("ksc_cached_submissions", JSON.stringify(AppState.submissions));
        localStorage.setItem("ksc_cached_orders", JSON.stringify(AppState.orders));
        localStorage.setItem("ksc_cache_time", new Date().toLocaleString());
        
        hideErrorBanner();
        updateSyncStatusIndicator("Data synced perfectly", false);
        
    } catch (err) {
        console.error("Sheet synchronization failed. Fetching offline local cache...", err);
        loadLocalCachedData();
    }
    
    // Deduplicate and dynamic load submission categories
    AppState.categories.clear();
    AppState.submissions.forEach(sub => {
        if (sub.category && sub.category.trim() !== '') {
            AppState.categories.add(sub.category.trim());
        }
    });
    
    // Cross-link Submissions & Orders (Relational Modeling)
    crossLinkDataRelationships();
    
    // Render Portal
    onDataModelReady();
}

// Load cached data from LocalStorage or fall back to pre-populated mock dataset
function loadLocalCachedData() {
    const cachedSubs = localStorage.getItem("ksc_cached_submissions");
    const cachedOrders = localStorage.getItem("ksc_cached_orders");
    const cacheTime = localStorage.getItem("ksc_cache_time");
    const isLocalFile = window.location.protocol === 'file:';
    
    const localFileExplanation = "Browser CORS Security Restriction: Local files (opened via double-clicking index.html) are blocked by your browser from fetching live data from Google Sheets. To see your live sheet data, please run a local web server (e.g., VS Code Live Server, python server, or 'npm run dev') or deploy the site to GitHub Pages. Showing sandbox demo data in the meantime.";
    const networkErrorExplanation = "Google Sheets connection failed. Please ensure both sheets are shared as 'Anyone with the link can view' and that you have an active network connection. Showing sandbox demo data for now.";
    
    if (cachedSubs && cachedOrders) {
        AppState.submissions = JSON.parse(cachedSubs);
        AppState.orders = JSON.parse(cachedOrders);
        if (isLocalFile) {
            showErrorBanner(localFileExplanation + ` (Using local data cached on: ${cacheTime})`);
        } else {
            showErrorBanner(`Sync offline. Displaying local data cached on: ${cacheTime}`);
        }
        updateSyncStatusIndicator("Working with cached logs", false);
    } else {
        // Fallback to beautiful mock data to make sure app looks amazing immediately
        AppState.submissions = MOCK_DATA.submissions;
        AppState.orders = MOCK_DATA.orders;
        if (isLocalFile) {
            showErrorBanner(localFileExplanation);
        } else {
            showErrorBanner(networkErrorExplanation);
        }
        updateSyncStatusIndicator("Offline Sandbox Mode", false);
    }
}

// Create bi-directional parent-child linkages between Submissions and Office Orders
function crossLinkDataRelationships() {
    // Clear dynamic relationships
    AppState.submissions.forEach(sub => sub.linkedOrdersList = []);
    AppState.orders.forEach(order => order.parentSubmission = null);
    
    // Build maps
    const subMap = new Map();
    AppState.submissions.forEach(s => {
        if (s.id) subMap.set(s.id.toLowerCase().trim(), s);
    });
    
    const orderMap = new Map();
    AppState.orders.forEach(o => {
        if (o.orderNo) orderMap.set(o.orderNo.toLowerCase().trim(), o);
    });
    
    // Link by Submission ID
    AppState.orders.forEach(order => {
        if (order.submissionId) {
            const normalizedSubId = order.submissionId.toLowerCase().trim();
            const parentSub = subMap.get(normalizedSubId);
            if (parentSub) {
                order.parentSubmission = parentSub;
                parentSub.linkedOrdersList.push(order);
            }
        }
    });
    
    // Link by Office Order number listed inside Submission
    AppState.submissions.forEach(sub => {
        if (sub.officeOrderNo) {
            const normalizedOrderNo = sub.officeOrderNo.toLowerCase().trim();
            const matchingOrder = orderMap.get(normalizedOrderNo);
            if (matchingOrder) {
                // Prevent duplicate entries
                if (!sub.linkedOrdersList.some(o => o.orderNo === matchingOrder.orderNo)) {
                    sub.linkedOrdersList.push(matchingOrder);
                }
                matchingOrder.parentSubmission = sub;
            }
        }
    });
}

// --- CONTROLLER AND VIEWS PRESENTATION ENGINE ---

function onDataModelReady() {
    // Populate dynamic Category options in Submission filter dropdown
    populateCategoryDropdownOptions();
    
    // Sync Dashboard numbers and visualizations
    renderDashboardWidgets();
    renderDashboardCharts();
    renderRecentFeeds();
    
    // Execute default grid filter and rendering
    filterSubmissionsDataset();
    filterOrdersDataset();
    
    // Update tracker quick suggestions
    renderTrackerSuggestions();
}

function updateSyncStatusIndicator(text, isPulse) {
    const textNode = document.querySelector("#syncStatus");
    if (!textNode) return;
    
    const pulseEl = textNode.querySelector(".pulse-indicator");
    if (pulseEl) {
        if (isPulse) {
            pulseEl.style.display = "inline-block";
        } else {
            pulseEl.style.display = "none";
        }
    }
    
    // Replace only text sibling node
    const lastNode = textNode.lastChild;
    if (lastNode && lastNode.nodeType === Node.TEXT_NODE) {
        lastNode.textContent = " " + text;
    } else {
        textNode.appendChild(document.createTextNode(" " + text));
    }
}

function showErrorBanner(msg) {
    const banner = document.getElementById("errorBanner");
    const text = document.getElementById("errorMessageText");
    if (banner && text) {
        text.textContent = msg;
        banner.classList.remove("hidden");
    }
}

function hideErrorBanner() {
    const banner = document.getElementById("errorBanner");
    if (banner) {
        banner.classList.add("hidden");
    }
}

// --- 1. DASHBOARD COMPONENT ---

function renderDashboardWidgets() {
    const totalSubsVal = document.getElementById("stat-total-submissions");
    const pendingSubsVal = document.getElementById("stat-pending-submissions");
    const completedSubsVal = document.getElementById("stat-completed-submissions");
    const totalOrdersVal = document.getElementById("stat-total-orders");
    
    const pendingPercentage = document.getElementById("stat-pending-percentage");
    const completedPercentage = document.getElementById("stat-completed-percentage");
    
    const totalCount = AppState.submissions.length;
    const totalOrdersCount = AppState.orders.length;
    
    let pendingCount = 0;
    let completedCount = 0;
    
    AppState.submissions.forEach(sub => {
        const s = sub.status.toLowerCase().trim();
        if (s.includes("pending") || s.includes("follow-up")) pendingCount++;
        if (s.includes("completed") || s.includes("approved")) completedCount++;
    });
    
    if (totalSubsVal) totalSubsVal.textContent = totalCount;
    if (pendingSubsVal) pendingSubsVal.textContent = pendingCount;
    if (completedSubsVal) completedSubsVal.textContent = completedCount;
    if (totalOrdersVal) totalOrdersVal.textContent = totalOrdersCount;
    
    const pendPct = totalCount > 0 ? Math.round((pendingCount / totalCount) * 100) : 0;
    const compPct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
    
    if (pendingPercentage) pendingPercentage.textContent = `${pendPct}% requires review`;
    if (completedPercentage) completedPercentage.textContent = `${compPct}% resolved & output`;
}

// Interactive Pure CSS-SVG Dashboard Graphs
function renderDashboardCharts() {
    const categoryContainer = document.getElementById("categoryChartContainer");
    const statusContainer = document.getElementById("statusChartContainer");
    
    if (!categoryContainer || !statusContainer) return;
    
    safeClearElement(categoryContainer);
    safeClearElement(statusContainer);
    
    // Calculate category distribution counts
    const catMap = {};
    AppState.submissions.forEach(sub => {
        const cat = sub.category || "General";
        catMap[cat] = (catMap[cat] || 0) + 1;
    });
    
    // Sort categories by descending submissions count
    const sortedCategories = Object.entries(catMap).sort((a, b) => b[1] - a[1]);
    const maxCatVal = sortedCategories.length > 0 ? sortedCategories[0][1] : 1;
    
    const barLayout = createDOMNode("div", ["chart-bar-layout"]);
    sortedCategories.forEach(([cat, val]) => {
        const barRow = createDOMNode("div", ["chart-bar-row"]);
        
        const barInfo = createDOMNode("div", ["chart-bar-info"]);
        barInfo.appendChild(createDOMNode("span", ["chart-bar-label"], cat));
        barInfo.appendChild(createDOMNode("span", ["chart-bar-value"], String(val)));
        
        const barTrack = createDOMNode("div", ["chart-bar-track"]);
        const pctWidth = Math.round((val / maxCatVal) * 100);
        const barFill = createDOMNode("div", ["chart-bar-fill"], '', { style: `width: 0%` });
        
        barTrack.appendChild(barFill);
        barRow.appendChild(barInfo);
        barRow.appendChild(barTrack);
        barLayout.appendChild(barRow);
        
        // Animate fill scale in a brief timeout
        setTimeout(() => {
            barFill.style.width = `${pctWidth}%`;
        }, 150);
    });
    
    if (sortedCategories.length === 0) {
        categoryContainer.appendChild(createDOMNode("div", ["css-chart-loader"], "No category records parsed"));
    } else {
        categoryContainer.appendChild(barLayout);
    }
    
    // Calculate status distribution ratios
    let statusCounts = { Pending: 0, "In Progress": 0, Approved: 0, Completed: 0, "Follow-up": 0 };
    AppState.submissions.forEach(sub => {
        const s = sub.status.toLowerCase().trim();
        if (s.includes("pending")) statusCounts["Pending"]++;
        else if (s.includes("in progress")) statusCounts["In Progress"]++;
        else if (s.includes("approved")) statusCounts["Approved"]++;
        else if (s.includes("completed")) statusCounts["Completed"]++;
        else if (s.includes("follow-up") || s.includes("required")) statusCounts["Follow-up"]++;
    });
    
    const totalCount = AppState.submissions.length || 1;
    
    // Create a beautiful circular donut layout using raw SVG for absolute security & crisp styling
    const statusLayout = createDOMNode("div", ["status-chart-layout"]);
    
    // Build safe SVG donut chart
    const svgEl = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svgEl.setAttribute("viewBox", "0 0 36 36");
    svgEl.setAttribute("class", "donut-chart-svg");
    svgEl.setAttribute("width", "130");
    svgEl.setAttribute("height", "130");
    
    const backgroundCircle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    backgroundCircle.setAttribute("cx", "18");
    backgroundCircle.setAttribute("cy", "18");
    backgroundCircle.setAttribute("r", "15.915");
    backgroundCircle.setAttribute("fill", "none");
    backgroundCircle.setAttribute("stroke", "var(--bg-tertiary)");
    backgroundCircle.setAttribute("stroke-width", "4");
    svgEl.appendChild(backgroundCircle);
    
    // Calculate segments offsets
    let accumPercent = 0;
    const colors = {
        "Pending": "#f59e0b",
        "In Progress": "#8b5cf6",
        "Approved": "#3b82f6",
        "Completed": "var(--accent-color)",
        "Follow-up": "#ef4444"
    };
    
    Object.entries(statusCounts).forEach(([status, val]) => {
        if (val === 0) return;
        
        const pct = (val / totalCount) * 100;
        const segment = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        segment.setAttribute("cx", "18");
        segment.setAttribute("cy", "18");
        segment.setAttribute("r", "15.915");
        segment.setAttribute("fill", "none");
        segment.setAttribute("stroke", colors[status]);
        segment.setAttribute("stroke-width", "4");
        
        // Circular math: circumference is 100
        segment.setAttribute("stroke-dasharray", `${pct} ${100 - pct}`);
        segment.setAttribute("stroke-dashoffset", `${100 - accumPercent}`);
        segment.setAttribute("class", "donut-segment");
        
        svgEl.appendChild(segment);
        accumPercent += pct;
    });
    
    statusLayout.appendChild(svgEl);
    
    // Build legend
    const legendEl = createDOMNode("div", ["chart-legend"]);
    Object.entries(statusCounts).forEach(([status, val]) => {
        if (val === 0) return;
        const item = createDOMNode("div", ["legend-item"]);
        const dot = createDOMNode("span", ["legend-dot"], '', { style: `background-color: ${colors[status]}` });
        const label = createDOMNode("span", [], `${status}: ${val} (${Math.round((val / totalCount) * 100)}%)`);
        
        item.appendChild(dot);
        item.appendChild(label);
        legendEl.appendChild(item);
    });
    
    statusLayout.appendChild(legendEl);
    statusContainer.appendChild(statusLayout);
}

function renderRecentFeeds() {
    const recentSubsList = document.getElementById("recentSubmissionsList");
    const recentOrdersList = document.getElementById("recentOrdersList");
    
    if (!recentSubsList || !recentOrdersList) return;
    
    safeClearElement(recentSubsList);
    safeClearElement(recentOrdersList);
    
    // Sort submissions and orders chronologically (newest first based on timestamp / index)
    const recentSubs = [...AppState.submissions].slice(0, 5);
    const recentOrders = [...AppState.orders].slice(0, 5);
    
    // Render Submissions Feed
    recentSubs.forEach(sub => {
        const item = createDOMNode("li", ["feed-item"]);
        
        // Dynamic icons mapping based on status
        const iconDiv = createDOMNode("div", ["feed-item-icon"]);
        const s = sub.status.toLowerCase().trim();
        if (s.includes("pending")) {
            iconDiv.style.backgroundColor = "rgba(245, 158, 11, 0.12)";
            iconDiv.style.color = "#f59e0b";
            iconDiv.innerHTML = `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>`;
        } else if (s.includes("completed") || s.includes("approved")) {
            iconDiv.style.backgroundColor = "rgba(16, 185, 129, 0.12)";
            iconDiv.style.color = "var(--accent-color)";
            iconDiv.innerHTML = `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
        } else {
            iconDiv.style.backgroundColor = "rgba(139, 92, 246, 0.12)";
            iconDiv.style.color = "#8b5cf6";
            iconDiv.innerHTML = `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>`;
        }
        
        const detailsDiv = createDOMNode("div", ["feed-item-details"]);
        const metaDiv = createDOMNode("div", ["feed-item-meta"]);
        metaDiv.appendChild(createDOMNode("span", ["feed-item-id"], sub.id));
        metaDiv.appendChild(createDOMNode("span", ["feed-item-time"], sub.date));
        
        detailsDiv.appendChild(metaDiv);
        detailsDiv.appendChild(createDOMNode("p", ["feed-item-subject"], sub.subject));
        
        const badgeSpan = createDOMNode("span", ["feed-item-badge"]);
        badgeSpan.textContent = sub.status;
        
        // Status matching badge styling class
        if (s.includes("pending")) badgeSpan.classList.add("status-pending");
        else if (s.includes("completed")) badgeSpan.classList.add("status-completed");
        else if (s.includes("approved")) badgeSpan.classList.add("status-approved");
        else if (s.includes("follow-up")) badgeSpan.classList.add("status-followup");
        else badgeSpan.classList.add("status-inprogress");
        
        detailsDiv.appendChild(badgeSpan);
        
        item.appendChild(iconDiv);
        item.appendChild(detailsDiv);
        
        // Bind detail modal viewer on click
        item.addEventListener("click", () => showSubmissionDetailsModal(sub));
        recentSubsList.appendChild(item);
    });
    
    if (recentSubs.length === 0) {
        recentSubsList.appendChild(createDOMNode("li", ["feed-placeholder"], "No submissions records available"));
    }
    
    // Render Orders Feed
    recentOrders.forEach(ord => {
        const item = createDOMNode("li", ["feed-item"]);
        
        const iconDiv = createDOMNode("div", ["feed-item-icon"], '', { style: "background-color: rgba(139, 92, 246, 0.12); color: #8b5cf6;" });
        iconDiv.innerHTML = `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line></svg>`;
        
        const detailsDiv = createDOMNode("div", ["feed-item-details"]);
        const metaDiv = createDOMNode("div", ["feed-item-meta"]);
        metaDiv.appendChild(createDOMNode("span", ["feed-item-id"], ord.orderNo));
        metaDiv.appendChild(createDOMNode("span", ["feed-item-time"], ord.date));
        
        detailsDiv.appendChild(metaDiv);
        detailsDiv.appendChild(createDOMNode("p", ["feed-item-subject"], ord.subject));
        
        if (ord.submissionId) {
            detailsDiv.appendChild(createDOMNode("span", ["feed-item-badge", "status-approved"], `Linked to: ${ord.submissionId}`));
        } else {
            detailsDiv.appendChild(createDOMNode("span", ["feed-item-badge", "status-pending"], "Unlinked Order"));
        }
        
        item.appendChild(iconDiv);
        item.appendChild(detailsDiv);
        
        item.addEventListener("click", () => showOrderDetailsModal(ord));
        recentOrdersList.appendChild(item);
    });
    
    if (recentOrders.length === 0) {
        recentOrdersList.appendChild(createDOMNode("li", ["feed-placeholder"], "No office orders issued yet"));
    }
}

// --- 2. SUBMISSIONS REGISTRY COMPONENT ---

function populateCategoryDropdownOptions() {
    const filter = document.getElementById("subCategoryFilter");
    if (!filter) return;
    
    // Retain only first 'All Categories' option
    const firstOption = filter.firstElementChild;
    safeClearElement(filter);
    if (firstOption) filter.appendChild(firstOption);
    
    Array.from(AppState.categories).sort().forEach(cat => {
        const option = createDOMNode("option", [], cat, { value: cat });
        filter.appendChild(option);
    });
}

function filterSubmissionsDataset() {
    const searchQuery = document.getElementById("subSearchInput").value.toLowerCase().trim();
    const statusVal = document.getElementById("subStatusFilter").value;
    const categoryVal = document.getElementById("subCategoryFilter").value;
    
    AppState.filteredSubmissions = AppState.submissions.filter(sub => {
        // Status filter
        if (statusVal !== "ALL") {
            const subStatus = sub.status.toLowerCase().trim();
            if (statusVal === "Pending" && !subStatus.includes("pending")) return false;
            if (statusVal === "Approved" && !subStatus.includes("approved")) return false;
            if (statusVal === "Completed" && !subStatus.includes("completed")) return false;
            if (statusVal === "In Progress" && !subStatus.includes("in progress")) return false;
            if (statusVal === "Follow-up Required" && !(subStatus.includes("follow-up") || subStatus.includes("required"))) return false;
        }
        
        // Category filter
        if (categoryVal !== "ALL" && sub.category !== categoryVal) {
            return false;
        }
        
        // Search text matching
        if (searchQuery !== "") {
            const matchSubject = sub.subject.toLowerCase().includes(searchQuery);
            const matchId = sub.id.toLowerCase().includes(searchQuery);
            const matchSubmitter = sub.submitter.toLowerCase().includes(searchQuery);
            const matchOrderNo = sub.officeOrderNo && sub.officeOrderNo.toLowerCase().includes(searchQuery);
            const matchRemarks = sub.remarks && sub.remarks.toLowerCase().includes(searchQuery);
            
            return (matchSubject || matchId || matchSubmitter || matchOrderNo || matchRemarks);
        }
        
        return true;
    });
    
    // Reset page to 1 on filter trigger
    AppState.submissionsPage = 1;
    renderSubmissionsGrid();
}

function renderSubmissionsGrid() {
    const tableBody = document.getElementById("submissionsTableBody");
    const countText = document.getElementById("submissionsCountText");
    const prevBtn = document.getElementById("subPrevBtn");
    const nextBtn = document.getElementById("subNextBtn");
    const pageInfo = document.getElementById("subPaginationInfo");
    
    if (!tableBody) return;
    
    safeClearElement(tableBody);
    
    const records = AppState.filteredSubmissions;
    const totalCount = records.length;
    
    if (countText) {
        countText.textContent = `Showing ${totalCount} submission records`;
    }
    
    if (totalCount === 0) {
        const row = createDOMNode("tr");
        const cell = createDOMNode("td", ["table-loading-row"], "No matching submission records found.", { colspan: "8" });
        row.appendChild(cell);
        tableBody.appendChild(row);
        
        if (prevBtn) prevBtn.disabled = true;
        if (nextBtn) nextBtn.disabled = true;
        if (pageInfo) pageInfo.textContent = "Page 1 of 1";
        return;
    }
    
    // Pagination slicing
    const totalPages = Math.ceil(totalCount / AppState.itemsPerPage);
    if (AppState.submissionsPage > totalPages) AppState.submissionsPage = totalPages;
    if (AppState.submissionsPage < 1) AppState.submissionsPage = 1;
    
    const startIdx = (AppState.submissionsPage - 1) * AppState.itemsPerPage;
    const endIdx = Math.min(startIdx + AppState.itemsPerPage, totalCount);
    
    const pagedRecords = records.slice(startIdx, endIdx);
    
    pagedRecords.forEach(sub => {
        const tr = createDOMNode("tr");
        
        tr.appendChild(createDOMNode("td", ["table-id-cell"], sub.id));
        tr.appendChild(createDOMNode("td", [], sub.date));
        
        const subCell = createDOMNode("td", ["table-subject-cell"]);
        subCell.appendChild(createDOMNode("span", [], sub.subject, { title: sub.subject }));
        tr.appendChild(subCell);
        
        tr.appendChild(createDOMNode("td", [], sub.submitter));
        tr.appendChild(createDOMNode("td", [], sub.category));
        
        tr.appendChild(createDOMNode("td", [], sub.refNumber || "-"));
        
        // Status Badge Pill
        const statusTd = createDOMNode("td");
        const statusSpan = createDOMNode("span", ["status-pill"]);
        statusSpan.textContent = sub.status;
        const s = sub.status.toLowerCase().trim();
        if (s.includes("pending")) statusSpan.classList.add("status-pending");
        else if (s.includes("completed")) statusSpan.classList.add("status-completed");
        else if (s.includes("approved")) statusSpan.classList.add("status-approved");
        else if (s.includes("follow-up")) statusSpan.classList.add("status-followup");
        else statusSpan.classList.add("status-inprogress");
        statusTd.appendChild(statusSpan);
        tr.appendChild(statusTd);
        
        // Actions
        const actionTd = createDOMNode("td");
        const viewBtn = createDOMNode("button", ["doc-link-btn"]);
        viewBtn.innerHTML = `<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg> View`;
        viewBtn.addEventListener("click", () => showSubmissionDetailsModal(sub));
        actionTd.appendChild(viewBtn);
        tr.appendChild(actionTd);
        
        tableBody.appendChild(tr);
    });
    
    // Update pagination controls
    if (pageInfo) pageInfo.textContent = `Page ${AppState.submissionsPage} of ${totalPages}`;
    if (prevBtn) prevBtn.disabled = AppState.submissionsPage === 1;
    if (nextBtn) nextBtn.disabled = AppState.submissionsPage === totalPages;
}

// --- 3. OFFICE ORDERS REGISTRY COMPONENT ---

function filterOrdersDataset() {
    const searchQuery = document.getElementById("orderSearchInput").value.toLowerCase().trim();
    const sortVal = document.getElementById("orderDateSort").value;
    
    AppState.filteredOrders = AppState.orders.filter(ord => {
        if (searchQuery !== "") {
            const matchOrderNo = ord.orderNo.toLowerCase().includes(searchQuery);
            const matchSubject = ord.subject.toLowerCase().includes(searchQuery);
            const matchSubId = ord.submissionId && ord.submissionId.toLowerCase().includes(searchQuery);
            const matchDesc = ord.description && ord.description.toLowerCase().includes(searchQuery);
            
            return (matchOrderNo || matchSubject || matchSubId || matchDesc);
        }
        return true;
    });
    
    // Sort chronology
    AppState.filteredOrders.sort((a, b) => {
        const dateA = new Date(a.date);
        const dateB = new Date(b.date);
        
        // Fail-safe handling for invalid dates
        if (isNaN(dateA)) return 1;
        if (isNaN(dateB)) return -1;
        
        if (sortVal === "NEWEST") {
            return dateB - dateA;
        } else {
            return dateA - dateB;
        }
    });
    
    AppState.ordersPage = 1;
    renderOrdersGrid();
}

function renderOrdersGrid() {
    const tableBody = document.getElementById("ordersTableBody");
    const countText = document.getElementById("ordersCountText");
    const prevBtn = document.getElementById("orderPrevBtn");
    const nextBtn = document.getElementById("orderNextBtn");
    const pageInfo = document.getElementById("orderPaginationInfo");
    
    if (!tableBody) return;
    
    safeClearElement(tableBody);
    
    const records = AppState.filteredOrders;
    const totalCount = records.length;
    
    if (countText) {
        countText.textContent = `Showing ${totalCount} office order logs`;
    }
    
    if (totalCount === 0) {
        const row = createDOMNode("tr");
        const cell = createDOMNode("td", ["table-loading-row"], "No matching office order records found.", { colspan: "7" });
        row.appendChild(cell);
        tableBody.appendChild(row);
        
        if (prevBtn) prevBtn.disabled = true;
        if (nextBtn) nextBtn.disabled = true;
        if (pageInfo) pageInfo.textContent = "Page 1 of 1";
        return;
    }
    
    const totalPages = Math.ceil(totalCount / AppState.itemsPerPage);
    if (AppState.ordersPage > totalPages) AppState.ordersPage = totalPages;
    if (AppState.ordersPage < 1) AppState.ordersPage = 1;
    
    const startIdx = (AppState.ordersPage - 1) * AppState.itemsPerPage;
    const endIdx = Math.min(startIdx + AppState.itemsPerPage, totalCount);
    
    const pagedRecords = records.slice(startIdx, endIdx);
    
    pagedRecords.forEach(ord => {
        const tr = createDOMNode("tr");
        
        tr.appendChild(createDOMNode("td", ["table-id-cell"], ord.orderNo));
        tr.appendChild(createDOMNode("td", [], ord.date));
        
        const subCell = createDOMNode("td", ["table-subject-cell"]);
        subCell.appendChild(createDOMNode("span", [], ord.subject, { title: ord.subject }));
        tr.appendChild(subCell);
        
        const descCell = createDOMNode("td", [], ord.description || "-");
        descCell.style.maxWidth = "200px";
        descCell.style.overflow = "hidden";
        descCell.style.textOverflow = "ellipsis";
        descCell.style.whiteSpace = "nowrap";
        tr.appendChild(descCell);
        
        // Link to parent submission
        const subLinkTd = createDOMNode("td");
        if (ord.submissionId) {
            const linkBtn = createDOMNode("button", ["doc-link-btn"]);
            linkBtn.textContent = ord.submissionId;
            linkBtn.addEventListener("click", () => {
                if (ord.parentSubmission) {
                    showSubmissionDetailsModal(ord.parentSubmission);
                } else {
                    // Try to search manually in AppState
                    const match = AppState.submissions.find(s => s.id.toLowerCase().trim() === ord.submissionId.toLowerCase().trim());
                    if (match) showSubmissionDetailsModal(match);
                    else alert(`Submission details for ID ${ord.submissionId} not found.`);
                }
            });
            subLinkTd.appendChild(linkBtn);
        } else {
            subLinkTd.textContent = "-";
        }
        tr.appendChild(subLinkTd);
        
        // File Attachment link (Local file or web URL)
        const fileTd = createDOMNode("td");
        if (ord.file && ord.file.trim() !== "") {
            const fileLink = createDOMNode("a", ["doc-link-btn"], '', { href: ord.file, target: "_blank" });
            fileLink.innerHTML = `<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path></svg> Doc`;
            fileTd.appendChild(fileLink);
        } else {
            fileTd.textContent = "-";
        }
        tr.appendChild(fileTd);
        
        // Action View Detail
        const actionTd = createDOMNode("td");
        const viewBtn = createDOMNode("button", ["doc-link-btn"]);
        viewBtn.innerHTML = `<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg> View`;
        viewBtn.addEventListener("click", () => showOrderDetailsModal(ord));
        actionTd.appendChild(viewBtn);
        tr.appendChild(actionTd);
        
        tableBody.appendChild(tr);
    });
    
    if (pageInfo) pageInfo.textContent = `Page ${AppState.ordersPage} of ${totalPages}`;
    if (prevBtn) prevBtn.disabled = AppState.ordersPage === 1;
    if (nextBtn) nextBtn.disabled = AppState.ordersPage === totalPages;
}

// --- 4. UNIFIED TRACKER Timeline Engine ---

function renderTrackerSuggestions() {
    const container = document.getElementById("suggestionPillsContainer");
    if (!container) return;
    
    safeClearElement(container);
    
    // Take 2 submissions and 1 order as quick search examples
    const pills = [];
    if (AppState.submissions.length > 0) pills.push(AppState.submissions[0].id);
    if (AppState.submissions.length > 1) pills.push(AppState.submissions[1].id);
    if (AppState.orders.length > 0) pills.push(AppState.orders[0].orderNo);
    
    pills.forEach(p => {
        const pill = createDOMNode("span", ["suggestion-pill"], p);
        pill.addEventListener("click", () => {
            document.getElementById("trackerQueryInput").value = p;
            executeDocumentTrackingQuery();
        });
        container.appendChild(pill);
    });
}

function executeDocumentTrackingQuery() {
    const query = document.getElementById("trackerQueryInput").value.trim().toLowerCase();
    const resultsContainer = document.getElementById("trackerResults");
    
    if (!resultsContainer) return;
    
    if (query === "") {
        alert("Please enter a Document ID or Order Number to track.");
        return;
    }
    
    // Attempt to locate a match in submissions or orders
    const matchedSub = AppState.submissions.find(s => s.id.toLowerCase().trim() === query);
    const matchedOrder = AppState.orders.find(o => o.orderNo.toLowerCase().trim() === query);
    
    if (!matchedSub && !matchedOrder) {
        alert(`Document ID or Order Number '${escapeHTML(query)}' could not be found in active registers.`);
        resultsContainer.classList.add("hidden");
        return;
    }
    
    resultsContainer.classList.remove("hidden");
    
    const resultTypeNode = document.getElementById("trackResultType");
    const mainIdNode = document.getElementById("trackResultMainId");
    const statusNode = document.getElementById("trackResultStatus");
    const metaNode = document.getElementById("trackResultMetadata");
    const timelineNode = document.getElementById("trackTimeline");
    
    safeClearElement(metaNode);
    safeClearElement(timelineNode);
    
    if (matchedSub) {
        // Track by Submission ID
        if (resultTypeNode) resultTypeNode.textContent = "SUBMISSION LOG";
        if (mainIdNode) mainIdNode.textContent = matchedSub.id;
        
        // Status indicator pill
        if (statusNode) {
            statusNode.textContent = matchedSub.status;
            statusNode.className = "status-pill";
            const s = matchedSub.status.toLowerCase().trim();
            if (s.includes("pending")) statusNode.classList.add("status-pending");
            else if (s.includes("completed")) statusNode.classList.add("status-completed");
            else if (s.includes("approved")) statusNode.classList.add("status-approved");
            else if (s.includes("follow-up")) statusNode.classList.add("status-followup");
            else statusNode.classList.add("status-inprogress");
        }
        
        // Left Parameters panel
        const addMetaRow = (label, val) => {
            if (!val) return;
            const row = createDOMNode("div", ["meta-detail-row"]);
            row.appendChild(createDOMNode("span", ["meta-detail-label"], label));
            row.appendChild(createDOMNode("span", ["meta-detail-value"], val));
            metaNode.appendChild(row);
        };
        
        addMetaRow("Category Block", matchedSub.category);
        addMetaRow("Submitted By", matchedSub.submitter);
        addMetaRow("Submission Date", matchedSub.date);
        addMetaRow("Operational Subject", matchedSub.subject);
        addMetaRow("Reference Document", matchedSub.document);
        addMetaRow("Department Reference No", matchedSub.refNumber || "None Provided");
        addMetaRow("System Remarks", matchedSub.remarks || "No supplementary logs added.");
        
        // Build operational tracking timeline steps
        const steps = [];
        
        // Step 1: Registered
        steps.push({
            title: "Submission Registered",
            date: matchedSub.date,
            body: `Document submitted by ${matchedSub.submitter} under Category: '${matchedSub.category}'. Reference: ${matchedSub.refNumber || 'N/A'}.`,
            status: "completed"
        });
        
        // Step 2: Under Review state
        const isFollowup = matchedSub.status.toLowerCase().includes("follow-up");
        steps.push({
            title: isFollowup ? "Additional Clarifications Requested" : "Department Review & Verification",
            date: matchedSub.timestamp ? matchedSub.timestamp.split(" ")[0] : matchedSub.date,
            body: matchedSub.remarks || "System officers are analyzing the requirements, checking asset lists and compliance schemas.",
            status: isFollowup ? "active" : "completed"
        });
        
        // Step 3: Linked Office Orders
        if (matchedSub.linkedOrdersList && matchedSub.linkedOrdersList.length > 0) {
            matchedSub.linkedOrdersList.forEach(ord => {
                steps.push({
                    title: `Office Order Issued: ${ord.orderNo}`,
                    date: ord.date,
                    body: `Administrative sanction issued. Subject: '${ord.subject}'. Details: ${ord.description || 'N/A'}.`,
                    status: "completed",
                    order: ord
                });
            });
        } else {
            const isCompleted = matchedSub.status.toLowerCase().includes("completed") || matchedSub.status.toLowerCase().includes("approved");
            steps.push({
                title: "Administrative Sanction Order",
                date: "Pending Processing",
                body: isCompleted ? "Approved without requiring external formal orders." : "Sanction order not drafted or linked yet.",
                status: isCompleted ? "completed" : "pending"
            });
        }
        
        // Step 4: Final Closure status
        const isDone = matchedSub.status.toLowerCase().includes("completed") || matchedSub.status.toLowerCase().includes("approved");
        steps.push({
            title: isDone ? "Task Completed Successfully" : "Awaiting Operational Closure",
            date: isDone ? "Approved" : "Awaiting Actions",
            body: isDone ? "Document processed, actions allocated, and records updated." : "Pending review updates or complementary approvals.",
            status: isDone ? "completed" : "pending"
        });
        
        renderTimelineSteps(timelineNode, steps);
        
    } else if (matchedOrder) {
        // Track by Office Order No
        if (resultTypeNode) resultTypeNode.textContent = "OFFICE ORDER LOG";
        if (mainIdNode) mainIdNode.textContent = matchedOrder.orderNo;
        
        if (statusNode) {
            statusNode.textContent = matchedOrder.submissionId ? "Linked to Request" : "Direct Order";
            statusNode.className = "status-pill status-approved";
        }
        
        const addMetaRow = (label, val) => {
            if (!val) return;
            const row = createDOMNode("div", ["meta-detail-row"]);
            row.appendChild(createDOMNode("span", ["meta-detail-label"], label));
            row.appendChild(createDOMNode("span", ["meta-detail-value"], val));
            metaNode.appendChild(row);
        };
        
        addMetaRow("Office Order Number", matchedOrder.orderNo);
        addMetaRow("Issued Date", matchedOrder.date);
        addMetaRow("Subject Matter", matchedOrder.subject);
        addMetaRow("Sanction Parameters", matchedOrder.description || "No supplemental details provided.");
        addMetaRow("Associated Submission ID", matchedOrder.submissionId || "Direct issuance (no associated parent request ID).");
        addMetaRow("Signed File Asset", matchedOrder.file);
        
        // Timeline steps for Office Order
        const steps = [];
        
        if (matchedOrder.parentSubmission) {
            steps.push({
                title: `Origin Request Registered (${matchedOrder.parentSubmission.id})`,
                date: matchedOrder.parentSubmission.date,
                body: `Submission received from ${matchedOrder.parentSubmission.submitter}. Subject: '${matchedOrder.parentSubmission.subject}'.`,
                status: "completed"
            });
        }
        
        steps.push({
            title: "Administrative Order Drafted & Signed",
            date: matchedOrder.date,
            body: `Order KSSTM officially released. File: ${matchedOrder.file || 'Signed hardcopy'}. Description: ${matchedOrder.description || 'N/A'}.`,
            status: "completed"
        });
        
        if (matchedOrder.parentSubmission) {
            const subDone = matchedOrder.parentSubmission.status.toLowerCase().includes("completed");
            steps.push({
                title: subDone ? "Operational Closeout" : "Request Processing Updates",
                date: matchedOrder.date,
                body: `Action status in Submission Register updated to: '${matchedOrder.parentSubmission.status}'.`,
                status: subDone ? "completed" : "active"
            });
        }
        
        renderTimelineSteps(timelineNode, steps);
    }
    
    // Smooth scroll down to timeline results
    setTimeout(() => {
        resultsContainer.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
}

function renderTimelineSteps(container, steps) {
    steps.forEach((step, idx) => {
        const stepDiv = createDOMNode("div", ["timeline-step", step.status]);
        
        const marker = createDOMNode("div", ["timeline-marker"]);
        // Render step index or checkmark icon
        if (step.status === "completed") {
            marker.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
        } else {
            marker.appendChild(document.createTextNode(String(idx + 1)));
        }
        
        const content = createDOMNode("div", ["timeline-content"]);
        
        const header = createDOMNode("div", ["timeline-content-header"]);
        header.appendChild(createDOMNode("h4", ["timeline-title"], step.title));
        header.appendChild(createDOMNode("span", ["timeline-date"], step.date));
        
        content.appendChild(header);
        content.appendChild(createDOMNode("p", ["timeline-body"], step.body));
        
        // If order object is attached, add a quick link in timeline
        if (step.order) {
            const actions = createDOMNode("div", ["timeline-actions"]);
            const btn = createDOMNode("button", ["doc-link-btn"]);
            btn.innerHTML = `<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg> View Order`;
            btn.addEventListener("click", () => showOrderDetailsModal(step.order));
            actions.appendChild(btn);
            content.appendChild(actions);
        }
        
        stepDiv.appendChild(marker);
        stepDiv.appendChild(content);
        container.appendChild(stepDiv);
    });
}

// --- 5. INTERACTIVE DETAIL POPUP MODALS ---

function showSubmissionDetailsModal(sub) {
    const modal = document.getElementById("detailsModal");
    const categoryBadge = document.getElementById("modalCategory");
    const title = document.getElementById("modalTitle");
    const subTitle = document.getElementById("modalSubTitle");
    const detailsGrid = document.getElementById("modalDetailsGrid");
    
    const linkSection = document.getElementById("modalLinkSection");
    const linkedOrdersList = document.getElementById("modalLinkedOrders");
    
    const copyBtn = document.getElementById("modalCopyIdBtn");
    const viewBtn = document.getElementById("modalViewDocBtn");
    
    if (!modal) return;
    
    if (categoryBadge) {
        categoryBadge.textContent = sub.category;
        categoryBadge.className = "modal-category-badge";
        // Customize category color dynamically
        if (sub.category.toLowerCase().includes("hr") || sub.category.toLowerCase().includes("establishment")) {
            categoryBadge.style.backgroundColor = "rgba(59, 130, 246, 0.12)";
            categoryBadge.style.color = "#3b82f6";
        } else if (sub.category.toLowerCase().includes("technical") || sub.category.toLowerCase().includes("it")) {
            categoryBadge.style.backgroundColor = "rgba(139, 92, 246, 0.12)";
            categoryBadge.style.color = "#8b5cf6";
        } else {
            categoryBadge.style.backgroundColor = "rgba(16, 185, 129, 0.12)";
            categoryBadge.style.color = "var(--accent-color)";
        }
    }
    
    if (title) title.textContent = sub.subject;
    if (subTitle) subTitle.textContent = `Submission Log ID: ${sub.id}`;
    
    // Clear and build grids securely
    safeClearElement(detailsGrid);
    
    const addDetailField = (label, value, isFullWidth = false) => {
        if (!value) return;
        const row = createDOMNode("div", ["meta-detail-row"]);
        if (isFullWidth) row.classList.add("full-width");
        row.appendChild(createDOMNode("span", ["meta-detail-label"], label));
        row.appendChild(createDOMNode("span", ["meta-detail-value"], value));
        detailsGrid.appendChild(row);
    };
    
    addDetailField("Submission Date", sub.date);
    addDetailField("Current Status", sub.status);
    addDetailField("Submitted By (Officer)", sub.submitter);
    addDetailField("Reference Tracking Number", sub.refNumber || "Not Linked");
    addDetailField("System Registration Timestamp", sub.timestamp, true);
    addDetailField("Linked Office Order Number", sub.officeOrderNo || "None Listed");
    addDetailField("Administrative Decisions / Remarks", sub.remarks || "No operational remarks inputted.", true);
    addDetailField("Original Upload Filename", sub.document, true);
    
    // Check linked orders relationship array
    safeClearElement(linkedOrdersList);
    if (sub.linkedOrdersList && sub.linkedOrdersList.length > 0) {
        linkSection.classList.remove("hidden");
        sub.linkedOrdersList.forEach(ord => {
            const card = createDOMNode("div", ["linked-order-card"]);
            
            const info = createDOMNode("div", ["linked-order-info"]);
            info.appendChild(createDOMNode("h5", [], ord.orderNo));
            info.appendChild(createDOMNode("p", [], ord.subject));
            
            const viewLink = createDOMNode("button", ["doc-link-btn"]);
            viewLink.innerHTML = `<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg> View`;
            viewLink.addEventListener("click", () => {
                modal.classList.add("hidden");
                showOrderDetailsModal(ord);
            });
            
            card.appendChild(info);
            card.appendChild(viewLink);
            linkedOrdersList.appendChild(card);
        });
    } else {
        linkSection.classList.add("hidden");
    }
    
    // Setup copy ID callback
    copyBtn.replaceWith(copyBtn.cloneNode(true));
    const newCopyBtn = document.getElementById("modalCopyIdBtn");
    newCopyBtn.addEventListener("click", () => {
        navigator.clipboard.writeText(sub.id)
            .then(() => alert(`ID '${sub.id}' copied to clipboard!`))
            .catch(err => console.error("Could not copy:", err));
    });
    
    // Setup original file link
    if (sub.document && sub.document.trim() !== "") {
        viewBtn.classList.remove("hidden");
        viewBtn.setAttribute("href", sub.document);
    } else {
        viewBtn.classList.add("hidden");
    }
    
    modal.classList.remove("hidden");
}

function showOrderDetailsModal(ord) {
    const modal = document.getElementById("detailsModal");
    const categoryBadge = document.getElementById("modalCategory");
    const title = document.getElementById("modalTitle");
    const subTitle = document.getElementById("modalSubTitle");
    const detailsGrid = document.getElementById("modalDetailsGrid");
    const linkSection = document.getElementById("modalLinkSection");
    const copyBtn = document.getElementById("modalCopyIdBtn");
    const viewBtn = document.getElementById("modalViewDocBtn");
    
    if (!modal) return;
    
    if (categoryBadge) {
        categoryBadge.textContent = "OFFICE ORDER";
        categoryBadge.style.backgroundColor = "rgba(139, 92, 246, 0.12)";
        categoryBadge.style.color = "#8b5cf6";
    }
    
    if (title) title.textContent = ord.subject;
    if (subTitle) subTitle.textContent = `Office Order No: ${ord.orderNo}`;
    
    safeClearElement(detailsGrid);
    
    const addDetailField = (label, value, isFullWidth = false) => {
        if (!value) return;
        const row = createDOMNode("div", ["meta-detail-row"]);
        if (isFullWidth) row.classList.add("full-width");
        row.appendChild(createDOMNode("span", ["meta-detail-label"], label));
        row.appendChild(createDOMNode("span", ["meta-detail-value"], value));
        detailsGrid.appendChild(row);
    };
    
    addDetailField("Issued Date", ord.date);
    addDetailField("Associated Request ID", ord.submissionId || "None (Direct)");
    addDetailField("Registration Timestamp", ord.timestamp, true);
    addDetailField("Administrative Mandate Description", ord.description || "No supplemental descriptions drafted.", true);
    addDetailField("Attached Document Name", ord.file, true);
    
    // Relationship mapping linkage
    safeClearElement(document.getElementById("modalLinkedOrders"));
    if (ord.submissionId) {
        linkSection.classList.remove("hidden");
        const listContainer = document.getElementById("modalLinkedOrders");
        
        const card = createDOMNode("div", ["linked-order-card"]);
        const info = createDOMNode("div", ["linked-order-info"]);
        info.appendChild(createDOMNode("h5", [], ord.submissionId));
        info.appendChild(createDOMNode("p", [], ord.parentSubmission ? ord.parentSubmission.subject : "Linked Request Logs"));
        
        const viewLink = createDOMNode("button", ["doc-link-btn"]);
        viewLink.innerHTML = `<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg> View`;
        viewLink.addEventListener("click", () => {
            modal.classList.add("hidden");
            if (ord.parentSubmission) {
                showSubmissionDetailsModal(ord.parentSubmission);
            } else {
                const match = AppState.submissions.find(s => s.id.toLowerCase().trim() === ord.submissionId.toLowerCase().trim());
                if (match) showSubmissionDetailsModal(match);
                else alert(`Associated submission logs not found`);
            }
        });
        
        card.appendChild(info);
        card.appendChild(viewLink);
        listContainer.appendChild(card);
    } else {
        linkSection.classList.add("hidden");
    }
    
    copyBtn.replaceWith(copyBtn.cloneNode(true));
    const newCopyBtn = document.getElementById("modalCopyIdBtn");
    newCopyBtn.addEventListener("click", () => {
        navigator.clipboard.writeText(ord.orderNo)
            .then(() => alert(`Office Order Number '${ord.orderNo}' copied to clipboard!`))
            .catch(err => console.error("Could not copy:", err));
    });
    
    if (ord.file && ord.file.trim() !== "") {
        viewBtn.classList.remove("hidden");
        viewBtn.setAttribute("href", ord.file);
    } else {
        viewBtn.classList.add("hidden");
    }
    
    modal.classList.remove("hidden");
}

// --- TAB SWITCHER LOGIC ---

function switchApplicationTab(tabId) {
    AppState.activeTab = tabId;
    
    // Deactivate all navbar elements & views
    document.querySelectorAll(".nav-item").forEach(item => {
        if (item.getAttribute("data-tab") === tabId) {
            item.classList.add("active");
        } else {
            item.classList.remove("active");
        }
    });
    
    document.querySelectorAll(".tab-view").forEach(view => {
        if (view.getAttribute("id") === `${tabId}-view`) {
            view.classList.add("active");
        } else {
            view.classList.remove("active");
        }
    });
    
    // Set matching header title
    const headerTitle = document.getElementById("navbarTitleText");
    if (headerTitle) {
        if (tabId === "dashboard") headerTitle.textContent = "Kerala Science City Dashboard";
        else if (tabId === "submissions") headerTitle.textContent = "Submission Registry";
        else if (tabId === "orders") headerTitle.textContent = "Office Orders Ledger";
        else if (tabId === "tracker") headerTitle.textContent = "Unified Document Tracker";
    }
    
    // Automatically close mobile sidebar
    const sidebar = document.getElementById("sidebar");
    if (sidebar) sidebar.classList.remove("open");
}

// --- CORE PROGRAM INITIALIZATION ---

document.addEventListener("DOMContentLoaded", () => {
    
    // Setup Theme Mode (LocalStorage lookup)
    const savedTheme = localStorage.getItem("ksc_visual_theme") || "dark";
    document.documentElement.setAttribute("data-theme", savedTheme);
    const themeBtn = document.getElementById("themeToggleBtn");
    
    // Sidebar responsive controllers
    const sidebar = document.getElementById("sidebar");
    const openSidebarBtn = document.getElementById("openSidebarBtn");
    const closeSidebarBtn = document.getElementById("closeSidebarBtn");
    
    if (openSidebarBtn && sidebar) {
        openSidebarBtn.addEventListener("click", () => sidebar.classList.add("open"));
    }
    if (closeSidebarBtn && sidebar) {
        closeSidebarBtn.addEventListener("click", () => sidebar.classList.remove("open"));
    }
    
    // Theme toggle callback
    if (themeBtn) {
        themeBtn.addEventListener("click", () => {
            const currentTheme = document.documentElement.getAttribute("data-theme");
            const newTheme = currentTheme === "dark" ? "light" : "dark";
            document.documentElement.setAttribute("data-theme", newTheme);
            localStorage.setItem("ksc_visual_theme", newTheme);
        });
    }
    
    // Bind navigation tab clicks
    document.querySelectorAll(".nav-item").forEach(btn => {
        const tab = btn.getAttribute("data-tab");
        if (tab) {
            btn.addEventListener("click", () => switchApplicationTab(tab));
        }
    });
    
    // Bind link clicks inside cards (e.g. recent lists view-all redirection)
    document.querySelectorAll(".view-all-link").forEach(link => {
        const targetView = link.getAttribute("data-go-to");
        if (targetView) {
            link.addEventListener("click", () => switchApplicationTab(targetView));
        }
    });
    
    // Modal Overlay close bindings
    const modal = document.getElementById("detailsModal");
    const modalCloseBtn = document.getElementById("modalCloseBtn");
    if (modalCloseBtn && modal) {
        modalCloseBtn.addEventListener("click", () => modal.classList.add("hidden"));
    }
    if (modal) {
        modal.addEventListener("click", (e) => {
            if (e.target === modal) modal.classList.add("hidden");
        });
    }
    
    // Error banner close
    const errorBanner = document.getElementById("errorBanner");
    const closeErrorBtn = document.getElementById("closeErrorBtn");
    if (closeErrorBtn && errorBanner) {
        closeErrorBtn.addEventListener("click", () => errorBanner.classList.add("hidden"));
    }
    
    // --- BIND TABLE FILTERS & SEARCH INPUTS ---
    
    // Submissions Registry Grid
    const subSearch = document.getElementById("subSearchInput");
    const subClear = document.getElementById("subSearchClear");
    const subStatus = document.getElementById("subStatusFilter");
    const subCategory = document.getElementById("subCategoryFilter");
    
    if (subSearch) {
        subSearch.addEventListener("input", () => {
            if (subSearch.value.trim() !== '') {
                subClear.classList.remove("hidden");
            } else {
                subClear.classList.add("hidden");
            }
            filterSubmissionsDataset();
        });
    }
    if (subClear && subSearch) {
        subClear.addEventListener("click", () => {
            subSearch.value = "";
            subClear.classList.add("hidden");
            filterSubmissionsDataset();
        });
    }
    if (subStatus) subStatus.addEventListener("change", filterSubmissionsDataset);
    if (subCategory) subCategory.addEventListener("change", filterSubmissionsDataset);
    
    // Submissions Pagination buttons
    const subPrev = document.getElementById("subPrevBtn");
    const subNext = document.getElementById("subNextBtn");
    if (subPrev) {
        subPrev.addEventListener("click", () => {
            if (AppState.submissionsPage > 1) {
                AppState.submissionsPage--;
                renderSubmissionsGrid();
            }
        });
    }
    if (subNext) {
        subNext.addEventListener("click", () => {
            const totalPages = Math.ceil(AppState.filteredSubmissions.length / AppState.itemsPerPage);
            if (AppState.submissionsPage < totalPages) {
                AppState.submissionsPage++;
                renderSubmissionsGrid();
            }
        });
    }
    
    // Office Orders Registry Grid
    const orderSearch = document.getElementById("orderSearchInput");
    const orderClear = document.getElementById("orderSearchClear");
    const orderSort = document.getElementById("orderDateSort");
    
    if (orderSearch) {
        orderSearch.addEventListener("input", () => {
            if (orderSearch.value.trim() !== '') {
                orderClear.classList.remove("hidden");
            } else {
                orderClear.classList.add("hidden");
            }
            filterOrdersDataset();
        });
    }
    if (orderClear && orderSearch) {
        orderClear.addEventListener("click", () => {
            orderSearch.value = "";
            orderClear.classList.add("hidden");
            filterOrdersDataset();
        });
    }
    if (orderSort) orderSort.addEventListener("change", filterOrdersDataset);
    
    // Orders Pagination buttons
    const orderPrev = document.getElementById("orderPrevBtn");
    const orderNext = document.getElementById("orderNextBtn");
    if (orderPrev) {
        orderPrev.addEventListener("click", () => {
            if (AppState.ordersPage > 1) {
                AppState.ordersPage--;
                renderOrdersGrid();
            }
        });
    }
    if (orderNext) {
        orderNext.addEventListener("click", () => {
            const totalPages = Math.ceil(AppState.filteredOrders.length / AppState.itemsPerPage);
            if (AppState.ordersPage < totalPages) {
                AppState.ordersPage++;
                renderOrdersGrid();
            }
        });
    }
    
    // --- BIND TIMELINE tracker SEARCH PANEL ---
    const trackerInput = document.getElementById("trackerQueryInput");
    const trackerSubmit = document.getElementById("trackerSubmitBtn");
    if (trackerInput) {
        trackerInput.addEventListener("keydown", (e) => {
            if (e.key === "Enter") {
                executeDocumentTrackingQuery();
            }
        });
    }
    if (trackerSubmit) {
        trackerSubmit.addEventListener("click", executeDocumentTrackingQuery);
    }
    
    // Initialize data fetch
    syncRegistryData();
});
