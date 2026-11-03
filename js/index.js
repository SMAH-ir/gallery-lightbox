const lightboxModal = document.getElementById("lightboxModal");
const closeModalBtn = document.getElementById("closeModalBtn");
const previewContainer = document.querySelector(".gallery-preview");
const tabLinks = document.querySelectorAll(".lightbox__tab");
const navLeftBtn = document.querySelector(".lightbox__nav-prev");
const navRightBtn = document.querySelector(".lightbox__nav-next");

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

let lastFocusedElement = null;
let isModalOpen = false;

const previewSwiper = new Swiper(".gallery-preview", {
     loop: true,
     autoplay: reduceMotion.matches ? false : {
          delay: 3000,
          disableOnInteraction: false,
          pauseOnMouseEnter: true
     },
     freeMode: true,
     slidesPerView: "auto",
     spaceBetween: 10,
});

const galleryThumbs = new Swiper(".lightbox__thumbs-slider", {
     spaceBetween: 5,
     slidesPerView: "auto",
     freeMode: {
          enabled: true,
          momentum: true,
          momentumRatio: 1,
          sticky: false
     },
     watchSlidesProgress: true,
     slideToClickedSlide: true,
});

const galleryMain = new Swiper(".lightbox__main-slider", {
     spaceBetween: 10,
     loop: false,
     allowTouchMove: true,
     thumbs: { swiper: galleryThumbs },
     on: {
          slideChange() {
               syncActiveTab();
          }
     }
});

const reviewImages = new Swiper(".review__slider", {
     loop: false,
     nested: true,
     allowTouchMove: true,
     touchStartPreventDefault: false,
});

function syncActiveTab() {
     if (!galleryMain.slides.length) return;
     const activeSlide = galleryMain.slides[galleryMain.activeIndex];
     if (!activeSlide) return;
     const currentGroup = activeSlide.dataset.group;

     tabLinks.forEach((link) => {
          const isActive = link.dataset.target === currentGroup;
          link.classList.toggle("lightbox__tab--active", isActive);
          if (isActive) link.setAttribute("aria-current", "true");
          else link.removeAttribute("aria-current");
     });
}

function pauseAutoplay() {
     if (previewSwiper.autoplay && previewSwiper.autoplay.running) {
          previewSwiper.autoplay.stop();
     }
}

function resumeAutoplay() {
     if (reduceMotion.matches || isModalOpen) return;
     if (previewSwiper.autoplay && !previewSwiper.autoplay.running) {
          previewSwiper.autoplay.start();
     }
}

previewContainer.addEventListener("focusin", (e) => {
     if (e.target.matches(":focus-visible")) pauseAutoplay();
});
previewContainer.addEventListener("focusout", resumeAutoplay);

function openModal(startIndex = 0) {
     lastFocusedElement = document.activeElement;
     isModalOpen = true;
     lightboxModal.style.display = "flex";
     document.body.style.overflow = "hidden";
     previewContainer.inert = true;
     pauseAutoplay();
     galleryMain.update();
     galleryThumbs.update();
     reviewImages.update();
     galleryMain.slideTo(startIndex, 0);
     syncActiveTab();
     closeModalBtn.focus();
}

function closeModal() {
     isModalOpen = false;
     lightboxModal.style.display = "none";
     document.body.style.overflow = "";
     previewContainer.inert = false;
     resumeAutoplay();
     if (lastFocusedElement) lastFocusedElement.focus();
}

previewContainer.addEventListener("click", (e) => {
     const img = e.target.closest(".gallery-preview__image");
     if (!img) return;
     const index = parseInt(img.getAttribute("data-index"), 10);
     openModal(index);
});

previewContainer.addEventListener("keydown", (e) => {
     if (e.key !== "Enter" && e.key !== " ") return;
     const img = e.target.closest(".gallery-preview__image");
     if (!img) return;
     e.preventDefault();
     const index = parseInt(img.getAttribute("data-index"), 10);
     openModal(index);
});

closeModalBtn.addEventListener("click", closeModal);

function handlePrev() {
     const activeSlide = galleryMain.slides[galleryMain.activeIndex];
     const nestedSwiperEl = activeSlide.querySelector(".review__slider");

     if (nestedSwiperEl) {
          const nestedSwiper = nestedSwiperEl.swiper;
          if (nestedSwiper.activeIndex > 0) {
               nestedSwiper.slidePrev();
               return;
          }
     }

     if (galleryMain.activeIndex === 0) {
          galleryMain.slideTo(galleryMain.slides.length - 1);
     } else {
          galleryMain.slidePrev();
     }
}

function handleNext() {
     const activeSlide = galleryMain.slides[galleryMain.activeIndex];
     const nestedSwiperEl = activeSlide.querySelector(".review__slider");

     if (nestedSwiperEl) {
          const nestedSwiper = nestedSwiperEl.swiper;
          if (nestedSwiper.activeIndex < nestedSwiper.slides.length - 1) {
               nestedSwiper.slideNext();
               return;
          }
     }

     if (galleryMain.activeIndex === galleryMain.slides.length - 1) {
          galleryMain.slideTo(0);
     } else {
          galleryMain.slideNext();
     }
}

navLeftBtn.addEventListener("click", handlePrev);
navRightBtn.addEventListener("click", handleNext);

[navLeftBtn, navRightBtn].forEach((btn, idx) => {
     btn.addEventListener("keydown", (e) => {
          if (e.key === "Enter" || e.key === " ") {
               e.preventDefault();
               if (idx === 0) handlePrev();
               else handleNext();
          }
     });
});

function goToGroup(groupName) {
     const slides = galleryMain.slides;
     for (let i = 0; i < slides.length; i++) {
          if (slides[i].dataset.group === groupName) {
               galleryMain.slideTo(i);
               syncActiveTab();
               return;
          }
     }
}

tabLinks.forEach((link) => {
     link.addEventListener("click", (e) => {
          e.preventDefault();
          const targetGroup = e.currentTarget.getAttribute("data-target");
          goToGroup(targetGroup);
     });
});

document.addEventListener("keydown", (e) => {
     if (!isModalOpen) return;

     if (e.key === "Escape") {
          closeModal();
          return;
     }

     if (e.key === "ArrowLeft") {
          e.preventDefault();
          handlePrev();
          return;
     }

     if (e.key === "ArrowRight") {
          e.preventDefault();
          handleNext();
          return;
     }

     if (e.key === "Tab") {
          const focusableElements = lightboxModal.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
          const firstElement = focusableElements[0];
          const lastElement = focusableElements[focusableElements.length - 1];

          if (e.shiftKey) {
               if (document.activeElement === firstElement) {
                    lastElement.focus();
                    e.preventDefault();
               }
          } else {
               if (document.activeElement === lastElement) {
                    firstElement.focus();
                    e.preventDefault();
               }
          }
     }
});