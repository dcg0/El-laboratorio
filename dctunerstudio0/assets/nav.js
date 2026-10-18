"use strict";

const mobileMenu = document.querySelector(".mobile-nav");

if (mobileMenu) {
  mobileMenu.querySelectorAll('nav a[href^="#"]').forEach((link) => {
    link.addEventListener("click", () => {
      mobileMenu.open = false;
    });
  });

  document.addEventListener("click", (event) => {
    if (mobileMenu.open && !mobileMenu.contains(event.target)) {
      mobileMenu.open = false;
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && mobileMenu.open) {
      mobileMenu.open = false;
      mobileMenu.querySelector("summary").focus();
    }
  });
}
