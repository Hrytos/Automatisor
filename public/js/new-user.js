(function () {
  "use strict";

  const form = document.getElementById("newUserForm");
  const errorEl = document.getElementById("formError");
  const aboutYouErrorEl = document.getElementById("aboutYouError");
  const successPanel = document.getElementById("successPanel");
  const submitBtn = document.getElementById("submitBtn");
  const moreQuestionsBtn = document.getElementById("moreQuestionsBtn");
  const backToRequiredBtn = document.getElementById("backToRequiredBtn");
  const requiredPanel = document.getElementById("requiredPanel");
  const optionalPanel = document.getElementById("optionalPanel");
  const qContainer = document.getElementById("questionnaireContainer");
  const signupIntro = document.getElementById("signupIntro");
  const signupPageTitle = document.getElementById("signupPageTitle");
  const mapsPreviewLink = document.getElementById("mapsPreviewLink");
  const sectionToggleBar = document.getElementById("sectionToggleBar");

  const answers = {};
  const openDropdowns = new Set();

  function setActiveSection(active) {
    if (!moreQuestionsBtn || !backToRequiredBtn) return;
    moreQuestionsBtn.classList.toggle("is-active", active === "optional");
    backToRequiredBtn.classList.toggle("is-active", active === "required");
  }

  const questions = [
    {
      id: "floor_condition",
      label: "How would you describe the floor surface condition?",
      type: "single",
      options: [
        ["Excellent - smooth, level, recently resurfaced", "excellent"],
        ["Good - minor cracks or control joints, well maintained", "good"],
        ["Fair - uneven sections, surface damage present", "fair"],
        ["Poor - significant unevenness, heavy traffic damage", "poor"],
        ["Mixed - varies significantly by zone", "mixed"],
        ["Unknown at this stage", "unknown"],
      ],
    },
    {
      id: "temp_exposure",
      label:
        "Are cold or temperature-controlled zones present, and do transport operatives work in them?",
      type: "single",
      options: [
        ["No - ambient only", "ambient_only"],
        [
          "Cold zones present but transport is ambient-side only",
          "cold_present_ambient_transport",
        ],
        [
          "Transport operatives regularly work in refrigerated zones (35-46F)",
          "refrigerated_exposure",
        ],
        [
          "Transport operatives regularly work in freezer zones (0F or below)",
          "freezer_exposure",
        ],
        [
          "Both refrigerated and freezer zones with sustained operative exposure",
          "both_cold_exposure",
        ],
      ],
    },
    {
      id: "load_format",
      label: "What is the primary load format being moved internally?",
      type: "single",
      options: [
        ["Pallets (standard GMA / CHEP 48x40 in)", "pallets"],
        ["Roll cages or dollies", "roll_cages"],
        ["Totes / bins / KLT containers", "totes"],
        ["Large containers (IBCs, bulk)", "large_containers"],
        ["Mixed - multiple load formats in use", "mixed"],
      ],
    },
    {
      id: "load_weight",
      label: "What is the average gross weight per load unit?",
      type: "single",
      options: [
        ["Under 220 lbs", "under_220lbs"],
        ["220 - 660 lbs", "220_660lbs"],
        ["660 - 1,300 lbs", "660_1300lbs"],
        ["1,300 - 2,200 lbs", "1300_2200lbs"],
        ["Over 2,200 lbs", "over_2200lbs"],
      ],
    },
    {
      id: "wifi_state",
      label:
        "What is the state of the warehouse WiFi / network infrastructure?",
      type: "single",
      options: [
        ["Enterprise-grade WiFi 6 with full facility coverage", "wifi6_full"],
        ["Good coverage with some identified dead spots", "good_with_gaps"],
        ["Patchy - unreliable in multiple zones", "patchy"],
        ["Poor - limited or inconsistent coverage", "poor"],
        ["No WiFi infrastructure in place", "none"],
        ["Unknown at this stage", "unknown"],
      ],
    },
    {
      id: "deployment_constraints",
      label:
        "Are there any known physical constraints that would complicate tugger deployment?",
      type: "multi",
      options: [
        ["Narrow or irregular aisles in key transport zones", "narrow_aisles"],
        ["Floor surface conditions requiring remediation", "floor_remediation"],
        [
          "Restricted dock areas limiting approach or turning space",
          "restricted_docks",
        ],
        [
          "Ramps, inclines, or multi-level transitions on transport routes",
          "ramps_inclines",
        ],
        [
          "High-density pedestrian zones with no feasible segregation path",
          "pedestrian_conflict",
        ],
        ["No significant physical constraints identified", "none"],
      ],
    },
    {
      id: "primary_mhe_type",
      label:
        "What is the primary equipment used for internal material transport?",
      type: "single",
      options: [
        [
          "Manual push - hand pallet jacks or carts (no powered equipment)",
          "manual_push",
        ],
        ["Walkie / walkie-rider pallet jack", "walkie_rider"],
        ["Counterbalance forklift", "counterbalance_forklift"],
        ["Reach truck or narrow-aisle truck", "reach_truck"],
        ["Tugger trains or tow tractors (already in use)", "tugger_existing"],
        ["Mixed - multiple equipment types on different routes", "mixed"],
        ["Unknown at this stage", "unknown"],
      ],
    },
    {
      id: "transport_ftes",
      label:
        "How many FTEs are primarily dedicated to internal material transport at this site (across all shifts)?",
      type: "single",
      options: [
        ["Fewer than 3 FTEs", "under_3"],
        ["3 - 5 FTEs", "3_5"],
        ["6 - 10 FTEs", "6_10"],
        ["11 - 20 FTEs", "11_20"],
        ["More than 20 FTEs", "over_20"],
        ["Unknown at this stage", "unknown"],
      ],
    },
    {
      id: "moves_per_shift",
      label:
        "Approximately how many internal transport moves occur per shift at this site?",
      type: "single",
      options: [
        ["Fewer than 20 moves per shift", "under_20"],
        ["20 - 50 moves per shift", "20_50"],
        ["51 - 150 moves per shift", "51_150"],
        ["151 - 300 moves per shift", "151_300"],
        ["More than 300 moves per shift", "over_300"],
        ["Unknown at this stage", "unknown"],
      ],
    },
    {
      id: "route_count",
      label:
        "How many distinct recurring internal transport routes operate at this site?",
      type: "single",
      options: [
        ["1 route (single fixed loop)", "1"],
        ["2 - 3 routes", "2_3"],
        ["4 - 6 routes", "4_6"],
        ["More than 6 routes", "over_6"],
        ["Unknown at this stage", "unknown"],
      ],
    },
    {
      id: "transport_overtime",
      label:
        "Is there evidence of regular or persistent overtime in internal transport roles at this site?",
      type: "single",
      options: [
        ["No evidence of regular overtime", "none"],
        ["Occasional overtime during peak periods only", "seasonal"],
        ["Regular overtime most weeks (estimated >10% of hours)", "regular"],
        [
          "Heavy overtime sustained year-round (estimated >20% of hours)",
          "heavy",
        ],
        ["Unknown at this stage", "unknown"],
      ],
    },
    {
      id: "transport_attrition",
      label:
        "How would you characterise attrition in transport roles at this site?",
      type: "single",
      options: [
        ["Low - roles appear stable, infrequent open postings", "low"],
        [
          "Moderate - some turnover, recurring postings for same roles",
          "moderate",
        ],
        ["High - frequent postings, short tenure signals in reviews", "high"],
        [
          "Very high - near-constant open roles, strong churn signals",
          "very_high",
        ],
        ["Unknown at this stage", "unknown"],
      ],
    },
    {
      id: "ceiling_clearance",
      label:
        "What is the minimum ceiling or structural clearance along the primary internal transport routes?",
      type: "single",
      options: [
        ["Under 12 ft", "under_12ft"],
        ["12 - 16 ft", "12_16ft"],
        ["Over 16 ft", "over_16ft"],
        ["Unknown at this stage", "unknown"],
      ],
    },
    {
      id: "doorway_width",
      label:
        "What is the narrowest doorway or opening along the primary transport routes?",
      type: "single",
      options: [
        ["Under 8 ft", "under_8ft"],
        ["8 - 10 ft", "8_10ft"],
        ["Over 10 ft", "over_10ft"],
        ["No restricting doorways on routes", "unrestricted"],
        ["Unknown at this stage", "unknown"],
      ],
    },
    {
      id: "site_layout",
      label: "How is the warehouse operation physically structured?",
      type: "single",
      options: [
        ["Single building - all transport is internal", "single_building"],
        [
          "Multiple connected buildings - transport is under cover throughout",
          "multi_connected",
        ],
        [
          "Multiple separate buildings - transport crosses outdoor areas",
          "multi_separate",
        ],
        ["Unknown at this stage", "unknown"],
      ],
    },
    {
      id: "charging_feasibility",
      label:
        "Is there available space and electrical capacity near the primary transport routes for charging stations?",
      type: "single",
      options: [
        [
          "Yes - space and 240V electrical capacity confirmed or likely available",
          "feasible",
        ],
        [
          "Partial - space available but electrical upgrade likely needed",
          "partial",
        ],
        [
          "Unlikely - no clear space or electrical capacity near routes",
          "unlikely",
        ],
        ["Unknown at this stage", "unknown"],
      ],
    },
    {
      id: "lease_remaining",
      label:
        "How many years remain on this facility's lease or ownership commitment?",
      type: "single",
      options: [
        ["Less than 2 years", "under_2yr"],
        ["2 - 3 years", "2_3yr"],
        ["4 - 7 years", "4_7yr"],
        ["More than 7 years", "over_7yr"],
        ["Owned (no lease)", "owned"],
        ["Unknown at this stage", "unknown"],
      ],
    },
    {
      id: "capex_cycle",
      label:
        "When does this company typically finalise its annual capital expenditure budget?",
      type: "single",
      options: [
        ["Q1 (January - March)", "q1"],
        ["Q2 (April - June)", "q2"],
        ["Q3 (July - September)", "q3"],
        ["Q4 (October - December)", "q4"],
        ["Continuous / rolling budget process", "rolling"],
        ["Unknown at this stage", "unknown"],
      ],
    },
    {
      id: "competitor_automation",
      label:
        "Are direct competitors at similar facilities known to have deployed automated internal transport?",
      type: "single",
      options: [
        ["Yes - confirmed at direct competitors", "confirmed"],
        [
          "Likely - strong industry signals but not confirmed at direct competitors",
          "likely",
        ],
        ["No - not known to have automated internal transport", "none"],
        ["Unknown at this stage", "unknown"],
      ],
    },
    {
      id: "annual_transport_labour_cost",
      label:
        "What is the estimated annual fully-loaded cost of the transport labour force at this site?",
      type: "single",
      options: [
        ["Under $200,000 per year", "under_200k"],
        ["$200,000 - $500,000 per year", "200_500k"],
        ["$500,000 - $1,000,000 per year", "500k_1m"],
        ["$1,000,000 - $2,000,000 per year", "1_2m"],
        ["Over $2,000,000 per year", "over_2m"],
        ["Unknown at this stage", "unknown"],
      ],
    },
    {
      id: "payback_expectation",
      label:
        "What payback period would this operator typically require to approve an automation investment of this scale?",
      type: "single",
      options: [
        ["Under 12 months", "under_12m"],
        ["12 - 18 months", "12_18m"],
        ["18 - 36 months", "18_36m"],
        ["Over 36 months acceptable", "over_36m"],
        ["Unknown at this stage", "unknown"],
      ],
    },
  ];

  function showError(message) {
    errorEl.textContent = message;
    errorEl.classList.remove("hidden");
  }
  function clearError() {
    errorEl.textContent = "";
    errorEl.classList.add("hidden");
  }
  function showAboutYouError(message) {
    if (!aboutYouErrorEl) return;
    aboutYouErrorEl.textContent = message;
    aboutYouErrorEl.classList.remove("hidden");
  }
  function clearAboutYouError() {
    if (!aboutYouErrorEl) return;
    aboutYouErrorEl.textContent = "";
    aboutYouErrorEl.classList.add("hidden");
  }

  function val(id) {
    const el = document.getElementById(id);
    return el ? el.value.trim() : "";
  }

  function updateMapsLink() {
    if (!mapsPreviewLink) return;
    const company = val("company_name");
    const address = fullAddress();
    const query = [company, address].filter(Boolean).join(", ");
    if (!query) {
      mapsPreviewLink.href = "#";
      mapsPreviewLink.setAttribute("aria-disabled", "true");
      mapsPreviewLink.classList.add("disabled");
      return;
    }
    mapsPreviewLink.href = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
    mapsPreviewLink.setAttribute("aria-disabled", "false");
    mapsPreviewLink.classList.remove("disabled");
  }

  function validIntro() {
    return (
      val("first_name") &&
      val("last_name") &&
      val("company_name") &&
      val("job_title") &&
      val("company_email") &&
      val("domain")
    );
  }
  function validSite() {
    return (
      val("street") &&
      val("city") &&
      val("site_size_sqft") &&
      val("typical_aisle_width") &&
      val("typical_one_way_travel_distance")
    );
  }

  function fullAddress() {
    return [
      val("street"),
      val("city"),
      val("state"),
      val("zip"),
      val("country"),
    ]
      .filter(Boolean)
      .join(", ");
  }

  const disallowedPersonalEmailDomains = new Set([
    "gmail.com",
    "googlemail.com",
    "yahoo.com",
    "yahoo.co.in",
    "yahoo.co.uk",
    "outlook.com",
    "hotmail.com",
    "live.com",
    "msn.com",
    "icloud.com",
    "me.com",
    "mac.com",
    "aol.com",
    "proton.me",
    "protonmail.com",
    "pm.me",
    "gmx.com",
    "mail.com",
    "zoho.com",
    "yandex.com",
    "qq.com",
  ]);

  function isValidWorkEmail() {
    const email = val("company_email").toLowerCase();
    if (!email.includes("@")) return false;
    const emailDomain = email.split("@")[1];
    return Boolean(emailDomain && !disallowedPersonalEmailDomains.has(emailDomain));
  }

  function allRequiredValid() {
    return Boolean(validIntro() && validSite() && isValidWorkEmail());
  }

  function syncSubmitState() {
    submitBtn.disabled = !allRequiredValid();
  }

  function renderQuestions() {
    qContainer.innerHTML = "";
    questions.forEach((q) => {
      const row = document.createElement("div");
      row.className = "q-row";

      const labelWrap = document.createElement("div");
      labelWrap.className = "q-label-wrap";
      const label = document.createElement("label");
      label.className = "q-inline-label";
      label.textContent = q.label;
      label.setAttribute("for", `q_${q.id}`);
      const kind = document.createElement("span");
      kind.className = "q-select-type";
      kind.textContent = q.type === "multi" ? "Multi select" : "Single select";
      labelWrap.appendChild(label);
      labelWrap.appendChild(kind);

      const select = document.createElement("select");
      select.id = `q_${q.id}`;
      select.className = "q-inline-select custom-native";

      if (q.type === "single") {
        const blank = document.createElement("option");
        blank.value = "";
        blank.textContent = "Select";
        select.appendChild(blank);
        q.options.forEach(([text, value]) => {
          const opt = document.createElement("option");
          opt.value = value;
          opt.textContent = text;
          if (answers[q.id] === value) opt.selected = true;
          select.appendChild(opt);
        });
        select.addEventListener("change", () => {
          if (select.value) answers[q.id] = select.value;
          else delete answers[q.id];
        });
      } else {
        select.multiple = true;
        q.options.forEach(([text, value]) => {
          const opt = document.createElement("option");
          opt.value = value;
          opt.textContent = text;
          const arr = Array.isArray(answers[q.id]) ? answers[q.id] : [];
          if (arr.includes(value)) opt.selected = true;
          select.appendChild(opt);
        });
        select.addEventListener("change", () => {
          const vals = Array.from(select.selectedOptions).map((o) => o.value);
          if (vals.length) answers[q.id] = vals;
          else delete answers[q.id];
        });
      }

      row.appendChild(labelWrap);
      row.appendChild(select);
      qContainer.appendChild(row);
    });
    enhanceCustomSelects(qContainer);
  }

  function closeAllDropdowns(except) {
    openDropdowns.forEach((menu) => {
      if (except && menu === except) return;
      menu.classList.add("hidden");
      if (menu.__trigger) menu.__trigger.setAttribute("aria-expanded", "false");
    });
  }

  function updateTriggerLabel(select, trigger) {
    if (!select.multiple) {
      const opt = select.options[select.selectedIndex];
      trigger.querySelector(".custom-select-label").textContent = opt
        ? opt.textContent
        : "Select";
      return;
    }
    const selected = Array.from(select.selectedOptions);
    trigger.querySelector(".custom-select-label").textContent = selected.length
      ? `${selected.length} selected`
      : "Select one or more";
  }

  function enhanceCustomSelects(root) {
    const selects = Array.from(
      (root || document).querySelectorAll("select.custom-native"),
    );
    selects.forEach((select) => {
      if (select.dataset.enhanced === "true") return;
      select.dataset.enhanced = "true";
      select.classList.add("native-hidden");

      const wrap = document.createElement("div");
      wrap.className = "custom-select-wrap";

      const trigger = document.createElement("button");
      trigger.type = "button";
      trigger.className = "custom-select-trigger";
      trigger.setAttribute("aria-expanded", "false");
      trigger.innerHTML = `<span class="custom-select-label"></span><span class="custom-select-caret">▾</span>`;

      const menu = document.createElement("div");
      menu.className = "custom-select-menu hidden";
      menu.__trigger = trigger;

      Array.from(select.options).forEach((opt, idx) => {
        const optionBtn = document.createElement("button");
        optionBtn.type = "button";
        optionBtn.className = "custom-select-option";
        optionBtn.dataset.value = opt.value;
        optionBtn.dataset.index = String(idx);
        optionBtn.textContent = opt.textContent || "";

        optionBtn.addEventListener("click", () => {
          if (!select.multiple) {
            select.value = opt.value;
            Array.from(menu.querySelectorAll(".custom-select-option")).forEach(
              (b) => b.classList.remove("selected"),
            );
            optionBtn.classList.add("selected");
            menu.classList.add("hidden");
            trigger.setAttribute("aria-expanded", "false");
          } else {
            opt.selected = !opt.selected;
            optionBtn.classList.toggle("selected", opt.selected);
          }
          updateTriggerLabel(select, trigger);
          select.dispatchEvent(new Event("change", { bubbles: true }));
          select.dispatchEvent(new Event("input", { bubbles: true }));
        });

        if (!select.multiple && opt.selected)
          optionBtn.classList.add("selected");
        if (select.multiple && opt.selected)
          optionBtn.classList.add("selected");
        menu.appendChild(optionBtn);
      });

      trigger.addEventListener("click", (e) => {
        e.preventDefault();
        const isOpen = !menu.classList.contains("hidden");
        closeAllDropdowns(menu);
        if (isOpen) {
          menu.classList.add("hidden");
          trigger.setAttribute("aria-expanded", "false");
        } else {
          menu.classList.remove("hidden");
          trigger.setAttribute("aria-expanded", "true");
          openDropdowns.add(menu);
        }
      });

      select.addEventListener("change", () => {
        updateTriggerLabel(select, trigger);
        const buttons = Array.from(
          menu.querySelectorAll(".custom-select-option"),
        );
        buttons.forEach((btn) => {
          const idx = Number(btn.dataset.index);
          const option = select.options[idx];
          btn.classList.toggle("selected", Boolean(option && option.selected));
        });
      });

      updateTriggerLabel(select, trigger);
      wrap.appendChild(trigger);
      wrap.appendChild(menu);
      select.insertAdjacentElement("afterend", wrap);
    });
  }

  if (moreQuestionsBtn) {
    moreQuestionsBtn.addEventListener("click", () => {
      optionalPanel.classList.remove("hidden");
      requiredPanel.classList.add("hidden");
      if (sectionToggleBar) sectionToggleBar.classList.remove("hidden");
      setActiveSection("optional");
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }
  if (backToRequiredBtn) {
    backToRequiredBtn.addEventListener("click", () => {
      optionalPanel.classList.add("hidden");
      requiredPanel.classList.remove("hidden");
      setActiveSection("required");
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    clearError();
    if (!validIntro())
      return showError("Please fill all required fields in About You.");
    if (!validSite())
      return showError("Please fill required fields in About the Site.");
    if (!isValidWorkEmail()) {
      showAboutYouError(
        "Please use your work email. Personal emails like Gmail/Yahoo/Outlook are not allowed.",
      );
      return;
    }

    const questionnaire_answers = {
      ...answers,
      company_name: val("company_name"),
      site_location: fullAddress(),
      square_footage: val("site_size_sqft"),
    };
    if (val("typical_aisle_width"))
      questionnaire_answers.aisle_width = val("typical_aisle_width");
    if (val("typical_one_way_travel_distance"))
      questionnaire_answers.travel_distance = val(
        "typical_one_way_travel_distance",
      );
    if (val("nature_of_operations"))
      questionnaire_answers.nature_of_operations = val("nature_of_operations");

    submitBtn.disabled = true;
    submitBtn.textContent = "Submitting...";
    try {
      const res = await fetch("/api/accounts/new-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          first_name: val("first_name"),
          last_name: val("last_name"),
          company_name: val("company_name"),
          job_title: val("job_title"),
          company_email: val("company_email"),
          domain: val("domain"),
          street: val("street") || null,
          city: val("city") || null,
          state: val("state") || null,
          zip: val("zip") || null,
          country: val("country") || null,
          full_address: fullAddress(),
          site_size_sqft: Number(val("site_size_sqft")),
          typical_aisle_width: val("typical_aisle_width") || null,
          typical_one_way_travel_distance:
            val("typical_one_way_travel_distance") || null,
          nature_of_operations: val("nature_of_operations") || null,
          questionnaire_answers,
        }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        const detail = body && body.detail;
        if (typeof detail === "string") throw new Error(detail);
        if (Array.isArray(detail) && detail.length)
          throw new Error(detail[0].msg || "Could not submit");
        throw new Error("Could not submit");
      }
      form.classList.add("hidden");
      if (signupPageTitle) signupPageTitle.classList.add("hidden");
      if (signupIntro) signupIntro.classList.add("hidden");
      successPanel.classList.remove("hidden");
      clearAboutYouError();
    } catch (err) {
      showError(err.message || "Something went wrong.");
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = "Request a diagnostic report";
      syncSubmitState();
    }
  });

  renderQuestions();
  enhanceCustomSelects(document);
  updateMapsLink();

  const emailInput = document.getElementById("company_email");
  function checkEmailInline() {
    if (!val("company_email")) {
      clearAboutYouError();
      return;
    }
    if (!isValidWorkEmail()) {
      showAboutYouError(
        "Please use your work email. Personal emails like Gmail/Yahoo/Outlook are not allowed.",
      );
    } else {
      clearAboutYouError();
    }
  }
  if (emailInput) emailInput.addEventListener("blur", checkEmailInline);

  form.addEventListener("input", syncSubmitState);
  form.addEventListener("change", syncSubmitState);
  form.addEventListener("input", updateMapsLink);
  form.addEventListener("change", updateMapsLink);
  syncSubmitState();

  document.addEventListener("click", (e) => {
    const target = e.target;
    if (!(target instanceof Element)) return;
    if (!target.closest(".custom-select-wrap")) {
      closeAllDropdowns();
    }
  });
})();
