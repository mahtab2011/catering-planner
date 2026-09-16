/**
 * Firebase Rules unit tests for ../../firestore.rules.
 *
 * NOT RUN IN THIS SESSION. @firebase/rules-unit-testing drives these
 * tests against the real Firestore emulator, which requires a local
 * Java runtime — `java -version` in this sandbox reports "command not
 * found" (see docs/SECURITY-FOLLOWUP.md). These tests were written
 * and reviewed for correctness against the rules language and the
 * actual firestore.rules content, but have never actually executed,
 * and nothing in this repository claims otherwise. Run them for real
 * wherever Java + the Firebase emulator are available — see
 * README.md in this directory.
 *
 * Covers, at minimum, every scenario requested for launch validation:
 * anonymous public reads, draft article denial, published article
 * read, pending review visibility, approved review visibility,
 * customer review creation, impersonated userId denial, self-approval
 * denial, restaurant owner allowed writes, other-owner denial,
 * ownerUid mutation denial, rating/reviewCount mutation denial,
 * normal-user admin denial, admin moderation, and admin article/
 * recommendation management — plus citySlug immutability and the
 * users.role self-promotion guard, since those exist in the same
 * rules file and share the same risk profile.
 *
 * Also covers the London Launch claim/correction foundation: claim
 * submission on an unclaimed restaurant, denial of any claim
 * submission that also touches ownerUid or another profile field,
 * denial of impersonating another user's claim, denial of
 * double-claiming, admin claim approval, and the
 * restaurant_correction_requests moderation-queue collection
 * (create/read/moderate authorization).
 *
 * Also covers the restaurant import-pipeline staging queue
 * (restaurant_import_candidates): denial of any client create
 * (including an admin — only the Admin SDK stage script may create
 * candidates), denial of non-admin/anonymous read, admin read, denial
 * of non-admin status update, admin status update (review decision),
 * denial of non-admin delete, and admin delete.
 */

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import {
  initializeTestEnvironment,
  assertSucceeds,
  assertFails,
} from "@firebase/rules-unit-testing";
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const RULES_PATH = path.join(__dirname, "..", "..", "firestore.rules");

let testEnv;

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: "demo-london-food-hubs-rules-test",
    firestore: {
      rules: readFileSync(RULES_PATH, "utf8"),
      host: "127.0.0.1",
      port: 8080,
    },
  });
});

afterAll(async () => {
  if (testEnv) await testEnv.cleanup();
});

beforeEach(async () => {
  await testEnv.clearFirestore();
});

/** Seeds Firestore data bypassing rules entirely, exactly as an
 *  Admin-SDK-backed setup step (or a Cloud Function) would — tests
 *  must never rely on the rules under test to seed their own fixture
 *  data. */
async function seed(setupFn) {
  await testEnv.withSecurityRulesDisabled(async (context) => {
    await setupFn(context.firestore());
  });
}

function asAdmin(uid = "admin-1") {
  return testEnv.authenticatedContext(uid, { admin: true }).firestore();
}

function asUser(uid) {
  return testEnv.authenticatedContext(uid).firestore();
}

function asAnon() {
  return testEnv.unauthenticatedContext().firestore();
}

describe("reviews", () => {
  it("denies an anonymous read of a pending review, allows an approved one", async () => {
    await seed(async (db) => {
      await setDoc(doc(db, "reviews", "pending-1"), {
        restaurantId: "r1",
        userId: "author-1",
        displayName: "A",
        rating: 4,
        reviewText: "ok",
        status: "pending",
      });
      await setDoc(doc(db, "reviews", "approved-1"), {
        restaurantId: "r1",
        userId: "author-2",
        displayName: "B",
        rating: 5,
        reviewText: "great",
        status: "approved",
      });
    });

    const anon = asAnon();
    await assertFails(getDoc(doc(anon, "reviews", "pending-1")));
    await assertSucceeds(getDoc(doc(anon, "reviews", "approved-1")));
  });

  it("lets the author read their own pending review, but not a different user", async () => {
    await seed(async (db) => {
      await setDoc(doc(db, "reviews", "pending-1"), {
        restaurantId: "r1",
        userId: "author-1",
        displayName: "A",
        rating: 4,
        reviewText: "ok",
        status: "pending",
      });
    });

    await assertSucceeds(getDoc(doc(asUser("author-1"), "reviews", "pending-1")));
    await assertFails(getDoc(doc(asUser("someone-else"), "reviews", "pending-1")));
  });

  it("lets a signed-in customer create their own pending review", async () => {
    const db = asUser("customer-1");
    await assertSucceeds(
      addDoc(collection(db, "reviews"), {
        restaurantId: "r1",
        userId: "customer-1",
        displayName: "Customer One",
        rating: 5,
        reviewText: "Loved it",
        status: "pending",
      })
    );
  });

  it("denies creating a review with someone else's userId (impersonation)", async () => {
    const db = asUser("customer-1");
    await assertFails(
      addDoc(collection(db, "reviews"), {
        restaurantId: "r1",
        userId: "someone-else",
        displayName: "Customer One",
        rating: 5,
        reviewText: "Loved it",
        status: "pending",
      })
    );
  });

  it("denies creating a review pre-set to approved (self-approval at creation)", async () => {
    const db = asUser("customer-1");
    await assertFails(
      addDoc(collection(db, "reviews"), {
        restaurantId: "r1",
        userId: "customer-1",
        displayName: "Customer One",
        rating: 5,
        reviewText: "Loved it",
        status: "approved",
      })
    );
  });

  it("denies the author approving their own pending review via update", async () => {
    await seed(async (db) => {
      await setDoc(doc(db, "reviews", "pending-1"), {
        restaurantId: "r1",
        userId: "author-1",
        displayName: "A",
        rating: 4,
        reviewText: "ok",
        status: "pending",
      });
    });

    await assertFails(
      updateDoc(doc(asUser("author-1"), "reviews", "pending-1"), { status: "approved" })
    );
  });

  it("lets an admin approve a pending review without touching its content", async () => {
    await seed(async (db) => {
      await setDoc(doc(db, "reviews", "pending-1"), {
        restaurantId: "r1",
        userId: "author-1",
        displayName: "A",
        rating: 4,
        reviewText: "ok",
        status: "pending",
      });
    });

    await assertSucceeds(
      updateDoc(doc(asAdmin(), "reviews", "pending-1"), {
        status: "approved",
        moderatedBy: "admin-1",
        moderatedAt: serverTimestamp(),
      })
    );
  });

  it("denies a normal (non-admin) signed-in user moderating someone else's review", async () => {
    await seed(async (db) => {
      await setDoc(doc(db, "reviews", "pending-1"), {
        restaurantId: "r1",
        userId: "author-1",
        displayName: "A",
        rating: 4,
        reviewText: "ok",
        status: "pending",
      });
    });

    await assertFails(
      updateDoc(doc(asUser("random-user"), "reviews", "pending-1"), { status: "approved" })
    );
  });
});

describe("articles", () => {
  it("denies an anonymous read of a draft article, allows a published one", async () => {
    await seed(async (db) => {
      await setDoc(doc(db, "articles", "draft-1"), {
        slug: "draft-1",
        title: "Draft",
        excerpt: "e",
        body: "b",
        authorName: "Team",
        category: "What to Eat",
        status: "draft",
      });
      await setDoc(doc(db, "articles", "published-1"), {
        slug: "published-1",
        title: "Published",
        excerpt: "e",
        body: "b",
        authorName: "Team",
        category: "What to Eat",
        status: "published",
      });
    });

    const anon = asAnon();
    await assertFails(getDoc(doc(anon, "articles", "draft-1")));
    await assertSucceeds(getDoc(doc(anon, "articles", "published-1")));
  });

  it("denies a normal signed-in user creating or publishing an article", async () => {
    await assertFails(
      addDoc(collection(asUser("random-user"), "articles"), {
        slug: "x",
        title: "X",
        excerpt: "e",
        body: "b",
        authorName: "Someone",
        category: "What to Eat",
        status: "published",
      })
    );
  });

  it("lets an admin create and manage articles, including drafts", async () => {
    const db = asAdmin();
    await assertSucceeds(
      addDoc(collection(db, "articles"), {
        slug: "admin-post",
        title: "Admin Post",
        excerpt: "e",
        body: "b",
        authorName: "Team",
        category: "What to Eat",
        status: "draft",
      })
    );
  });
});

describe("recommendations", () => {
  it("denies an anonymous read of an inactive recommendation, allows an active one", async () => {
    await seed(async (db) => {
      await setDoc(doc(db, "recommendations", "inactive-1"), {
        type: "hidden_gem",
        targetType: "restaurant",
        targetId: "r1",
        title: "T",
        blurb: "B",
        linkHref: "/restaurants/r1",
        isActive: false,
      });
      await setDoc(doc(db, "recommendations", "active-1"), {
        type: "hidden_gem",
        targetType: "restaurant",
        targetId: "r1",
        title: "T",
        blurb: "B",
        linkHref: "/restaurants/r1",
        isActive: true,
      });
    });

    const anon = asAnon();
    await assertFails(getDoc(doc(anon, "recommendations", "inactive-1")));
    await assertSucceeds(getDoc(doc(anon, "recommendations", "active-1")));
  });

  it("denies a normal signed-in user managing recommendations; allows an admin", async () => {
    await assertFails(
      addDoc(collection(asUser("random-user"), "recommendations"), {
        type: "hidden_gem",
        targetType: "restaurant",
        targetId: "r1",
        title: "T",
        blurb: "B",
        linkHref: "/restaurants/r1",
        isActive: true,
      })
    );

    await assertSucceeds(
      addDoc(collection(asAdmin(), "recommendations"), {
        type: "hidden_gem",
        targetType: "restaurant",
        targetId: "r1",
        title: "T",
        blurb: "B",
        linkHref: "/restaurants/r1",
        isActive: true,
      })
    );
  });
});

describe("restaurants", () => {
  async function seedRestaurant(overrides = {}) {
    await seed(async (db) => {
      await setDoc(doc(db, "restaurants", "r1"), {
        name: "Test Restaurant",
        ownerUid: "owner-1",
        citySlug: "london",
        status: "active",
        rating: 0,
        reviewCount: 0,
        isFeatured: false,
        ...overrides,
      });
    });
  }

  it("allows public (anonymous) read of an active restaurant", async () => {
    await seedRestaurant();
    await assertSucceeds(getDoc(doc(asAnon(), "restaurants", "r1")));
  });

  it("requires citySlug on create by a non-admin owner", async () => {
    const db = asUser("owner-1");
    await assertFails(
      addDoc(collection(db, "restaurants"), {
        name: "No City",
        ownerUid: "owner-1",
        status: "draft",
      })
    );
    await assertSucceeds(
      addDoc(collection(db, "restaurants"), {
        name: "Has City",
        ownerUid: "owner-1",
        citySlug: "london",
        status: "draft",
      })
    );
  });

  it("lets the owner update their own restaurant's editable fields", async () => {
    await seedRestaurant();
    await assertSucceeds(
      updateDoc(doc(asUser("owner-1"), "restaurants", "r1"), {
        shortDescription: "Updated description",
      })
    );
  });

  it("denies a different user updating someone else's restaurant", async () => {
    await seedRestaurant();
    await assertFails(
      updateDoc(doc(asUser("owner-2"), "restaurants", "r1"), {
        shortDescription: "Hijacked",
      })
    );
  });

  it("denies the owner changing ownerUid", async () => {
    await seedRestaurant();
    await assertFails(
      updateDoc(doc(asUser("owner-1"), "restaurants", "r1"), { ownerUid: "owner-2" })
    );
  });

  it("denies the owner changing citySlug", async () => {
    await seedRestaurant();
    await assertFails(
      updateDoc(doc(asUser("owner-1"), "restaurants", "r1"), { citySlug: "paris" })
    );
  });

  it("denies the owner setting rating/reviewCount directly", async () => {
    await seedRestaurant();
    await assertFails(
      updateDoc(doc(asUser("owner-1"), "restaurants", "r1"), { rating: 5, reviewCount: 999 })
    );
  });

  it("denies the owner setting isFeatured on themselves", async () => {
    await seedRestaurant();
    await assertFails(
      updateDoc(doc(asUser("owner-1"), "restaurants", "r1"), { isFeatured: true })
    );
  });

  it("denies an unclaimed (empty ownerUid) restaurant being edited by any signed-in user", async () => {
    await seedRestaurant({ ownerUid: "" });
    await assertFails(
      updateDoc(doc(asUser("random-user"), "restaurants", "r1"), {
        shortDescription: "Claimed by a stranger",
      })
    );
  });

  it("lets an admin update any restaurant, including blocking it", async () => {
    await seedRestaurant();
    await assertSucceeds(
      updateDoc(doc(asAdmin(), "restaurants", "r1"), { status: "blocked" })
    );
  });

  // ---- Ownership claim submission (docs/RESTAURANT-CLAIM-WORKFLOW.md) ----

  it("lets a signed-in user submit a claim on an unclaimed restaurant", async () => {
    await seedRestaurant({ ownerUid: "", ownerClaimStatus: "unclaimed" });
    await assertSucceeds(
      updateDoc(doc(asUser("claimant-1"), "restaurants", "r1"), {
        claimantUid: "claimant-1",
        ownerClaimStatus: "claim_pending",
        claimSubmittedAt: serverTimestamp(),
      })
    );
  });

  it("denies a claim submission that also sets ownerUid", async () => {
    await seedRestaurant({ ownerUid: "", ownerClaimStatus: "unclaimed" });
    await assertFails(
      updateDoc(doc(asUser("claimant-1"), "restaurants", "r1"), {
        ownerUid: "claimant-1",
        claimantUid: "claimant-1",
        ownerClaimStatus: "claim_pending",
      })
    );
  });

  it("denies a claim submission that also edits unrelated profile fields", async () => {
    await seedRestaurant({ ownerUid: "", ownerClaimStatus: "unclaimed" });
    await assertFails(
      updateDoc(doc(asUser("claimant-1"), "restaurants", "r1"), {
        claimantUid: "claimant-1",
        ownerClaimStatus: "claim_pending",
        shortDescription: "Smuggled edit",
      })
    );
  });

  it("denies impersonating someone else's claim", async () => {
    await seedRestaurant({ ownerUid: "", ownerClaimStatus: "unclaimed" });
    await assertFails(
      updateDoc(doc(asUser("claimant-1"), "restaurants", "r1"), {
        claimantUid: "someone-else",
        ownerClaimStatus: "claim_pending",
      })
    );
  });

  it("denies claiming a restaurant that already has an owner", async () => {
    await seedRestaurant();
    await assertFails(
      updateDoc(doc(asUser("claimant-1"), "restaurants", "r1"), {
        claimantUid: "claimant-1",
        ownerClaimStatus: "claim_pending",
      })
    );
  });

  it("denies claiming a restaurant that already has a pending claim", async () => {
    await seedRestaurant({
      ownerUid: "",
      ownerClaimStatus: "claim_pending",
      claimantUid: "first-claimant",
    });
    await assertFails(
      updateDoc(doc(asUser("second-claimant"), "restaurants", "r1"), {
        claimantUid: "second-claimant",
        ownerClaimStatus: "claim_pending",
      })
    );
  });

  it("lets an admin approve a claim by setting ownerUid", async () => {
    await seedRestaurant({
      ownerUid: "",
      ownerClaimStatus: "claim_pending",
      claimantUid: "claimant-1",
    });
    await assertSucceeds(
      updateDoc(doc(asAdmin(), "restaurants", "r1"), {
        ownerUid: "claimant-1",
        ownerClaimStatus: "claimed",
        claimDecidedAt: serverTimestamp(),
        claimDecidedBy: "admin-1",
      })
    );
  });
});

describe("restaurant_correction_requests", () => {
  it("lets a signed-in user submit a correction request", async () => {
    await assertSucceeds(
      addDoc(collection(asUser("reporter-1"), "restaurant_correction_requests"), {
        restaurantId: "r1",
        requestType: "correction",
        submittedByUid: "reporter-1",
        fieldDescription: "Phone number",
        suggestedValueNote: "020 7946 0000",
        status: "pending",
      })
    );
  });

  it("denies impersonating another user's submission", async () => {
    await assertFails(
      addDoc(collection(asUser("reporter-1"), "restaurant_correction_requests"), {
        restaurantId: "r1",
        requestType: "removal",
        submittedByUid: "someone-else",
        reasonNote: "Permanently closed",
        status: "pending",
      })
    );
  });

  it("denies a submission that pre-sets moderation fields", async () => {
    await assertFails(
      addDoc(collection(asUser("reporter-1"), "restaurant_correction_requests"), {
        restaurantId: "r1",
        requestType: "removal",
        submittedByUid: "reporter-1",
        status: "pending",
        moderatedBy: "reporter-1",
      })
    );
  });

  it("denies an anonymous (unauthenticated) submission", async () => {
    await assertFails(
      addDoc(collection(asAnon(), "restaurant_correction_requests"), {
        restaurantId: "r1",
        requestType: "correction",
        submittedByUid: "nobody",
        status: "pending",
      })
    );
  });

  it("lets the submitter read their own request but not another user's", async () => {
    await seed(async (db) => {
      await setDoc(doc(db, "restaurant_correction_requests", "req1"), {
        restaurantId: "r1",
        requestType: "correction",
        submittedByUid: "reporter-1",
        status: "pending",
      });
    });
    await assertSucceeds(
      getDoc(doc(asUser("reporter-1"), "restaurant_correction_requests", "req1"))
    );
    await assertFails(
      getDoc(doc(asUser("someone-else"), "restaurant_correction_requests", "req1"))
    );
  });

  it("denies a non-admin moderating a request", async () => {
    await seed(async (db) => {
      await setDoc(doc(db, "restaurant_correction_requests", "req1"), {
        restaurantId: "r1",
        requestType: "correction",
        submittedByUid: "reporter-1",
        status: "pending",
      });
    });
    await assertFails(
      updateDoc(doc(asUser("reporter-1"), "restaurant_correction_requests", "req1"), {
        status: "accepted",
      })
    );
  });

  it("lets an admin moderate a request", async () => {
    await seed(async (db) => {
      await setDoc(doc(db, "restaurant_correction_requests", "req1"), {
        restaurantId: "r1",
        requestType: "correction",
        submittedByUid: "reporter-1",
        status: "pending",
      });
    });
    await assertSucceeds(
      updateDoc(doc(asAdmin(), "restaurant_correction_requests", "req1"), {
        status: "accepted",
        moderatedBy: "admin-1",
        moderatedAt: serverTimestamp(),
      })
    );
  });
});

describe("restaurant_import_candidates (admin-only staging queue)", () => {
  async function seedCandidate(overrides = {}) {
    await seed(async (db) => {
      await setDoc(doc(db, "restaurant_import_candidates", "cand1"), {
        batchId: "batch-2026-01",
        status: "PENDING_REVIEW",
        name: "Fixture Candidate",
        citySlug: "london",
        ...overrides,
      });
    });
  }

  it("denies any client create, including an admin — only the Admin SDK stage script may create candidates", async () => {
    await assertFails(
      setDoc(doc(asAdmin(), "restaurant_import_candidates", "cand1"), {
        batchId: "batch-2026-01",
        status: "PENDING_REVIEW",
        name: "Fixture Candidate",
      })
    );
  });

  it("denies a signed-in non-admin user reading a candidate", async () => {
    await seedCandidate();
    await assertFails(getDoc(doc(asUser("random-user"), "restaurant_import_candidates", "cand1")));
  });

  it("denies an anonymous user reading a candidate", async () => {
    await seedCandidate();
    await assertFails(getDoc(doc(asAnon(), "restaurant_import_candidates", "cand1")));
  });

  it("lets an admin read a candidate", async () => {
    await seedCandidate();
    await assertSucceeds(getDoc(doc(asAdmin(), "restaurant_import_candidates", "cand1")));
  });

  it("denies a signed-in non-admin user updating a candidate's status", async () => {
    await seedCandidate();
    await assertFails(
      updateDoc(doc(asUser("random-user"), "restaurant_import_candidates", "cand1"), {
        status: "APPROVED",
      })
    );
  });

  it("lets an admin update a candidate's status (review decision)", async () => {
    await seedCandidate();
    await assertSucceeds(
      updateDoc(doc(asAdmin(), "restaurant_import_candidates", "cand1"), {
        status: "APPROVED",
        reviewedByUid: "admin-1",
        reviewedAt: serverTimestamp(),
      })
    );
  });

  it("denies a non-admin deleting a candidate", async () => {
    await seedCandidate();
    await assertFails(deleteDoc(doc(asUser("random-user"), "restaurant_import_candidates", "cand1")));
  });

  it("lets an admin delete a candidate", async () => {
    await seedCandidate();
    await assertSucceeds(deleteDoc(doc(asAdmin(), "restaurant_import_candidates", "cand1")));
  });
});

describe("restaurant_signups", () => {
  it("lets a user create their own signup application as status new", async () => {
    const db = asUser("applicant-1");
    await assertSucceeds(
      setDoc(doc(db, "restaurant_signups", "applicant-1"), {
        uid: "applicant-1",
        status: "new",
        restaurantName: "New Place",
      })
    );
  });

  it("denies creating a signup pre-set to approved", async () => {
    const db = asUser("applicant-1");
    await assertFails(
      setDoc(doc(db, "restaurant_signups", "applicant-1"), {
        uid: "applicant-1",
        status: "approved",
        restaurantName: "New Place",
      })
    );
  });

  it("denies creating a signup under someone else's uid", async () => {
    const db = asUser("applicant-1");
    await assertFails(
      setDoc(doc(db, "restaurant_signups", "someone-else"), {
        uid: "someone-else",
        status: "new",
      })
    );
  });

  it("denies a normal user approving a signup; allows an admin", async () => {
    await seed(async (db) => {
      await setDoc(doc(db, "restaurant_signups", "applicant-1"), {
        uid: "applicant-1",
        status: "new",
      });
    });

    await assertFails(
      updateDoc(doc(asUser("applicant-1"), "restaurant_signups", "applicant-1"), {
        status: "approved",
      })
    );
    await assertSucceeds(
      updateDoc(doc(asAdmin(), "restaurant_signups", "applicant-1"), { status: "approved" })
    );
  });
});

describe("users", () => {
  it("lets a user create their own profile with a non-admin role", async () => {
    const db = asUser("user-1");
    await assertSucceeds(
      setDoc(doc(db, "users", "user-1"), { uid: "user-1", role: "customer" })
    );
  });

  it("denies a user creating their own profile with role admin", async () => {
    const db = asUser("user-1");
    await assertFails(
      setDoc(doc(db, "users", "user-1"), { uid: "user-1", role: "admin" })
    );
  });

  it("denies a user promoting themselves to admin via update", async () => {
    await seed(async (db) => {
      await setDoc(doc(db, "users", "user-1"), { uid: "user-1", role: "customer" });
    });
    await assertFails(
      updateDoc(doc(asUser("user-1"), "users", "user-1"), { role: "admin" })
    );
  });

  it("lets a user update their own profile without touching role", async () => {
    await seed(async (db) => {
      await setDoc(doc(db, "users", "user-1"), { uid: "user-1", role: "customer" });
    });
    await assertSucceeds(
      updateDoc(doc(asUser("user-1"), "users", "user-1"), { phone: "+44..." })
    );
  });

  it("denies one user reading another user's profile; allows an admin", async () => {
    await seed(async (db) => {
      await setDoc(doc(db, "users", "user-1"), { uid: "user-1", role: "customer" });
    });
    await assertFails(getDoc(doc(asUser("user-2"), "users", "user-1")));
    await assertSucceeds(getDoc(doc(asAdmin(), "users", "user-1")));
  });
});

describe("staff (ownerUid-scoped SmartServeUK collection)", () => {
  it("lets the owner read/write their own staff record; denies a different user", async () => {
    await seed(async (db) => {
      await setDoc(doc(db, "staff", "s1"), { ownerUid: "owner-1", name: "Alex" });
    });
    await assertSucceeds(getDoc(doc(asUser("owner-1"), "staff", "s1")));
    await assertFails(getDoc(doc(asUser("owner-2"), "staff", "s1")));
    await assertSucceeds(
      updateDoc(doc(asUser("owner-1"), "staff", "s1"), { name: "Alex Updated" })
    );
    await assertFails(
      updateDoc(doc(asUser("owner-2"), "staff", "s1"), { name: "Hijacked" })
    );
  });

  it("denies an anonymous read", async () => {
    await seed(async (db) => {
      await setDoc(doc(db, "staff", "s1"), { ownerUid: "owner-1", name: "Alex" });
    });
    await assertFails(getDoc(doc(asAnon(), "staff", "s1")));
  });
});

describe("customers and events (bossUid-scoped SmartServeUK collections)", () => {
  it("customers: owner-only read/write, no public access", async () => {
    await seed(async (db) => {
      await setDoc(doc(db, "customers", "c1"), { bossUid: "boss-1", firstName: "Sam" });
    });
    await assertSucceeds(getDoc(doc(asUser("boss-1"), "customers", "c1")));
    await assertFails(getDoc(doc(asUser("boss-2"), "customers", "c1")));
    await assertFails(getDoc(doc(asAnon(), "customers", "c1")));
  });

  it("events: owner-only read/write, no public access", async () => {
    await seed(async (db) => {
      await setDoc(doc(db, "events", "e1"), { bossUid: "boss-1", clientName: "Party" });
    });
    await assertSucceeds(getDoc(doc(asUser("boss-1"), "events", "e1")));
    await assertFails(getDoc(doc(asUser("boss-2"), "events", "e1")));
    await assertFails(getDoc(doc(asAnon(), "events", "e1")));
  });
});

describe("sales_signups (public lead form)", () => {
  it("allows anonymous create, denies anonymous/non-admin read", async () => {
    const anon = asAnon();
    await assertSucceeds(
      addDoc(collection(anon, "sales_signups"), { fullName: "Lead", phone: "+44...", status: "new" })
    );

    await seed(async (db) => {
      await setDoc(doc(db, "sales_signups", "lead-1"), { fullName: "Lead", status: "new" });
    });
    await assertFails(getDoc(doc(asAnon(), "sales_signups", "lead-1")));
    await assertFails(getDoc(doc(asUser("random-user"), "sales_signups", "lead-1")));
    await assertSucceeds(getDoc(doc(asAdmin(), "sales_signups", "lead-1")));
  });
});

describe("blackcab_early_access (public create, admin-only read)", () => {
  it("allows anonymous create, denies anonymous/non-admin read", async () => {
    const anon = asAnon();
    await assertSucceeds(
      addDoc(collection(anon, "blackcab_early_access"), { fullName: "Lead", email: "a@b.com", status: "new" })
    );

    await seed(async (db) => {
      await setDoc(doc(db, "blackcab_early_access", "lead-1"), { fullName: "Lead", status: "new" });
    });
    await assertFails(getDoc(doc(asAnon(), "blackcab_early_access", "lead-1")));
    await assertSucceeds(getDoc(doc(asAdmin(), "blackcab_early_access", "lead-1")));
  });
});

describe("collections outside this rules file's scope", () => {
  it("default-denies a collection not covered by firestore.rules (documented, intentional)", async () => {
    // Sanity check for the SCOPE note at the top of firestore.rules:
    // an unrelated collection (e.g. an operational SmartServeUK
    // collection not yet audited) has no matching `match` block and
    // must be denied to everyone, including an admin — because the
    // custom claim only grants what a rule explicitly checks it
    // against. This is expected and is why firestore.rules must not
    // be deployed as a full replacement until scope is extended or
    // merged — see the rule-merge plan.
    await assertFails(getDoc(doc(asAdmin(), "orders", "some-order")));
    await assertFails(getDoc(doc(asAnon(), "orders", "some-order")));
  });
});
