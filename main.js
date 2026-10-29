
/* =========================================================
   GRATIA WEBSITE
   Main JavaScript
   Navigation, Contact Form, Team Slider, Back to Top
   ========================================================= */


/* =========================================================
   1. INITIALIZE WEBSITE
   ========================================================= */
   
document.addEventListener("DOMContentLoaded", () => {

    const socialBar = document.getElementById("socialBar");
    const siteHeader = document.getElementById("siteHeader");

    const menuToggle = document.getElementById("menuToggle");
    const mainNav = document.getElementById("mainNav");

    const navLinks = document.querySelectorAll(".nav-link");
    const currentYear = document.getElementById("currentYear");


    /* =====================================================
       2. CURRENT YEAR
       ===================================================== */

    if (currentYear) {
        currentYear.textContent = new Date().getFullYear();
    }


/* =====================================================
   3. MOBILE NAVIGATION + LEISTUNGEN DROPDOWN
===================================================== */

if (menuToggle && mainNav) {

    menuToggle.addEventListener("click", () => {
        const isOpen = mainNav.classList.toggle("open");

        menuToggle.setAttribute("aria-expanded", String(isOpen));
        menuToggle.setAttribute(
            "aria-label",
            isOpen ? "Menü schließen" : "Menü öffnen"
        );
    });

    const leistungenDropdown = document.getElementById(
        "leistungenDropdown"
    );

    const dropdownToggle = leistungenDropdown?.querySelector(
        ".dropdown-toggle"
    );

    const submenu = leistungenDropdown?.querySelector(
        ".submenu-dropdown"
    );

    const submenuToggle = leistungenDropdown?.querySelector(
        ".submenu-toggle"
    );

    // Hauptmenü Leistungen öffnen und schließen
    if (dropdownToggle && leistungenDropdown) {
        dropdownToggle.addEventListener("click", (event) => {
            event.preventDefault();
            event.stopPropagation();

            const isOpen = leistungenDropdown.classList.toggle("is-open");

            dropdownToggle.setAttribute(
                "aria-expanded",
                String(isOpen)
            );

            if (!isOpen && submenu && submenuToggle) {
                submenu.classList.remove("is-open");
                submenuToggle.setAttribute("aria-expanded", "false");
            }
        });
    }

    // Untermenü Weitere Leistungen öffnen und schließen
    if (submenuToggle && submenu) {
        submenuToggle.addEventListener("click", (event) => {
            event.preventDefault();
            event.stopPropagation();

            const isOpen = submenu.classList.toggle("is-open");

            submenuToggle.setAttribute(
                "aria-expanded",
                String(isOpen)
            );
        });
    }

    // Navigation schließen, aber nicht beim Öffnen der Dropdowns
    navLinks.forEach((link) => {
        link.addEventListener("click", () => {

            if (
                link.classList.contains("dropdown-toggle") ||
                link.classList.contains("submenu-toggle")
            ) {
                return;
            }

            mainNav.classList.remove("open");
            menuToggle.setAttribute("aria-expanded", "false");
            menuToggle.setAttribute("aria-label", "Menü öffnen");
        });
    });

    // Nach Auswahl eines Untermenü-Links das mobile Menü schließen
    mainNav.querySelectorAll(".dropdown-item[href]").forEach((link) => {
        link.addEventListener("click", () => {
            mainNav.classList.remove("open");
            menuToggle.setAttribute("aria-expanded", "false");
            menuToggle.setAttribute("aria-label", "Menü öffnen");
        });
    });
}


    /* =====================================================
       4. SOCIAL BAR AND HEADER ON SCROLL
       ===================================================== */

    let lastScrollY = window.scrollY;

    function handleScroll() {

        const currentScrollY = window.scrollY;

        // Show the social bar at the top of the page.

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


        // Scrolling down: hide the social bar.

        if (currentScrollY > lastScrollY) {

            if (socialBar) {
                socialBar.classList.add("hidden");
            }

            if (siteHeader) {
                siteHeader.classList.add("social-hidden");
            }

        }

        // Scrolling up: show the social bar again.

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

    window.addEventListener("scroll", handleScroll, {
        passive: true
    });


    /* =====================================================
       5. ACTIVE NAVIGATION
       ===================================================== */

    const sections = document.querySelectorAll("main section[id]");

    function updateActiveNavigation() {

        const scrollPosition = window.scrollY + 180;

        let activeSectionId = null;

        sections.forEach((section) => {

            const sectionTop = section.offsetTop;
            const sectionHeight = section.offsetHeight;

            if (
                scrollPosition >= sectionTop &&
                scrollPosition < sectionTop + sectionHeight
            ) {
                activeSectionId = section.getAttribute("id");
            }

        });

        navLinks.forEach((link) => {

            link.classList.remove("active");

            const href = link.getAttribute("href");

            if (
                activeSectionId &&
                href === `#${activeSectionId}`
            ) {
                link.classList.add("active");
            }

        });

    }

    window.addEventListener("scroll", updateActiveNavigation, {
        passive: true
    });

    updateActiveNavigation();


    /* =====================================================
       6. SMOOTH SCROLL
       ===================================================== */

    document.querySelectorAll('a[href^="#"]').forEach((link) => {

        link.addEventListener("click", (event) => {

            const targetId = link.getAttribute("href");

            // Ignore empty links and social media placeholders.

            if (!targetId || targetId === "#") {
                return;
            }

            const target = document.querySelector(targetId);

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
       7. CLOSE MOBILE MENU WHEN RESIZING
       ===================================================== */

    window.addEventListener("resize", () => {

        if (
            window.innerWidth > 850 &&
            mainNav &&
            menuToggle
        ) {

            mainNav.classList.remove("open");

            menuToggle.setAttribute("aria-expanded", "false");
            menuToggle.setAttribute("aria-label", "Menü öffnen");

        }

    });

});


/* =========================================================
   8. CONTACT FORM - GRATIA BACKEND + MYSQL
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {

    const contactForm = document.getElementById(
        "gratia-contact-form"
    );

    const formResult = document.getElementById("form-result");

    if (!contactForm || !formResult) {
        return;
    }


    contactForm.addEventListener("submit", async (event) => {

        event.preventDefault();

        if (contactForm.dataset.submitting === "true") {
    return;
}

contactForm.dataset.submitting = "true";

        const submitButton = contactForm.querySelector(
            ".contact-submit-btn"
        );
if (!submitButton) {
    contactForm.dataset.submitting = "false";
    return;
}

        const originalButtonText = submitButton.innerHTML;

        // Disable the button while sending.

        submitButton.disabled = true;
        submitButton.textContent = "Wird gesendet ...";

        formResult.className = "form-result";
        formResult.style.display = "none";
        formResult.textContent = "";


        try {

            const formData = new FormData(contactForm);

            // Read the contact form fields.

            const payload = {
                name: String(
                    formData.get("name") || ""
                ).trim(),

                email: String(
                    formData.get("email") || ""
                ).trim(),

                phone: String(
                    formData.get("phone") || ""
                ).trim(),

                subject: String(
                    formData.get("Anliegen") ||
                    formData.get("subject") ||
                    ""
                ).trim(),

                message: String(
                    formData.get("message") || ""
                ).trim()
            };


            // Send the message to the local GRATIA backend.

            const response = await fetch(
                "https://pflegedienstgratia.com/api/contact-messages",
                {
                    method: "POST",

                    headers: {
                        "Content-Type": "application/json"
                    },

                    body: JSON.stringify(payload)
                }
            );


            // Read the server response.

            const data = await response.json();


            if (!response.ok || data.status !== "OK") {

                throw new Error(
                    data.message ||
                    "Die Nachricht konnte nicht gespeichert werden."
                );

            }


            // Success message.

            formResult.className = "form-result success";

            formResult.textContent =
                "Vielen Dank! Ihre Nachricht wurde erfolgreich übermittelt.";

            contactForm.reset();


        } catch (error) {

            console.error(
                "GRATIA Kontaktformular:",
                error
            );

            formResult.className = "form-result error";

            if (error instanceof TypeError) {

                formResult.textContent =
                    "Der Server ist momentan nicht erreichbar. Bitte versuchen Sie es später erneut.";

            } else {

                formResult.textContent =
                    error.message ||
                    "Leider konnte die Nachricht nicht gespeichert werden.";

            }

        } finally {

            // Restore the submit button.

            submitButton.disabled = false;
            submitButton.innerHTML = originalButtonText;

            formResult.style.display = "block";

            contactForm.dataset.submitting = "false";

        }

    });

});


/* =========================================================
   9. TEAM MOBILE SLIDER
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {

    const teamSlider = document.querySelector(".team-images");

    if (!teamSlider) {
        return;
    }

    const slides = teamSlider.querySelectorAll(".team-image");
    const dots = teamSlider.querySelectorAll(".team-slider-dot");

    const prevButton = teamSlider.querySelector(".team-slider-prev");
    const nextButton = teamSlider.querySelector(".team-slider-next");

    if (slides.length < 2) {
        return;
    }

    let currentSlide = 0;
    let sliderTimer = null;


    // Display the selected slide.

    function showSlide(index) {

        currentSlide = (index + slides.length) % slides.length;

        slides.forEach((slide, i) => {

            slide.classList.toggle(
                "active",
                i === currentSlide
            );

        });

        dots.forEach((dot, i) => {

            dot.classList.toggle(
                "active",
                i === currentSlide
            );

        });

    }


    // Automatically change slides on mobile.

    function startSlider() {

        clearInterval(sliderTimer);

        if (window.innerWidth <= 760) {

            sliderTimer = setInterval(() => {

                showSlide(currentSlide + 1);

            }, 4500);

        }

    }


    // Initialize the mobile slider.

    if (window.innerWidth <= 760) {

        showSlide(0);
        startSlider();

    }


    // Previous slide.

    if (prevButton) {

        prevButton.addEventListener("click", () => {

            if (window.innerWidth <= 760) {

                showSlide(currentSlide - 1);
                startSlider();

            }

        });

    }


    // Next slide.

    if (nextButton) {

        nextButton.addEventListener("click", () => {

            if (window.innerWidth <= 760) {

                showSlide(currentSlide + 1);
                startSlider();

            }

        });

    }


    // Slide navigation using dots.

    dots.forEach((dot, index) => {

        dot.addEventListener("click", () => {

            if (window.innerWidth <= 760) {

                showSlide(index);
                startSlider();

            }

        });

    });


    // Adjust the slider when the screen size changes.

    window.addEventListener("resize", () => {

        if (window.innerWidth > 760) {

            clearInterval(sliderTimer);

            slides.forEach((slide) => {
                slide.classList.remove("active");
            });

        } else {

            showSlide(currentSlide);
            startSlider();

        }

    });

});


/* =========================================================
   10. BACK TO TOP BUTTON
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {

    const backToTopButton = document.getElementById("backToTop");

    if (!backToTopButton) {
        return;
    }


    // Show the button after scrolling down.

    function updateBackToTop() {

        if (window.scrollY > 300) {

            backToTopButton.classList.add("is-visible");

        } else {

            backToTopButton.classList.remove("is-visible");

        }

    }


    // Check the initial page position.

    updateBackToTop();


    // Update visibility while scrolling.

    window.addEventListener("scroll", updateBackToTop, {
        passive: true
    });


    // Scroll to the top.

    backToTopButton.addEventListener("click", (event) => {

        event.preventDefault();

        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });

    });

});



/* =========================================
   GRATIA – BEWERBUNGSFORMULAR
========================================= */

const applicationForm = document.getElementById(
    "gratia-application-form"
);

if (applicationForm) {
    const submitButton = applicationForm.querySelector(
        'button[type="submit"]'
    );

    const applicationResult = document.createElement("p");
    applicationResult.className = "application-note";
    applicationResult.setAttribute("role", "status");
    applicationResult.setAttribute("aria-live", "polite");

    applicationForm.appendChild(applicationResult);

    applicationForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        if (!applicationForm.reportValidity()) {
            return;
        }

        const originalText = submitButton.textContent;

        submitButton.disabled = true;
        submitButton.textContent = "Wird gesendet ...";
        applicationResult.textContent = "";

        try {
            const formData = new FormData(applicationForm);

            const response = await fetch(
                "http://localhost:3000/api/applications",
                {
                    method: "POST",
                    body: formData
                }
            );

            const data = await response.json();

            if (!response.ok || data.status !== "OK") {
                throw new Error(
                    data.message || "Die Bewerbung konnte nicht gesendet werden."
                );
            }

            applicationResult.style.color = "#176534";
            applicationResult.textContent =
                "Vielen Dank! Ihre Bewerbung wurde erfolgreich gesendet.";

            applicationForm.reset();

        } catch (error) {
            console.error("Bewerbungsfehler:", error);

            applicationResult.style.color = "#a12b2b";
            applicationResult.textContent =
                error.message ||
                "Fehler beim Senden. Bitte versuchen Sie es erneut.";
        } finally {
            submitButton.disabled = false;
            submitButton.textContent = originalText;
        }
    });
}

document.addEventListener("DOMContentLoaded", () => {
    const slides = document.querySelectorAll(".team-slide");
    const dots = document.querySelectorAll(".slide-dot");
    const prevButton = document.querySelector(".slide-btn.prev");
    const nextButton = document.querySelector(".slide-btn.next");

    if (!slides.length || !prevButton || !nextButton) return;

    let currentSlide = 0;
    let slideTimer;

    function showSlide(index) {
        currentSlide = (index + slides.length) % slides.length;

        slides.forEach((slide, i) => {
            slide.classList.toggle("active", i === currentSlide);
        });

        dots.forEach((dot, i) => {
            dot.classList.toggle("active", i === currentSlide);
        });
    }

    function startSlideshow() {
        clearInterval(slideTimer);

        slideTimer = setInterval(() => {
            showSlide(currentSlide + 1);
        }, 5000);
    }

    prevButton.addEventListener("click", () => {
        showSlide(currentSlide - 1);
        startSlideshow();
    });

    nextButton.addEventListener("click", () => {
        showSlide(currentSlide + 1);
        startSlideshow();
    });

    dots.forEach((dot, index) => {
        dot.addEventListener("click", () => {
            showSlide(index);
            startSlideshow();
        });
    });

    showSlide(0);
    startSlideshow();
});