const menuToggle = document.querySelector(".menu-toggle");
const mobileMenu = document.querySelector("#mobile-menu");

menuToggle?.addEventListener("click", () => {
  const isOpen = mobileMenu.classList.toggle("open");
  menuToggle.setAttribute("aria-expanded", String(isOpen));
  menuToggle.setAttribute("aria-label", isOpen ? "Close menu" : "Open menu");
  menuToggle.textContent = isOpen ? "×" : "☰";
});

mobileMenu?.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", () => {
    mobileMenu.classList.remove("open");
    menuToggle?.setAttribute("aria-expanded", "false");
    if (menuToggle) {
      menuToggle.setAttribute("aria-label", "Open menu");
      menuToggle.textContent = "☰";
    }
  });
});

document.querySelector("#year").textContent = new Date().getFullYear();

/* ---------- reveal on scroll ---------- */
const revealEls = document.querySelectorAll(".reveal");
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

if ("IntersectionObserver" in window && !reducedMotion) {
  document.documentElement.classList.add("js");
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("in");
          observer.unobserve(entry.target);
        }
      });
    },
    { rootMargin: "0px 0px -8% 0px", threshold: 0.08 }
  );
  revealEls.forEach((el) => observer.observe(el));
}

/* ---------- FAQ: topic filter, search, deep links ---------- */
const faqList = document.querySelector("#faq-list");

if (faqList) {
  const faqItems = [...faqList.querySelectorAll(".faq-item")];
  const chips = [...document.querySelectorAll(".faq-chip")];
  const searchBox = document.querySelector("#faq-search");
  const countEl = document.querySelector("#faq-count");
  const emptyEl = document.querySelector("#faq-empty");
  let activeFilter = "all";

  const applyFaqFilter = () => {
    const query = searchBox.value.trim().toLowerCase();
    let shown = 0;
    faqItems.forEach((item) => {
      const matchesTopic = activeFilter === "all" || item.dataset.cat === activeFilter;
      const matchesText = !query || item.textContent.toLowerCase().includes(query);
      item.hidden = !(matchesTopic && matchesText);
      if (!item.hidden) shown += 1;
    });
    countEl.textContent = `${shown} ${shown === 1 ? "question" : "questions"}`;
    emptyEl.hidden = shown !== 0;
  };

  chips.forEach((chip) => {
    chip.addEventListener("click", () => {
      activeFilter = chip.dataset.filter;
      chips.forEach((c) => c.setAttribute("aria-pressed", String(c === chip)));
      applyFaqFilter();
    });
  });
  searchBox.addEventListener("input", applyFaqFilter);
  applyFaqFilter();
}

const openFaqFromHash = () => {
  const target = location.hash ? document.getElementById(decodeURIComponent(location.hash.slice(1))) : null;
  if (!target || !target.classList.contains("faq-item")) return;
  if (target.hidden) {
    document.querySelector('.faq-chip[data-filter="all"]')?.click();
    const searchBox = document.querySelector("#faq-search");
    if (searchBox?.value) {
      searchBox.value = "";
      searchBox.dispatchEvent(new Event("input"));
    }
  }
  target.open = true;
  target.scrollIntoView({ block: "center" });
};
window.addEventListener("hashchange", openFaqFromHash);
openFaqFromHash();

/* ---------- Nepalis abroad: time finder ---------- */
const tfRange = document.querySelector("#tf-range");

if (tfRange) {
  const NEPAL_TZ = "Asia/Kathmandu";
  const tfOut = document.querySelector("#tf-out");
  const tfNow = document.querySelector("#tf-now");
  const rows = [...document.querySelectorAll(".tf-row")];
  let live = true;

  // Minutes that timeZone is ahead of UTC at the given instant (handles daylight saving).
  const zoneOffset = (timeZone, date) => {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone, hourCycle: "h23", year: "numeric", month: "numeric", day: "numeric",
      hour: "numeric", minute: "numeric", second: "numeric",
    }).formatToParts(date);
    const p = Object.fromEntries(parts.filter((x) => x.type !== "literal").map((x) => [x.type, Number(x.value)]));
    const asUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
    return Math.round((asUtc - Math.floor(date.getTime() / 1000) * 1000) / 60000);
  };

  const formatClock = (minutes) => {
    const h24 = Math.floor(minutes / 60) % 24;
    const m = minutes % 60;
    const suffix = h24 >= 12 ? "PM" : "AM";
    const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
    return `${h12}:${String(m).padStart(2, "0")} ${suffix}`;
  };

  // Kathmandu midnight today, as a UTC timestamp.
  const nepalMidnight = () => {
    const now = new Date();
    const nepalNow = new Date(now.getTime() + zoneOffset(NEPAL_TZ, now) * 60000);
    return Date.UTC(nepalNow.getUTCFullYear(), nepalNow.getUTCMonth(), nepalNow.getUTCDate()) - zoneOffset(NEPAL_TZ, now) * 60000;
  };

  const nowInNepalMinutes = () => {
    const now = new Date();
    const nepalNow = new Date(now.getTime() + zoneOffset(NEPAL_TZ, now) * 60000);
    return nepalNow.getUTCHours() * 60 + nepalNow.getUTCMinutes();
  };

  const render = () => {
    const minutes = Number(tfRange.value);
    const instant = new Date(nepalMidnight() + minutes * 60000);
    const nepalOffset = zoneOffset(NEPAL_TZ, instant);
    const nepalDay = Math.floor((instant.getTime() + nepalOffset * 60000) / 86400000);

    tfOut.textContent = formatClock(minutes);
    tfRange.setAttribute("aria-valuetext", `${formatClock(minutes)} in Kathmandu`);

    rows.forEach((row) => {
      const offset = zoneOffset(row.dataset.tz, instant);
      const local = instant.getTime() + offset * 60000;
      const localMinutes = Math.floor(local / 60000) % 1440;
      const dayDiff = Math.floor(local / 86400000) - nepalDay;
      const hour = Math.floor(localMinutes / 60);
      const dayLabel = dayDiff === 0 ? "Same day" : dayDiff > 0 ? "Next day" : "Previous day";

      row.querySelector('[data-role="time"]').textContent = formatClock(localMinutes);
      row.querySelector('[data-role="when"]').textContent = dayLabel;
      row.querySelector('[data-role="marker"]').style.left = `${(localMinutes / 1440) * 100}%`;
      row.dataset.ok = String(hour >= 7 && hour < 22);
    });
  };

  const snapToNow = () => {
    tfRange.value = String(Math.min(1425, Math.round(nowInNepalMinutes() / 15) * 15));
    render();
  };

  tfRange.addEventListener("input", () => {
    live = false;
    render();
  });
  tfNow.addEventListener("click", () => {
    live = true;
    snapToNow();
  });
  setInterval(() => live && snapToNow(), 30000);
  snapToNow();
}
