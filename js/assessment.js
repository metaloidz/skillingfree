/* ============================================================
   MICROSOFT AI SKILL TREE - ASSESSMENT ENGINE
   Full replacement for assessment.js

   Supported JSON question types:
   - "single" / "multiple-choice"   -> one answer, number
   - "multiple" / "multiple-answer" -> many answers, array
   - "drag-drop"                    -> matching, mapping array

   drag-drop example:
   {
     "type":"drag-drop",
     "question":"Match each item...",
     "items":["A","B","C"],
     "targets":["1","2","3"],
     "answer":[2,0,1]
   }
   ============================================================ */

let assessmentModule = null;
let assessmentQuestion = 0;
let assessmentAnswers = [];
let assessmentResult = null;
let assessmentScore = null;
let waitingForProgressSignIn = false;
let assessmentAnswerRevealed = false;
let assessments = {};
let assessmentsReady = false;
let assessmentInitialized = false;


/* ============================================================
   ASSESSMENT HISTORY
   ============================================================ */

let assessmentHistory =
    JSON.parse(
        localStorage.getItem(
            "aiSkillTreeAssessmentHistory"
        ) || "[]"
    );

let assessmentOverlay = null;
let assessmentBody = null;
let assessmentNext = null;
let assessmentCancel = null;


/* ============================================================
   ELEMENTS / HELPERS
   ============================================================ */

function cacheAssessmentElements(){

    assessmentOverlay =
        document.getElementById(
            "assessmentOverlay"
        );

    assessmentBody =
        document.getElementById(
            "assessmentBody"
        );

    assessmentNext =
        document.getElementById(
            "assessmentNext"
        );

    assessmentCancel =
        document.getElementById(
            "assessmentCancel"
        );

}


function el(id){

    return document.getElementById(id);

}


function getModule(moduleId){

    return (
        typeof byId !== "undefined" &&
        byId
    )
        ? byId[moduleId] || null
        : null;

}


function isDragDrop(question){

    return (
        !!question &&
        question.type === "drag-drop"
    );

}

function isDropdown(question){

    return (
        !!question &&
        question.type === "dropdown" &&
        Array.isArray(question.items)
    );

}


function isMultiple(question){

    return (
        !!question &&
        (
            question.type === "multiple" ||
            question.type === "multiple-answer"
        )
    );

}

function isYesNoMatrix(question){

    return (
        !!question &&
        question.type === "yesNoMatrix" &&
        Array.isArray(question.rows)
    );

}


function escapeHtml(value){

    return String(value ?? "")
        .replaceAll(
            "&",
            "&amp;"
        )
        .replaceAll(
            "<",
            "&lt;"
        )
        .replaceAll(
            ">",
            "&gt;"
        )
        .replaceAll(
            '"',
            "&quot;"
        )
        .replaceAll(
            "'",
            "&#039;"
        );

}


function removeFeedback(){

    const old =
        el("answerFeedback");

    if(old){

        old.remove();

    }

}


function feedback(
    correct,
    message
){

    removeFeedback();

    const options =
        el("answerOptions");

    if(!options){

        return;

    }

    const box =
        document.createElement(
            "div"
        );

    box.id =
        "answerFeedback";

    box.className =
        "answer-feedback " +
        (
            correct
                ? "feedback-correct"
                : "feedback-incorrect"
        );

    box.textContent =
        message;

    options.appendChild(
        box
    );

}


/* ============================================================
   WHITE THEME + DRAG/DROP STYLES
   ============================================================ */

function installAssessmentTheme(){

    if(
        document.getElementById(
            "assessmentWhiteTheme"
        )
    ){

        return;

    }

    const style =
        document.createElement(
            "style"
        );

    style.id =
        "assessmentWhiteTheme";

    style.textContent = `

#assessmentOverlay {
    background:
        rgba(0,0,0,.60) !important;
}

#assessmentOverlay > div {
    background:
        #ffffff !important;

    color:
        #111827 !important;

    border-color:
        #d1d5db !important;
}

#assessmentOverlay * {
    color:
        #111827;
}

#assessmentOverlay #assessmentCode {
    color:
        #d99a00 !important;
}

#assessmentOverlay #assessmentTitle {
    color:
        #111827 !important;
}

#assessmentOverlay #assessmentProgress {
    color:
        #64748b !important;
}

#assessmentOverlay #assessmentBody {
    background:
        #ffffff !important;

    color:
        #111827 !important;
}

#assessmentOverlay .question-number {
    color:
        #2563eb !important;

    background:
        transparent !important;
}

#assessmentOverlay .question-text {
    color:
        #111827 !important;

    background:
        #ffffff !important;
}

#assessmentOverlay .answer-option {

    width:
        100%;

    box-sizing:
        border-box;

    display:
        flex;

    align-items:
        center;

    gap:
        12px;

    text-align:
        left;

    background:
        #ffffff !important;

    color:
        #111827 !important;

    border:
        1px solid #d1d5db !important;

    border-radius:
        10px;

    padding:
        13px 15px;

    margin:
        0 0 10px;

    cursor:
        pointer;
}

#assessmentOverlay .answer-option:hover {

    background:
        #f8fafc !important;

    border-color:
        #94a3b8 !important;
}

#assessmentOverlay .answer-option.selected {

    background:
        #fff7df !important;

    border-color:
        #e0a526 !important;
}

#assessmentOverlay .answer-control {

    width:
        18px;

    height:
        18px;

    min-width:
        18px;

    display:
        inline-flex;

    align-items:
        center;

    justify-content:
        center;

    border:
        2px solid #94a3b8;

    box-sizing:
        border-box;
}

#assessmentOverlay .answer-control.radio {

    border-radius:
        50%;
}

#assessmentOverlay .answer-control.checkbox {

    border-radius:
        4px;
}

#assessmentOverlay
.answer-option.selected
.answer-control {

    border-color:
        #e0a526;

    background:
        #e0a526;
}

#assessmentOverlay
.answer-option.selected
.answer-control.radio::after {

    content:
        "";

    width:
        6px;

    height:
        6px;

    border-radius:
        50%;

    background:
        #ffffff;
}

#assessmentOverlay
.answer-option.selected
.answer-control.checkbox::after {

    content:
        "✓";

    color:
        #ffffff;

    font-size:
        12px;

    font-weight:
        800;
}

#assessmentOverlay
.multiple-answer-instruction {

    margin-bottom:
        16px;

    padding:
        10px 14px;

    background:
        #f1f5f9 !important;

    color:
        #374151 !important;

    border-radius:
        8px;

    font-size:
        12px;

    font-weight:
        700;

    letter-spacing:
        .08em;
}

#assessmentOverlay
.secondary-action {

    color:
        #ffffff !important;

    background:
        #151f35 !important;

    border:
        1px solid #f5b942 !important;
}

#assessmentOverlay
#assessmentNext {

    background:
        #e0a526 !important;

    color:
        #111827 !important;

    border:
        none !important;
}

#assessmentOverlay
#assessmentCancel {

    background:
        #ffffff !important;

    color:
        #334155 !important;

    border:
        1px solid #cbd5e1 !important;
}

#assessmentOverlay
.answer-option.correct-answer {

    background:
        #ecfdf5 !important;

    border:
        2px solid #16a34a !important;

    color:
        #166534 !important;
}

#assessmentOverlay
.answer-option.incorrect-answer {

    background:
        #fef2f2 !important;

    border:
        2px solid #dc2626 !important;

    color:
        #991b1b !important;
}

#assessmentOverlay
.answer-option:disabled {

    cursor:
        default !important;

    opacity:
        1 !important;
}

#assessmentOverlay
.answer-feedback {

    margin-top:
        14px;

    padding:
        12px 14px;

    border-radius:
        8px;

    font-size:
        12px;

    font-weight:
        800;

    letter-spacing:
        .04em;
}

#assessmentOverlay
.feedback-correct {

    background:
        #ecfdf5 !important;

    border:
        1px solid #86efac !important;

    color:
        #166534 !important;
}

#assessmentOverlay
.feedback-incorrect {

    background:
        #fef2f2 !important;

    border:
        1px solid #fca5a5 !important;

    color:
        #991b1b !important;
}

#assessmentOverlay
.drag-drop-container {

    display:
        grid;

    grid-template-columns:
        minmax(220px,1fr)
        50px
        minmax(280px,1.2fr);

    gap:
        18px;

    margin-top:
        20px;

    align-items:
        start;
}

#assessmentOverlay
.drag-drop-options,
#assessmentOverlay
.drag-drop-targets {

    display:
        flex;

    flex-direction:
        column;

    gap:
        12px;
}

#assessmentOverlay
.drag-drop-options-title,
#assessmentOverlay
.drag-drop-targets-title {

    font-size:
        11px;

    font-weight:
        800;

    letter-spacing:
        .08em;

    color:
        #64748b !important;

    margin-bottom:
        4px;
}

#assessmentOverlay
.drag-drop-item,


#assessmentOverlay
.drag-drop-target {

    min-height:
        70px;

    width:
        100%;

    padding:
        10px 14px;

    box-sizing:
        border-box;

    border:
        2px dashed #cbd5e1;

    border-radius:
        10px;

    background:
        #ffffff;

    color:
        #64748b !important;

    display:
        flex;

    flex-direction:
        column;

    align-items:
        stretch;

    justify-content:
        center;

    gap:
        5px;

    text-align:
        left;

    font-size:
        14px;

    font-weight:
        600;

    line-height:
        1.35;

    overflow-wrap:
        anywhere;

    transition:
        background .15s ease,
        border-color .15s ease;

}

#assessmentOverlay
.drag-drop-target-label {

    font-size:
        12px;

    font-weight:
        800;

    color:
        #475569 !important;

    line-height:
        1.3;
}


#assessmentOverlay
.drag-drop-target-answer {

    display:
        block;

    padding:
        7px 9px;

    border-radius:
        6px;

    background:
        #fff7df;

    border:
        1px solid #e0a526;

    color:
        #111827 !important;

    font-size:
        13px;

    font-weight:
        700;

    line-height:
        1.3;

}

#assessmentOverlay
.drag-drop-target.correct-answer
.drag-drop-target-answer {

    background:
        #dcfce7;

    border-color:
        #16a34a;

    color:
        #166534 !important;

}


#assessmentOverlay
.drag-drop-target.incorrect-answer
.drag-drop-target-answer {

    background:
        #fee2e2;

    border-color:
        #dc2626;

    color:
        #991b1b !important;

}

#assessmentOverlay
.drag-drop-item {

    border:
        2px solid #e0a526;

    background:
        #fff7df;

    color:
        #111827 !important;

    cursor:
        grab;

    user-select:
        none;
}

#assessmentOverlay
.drag-drop-item.dragging {

    opacity:
        .45;
}

#assessmentOverlay
.drag-drop-item.used {

    opacity:
        .5;

    cursor:
        default;
}

#assessmentOverlay
.drag-drop-arrow {

    min-height:
        54px;

    display:
        flex;

    align-items:
        center;

    justify-content:
        center;

    font-size:
        20px;

    font-weight:
        700;

    color:
        #94a3b8 !important;
}

#assessmentOverlay
.drag-drop-target {

    border:
        2px dashed #cbd5e1;

    background:
        #ffffff;

    color:
        #64748b !important;

    cursor:
        pointer;

    transition:
        .15s;
}

#assessmentOverlay
.drag-drop-target.drag-over {

    border-color:
        #e0a526;

    background:
        #fff7df;
}

#assessmentOverlay
.drag-drop-target.matched {

    border:
        2px solid #e0a526;

    background:
        #fff7df;

    color:
        #111827 !important;
}

#assessmentOverlay
.drag-drop-target.correct-answer {

    background:
        #ecfdf5 !important;

    border-color:
        #16a34a !important;

    color:
        #166534 !important;
}

#assessmentOverlay
.drag-drop-target.incorrect-answer {

    background:
        #fef2f2 !important;

    border-color:
        #dc2626 !important;

    color:
        #991b1b !important;
}

@media(max-width:700px){

    #assessmentOverlay
    .drag-drop-container {

        grid-template-columns:
            1fr;

        gap:
            10px;
    }

    #assessmentOverlay
    .drag-drop-arrow {

        min-height:
            30px;

        transform:
            rotate(90deg);
    }

}

`;

    document.head.appendChild(
        style
    );

}


/* ============================================================
   RESET BODY
   ============================================================ */

function resetAssessmentBody(){

    cacheAssessmentElements();

    if(!assessmentBody){

        console.error(
            "#assessmentBody was not found."
        );

        return;

    }

    assessmentBody.innerHTML = `

        <div
            class="question-number"
            id="questionNumber">

            QUESTION 1

        </div>

        <div
            class="question-text"
            id="questionText">

            Question goes here

        </div>

        <div
            id="answerOptions">
        </div>

    `;

}


/* ============================================================
   LOAD ASSESSMENTS
   ============================================================ */

async function loadAssessments(){

    try{

        const response =
            await fetch(
                "./data/assessments.json",
                {
                    cache:
                        "no-cache"
                }
            );

        if(!response.ok){

            throw new Error(
                `HTTP ${response.status} ${response.statusText}`
            );

        }

        const data =
            await response.json();

        if(
            !data ||
            typeof data !== "object" ||
            Array.isArray(data)
        ){

            throw new Error(
                "assessments.json must contain a JSON object."
            );

        }

        assessments =
            data;

        assessmentsReady =
            true;

                console.log(
            "ASSESSMENTS LOADED:",
            Object.keys(
                assessments
            )
        );


        /* ========================================================
           RESTORE PENDING ASSESSMENT AFTER LOGIN
           ======================================================== */

        await restorePendingAssessment();


    }
    catch(error){

        assessmentsReady =
            false;

        console.error(
            "ASSESSMENT LOADING FAILED:",
            error
        );

        setTimeout(
            () => {

                alert(
                    "ASSESSMENT DATA FAILED TO LOAD.\n\n" +
                    "Error: " +
                    error.message +
                    "\n\n" +
                    "Check the browser console (F12)."
                );

            },
            300
        );

    }

}

/* ============================================================
   RESTORE PENDING ASSESSMENT AFTER MAGIC LINK LOGIN
   ============================================================ */

async function restorePendingAssessment(){

    const pending =
        localStorage.getItem(
            "pendingAssessment"
        );


    if(!pending){

        return;

    }


    console.log(
        "PENDING ASSESSMENT FOUND"
    );


    let savedAssessment;


    try{

        savedAssessment =
            JSON.parse(
                pending
            );

    }
    catch(error){

        console.error(
            "INVALID PENDING ASSESSMENT:",
            error
        );

        localStorage.removeItem(
            "pendingAssessment"
        );

        return;

    }


    if(
        !savedAssessment ||
        !savedAssessment.moduleId ||
        !Array.isArray(
            savedAssessment.answers
        )
    ){

        console.error(
            "PENDING ASSESSMENT DATA IS INVALID."
        );

        localStorage.removeItem(
            "pendingAssessment"
        );

        return;

    }


    /* --------------------------------------------------------
       CHECK SUPABASE LOGIN
       -------------------------------------------------------- */

    const {
        data: {
            session
        }
    } =
        await window.supabaseClient.auth.getSession();


    if(
        !session ||
        !session.user
    ){

        console.log(
            "NO ACTIVE SESSION YET."
        );

        return;

    }


    /* --------------------------------------------------------
       CHECK ASSESSMENT EXISTS
       -------------------------------------------------------- */

    const assessment =
        assessments[
            savedAssessment.moduleId
        ];

    const module =
        getModule(
            savedAssessment.moduleId
        );


    if(
        !assessment ||
        !module
    ){

        console.error(
            "Unable to restore pending assessment:",
            savedAssessment.moduleId
        );

        return;

    }


    /* --------------------------------------------------------
       RESTORE ASSESSMENT STATE
       -------------------------------------------------------- */

    assessmentModule =
        savedAssessment.moduleId;

    assessmentAnswers =
        savedAssessment.answers;

    assessmentQuestion =
        savedAssessment.question ??
        assessment.questions.length - 1;

    assessmentResult =
        null;

    assessmentAnswerRevealed =
        true;


    /* --------------------------------------------------------
       REMOVE PENDING FLAG
       -------------------------------------------------------- */

    localStorage.removeItem(
        "pendingAssessment"
    );


    /* --------------------------------------------------------
       OPEN ASSESSMENT RESULT
       -------------------------------------------------------- */

    cacheAssessmentElements();

    if(
        assessmentOverlay
    ){

        assessmentOverlay.classList.add(
            "open"
        );

    }


    console.log(
        "RESTORING ASSESSMENT:",
        savedAssessment.moduleId
    );


    /* --------------------------------------------------------
       CALCULATE RESULT
       -------------------------------------------------------- */

    await submitAssessment();

}


/* ============================================================
   START ASSESSMENT
   ============================================================ */

function startAssessment(
    moduleId
){

    cacheAssessmentElements();

    if(
        !assessmentOverlay ||
        !assessmentBody ||
        !assessmentNext
    ){

        console.error(
            "Assessment UI is missing required elements."
        );

        alert(
            "The assessment window could not be opened.\n\n" +
            "Required IDs:\n" +
            "assessmentOverlay\n" +
            "assessmentBody\n" +
            "assessmentNext"
        );

        return;

    }

    if(!assessmentsReady){

        alert(
            "Assessment data has not loaded yet. " +
            "Please wait a moment and try again."
        );

        return;

    }

    const assessment =
        assessments[
            moduleId
        ];

    const module =
        getModule(
            moduleId
        );

    console.log(
        "STARTING ASSESSMENT:",
        {
            moduleId:
                moduleId,

            assessment:
                assessment,

            module:
                module
        }
    );

    if(!assessment){

        alert(
            "No assessment exists for module:\n\n" +
            moduleId +
            "\n\nAvailable assessment IDs:\n" +
            Object.keys(
                assessments
            ).join(", ")
        );

        return;

    }

    if(!module){

        alert(
            "Module does not exist in modules.json:\n\n" +
            moduleId
        );

        return;

    }

    if(
        !Array.isArray(
            assessment.questions
        ) ||
        assessment.questions.length === 0
    ){

        alert(
            "The assessment contains no questions:\n\n" +
            moduleId
        );

        return;

    }

    assessmentModule =
        moduleId;

    assessmentQuestion =
        0;

    assessmentAnswers =
        [];

    assessmentResult =
        null;

    assessmentAnswerRevealed =
        false;

    resetAssessmentBody();

    assessmentOverlay.classList.add(
        "open"
    );

    renderAssessmentQuestion();

}


/* ============================================================
   DRAG / DROP MATCHING
   ============================================================ */

function renderDragDropQuestion(
    question,
    container
){

    const items =
        Array.isArray(
            question.items
        )
            ? question.items
            : [];

    const targets =
        Array.isArray(
            question.targets
        )
            ? question.targets
            : [];

    if(
        !items.length ||
        !targets.length
    ){

        container.innerHTML = `

            <div
                class="answer-feedback feedback-incorrect">

                This matching question is missing
                items or targets.

            </div>

        `;

        return;

    }

    let matches =
        assessmentAnswers[
            assessmentQuestion
        ];

    if(
        !Array.isArray(matches) ||
        matches.length !== items.length
    ){

        matches =
            new Array(
                items.length
            ).fill(
                null
            );

        assessmentAnswers[
            assessmentQuestion
        ] =
            matches;

    }

    const wrapper =
        document.createElement(
            "div"
        );

    wrapper.className =
        "drag-drop-container";


    /*
    ------------------------------------------------------------
    LEFT COLUMN
    ------------------------------------------------------------
    */

    const left =
        document.createElement(
            "div"
        );

    left.className =
        "drag-drop-options";


    const leftTitle =
        document.createElement(
            "div"
        );

    leftTitle.className =
        "drag-drop-options-title";

    leftTitle.textContent =
        "AVAILABLE OPTIONS";


    left.appendChild(
        leftTitle
    );


    /*
    ------------------------------------------------------------
    CENTER ARROW
    ------------------------------------------------------------
    */

    const arrow =
        document.createElement(
            "div"
        );

    arrow.className =
        "drag-drop-arrow";

    arrow.textContent =
        "→";


    /*
    ------------------------------------------------------------
    RIGHT COLUMN
    ------------------------------------------------------------
    */

    const right =
        document.createElement(
            "div"
        );

    right.className =
        "drag-drop-targets";


    const rightTitle =
        document.createElement(
            "div"
        );

    rightTitle.className =
        "drag-drop-targets-title";

    rightTitle.textContent =
        "MATCH EACH OPTION";


    right.appendChild(
        rightTitle
    );


    /*
    ------------------------------------------------------------
    TARGET TEXT
    ------------------------------------------------------------
    */

    function setTargetText(
    target,
    targetIndex
){

    const itemIndex =
        matches.findIndex(
            value =>
                value ===
                targetIndex
        );


    /*
    ------------------------------------------------------------
    Clear existing content
    ------------------------------------------------------------
    */

    target.innerHTML = "";


    /*
    ------------------------------------------------------------
    TARGET LABEL
    ------------------------------------------------------------
    */

    const label =
        document.createElement(
            "div"
        );

    label.className =
        "drag-drop-target-label";

    label.textContent =
        targets[
            targetIndex
        ];


    target.appendChild(
        label
    );


    /*
    ------------------------------------------------------------
    MATCHED ANSWER
    ------------------------------------------------------------
    */

    if(
        itemIndex !== -1
    ){

        const answer =
            document.createElement(
                "div"
            );

        answer.className =
            "drag-drop-target-answer";

        answer.textContent =
            items[
                itemIndex
            ];


        target.appendChild(
            answer
        );

    }


    /*
    ------------------------------------------------------------
    MATCHED STATE
    ------------------------------------------------------------
    */

    target.classList.toggle(
        "matched",
        itemIndex !== -1
    );

}


    /*
    ------------------------------------------------------------
    REFRESH AVAILABLE OPTIONS
    ------------------------------------------------------------
    */

    function refreshLeft(){

        left
            .querySelectorAll(
                ".drag-drop-item"
            )
            .forEach(
                element =>
                    element.remove()
            );

        items.forEach(
            (
                itemText,
                itemIndex
            ) => {

                const used =
                    matches[
                        itemIndex
                    ] !== null &&
                    matches[
                        itemIndex
                    ] !== undefined;

                if(used){

                    return;

                }

                const item =
                    document.createElement(
                        "div"
                    );

                item.className =
                    "drag-drop-item";

                item.textContent =
                    itemText;

                item.draggable =
                    !assessmentAnswerRevealed;

                item.dataset.itemIndex =
                    String(
                        itemIndex
                    );


                /*
                --------------------------------------------
                DRAG START
                --------------------------------------------
                */

                item.addEventListener(
                    "dragstart",
                    event => {

                        if(
                            assessmentAnswerRevealed
                        ){

                            event.preventDefault();

                            return;

                        }

                        event.dataTransfer.setData(
                            "text/plain",
                            String(
                                itemIndex
                            )
                        );

                        event.dataTransfer.effectAllowed =
                            "move";

                        item.classList.add(
                            "dragging"
                        );

                    }
                );


                /*
                --------------------------------------------
                DRAG END
                --------------------------------------------
                */

                item.addEventListener(
                    "dragend",
                    () => {

                        item.classList.remove(
                            "dragging"
                        );

                    }
                );


                left.appendChild(
                    item
                );

            }
        );

    }


    /*
    ------------------------------------------------------------
    REFRESH TARGETS
    ------------------------------------------------------------
    */

    function refreshRight(){

        right
            .querySelectorAll(
                ".drag-drop-target"
            )
            .forEach(
                target => {

                    const targetIndex =
                        Number(
                            target.dataset.targetIndex
                        );

                    setTargetText(
                        target,
                        targetIndex
                    );

                    target.classList.remove(
                        "correct-answer",
                        "incorrect-answer"
                    );

                }
            );

    }


    /*
    ------------------------------------------------------------
    ASSIGN MATCH
    ------------------------------------------------------------
    */

    function assign(
        itemIndex,
        targetIndex
    ){

        if(
            assessmentAnswerRevealed
        ){

            return;

        }


        /*
        --------------------------------------------
        Is target already occupied?
        --------------------------------------------
        */

        const oldItem =
            matches.findIndex(
                value =>
                    value ===
                    targetIndex
            );


        if(
            oldItem !== -1 &&
            oldItem !== itemIndex
        ){

            matches[
                oldItem
            ] =
                null;

        }


        /*
        --------------------------------------------
        Save mapping
        --------------------------------------------
        */

        matches[
            itemIndex
        ] =
            targetIndex;

        assessmentAnswers[
            assessmentQuestion
        ] =
            matches;


        refreshLeft();
        refreshRight();


        /*
        --------------------------------------------
        Check whether everything is matched
        --------------------------------------------
        */

        const complete =
            matches.length ===
                items.length &&

            matches.every(
                value =>
                    value !== null &&
                    value !== undefined
            );


        if(complete){

            setTimeout(
                revealCurrentAnswer,
                200
            );

        }

    }


    /*
    ------------------------------------------------------------
    CREATE TARGETS
    ------------------------------------------------------------
    */

    targets.forEach(
        (
            targetText,
            targetIndex
        ) => {

            const target =
                document.createElement(
                    "div"
                );

            target.className =
                "drag-drop-target";

            target.dataset.targetIndex =
                String(
                    targetIndex
                );

            setTargetText(
                target,
                targetIndex
            );


            /*
            --------------------------------------------
            DRAG OVER
            --------------------------------------------
            */

            target.addEventListener(
                "dragover",
                event => {

                    if(
                        assessmentAnswerRevealed
                    ){

                        return;

                    }

                    event.preventDefault();

                    event.dataTransfer.dropEffect =
                        "move";

                    target.classList.add(
                        "drag-over"
                    );

                }
            );


            /*
            --------------------------------------------
            DRAG LEAVE
            --------------------------------------------
            */

            target.addEventListener(
                "dragleave",
                () => {

                    target.classList.remove(
                        "drag-over"
                    );

                }
            );


            /*
            --------------------------------------------
            DROP
            --------------------------------------------
            */

            target.addEventListener(
                "drop",
                event => {

                    event.preventDefault();

                    target.classList.remove(
                        "drag-over"
                    );

                    if(
                        assessmentAnswerRevealed
                    ){

                        return;

                    }

                    const itemIndex =
                        Number(
                            event.dataTransfer.getData(
                                "text/plain"
                            )
                        );

                    if(
                        Number.isNaN(
                            itemIndex
                        ) ||
                        itemIndex < 0 ||
                        itemIndex >= items.length
                    ){

                        return;

                    }

                    assign(
                        itemIndex,
                        targetIndex
                    );

                }
            );


            right.appendChild(
                target
            );

        }
    );


    /*
    ------------------------------------------------------------
    BUILD LAYOUT
    ------------------------------------------------------------
    */

    refreshLeft();

    wrapper.append(
        left,
        arrow,
        right
    );

    container.appendChild(
        wrapper
    );

}


/* ============================================================
   YES / NO MATRIX
   ============================================================ */

function renderYesNoMatrixQuestion(
    question,
    container
){

    const rows = Array.isArray(question.rows)
        ? question.rows
        : [];

    if(!rows.length){

        container.appendChild(
            createError(
                "This Yes/No matrix question contains no rows."
            )
        );

        return;
    }


    let answers =
        assessmentAnswers[
            assessmentQuestion
        ];

    if(
        !Array.isArray(answers) ||
        answers.length !== rows.length
    ){

        answers =
            new Array(
                rows.length
            ).fill(null);

        assessmentAnswers[
            assessmentQuestion
        ] =
            answers;

    }


    const table =
        document.createElement("div");

    table.className =
        "yes-no-matrix";


    /*
    ------------------------------------------------------------
    HEADER
    ------------------------------------------------------------
    */

    const header =
        document.createElement("div");

    header.className =
        "yes-no-matrix-header";

    header.innerHTML = `
        <div class="yes-no-matrix-statement">
            STATEMENT
        </div>

        <div class="yes-no-matrix-choice">
            YES
        </div>

        <div class="yes-no-matrix-choice">
            NO
        </div>
    `;

    table.appendChild(header);


    /*
    ------------------------------------------------------------
    ROWS
    ------------------------------------------------------------
    */

    rows.forEach(
        (
            row,
            rowIndex
        ) => {

            const rowElement =
                document.createElement("div");

            rowElement.className =
                "yes-no-matrix-row";


            /*
            ----------------------------------------------------
            STATEMENT
            ----------------------------------------------------
            */

            const statement =
                document.createElement("div");

            statement.className =
                "yes-no-matrix-statement";

            statement.textContent =
                row.statement || "";


            rowElement.appendChild(
                statement
            );


            /*
            ----------------------------------------------------
            YES / NO BUTTONS
            ----------------------------------------------------
            */

            [0, 1].forEach(
                choice => {

                    const button =
                        document.createElement("button");

                    button.type =
                        "button";

                    button.className =
                        "yes-no-button";


                    button.textContent =
                        choice === 0
                            ? "YES"
                            : "NO";


                    /*
                    --------------------------------------------
                    Restore previous answer
                    --------------------------------------------
                    */

                    if(
                        answers[rowIndex] ===
                        choice
                    ){

                        button.classList.add(
                            "selected"
                        );

                    }


                    /*
                    --------------------------------------------
                    CLICK
                    --------------------------------------------
                    */

                    button.addEventListener(
                        "click",
                        () => {

                            if(
                                assessmentAnswerRevealed
                            ){

                                return;

                            }


                            answers[rowIndex] =
                                choice;


                            assessmentAnswers[
                                assessmentQuestion
                            ] =
                                answers;


                            rowElement
                                .querySelectorAll(
                                    ".yes-no-button"
                                )
                                .forEach(
                                    element => {

                                        element.classList.remove(
                                            "selected"
                                        );

                                    }
                                );


                            button.classList.add(
                                "selected"
                            );

                        }
                    );


                    rowElement.appendChild(
                        button
                    );

                }
            );


            table.appendChild(
                rowElement
            );

        }
    );


    container.appendChild(
        table
    );

}


/* ============================================================
   RENDER DROPDOWN QUESTION
   ============================================================ */

function renderDropdownQuestion(
    question,
    container
){

    const items =
        Array.isArray(question.items)
            ? question.items
            : [];

    items.forEach(
        (
            item,
            itemIndex
        ) => {

            const wrapper =
                document.createElement(
                    "div"
                );

            wrapper.className =
                "dropdown-question";

            const label =
                document.createElement(
                    "div"
                );

            label.className =
                "dropdown-question-text";

            label.textContent =
                item.text || "";

            const select =
                document.createElement(
                    "select"
                );

            select.className =
                "assessment-dropdown";

            select.dataset.itemIndex =
                String(itemIndex);

            /* Placeholder */

            const placeholder =
                document.createElement(
                    "option"
                );

            placeholder.value =
                "";

            placeholder.textContent =
                "Select an answer...";

            placeholder.disabled =
                true;

            placeholder.selected =
                true;

            select.appendChild(
                placeholder
            );

            /* Options */

            const options =
                Array.isArray(item.options)
                    ? item.options
                    : [];

            options.forEach(
                (
                    optionText,
                    optionIndex
                ) => {

                    const option =
                        document.createElement(
                            "option"
                        );

                    option.value =
                        String(optionIndex);

                    option.textContent =
                        optionText;

                    select.appendChild(
                        option
                    );

                }
            );

            /* Restore previous answer */

            const previousAnswer =
                assessmentAnswers[
                    assessmentQuestion
                ];

            if(
                Array.isArray(
                    previousAnswer
                ) &&
                previousAnswer[
                    itemIndex
                ] !== undefined
            ){

                select.value =
                    String(
                        previousAnswer[
                            itemIndex
                        ]
                    );

            }

            /* Save answer */

            select.addEventListener(
                "change",
                () => {

                    let answers =
                        assessmentAnswers[
                            assessmentQuestion
                        ];

                    if(
                        !Array.isArray(
                            answers
                        )
                    ){

                        answers =
                            new Array(
                                items.length
                            ).fill(
                                null
                            );

                    }

                    answers[
                        itemIndex
                    ] =
                        Number(
                            select.value
                        );

                    assessmentAnswers[
                        assessmentQuestion
                    ] =
                        answers;

                }
            );

            wrapper.appendChild(
                label
            );

            wrapper.appendChild(
                select
            );

            container.appendChild(
                wrapper
            );

        }
    );

}

/* ============================================================
   RENDER QUESTION
   ============================================================ */

function renderAssessmentQuestion(){

    const assessment =
        assessments[
            assessmentModule
        ];

    const module =
        getModule(
            assessmentModule
        );

    if(
        !assessment ||
        !module
    ){

        console.error(
            "Unable to render assessment:",
            assessmentModule
        );

        return;

    }


    assessmentAnswerRevealed =
        false;


    const question =
        assessment.questions[
            assessmentQuestion
        ];

    if(!question){

        console.error(
            "Question does not exist:",
            assessmentQuestion
        );

        return;

    }


    /*
    ------------------------------------------------------------
    MAKE SURE BODY EXISTS
    ------------------------------------------------------------
    */

    if(
        !el(
            "questionText"
        )
    ){

        resetAssessmentBody();

    }


    const code =
        el(
            "assessmentCode"
        );

    const title =
        el(
            "assessmentTitle"
        );

    const progress =
        el(
            "assessmentProgress"
        );

    const number =
        el(
            "questionNumber"
        );

    const text =
        el(
            "questionText"
        );

    const options =
        el(
            "answerOptions"
        );


    if(!options){

        console.error(
            "#answerOptions was not found."
        );

        return;

    }


    /*
    ------------------------------------------------------------
    HEADER
    ------------------------------------------------------------
    */

    if(code){

        code.textContent =
            module.code ||
            assessmentModule;

    }

    if(title){

        title.textContent =
            (
                module.name ||
                assessmentModule
            ) +
            " Assessment";

    }

    if(progress){

        progress.textContent =
            `Question ${
                assessmentQuestion + 1
            } / ${
                assessment.questions.length
            }`;

    }

    if(number){

        number.textContent =
            `QUESTION ${
                assessmentQuestion + 1
            }`;

    }

    if(text){

        text.textContent =
            question.question ||
            "";

    }


    /*
    ------------------------------------------------------------
    CLEAR OLD CONTENT
    ------------------------------------------------------------
    */

    options.innerHTML =
        "";


    /*
    ------------------------------------------------------------
    DRAG / DROP
    ------------------------------------------------------------
    */

    if(
        isDragDrop(
            question
        )
    ){

        renderDragDropQuestion(
            question,
            options
        );

        assessmentNext.dataset.mode =
            "question";

        assessmentNext.textContent =
            assessmentQuestion ===
            assessment.questions.length - 1

                ? "SUBMIT ASSESSMENT"

                : "NEXT QUESTION";

        return;

    }

    /* ------------------------------------------------------------
DROPDOWN
------------------------------------------------------------ */

if(
    isDropdown(
        question
    )
){

    renderDropdownQuestion(
        question,
        options
    );

    assessmentNext.dataset.mode =
        "question";

    assessmentNext.textContent =
        assessmentQuestion ===
        assessment.questions.length - 1

            ? "SUBMIT ASSESSMENT"

            : "NEXT QUESTION";

    return;

}



    /*
------------------------------------------------------------
YES / NO MATRIX
------------------------------------------------------------
*/

if(
    isYesNoMatrix(
        question
    )
){

    renderYesNoMatrixQuestion(
        question,
        options
    );

    assessmentNext.dataset.mode =
        "question";

    assessmentNext.textContent =
        assessmentQuestion ===
        assessment.questions.length - 1

            ? "SUBMIT ASSESSMENT"

            : "NEXT QUESTION";

    return;

}


    /*
    ------------------------------------------------------------
    MULTIPLE ANSWER INSTRUCTION
    ------------------------------------------------------------
    */

    const multiple =
        isMultiple(
            question
        );

    if(multiple){

        const instruction =
            document.createElement(
                "div"
            );

        instruction.className =
            "multiple-answer-instruction";

        instruction.textContent =
            question.selection ||
            "SELECT ALL THAT APPLY";

        options.appendChild(
            instruction
        );

    }


    /*
    ------------------------------------------------------------
    VALIDATE OPTIONS
    ------------------------------------------------------------
    */

    if(
        !Array.isArray(
            question.options
        )
    ){

        options.appendChild(
            createError(
                "This question does not contain an options array."
            )
        );

        return;

    }


    /*
    ------------------------------------------------------------
    RESTORE PREVIOUS ANSWERS
    ------------------------------------------------------------
    */

    let selectedAnswers =
        assessmentAnswers[
            assessmentQuestion
        ];


    if(multiple){

        if(
            !Array.isArray(
                selectedAnswers
            )
        ){

            selectedAnswers =
                [];

        }

    }
    else{

        if(
            selectedAnswers ===
                undefined ||
            selectedAnswers ===
                null
        ){

            selectedAnswers =
                null;

        }

    }


    /*
    ------------------------------------------------------------
    CREATE OPTIONS
    ------------------------------------------------------------
    */

    question.options.forEach(
        (
            option,
            index
        ) => {

            const button =
                document.createElement(
                    "button"
                );

            button.type =
                "button";

            button.className =
                "answer-option";


            const control =
                document.createElement(
                    "span"
                );

            control.className =
                "answer-control " +
                (
                    multiple
                        ? "checkbox"
                        : "radio"
                );


            const answerText =
                document.createElement(
                    "span"
                );

            answerText.textContent =
                String.fromCharCode(
                    65 + index
                ) +
                ". " +
                String(
                    option
                );


            button.append(
                control,
                answerText
            );


            /*
            --------------------------------------------
            RESTORE SELECTION
            --------------------------------------------
            */

            if(
                multiple
                    ? selectedAnswers.includes(
                        index
                    )
                    : selectedAnswers ===
                        index
            ){

                button.classList.add(
                    "selected"
                );

            }


            /*
            --------------------------------------------
            CLICK
            --------------------------------------------
            */

            button.addEventListener(
                "click",
                () => {

                    if(
                        assessmentAnswerRevealed
                    ){

                        return;

                    }


                    /*
                    ----------------------------------------
                    MULTIPLE ANSWER
                    ----------------------------------------
                    */

                    if(multiple){

                        let current =
                            assessmentAnswers[
                                assessmentQuestion
                            ];

                        if(
                            !Array.isArray(
                                current
                            )
                        ){

                            current =
                                [];

                        }


                        if(
                            current.includes(
                                index
                            )
                        ){

                            current =
                                current.filter(
                                    value =>
                                        value !==
                                        index
                                );

                        }
                        else{

                            current =
                                [
                                    ...current,
                                    index
                                ].sort(
                                    (
                                        a,
                                        b
                                    ) =>
                                        a - b
                                );

                        }


                        assessmentAnswers[
                            assessmentQuestion
                        ] =
                            current;


                        button.classList.toggle(
                            "selected",
                            current.includes(
                                index
                            )
                        );


                        return;

                    }


                    /*
                    ----------------------------------------
                    SINGLE ANSWER
                    ----------------------------------------
                    */

                    assessmentAnswers[
                        assessmentQuestion
                    ] =
                        index;


                    options
                        .querySelectorAll(
                            ".answer-option"
                        )
                        .forEach(
                            element => {

                                element.classList.remove(
                                    "selected"
                                );

                            }
                        );


                    button.classList.add(
                        "selected"
                    );


                    /*
                    Automatically show feedback
                    for single-answer questions.
                    */

                    revealCurrentAnswer();

                }
            );


            options.appendChild(
                button
            );

        }
    );


    /*
    ------------------------------------------------------------
    NEXT BUTTON
    ------------------------------------------------------------
    */

    assessmentNext.dataset.mode =
        "question";

    assessmentNext.textContent =
        assessmentQuestion ===
        assessment.questions.length - 1

            ? "SUBMIT ASSESSMENT"

            : "NEXT QUESTION";

}


/* ============================================================
   ERROR MESSAGE
   ============================================================ */

function createError(
    message
){

    const box =
        document.createElement(
            "div"
        );

    box.className =
        "answer-feedback feedback-incorrect";

    box.textContent =
        message;

    return box;

}


/* ============================================================
   REVEAL CURRENT ANSWER
   ============================================================ */

function revealCurrentAnswer(){

    const assessment =
        assessments[
            assessmentModule
        ];

    if(!assessment){

        return;

    }


    const question =
        assessment.questions[
            assessmentQuestion
        ];

    if(!question){

        return;

    }


    const correctAnswer =
        question.answer;

    const userAnswer =
        assessmentAnswers[
            assessmentQuestion
        ];


    /* ========================================================
       DRAG / DROP MATCHING
       ======================================================== */

    if(
        isDragDrop(
            question
        )
    ){

        const userMatches =
            Array.isArray(
                userAnswer
            )
                ? userAnswer
                : [];


        const correctMatches =
            Array.isArray(
                correctAnswer
            )
                ? correctAnswer
                : [];


        const targets =
            document.querySelectorAll(
                "#answerOptions .drag-drop-target"
            );


        let allCorrect =
            correctMatches.length ===
                question.items.length;


        targets.forEach(
            element => {

                element.classList.remove(
                    "correct-answer",
                    "incorrect-answer"
                );

            }
        );


        question.items.forEach(
            (
                item,
                itemIndex
            ) => {

                const correctTarget =
                    correctMatches[
                        itemIndex
                    ];

                const userTarget =
                    userMatches[
                        itemIndex
                    ];


                const target =
                    document.querySelector(
                        `#answerOptions .drag-drop-target[data-target-index="${correctTarget}"]`
                    );


                if(!target){

                    allCorrect =
                        false;

                    return;

                }


                if(
                    userTarget ===
                    correctTarget
                ){

                    target.classList.add(
                        "correct-answer"
                    );

                }
                else{

                    target.classList.add(
                        "incorrect-answer"
                    );

                    allCorrect =
                        false;

                }

            }
        );


        feedback(
            allCorrect,
            allCorrect
                ? "✓ CORRECT"
                : "✗ INCORRECT — CORRECT MATCHES HIGHLIGHTED"
        );


        targets.forEach(
            target => {

                target.classList.add(
                    "matched"
                );

            }
        );


        document
            .querySelectorAll(
                "#answerOptions .drag-drop-item"
            )
            .forEach(
                item => {

                    item.draggable =
                        false;

                    item.classList.add(
                        "used"
                    );

                }
            );


        assessmentAnswerRevealed =
            true;

        return;

    }

    /* ========================================================
   YES / NO MATRIX
   ======================================================== */

if(
    isYesNoMatrix(
        question
    )
){

    const userAnswers =
        Array.isArray(userAnswer)
            ? userAnswer
            : [];

    const rows =
        Array.isArray(question.rows)
            ? question.rows
            : [];


    let allCorrect =
        userAnswers.length ===
            rows.length;


    rows.forEach(
        (
            row,
            rowIndex
        ) => {

            const userChoice =
                userAnswers[
                    rowIndex
                ];

            const correctChoice =
                row.answer;


            const rowElement =
                document.querySelectorAll(
                    "#answerOptions .yes-no-matrix-row"
                )[rowIndex];


            if(!rowElement){

                allCorrect = false;

                return;

            }


            const buttons =
                rowElement.querySelectorAll(
                    ".yes-no-button"
                );


            buttons.forEach(
                (
                    button,
                    buttonIndex
                ) => {

                    button.classList.remove(
                        "correct-answer",
                        "incorrect-answer"
                    );


                    if(
                        buttonIndex ===
                        correctChoice
                    ){

                        button.classList.add(
                            "correct-answer"
                        );

                    }


                    if(
                        buttonIndex ===
                            userChoice &&
                        userChoice !==
                            correctChoice
                    ){

                        button.classList.add(
                            "incorrect-answer"
                        );

                    }


                    button.disabled =
                        true;

                }
            );


            if(
                userChoice !==
                correctChoice
            ){

                allCorrect =
                    false;

            }

        }
    );


    feedback(
        allCorrect,

        allCorrect
            ? "✓ CORRECT"
            : "✗ INCORRECT — CORRECT ANSWERS HIGHLIGHTED"
    );


    assessmentAnswerRevealed =
        true;

    return;

}


/* ========================================================
   DROPDOWN
   ======================================================== */

if(
    isDropdown(
        question
    )
){

    const userAnswers =
        Array.isArray(
            userAnswer
        )
            ? userAnswer
            : [];

    const items =
        Array.isArray(
            question.items
        )
            ? question.items
            : [];

    let allCorrect =
        userAnswers.length ===
            items.length;

    const selects =
        document.querySelectorAll(
            "#answerOptions .assessment-dropdown"
        );

    selects.forEach(
        (
            select,
            index
        ) => {

            const userChoice =
                userAnswers[
                    index
                ];

            const correctChoice =
                Number(
                    items[index]?.answer
                );

            select.classList.remove(
                "correct-answer",
                "incorrect-answer"
            );

            if(
                Number(userChoice) ===
                correctChoice
            ){

                select.classList.add(
                    "correct-answer"
                );

            }
            else{

                select.classList.add(
                    "incorrect-answer"
                );

                allCorrect =
                    false;

            }

            select.disabled =
                true;

        }
    );

    feedback(
        allCorrect,

        allCorrect
            ? "✓ CORRECT"
            : "✗ INCORRECT — CORRECT ANSWERS HIGHLIGHTED"
    );

    assessmentAnswerRevealed =
        true;

    return;

}

    /* ========================================================
       NORMAL SINGLE / MULTIPLE CHOICE
       ======================================================== */

    const multiple =
        isMultiple(
            question
        );


    const correctAnswers =
        multiple

            ? (
                Array.isArray(
                    correctAnswer
                )
                    ? correctAnswer
                    : []
            )

            : [
                correctAnswer
            ];


    const userAnswers =
        multiple

            ? (
                Array.isArray(
                    userAnswer
                )
                    ? userAnswer
                    : []
            )

            : (
                userAnswer ===
                    undefined ||
                userAnswer ===
                    null

                    ? []

                    : [
                        userAnswer
                    ]
            );


    /*
    ------------------------------------------------------------
    HIGHLIGHT ANSWERS
    ------------------------------------------------------------
    */

    document
        .querySelectorAll(
            "#answerOptions .answer-option"
        )
        .forEach(
            (
                button,
                index
            ) => {

                const correct =
                    correctAnswers.includes(
                        index
                    );

                const selected =
                    userAnswers.includes(
                        index
                    );


                button.classList.remove(
                    "correct-answer",
                    "incorrect-answer"
                );


                if(correct){

                    button.classList.add(
                        "correct-answer"
                    );

                }


                if(
                    selected &&
                    !correct
                ){

                    button.classList.add(
                        "incorrect-answer"
                    );

                }


                button.disabled =
                    true;

            }
        );


    /*
    ------------------------------------------------------------
    DETERMINE IF CORRECT
    ------------------------------------------------------------
    */

    let isCorrect =
        false;


    if(multiple){

        const a =
            [
                ...userAnswers
            ].sort(
                (
                    x,
                    y
                ) =>
                    x - y
            );


        const b =
            [
                ...correctAnswers
            ].sort(
                (
                    x,
                    y
                ) =>
                    x - y
            );


        isCorrect =
            a.length ===
                b.length &&

            a.every(
                (
                    value,
                    index
                ) =>
                    value ===
                    b[index]
            );

    }
    else{

        isCorrect =
            userAnswer ===
            correctAnswer;

    }


    /*
    ------------------------------------------------------------
    FEEDBACK
    ------------------------------------------------------------
    */

    feedback(
        isCorrect,
        isCorrect

            ? "✓ CORRECT"

            : "✗ INCORRECT — CORRECT ANSWER HIGHLIGHTED"
    );


    assessmentAnswerRevealed =
        true;

}


/* ============================================================
   NEXT / SUBMIT / RETRY / COMPLETE
   ============================================================ */

function handleAssessmentNext(){

    const mode =
        assessmentNext?.dataset.mode;


    /*
    ------------------------------------------------------------
    COMPLETE MODULE
    ------------------------------------------------------------
    */

    if(
        mode ===
        "complete"
    ){

        completeModuleAfterAssessment();

        return;

    }


    /*
    ------------------------------------------------------------
    RETRY
    ------------------------------------------------------------
    */

    if(
        mode ===
        "retry"
    ){

        startAssessment(
            assessmentModule
        );

        return;

    }


    /*
    ------------------------------------------------------------
    ONLY QUESTION MODE CONTINUES
    ------------------------------------------------------------
    */

    if(
        mode !==
        "question"
    ){

        return;

    }


    const assessment =
        assessments[
            assessmentModule
        ];

    if(!assessment){

        return;

    }


    const question =
        assessment.questions[
            assessmentQuestion
        ];

    const userAnswer =
        assessmentAnswers[
            assessmentQuestion
        ];


    /*
    ------------------------------------------------------------
    DRAG/DROP VALIDATION
    ------------------------------------------------------------
    */

    if(
        isDragDrop(
            question
        )
    ){

        const complete =
            Array.isArray(
                userAnswer
            ) &&

            userAnswer.length ===
                question.items.length &&

            userAnswer.every(
                value =>
                    value !==
                        null &&
                    value !==
                        undefined
            );


        if(!complete){

            alert(
                "Please complete all matches before continuing."
            );

            return;

        }

    }

    /*
------------------------------------------------------------
YES / NO MATRIX VALIDATION
------------------------------------------------------------
*/

else if(
    isYesNoMatrix(
        question
    )
){

    const complete =
        Array.isArray(
            userAnswer
        ) &&

        userAnswer.length ===
            question.rows.length &&

        userAnswer.every(
            value =>
                value !== null &&
                value !== undefined
        );


    if(!complete){

        alert(
            "Please answer YES or NO for every statement."
        );

        return;

    }

}

/* ------------------------------------------------------------
DROPDOWN VALIDATION
------------------------------------------------------------ */

else if(
    isDropdown(
        question
    )
){

    const complete =
        Array.isArray(
            userAnswer
        ) &&

        userAnswer.length ===
            question.items.length &&

        userAnswer.every(
            value =>
                value !== null &&
                value !== undefined &&
                value !== ""
        );

    if(!complete){

        alert(
            "Please select an answer for every question."
        );

        return;

    }

}

    /*
    ------------------------------------------------------------
    MULTIPLE ANSWER VALIDATION
    ------------------------------------------------------------
    */

    else if(
        isMultiple(
            question
        )
    ){

        if(
            !Array.isArray(
                userAnswer
            ) ||
            userAnswer.length ===
                0
        ){

            alert(
                "Please select at least one answer."
            );

            return;

        }

    }


    /*
    ------------------------------------------------------------
    SINGLE ANSWER VALIDATION
    ------------------------------------------------------------
    */

    else{

        if(
            userAnswer ===
                undefined ||
            userAnswer ===
                null
        ){

            alert(
                "Please select an answer first."
            );

            return;

        }

    }


    /*
    ------------------------------------------------------------
    SHOW ANSWER FIRST
    ------------------------------------------------------------
    */

    if(
        !assessmentAnswerRevealed
    ){

        revealCurrentAnswer();

        return;

    }


    /*
    ------------------------------------------------------------
    LAST QUESTION
    ------------------------------------------------------------
    */

    if(
        assessmentQuestion ===
        assessment.questions.length - 1
    ){

        submitAssessment();

        return;

    }


    /*
    ------------------------------------------------------------
    NEXT QUESTION
    ------------------------------------------------------------
    */

    assessmentQuestion++;

    renderAssessmentQuestion();

}


/* ============================================================
   SUBMIT ASSESSMENT
   ============================================================ */

async function submitAssessment(){

    const assessment =
        assessments[
            assessmentModule
        ];

    const module =
        getModule(
            assessmentModule
        );


        if(
        !assessment ||
        !module
    ){

        return;

    }


   /* ============================================================
   CHECK SUPABASE SESSION
   ============================================================ */

const {
    data: {
        session
    }
} =
    await window.supabaseClient.auth.getSession();


    let correct =
        0;


    assessment.questions.forEach(
        (
            question,
            index
        ) => {

            const userAnswer =
                assessmentAnswers[
                    index
                ];

            const correctAnswer =
                question.answer;


            /*
            ----------------------------------------------------
            DRAG / DROP
            ----------------------------------------------------
            */

            if(
                isDragDrop(
                    question
                )
            ){

                if(
                    Array.isArray(
                        userAnswer
                    ) &&

                    Array.isArray(
                        correctAnswer
                    ) &&

                    userAnswer.length ===
                        correctAnswer.length &&

                    userAnswer.every(
                        (
                            value,
                            answerIndex
                        ) =>
                            value ===
                            correctAnswer[
                                answerIndex
                            ]
                    )
                ){

                    correct++;

                }

                return;

            }


            /*
----------------------------------------------------
YES / NO MATRIX
----------------------------------------------------
*/

if(
    isYesNoMatrix(
        question
    )
){

    const userAnswers =
        Array.isArray(
            userAnswer
        )
            ? userAnswer
            : [];


    const rows =
        Array.isArray(
            question.rows
        )
            ? question.rows
            : [];


    const allCorrect =
        userAnswers.length ===
            rows.length &&

        rows.every(
            (
                row,
                rowIndex
            ) =>
                userAnswers[
                    rowIndex
                ] ===
                row.answer
        );


    if(allCorrect){

        correct++;

    }


    return;

}


/* ------------------------------------------------------------
DROPDOWN SCORING
------------------------------------------------------------ */

else if(
    isDropdown(
        question
    )
){

    const userAnswers =
        Array.isArray(
            userAnswer
        )
            ? userAnswer
            : [];

    const correctAnswers =
        Array.isArray(
            question.items
        )
            ? question.items.map(
                item =>
                    Number(
                        item.answer
                    )
            )
            : [];

    const allCorrect =
        userAnswers.length ===
            correctAnswers.length &&

        userAnswers.every(
            (
                answer,
                index
            ) =>
                Number(answer) ===
                correctAnswers[index]
        );

    if(
        allCorrect
    ){

        correct++;

    }

}

            /*
            ----------------------------------------------------
            MULTIPLE ANSWER
            ----------------------------------------------------
            */

            if(
                isMultiple(
                    question
                )
            ){

                if(
                    Array.isArray(
                        userAnswer
                    ) &&
                    Array.isArray(
                        correctAnswer
                    )
                ){

                    const a =
                        [
                            ...userAnswer
                        ].sort(
                            (
                                x,
                                y
                            ) =>
                                x - y
                        );


                    const b =
                        [
                            ...correctAnswer
                        ].sort(
                            (
                                x,
                                y
                            ) =>
                                x - y
                        );


                    if(
                        a.length ===
                            b.length &&

                        a.every(
                            (
                                value,
                                answerIndex
                            ) =>
                                value ===
                                b[
                                    answerIndex
                                ]
                        )
                    ){

                        correct++;

                    }

                }

                return;

            }


            /*
            ----------------------------------------------------
            SINGLE ANSWER
            ----------------------------------------------------
            */

            if(
                userAnswer ===
                correctAnswer
            ){

                correct++;

            }

        }
    );


    /*
    ------------------------------------------------------------
    SCORE
    ------------------------------------------------------------
    */

    const total =
        assessment.questions.length;


    const score =
        total
            ? Math.round(
                (
                    correct /
                    total
                ) *
                100
            )
            : 0;

    assessmentScore =
    score;


    const passScore =
        Number(
            assessment.passScore ??
            80
        );


    const passed =
        score >=
        passScore;


    assessmentResult =
    passed;



/* ============================================================
   CREATE ASSESSMENT RECORD
   ============================================================ */

const assessmentRecord = {

    moduleId:
        assessmentModule,

    score:
        score,

    passed:
        passed,

    completedAt:
        new Date().toISOString()

};

/* ============================================================
   SAVE ASSESSMENT RESULT TO SUPABASE
   ============================================================ */

if (
    passed &&
    session &&
    session.user &&
    window.supabaseClient
) {

    const {
        error: progressSaveError
    } =
        await window.supabaseClient
            .from("user_progress")
            .upsert(
                {
                    user_id:
                        session.user.id,

                    module_id:
                        assessmentModule,

                    completed:
                        true,

                    score:
                        score,

                    completed_at:
                        new Date().toISOString(),

                    updated_at:
                        new Date().toISOString()
                },
                {
                    onConflict:
                        "user_id,module_id"
                }
            );


    if(
        progressSaveError
    ){

        console.error(
            "SUPABASE PROGRESS SAVE ERROR:",
            progressSaveError
        );

    }
    else{

        console.log(
            "PASSED ASSESSMENT SAVED TO SUPABASE:",
            {
                user_id:
                    session.user.id,

                module_id:
                    assessmentModule,

                score:
                    score,

                completed:
                    true
            }
        );

    }

}
else if(
    !passed
){

    console.log(
        "ASSESSMENT FAILED - NOT SAVED TO SUPABASE:",
        {
            module_id:
                assessmentModule,

            score:
                score
        }
    );

}


/* ============================================================
   UPDATE SKILL TREE STATE
   ============================================================ */

if(
    passed &&
    typeof state !== "undefined" &&
    state
){

    state[
        assessmentModule
    ] = true;

    localStorage.setItem(
        "aiSkillTreeState",
        JSON.stringify(
            state
        )
    );

    if(
        typeof draw === "function"
    ){

        draw();

    }

}

/* ------------------------------------------------------------
   ADD TO HISTORY
   ------------------------------------------------------------ */

assessmentHistory.push(
    assessmentRecord
);


/* ------------------------------------------------------------
   SAVE TO LOCAL STORAGE
   ------------------------------------------------------------ */

localStorage.setItem(
    "aiSkillTreeAssessmentHistory",
    JSON.stringify(
        assessmentHistory
    )
);


console.log(
    "Assessment saved:",
    assessmentRecord
);
    

    console.log(
        "Assessment result:",
        {
            module:
                assessmentModule,

            correct:
                correct,

            total:
                total,

            score:
                score,

            passScore:
                passScore,

            passed:
                passed
        }
    );


    /*
    ============================================================
    PASSED
    ============================================================
    */

    if(passed){

        assessmentBody.innerHTML = `

            <div
                class="assessment-result">

                <div
                    style="font-size:50px">

                    🎉

                </div>


                <div
                    class="assessment-score">

                    ${score}%

                </div>


                <h2>
                    Assessment Passed
                </h2>


                <div
                    class="assessment-message">

                    You passed the
                    <strong>
                        ${
                            escapeHtml(
                                module.name ||
                                assessmentModule
                            )
                        }
                    </strong>
                    assessment.

                    <br><br>

                    Module completed successfully.

                    <br><br>

                    The next skill is now unlocked.

                </div>


                <div
                    class="assessment-result-actions">

                    <button
                        type="button"
                        class="secondary-action"
                        id="retakeAssessment">

                        ↻ RETAKE ASSESSMENT

                    </button>

                </div>

            </div>

        `;


        assessmentNext.dataset.mode =
            "complete";


        assessmentNext.textContent =
            "COMPLETE MODULE";


        const retake =
            el(
                "retakeAssessment"
            );


        if(retake){

            retake.addEventListener(
                "click",
                () => {

                    startAssessment(
                        assessmentModule
                    );

                }
            );

        }

    }


    /*
    ============================================================ = 
    FAILED
    ============================================================
    */

    else{

        assessmentBody.innerHTML = `

            <div
                class="assessment-result assessment-failed">

                <div
                    style="font-size:50px">

                    📚

                </div>


                <div
                    class="assessment-score">

                    ${score}%

                </div>


                <h2>
                    Assessment Not Passed
                </h2>


                <div
                    class="assessment-message">

                    You need at least
                    ${passScore}%
                    to complete this module.

                    <br><br>

                    Review Microsoft Learn
                    and try again.

                </div>

            </div>

        `;


        assessmentNext.dataset.mode =
            "retry";


        assessmentNext.textContent =
            "TRY AGAIN";

    }

}


/* ============================================================
   COMPLETE MODULE
   ============================================================ */

async function completeModuleAfterAssessment(){

    if(
        !assessmentModule
    ){

        return;

    }


    if(
        assessmentResult !==
        true
    ){

        return;

    }


    const completedModule =
        assessmentModule;


    const scoreToSave =
    assessmentScore;


    /*
    ------------------------------------------------------------
    SAVE PROGRESS TO SUPABASE
    ------------------------------------------------------------
    */

    try{

        if(
            window.supabaseClient
        ){

            const {
                data: {
                    user
                },
                error: sessionError
            } =
                await window.supabaseClient.auth.getUser();


            if(sessionError){

                console.warn(
                    "Unable to get current user:",
                    sessionError
                );

            }
            else if(
                user
            ){

                const {
                    error: progressError
                } =
                    await window.supabaseClient
                        .from(
                            "user_progress"
                        )
                        .upsert(
                            {
                                user_id:
                                    user.id,

                                module_id:
                                    completedModule,

                                completed:
                                    true,

                                score: scoreToSave,

                                completed_at:
                                    new Date().toISOString(),

                                updated_at:
                                    new Date().toISOString()
                            },
                            {
                                onConflict:
                                    "user_id,module_id"
                            }
                        );


                if(progressError){

                    console.error(
                        "Unable to save progress:",
                        progressError
                    );

                }
                else{

                    console.log(
                        "PROGRESS SAVED:",
                        completedModule,
                        assessmentScore
                    );

                }

            }
            else{

                console.warn(
                    "No signed-in user. Progress was not saved."
                );

            }

        }
        else{

            console.warn(
                "Supabase client is not available."
            );

        }

    }
    catch(error){

        console.error(
            "Unexpected error saving progress:",
            error
        );

    }


    /*
    ------------------------------------------------------------
    UPDATE STATE
    ------------------------------------------------------------
    */

    try{

        if(
            typeof state !==
                "undefined" &&
            state
        ){

            state[
                completedModule
            ] =
                true;

        }

    }
    catch(error){

        console.warn(
            "Unable to update state:",
            error
        );

    }


    /*
    ------------------------------------------------------------
    CLOSE POPUP
    ------------------------------------------------------------
    */

    if(
        assessmentOverlay
    ){

        assessmentOverlay.classList.remove(
            "open"
        );

    }


    /*
    ------------------------------------------------------------
    UPDATE SELECTED MODULE
    ------------------------------------------------------------
    */

    try{

        if(
            typeof selected !==
            "undefined"
        ){

            selected =
                completedModule;

        }

    }
    catch(error){

        console.warn(
            "Unable to update selected:",
            error
        );

    }


    /*
    ------------------------------------------------------------
    RESET ASSESSMENT STATE
    ------------------------------------------------------------
    */

    assessmentModule =
        null;

    assessmentQuestion =
        0;

    assessmentAnswers =
        [];

    assessmentResult =
        null;

    assessmentAnswerRevealed =
        false;


    /*
    ------------------------------------------------------------
    REDRAW SKILL TREE
    ------------------------------------------------------------
    */

    try{

        if(
            typeof draw ===
                "function"
        ){

            draw();

        }

    }
    catch(error){

        console.warn(
            "Unable to redraw:",
            error
        );

    }

}


/* ============================================================
   QUIT CONFIRMATION
   ============================================================ */

function showQuitConfirmation(){

    const existing =
        el(
            "quitConfirmation"
        );


    if(existing){

        existing.remove();

    }


    const messages = [

        [
            "Quitting already? 😏",
            "You're only getting started. Give it a shot and see how far you can go!"
        ],

        [
            "Wait... you're giving up already? 👀",
            "Your next skill is waiting for you. Keep going and prove what you know!"
        ],

        [
            "Don't leave yet! 🚀",
            "You've already started. Finish the assessment and see if you can unlock the skill!"
        ]

    ];


    const selectedMessage =
        messages[
            Math.floor(
                Math.random() *
                messages.length
            )
        ];


    const modal =
        document.createElement(
            "div"
        );


    modal.id =
        "quitConfirmation";

    modal.className =
        "quit-confirmation";


    modal.innerHTML = `

        <div
            class="quit-confirmation-card">

            <div
                class="quit-icon">

                ⚠️

            </div>


            <h2>

                ${
                    escapeHtml(
                        selectedMessage[0]
                    )
                }

            </h2>


            <p>

                ${
                    escapeHtml(
                        selectedMessage[1]
                    )
                }

            </p>


            <div
                class="quit-actions">

                <button
                    type="button"
                    class="secondary-action"
                    id="quitAssessment">

                    YES, QUIT

                </button>


                <button
                    type="button"
                    class="btn primary"
                    id="continueAssessment">

                    KEEP GOING

                </button>

            </div>

        </div>

    `;


    document.body.appendChild(
        modal
    );


    /*
    ------------------------------------------------------------
    KEEP GOING
    ------------------------------------------------------------
    */

    const keepGoing =
        el(
            "continueAssessment"
        );


    if(keepGoing){

        keepGoing.addEventListener(
            "click",
            () => {

                modal.remove();

            }
        );

    }


    /*
    ------------------------------------------------------------
    YES, QUIT
    ------------------------------------------------------------
    */

    const quit =
        el(
            "quitAssessment"
        );


    if(quit){

        quit.addEventListener(
            "click",
            () => {

                modal.remove();


                if(
                    assessmentOverlay
                ){

                    assessmentOverlay.classList.remove(
                        "open"
                    );

                }


                assessmentModule =
                    null;

                assessmentQuestion =
                    0;

                assessmentAnswers =
                    [];

                assessmentResult =
                    null;

                assessmentAnswerRevealed =
                    false;

            }
        );

    }

}


/* ============================================================
   INITIALIZATION
   ============================================================ */

function initializeAssessmentEngine(){

    if(
        assessmentInitialized
    ){

        return;

    }


    assessmentInitialized =
        true;


    /*
    ------------------------------------------------------------
    CACHE ELEMENTS
    ------------------------------------------------------------
    */

    cacheAssessmentElements();


    /*
    ------------------------------------------------------------
    INSTALL THEME
    ------------------------------------------------------------
    */

    installAssessmentTheme();


    /*
    ------------------------------------------------------------
    CHECK HTML
    ------------------------------------------------------------
    */

    if(!assessmentOverlay){

        console.error(
            "ERROR: #assessmentOverlay was not found."
        );

    }

    if(!assessmentBody){

        console.error(
            "ERROR: #assessmentBody was not found."
        );

    }

    if(!assessmentNext){

        console.error(
            "ERROR: #assessmentNext was not found."
        );

    }

    if(!assessmentCancel){

        console.error(
            "ERROR: #assessmentCancel was not found."
        );

    }


    /*
    ------------------------------------------------------------
    NEXT BUTTON
    ------------------------------------------------------------
    */

    if(
        assessmentNext
    ){

        assessmentNext.addEventListener(
            "click",
            handleAssessmentNext
        );

    }


    /*
    ------------------------------------------------------------
    CANCEL BUTTON
    ------------------------------------------------------------
    */

    if(
        assessmentCancel
    ){

        assessmentCancel.addEventListener(
            "click",
            showQuitConfirmation
        );

    }


    /*
    ------------------------------------------------------------
    LOAD JSON
    ------------------------------------------------------------
    */

    loadAssessments();

}


/* ============================================================
   DOM READY
   ============================================================ */

if(
    document.readyState ===
    "loading"
){

    document.addEventListener(
        "DOMContentLoaded",
        initializeAssessmentEngine,
        {
            once:
                true
        }
    );

}
else{

    initializeAssessmentEngine();

}