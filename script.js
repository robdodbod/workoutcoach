const STRENGTH_STORAGE_KEY = "workoutCoachData_v10";
const CARDIO_STORAGE_KEY = "trainingPlanCompletion_v3_nav";
const STORAGE_KEY_V15 = "workoutCoachData_v15"; // Placeholder

// --- Constants (Unchanged) ---
const PLATES_PER_SIDE_STRICT = { 3: 2, 2.5: 1, 1.25: 1 };
const PLATES_PER_SIDE_SINGLE_DB = { 3: 4, 2.5: 2, 1.25: 2 };
const PLATE_VALUES_DESC = Object.keys(PLATES_PER_SIDE_SINGLE_DB)
    .map(Number)
    .sort((a, b) => b - a);
const MAX_WEIGHT_PER_SIDE_STRICT = Object.keys(PLATES_PER_SIDE_STRICT).reduce(
    (sum, val) => sum + parseFloat(val) * PLATES_PER_SIDE_STRICT[val],
    0
);
const MAX_WEIGHT_PER_SIDE_SINGLE_DB = Object.keys(
    PLATES_PER_SIDE_SINGLE_DB
).reduce(
    (sum, val) => sum + parseFloat(val) * PLATES_PER_SIDE_SINGLE_DB[val],
    0
);
const HEX_DUMBBELL_WEIGHT_EACH = 4.5;
const HEX_DUMBBELL_WEIGHT_TOTAL = HEX_DUMBBELL_WEIGHT_EACH * 2;
const MIN_PLATE_INCREMENT_PER_SIDE = 1.25;
const MIN_PLATE_INCREMENT_TOTAL = MIN_PLATE_INCREMENT_PER_SIDE * 2;
const STRENGTH_WORKOUT_SCHEDULE = {
    2: "Pull", // Tuesday (May 6)
    4: "Push", // Thursday
    6: "Push"  // Saturday
};
const STRENGTH_EXERCISES = {
    Push: [
        "Low Incline Dumbbell Press",
        "Flat Dumbbell Flys",
        "Seated Dumbbell OHP",
        "Lateral Raises",
        "Dumbbell Extensions",
        "Decline Crunch"
    ],
    Pull: [
        "Dumbbell Rows",
        "Pullovers",
        "Rear Delt Flys",
        "Dumbbell Shrugs",
        "Incline Dumbbell Curls",
        "Lying Leg Raises"
    ]
};
const REPS_ONLY_EXERCISES = ["Decline Crunch", "Lying Leg Raises"];
const TIME_BASED_EXERCISES = ["Planks"];
const SINGLE_DB_EXERCISES = ["Triceps Extension", "Pullover"];
const NUM_SETS = 3;
const TARGET_REPS_MIN = 8;
const TARGET_REPS_MAX = 12;
const FLOAT_TOLERANCE = 0.01;
const RPE_OPTIONS = [
    { value: 6, description: "6 (Could do 4 more reps)" },
    { value: 7, description: "7 (Definitely 3 more reps)" },
    { value: 7.5, description: "7.5 (Maybe 3 more reps)" },
    { value: 8, description: "8 (Definitely 2 more reps)" },
    { value: 8.5, description: "8.5 (Maybe 2 more reps)" },
    { value: 9, description: "9 (Definitely 1 more rep)" },
    { value: 9.5, description: "9.5 (Maybe 1 more rep)" },
    { value: 10, description: "10 (Couldn't do any more reps)" }
];
const CARDIO_START_DATE_STRING = "2025-04-21";
const CARDIO_INITIAL_DISTANCE = 1.75;
const CARDIO_INITIAL_SPM = 108;
const CARDIO_SESSIONS_PER_CYCLE = 6;
const CARDIO_SPM_INCREMENT = 2;
const CARDIO_DISTANCE_INCREMENT = 0.25;
const CARDIO_SPM_RESET_REDUCTION = 8;
const CARDIO_TRAINING_DAYS = [1, 3, 5];
const CARDIO_SESSIONS_TO_GENERATE = 100;
const CARDIO_WARMUP_BASE_SPM = 104;

// --- Global Variables (Unchanged) ---
let doubleDbWeights = [];
let singleDbWeights = [];
let cardioSessions = [];
let cardioCompletionStatus = {};
let cardioFirstIncompleteIndex = -1;
let cardioCurrentlyDisplayedIndex = -1;
let strengthData = {};
let currentViewDate = new Date();
let isViewingPreviousStrength = false;
let currentChartType = "double";

// --- DOM Elements ---
const currentDateEl = document.getElementById("current-date");
const workoutTypeEl = document.getElementById("workout-type");
const lastSessionInfoEl = document.getElementById("last-session-info");
const rightPanelContentEl = document.getElementById("right-panel-content");
const feedbackEl = document.getElementById("feedback");
const progressionChartTable = document.getElementById("progression-chart");
const chartTitleEl = document.getElementById("chart-title");
const rightPanelTitleEl = document.getElementById("right-panel-title");
const viewPrevButton = document.getElementById("view-prev-button");
const prevDateSelectorDiv = document.getElementById("prev-date-selector");
const prevDateInput = document.getElementById("prev-date-input");
const loadPrevButton = document.getElementById("load-prev-button");
const backToCurrentButton = document.getElementById("back-to-current-button");
const showDoubleDbBtn = document.getElementById("show-double-db-chart-btn");
const showSingleDbBtn = document.getElementById("show-single-db-chart-btn");
const leftPanelTitleEl = document.getElementById("left-panel-title"); // <-- Get left panel title

// --- Utility Functions (Unchanged) ---
function getFormattedDate(date) {
  /*...*/ const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}
function loadStrengthData() {
  /*...*/ const data = localStorage.getItem(STRENGTH_STORAGE_KEY);
    return data ? JSON.parse(data) : {};
}
function saveStrengthData(data) {
  /*...*/ localStorage.setItem(STRENGTH_STORAGE_KEY, JSON.stringify(data));
}
function loadCardioCompletionStatus() {
  /*...*/ const storedStatus = localStorage.getItem(CARDIO_STORAGE_KEY);
    return storedStatus ? JSON.parse(storedStatus) : {};
}
function saveCardioCompletionStatus() {
  /*...*/ localStorage.setItem(
    CARDIO_STORAGE_KEY,
    JSON.stringify(cardioCompletionStatus)
);
}
function getPermutations(arr) {
  /*...*/ const result = [];
    const n = arr.length;
    const c = new Array(n).fill(0);
    let k;
    let p;
    result.push([...arr]);
    let i = 1;
    while (i < n) {
        if (c[i] < i) {
            k = i % 2 && c[i];
            p = arr[i];
            arr[i] = arr[k];
            arr[k] = p;
            ++c[i];
            i = 1;
            result.push([...arr]);
        } else {
            c[i] = 0;
            ++i;
        }
    }
    return result;
}
function countPlateDiffs(plates1, plates2) {
  /*...*/ const counts1 = plates1.reduce((acc, p) => {
    acc[p] = (acc[p] || 0) + 1;
    return acc;
}, {});
    const counts2 = plates2.reduce((acc, p) => {
        acc[p] = (acc[p] || 0) + 1;
        return acc;
    }, {});
    let removed = 0;
    let added = 0;
    const allPlates = new Set([...plates1, ...plates2]);
    allPlates.forEach((p) => {
        const c1 = counts1[p] || 0;
        const c2 = counts2[p] || 0;
        if (c1 > c2) removed += c1 - c2;
        if (c2 > c1) added += c2 - c1;
    });
    return { removed, added };
}
function parseDate(dateString) {
  /*...*/ const [year, month, day] = dateString.split("-").map(Number);
    return new Date(Date.UTC(year, month - 1, day));
}
function formatDate(date) {
    // From tracker, needed by generateCardioSessions
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}

// --- Generate Weights Functions (Unchanged) ---
function generateDoubleDbWeights() {
    const possibleWeightsPerSide = new Map();
    const plateTypes = PLATE_VALUES_DESC;
    const maxCounts = PLATES_PER_SIDE_STRICT;

    function findCombinations(plateIndex, currentWeight, currentPlateCombo) {
        const weightKey = parseFloat(currentWeight.toFixed(3));
        if (weightKey >= MIN_PLATE_INCREMENT_PER_SIDE) {
            if (
                !possibleWeightsPerSide.has(weightKey) ||
                possibleWeightsPerSide.get(weightKey).plates.length > currentPlateCombo.length
            ) {
                possibleWeightsPerSide.set(weightKey, {
                    weight: weightKey,
                    plates: [...currentPlateCombo].sort((a, b) => b - a)
                });
            }
        }
        if (plateIndex >= plateTypes.length) return;

        const currentPlateValue = plateTypes[plateIndex];
        const maxCountForPlate = maxCounts[currentPlateValue];
        for (let count = 0; count <= maxCountForPlate; count++) {
            const nextWeight = currentWeight + count * currentPlateValue;
            if (nextWeight > MAX_WEIGHT_PER_SIDE_STRICT + FLOAT_TOLERANCE) break;
            for (let i = 0; i < count; i++) currentPlateCombo.push(currentPlateValue);
            findCombinations(plateIndex + 1, nextWeight, currentPlateCombo);
            for (let i = 0; i < count; i++) currentPlateCombo.pop();
        }
    }

    findCombinations(0, 0, []);
    const finalWeights = [];
    for (const [weightKey, data] of possibleWeightsPerSide.entries()) {
        finalWeights.push({
            total: data.weight * 4,
            perDb: data.weight * 2,
            platesPerSide: data.plates
        });
    }
    console.log("Generated Double DB Weights:", finalWeights);
    return finalWeights.sort((a, b) => a.total - b.total);
}
function generateSingleDbWeights() {
  /* ... same ... */ const possibleWeightsPerSide = new Map();
    const plateTypes = PLATE_VALUES_DESC;
    const maxCounts = PLATES_PER_SIDE_SINGLE_DB;
    function findCombinations(plateIndex, currentWeight, currentPlateCombo) {
        const weightKey = parseFloat(currentWeight.toFixed(3));
        if (weightKey > 0) {
            if (
                !possibleWeightsPerSide.has(weightKey) ||
                possibleWeightsPerSide.get(weightKey).plates.length >
                currentPlateCombo.length
            ) {
                possibleWeightsPerSide.set(weightKey, {
                    weight: weightKey,
                    plates: [...currentPlateCombo].sort((a, b) => b - a)
                });
            }
        } else if (weightKey === 0) {
            if (!possibleWeightsPerSide.has(weightKey)) {
                possibleWeightsPerSide.set(weightKey, {
                    weight: weightKey,
                    plates: []
                });
            }
        }
        if (plateIndex >= plateTypes.length) return;
        const currentPlateValue = plateTypes[plateIndex];
        const currentPlateKey = String(currentPlateValue);
        const maxCountForPlate = maxCounts[currentPlateKey];
        for (let count = 0; count <= maxCountForPlate; count++) {
            const nextWeight = currentWeight + count * currentPlateValue;
            if (nextWeight > MAX_WEIGHT_PER_SIDE_SINGLE_DB + FLOAT_TOLERANCE) break;
            for (let i = 0; i < count; i++) currentPlateCombo.push(currentPlateValue);
            findCombinations(plateIndex + 1, nextWeight, currentPlateCombo);
            for (let i = 0; i < count; i++) currentPlateCombo.pop();
        }
    }
    findCombinations(0, 0, []);
    const finalWeights = [];
    for (const [weightKey, data] of possibleWeightsPerSide.entries()) {
        if (data.weight > 0) {
            finalWeights.push({ perDb: data.weight * 2, platesPerSide: data.plates });
        }
    }
    console.log("Generated Single DB Weights:", finalWeights);
    return finalWeights.sort((a, b) => a.perDb - b.perDb);
}

// --- Strength Recommendation Logic (V16 - Uses Exercise-Specific Rep Ranges) ---
function getStrengthRecommendation(exerciseName, lastSetData) {
    const repRange = SPECIFIC_REP_RANGES[exerciseName] || DEFAULT_REP_RANGE;
    const targetMinReps = repRange.min;
    const targetMaxReps = repRange.max;

    if (!lastSetData) {
        return {
            weight: HEX_DUMBBELL_WEIGHT_TOTAL, // Default starting weight
            reps: targetMinReps,
            rpe: 8
        };
    }

    const { reps, rpe, weight } = lastSetData;

    if (reps >= targetMaxReps && rpe <= 8) {
        // Progress to higher weight
        return {
            weight: weight + MIN_PLATE_INCREMENT_TOTAL,
            reps: targetMinReps,
            rpe: 8
        };
    } else if (reps < targetMinReps && rpe >= 9.5) {
        // Regress to lower weight
        return {
            weight: Math.max(weight - MIN_PLATE_INCREMENT_TOTAL, HEX_DUMBBELL_WEIGHT_TOTAL),
            reps: targetMinReps,
            rpe: 8
        };
    } else {
        // Stay at the same weight and adjust reps
        return {
            weight: weight,
            reps: Math.min(reps + 1, targetMaxReps),
            rpe: 8
        };
    }
}

// --- Strength Sequencing Logic (Unchanged) ---
function calculateStrengthTransitionCost(rec1, rec2) {
  /* ... same ... */ const loadout1 = rec1.isHex ? [] : rec1.platesPerSide;
    const loadout2 = rec2.isHex ? [] : rec2.platesPerSide;
    const isSingle1 = SINGLE_DB_EXERCISES.includes(rec1.exerciseName);
    const isSingle2 = SINGLE_DB_EXERCISES.includes(rec2.exerciseName);
    const diff = countPlateDiffs(loadout1, loadout2);
    let cost = 0;
    if (!isSingle1 && !isSingle2) {
        cost = (diff.removed + diff.added) * 2;
    } else if (!isSingle1 && isSingle2) {
        cost = diff.removed + diff.added + loadout1.length + loadout1.length * 2;
    } else if (isSingle1 && !isSingle2) {
        cost = diff.removed + diff.added + loadout2.length + loadout2.length * 2;
    } else {
        cost = (diff.removed + diff.added) * 2;
    }
    return cost;
}
function getOptimalStrengthSequence(exerciseNames, recommendations) {
    const weightedExercises = exerciseNames
        .filter(
            (name) =>
                recommendations[name] &&
                typeof recommendations[name].weight === "number" &&
                recommendations[name].weight > 0
        )
        .map((name) => ({
            exerciseName: name,
            ...recommendations[name],
            platesPerSide: recommendations[name].platesPerSide || [] // Ensure platesPerSide is defined
        }));

    const nonWeightedExercises = exerciseNames.filter(
        (name) =>
            !recommendations[name] ||
            typeof recommendations[name].weight !== "number" ||
            recommendations[name].weight <= 0
    );

    if (weightedExercises.length <= 1) {
        return [
            ...weightedExercises.map((e) => e.exerciseName),
            ...nonWeightedExercises
        ];
    }

    let bestSequence = [...weightedExercises];
    let minTotalCost = Infinity;
    const permutations = getPermutations(weightedExercises);

    console.log(
        `Evaluating ${permutations.length} strength sequence permutations...`
    );

    permutations.forEach((sequence) => {
        let currentTotalCost = 0;

        const firstRec = sequence[0];
        currentTotalCost += firstRec.isHex
            ? 0
            : firstRec.platesPerSide.length *
              (SINGLE_DB_EXERCISES.includes(firstRec.exerciseName) ? 2 : 4);

        for (let i = 0; i < sequence.length - 1; i++) {
            currentTotalCost += calculateStrengthTransitionCost(
                sequence[i],
                sequence[i + 1]
            );
        }

        const lastRec = sequence[sequence.length - 1];
        currentTotalCost += lastRec.isHex
            ? 0
            : lastRec.platesPerSide.length *
              (SINGLE_DB_EXERCISES.includes(lastRec.exerciseName) ? 2 : 4);

        if (currentTotalCost < minTotalCost) {
            minTotalCost = currentTotalCost;
            bestSequence = [...sequence];
        }
    });

    console.log(
        `Optimal strength sequence found with cost ${minTotalCost}: ${bestSequence
            .map((e) => e.exerciseName)
            .join(", ")}`
    );

    return [...bestSequence.map((e) => e.exerciseName), ...nonWeightedExercises];
}

// --- Cardio Logic (Unchanged) ---
function calculateWarmupSPM(targetSPM, percentage) {
  /*...*/ if (targetSPM <= CARDIO_WARMUP_BASE_SPM)
        return CARDIO_WARMUP_BASE_SPM;
    return Math.ceil(
        CARDIO_WARMUP_BASE_SPM +
        (percentage / 100) * (targetSPM - CARDIO_WARMUP_BASE_SPM)
    );
}
function generateCardioSessions() {
  /*...*/ const sessions = [];
    let currentDate = parseDate(CARDIO_START_DATE_STRING);
    let currentDistance = CARDIO_INITIAL_DISTANCE;
    let currentCycleStartSPM = CARDIO_INITIAL_SPM;
    let sessionCounterInCycle = 0;
    let sessionsGenerated = 0;
    while (!CARDIO_TRAINING_DAYS.includes(currentDate.getUTCDay())) {
        currentDate.setUTCDate(currentDate.getUTCDate() + 1);
    }
    while (sessionsGenerated < CARDIO_SESSIONS_TO_GENERATE) {
        if (CARDIO_TRAINING_DAYS.includes(currentDate.getUTCDay())) {
            const targetSPM =
                currentCycleStartSPM + sessionCounterInCycle * CARDIO_SPM_INCREMENT;
            sessions.push({
                date: formatDate(currentDate),
                distance: parseFloat(currentDistance.toFixed(2)),
                spm: targetSPM,
                originalIndex: sessionsGenerated
            });
            sessionCounterInCycle++;
            sessionsGenerated++;
            if (sessionCounterInCycle >= CARDIO_SESSIONS_PER_CYCLE) {
                currentDistance += CARDIO_DISTANCE_INCREMENT;
                const lastSPMOfCycle =
                    currentCycleStartSPM +
                    (CARDIO_SESSIONS_PER_CYCLE - 1) * CARDIO_SPM_INCREMENT;
                currentCycleStartSPM = lastSPMOfCycle - CARDIO_SPM_RESET_REDUCTION;
                sessionCounterInCycle = 0;
            }
        }
        currentDate.setUTCDate(currentDate.getUTCDate() + 1);
    }
    return sessions;
}
function findFirstIncompleteCardioIndex() {
  /*...*/ for (let i = 0; i < cardioSessions.length; i++) {
        if (!cardioCompletionStatus[cardioSessions[i].date]) {
            return i;
        }
    }
    return -1;
}

// --- Rendering Functions ---

// Visualization (Unchanged)
function renderPlateVisualizationHTML(weightPerDb, platesPerSide = null) {
  /* ... same ... */ if (weightPerDb === null || weightPerDb <= 0) return "";
    if (Math.abs(weightPerDb - HEX_DUMBBELL_WEIGHT_EACH) < FLOAT_TOLERANCE) {
        return `<div class="hex-dumbbell-text">10lb Hex DB</div>`;
    }
    if (weightPerDb < MIN_PLATE_INCREMENT_TOTAL) return "";
    let plates = platesPerSide;
    if (!plates) {
        console.error(
            `Plates per side array missing for visualization of ${weightPerDb}kg per DB`
        );
        return '<span style="font-size:0.8em; color:var(--color-danger);">Viz Error</span>';
    }
    if (!Array.isArray(plates)) {
        console.error(
            `platesPerSide is not an array for ${weightPerDb}kg:`,
            plates
        );
        return '<span style="font-size:0.8em; color:var(--color-danger);">Data Error</span>';
    }
    const plateHtml = (p) => {
        let plateClass = "";
        if (Math.abs(p - 3) < FLOAT_TOLERANCE) plateClass = "plate-3kg";
        else if (Math.abs(p - 2.5) < FLOAT_TOLERANCE) plateClass = "plate-2-5kg";
        else if (Math.abs(p - 1.25) < FLOAT_TOLERANCE) plateClass = "plate-1-25kg";
        return `<div class="plate ${plateClass}" title="${p}kg"></div>`;
    };
    const leftPlatesHtml = plates.map(plateHtml).join("");
    const rightPlatesHtml = [...plates].reverse().map(plateHtml).join("");
    return `<div class="plate-visualization" style="visibility: visible !important; display: flex !重要;" title="Dumbbell Loadout: ${weightPerDb.toFixed(
        2
    )}kg"> ${leftPlatesHtml} <div class="dumbbell-handle"></div> ${rightPlatesHtml} </div>`;
}

// Render Chart (Unchanged)
function renderProgressionChart(chartType) {
    console.log("Switching chart to:", chartType);
    const tableHead = progressionChartTable.querySelector("thead");
    const tableBody = progressionChartTable.querySelector("tbody");
    tableHead.innerHTML = "";
    tableBody.innerHTML = "";

    const data = chartType === "single" ? singleDbWeights : doubleDbWeights;
    const isSingle = chartType === "single";

    // Add table headers
    const headerRow = tableHead.insertRow();
    if (!isSingle) {
        headerRow.insertCell().textContent = "Total (kg)";
    }
    headerRow.insertCell().textContent = "Per DB (kg)";
    headerRow.insertCell().textContent = "Loadout (Per DB)";

    // Add table rows
    data.forEach((weightInfo) => {
        const row = tableBody.insertRow();
        if (!isSingle) {
            row.insertCell().textContent = weightInfo.total.toFixed(2);
        }
        row.insertCell().textContent = weightInfo.perDb.toFixed(2);
        const cellViz = row.insertCell();
        cellViz.classList.add("plate-visualization-cell");
        cellViz.innerHTML = renderPlateVisualizationHTML(
            weightInfo.perDb,
            weightInfo.platesPerSide
        );
    });

    console.log("Chart Data:", data);
}

// Render Last Session Panel V15 - Context Aware *** NEW ***
function renderLastSessionPanel() {
    let lastSessionDateStr = null;
    let lastSessionData = null;
    let title = "Last Session"; // Default title

    // Find the last strength session
    const lastStrengthDateStr = findLastSessionDate(
        currentViewDate,
        null, // Ignore type
        strengthData,
        true // Ignore type
    );

    // Find the last cardio session
    const sortedCardioDates = cardioSessions
        .map((s) => s.date)
        .sort()
        .reverse();
    let lastCardioDateStr = null;
    for (const dateStr of sortedCardioDates) {
        if (dateStr < getFormattedDate(currentViewDate) && cardioCompletionStatus[dateStr]) {
            lastCardioDateStr = dateStr;
            break;
        }
    }

    // Determine the most recent session (strength or cardio)
    if (
        lastStrengthDateStr &&
        (!lastCardioDateStr || lastStrengthDateStr > lastCardioDateStr)
    ) {
        lastSessionDateStr = lastStrengthDateStr;
        lastSessionData = strengthData[lastSessionDateStr];
        title = `Last Strength Session (${lastSessionData.type})`;
    } else if (lastCardioDateStr) {
        lastSessionDateStr = lastCardioDateStr;
        lastSessionData = cardioSessions.find((s) => s.date === lastCardioDateStr);
        title = "Last Cardio Session";
    } else {
        title = "No Prior Workout Data";
    }

    // Update the panel title
    leftPanelTitleEl.textContent = title;

    // Render the content
    if (!lastSessionData) {
        lastSessionInfoEl.innerHTML = "<p>No previous session data found.</p>";
        return;
    }

    if (lastSessionData.exercises) {
        // Render strength session data
        let html = `<p style="text-align: center; margin-bottom: 5px;"><strong>${lastSessionDateStr}</strong></p>`;
        const strengthType = lastSessionData.type;
        const originalOrder =
            STRENGTH_EXERCISES[strengthType] || Object.keys(lastSessionData.exercises);
        originalOrder.forEach((exerciseName) => {
            if (!lastSessionData.exercises[exerciseName]) return;
            html += `<div class="exercise"><h5>${exerciseName}</h5>`;
            html += lastSessionData.exercises[exerciseName]
                .map((set, index) => {
                    let setDetails = "";
                    const setData = set || {};
                    if (TIME_BASED_EXERCISES.includes(exerciseName)) {
                        setDetails = `T: ${setData.time ?? "N/A"}s @ ${setData.rpe ?? "N/A"}`;
                    } else if (REPS_ONLY_EXERCISES.includes(exerciseName)) {
                        setDetails = `R: ${setData.reps ?? "N/A"} @ ${setData.rpe ?? "N/A"}`;
                    } else {
                        setDetails = `W: ${setData.weight ?? "N/A"}kg x ${setData.reps ?? "N/A"}r @ ${setData.rpe ?? "N/A"}`;
                    }
                    return `<div class="set-info" style="font-size: 0.9em;">S${index + 1}: ${setDetails}</div>`;
                })
                .join("");
            html += `</div>`;
        });
        lastSessionInfoEl.innerHTML = html;
    } else if (lastSessionData.distance !== undefined) {
        // Render cardio session data
        const displayDate = parseDate(lastSessionData.date).toLocaleDateString("en-US", {
            weekday: "short",
            year: "numeric",
            month: "short",
            day: "numeric",
            timeZone: "UTC"
        });
        lastSessionInfoEl.innerHTML = `
            <p style="text-align:center; margin-bottom: 10px;"><strong>${displayDate.toUpperCase()}</strong></p>
            <p>Distance: <strong>${lastSessionData.distance.toFixed(2)} KM</strong></p>
            <p>Target SPM: <strong>${lastSessionData.spm}</strong></p>
            <p>(Marked Complete)</p>
        `;
    } else {
        lastSessionInfoEl.innerHTML = "<p>Could not display last session data.</p>";
    }
}

// Render Strength Panel V16 - Displays target rep range
function renderStrengthPanel(
    targetDate,
    exercisesToShow,
    sessionData,
    options = {}
) {
    const { isPast = false } = options;
    let strengthHTML = `<form id="current-session-form">`;

    exercisesToShow.forEach((exerciseName) => {
        // --- Get target rep range for display ---
        const repRange = SPECIFIC_REP_RANGES[exerciseName] || DEFAULT_REP_RANGE;
        const displayRepRange = `${repRange.min}-${repRange.max} Reps`;
        // ---

        strengthHTML += `<div class="exercise"><h3>${exerciseName} <span style="font-size: 0.8em; color: var(--color-secondary); font-weight: normal;">(${displayRepRange})</span></h3>`; // Display range in title

        const existingSetsForDate = sessionData?.exercises?.[exerciseName] ?? [];
        const shouldShowRecommendation =
            !isPast || (isPast && existingSetsForDate.length === 0);
        let currentRec = null;
        if (shouldShowRecommendation) {
            const workoutType = STRENGTH_WORKOUT_SCHEDULE[targetDate.getDay()];
            const lastRelevantSessionDateStr = findLastSessionDate(
                targetDate,
                workoutType,
                strengthData
            );
            const lastRelevantSessionData = lastRelevantSessionDateStr
                ? strengthData[lastRelevantSessionDateStr]
                : null;
            const lastSetFromRelevantSession =
                lastRelevantSessionData?.exercises?.[exerciseName]?.slice(-1)[0] ??
                null;
            currentRec = getStrengthRecommendation(
                exerciseName,
                lastSetFromRelevantSession
            );
        }

        const isRepsOnly = REPS_ONLY_EXERCISES.includes(exerciseName);
        const isTimeBased = TIME_BASED_EXERCISES.includes(exerciseName);
        const isWeighted = !isRepsOnly && !isTimeBased;
        const isSingleDB = SINGLE_DB_EXERCISES.includes(exerciseName);

        for (let i = 0; i < NUM_SETS; i++) {
            const setIndex = i;
            const existingSetData = existingSetsForDate[setIndex] ?? null;
            strengthHTML += `<div class="set-block"><strong>Set ${setIndex + 1
                }</strong>`;
            if (!isPast) {
        /* ... Add Last: info ... */ const lastSessionDateStrForInfo = findLastSessionDate(
                targetDate,
                STRENGTH_WORKOUT_SCHEDULE[targetDate.getDay()],
                strengthData
            );
                const lastSessionActualForInfo = lastSessionDateStrForInfo
                    ? strengthData[lastSessionDateStrForInfo]
                    : null;
                const lastSetActualForInfo =
                    lastSessionActualForInfo?.exercises?.[exerciseName]?.[setIndex] ??
                    null;
                let lastSetInfoHtml = "N/A";
                if (lastSetActualForInfo) {
                    if (isTimeBased)
                        lastSetInfoHtml = `${lastSetActualForInfo.time ?? "N/A"}s @ RPE ${lastSetActualForInfo.rpe ?? "N/A"
                            }`;
                    else if (isRepsOnly)
                        lastSetInfoHtml = `${lastSetActualForInfo.reps ?? "N/A"}r @ RPE ${lastSetActualForInfo.rpe ?? "N/A"
                            }`;
                    else
                        lastSetInfoHtml = `${lastSetActualForInfo.weight ?? "N/A"}kg x ${lastSetActualForInfo.reps ?? "N/A"
                            }r @ RPE ${lastSetActualForInfo.rpe ?? "N/A"}`;
                }
                strengthHTML += `<span class="last-set-info">Last: ${lastSetInfoHtml}</span>`;
            }
            if (shouldShowRecommendation) {
        /* ... Add Recommendation ... */ if (
                    isWeighted &&
                    currentRec?.weight !== null
                ) {
                    const displayWeight = currentRec.weight;
                    const displayWeightUnit = isSingleDB
                        ? "kg (Single DB)"
                        : "kg (Total)";
                    strengthHTML += `<span class="recommendation">Recommend: ${displayWeight.toFixed(
                        2
                    )} ${displayWeightUnit} x ${currentRec.reps} reps</span>`;
                    const weightPerDbForViz = isSingleDB
                        ? currentRec.weight
                        : currentRec.weight / 2;
                    strengthHTML += renderPlateVisualizationHTML(
                        weightPerDbForViz,
                        currentRec.platesPerSide
                    );
                } else if (isRepsOnly && currentRec?.reps !== null) {
                    strengthHTML += `<span class="recommendation">Aim for ${currentRec.reps} reps</span>`;
                } else if (isTimeBased && currentRec?.time !== null) {
                    strengthHTML += `<span class="recommendation">Aim for ${currentRec.time} sec</span>`;
                }
            }
            strengthHTML += `<div class="input-group">`; // Inputs
            if (isWeighted) {
                const prevWeight = existingSetData?.weight ?? "";
                strengthHTML += `<label for="weight-${exerciseName}-${setIndex}">Weight:</label><input type="number" value="${prevWeight}" id="weight-${exerciseName}-${setIndex}" name="weight-${exerciseName}-${setIndex}" step="${MIN_PLATE_INCREMENT_PER_SIDE}" min="0" required>`;
            }
            if (!isTimeBased) {
                const prevReps = existingSetData?.reps ?? "";
                strengthHTML += `<label for="reps-${exerciseName}-${setIndex}">${isRepsOnly ? "Reps:" : "Reps:"
                    }</label><input type="number" value="${prevReps}" id="reps-${exerciseName}-${setIndex}" name="reps-${exerciseName}-${setIndex}" min="0" required>`;
            } else {
                const prevTime = existingSetData?.time ?? "";
                strengthHTML += `<label for="time-${exerciseName}-${setIndex}">Time:</label><input type="number" value="${prevTime}" id="time-${exerciseName}-${setIndex}" name="time-${exerciseName}-${setIndex}" min="0" required>`;
            }
            const prevRpe = existingSetData?.rpe ?? "";
            strengthHTML += `<label for="rpe-${exerciseName}-${setIndex}">RPE:</label><select id="rpe-${exerciseName}-${setIndex}" name="rpe-${exerciseName}-${setIndex}" required>`;
            strengthHTML += `<option value="" ${prevRpe === "" ? "selected" : ""
                }>--</option>`;
            RPE_OPTIONS.forEach((rpeOption) => {
                const isSelected =
                    prevRpe !== "" &&
                    Math.abs(parseFloat(prevRpe) - rpeOption.value) < FLOAT_TOLERANCE;
                strengthHTML += `<option value="${rpeOption.value}" ${isSelected ? "selected" : ""
                    }>${rpeOption.value}</option>`;
            });
            strengthHTML += `</select>`;
            strengthHTML += `</div></div>`;
        }
        strengthHTML += `</div>`;
    });
    strengthHTML += `<button type="button" id="save-button">${isPast
        ? sessionData
            ? "Update Past Strength"
            : "Save Past Strength"
        : "Save Strength Session"
        }</button></form>`;
    rightPanelContentEl.innerHTML = strengthHTML;
    const saveBtn = document.getElementById("save-button");
    if (saveBtn) {
        saveBtn.addEventListener("click", handleStrengthSave);
    }
}

// Render Cardio Panel (Unchanged)
function renderCardioPanel(cardioSessionIndex) {
  /* ... same ... */ cardioCurrentlyDisplayedIndex = cardioSessionIndex;
    let cardioHTML = `<div id="jogging-tracker-ui">`;
    if (cardioSessionIndex >= 0 && cardioSessionIndex < cardioSessions.length) {
        const session = cardioSessions[cardioSessionIndex];
        const displayDate = parseDate(session.date).toLocaleDateString("en-US", {
            weekday: "short",
            year: "numeric",
            month: "short",
            day: "numeric",
            timeZone: "UTC"
        });
        let w1 = "---";
        let w2 = "---";
        let w3 = "---";
        const tolerance = 0.001;
        if (Math.abs(session.distance - 1.75) < tolerance)
            w1 = calculateWarmupSPM(session.spm, 66);
        else if (Math.abs(session.distance - 2.0) < tolerance) {
            w1 = calculateWarmupSPM(session.spm, 50);
            w2 = calculateWarmupSPM(session.spm, 75);
        } else if (session.distance >= 2.25 - tolerance) {
            w1 = calculateWarmupSPM(session.spm, 25);
            w2 = calculateWarmupSPM(session.spm, 50);
            w3 = calculateWarmupSPM(session.spm, 75);
        }
        cardioHTML += `<div id="jogging-session-info"><p id="jogging-session-date">DATE: ${displayDate.toUpperCase()}</p><p>DISTANCE: <strong>${session.distance.toFixed(
            2
        )} KM</strong></p><p><span class="warmup-label">WARMUP 1:</span> <span class="warmup-spm">${w1}</span></p><p><span class="warmup-label">WARMUP 2:</span> <span class="warmup-spm">${w2}</span></p><p><span class="warmup-label">WARMUP 3:</span> <span class="warmup-spm">${w3}</span></p><p>TARGET SPM: <strong>${session.spm
            }</strong></p></div><div id="jogging-controls"><button id="cardio-prev-button" ${cardioSessionIndex <= cardioFirstIncompleteIndex ? "disabled" : ""
            }>< PREV</button><button id="complete-button" style="${cardioSessionIndex === cardioFirstIncompleteIndex
                ? "display: inline-block;"
                : "display: none;"
            }">MARK COMPLETE</button><button id="cardio-next-button" ${cardioSessionIndex >= cardioSessions.length - 1 ? "disabled" : ""
            }>NEXT ></button></div>`;
    } else {
        cardioHTML += `<div id="no-session-message">CARDIO PLAN COMPLETE!</div>`;
    }
    cardioHTML += `</div>`;
    rightPanelContentEl.innerHTML = cardioHTML;
    const completeBtn = document.getElementById("complete-button");
    const prevBtn = document.getElementById("cardio-prev-button");
    const nextBtn = document.getElementById("cardio-next-button");
    if (completeBtn)
        completeBtn.addEventListener("click", handleCardioMarkComplete);
    if (prevBtn) prevBtn.addEventListener("click", handleCardioPrevious);
    if (nextBtn) nextBtn.addEventListener("click", handleCardioNext);
}

// --- Event Handlers (Unchanged) ---
function handleStrengthSave() {
  /* ... same ... */ feedbackEl.textContent = "";
    feedbackEl.className = "";
    const dateToSave = isViewingPreviousStrength
        ? new Date(prevDateInput.value + "T00:00:00")
        : new Date();
    const dateFormatted = getFormattedDate(dateToSave);
    const workoutInfo = STRENGTH_WORKOUT_SCHEDULE[dateToSave.getDay()];
    if (!workoutInfo) {
        feedbackEl.textContent = `Selected date (${dateFormatted}) is not a strength day. Cannot save.`;
        feedbackEl.className = "error";
        return;
    }
    if (!strengthData[dateFormatted]) {
        strengthData[dateFormatted] = {
            date: dateFormatted,
            type: workoutInfo,
            exercises: {}
        };
    } else {
        strengthData[dateFormatted].type = workoutInfo;
        strengthData[dateFormatted].exercises = {};
    }
    const sessionData = strengthData[dateFormatted];
    let formIsValid = true;
    const exercisesToSave = STRENGTH_EXERCISES[workoutInfo];
    exercisesToSave.forEach((exerciseName) => {
        sessionData.exercises[exerciseName] = [];
        const isRepsOnly = REPS_ONLY_EXERCISES.includes(exerciseName);
        const isTimeBased = TIME_BASED_EXERCISES.includes(exerciseName);
        for (let i = 0; i < NUM_SETS; i++) {
            const setIndex = i;
            const rpeInput = document.getElementById(
                `rpe-${exerciseName}-${setIndex}`
            );
            if (!rpeInput) {
                console.warn(`Input not found for ${exerciseName} Set ${i + 1} RPE`);
                continue;
            }
            const rpe = parseFloat(rpeInput.value);
            let setData = { weight: null, reps: null, time: null, rpe: null };
            const isValidRpe = RPE_OPTIONS.some((opt) => opt.value === rpe);
            if (isNaN(rpe) || !isValidRpe) {
                formIsValid = false;
                if (rpeInput) rpeInput.style.borderColor = "var(--color-danger)";
            } else {
                setData.rpe = rpe;
                if (rpeInput) rpeInput.style.borderColor = "";
            }
            if (isTimeBased) {
                const timeInput = document.getElementById(
                    `time-${exerciseName}-${setIndex}`
                );
                if (!timeInput) {
                    console.warn(`Input not found for ${exerciseName} Set ${i + 1} Time`);
                    continue;
                }
                const time = parseInt(timeInput.value, 10);
                if (isNaN(time) || time < 0) {
                    formIsValid = false;
                    if (timeInput) timeInput.style.borderColor = "var(--color-danger)";
                } else {
                    setData.time = time;
                    if (timeInput) timeInput.style.borderColor = "";
                }
            } else {
                const repsInput = document.getElementById(
                    `reps-${exerciseName}-${setIndex}`
                );
                if (!repsInput) {
                    console.warn(`Input not found for ${exerciseName} Set ${i + 1} Reps`);
                    continue;
                }
                const reps = parseInt(repsInput.value, 10);
                if (isNaN(reps) || reps < 0) {
                    formIsValid = false;
                    if (repsInput) repsInput.style.borderColor = "var(--color-danger)";
                } else {
                    setData.reps = reps;
                    if (repsInput) repsInput.style.borderColor = "";
                }
                if (!isRepsOnly) {
                    const weightInput = document.getElementById(
                        `weight-${exerciseName}-${setIndex}`
                    );
                    if (!weightInput) {
                        console.warn(
                            `Input not found for ${exerciseName} Set ${i + 1} Weight`
                        );
                        continue;
                    }
                    const weight = parseFloat(weightInput.value);
                    if (isNaN(weight) || weight < 0) {
                        formIsValid = false;
                        if (weightInput)
                            weightInput.style.borderColor = "var(--color-danger)";
                    } else {
                        setData.weight = weight;
                        if (weightInput) weightInput.style.borderColor = "";
                    }
                }
            }
            sessionData.exercises[exerciseName].push(setData);
        }
    });
    if (!formIsValid) {
        feedbackEl.textContent =
            "Please fill in all strength fields correctly (ensure RPE is selected).";
        feedbackEl.className = "error";
        return;
    }
    saveStrengthData(strengthData);
    feedbackEl.textContent = `Strength Session for ${dateFormatted} Saved Successfully!`;
    feedbackEl.className = "success";
    console.log(`Saved strength data for ${dateFormatted}:`, sessionData);
    if (isViewingPreviousStrength) {
        switchToCurrentDayView();
    } else {
        initializeAppUI(currentViewDate);
    /* Refresh current view to update last session panel */ setTimeout(() => {
            feedbackEl.textContent = "";
            feedbackEl.className = "";
        }, 3000);
    }
}
function handleViewPrevious() {
  /* ... same ... */ isViewingPreviousStrength = true;
    prevDateSelectorDiv.style.display = "block";
    viewPrevButton.style.display = "none";
    backToCurrentButton.style.display = "inline-block";
    rightPanelTitleEl.textContent = "View/Add Past Strength";
    rightPanelContentEl.innerHTML =
        '<p>Select a date and click "Load Strength Date".</p>';
    feedbackEl.textContent = "";
    feedbackEl.className = "";
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    prevDateInput.value = getFormattedDate(yesterday);
}
function handleLoadPrevious() {
/* ... same ... */     const selectedDateStr = prevDateInput.value;
    if (!selectedDateStr) {
        feedbackEl.textContent = "Please select a date.";
        feedbackEl.className = "error";
        return;
    }
    feedbackEl.textContent = "";
    feedbackEl.className = "";
    const selectedDate = new Date(selectedDateStr + "T00:00:00");
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (selectedDate > today) {
        feedbackEl.textContent = "Cannot view or add data for a future date.";
        feedbackEl.className = "error";
        return;
    }
    currentViewDate = selectedDate;

    // Check if it's a strength day
    const strengthWorkoutType = STRENGTH_WORKOUT_SCHEDULE[selectedDate.getDay()];
    if (strengthWorkoutType) {
        const sessionDataForDate = strengthData[selectedDateStr] ?? null;
        rightPanelTitleEl.textContent = `${strengthWorkoutType} Session (${selectedDateStr})`;
        renderStrengthPanel(
            selectedDate,
            STRENGTH_EXERCISES[strengthWorkoutType],
            sessionDataForDate,
            { isPast: true }
        );
        return;
    }

    // Check if it's a cardio day
    const cardioSessionIndex = cardioSessions.findIndex(
        (session) => session.date === selectedDateStr
    );
    if (cardioSessionIndex !== -1) {
        rightPanelTitleEl.textContent = `Cardio Session (${selectedDateStr})`;
        renderCardioPanel(cardioSessionIndex);
        return;
    }

    // If neither, show a message
    rightPanelTitleEl.textContent = `No Workout Scheduled (${selectedDateStr})`;
    rightPanelContentEl.innerHTML =
        "<p>This date does not have a scheduled strength or cardio session.</p>";
}
function switchToCurrentDayView() {
    isViewingPreviousStrength = false;
    currentViewDate = new Date(); // Reset view date to today
    prevDateSelectorDiv.style.display = "none"; // Hide selector
    viewPrevButton.style.display = "inline-block"; // Show view button
    backToCurrentButton.style.display = "none"; // Hide back button
    feedbackEl.textContent = "";
    feedbackEl.className = "";
    // Reload the main view for today by calling the UI update function
    initializeAppUI(currentViewDate);
}
function handleCardioMarkComplete() {
  /* ... same ... */ if (
        cardioCurrentlyDisplayedIndex === cardioFirstIncompleteIndex &&
        cardioCurrentlyDisplayedIndex !== -1
    ) {
        const sessionToComplete = cardioSessions[cardioCurrentlyDisplayedIndex];
        cardioCompletionStatus[sessionToComplete.date] = true;
        saveCardioCompletionStatus();
        cardioFirstIncompleteIndex = findFirstIncompleteCardioIndex();
        renderCardioPanel(cardioFirstIncompleteIndex);
    } else {
        console.error(
            "Attempted to complete a cardio session that isn't the next due one."
        );
    }
}
function handleCardioPrevious() {
  /* ... same ... */ if (
        cardioCurrentlyDisplayedIndex > cardioFirstIncompleteIndex
    ) {
        renderCardioPanel(cardioCurrentlyDisplayedIndex - 1);
    }
}
function handleCardioNext() {
  /* ... same ... */ if (
        cardioCurrentlyDisplayedIndex <
        cardioSessions.length - 1
    ) {
        renderCardioPanel(cardioCurrentlyDisplayedIndex + 1);
    }
}
function displayChart(chartType) {
    console.log("Switching chart to:", chartType);
    currentChartType = chartType;
    chartTitleEl.textContent =
        chartType === "single"
            ? "Progression Chart (Single DB)"
            : "Progression Chart (Double DB)";
    renderProgressionChart(chartType);

    if (chartType === "single") {
        showSingleDbBtn.classList.add("active-chart-btn");
        showDoubleDbBtn.classList.remove("active-chart-btn");
    } else {
        showDoubleDbBtn.classList.add("active-chart-btn");
        showSingleDbBtn.classList.remove("active-chart-btn");
    }
}

// --- Rep Range Configuration ---
const DEFAULT_REP_RANGE = { min: 8, max: 12 };
const SPECIFIC_REP_RANGES = {
    // Add exercises here with their specific ranges
    "Standing Calf Raise": { min: 12, max: 24 },
    Shrug: { min: 12, max: 24 }
};

// --- Core Logic ---
function findLastSessionDate(currentDate, workoutType = null, data, ignoreType = false) {
    const currentDateStr = getFormattedDate(currentDate);
    const sortedDates = Object.keys(data).sort().reverse(); // Sort dates in descending order

    for (const dateStr of sortedDates) {
        if (dateStr >= currentDateStr) continue; // Skip future or current dates
        const session = data[dateStr];
        if (ignoreType || session.type === workoutType) {
            return dateStr; // Return the first matching date
        }
    }

    return null; // No matching session found
}

function getWorkoutInfoForDate(date) {
    const dayOfWeek = date.getDay(); // 0=Sun, 1=Mon... 6=Sat
    if (STRENGTH_WORKOUT_SCHEDULE[dayOfWeek]) {
        const type = STRENGTH_WORKOUT_SCHEDULE[dayOfWeek];
        return {
            type: type,
            exercises: [...STRENGTH_EXERCISES[type]],
            category: "Strength"
        };
    } else if (CARDIO_TRAINING_DAYS.includes(dayOfWeek)) {
        return { type: "Cardio", exercises: [], category: "Cardio" }; // No specific exercises needed here
    } else {
        return { type: "Rest", exercises: [], category: "Rest" };
    }
}

// initializeAppUI() is defined after this...

// --- Initialization V17 ---
function initializeAppUI(dateToShow) {
    dateToShow.setHours(0, 0, 0, 0);
    currentViewDate = dateToShow;

    currentDateEl.textContent = `Date: ${dateToShow.toDateString()}`;
    const workoutInfo = getWorkoutInfoForDate(dateToShow);
    workoutTypeEl.textContent = `Type: ${workoutInfo.type}`;

    if (workoutInfo.category === "Strength") {
        rightPanelTitleEl.textContent = `${workoutInfo.type} Session`;
        const currentRecommendations = {};
        workoutInfo.exercises.forEach((exName) => {
            const lastSet =
                strengthData[
                    findLastSessionDate(dateToShow, workoutInfo.type, strengthData)
                ]?.exercises?.[exName]?.slice(-1)[0] ?? null;
            currentRecommendations[exName] = getStrengthRecommendation(
                exName,
                lastSet
            );
        });
        const optimalSequence = getOptimalStrengthSequence(
            workoutInfo.exercises,
            currentRecommendations
        );
        renderStrengthPanel(dateToShow, optimalSequence, null, { isPast: false });
    } else if (workoutInfo.category === "Cardio") {
        rightPanelTitleEl.textContent = `Cardio Session`;
        const dateStr = getFormattedDate(dateToShow);
        const sessionIndex = cardioSessions.findIndex((s) => s.date === dateStr);
        if (sessionIndex !== -1) {
            renderCardioPanel(sessionIndex);
        } else {
            rightPanelContentEl.innerHTML =
                "<p>Error: Cardio session not found for this date.</p>";
        }
    } else {
        rightPanelTitleEl.textContent = "Rest Day";
        rightPanelContentEl.innerHTML =
            '<p style="text-align: center; margin-top: 50px; font-size: 1.2em;">Enjoy your rest!</p>';
    }
}

function initializeApp() {
    // 1. Generate ALL data sets
    doubleDbWeights = generateDoubleDbWeights();
    singleDbWeights = generateSingleDbWeights();
    cardioSessions = generateCardioSessions();
    // 2. Load existing data
    strengthData = loadStrengthData();
    cardioCompletionStatus = loadCardioCompletionStatus();
    cardioFirstIncompleteIndex = findFirstIncompleteCardioIndex();
    // 3. Render the initial chart view (Double DB)
    displayChart("double");
    // 4. Setup initial UI for TODAY
    initializeAppUI(new Date());
    // 5. Add Global Event Listeners
    viewPrevButton.addEventListener("click", handleViewPrevious);
    loadPrevButton.addEventListener("click", handleLoadPrevious);
    backToCurrentButton.addEventListener("click", switchToCurrentDayView);
    showDoubleDbBtn.addEventListener("click", () => displayChart("double"));
    showSingleDbBtn.addEventListener("click", () => displayChart("single"));
    // Note: Dynamic buttons (Save, Cardio Nav/Complete) have listeners added when rendered
}

// --- Run App ---
initializeApp();
