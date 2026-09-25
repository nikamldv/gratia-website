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
   END OF MAIN.JS
========================================================= */