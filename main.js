/* =========================================================
   GRATIA GmbH
   MAIN JAVASCRIPT
========================================================= */


/* =========================================================
   01. SELECT ELEMENTS
========================================================= */

const header =
    document.getElementById("header");

const menuButton =
    document.getElementById("menuButton");

const navigation =
    document.getElementById("navigation");

const navigationLinks =
    document.querySelectorAll(".navigation a");


/* =========================================================
   02. MOBILE MENU
========================================================= */

if (menuButton && navigation) {

    menuButton.addEventListener(
        "click",
        function () {

            navigation.classList.toggle("active");

            menuButton.classList.toggle("active");

            const isOpen =
                navigation.classList.contains("active");

            menuButton.setAttribute(
                "aria-expanded",
                String(isOpen)
            );

        }
    );

}


/* =========================================================
   03. CLOSE MOBILE MENU
   WHEN NAVIGATION LINK IS CLICKED
========================================================= */

navigationLinks.forEach(
    function (link) {

        link.addEventListener(
            "click",
            function () {

                if (navigation) {

                    navigation.classList.remove(
                        "active"
                    );

                }

                if (menuButton) {

                    menuButton.classList.remove(
                        "active"
                    );

                    menuButton.setAttribute(
                        "aria-expanded",
                        "false"
                    );

                }

            }
        );

    }
);


/* =========================================================
   04. CLOSE MENU WHEN CLICKING OUTSIDE
========================================================= */

document.addEventListener(
    "click",
    function (event) {

        if (!navigation || !menuButton) {
            return;
        }

        const clickedInsideNavigation =
            navigation.contains(event.target);

        const clickedMenuButton =
            menuButton.contains(event.target);

        if (
            !clickedInsideNavigation &&
            !clickedMenuButton
        ) {

            navigation.classList.remove(
                "active"
            );

            menuButton.classList.remove(
                "active"
            );

            menuButton.setAttribute(
                "aria-expanded",
                "false"
            );

        }

    }
);


/* =========================================================
   05. HEADER ON SCROLL
========================================================= */

function handleHeaderScroll() {

    if (!header) {
        return;
    }

    if (window.scrollY > 50) {

        header.classList.add(
            "scrolled"
        );

    } else {

        header.classList.remove(
            "scrolled"
        );

    }

}


window.addEventListener(
    "scroll",
    handleHeaderScroll,
    {
        passive: true
    }
);


/* =========================================================
   06. SMOOTH SCROLL
========================================================= */

navigationLinks.forEach(
    function (link) {

        link.addEventListener(
            "click",
            function (event) {

                const targetId =
                    this.getAttribute("href");

                if (
                    !targetId ||
                    !targetId.startsWith("#") ||
                    targetId === "#"
                ) {

                    return;

                }


                const target =
                    document.querySelector(
                        targetId
                    );


                if (!target) {
                    return;
                }


                event.preventDefault();


                const headerHeight =
                    header
                        ? header.offsetHeight
                        : 0;


                const targetPosition =
                    target.getBoundingClientRect().top +
                    window.scrollY -
                    headerHeight;


                window.scrollTo({

                    top: targetPosition,

                    behavior: "smooth"

                });

            }
        );

    }
);


/* =========================================================
   07. MANAGEMENT SLIDER
========================================================= */

const managementSlider =
    document.querySelector(
        ".management-slider"
    );


const sliderTrack =
    document.querySelector(
        ".slider-track"
    );


const managementSlides =
    document.querySelectorAll(
        ".management-slide"
    );


const previousButton =
    document.querySelector(
        ".slider-prev"
    );


const nextButton =
    document.querySelector(
        ".slider-next"
    );


const sliderDots =
    document.querySelectorAll(
        ".slider-dot"
    );


let currentSlide = 0;


/* =========================================================
   08. UPDATE SLIDER
========================================================= */

function updateSlider() {

    if (
        !sliderTrack ||
        managementSlides.length === 0
    ) {

        return;

    }


    sliderTrack.style.transform =
        `translateX(-${currentSlide * 100}%)`;


    managementSlides.forEach(
        function (slide, index) {

            slide.classList.toggle(
                "active",
                index === currentSlide
            );

        }
    );


    sliderDots.forEach(
        function (dot, index) {

            dot.classList.toggle(
                "active",
                index === currentSlide
            );

        }
    );

}


/* =========================================================
   09. NEXT SLIDE
========================================================= */

function showNextSlide() {

    if (
        managementSlides.length === 0
    ) {

        return;

    }


    currentSlide =
        (
            currentSlide + 1
        ) %
        managementSlides.length;


    updateSlider();

}


/* =========================================================
   10. PREVIOUS SLIDE
========================================================= */

function showPreviousSlide() {

    if (
        managementSlides.length === 0
    ) {

        return;

    }


    currentSlide =
        (
            currentSlide -
            1 +
            managementSlides.length
        ) %
        managementSlides.length;


    updateSlider();

}


/* =========================================================
   11. NEXT BUTTON
========================================================= */

if (nextButton) {

    nextButton.addEventListener(
        "click",
        showNextSlide
    );

}


/* =========================================================
   12. PREVIOUS BUTTON
========================================================= */

if (previousButton) {

    previousButton.addEventListener(
        "click",
        showPreviousSlide
    );

}


/* =========================================================
   13. SLIDER DOTS
========================================================= */

sliderDots.forEach(
    function (dot, index) {

        dot.addEventListener(
            "click",
            function () {

                currentSlide = index;

                updateSlider();

            }
        );

    }
);


/* =========================================================
   14. SLIDER KEYBOARD CONTROL
========================================================= */

if (managementSlider) {

    managementSlider.setAttribute(
        "tabindex",
        "0"
    );


    managementSlider.addEventListener(
        "keydown",
        function (event) {

            if (
                event.key === "ArrowRight"
            ) {

                event.preventDefault();

                showNextSlide();

            }


            if (
                event.key === "ArrowLeft"
            ) {

                event.preventDefault();

                showPreviousSlide();

            }

        }
    );

}


/* =========================================================
   15. SERVICE MODAL
========================================================= */

const serviceModal =
    document.getElementById(
        "serviceModal"
    );


const serviceModalClose =
    document.getElementById(
        "serviceModalClose"
    );


const serviceModalTitle =
    document.getElementById(
        "serviceModalTitle"
    );


const serviceModalNumber =
    document.getElementById(
        "serviceModalNumber"
    );


const serviceModalText =
    document.getElementById(
        "serviceModalText"
    );


const serviceCards =
    document.querySelectorAll(
        ".service-card"
    );


/* =========================================================
   16. SERVICE INFORMATION
========================================================= */

const serviceInformation = {

    grundpflege: {

        number: "01",

        title: "Grundpflege",

        text:
            "Individuelle Unterstützung im Bereich der Grundpflege. Die Versorgung wird an die persönlichen Bedürfnisse der Patientinnen und Patienten angepasst."

    },


    beatmung: {

        number: "02",

        title: "Außerklinische Beatmung",

        text:
            "Professionelle Versorgung von Menschen mit außerklinischem Beatmungsbedarf. Die Betreuung wird individuell auf die jeweilige Versorgungssituation abgestimmt."

    },


    heimbeatmung: {

        number: "03",

        title: "Heimbeatmung",

        text:
            "Individuelle pflegerische Betreuung im Rahmen der Heimbeatmung. Unser Ziel ist eine sichere Versorgung in der vertrauten Umgebung."

    },


    trachealkanuelenpflege: {

        number: "04",

        title: "Trachealkanülenpflege",

        text:
            "Versorgung und pflegerische Betreuung im Zusammenhang mit einer Trachealkanüle. Die Versorgung wird entsprechend der individuellen Situation durchgeführt."

    },


    sauerstoff: {

        number: "05",

        title: "Sauerstoffversorgung",

        text:
            "Individuelle Betreuung bei bestehendem Bedarf an Sauerstoffversorgung. Die Versorgung wird an die persönlichen und medizinischen Anforderungen angepasst."

    },


    wundversorgung: {

        number: "06",

        title: "Wundversorgung",

        text:
            "Professionelle pflegerische Unterstützung bei der Versorgung von Wunden. Die Versorgung erfolgt individuell entsprechend der jeweiligen Situation."

    },


    portversorgung: {

        number: "07",

        title: "Portversorgung",

        text:
            "Pflegerische Versorgung im Zusammenhang mit einem Port. Die Durchführung erfolgt entsprechend der individuellen Versorgungssituation."

    },


    stoma: {

        number: "08",

        title: "Stomaversorgung",

        text:
            "Individuelle Unterstützung und pflegerische Versorgung von Menschen mit einem Stoma."

    },


    peg: {

        number: "09",

        title: "PEG-Versorgung",

        text:
            "Pflegerische Unterstützung im Zusammenhang mit einer PEG-Versorgung. Die Betreuung wird individuell auf die Bedürfnisse der Patientinnen und Patienten abgestimmt."

    },


    blasenkatheter: {

        number: "10",

        title: "Blasenkatheter",

        text:
            "Pflegerische Betreuung und Versorgung im Zusammenhang mit einem Blasenkatheter."

    },


    infusion: {

        number: "11",

        title: "Infusionstherapie",

        text:
            "Pflegerische Unterstützung im Rahmen der Infusionstherapie entsprechend der individuellen Versorgungssituation."

    },


    schmerz: {

        number: "12",

        title: "Schmerztherapie",

        text:
            "Individuelle pflegerische Begleitung von Menschen mit einem erhöhten Unterstützungsbedarf im Bereich der Schmerztherapie."

    },


    palliativ: {

        number: "13",

        title: "Palliativbetreuung",

        text:
            "Begleitung und Betreuung von Menschen mit palliativem Versorgungsbedarf. Dabei stehen eine würdevolle Betreuung und die individuellen Bedürfnisse im Mittelpunkt."

    },


    psychosozial: {

        number: "14",

        title: "Psychosoziale Betreuung",

        text:
            "Psychosoziale Unterstützung und persönliche Begleitung als Bestandteil einer ganzheitlichen Betreuung."

    }

};


/* =========================================================
   17. OPEN SERVICE MODAL
========================================================= */

serviceCards.forEach(
    function (card) {

        card.addEventListener(
            "click",
            function () {

                const service =
                    this.getAttribute(
                        "data-service"
                    );


                const information =
                    serviceInformation[
                        service
                    ];


                if (
                    !information ||
                    !serviceModal
                ) {

                    return;

                }


                if (serviceModalNumber) {

                    serviceModalNumber.textContent =
                        information.number;

                }


                if (serviceModalTitle) {

                    serviceModalTitle.textContent =
                        information.title;

                }


                if (serviceModalText) {

                    serviceModalText.textContent =
                        information.text;

                }


                serviceModal.classList.add(
                    "active"
                );


                document.body.style.overflow =
                    "hidden";

            }
        );

    }
);


/* =========================================================
   18. CLOSE SERVICE MODAL
========================================================= */

function closeServiceModal() {

    if (!serviceModal) {
        return;
    }


    serviceModal.classList.remove(
        "active"
    );


    document.body.style.overflow =
        "";

}


/* =========================================================
   19. CLOSE BUTTON
========================================================= */

if (serviceModalClose) {

    serviceModalClose.addEventListener(
        "click",
        closeServiceModal
    );

}


/* =========================================================
   20. CLOSE BY CLICKING OVERLAY
========================================================= */

if (serviceModal) {

    serviceModal.addEventListener(
        "click",
        function (event) {

            if (
                event.target.classList.contains(
                    "service-modal-overlay"
                )
            ) {

                closeServiceModal();

            }

        }
    );

}


/* =========================================================
   21. ESC KEY
========================================================= */

document.addEventListener(
    "keydown",
    function (event) {

        /* Close service modal */

        if (
            event.key === "Escape" &&
            serviceModal &&
            serviceModal.classList.contains(
                "active"
            )
        ) {

            closeServiceModal();

            return;

        }


        /* Close mobile menu */

        if (
            event.key === "Escape"
        ) {

            if (navigation) {

                navigation.classList.remove(
                    "active"
                );

            }


            if (menuButton) {

                menuButton.classList.remove(
                    "active"
                );


                menuButton.setAttribute(
                    "aria-expanded",
                    "false"
                );

            }

        }

    }
);


/* =========================================================
   22. INITIALIZE
========================================================= */

handleHeaderScroll();

updateSlider();


/* =========================================================
   23. KI-ASSISTENT + FLOATING CONTROLS
   One unified DOMContentLoaded block.
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    function () {


    /* =====================================================
       AI ELEMENTS
    ===================================================== */

    const aiChatButton =
        document.getElementById(
            "aiChatButton"
        );


    const aiChat =
        document.getElementById(
            "aiChat"
        );


    const aiChatClose =
        document.getElementById(
            "aiChatClose"
        );


    const aiChatInput =
        document.getElementById(
            "aiChatInput"
        );


    const aiChatSend =
        document.getElementById(
            "aiChatSend"
        );


    const aiChatMessages =
        document.getElementById(
            "aiChatMessages"
        );


    const quickButtons =
        document.querySelectorAll(
            ".ai-quick-buttons button"
        );


    /* =====================================================
       BACK TO TOP
    ===================================================== */

    const backToTopButton =
        document.querySelector(
            ".back-to-top"
        );


    if (backToTopButton) {

        function updateBackToTop() {

            backToTopButton.classList.toggle(
                "is-visible",
                window.scrollY > 300
            );

        }


        updateBackToTop();


        window.addEventListener(
            "scroll",
            updateBackToTop,
            {
                passive: true
            }
        );


        backToTopButton.addEventListener(
            "click",
            function (event) {

                event.preventDefault();

                window.scrollTo({
                    top: 0,
                    behavior: "smooth"
                });

            }
        );

    }


    /* =====================================================
       AI CHAT
    ===================================================== */

    if (!aiChatButton || !aiChat) {
        return;
    }


    function openAIChat() {

        aiChat.classList.add(
            "active"
        );


        aiChatButton.classList.add(
            "ai-open"
        );


        window.setTimeout(
            function () {

                if (aiChatInput) {

                    aiChatInput.focus();

                }

            },
            100
        );

    }


    function closeAIChat() {

        aiChat.classList.remove(
            "active"
        );


        aiChatButton.classList.remove(
            "ai-open"
        );


        aiChatButton.classList.remove(
            "ai-revealed"
        );


        aiChatButton.style.right =
            window.innerWidth <= 600
                ? "-37px"
                : "-34px";

    }


    /* =====================================================
       AI SIDE TAB VARIABLES
    ===================================================== */

    let aiDragging = false;
    let aiMoved = false;
    let aiStartX = 0;
    let aiStartRight = -34;


    /* =====================================================
       AI BUTTON CLICK
    ===================================================== */

    aiChatButton.addEventListener(
        "click",
        function (event) {

            if (aiDragging || aiMoved) {

                event.preventDefault();

                aiMoved = false;

                return;

            }


            openAIChat();

        }
    );


    /* =====================================================
       AI CLOSE BUTTON
    ===================================================== */

    if (aiChatClose) {

        aiChatClose.addEventListener(
            "click",
            closeAIChat
        );

    }


    /* =====================================================
       ADD MESSAGE
    ===================================================== */

    function addMessage(
        text,
        type
    ) {

        if (!aiChatMessages) {
            return;
        }


        const message =
            document.createElement(
                "div"
            );


        message.classList.add(
            "ai-message",
            type === "user"
                ? "ai-message-user"
                : "ai-message-bot"
        );


        message.innerHTML =
            text;


        aiChatMessages.appendChild(
            message
        );


        aiChatMessages.scrollTop =
            aiChatMessages.scrollHeight;

    }


    /* =====================================================
       SHOW TYPING
    ===================================================== */

    function showTyping() {

        if (!aiChatMessages) {
            return;
        }


        const typing =
            document.createElement(
                "div"
            );


        typing.id =
            "aiTyping";


        typing.className =
            "ai-message ai-message-bot";


        typing.textContent =
            "KI schreibt...";


        aiChatMessages.appendChild(
            typing
        );


        aiChatMessages.scrollTop =
            aiChatMessages.scrollHeight;

    }


    /* =====================================================
       REMOVE TYPING
    ===================================================== */

    function removeTyping() {

        const typing =
            document.getElementById(
                "aiTyping"
            );


        if (typing) {

            typing.remove();

        }

    }


    /* =====================================================
       SEND MESSAGE
    ===================================================== */

    async function sendMessage() {

        if (!aiChatInput) {
            return;
        }


        const question =
            aiChatInput.value.trim();


        if (!question) {
            return;
        }


        /* User message */

        addMessage(
            question,
            "user"
        );


        aiChatInput.value =
            "";


        /* AI typing */

        showTyping();


        try {

            const response =
                await fetch(
                    "http://localhost:3000/api/chat",
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body:
                            JSON.stringify({
                                message:
                                    question
                            })
                    }
                );


            const data =
                await response.json();


            removeTyping();


            /* Backend error */

            if (!response.ok) {

                addMessage(
                    "Entschuldigung. Die KI ist momentan nicht verfügbar. Bitte versuchen Sie es später erneut.",
                    "bot"
                );

                return;

            }


            /* AI response */

            if (data.reply) {

                addMessage(
                    data.reply,
                    "bot"
                );

            } else {

                addMessage(
                    "Entschuldigung. Ich konnte keine Antwort erhalten.",
                    "bot"
                );

            }


        } catch (error) {

            console.error(
                "KI Verbindungsfehler:",
                error
            );


            removeTyping();


            addMessage(
                "Entschuldigung. Die Verbindung zur KI konnte momentan nicht hergestellt werden.<br><br>Sie können direkt mit unserem Team über WhatsApp sprechen.",
                "bot"
            );

        }

    }


    /* =====================================================
       SEND BUTTON
    ===================================================== */

    if (aiChatSend) {

        aiChatSend.addEventListener(
            "click",
            sendMessage
        );

    }


    /* =====================================================
       ENTER KEY
    ===================================================== */

    if (aiChatInput) {

        aiChatInput.addEventListener(
            "keydown",
            function (event) {

                if (
                    event.key === "Enter"
                ) {

                    event.preventDefault();

                    sendMessage();

                }

            }
        );

    }


    /* =====================================================
       QUICK QUESTIONS
    ===================================================== */

    quickButtons.forEach(
        function (button) {

            button.addEventListener(
                "click",
                function () {

                    const question =
                        button.dataset.question;


                    if (!question) {
                        return;
                    }


                    if (aiChatInput) {

                        aiChatInput.value =
                            question;

                    }


                    sendMessage();

                }
            );

        }
    );


    /* =====================================================
       AI SIDE TAB RESET
    ===================================================== */

    function resetAISideTab() {

        aiChatButton.classList.remove(
            "ai-revealed",
            "ai-open"
        );


        aiChatButton.style.right =
            window.innerWidth <= 600
                ? "-37px"
                : "-34px";

    }


    /* =====================================================
       AI DRAG START
    ===================================================== */

    aiChatButton.addEventListener(
        "pointerdown",
        function (event) {

            aiStartX =
                event.clientX;


            const computedRight =
                parseFloat(
                    window.getComputedStyle(
                        aiChatButton
                    ).right
                );


            aiStartRight =
                Number.isFinite(
                    computedRight
                )
                    ? computedRight
                    : -34;


            aiDragging =
                true;


            aiMoved =
                false;


            aiChatButton.classList.add(
                "ai-dragging"
            );


            try {

                aiChatButton.setPointerCapture(
                    event.pointerId
                );

            } catch (error) {}

        }
    );


    /* =====================================================
       AI DRAG MOVE
    ===================================================== */

    aiChatButton.addEventListener(
        "pointermove",
        function (event) {

            if (!aiDragging) {
                return;
            }


            const deltaX =
                event.clientX -
                aiStartX;


            if (
                Math.abs(deltaX) > 5
            ) {

                aiMoved =
                    true;

            }


            const maxRight =
                -34;


            const minRight =
                window.innerWidth <= 600
                    ? 12
                    : 18;


            let newRight =
                aiStartRight -
                deltaX;


            newRight =
                Math.max(
                    maxRight,
                    Math.min(
                        minRight,
                        newRight
                    )
                );


            aiChatButton.style.right =
                `${newRight}px`;

        }
    );


    /* =====================================================
       AI DRAG END
    ===================================================== */

    aiChatButton.addEventListener(
        "pointerup",
        function (event) {

            if (!aiDragging) {
                return;
            }


            aiDragging =
                false;


            aiChatButton.classList.remove(
                "ai-dragging"
            );


            try {

                aiChatButton.releasePointerCapture(
                    event.pointerId
                );

            } catch (error) {}


            if (aiMoved) {

                aiChatButton.classList.add(
                    "ai-revealed"
                );


                aiChatButton.style.right =
                    window.innerWidth <= 600
                        ? "12px"
                        : "18px";


                window.setTimeout(
                    function () {

                        aiMoved =
                            false;

                    },
                    0
                );

            }

        }
    );


    /* =====================================================
       AI DRAG CANCEL
    ===================================================== */

    aiChatButton.addEventListener(
        "pointercancel",
        function () {

            aiDragging =
                false;


            aiMoved =
                false;


            aiChatButton.classList.remove(
                "ai-dragging"
            );

        }
    );


    /* =====================================================
       ESCAPE KEY
    ===================================================== */

    document.addEventListener(
        "keydown",
        function (event) {

            if (
                event.key === "Escape"
            ) {

                if (
                    aiChat.classList.contains(
                        "active"
                    )
                ) {

                    closeAIChat();

                } else {

                    resetAISideTab();

                }

            }

        }
    );


});