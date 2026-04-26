window.dashboard = window.dashboard || {
    memory: 0,
    emotion: 0,
    pattern: 0,
    puzzle: 0,
    flashcards: 0
};

/// =========================
// GLOBAL TIMER TRACKER (FIXED)
// =========================

window.activeTimeouts = window.activeTimeouts || [];
window.activeIntervals = window.activeIntervals || [];

function addTimeout(fn, delay){
    const t = setTimeout(fn, delay);
    window.activeTimeouts.push(t);
    return t;
}

function addInterval(fn, delay){
    const i = setInterval(fn, delay);
    window.activeIntervals.push(i);
    return i;
}

function clearAllAsync(){
    window.activeTimeouts.forEach(t => clearTimeout(t));
    window.activeIntervals.forEach(i => clearInterval(i));

    window.activeTimeouts = [];
    window.activeIntervals = [];

    window.speechSynthesis.cancel();
}

// =========================
// USER SESSION MANAGEMENT
// =========================

// Load logged-in user

window.onload = () => {

const user = JSON.parse(localStorage.getItem("user"));

if(!user){

// Prevent direct dashboard access

window.location.href = "login.html";
return;

}


// Update sidebar profile
const nameBox = document.querySelector(".profile h3");
if (nameBox) nameBox.innerText = user.name;


// Update profile section

const profileName = document.getElementById("profileName");
const profileEmail = document.getElementById("profileEmail");
const profileGender = document.getElementById("profileGender");
const profileAge = document.getElementById("profileAge");
const profilePhone = document.getElementById("profilePhone");
const profileLocation = document.getElementById("profileLocation");

if(profileName) profileName.innerText = user.name;
if(profileEmail) profileEmail.innerText = user.email;
if(profileGender) profileGender.innerText = user.gender || "Not Provided";
if(profileAge) profileAge.innerText = user.age || "Not Provided";
if(profilePhone) profilePhone.innerText = user.phone || "Not Provided";
if(profileLocation) profileLocation.innerText = user.location || "Not Provided";
};



// =========================
// LOGOUT FUNCTION
// =========================
function logoutUser(){

localStorage.removeItem("user");
window.location.href = "login.html";

}async function predictImage() {

    const fileInput =
    document.getElementById("imageUpload");

    if (!fileInput.files.length) {

        alert("Upload image first");
        return;

    }

    const formData = new FormData();

    formData.append(
        "image",
        fileInput.files[0]
    );

    try {

        // CALL FLASK MODEL API

        const response =
        await fetch(
        "http://127.0.0.1:5001/predict",
        {
            method: "POST",
            body: formData
        });

        const data =
        await response.json();


        // SHOW RESULT TEXT

        document.getElementById("result")
        .innerText =
        `${data.prediction} (Confidence: ${data.confidence}%)`;


        // SHOW ORIGINAL IMAGE

        document.getElementById("originalImage").src =
        "data:image/jpeg;base64," +
        data.original_image;


        // SHOW GRADCAM IMAGE

        document.getElementById("gradcamImage").src =
        "data:image/jpeg;base64," +
        data.gradcam_image;


        document.getElementById("imageResults")
        .style.display = "block";


        // SAVE HISTORY TO DATABASE (INCLUDING IMAGES)

        await fetch(
        "http://localhost:5000/api/history/save",
        {
            method: "POST",

            headers:
            {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({

                prediction: data.prediction,

                confidence: data.confidence,

                originalImage: data.original_image,

                gradcamImage: data.gradcam_image

            })

        });

    }

    catch(error)
    {

        console.error(error);

    }

}
async function loadHistory() {

    try {

        const response =
        await fetch("http://localhost:5000/api/history");

        const history =
        await response.json();

        const tableBody =
        document.querySelector("#historyTable tbody");

        tableBody.innerHTML = "";

        history.forEach(record => {

            const row = `
            <tr>
                <td>${new Date(record.createdAt).toLocaleString()}</td>
                <td>${record.prediction}</td>
                <td>${record.confidence}%</td>

                <td>
                <img width="120"
                src="data:image/jpeg;base64,${record.originalImage}">
                </td>

                <td>
                <img width="120"
                src="data:image/jpeg;base64,${record.gradcamImage}">
                </td>
            </tr>
            `;

            tableBody.innerHTML += row;

        });

    }

    catch(error) {

        console.error("Error loading history:", error);

    }

}
// =========================
// SECTION SWITCHING
// =========================

function shuffle(arr) {
    return arr.sort(() => Math.random() - 0.5);
}

function showSection(sectionId) {
    document.querySelectorAll('.content-section')
        .forEach(sec => sec.style.display = 'none');

    document.getElementById(sectionId).style.display = 'block';
}

if (document.getElementById("home")) {
    showSection("home");
}


// ================= VOICE FEEDBACK =================

function speak(text){

window.speechSynthesis.cancel();

const speech = new SpeechSynthesisUtterance(text);

speech.lang = "en-US";
speech.rate = 0.8;
speech.pitch = 1;

window.speechSynthesis.speak(speech);

}

function playCorrect() {
    speak("Correct");
}

function playWrong() {
    speak("Incorrect");
}

function playTryAgain() {
    speak("Try again");
}


// ================= CLICK SEQUENCE MEMORY =================

window.memorySequence = window.memorySequence || [];
window.userSequence = window.userSequence || [];
window.memoryAttempts = window.memoryAttempts || 0;
window.memoryScore = window.memoryScore || 0;
window.memoryTotal = window.memoryTotal || 0;
window.memoryItems = window.memoryItems || ["🍎","🐶","⭐","🎈","🚗","🌸","⚽"];

function startClickMemory() {

    const level = document.getElementById("difficulty").value;
    if (!level) return;

    memoryAttempts = 0;
    memoryTotal++;
    userSequence = [];

    let count = level === "easy" ? 2 :
                level === "medium" ? 3 : 4;

    memorySequence = shuffle([...memoryItems]).slice(0, count);

    const board = document.getElementById("memoryBoard");
    const status = document.getElementById("memoryStatus");

    board.innerHTML = "";
    status.innerText = "";

    // SHOW SEQUENCE
    const seqDiv = document.createElement("div");
    seqDiv.style.fontSize = "35px";
    seqDiv.style.marginBottom = "15px";
    seqDiv.innerText = memorySequence.join("   ");
    board.appendChild(seqDiv);

    speak("Remember the sequence");

    // HIDE AFTER 3 SEC
    addTimeout(() => {
        board.innerHTML = "";
        showClickableItems();
    }, 3000);
}

function showClickableItems() {

    const board = document.getElementById("memoryBoard");
    board.innerHTML = "";

    let shuffled = shuffle([...memorySequence]);

    shuffled.forEach(item => {

        const btn = document.createElement("div");   // ✅ changed
        btn.className = "memory-card clickable-card"; // ✅ added class

        btn.innerText = item;

        btn.onclick = () => handleUserClick(item, btn);

        board.appendChild(btn);
    });

    speak("Click in correct order");
}

function handleUserClick(item, btn) {

    userSequence.push(item);

    btn.disabled = true;
    btn.classList.add("clicked");

    if (userSequence.length === memorySequence.length) {
        checkUserSequence();
    }
}
function checkUserSequence() {

    const status = document.getElementById("memoryStatus");

    let correct =
        JSON.stringify(userSequence) === JSON.stringify(memorySequence);

    if (correct) {

        status.innerText = "Correct!";
        status.style.color = "green";

        playCorrect();   // SAME voice system
        memoryScore++;

    } else {

        memoryAttempts++;

        if (memoryAttempts === 1) {

            status.innerText = "Try Again";
            status.style.color = "orange";

            playTryAgain();  // SAME voice

            userSequence = [];

            addTimeout(() => {
                showClickableItems();
            }, 800);

            return;

        } else {

            status.innerText =
                "Incorrect. Correct sequence: " + memorySequence.join(" ");
            status.style.color = "red";

            playWrong();   // SAME voice
        }
    }

    updateMemoryProgress();
}
function updateMemoryProgress() {

    if (memoryTotal === 0) return;

    let percent =
        Math.floor((memoryScore / memoryTotal) * 100);

    window.dashboard.memory = percent;
}

// =========================
// EMOTION MODULE
// =========================
window.emotionQueue = window.emotionQueue || [];
window.currentEmotionIndex = window.currentEmotionIndex || 0;
window.lastEmotionIndex = window.lastEmotionIndex || -1;
window.currentActionAnswer = window.currentActionAnswer || null;
window.currentEmotionAnswer = window.currentEmotionAnswer || null;
window.emotionAttempts = window.emotionAttempts || 0;

window.emotionPool = window.emotionPool || {

    easy: ["Happy","Sad","Angry","Excited"],

   medium: [
    {text:"He fell down and is crying.", emotion:"Sad", action:"Help him"},
    {text:"She got first rank in class.", emotion:"Happy", action:"Congratulate her"},
    {text:"His friend took his toy.", emotion:"Angry", action:"Calm him down"},
    {text:"She is going to a picnic.", emotion:"Excited", action:"Encourage her"},
    {text:"He dropped his food.", emotion:"Sad", action:"Comfort him"},
    {text:"She is laughing with friends.", emotion:"Happy", action:"Join her"},
    {text:"Someone pushed him.", emotion:"Angry", action:"Support him"},
    {text:"He got a new gift.", emotion:"Excited", action:"Be happy with him"}
],

hard: [
    {
        text:"He is smiling but not talking to anyone.",
        emotion:"Sad",
        action:"Talk to him"
    },
    {
        text:"She says she is fine but looks upset.",
        emotion:"Sad",
        action:"Ask her what happened"
    },
    {
        text:"He keeps quiet after being blamed.",
        emotion:"Angry",
        action:"Ask him calmly"
    },
    {
        text:"She laughs when others laugh but looks confused.",
        emotion:"Confused",
        action:"Explain to her"
    },
    {
        text:"He didn’t win but claps for others.",
        emotion:"Proud",
        action:"Appreciate him"
    },
    {
        text:"She avoids eye contact and stays alone.",
        emotion:"Sad",
        action:"Invite her"
    },
    {
        text:"He is excited but also nervous before stage.",
        emotion:"Excited",
        action:"Encourage him"
    },
    {
        text:"She is quiet after an argument.",
        emotion:"Angry",
        action:"Talk calmly"
    }
]
};
function loadEmotion() {

    const level =
        document.getElementById("emotionLevel").value;

    if (!level) return;
    emotionAttempts = 0;

    const display =
        document.getElementById("emotionDisplay");

    const optionsBox =
        document.getElementById("emotionOptions");

    const resultBox =
        document.getElementById("emotionScore");

    optionsBox.innerHTML = "";
    resultBox.innerText = "";

    let question;
    

    if (level === "easy") {

    const emotion =
        emotionPool.easy[Math.floor(Math.random()*emotionPool.easy.length)];

    question = `Select: ${emotion}`;
    currentEmotionAnswer = emotion;
    currentActionAnswer = null; // no action in easy

}
else {

    const dataset = emotionPool[level];

    let randomIndex;

do {
    randomIndex = Math.floor(Math.random() * dataset.length);
} while (randomIndex === lastEmotionIndex);

lastEmotionIndex = randomIndex;

const item = dataset[randomIndex];

    question = item.text;

    currentEmotionAnswer = item.emotion;
    currentActionAnswer = item.action;
}
    display.innerText = question;

    let allChoices =
        ["Happy","Sad","Angry","Excited","Proud","Confused"];

    let filtered =
    allChoices.filter(choice => choice !== currentEmotionAnswer);

    let wrongOptions =
        shuffle(filtered).slice(0,3);

    let finalOptions =
    shuffle([currentEmotionAnswer, ...wrongOptions]);

    finalOptions.forEach(choice => {

        const btn =
            document.createElement("button");

        btn.innerText = choice;

        btn.onclick = () => {

if (choice === currentEmotionAnswer) {


    resultBox.innerText = "Correct!";
    resultBox.style.color = "green";
    playCorrect();

        if (currentActionAnswer !== null) {
        addTimeout(() => {
            loadActionQuestion();
        }, 1000);
    }
}
            else {
                emotionAttempts++;

                if (emotionAttempts === 1) {
                    resultBox.innerText = "Try Again";
                    resultBox.style.color = "orange";
                    playTryAgain();

                } 
                else {
                    resultBox.innerText =
                        "Incorrect. Correct answer: " + currentEmotionAnswer;
                    resultBox.style.color = "red";
                    playWrong();
                }
            }
        };

        optionsBox.appendChild(btn);
    });
}

function loadActionQuestion() {

    const optionsBox = document.getElementById("emotionOptions");
    const display = document.getElementById("emotionDisplay");
    const resultBox = document.getElementById("emotionScore");

    optionsBox.innerHTML = "";
    resultBox.innerText = "";

    display.innerText = "What should you do?";

    let actions = [
        currentActionAnswer,
        "Ignore",
        "Laugh",
        "Walk away"
    ];

    actions = shuffle(actions);

    actions.forEach(act => {

        const btn = document.createElement("button");
        btn.innerText = act;

        btn.onclick = () => {

            if (act === currentActionAnswer) {

                resultBox.innerText = "Correct Action!";
                resultBox.style.color = "green";
                playCorrect();

            } else {

                resultBox.innerText =
                    "Incorrect. Correct action: " + currentActionAnswer;
                resultBox.style.color = "red";
                playWrong();
            }
        };

        optionsBox.appendChild(btn);
    });
}


window.currentPatternAnswer = window.currentPatternAnswer || null;
window.patternAttempts = window.patternAttempts || 0;
window.currentPatternHint = window.currentPatternHint || "";

function loadPattern() {

    const level =
        document.getElementById("patternLevel").value;

    if (!level) return;
    patternAttempts = 0;

    const questionBox =
        document.getElementById("patternQuestion");

    const optionsBox =
        document.getElementById("patternOptions");

    const resultBox =
        document.getElementById("patternResult");

    optionsBox.innerHTML = "";
    resultBox.innerText = "";

    let question, answer, options;

    if (level === "easy") {

        const shapes = ["🔵","🔴","🟢","🟡"];

        const a = shapes[Math.floor(Math.random()*shapes.length)];
        const remaining = shapes.filter(s => s !== a);
        const b = remaining[Math.floor(Math.random()*remaining.length)];

        question = `${a} ${b} ${a} ${b} ?`;
        answer = a;

        options = shuffle([a, b]);

        // ✅ Hint for easy
        currentPatternHint = "Look at repeating pattern";

    }
    else if (level === "medium") {

        const start = Math.floor(Math.random()*20)+1;
        const step = Math.floor(Math.random()*5)+1;

        question = `${start}, ${start+step}, ${start+2*step}, ${start+3*step}, ?`;
        answer = (start+4*step).toString();

        options = [
            answer,
            (start+5*step).toString(),
            (start+3*step).toString()
        ];

        // ✅ Hint for medium
        currentPatternHint = "Try adding " + step;

    }
    else {

        const base = Math.floor(Math.random()*5)+2;

        question = `${base}, ${base*2}, ${base*6}, ${base*24}, ?`;
        answer = (base*120).toString();

        options = [
            answer,
            (base*60).toString(),
            (base*240).toString()
        ];

        // ✅ Hint for hard
        currentPatternHint = "Multiply step by step";

    }

    currentPatternAnswer = answer;
    questionBox.innerText = question;

    shuffle(options).forEach(opt => {

        const btn = document.createElement("button");
        btn.innerText = opt;

        btn.onclick = () => {

            if (opt === currentPatternAnswer) {


                resultBox.innerText = "Correct!";
                resultBox.style.color = "green";
                playCorrect();

            } 
            else {

                patternAttempts++;

                if (patternAttempts === 1) {

                    // ✅ SHOW HINT
                    resultBox.innerText =
                        "Try Again. Hint: " + currentPatternHint;

                    resultBox.style.color = "orange";

                    playTryAgain();

                    // 🔊 Speak hint
                    speak(currentPatternHint);

                } 
                else {

                    resultBox.innerText =
                        "Incorrect. Correct answer: " + currentPatternAnswer;

                    resultBox.style.color = "red";

                    playWrong();
                }
            }
        };

        optionsBox.appendChild(btn);
    });
}

// =========================
// FLASHCARDS (MULTIPLE ITEMS PER CATEGORY)
// =========================

window.flashCategories = window.flashCategories || {

    animals: [
        {front:"Lion", back:"Wild carnivorous animal"},
        {front:"Elephant", back:"Largest land mammal"},
        {front:"Tiger", back:"Striped predator"},
        {front:"Giraffe", back:"Tallest land animal"},
        {front:"Panda", back:"Black and white bear"},
        {front:"Zebra", back:"Black and white striped animal"},
        {front:"Kangaroo", back:"Australian animal that jumps"},
        {front:"Dolphin", back:"Intelligent marine mammal"},
        {front:"Owl", back:"Bird active at night"},
        {front:"Bear", back:"Large furry wild animal"}
    ],

    science: [
        {front:"Neuron", back:"Brain communication cell"},
        {front:"Gravity", back:"Force pulling objects down"},
        {front:"Atom", back:"Smallest unit of matter"},
        {front:"Oxygen", back:"Gas we breathe"},
        {front:"Photosynthesis", back:"Plants making food"},
        {front:"Evaporation", back:"Liquid changing into gas"},
        {front:"Condensation", back:"Gas turning into liquid"},
        {front:"Electricity", back:"Energy from moving charges"},
        {front:"Molecule", back:"Group of atoms bonded together"},
        {front:"Ecosystem", back:"Living organisms and environment system"}
    ],

    shapes: [
        {front:"Triangle", back:"3 sided shape"},
        {front:"Square", back:"4 equal sides"},
        {front:"Circle", back:"Round shape"},
        {front:"Rectangle", back:"Opposite sides equal"},
        {front:"Pentagon", back:"5 sided shape"},
        {front:"Hexagon", back:"6 sided shape"},
        {front:"Octagon", back:"8 sided shape"},
        {front:"Oval", back:"Egg shaped figure"},
        {front:"Rhombus", back:"4 equal sides, slanted shape"},
        {front:"Trapezium", back:"One pair of parallel sides"}
    ],

   countries: [
    {front:"India", back:"Capital: New Delhi"},
    {front:"USA", back:"Capital: Washington D.C."},
    {front:"Japan", back:"Capital: Tokyo"},
    {front:"France", back:"Capital: Paris"},
    {front:"Brazil", back:"Capital: Brasília"}
  ],
   
   space: [
    {front:"Sun", back:"Star at the center of solar system"},
    {front:"Earth", back:"Our home planet"},
    {front:"Mars", back:"Red planet"},
    {front:"Moon", back:"Earth's natural satellite"},
    {front:"Galaxy", back:"Collection of stars"}
  ],

   health: [
    {front:"Heart", back:"Pumps blood"},
    {front:"Lungs", back:"Help in breathing"},
    {front:"Brain", back:"Controls body"},
    {front:"Bones", back:"Support body"},
    {front:"Muscles", back:"Help movement"}
]

};
window.flashCards = window.flashCards || [];
window.currentCard = window.currentCard || 0;
window.flipped = window.flipped || false;

function changeCategory() {

    const category =
        document.getElementById("flashCategory").value;

    if (!category) return;

    flashCards =
        shuffle([...flashCategories[category]]);  // already shuffling

    currentCard = 0;
    flipped = false;

    showCard();
}

function showCard() {

    if (flashCards.length === 0) return;

    const card =
        document.getElementById("flashcard");

    // Fade out
    card.classList.remove("fade-in");
    card.classList.add("fade-out");

    addTimeout(() => {

        card.innerText =
            flashCards[currentCard].front;

        card.style.backgroundColor = "#e0f2fe";
        flipped = false;

        // Fade in
        card.classList.remove("fade-out");
        card.classList.add("fade-in");

        // 🔊 Speak after card appears
        addTimeout(() => {
            speak("Say " + flashCards[currentCard].front);
        }, 200);

    }, 300);
}


function flipFlashcard() {

    if (flashCards.length === 0) return;

    const card =
        document.getElementById("flashcard");

   if (!flipped) {

    card.innerText =
        flashCards[currentCard].back;

    card.style.backgroundColor = "#fde68a";
    flipped = true;

    // 🔊 Speak AFTER showing text
    addTimeout(() => {
        speak(flashCards[currentCard].back);
    }, 200);

} else {
    showCard();
}
}
function repeatWord() {

    if (flashCards.length === 0) return;

    speak("Say " + flashCards[currentCard].front);
}

function nextCard() {

    if (flashCards.length === 0) return;

    currentCard =
        (currentCard + 1) % flashCards.length;

    if (flashMode === "study") {
        showCard();
    } else {
        loadFlashQuiz();
    }
}

function prevCard() {

    if (flashCards.length === 0) return;

    currentCard =
        (currentCard - 1 + flashCards.length) % flashCards.length;

    if (flashMode === "study") {
        showCard();
    } else {
        loadFlashQuiz();
    }
}


// ================= FLASHCARD QUIZ MODE =================
window.flashMode = window.flashMode || "study";
window.quizAnswer = window.quizAnswer || null;

function setFlashMode(mode) {
    flashMode = mode;

    document.getElementById("quizArea").innerHTML = "";

    if (mode === "study") {
        showCard();
    } else {
        loadFlashQuiz();
    }
}

function loadFlashQuiz() {

    if (flashCards.length === 0) return;

    const quizArea = document.getElementById("quizArea");
    quizArea.innerHTML = "";

    const current = flashCards[currentCard];
    quizAnswer = current.back;

    const question = document.createElement("h4");
    question.innerText = `What is ${current.front}?`;
    quizArea.appendChild(question);

    // Create options
    let allAnswers = flashCards.map(c => c.back);
    let wrongOptions = shuffle(
        allAnswers.filter(ans => ans !== quizAnswer)
    ).slice(0,3);

    let options = shuffle([quizAnswer, ...wrongOptions]);

    options.forEach(opt => {

        const btn = document.createElement("button");
        btn.innerText = opt;

        btn.onclick = () => {

            if (opt === quizAnswer) {

            
                btn.style.backgroundColor = "green";
                speak("Correct");
            } else {
                btn.style.backgroundColor = "red";
                speak("Try again");
            }
        };

        quizArea.appendChild(btn);
    });
}

// =========================
// MODULE NAVIGATION
// =========================

function openModule(module){

clearAllAsync();
resetAllModules();

document.getElementById("learningMenu").style.display = "none";

document.querySelectorAll(".learning-module")
.forEach(m => m.style.display = "none");

document.getElementById(module + "Module").style.display = "block";

}

function goBack(){

clearAllAsync();
resetAllModules();

document.querySelectorAll(".learning-module")
.forEach(m => m.style.display = "none");

document.getElementById("learningMenu").style.display = "grid";

}
// ================= PUZZLE MODULE =================

window.puzzleAnswer = window.puzzleAnswer || null;
window.puzzleAttempts = window.puzzleAttempts || 0;
window.reactionInterval = window.reactionInterval || null;
window.reactionStartTime = window.reactionStartTime || 0;
window.mazePosition = window.mazePosition || null;
window.currentMaze = window.currentMaze || null;
// ------------------ QUESTION BANKS ------------------

window.oddOneOutQuestions = window.oddOneOutQuestions || [

{items:["🐶","🐱","🐭","🍎"], answer:"🍎"},
{items:["2","4","6","9"], answer:"9"},
{items:["🔴","🔵","🔴","🔴"], answer:"🔵"},
{items:["Apple","Banana","Mango","Car"], answer:"Car"},
{items:["5","10","15","17"], answer:"17"},
{items:["🦁","🐯","🐘","🌸"], answer:"🌸"},
{items:["100","200","300","350"], answer:"350"},
{items:["Milk","Water","Juice","Table"], answer:"Table"},
{items:["🟢","🟢","🔴","🟢"], answer:"🔴"},
{items:["Monday","Tuesday","January","Wednesday"], answer:"January"}
];

window.mazeLevels = window.mazeLevels || [
[
["🐶","⬜","⬜","❌","⬜"],
["⬜","❌","⬜","❌","⬜"],
["⬜","⬜","⬜","⬜","🏠"],
["❌","❌","⬜","❌","⬜"],
["⬜","⬜","⬜","⬜","⬜"]
],

[
["🐶","❌","⬜","❌","⬜"],
["⬜","❌","⬜","❌","⬜"],
["⬜","⬜","⬜","❌","⬜"],
["❌","⬜","❌","⬜","⬜"],
["⬜","⬜","⬜","⬜","🏠"]
],

[
["🐶","⬜","❌","⬜","⬜"],
["⬜","⬜","❌","❌","⬜"],
["❌","⬜","⬜","⬜","⬜"],
["⬜","❌","❌","⬜","❌"],
["⬜","⬜","⬜","⬜","🏠"]
]
];

// ------------------ MAIN LOADER ------------------

function loadPuzzle() {

    const level = document.getElementById("puzzleLevel").value;
    const area = document.getElementById("puzzleArea");
    const result = document.getElementById("puzzleResult");

    if (!level) return;

    if (reactionInterval) clearInterval(reactionInterval);

    area.innerHTML = "";
    result.innerText = "";
    puzzleAttempts = 0;

    if (level === "easy") loadOddOneOut(area, result);
    if (level === "medium") loadReactionPuzzle(area, result);
    if (level === "hard") loadMaze(area, result);
}

// ------------------ EASY ------------------

function loadOddOneOut(area, result) {

    const q = oddOneOutQuestions[
        Math.floor(Math.random() * oddOneOutQuestions.length)
    ];

    puzzleAnswer = q.answer;

    q.items.forEach(item => {

        const btn = document.createElement("button");
        btn.innerText = item;

        btn.onclick = () => {

            if (item === puzzleAnswer) {
                result.innerText = "Correct!";
                result.style.color = "green";
                playCorrect();
            } else {

                puzzleAttempts++;

                if (puzzleAttempts === 1) {
                    result.innerText = "Try Again";
                    result.style.color = "orange";
                    playTryAgain();
                } else {
                    result.innerText =
                        "Incorrect. Correct answer: " + puzzleAnswer;
                    result.style.color = "red";
                    playWrong();
                }
            }
        };

        area.appendChild(btn);
    });
}

// ------------------ MEDIUM ------------------

function loadReactionPuzzle(area, result) {

    result.innerText = "Click only when you see ⭐";

    const symbols = ["🍎","🐶","🎈","⭐","🚗"];
    const display = document.createElement("div");
    display.style.fontSize = "60px";
    display.style.marginTop = "20px";
    area.appendChild(display);

    function showRandom() {
        const symbol = symbols[Math.floor(Math.random()*symbols.length)];
        display.innerText = symbol;

        if (symbol === "⭐") {
            reactionStartTime = Date.now();
        }
    }

    display.onclick = () => {

        if (display.innerText === "⭐") {

            const time = Date.now() - reactionStartTime;

            result.innerText =
                "Correct! Reaction time: " + time + " ms";
            result.style.color = "green";
            playCorrect();

        } else {

            puzzleAttempts++;

            if (puzzleAttempts === 1) {
                result.innerText = "Try Again";
                result.style.color = "orange";
                playTryAgain();
            } else {
                result.innerText = "Incorrect! Wait for ⭐";
                result.style.color = "red";
                playWrong();
            }
        }
    };

    reactionInterval = addInterval(showRandom, 1500);
}

// ------------------ HARD ------------------

function loadMaze(area, result) {

    currentMaze =
        JSON.parse(JSON.stringify(
            mazeLevels[Math.floor(Math.random()*mazeLevels.length)]
        ));

    mazePosition = {row:0, col:0};

    function renderMaze() {

        area.innerHTML = "";

        currentMaze.forEach((row, r) => {

            const rowDiv = document.createElement("div");
            rowDiv.style.display = "flex";

            row.forEach(cell => {

                const cellDiv = document.createElement("div");
                cellDiv.innerText = cell;
                cellDiv.style.fontSize = "28px";
                cellDiv.style.width = "40px";
                cellDiv.style.textAlign = "center";

                rowDiv.appendChild(cellDiv);
            });

            area.appendChild(rowDiv);
        });
    }

    renderMaze();

    document.onkeydown = function(e) {

        let newRow = mazePosition.row;
        let newCol = mazePosition.col;

        if (e.key === "ArrowUp") newRow--;
        if (e.key === "ArrowDown") newRow++;
        if (e.key === "ArrowLeft") newCol--;
        if (e.key === "ArrowRight") newCol++;

        if (
            newRow >= 0 &&
            newRow < currentMaze.length &&
            newCol >= 0 &&
            newCol < currentMaze[0].length &&
            currentMaze[newRow][newCol] !== "❌"
        ) {

            if (currentMaze[newRow][newCol] === "🏠") {

                result.innerText = "Correct! You reached home!";
                result.style.color = "green";
                playCorrect();
                return;
            }

            currentMaze[mazePosition.row][mazePosition.col] = "⬜";
            mazePosition = {row:newRow, col:newCol};
            currentMaze[newRow][newCol] = "🐶";

            renderMaze();
        }
    };
}

function resetAllModules(){

window.memorySequence = [];
window.userSequence = [];
window.memoryAttempts = 0;

window.emotionAttempts = 0;
window.currentEmotionAnswer = null;
window.currentActionAnswer = null;

window.patternAttempts = 0;
window.currentPatternAnswer = null;

window.puzzleAttempts = 0;

window.flashCards = [];
window.currentCard = 0;
window.flipped = false;

}