    /* ============================================================
    MICROSOFT AI SKILL TREE
    APP ENGINE
    ============================================================ */


    /* ============================================================
    MODULE DATA
    ============================================================ */

    let nodes = [];
    let byId = {};
    let state = {};


    /* ============================================================
    APPLICATION STATE
    ============================================================ */

    let selected = 'ai101';
    let filter = 'all';


    /*
    ============================================================
    DEVELOPMENT MODE
    ============================================================

    true  = ALL modules are available for testing
    false = Normal prerequisite system

    IMPORTANT:
    Set this to false before production.
    ============================================================
    */

    const DEV_MODE = false;


    let anim = 0;
    let raf;


    /* ============================================================
    DOM ELEMENTS
    ============================================================ */

    const canvas =
        document.getElementById('canvas');

    const svg =
        document.getElementById('svg');

    const details =
        document.getElementById('details');

    const vp =
        document.getElementById('viewport');


    /* ============================================================
    LOAD MODULES
    ============================================================ */

    async function loadModules(){

        try {

            const modulesResponse =
                await fetch('./data/modules.json');


            if(!modulesResponse.ok){

                throw new Error(
                    `Unable to load modules.json. HTTP status: ${modulesResponse.status}`
                );

            }


            const moduleData =
                await modulesResponse.json();


            if(!Array.isArray(moduleData)){

                throw new Error(
                    'modules.json must contain an array.'
                );

            }


            /*
            --------------------------------------------------------
            Store module data
            --------------------------------------------------------
            */

            nodes =
                moduleData;


            /*
            --------------------------------------------------------
            Create quick module lookup
            --------------------------------------------------------
            */

            byId =
                Object.fromEntries(
                    nodes.map(n => [n.id, n])
                );


            /*
            --------------------------------------------------------
            Initialize completion state
            --------------------------------------------------------
            */

            state =
                Object.fromEntries(
                    nodes.map(n => [n.id, false])
                );


            console.log(
                'Modules loaded:',
                nodes
            );


                    /*
            --------------------------------------------------------
            Skill Tree will be drawn
            after saved user progress is restored.
            --------------------------------------------------------
            */


            /*
            --------------------------------------------------------
            Start animation
            --------------------------------------------------------
            */

            animate();


        } catch(error) {

            console.error(
                'Module loading error:',
                error
            );

        }

    }


    /* ============================================================
    MODULE STATUS
    ============================================================ */

    function unlocked(n){

        /*
        ------------------------------------------------------------
        DEVELOPMENT MODE
        ------------------------------------------------------------

        When DEV_MODE is true, every module is considered
        available regardless of prerequisites.

        This allows you to test every assessment without
        completing the previous modules first.
        ------------------------------------------------------------
        */

        if(DEV_MODE){

            return true;

        }


        /*
        ------------------------------------------------------------
        NORMAL MODE
        ------------------------------------------------------------

        When DEV_MODE is false, the original prerequisite
        system is restored.

        A module is unlocked only when ALL prerequisites
        have been completed.
        ------------------------------------------------------------
        */

        return n.pre.every(
            id => state[id]
        );

    }


    /* ============================================================
    GET MODULE STATUS
    ============================================================ */

    function status(n){

        /*
        ------------------------------------------------------------
        Completed always takes priority.
        ------------------------------------------------------------
        */

        if(state[n.id]){

            return 'completed';

        }


        /*
        ------------------------------------------------------------
        Check whether module is available.
        ------------------------------------------------------------
        */

        if(unlocked(n)){

            return 'available';

        }


        /*
        ------------------------------------------------------------
        Otherwise module is locked.
        ------------------------------------------------------------
        */

        return 'locked';

    }


    /* ============================================================
    DRAW SKILL TREE
    ============================================================ */

    function draw(){

        /*
        ------------------------------------------------------------
        Remove existing nodes
        ------------------------------------------------------------
        */

        canvas
            .querySelectorAll('.node')
            .forEach(
                e => e.remove()
            );


        /*
        ------------------------------------------------------------
        Clear prerequisite lines
        ------------------------------------------------------------
        */

        svg.innerHTML = '';


        /* ========================================================
        DRAW PREREQUISITE CONNECTIONS
        ======================================================== */

        nodes.forEach(n => {

            n.pre.forEach(pid => {

                const parent =
                    byId[pid];


                /*
                ----------------------------------------------------
                Safety check
                ----------------------------------------------------

                Prevent an invalid prerequisite from breaking
                the entire skill tree.
                ----------------------------------------------------
                */

                if(!parent){

                    console.warn(
                        `Prerequisite module "${pid}" was not found for "${n.id}".`
                    );

                    return;

                }


                const line =
                    document.createElementNS(
                        'http://www.w3.org/2000/svg',
                        'line'
                    );


                line.setAttribute(
                    'x1',
                    parent.x
                );

                line.setAttribute(
                    'y1',
                    parent.y
                );

                line.setAttribute(
                    'x2',
                    n.x
                );

                line.setAttribute(
                    'y2',
                    n.y
                );


                line.classList.add(
                    'link'
                );


                /*
                ----------------------------------------------------
                Completed connection
                ----------------------------------------------------
                */

                if(
                    state[pid] &&
                    unlocked(n)
                ){

                    line.classList.add(
                        'done'
                    );

                }


                /*
                ----------------------------------------------------
                Available connection
                ----------------------------------------------------
                */

                else if(
                    unlocked(n)
                ){

                    line.classList.add(
                        'available'
                    );

                }


                svg.appendChild(line);

            });

        });


        /* ========================================================
        DRAW MODULE NODES
        ======================================================== */

        nodes.forEach(n => {

            const s =
                status(n);


            const button =
                document.createElement(
                    'button'
                );


            /*
            --------------------------------------------------------
            Node classes
            --------------------------------------------------------
            */

            button.className =
                `node ${n.cat} ${s}${
                    selected === n.id
                        ? ' selected'
                        : ''
                }`;


            /*
            --------------------------------------------------------
            Node position
            --------------------------------------------------------
            */

            button.style.left =
                n.x + 'px';

            button.style.top =
                n.y + 'px';


            /*
            --------------------------------------------------------
            Node content
            --------------------------------------------------------
            */

        button.innerHTML = `

        ${
            n.code?.toLowerCase() === 'applied skill' &&
            s === 'completed'
                ? `
                    <img
                        src="./assets/applied-skill.svg"
                        class="applied-skill-logo"
                        alt="Microsoft Applied Skill"
                    >
                `
                : ''
        }

        ${
            n.code?.toLowerCase() === 'certification' &&
            n.logo &&
            s === 'completed'
                ? `
                    <img
                        src="${n.logo}"
                        class="certification-logo"
                        alt="${n.name}"
                    >
                `
                : ''
        }

        <div class="code ${
            n.code?.toLowerCase() === 'applied skill'
                ? 'applied-skill'
                : n.code?.toLowerCase() === 'certification'
                    ? 'certification'
                    : ''
        }">
            ${n.code}${s === 'completed' ? ' ✓' : ''}
        </div>

        <div class="name">
            ${n.name}
        </div>

        <div class="state">
            ${
                s === 'locked'
                    ? '🔒 LOCKED'
                    : s === 'completed'
                        ? 'COMPLETED'
                        : 'AVAILABLE'
            }
        </div>

    `;


            /*
            --------------------------------------------------------
            Select module
            --------------------------------------------------------
            */

            button.addEventListener(
                'click',
                () => select(n.id)
            );


            /*
            --------------------------------------------------------
            Apply category filter
            --------------------------------------------------------
            */

            button.style.opacity =
                filter === 'all' ||
                n.cat === filter
                    ? '1'
                    : '.18';


            canvas.appendChild(
                button
            );

        });


        /*
        ------------------------------------------------------------
        Update header statistics
        ------------------------------------------------------------
        */

        updateStats();


        /*
        ------------------------------------------------------------
        Update right-side details
        ------------------------------------------------------------
        */

        showDetails(
            byId[selected]
        );

    }


    /* ============================================================
    SELECT MODULE
    ============================================================ */

    function select(id){

        selected =
            id;

        draw();

    }


    /* ============================================================
    SHOW MODULE DETAILS
    ============================================================ */

    function showDetails(n){

        if(!n) return;


        const s =
            status(n);


        details.innerHTML = `

            <div class="code">
                <span class="${
        n.code?.toLowerCase() === 'applied skill'
            ? 'applied-skill'
            : n.code?.toLowerCase() === 'certification'
                ? 'certification'
                : ''
    }">
        ${n.code}
    </span>
            </div>

            <h2>
                ${n.name}
            </h2>

            <p>
                ${n.desc}
            </p>


            <div class="section">

                <strong>
                    STATUS
                </strong>

                <div class="tag">
                    ${s.toUpperCase()}
                </div>

            </div>


            <div class="section">

                <strong>
                    PREREQUISITES
                </strong>

                <p>

                    ${
                        n.pre.length

                            ? n.pre
                                .map(
                                    id =>
                                        (
                                            state[id]
                                                ? '✓ '
                                                : '🔒 '
                                        ) +
                                        byId[id].code +
                                        ' — ' +
                                        byId[id].name
                                )
                                .join('<br>')

                            : 'None — starting point'
                    }

                </p>

            </div>


            <div class="section">

                <strong>
                    SKILLS
                </strong>

                <div>

                    ${
                        n.skills
                            .map(
                                x =>
                                    `<span class="tag">${x}</span>`
                            )
                            .join('')
                    }

                </div>

            </div>


            <div class="section">

                <strong>
                    REWARD
                </strong>

                <p>
                    ${n.xp} XP
                </p>

            </div>


            <button
                class="btn primary"
                id="learn"
                ${s === 'locked' ? 'disabled' : ''}
            >

                ${
                    s === 'locked'
                        ? 'LOCKED — COMPLETE PREREQUISITES'
                        : 'OPEN MICROSOFT LEARN ↗'
                }

            </button>


            <div class="section">

                <strong>
                    LEARNING WORKFLOW
                </strong>

                <p>

                    1. Open the Microsoft Learn resource.<br>

                    2. Sign in with the Microsoft account
                    you use for Learn.<br>

                    3. Complete the module/path and
                    its knowledge checks.<br>

                    4. Return here and mark this skill complete.

                </p>

            </div>


            ${
        n.code?.toLowerCase() === 'applied skill'
            ? s === 'completed'
                ? `
                    <div class="proof-completed">

                        ✓ PROOF OF COMPLETION UPLOADED

                    </div>
                `

                : `
                    <button
                        class="btn primary"
                        id="uploadProof"
                        ${s === 'locked' ? 'disabled' : ''}
                    >
                        ${
                            s === 'locked'
                                ? '🔒 LOCKED'
                                : '📷 UPLOAD PROOF OF COMPLETION'
                        }
                    </button>

                    <input
                        type="file"
                        id="credentialProof"
                        accept="image/*"
                        style="display:none;"
                    >

                    <div
                        id="proofStatus"
                        class="screenshot-status"
                    >
                        No proof uploaded.
                    </div>
                `

            : n.code?.toLowerCase() === 'certification'
        ? `
            <button
                class="btn primary"
                id="assessment"
                ${s === 'locked' ? 'disabled' : ''}
            >
                ${
                    s === 'locked'
                        ? '🔒 LOCKED'
                        : '📝 TAKE PRACTICE EXAM'
                }
            </button>

            ${
                s === 'completed'
                    ? `
                        <div class="proof-completed">
                            ✓ CERTIFICATION PROOF UPLOADED
                        </div>
                    `
                    : `
                        <button
                            class="btn primary"
                            id="uploadCertificationProof"
                            ${s === 'locked' ? 'disabled' : ''}
                        >
                            ${
                                s === 'locked'
                                    ? '🔒 LOCKED'
                                    : '📷 UPLOAD CERTIFICATION PROOF'
                            }
                        </button>

                        <input
                            type="file"
                            id="certificationProof"
                            accept="image/*"
                            style="display:none;"
                        >

                        <div
                            id="certificationProofStatus"
                            class="screenshot-status"
                        >
                            No certification proof uploaded.
                        </div>
                    `
            }
        `

                : `
                    <button
                        class="btn primary"
                        id="assessment"
                        ${s === 'locked' ? 'disabled' : ''}
                    >
                        ${
                            s === 'locked'
                                ? '🔒 LOCKED'
                                : '📝 TAKE ASSESSMENT'
                        }
                    </button>
                `
    }


            <div class="section">

                <strong>
                    LEARNING PROGRESS
                </strong>

                <div class="progress">

                    <i
                        style="width:${
                            state[n.id]
                                ? '100'
                                : '0'
                        }%"
                    ></i>

                </div>

            </div>

        `;


        /* ========================================================
        MICROSOFT LEARN BUTTON
        ======================================================== */

        const learnBtn =
            details.querySelector(
                '#learn'
            );


        if(
            learnBtn &&
            s !== 'locked'
        ){

            learnBtn.addEventListener(
                'click',
                () =>
                    window.open(
                        n.learn,
                        '_blank',
                        'noopener,noreferrer'
                    )
            );

        }


        /* ========================================================
        ASSESSMENT BUTTON
        ======================================================== */

        /* ========================================================
    ASSESSMENT / PROOF BUTTON
    ======================================================== */

    const assessmentButton =
        details.querySelector(
            '#assessment'
        );


    if(
        assessmentButton &&
        s !== 'locked'
    ){

        assessmentButton.addEventListener(
            'click',
            () => {

                console.log(
                    'Starting assessment for module:',
                    n.id
                );

                startAssessment(
                    n.id
                );

            }
        );

    }


    /* ========================================================
    APPLIED SKILL PROOF UPLOAD
    ======================================================== */

    const uploadProofButton =
        details.querySelector(
            '#uploadProof'
        );


    const credentialProof =
        details.querySelector(
            '#credentialProof'
        );


    if(
        uploadProofButton &&
        credentialProof &&
        s !== 'locked'
    ){

        uploadProofButton.addEventListener(
            'click',
            () => {

                credentialProof.click();

            }
        );


        credentialProof.addEventListener(
            'change',
            event => {

                const file =
                    event.target.files[0];


                if(!file){

                    return;

                }


                if(
                    !file.type.startsWith(
                        'image/'
                    )
                ){

                    alert(
                        'Please upload an image showing your proof of completion.'
                    );

                    credentialProof.value = '';

                    return;

                }


                const proofStatus =
                    details.querySelector(
                        '#proofStatus'
                    );


                if(proofStatus){

                    proofStatus.textContent =
                        '✓ Proof uploaded: ' +
                        file.name;

                    proofStatus.classList.add(
                        'uploaded'
                    );

                }


                state[n.id] = true;

                draw();

            }
        );

    }

    /* ========================================================
    CERTIFICATION PROOF UPLOAD
    ======================================================== */

    const uploadCertificationProofButton =
        details.querySelector(
            '#uploadCertificationProof'
        );

    const certificationProof =
        details.querySelector(
            '#certificationProof'
        );

    if(
        uploadCertificationProofButton &&
        certificationProof &&
        s !== 'locked'
    ){

        uploadCertificationProofButton.addEventListener(
            'click',
            () => {

                certificationProof.click();

            }
        );


        certificationProof.addEventListener(
            'change',
            event => {

                const file =
                    event.target.files[0];


                if(!file){

                    return;

                }


                if(
                    !file.type.startsWith(
                        'image/'
                    )
                ){

                    alert(
                        'Please upload an image showing your Microsoft certification proof.'
                    );

                    certificationProof.value = '';

                    return;

                }


                /*
                * Certification proof has been uploaded.
                *
                * The uploaded proof is what marks
                * the certification as completed.
                */

                state[n.id] = true;


                draw();

            }
        );

    }

    }




    /* ============================================================
    UPDATE STATISTICS
    ============================================================ */

    function updateStats(){

        const completed =
            nodes.filter(
                n => state[n.id]
            ).length;


        const xp =
            nodes
                .filter(
                    n => state[n.id]
                )
                .reduce(
                    (total,n) =>
                        total + n.xp,
                    0
                );


        const percentage =
            nodes.length
                ? Math.round(
                    completed /
                    nodes.length *
                    100
                )
                : 0;


        document.getElementById(
            'done'
        ).textContent =
            completed;


        document.getElementById(
            'xp'
        ).textContent =
            xp;


        document.getElementById(
            'pct'
        ).textContent =
            percentage + '%';

    }


    /* ============================================================
    CATEGORY FILTERS
    ============================================================ */

    document
        .querySelectorAll(
            '[data-filter]'
        )
        .forEach(button => {

            button.addEventListener(
                'click',
                () => {

                    filter =
                        button.dataset.filter;


                    document
                        .querySelectorAll(
                            '[data-filter]'
                        )
                        .forEach(
                            item =>
                                item.classList.toggle(
                                    'active',
                                    item === button
                                )
                        );


                    draw();

                }
            );

        });


    /* ============================================================
    MICROSOFT LEARN PROFILE
    ============================================================ */

    document
        .getElementById('profile')
        .addEventListener(
            'click',
            () =>
                window.open(
                    'https://learn.microsoft.com/users/me/achievements',
                    '_blank',
                    'noopener,noreferrer'
                )
        );


    /* ============================================================
    USER PROFILE
    ============================================================ */

    const userProfileButton =
        document.getElementById('userProfile');

    const userProfileOverlay =
        document.getElementById('userProfileOverlay');

    const closeUserProfile =
        document.getElementById('closeUserProfile');

    const signInButton =
    document.getElementById('signInButton');

const signOutButton =
    document.getElementById('signOutButton');


    if (
        userProfileButton &&
        userProfileOverlay
    ) {

        userProfileButton.addEventListener(
        'click',
        () => {

            console.log(
        'Opening User Profile'
    );

    updateUserProfile();


    userProfileOverlay.classList.add(
        'show'
    );

        }
    );

    }


    /* ============================================================
    CLOSE USER PROFILE
    ============================================================ */

    if (closeUserProfile) {

        closeUserProfile.addEventListener(
            'click',
            () => {

                userProfileOverlay.classList.remove(
                    'show'
                );

                const saveProgressEmail =
                    document.getElementById(
                        'saveProgressEmail'
                    );

                if (saveProgressEmail) {

                    saveProgressEmail.style.display =
                        'none';

                }

            }
        );

    }


    /* ============================================================
   SIGN IN
   ============================================================ */

if (signInButton) {

    signInButton.addEventListener(
        'click',
        () => {

            showSaveProgressPopup();

        }
    );

}




    /* ============================================================
    SIGN OUT
    ============================================================ */

    if (signOutButton) {

        signOutButton.addEventListener(
            'click',
            async () => {

                if (!window.supabaseClient) {

                    console.error(
                        'Supabase client is not available.'
                    );

                    return;

                }


                const { error } =
                    await window.supabaseClient.auth.signOut({
                        scope: 'local'
                    });


                if (error) {

                    console.error(
                        'SIGN OUT ERROR:',
                        error
                    );

                    alert(
                        'Unable to sign out: ' +
                        error.message
                    );

                    return;

                }


                console.log(
                    'USER SIGNED OUT'
                );


                /* ====================================================
                UPDATE PROFILE UI
                ==================================================== */

                const profileName =
                    document.getElementById(
                        'profileName'
                    );

                const profileStatus =
    document.getElementById('profileStatus');

const signInButton =
    document.getElementById('signInButton');

const signOutButton =
    document.getElementById('signOutButton');


                if (profileName) {

                    profileName.textContent =
                        'Guest Learner';

                }


                if (profileStatus) {

                    profileStatus.textContent =
                        'Not signed in';

                }


                /* ====================================================
                CLOSE PROFILE WINDOW
                ==================================================== */

                userProfileOverlay.classList.remove(
                    'show'
                );


                console.log(
                    'PROFILE CLOSED AFTER SIGN OUT'
                );

                window.location.reload();

            }
        );

    }
    /* ============================================================
    CLOSE PROFILE WHEN CLICKING OUTSIDE
    ============================================================ */

    if (userProfileOverlay) {

        userProfileOverlay.addEventListener(
            'click',
            (event) => {

                if (
        event.target ===
        userProfileOverlay
    ) {

        userProfileOverlay.classList.remove(
            'show'
        );

        const saveProgressEmail =
            document.getElementById(
                'saveProgressEmail'
            );

        if (saveProgressEmail) {

            saveProgressEmail.style.display =
                'none';

        }

    }

            }
        );

    }


    /* ============================================================
    LOAD SAVED USER PROGRESS FROM SUPABASE
    ============================================================ */

    async function loadSavedUserProgress() {

        if (
            !window.supabaseClient
        ) {

            console.log(
                "Supabase client is not available."
            );

            return;

        }


        /* ============================================================
   RESET LOCAL STATE FOR SIGNED-IN USER
   ============================================================ */

state = {};

        const {
            data: {
                session
            }
        } =
            await window.supabaseClient.auth.getSession();


        if (
            !session ||
            !session.user
        ) {

            console.log(
                "NO USER SESSION - USING LOCAL PROGRESS"
            );

            return;

        }


        const {
            data,
            error
        } =
            await window.supabaseClient
                .from("user_progress")
                .select(
                    "module_id, completed, score"
                )
                .eq(
                    "user_id",
                    session.user.id
                );


        if (error) {

            console.error(
                "FAILED TO LOAD USER PROGRESS:",
                error
            );

            return;

        }


        if (
            !Array.isArray(data)
        ) {

            return;

        }


        data.forEach(
            progress => {

                if (
                    progress.completed &&
                    progress.module_id
                ) {

                    state[
                        progress.module_id
                    ] = true;

                }

            }
        );


        localStorage.setItem(
            "aiSkillTreeState",
            JSON.stringify(state)
        );


        console.log(
            "SAVED USER PROGRESS RESTORED:",
            data
        );

    }

    /* ============================================================
    UPDATE USER PROFILE
    ============================================================ */

    async function updateUserProfile() {

            await updateAuthProfile();


    /* ============================================================
   AUTH STATE CHANGE
   Save guest progress when Magic Link sign-in completes
   ============================================================ */

if (window.supabaseClient) {

    window.supabaseClient.auth.onAuthStateChange(
        (event, session) => {

            if (
                event === 'SIGNED_IN' &&
                session &&
                session.user
            ) {

                console.log(
                    'MAGIC LINK SIGN-IN DETECTED'
                );

                /*
                 * Delay the Supabase work until
                 * the auth event has completed.
                 */
                setTimeout(async () => {

                    try {

                        const localState =
                            JSON.parse(
                                localStorage.getItem(
                                    'aiSkillTreeState'
                                ) || '{}'
                            );

                        const completedModules =
                            Object.keys(localState)
                                .filter(
                                    moduleId =>
                                        localState[moduleId] === true
                                );

                        console.log(
                            'LOCAL COMPLETED MODULES:',
                            completedModules
                        );

                        for (
                            const moduleId
                            of completedModules
                        ) {

                            const { error } =
                                await window.supabaseClient
                                    .from('user_progress')
                                    .upsert(
                                        {
                                            user_id:
                                                session.user.id,

                                            module_id:
                                                moduleId,

                                            completed:
                                                true,

                                            completed_at:
                                                new Date().toISOString(),

                                            updated_at:
                                                new Date().toISOString()
                                        },
                                        {
                                            onConflict:
                                                'user_id,module_id'
                                        }
                                    );

                            if (error) {

                                console.error(
                                    'FAILED TO SAVE MODULE:',
                                    moduleId,
                                    error
                                );

                            }

                        }

                        console.log(
                            'GUEST PROGRESS SAVED:',
                            completedModules
                        );

                    } catch (error) {

                        console.error(
                            'FAILED TO SAVE GUEST PROGRESS:',
                            error
                        );

                    }

                    /*
                     * Reload only after authentication
                     * and progress migration have completed.
                     */
                    window.location.reload();

                }, 0);

            }

        }
    );

}


    /* ============================================================
    SUPABASE AUTH SESSION
    ============================================================ */

    async function updateAuthProfile() {

        if (!window.supabaseClient) {
            console.log('Supabase client not available yet.');
            return;
        }

        const {
            data: {
                session
            }
        } = await window.supabaseClient.auth.getSession();

        const profileName =
            document.getElementById('profileName');

        const profileStatus =
            document.getElementById('profileStatus');

        if (session && session.user) {

            const email =
                session.user.email || '';

            if (profileName) {
                profileName.textContent = email;
            }

            if (profileStatus) {
                profileStatus.textContent =
                    'Signed in';
            }

            console.log(
                'SUPABASE USER SIGNED IN:',
                email
            );

            if (signInButton) {

    signInButton.style.display =
        'none';

}

if (signOutButton) {

    signOutButton.style.display =
        'block';

}

        }
        else {

            if (profileName) {
                profileName.textContent =
                    'Guest Learner';
            }

            if (profileStatus) {
                profileStatus.textContent =
                    'Not signed in';
            }

            console.log(
                'NO SUPABASE USER SESSION'
            );

            if (signInButton) {

    signInButton.style.display =
        'block';

}

if (signOutButton) {

    signOutButton.style.display =
        'none';

}

        }

    }

        /* --------------------------------------------------------
        COUNT COMPLETED SKILLS
        -------------------------------------------------------- */

        const completedSkills =
            nodes.filter(
                n => state[n.id]
            );

        const completedCount =
            completedSkills.length;

        const totalCount =
            nodes.length;


        /* --------------------------------------------------------
        CALCULATE XP
        -------------------------------------------------------- */

        const totalXP =
            completedSkills.reduce(
                (total, n) =>
                    total + (n.xp || 0),
                0
            );


        /* --------------------------------------------------------
        CALCULATE PROGRESS
        -------------------------------------------------------- */

        const percentage =
            totalCount
                ? Math.round(
                    completedCount /
                    totalCount *
                    100
                )
                : 0;


        /* --------------------------------------------------------
        UPDATE SKILLS
        -------------------------------------------------------- */

        const profileSkills =
            document.getElementById(
                'profileSkills'
            );

        if (profileSkills) {

            profileSkills.textContent =
                `${completedCount} / ${totalCount}`;

        }


        /* --------------------------------------------------------
        UPDATE XP
        -------------------------------------------------------- */

        const profileXP =
            document.getElementById(
                'profileXP'
            );

        if (profileXP) {

            profileXP.textContent =
                totalXP;

        }


        /* --------------------------------------------------------
        UPDATE OVERALL PERCENTAGE
        -------------------------------------------------------- */

        const profilePercentage =
            document.getElementById(
                'profilePercentage'
            );

        if (profilePercentage) {

            profilePercentage.textContent =
                `${percentage}%`;

        }


        /* --------------------------------------------------------
        UPDATE PROGRESS BAR
        -------------------------------------------------------- */

        const profileProgressBar =
            document.getElementById(
                'profileProgressBar'
            );

        if (profileProgressBar) {

            profileProgressBar.style.width =
                `${percentage}%`;

        }


        /* --------------------------------------------------------
        UPDATE CURRENT LEARNING
        -------------------------------------------------------- */

        const profileCurrentLearning =
            document.getElementById(
                'profileCurrentLearning'
            );

        const profileCurrentStatus =
            document.getElementById(
                'profileCurrentStatus'
            );

        const currentModule =
            byId[selected];


        if (currentModule) {

            if (profileCurrentLearning) {

                profileCurrentLearning.textContent =
                    currentModule.name;

            }


            if (profileCurrentStatus) {

                profileCurrentStatus.textContent =
                    state[currentModule.id]
                        ? '✓ Completed'
                        : 'Currently learning';

            }

        }


        /* --------------------------------------------------------
        UPDATE COMPLETED SKILLS LIST
        -------------------------------------------------------- */

        const profileCompletedSkills =
            document.getElementById(
                'profileCompletedSkills'
            );


        if (profileCompletedSkills) {

            if (completedSkills.length === 0) {

                profileCompletedSkills.innerHTML =
                    `
                    <div class="profile-empty">
                        No skills completed yet.
                    </div>
                    `;

            }
            else {

                profileCompletedSkills.innerHTML =
                    completedSkills
                        .map(
                            n => `
                                <div
                                    class="profile-completed-item"
                                >

                                    <span
                                        class="profile-completed-check"
                                    >
                                        ✓
                                    </span>

                                    <span>
                                        ${n.name}
                                    </span>

                                </div>
                            `
                        )
                        .join('');

            }

        }

    }








    /* ============================================================
    SAVE YOUR PROGRESS
    ============================================================ */

    const saveProgressButton =
        document.getElementById('saveProgress');

    const saveProgressEmail =
        document.getElementById('saveProgressEmail');

    const progressEmail =
        document.getElementById('progressEmail');

    const continueProgressSave =
        document.getElementById('continueProgressSave');

    const saveProgressMessage =
        document.getElementById('saveProgressMessage');


    /* ------------------------------------------------------------
    OPEN EMAIL
    ------------------------------------------------------------ */

    function showSaveProgressPopup(){

        if (userProfileOverlay) {

            userProfileOverlay.classList.add(
                'show'
            );

        }

        if (saveProgressEmail) {

            saveProgressEmail.style.display =
                'block';

            saveProgressEmail.scrollIntoView({
                behavior: 'smooth',
                block: 'center'
            });

        }

    }

    window.showSaveProgressPopup =
        showSaveProgressPopup;

    saveProgressButton.addEventListener(
        'click',
        function () {

            showSaveProgressPopup();

        }
    );


    /* ------------------------------------------------------------
    CONTINUE
    ------------------------------------------------------------ */

    continueProgressSave.addEventListener(
        'click',
        async function () {

            const email =
                progressEmail.value.trim();


            if (!email) {

                alert(
                    'Please enter your email address.'
                );

                return;

            }


            if (!progressEmail.checkValidity()) {

                alert(
                    'Please enter a valid email address.'
                );

                return;

            }


            console.log(
        'EMAIL VALID:',
        email
    );

    console.log(
        'SENDING MAGIC LINK...'
    );

    if (saveProgressMessage) {

        saveProgressMessage.style.display =
            'block';

        saveProgressMessage.textContent =
            `Check your email. We sent a sign-in link to ${email}. Click the link to continue.`;

    }

    const {
        data: {
            session
        }
    } = await window.supabaseClient.auth.getSession();

    if (session && session.user) {

        console.log(
            'USER ALREADY SIGNED IN:',
            session.user.email
        );

        alert(
            'You are already signed in as ' +
            session.user.email
        );

        return;
    }

    if (!window.supabaseClient) {

        console.error(
            'Supabase client is not available.'
        );

        alert(
            'Supabase is not connected yet.'
        );

        return;
    }

    const {
        error
    } =
        await window.supabaseClient.auth.signInWithOtp({

            email: email,

            options: {

    shouldCreateUser: true,

    emailRedirectTo:
    window.location.origin

}

        });

    if (error) {

        console.error(
        'MAGIC LINK SEND ERROR:',
        error
    );

    alert(
        'Unable to send sign-in link: ' +
        error.message
    );

        return;
    }

    console.log(
        'MAGIC LINK SENT:',
        email
    );

    if (saveProgressMessage) {

        saveProgressMessage.style.display =
            'block';

        saveProgressMessage.textContent =
            `Check your email. We sent a sign-in link to ${email}. Click the link to continue.`;

    }

        }
    );


    /* ============================================================
    RESET PROGRESS
    ============================================================ */

    document
        .getElementById('reset')
        .addEventListener(
            'click',
            () => {

                state =
                    Object.fromEntries(
                        nodes.map(
                            n => [
                                n.id,
                                false
                            ]
                        )
                    );


                selected =
                    'ai101';


                draw();

            }
        );


    /* ============================================================
    ZOOM / PAN SKILL TREE
    ============================================================ */

    let dragging = false;
    let lx = 0;
    let ly = 0;

    /*
    ------------------------------------------------------------
    Canvas camera state
    ------------------------------------------------------------
    zoom   = current zoom level
    panX   = horizontal camera position
    panY   = vertical camera position
    ------------------------------------------------------------
    */

    let zoom = window.innerWidth <= 600 ? 0.55 : 1;
    let panX = 0;
    let panY = 0;

    const MIN_ZOOM = 0.40;
    const MAX_ZOOM = 2.50;
    const ZOOM_STEP = 0.10;
    const PAN_STEP = 40;


    /* ============================================================
    APPLY CANVAS TRANSFORM
    ============================================================ */

    function updateCanvasTransform(){

        canvas.style.transform =
            `translate(${panX}px, ${panY}px) scale(${zoom})`;

        canvas.style.transformOrigin = '0 0';

    }


    /* ============================================================
    CENTER CANVAS
    ============================================================ */

    function centerCanvas(){

        if(!vp || !canvas){
            return;
        }

        const canvasWidth =
            canvas.offsetWidth * zoom;

        const canvasHeight =
            canvas.offsetHeight * zoom;

        panX =
            (vp.clientWidth - canvasWidth) / 2;

        panY =
            (vp.clientHeight - canvasHeight) / 2;

        updateCanvasTransform();

    }


    /* ============================================================
    SET ZOOM
    ============================================================ */

    function setZoom(newZoom, anchorX = vp.clientWidth / 2, anchorY = vp.clientHeight / 2){

        if(!vp || !canvas){
            return;
        }

        const nextZoom =
            Math.min(
                MAX_ZOOM,
                Math.max(MIN_ZOOM, newZoom)
            );

        if(nextZoom === zoom){
            return;
        }

        /*
        Keep the point under the mouse cursor fixed while zooming.
        */

        const worldX =
            (anchorX - panX) / zoom;

        const worldY =
            (anchorY - panY) / zoom;

        zoom = nextZoom;

        panX =
            anchorX - worldX * zoom;

        panY =
            anchorY - worldY * zoom;

        updateCanvasTransform();

    }


    /* ============================================================
    MOUSE WHEEL ZOOM
    ============================================================ */

    vp.addEventListener(
        'wheel',
        e => {

            e.preventDefault();

            const rect =
                vp.getBoundingClientRect();

            const mouseX =
                e.clientX - rect.left;

            const mouseY =
                e.clientY - rect.top;

            const direction =
                e.deltaY < 0
                    ? 1
                    : -1;

            setZoom(
                zoom + direction * ZOOM_STEP,
                mouseX,
                mouseY
            );

        },
        { passive: false }
    );


    /* ============================================================
    POINTER DRAG / PAN
    ============================================================ */

    vp.addEventListener(
        'pointerdown',
        e => {

            /*
            --------------------------------------------------------
            Do not start canvas dragging when clicking a node.
            --------------------------------------------------------
            */

            if(e.target.closest('.node')){
                return;
            }

            dragging = true;

            lx =
                e.clientX;

            ly =
                e.clientY;

            vp.setPointerCapture(
                e.pointerId
            );

            vp.classList.add(
                'dragging'
            );

        }
    );


    vp.addEventListener(
        'pointermove',
        e => {

            if(!dragging){
                return;
            }

            panX +=
                e.clientX - lx;

            panY +=
                e.clientY - ly;

            lx =
                e.clientX;

            ly =
                e.clientY;

            updateCanvasTransform();

        }
    );


    function stopDragging(e){

        dragging = false;

        vp.classList.remove(
            'dragging'
        );

        if(
            e &&
            vp.hasPointerCapture(e.pointerId)
        ){
            vp.releasePointerCapture(
                e.pointerId
            );
        }

    }


    vp.addEventListener(
        'pointerup',
        stopDragging
    );

    vp.addEventListener(
        'pointercancel',
        stopDragging
    );

    vp.addEventListener(
        'lostpointercapture',
        () => {

            dragging = false;

            vp.classList.remove(
                'dragging'
            );

        }
    );


    /* ============================================================
    KEYBOARD NAVIGATION
    ============================================================ */

    document.addEventListener(
        'keydown',
        e => {

            /*
            Do not hijack keyboard input while typing into a field.
            */

            const tag =
                e.target?.tagName?.toLowerCase();

            if(
                tag === 'input' ||
                tag === 'textarea' ||
                tag === 'select' ||
                e.target?.isContentEditable
            ){
                return;
            }

            switch(e.key){

                case '+':
                case '=':
                    e.preventDefault();
                    setZoom(zoom + ZOOM_STEP);
                    break;

                case '-':
                case '_':
                    e.preventDefault();
                    setZoom(zoom - ZOOM_STEP);
                    break;

                case '0':
                    e.preventDefault();
                    zoom = 1;
                    centerCanvas();
                    break;

                case 'ArrowLeft':
                    e.preventDefault();
                    panX += PAN_STEP;
                    updateCanvasTransform();
                    break;

                case 'ArrowRight':
                    e.preventDefault();
                    panX -= PAN_STEP;
                    updateCanvasTransform();
                    break;

                case 'ArrowUp':
                    e.preventDefault();
                    panY += PAN_STEP;
                    updateCanvasTransform();
                    break;

                case 'ArrowDown':
                    e.preventDefault();
                    panY -= PAN_STEP;
                    updateCanvasTransform();
                    break;

            }

        }
    );


    /* ============================================================
    INITIAL CANVAS POSITION
    ============================================================ */

    function initializeCanvasView(){

        zoom = 1;

        requestAnimationFrame(() => {
            centerCanvas();
        });

    }

    window.addEventListener(
        'resize',
        () => {

            centerCanvas();

        }
    );

    initializeCanvasView();


    /* ============================================================
    SKILL TREE ANIMATION
    ============================================================ */

    function animate(){

        anim += 0.018;


        document
            .querySelectorAll(
                '.link.done'
            )
            .forEach(
                (line,index) => {

                    line.style.opacity =
                        0.65 +
                        0.35 *
                        Math.sin(
                            anim * 4 +
                            index
                        );

                }
            );


        raf =
            requestAnimationFrame(
                animate
            );

    }


    /* ============================================================
    INITIALIZE APPLICATION
    ============================================================ */

    async function initializeApplication(){

        await loadModules();

        await loadSavedUserProgress();

        draw();

        console.log(
            "APPLICATION INITIALIZED WITH SAVED PROGRESS"
        );

    }


    initializeApplication();