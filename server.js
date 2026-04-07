const express = require('express');
const path = require('path');
const { createClient } = require("@supabase/supabase-js");

const app = express();
const PORT = process.env.PORT || 3000;
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

app.use(express.json());

const QUESTIONNAIRE_ALLOWED_KEYS = new Set([
  "company_name",
  "site_location",
  "square_footage",
  "aisle_width",
  "floor_condition",
  "temp_exposure",
  "travel_distance",
  "load_format",
  "load_weight",
  "wifi_state",
  "deployment_constraints",
  "primary_mhe_type",
  "transport_ftes",
  "moves_per_shift",
  "route_count",
  "transport_overtime",
  "transport_attrition",
  "ceiling_clearance",
  "doorway_width",
  "site_layout",
  "charging_feasibility",
  "lease_remaining",
  "capex_cycle",
  "competitor_automation",
  "annual_transport_labour_cost",
  "payback_expectation",
  "nature_of_operations",
]);

function normalizeDomain(raw) {
  let s = String(raw || "").trim().toLowerCase();
  if (s.includes("://")) {
    try {
      s = new URL(s).hostname || "";
    } catch {
      s = "";
    }
  }
  s = s.replace(/^\.+/, "");
  if (s.startsWith("www.")) s = s.slice(4);
  s = s.replace(/\.+/g, ".").replace(/\.+$/, "");
  if (!s || s.includes(" ") || !s.includes(".")) {
    throw new Error("Invalid domain");
  }
  return s;
}

function normalizeEmail(raw) {
  return String(raw || "").trim().toLowerCase();
}

const DISALLOWED_PERSONAL_EMAIL_DOMAINS = new Set([
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

function assertBusinessEmail(email) {
  const normalized = normalizeEmail(email);
  if (!normalized.includes("@")) throw new Error("Invalid company email");
  const emailDomain = normalized.split("@")[1] || "";
  if (!emailDomain) throw new Error("Invalid company email");
  if (DISALLOWED_PERSONAL_EMAIL_DOMAINS.has(emailDomain)) {
    throw new Error("Please use your work email address");
  }
}

function buildFullAddress(body) {
  return [body.street, body.city, body.state, body.zip, body.country]
    .map((v) => String(v || "").trim())
    .filter(Boolean)
    .join(", ");
}

function normalizeCountry(raw) {
  const s = String(raw || "").trim().toLowerCase();
  if (!s) return "";
  if (s === "us" || s === "usa" || s === "united states" || s === "united states of america") {
    return "USA";
  }
  if (s === "ca" || s === "canada") {
    return "Canada";
  }
  throw new Error("Country must be USA or Canada");
}

function normalizeAddressValue(raw) {
  return String(raw || "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeCountryForMatch(raw) {
  const s = normalizeAddressValue(raw);
  if (s === "us" || s === "usa" || s === "united states" || s === "united states of america") {
    return "usa";
  }
  if (s === "ca" || s === "canada") {
    return "canada";
  }
  return s;
}

function normalizeAddressForMatch(input) {
  if (!input || typeof input !== "object") {
    return normalizeAddressValue(input);
  }
  return [
    input.street,
    input.city,
    input.state,
    input.zip,
    normalizeCountryForMatch(input.country),
  ]
    .map((v) => normalizeAddressValue(v))
    .filter(Boolean)
    .join(" ");
}

// Serve static files (CSS, JS, assets)
app.use(express.static(path.join(__dirname, 'public')));

// Serve the main landing page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'index.html'));
});

app.get('/new-user', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'new-user.html'));
});

app.post('/api/accounts/new-user', async (req, res) => {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return res.status(500).json({
      detail: "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in Automatisor env",
    });
  }

  const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  try {
    const body = req.body || {};
    const normalizedCountry = normalizeCountry(body.country);
    body.country = normalizedCountry;
    const domain = normalizeDomain(body.domain);
    assertBusinessEmail(body.company_email);

    const companyName = String(body.company_name || "").trim();
    const firstName = String(body.first_name || "").trim();
    const lastName = String(body.last_name || "").trim();
    const jobTitle = String(body.job_title || "").trim();
    const companyEmail = normalizeEmail(body.company_email);
    const fullAddress = buildFullAddress(body);

    if (!companyName || !firstName || !lastName || !jobTitle || !companyEmail || !fullAddress) {
      return res.status(422).json({ detail: "Missing required signup fields" });
    }

    let statusLabel = "existing_account_existing_site";

    // 1) account by domain
    const { data: accountRows, error: accountErr } = await db
      .from("accounts")
      .select("account_id, company_name")
      .eq("account_domain", domain)
      .limit(1);
    if (accountErr) throw accountErr;

    let accountId;
    let finalCompanyName = companyName;
    if (accountRows && accountRows.length) {
      accountId = accountRows[0].account_id;
      finalCompanyName = accountRows[0].company_name || companyName;
    } else {
      const { data: createdAccount, error: createAccountErr } = await db
        .from("accounts")
        .insert({ company_name: companyName, account_domain: domain })
        .select("account_id")
        .single();
      if (createAccountErr) throw createAccountErr;
      accountId = createdAccount.account_id;
      statusLabel = "created_account_created_site";
    }

    // 2) site by account + normalized location match (case/punctuation tolerant)
    const incomingAddressKey = normalizeAddressForMatch({
      street: body.street,
      city: body.city,
      state: body.state,
      zip: body.zip,
      country: body.country,
    });
    const { data: siteRows, error: siteErr } = await db
      .from("account_sites")
      .select("site_id, street, city, state, zip, country, full_address")
      .eq("account_id", accountId)
      .eq("is_archived", false)
      .limit(200);
    if (siteErr) throw siteErr;

    let siteId;
    const matchedSite = (siteRows || []).find((site) => {
      const siteAddressKey =
        normalizeAddressForMatch({
          street: site.street,
          city: site.city,
          state: site.state,
          zip: site.zip,
          country: site.country,
        }) || normalizeAddressForMatch(site.full_address);
      return siteAddressKey && siteAddressKey === incomingAddressKey;
    });
    if (matchedSite) {
      siteId = matchedSite.site_id;
    } else {
      const { data: createdSite, error: createSiteErr } = await db
        .from("account_sites")
        .insert({
          account_id: accountId,
          street: String(body.street || "").trim() || null,
          city: String(body.city || "").trim() || null,
          state: String(body.state || "").trim() || null,
          zip: String(body.zip || "").trim() || null,
          country: String(body.country || "").trim() || null,
          full_address: fullAddress,
          confidence_score: 0.9,
          company_name: finalCompanyName,
          metadata: { source: "Automatisor_new_sign_up" },
        })
        .select("site_id")
        .single();
      if (createSiteErr) throw createSiteErr;
      siteId = createdSite.site_id;
      if (statusLabel !== "created_account_created_site") {
        statusLabel = "existing_account_created_site";
      }
    }

    // 3) contact by account + name + email
    const { data: contactRows, error: contactLookupErr } = await db
      .from("contacts")
      .select("id, account_id, email, first_name, last_name")
      .eq("account_id", accountId)
      .eq("email", companyEmail)
      .eq("first_name", firstName)
      .eq("last_name", lastName)
      .limit(1);
    if (contactLookupErr) throw contactLookupErr;

    let contactAction = "existing";
    if (!contactRows || contactRows.length === 0) {
      // contacts.email is globally unique, so guard duplicate-email case gracefully
      const { data: emailRows, error: emailLookupErr } = await db
        .from("contacts")
        .select("id")
        .eq("email", companyEmail)
        .limit(1);
      if (emailLookupErr) throw emailLookupErr;

      if (!emailRows || emailRows.length === 0) {
        const { error: createContactErr } = await db
          .from("contacts")
          .insert({
            email: companyEmail,
            first_name: firstName,
            last_name: lastName,
            full_name: `${firstName} ${lastName}`.trim(),
            company_name: finalCompanyName,
            job_title: jobTitle,
            account_id: accountId,
            metadata: { source: "Automatisor_new_sign_up" },
          });
        if (createContactErr) throw createContactErr;
        contactAction = "created";
      }
    }

    // 4) account_sites_report questionnaire_answers only
    const incomingAnswers = body.questionnaire_answers || {};
    const filteredAnswers = Object.fromEntries(
      Object.entries(incomingAnswers).filter(([k]) => QUESTIONNAIRE_ALLOWED_KEYS.has(k))
    );
    if (!("company_name" in filteredAnswers)) filteredAnswers.company_name = finalCompanyName;
    if (!("site_location" in filteredAnswers)) filteredAnswers.site_location = fullAddress;
    if (!("square_footage" in filteredAnswers) && body.site_size_sqft != null) {
      filteredAnswers.square_footage = String(body.site_size_sqft);
    }
    if (!("aisle_width" in filteredAnswers) && body.typical_aisle_width) {
      filteredAnswers.aisle_width = String(body.typical_aisle_width);
    }
    if (!("travel_distance" in filteredAnswers) && body.typical_one_way_travel_distance) {
      filteredAnswers.travel_distance = String(body.typical_one_way_travel_distance);
    }

    const { data: asrRows, error: asrLookupErr } = await db
      .from("account_sites_report")
      .select("report_id")
      .eq("site_id", siteId)
      .limit(1);
    if (asrLookupErr) throw asrLookupErr;

    if (asrRows && asrRows.length) {
      const { error: asrUpdateErr } = await db
        .from("account_sites_report")
        .update({ questionnaire_answers: filteredAnswers })
        .eq("report_id", asrRows[0].report_id);
      if (asrUpdateErr) throw asrUpdateErr;
    } else {
      const { error: asrCreateErr } = await db
        .from("account_sites_report")
        .insert({
          account_id: accountId,
          site_id: siteId,
          questionnaire_answers: filteredAnswers,
        });
      if (asrCreateErr) throw asrCreateErr;
    }

    // 5) operational event for site size
    if (body.site_size_sqft != null && String(body.site_size_sqft).trim() !== "") {
      const { error: eventErr } = await db.from("account_event_operational").insert({
        account_id: accountId,
        company_name: finalCompanyName,
        site_id: siteId,
        event_type: "Site size detector",
        verified: true,
        metadata: {
          value: Number(body.site_size_sqft),
          source: "Automatisor_new_sign_up",
          confidence_score: 0.9,
        },
      });
      if (eventErr) throw eventErr;
    }

    return res.json({
      status: statusLabel,
      account_id: accountId,
      site_id: siteId,
      contact_action: contactAction,
    });
  } catch (err) {
    const detail = err && err.message ? err.message : String(err);
    const statusCode = /Invalid domain|company email|work email|Country must be USA or Canada/i.test(detail) ? 422 : 500;
    res.status(statusCode).json({ detail });
  }
});

// Catch-all for undefined routes
app.use((req, res) => {
  res.status(404).send('Page not found');
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`WareIQ server running at http://localhost:${PORT}`);
  });
}

module.exports = app;
