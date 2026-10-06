/* =========================================================
   GRATIA WEBSITE
   Main JavaScript
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {

    /* =====================================================
       ELEMENTS
    ===================================================== */

    const socialBar = document.getElementById("socialBar");
    const siteHeader = document.getElementById("siteHeader");

    const menuToggle = document.getElementById("menuToggle");
    const mainNav = document.getElementById("mainNav");

    const navLinks = document.querySelectorAll(".nav-link");

    const currentYear = document.getElementById("currentYear");


    /* =====================================================
       CURRENT YEAR
    ===================================================== */

    if (currentYear) {
        currentYear.textContent = new Date().getFullYear();
    }


    /* =====================================================
       MOBILE MENU
    ===================================================== */

    if (menuToggle && mainNav) {

        menuToggle.addEventListener("click", () => {

            const isOpen = mainNav.classList.toggle("open");

            menuToggle.setAttribute(
                "aria-expanded",
                isOpen ? "true" : "false"
            );

            menuToggle.setAttribute(
                "aria-label",
                isOpen ? "Menü schließen" : "Menü öffnen"
            );

        });


        /* Close menu after clicking a navigation link */

        navLinks.forEach((link) => {

            link.addEventListener("click", () => {

                mainNav.classList.remove("open");

                menuToggle.setAttribute(
                    "aria-expanded",
                    "false"
                );

                menuToggle.setAttribute(
                    "aria-label",
                    "Menü öffnen"
                );

            });

        });

    }


    /* =====================================================
       SOCIAL BAR / HEADER ON SCROLL
       ===================================================== */

    let lastScrollY = window.scrollY;

    function handleScroll() {

        const currentScrollY = window.scrollY;

        /*
         * At the top of the page:
         * Social bar + header are visible.
         */

        if (currentScrollY <= 20) {

            if (socialBar) {
                socialBar.classList.remove("hidden");
            }

            if (siteHeader) {
                siteHeader.classList.remove("social-hidden");
            }

            lastScrollY = currentScrollY;

            return;
        }


        /*
         * Scrolling down:
         * Hide social bar.
         * Move main header to the top.
         */

        if (currentScrollY > lastScrollY) {

            if (socialBar) {
                socialBar.classList.add("hidden");
            }

            if (siteHeader) {
                siteHeader.classList.add("social-hidden");
            }

        }


        /*
         * Scrolling up:
         * Show social bar again.
         */

        else if (currentScrollY < lastScrollY) {

            if (socialBar) {
                socialBar.classList.remove("hidden");
            }

            if (siteHeader) {
                siteHeader.classList.remove("social-hidden");
            }

        }


        lastScrollY = currentScrollY;

    }


    window.addEventListener(
        "scroll",
        handleScroll,
        { passive: true }
    );


    /* =====================================================
       ACTIVE NAVIGATION
       ===================================================== */

    const sections = document.querySelectorAll(
        "main section[id]"
    );


    function updateActiveNavigation() {

        const scrollPosition =
            window.scrollY +
            180;


        sections.forEach((section) => {

            const sectionTop = section.offsetTop;

            const sectionHeight = section.offsetHeight;

            const sectionId = section.getAttribute("id");


            if (
                scrollPosition >= sectionTop &&
                scrollPosition < sectionTop + sectionHeight
            ) {

                navLinks.forEach((link) => {

                    link.classList.remove("active");

                    const href =
                        link.getAttribute("href");

                    if (href === `#${sectionId}`) {
                        link.classList.add("active");
                    }

                });

            }

        });

    }


    window.addEventListener(
        "scroll",
        updateActiveNavigation,
        { passive: true }
    );


    updateActiveNavigation();


    /* =====================================================
       SMOOTH SCROLL
       ===================================================== */

    document.querySelectorAll(
        'a[href^="#"]'
    ).forEach((link) => {

        link.addEventListener("click", (event) => {

            const targetId =
                link.getAttribute("href");

            /*
             * Ignore empty placeholder links such as "#"
             * used for future social media URLs.
             */

            if (
                !targetId ||
                targetId === "#"
            ) {
                return;
            }


            const target =
                document.querySelector(targetId);


            if (target) {

                event.preventDefault();

                target.scrollIntoView({
                    behavior: "smooth",
                    block: "start"
                });

            }

        });

    });


    /* =====================================================
       CLOSE MOBILE MENU WHEN RESIZING
    ===================================================== */

    window.addEventListener("resize", () => {

        if (
            window.innerWidth > 850 &&
            mainNav &&
            menuToggle
        ) {

            mainNav.classList.remove("open");

            menuToggle.setAttribute(
                "aria-expanded",
                "false"
            );

            menuToggle.setAttribute(
                "aria-label",
                "Menü öffnen"
            );

        }

    });


});


/* =========================================================
   GRATIA CONTACT FORM - WEB3FORMS
   ========================================================= */

const gratiaContactForm = document.getElementById("gratia-contact-form");
const formResult = document.getElementById("form-result");

if (gratiaContactForm) {

    gratiaContactForm.addEventListener("submit", async function (event) {

        event.preventDefault();

        const submitButton = gratiaContactForm.querySelector(
            ".contact-submit-btn"
        );

        const originalButtonText = submitButton.innerHTML;

        submitButton.disabled = true;
        submitButton.innerHTML = "Wird gesendet ...";

        formResult.className = "form-result";
        formResult.style.display = "none";
        formResult.textContent = "";

        try {

            const formData = new FormData(gratiaContactForm);

            const response = await fetch(
                "https://api.web3forms.com/submit",
                {
                    method: "POST",
                    headers: {
                        "Accept": "application/json"
                    },
                    body: formData
                }
            );

            const data = await response.json();

            if (response.ok && data.success) {

                formResult.className = "form-result success";
                formResult.textContent =
                    "Vielen Dank! Ihre Nachricht wurde erfolgreich gesendet.";

                gratiaContactForm.reset();

            } else {

                formResult.className = "form-result error";
                formResult.textContent =
                    "Leider konnte die Nachricht nicht gesendet werden. Bitte versuchen Sie es später erneut.";

            }

        } catch (error) {

            console.error("Web3Forms error:", error);

            formResult.className = "form-result error";
            formResult.textContent =
                "Es ist ein Fehler aufgetreten. Bitte versuchen Sie es später erneut.";

        } finally {

            submitButton.disabled = false;
            submitButton.innerHTML = originalButtonText;

            formResult.style.display = "block";

        }

    });

}


/* =========================================================
   BACK TO TOP
========================================================= */

const backToTop = document.getElementById("backToTop");

window.addEventListener("scroll", () => {

    if (window.scrollY > 500) {
        backToTop.classList.add("show");
    } else {
        backToTop.classList.remove("show");
    }

});

backToTop.addEventListener("click", () => {

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });

});

/* =========================================================
   CONTACT IMAGE SLIDER
   ========================================================= */

const contactSlides = document.querySelectorAll(".contact-slide");
const contactDots = document.querySelectorAll(".contact-dot");
const contactPrev = document.querySelector(".contact-prev");
const contactNext = document.querySelector(".contact-next");

let contactCurrentSlide = 0;
let contactSliderTimer;

function showContactSlide(index) {

    if (!contactSlides.length) return;

    contactCurrentSlide =
        (index + contactSlides.length) % contactSlides.length;

    contactSlides.forEach((slide, i) => {
        slide.classList.toggle(
            "active",
            i === contactCurrentSlide
        );
    });

    contactDots.forEach((dot, i) => {
        dot.classList.toggle(
            "active",
            i === contactCurrentSlide
        );
    });
}

function startContactSlider() {

    clearInterval(contactSliderTimer);

    contactSliderTimer = setInterval(() => {
        showContactSlide(contactCurrentSlide + 1);
    }, 4500);
}

if (contactSlides.length > 1) {

    contactPrev.addEventListener("click", () => {
        showContactSlide(contactCurrentSlide - 1);
        startContactSlider();
    });

    contactNext.addEventListener("click", () => {
        showContactSlide(contactCurrentSlide + 1);
        startContactSlider();
    });

    contactDots.forEach((dot, index) => {

        dot.addEventListener("click", () => {
            showContactSlide(index);
            startContactSlider();
        });

    });

    showContactSlide(0);
    startContactSlider();
}
