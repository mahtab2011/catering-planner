"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";

type EventContext = {
  eventId: string;
  source: string;
  sourcePath: string;
  createdAt: string;
};
const BLACK_CAB_PHOTOS = [
  "/hubs/black-cab/1.jpg",
  "/hubs/black-cab/2.jpg",
  "/hubs/black-cab/3.jpg",
  "/hubs/black-cab/4.jpg",
  "/hubs/black-cab/5.jpg",
  "/hubs/black-cab/6.jpg",
  "/hubs/black-cab/7.jpg",
  "/hubs/black-cab/8.jpg",
  "/hubs/black-cab/9.jpg",
];
export default function BlackCabContent() {
  const searchParams = useSearchParams();

  // Early access
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [journeyType, setJourneyType] = useState("Airport Transfer");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  // Fare estimator
  const [pickupArea, setPickupArea] = useState("Central London");
  const [destinationArea, setDestinationArea] = useState("Heathrow Airport");
  const [tripType, setTripType] = useState("Airport Transfer");

  // Event context
  const [eventContext, setEventContext] = useState<EventContext | null>(null);

  // Book now
  const [bookingName, setBookingName] = useState("");
  const [bookingEmail, setBookingEmail] = useState("");
  const [bookingPhone, setBookingPhone] = useState("");
  const [bookingPickup, setBookingPickup] = useState("");
  const [bookingDestination, setBookingDestination] = useState("");
  const [bookingDate, setBookingDate] = useState("");
  const [bookingTime, setBookingTime] = useState("");
  const [bookingPassengers, setBookingPassengers] = useState("1");
  const [bookingBags, setBookingBags] = useState("");
  const [bookingJourneyType, setBookingJourneyType] = useState("Airport Transfer");
  const [bookingSpecialRequests, setBookingSpecialRequests] = useState("");
  const [bookingSubmitting, setBookingSubmitting] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState("");
  const [bookingError, setBookingError] = useState("");

  // Rating
  const [ratingBookingRef, setRatingBookingRef] = useState("");
  const [ratingName, setRatingName] = useState("");
  const [ratingScore, setRatingScore] = useState("5");
  const [ratingComment, setRatingComment] = useState("");
  const [ratingSubmitting, setRatingSubmitting] = useState(false);
  const [ratingSuccess, setRatingSuccess] = useState("");
  const [ratingError, setRatingError] = useState("");

  // Concern report
  const [concernBookingRef, setConcernBookingRef] = useState("");
  const [concernName, setConcernName] = useState("");
  const [concernEmail, setConcernEmail] = useState("");
  const [concernPhone, setConcernPhone] = useState("");
  const [concernType, setConcernType] = useState("Driver Conduct");
  const [concernDetails, setConcernDetails] = useState("");
  const [concernSubmitting, setConcernSubmitting] = useState(false);
  const [concernSuccess, setConcernSuccess] = useState("");
  const [concernError, setConcernError] = useState("");

  const estimatedFare = (() => {
    const route = `${pickupArea}__${destinationArea}`;

    const routeMap: Record<string, string> = {
      "Central London__Heathrow Airport": "£65 – £95",
      "Central London__Gatwick Airport": "£95 – £140",
      "Central London__London City Airport": "£45 – £70",
      "Canary Wharf__Heathrow Airport": "£70 – £100",
      "Canary Wharf__Central London": "£35 – £55",
      "Westfield Stratford__Heathrow Airport": "£80 – £115",
      "Westfield Stratford__London City Airport": "£35 – £55",
      "Green Street__Heathrow Airport": "£75 – £105",
      "East London__Central London": "£35 – £60",
      "East London__Gatwick Airport": "£90 – £130",
    };

    const typeAdjustment: Record<string, number> = {
      "Airport Transfer": 0,
      "Hotel Pickup": 5,
      "Business Travel": 10,
      "City Journey": -5,
    };

    const base = routeMap[route];

    if (!base) return "£55 – £95";

    const adjustment = typeAdjustment[tripType] ?? 0;
    const numbers = base.match(/\d+/g);

    if (!numbers || numbers.length < 2) return base;

    const min = Number(numbers[0]) + adjustment;
    const max = Number(numbers[1]) + adjustment;

    return `£${min} – £${max}`;
  })();

  useEffect(() => {
    setJourneyType(tripType);
  }, [tripType]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("blackcab_event");
      if (!raw) return;

      const parsed = JSON.parse(raw) as EventContext;
      setEventContext(parsed);

      setNotes((prev) => {
        const base = prev || "";
        const eventLine = `Event ID: ${parsed.eventId}`;
        if (base.includes(eventLine)) return base;
        return base ? `${base}\n${eventLine}` : eventLine;
      });

      setBookingSpecialRequests((prev) => {
        const base = prev || "";
        const eventLine = `Linked Catering Event ID: ${parsed.eventId}`;
        if (base.includes(eventLine)) return base;
        return base ? `${base}\n${eventLine}` : eventLine;
      });
    } catch (err) {
      console.error("Failed to read blackcab event context:", err);
    }
  }, []);

  useEffect(() => {
    const pickup = searchParams.get("pickup");
    const date = searchParams.get("date");
    const event = searchParams.get("event");

    const mapPickup = (text: string) => {
      const lower = text.toLowerCase();

      if (lower.includes("stratford")) return "Westfield Stratford";
      if (lower.includes("green street")) return "Green Street";
      if (lower.includes("east london")) return "East London";
      if (lower.includes("canary")) return "Canary Wharf";
      if (lower.includes("central")) return "Central London";

      return "Central London";
    };

    if (pickup) {
      const mapped = mapPickup(pickup);
      setPickupArea(mapped);
      setBookingPickup(pickup);
    }

    if (event) {
      const lower = event.toLowerCase();

      if (lower.includes("wedding") || lower.includes("party")) {
        setTripType("City Journey");
        setBookingJourneyType("City Journey");
      } else if (lower.includes("corporate") || lower.includes("meeting")) {
        setTripType("Business Travel");
        setBookingJourneyType("Business Travel");
      } else {
        setTripType("Airport Transfer");
        setBookingJourneyType("Airport Transfer");
      }

      if (lower.includes("airport")) {
        setDestinationArea("Heathrow Airport");
        if (!bookingDestination) setBookingDestination("Heathrow Airport");
      } else if (lower.includes("hotel")) {
        setDestinationArea("Central London");
        if (!bookingDestination) setBookingDestination("Central London");
      } else {
        setDestinationArea("Central London");
      }

      setNotes((prev) => (prev ? `${prev}\nEvent: ${event}` : `Event: ${event}`));
      setBookingSpecialRequests((prev) =>
        prev ? `${prev}\nEvent: ${event}` : `Event: ${event}`
      );
    }

    if (date) {
      setNotes((prev) => (prev ? `${prev}\nDate: ${date}` : `Date: ${date}`));
      setBookingDate(date);
    }
  }, [searchParams, bookingDestination]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    setSuccessMessage("");
    setErrorMessage("");

    try {
      if (!fullName.trim() || !email.trim()) {
        setErrorMessage("Please enter your name and email.");
        setSubmitting(false);
        return;
      }

      await addDoc(collection(db, "blackcab_early_access"), {
        fullName: fullName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        journeyType: journeyType.trim(),
        tripType: tripType.trim(),
        pickupArea: pickupArea.trim(),
        destinationArea: destinationArea.trim(),
        estimatedFare,
        notes: notes.trim(),
        source: eventContext?.source || "blackcab_landing_page",
        sourceEventId: eventContext?.eventId || "",
        sourcePath: eventContext?.sourcePath || "",
        status: "new",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      setSuccessMessage("Thank you — you have joined the early access list.");
      setFullName("");
      setEmail("");
      setPhone("");
      setJourneyType("Airport Transfer");
      setNotes("");
      setPickupArea("Central London");
      setDestinationArea("Heathrow Airport");
      setTripType("Airport Transfer");
    } catch (error) {
      console.error("Black cab early access error:", error);
      setErrorMessage("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleBookNow = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setBookingSubmitting(true);
    setBookingSuccess("");
    setBookingError("");

    try {
      if (
        !bookingName.trim() ||
        !bookingEmail.trim() ||
        !bookingPhone.trim() ||
        !bookingPickup.trim() ||
        !bookingDestination.trim() ||
        !bookingDate.trim() ||
        !bookingTime.trim()
      ) {
        setBookingError("Please complete all required booking fields.");
        setBookingSubmitting(false);
        return;
      }

      const bookingRef = `BC-${Date.now()}`;

      await addDoc(collection(db, "blackcab_bookings"), {
        bookingRef,
        customerName: bookingName.trim(),
        customerEmail: bookingEmail.trim(),
        customerPhone: bookingPhone.trim(),
        pickup: bookingPickup.trim(),
        destination: bookingDestination.trim(),
        bookingDate: bookingDate.trim(),
        bookingTime: bookingTime.trim(),
        passengers: Number(bookingPassengers || "1"),
        bags: bookingBags.trim(),
        journeyType: bookingJourneyType.trim(),
        estimatedFare,
        specialRequests: bookingSpecialRequests.trim(),
        source: eventContext?.source || "blackcab_page",
        sourceEventId: eventContext?.eventId || "",
        sourcePath: eventContext?.sourcePath || "",
        queueStatus: "pending_dispatch",
        bookingStatus: "new",
        assignedDriverId: "",
        assignedDriverName: "",
        complaintStatus: "none",
        ratingStatus: "pending",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      setBookingSuccess(
  `Booking request received. Your reference is ${bookingRef}. You have been added to the dispatch queue in the order received. We will contact you when a black cab partner is available.`
);

      setBookingName("");
      setBookingEmail("");
      setBookingPhone("");
      setBookingPickup("");
      setBookingDestination("");
      setBookingDate("");
      setBookingTime("");
      setBookingPassengers("1");
      setBookingBags("");
      setBookingJourneyType("Airport Transfer");
      setBookingSpecialRequests(eventContext ? `Linked Catering Event ID: ${eventContext.eventId}` : "");
    } catch (error) {
      console.error("Black cab booking error:", error);
      setBookingError("Something went wrong while submitting your booking.");
    } finally {
      setBookingSubmitting(false);
    }
  };

  const handleRatingSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setRatingSubmitting(true);
    setRatingSuccess("");
    setRatingError("");

    try {
      if (!ratingBookingRef.trim() || !ratingName.trim()) {
        setRatingError("Please enter your booking reference and name.");
        setRatingSubmitting(false);
        return;
      }

      await addDoc(collection(db, "blackcab_journey_ratings"), {
        bookingRef: ratingBookingRef.trim(),
        customerName: ratingName.trim(),
        ratingScore: Number(ratingScore),
        comment: ratingComment.trim(),
        source: eventContext?.source || "blackcab_page",
        sourceEventId: eventContext?.eventId || "",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      setRatingSuccess("Thank you — your journey rating has been recorded.");
      setRatingBookingRef("");
      setRatingName("");
      setRatingScore("5");
      setRatingComment("");
    } catch (error) {
      console.error("Journey rating error:", error);
      setRatingError("Could not save your rating. Please try again.");
    } finally {
      setRatingSubmitting(false);
    }
  };

  const handleConcernSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setConcernSubmitting(true);
    setConcernSuccess("");
    setConcernError("");

    try {
      if (!concernName.trim() || !concernDetails.trim()) {
        setConcernError("Please enter your name and concern details.");
        setConcernSubmitting(false);
        return;
      }

      await addDoc(collection(db, "blackcab_concerns"), {
        bookingRef: concernBookingRef.trim(),
        reporterName: concernName.trim(),
        reporterEmail: concernEmail.trim(),
        reporterPhone: concernPhone.trim(),
        concernType: concernType.trim(),
        concernDetails: concernDetails.trim(),
        source: eventContext?.source || "blackcab_page",
        sourceEventId: eventContext?.eventId || "",
        sourcePath: eventContext?.sourcePath || "",
        reviewStatus: "new",
        escalationSuggested:
          concernType === "Theft" || concernType === "Sexual Misconduct" || concernType === "Safety Incident",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      setConcernSuccess(
        "Your concern has been recorded. Our platform now has a case footprint for review and follow-up."
      );
      setConcernBookingRef("");
      setConcernName("");
      setConcernEmail("");
      setConcernPhone("");
      setConcernType("Driver Conduct");
      setConcernDetails("");
    } catch (error) {
      console.error("Concern report error:", error);
      setConcernError("Could not submit your concern. Please try again.");
    } finally {
      setConcernSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-neutral-950 text-white">
      {eventContext && (
        <div className="mx-auto max-w-3xl px-4 pt-6">
          <div className="mb-6 rounded-2xl border border-yellow-300 bg-yellow-50 p-4">
            <div className="text-sm font-bold uppercase tracking-wide text-yellow-800">
              From Catering Event
            </div>
            <div className="mt-1 text-sm text-neutral-800">
              This booking was opened from an event in Catering Planner.
            </div>
            <div className="mt-2 text-xs text-neutral-600">
              Event ID: {eventContext.eventId}
            </div>
          </div>
        </div>
      )}

      <section className="relative overflow-hidden border-b border-neutral-800 bg-neutral-950">
  <div
    className="absolute inset-0 bg-cover bg-center opacity-35"
    style={{ backgroundImage: "url('/hubs/black-cab/1.jpg')" }}
  />
  <div className="absolute inset-0 bg-linear-to-r from-neutral-950 via-neutral-950/85 to-neutral-950/40" />

  <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <div className="inline-flex rounded-full border border-yellow-500/30 bg-yellow-500/10 px-4 py-1 text-sm font-medium text-yellow-300">
              Coming Soon in London
            </div>

            <h1 className="mt-6 text-4xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl">
              Book Licensed London Black Cabs with Confidence
            </h1>

            <p className="mt-6 max-w-2xl text-lg leading-8 text-neutral-300">
              Smart, simple, and reliable black cab booking for airport transfers,
              business travel, hotel pickups, and advance city journeys.
            </p>

            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                href="/"
                className="rounded-xl bg-yellow-400 px-6 py-3 text-sm font-bold text-neutral-950 transition hover:bg-yellow-300"
              >
                Back to SmartServeUK
              </Link>

              <a
                href="#why-blackcab"
                className="rounded-xl border border-neutral-700 px-6 py-3 text-sm font-bold text-white transition hover:border-yellow-400 hover:text-yellow-300"
              >
                Explore Features
              </a>
            </div>

            <div className="mt-8 flex flex-wrap gap-4">
              <a
                href="#book-now-form"
                className="inline-flex items-center rounded-xl bg-yellow-400 px-6 py-3 text-sm font-bold text-neutral-900 transition hover:bg-yellow-300"
              >
                Book Now
              </a>
<div className="mt-8 flex flex-wrap gap-4">
  <a
    href="#book-now-form"
    className="inline-flex items-center rounded-xl bg-yellow-400 px-6 py-3 text-sm font-bold text-neutral-900 transition hover:bg-yellow-300"
  >
    Book Now
  </a>

  <Link
    href="/signup/blackcab"
    className="inline-flex items-center rounded-xl border border-yellow-400 px-6 py-3 text-sm font-bold text-yellow-300 transition hover:bg-yellow-400/10"
  >
    Join as Black Cab Partner
  </Link>
</div>
              <a
                href="#rate-journey"
                className="inline-flex items-center rounded-xl border border-yellow-400 px-6 py-3 text-sm font-bold text-yellow-300 transition hover:bg-yellow-400/10"
              >
                Rate Your Journey
              </a>

              <a
                href="#report-concern"
                className="inline-flex items-center rounded-xl border border-red-400 px-6 py-3 text-sm font-bold text-red-300 transition hover:bg-red-500/10"
              >
                Report a Concern
              </a>
            </div>

            <div className="mt-4 max-w-3xl rounded-2xl border border-red-400/40 bg-red-500/10 p-4 text-sm text-red-100">
              In an emergency, call <span className="font-bold">999</span> immediately.
              For serious incidents that may require police escalation, contact emergency
              services first and then report the incident through our platform.
            </div>

            <div className="mt-8 flex flex-wrap gap-3 text-sm">
              <div className="rounded-full border border-neutral-800 bg-neutral-900 px-4 py-2 text-neutral-300">
                Licensed London black cab network
              </div>
              <div className="rounded-full border border-neutral-800 bg-neutral-900 px-4 py-2 text-neutral-300">
                Advance booking for airport and city journeys
              </div>
              <div className="rounded-full border border-neutral-800 bg-neutral-900 px-4 py-2 text-neutral-300">
                Early access registration now open
              </div>
            </div>

            <div className="mt-8 grid max-w-2xl gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-4">
                <div className="text-2xl font-extrabold text-yellow-400">24/7</div>
                <div className="mt-1 text-sm text-neutral-400">
                  Planned booking support for airport and city journeys
                </div>
              </div>

              <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-4">
                <div className="text-2xl font-extrabold text-yellow-400">Licensed</div>
                <div className="mt-1 text-sm text-neutral-400">
                  Professional London black cab network focus
                </div>
              </div>

              <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-4">
                <div className="text-2xl font-extrabold text-yellow-400">Early Access</div>
                <div className="mt-1 text-sm text-neutral-400">
                  Join now and be first to hear when bookings go live
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
<section className="border-b border-neutral-800 bg-neutral-950">
  <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
    <div className="mb-6">
      <h2 className="text-3xl font-bold text-white">
        London Black Cab Gallery
      </h2>
      <p className="mt-2 text-neutral-400">
        A preview of licensed London black cab journeys across London.
      </p>
    </div>

    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {[
        "/hubs/black-cab/1.jpg",
        "/hubs/black-cab/2.jpg",
        "/hubs/black-cab/3.jpg",
        "/hubs/black-cab/4.jpg",
        "/hubs/black-cab/5.jpg",
        "/hubs/black-cab/6.jpg",
        "/hubs/black-cab/7.jpg",
        "/hubs/black-cab/8.jpg",
        "/hubs/black-cab/9.jpg",
      ].map((photo, index) => (
        <div
          key={photo}
          className="group aspect-4/3 overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-900"
        >
          <img
            src={photo}
            alt={`Black cab ${index + 1}`}
            className="h-full w-full object-cover object-center transition duration-700 group-hover:scale-110"
            loading="lazy"
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
          />
        </div>
      ))}
    </div>
  </div>
</section>
      <section id="why-blackcab" className="bg-neutral-950">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="mb-10 max-w-2xl">
            <h2 className="text-3xl font-bold text-white">
              Why Choose London Black Cabs?
            </h2>
            <p className="mt-3 text-neutral-400">
              Trusted, regulated, and iconic — black cabs offer a premium transport
              experience for locals, businesses, and international visitors.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-6">
              <div className="text-3xl">🛡️</div>
              <div className="mt-4 text-lg font-bold text-white">Licensed & Regulated</div>
              <p className="mt-2 text-sm text-neutral-400">
                All drivers are fully licensed with strict background checks and
                professional standards.
              </p>
            </div>

            <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-6">
              <div className="text-3xl">🧭</div>
              <div className="mt-4 text-lg font-bold text-white">Expert Navigation</div>
              <p className="mt-2 text-sm text-neutral-400">
                Drivers have passed “The Knowledge” — mastering London’s roads without
                relying only on GPS.
              </p>
            </div>

            <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-6">
              <div className="text-3xl">♿</div>
              <div className="mt-4 text-lg font-bold text-white">Wheelchair Accessible</div>
              <p className="mt-2 text-sm text-neutral-400">
                Purpose-built vehicles with accessibility features for all passengers.
              </p>
            </div>

            <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-6">
              <div className="text-3xl">💳</div>
              <div className="mt-4 text-lg font-bold text-white">Transparent Pricing</div>
              <p className="mt-2 text-sm text-neutral-400">
                Metered fares and clear pricing — no hidden surge surprises.
              </p>
            </div>

            <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-6">
              <div className="text-3xl">🏨</div>
              <div className="mt-4 text-lg font-bold text-white">Perfect for Hotels & Airports</div>
              <p className="mt-2 text-sm text-neutral-400">
                Ideal for Heathrow, Gatwick, and hotel pickups with advance booking.
              </p>
            </div>

            <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-6">
              <div className="text-3xl">🧳</div>
              <div className="mt-4 text-lg font-bold text-white">Spacious & Comfortable</div>
              <p className="mt-2 text-sm text-neutral-400">
                More room for luggage and passengers compared to standard cars.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-neutral-800 bg-neutral-900/40">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="mb-10 max-w-2xl">
            <h2 className="text-3xl font-bold text-white">
              Ideal for Every Important Journey
            </h2>
            <p className="mt-3 text-neutral-400">
              Built for travellers, professionals, families, and anyone who wants a
              dependable London journey with advance planning.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-2xl border border-neutral-800 bg-neutral-950 p-6">
              <div className="text-3xl">✈️</div>
              <div className="mt-4 text-lg font-bold text-white">Airport Transfers</div>
              <p className="mt-2 text-sm leading-6 text-neutral-400">
                Pre-book pickups and drop-offs for Heathrow, Gatwick, Luton, Stansted,
                and London City Airport.
              </p>
            </div>

            <div className="rounded-2xl border border-neutral-800 bg-neutral-950 p-6">
              <div className="text-3xl">🏨</div>
              <div className="mt-4 text-lg font-bold text-white">Hotel Pickups</div>
              <p className="mt-2 text-sm leading-6 text-neutral-400">
                Smooth transport for hotel guests who want reliable, licensed black cab
                journeys across London.
              </p>
            </div>

            <div className="rounded-2xl border border-neutral-800 bg-neutral-950 p-6">
              <div className="text-3xl">💼</div>
              <div className="mt-4 text-lg font-bold text-white">Business Travel</div>
              <p className="mt-2 text-sm leading-6 text-neutral-400">
                Professional transport for meetings, events, office travel, and client
                journeys.
              </p>
            </div>

            <div className="rounded-2xl border border-neutral-800 bg-neutral-950 p-6">
              <div className="text-3xl">🗺️</div>
              <div className="mt-4 text-lg font-bold text-white">City Journeys</div>
              <p className="mt-2 text-sm leading-6 text-neutral-400">
                Advance booking for shopping, dining, tourism, family visits, and
                special London trips.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-neutral-800 bg-neutral-950">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="mb-10 max-w-2xl">
            <h2 className="text-3xl font-bold text-white">
              How Black Cab Booking Works
            </h2>
            <p className="mt-3 text-neutral-400">
              Simple, transparent, and designed for advance planning — no confusion,
              no last-minute stress.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-6">
              <div className="text-4xl font-extrabold text-yellow-400">1</div>
              <div className="mt-4 text-lg font-bold text-white">Enter Journey Details</div>
              <p className="mt-2 text-sm text-neutral-400">
                Choose pickup location, destination, date, and time — including airport
                or hotel options.
              </p>
            </div>

            <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-6">
              <div className="text-4xl font-extrabold text-yellow-400">2</div>
              <div className="mt-4 text-lg font-bold text-white">Get Transparent Pricing</div>
              <p className="mt-2 text-sm text-neutral-400">
                See clear estimated pricing based on distance and journey type — no
                surge pricing surprises.
              </p>
            </div>

            <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-6">
              <div className="text-4xl font-extrabold text-yellow-400">3</div>
              <div className="mt-4 text-lg font-bold text-white">Confirm & Ride</div>
              <p className="mt-2 text-sm text-neutral-400">
                Your licensed black cab is scheduled in advance — arrive on time, every
                time.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-neutral-800 bg-neutral-900/40">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-2 lg:items-center">
            <div>
              <h2 className="text-3xl font-bold text-white">Estimate Your Journey</h2>
              <p className="mt-3 max-w-2xl text-neutral-400">
                Get a simple early estimate for popular London black cab journeys.
                This is a guide for planning only and final pricing may vary by route,
                traffic, waiting time, and booking conditions.
              </p>

              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-neutral-300">
                    Pickup Area
                  </label>
                  <select
                    value={pickupArea}
                    onChange={(e) => setPickupArea(e.target.value)}
                    className="w-full rounded-xl border border-neutral-700 bg-neutral-950 px-4 py-3 text-white outline-none transition focus:border-yellow-400"
                  >
                    <option>Central London</option>
                    <option>Canary Wharf</option>
                    <option>Westfield Stratford</option>
                    <option>Green Street</option>
                    <option>East London</option>
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-neutral-300">
                    Destination
                  </label>
                  <select
                    value={destinationArea}
                    onChange={(e) => setDestinationArea(e.target.value)}
                    className="w-full rounded-xl border border-neutral-700 bg-neutral-950 px-4 py-3 text-white outline-none transition focus:border-yellow-400"
                  >
                    <option>Heathrow Airport</option>
                    <option>Gatwick Airport</option>
                    <option>London City Airport</option>
                    <option>Central London</option>
                    <option>Canary Wharf</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="mb-2 block text-sm font-medium text-neutral-300">
                    Journey Type
                  </label>
                  <select
                    value={tripType}
                    onChange={(e) => setTripType(e.target.value)}
                    className="w-full rounded-xl border border-neutral-700 bg-neutral-950 px-4 py-3 text-white outline-none transition focus:border-yellow-400"
                  >
                    <option>Airport Transfer</option>
                    <option>Hotel Pickup</option>
                    <option>Business Travel</option>
                    <option>City Journey</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-neutral-800 bg-neutral-950 p-8">
              <div className="text-sm font-medium uppercase tracking-wide text-yellow-400">
                Estimated Fare Range
              </div>

              <div className="mt-4 text-4xl font-extrabold text-white">
                {estimatedFare}
              </div>

              <p className="mt-4 text-sm leading-6 text-neutral-400">
                Typical estimate for selected popular route combinations. Final fare
                can vary depending on route conditions, traffic, pickup time, waiting,
                and any special booking requirements.
              </p>

              <div className="mt-6 space-y-3 text-sm text-neutral-300">
                <div className="flex items-center justify-between rounded-xl border border-neutral-800 bg-neutral-900 px-4 py-3">
                  <span>Vehicle type</span>
                  <span className="font-semibold text-white">Licensed Black Cab</span>
                </div>

                <div className="flex items-center justify-between rounded-xl border border-neutral-800 bg-neutral-900 px-4 py-3">
                  <span>Journey category</span>
                  <span className="font-semibold text-white">{tripType}</span>
                </div>

                <div className="flex items-center justify-between rounded-xl border border-neutral-800 bg-neutral-900 px-4 py-3">
                  <span>Route</span>
                  <span className="font-semibold text-white">
                    {pickupArea} → {destinationArea}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section
        id="book-now-form"
        className="border-t border-neutral-800 bg-neutral-950"
      >
        <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="rounded-3xl border border-yellow-500/20 bg-neutral-900 p-8">
            <div className="max-w-2xl">
              <h2 className="text-3xl font-bold text-white">Book Now</h2>
              <p className="mt-3 text-neutral-400">
                Submit your journey details and create a booking footprint in our
                dispatch queue. This helps with booking tracking, driver assignment,
                journey accountability, and complaint follow-up.
              </p>
            </div>

            <form onSubmit={handleBookNow} className="mt-8 grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-neutral-300">
                  Full Name
                </label>
                <input
                  type="text"
                  value={bookingName}
                  onChange={(e) => setBookingName(e.target.value)}
                  className="w-full rounded-xl border border-neutral-700 bg-neutral-950 px-4 py-3 text-white outline-none transition focus:border-yellow-400"
                  placeholder="Enter full name"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-neutral-300">
                  Email Address
                </label>
                <input
                  type="email"
                  value={bookingEmail}
                  onChange={(e) => setBookingEmail(e.target.value)}
                  className="w-full rounded-xl border border-neutral-700 bg-neutral-950 px-4 py-3 text-white outline-none transition focus:border-yellow-400"
                  placeholder="Enter email"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-neutral-300">
                  Phone Number
                </label>
                <input
                  type="text"
                  value={bookingPhone}
                  onChange={(e) => setBookingPhone(e.target.value)}
                  className="w-full rounded-xl border border-neutral-700 bg-neutral-950 px-4 py-3 text-white outline-none transition focus:border-yellow-400"
                  placeholder="Enter phone number"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-neutral-300">
                  Journey Type
                </label>
                <select
                  value={bookingJourneyType}
                  onChange={(e) => setBookingJourneyType(e.target.value)}
                  className="w-full rounded-xl border border-neutral-700 bg-neutral-950 px-4 py-3 text-white outline-none transition focus:border-yellow-400"
                >
                  <option>Airport Transfer</option>
                  <option>Hotel Pickup</option>
                  <option>Business Travel</option>
                  <option>City Journey</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-neutral-300">
                  Pickup Address / Area
                </label>
                <input
                  type="text"
                  value={bookingPickup}
                  onChange={(e) => setBookingPickup(e.target.value)}
                  className="w-full rounded-xl border border-neutral-700 bg-neutral-950 px-4 py-3 text-white outline-none transition focus:border-yellow-400"
                  placeholder="Pickup location"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-neutral-300">
                  Destination
                </label>
                <input
                  type="text"
                  value={bookingDestination}
                  onChange={(e) => setBookingDestination(e.target.value)}
                  className="w-full rounded-xl border border-neutral-700 bg-neutral-950 px-4 py-3 text-white outline-none transition focus:border-yellow-400"
                  placeholder="Destination"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-neutral-300">
                  Date
                </label>
                <input
                  type="date"
                  value={bookingDate}
                  onChange={(e) => setBookingDate(e.target.value)}
                  className="w-full rounded-xl border border-neutral-700 bg-neutral-950 px-4 py-3 text-white outline-none transition focus:border-yellow-400"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-neutral-300">
                  Time
                </label>
                <input
                  type="time"
                  value={bookingTime}
                  onChange={(e) => setBookingTime(e.target.value)}
                  className="w-full rounded-xl border border-neutral-700 bg-neutral-950 px-4 py-3 text-white outline-none transition focus:border-yellow-400"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-neutral-300">
                  Passengers
                </label>
                <select
                  value={bookingPassengers}
                  onChange={(e) => setBookingPassengers(e.target.value)}
                  className="w-full rounded-xl border border-neutral-700 bg-neutral-950 px-4 py-3 text-white outline-none transition focus:border-yellow-400"
                >
                  <option value="1">1</option>
                  <option value="2">2</option>
                  <option value="3">3</option>
                  <option value="4">4</option>
                  <option value="5">5+</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-neutral-300">
                  Bags / Luggage
                </label>
                <input
                  type="text"
                  value={bookingBags}
                  onChange={(e) => setBookingBags(e.target.value)}
                  className="w-full rounded-xl border border-neutral-700 bg-neutral-950 px-4 py-3 text-white outline-none transition focus:border-yellow-400"
                  placeholder="e.g. 2 suitcases"
                />
              </div>

              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-medium text-neutral-300">
                  Special Requests / Journey Notes
                </label>
                <textarea
                  rows={4}
                  value={bookingSpecialRequests}
                  onChange={(e) => setBookingSpecialRequests(e.target.value)}
                  className="w-full rounded-xl border border-neutral-700 bg-neutral-950 px-4 py-3 text-white outline-none transition focus:border-yellow-400"
                  placeholder="Child seat, accessibility request, event link, extra instructions"
                />
              </div>

              <div className="md:col-span-2 rounded-2xl border border-neutral-800 bg-neutral-950 p-4 text-sm text-neutral-300">
                Estimated planning fare:{" "}
                <span className="font-bold text-yellow-400">{estimatedFare}</span>
              </div>

              {bookingSuccess && (
                <div className="md:col-span-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
                  {bookingSuccess}
                </div>
              )}

              {bookingError && (
                <div className="md:col-span-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                  {bookingError}
                </div>
              )}

              <div className="md:col-span-2">
                <button
                  type="submit"
                  disabled={bookingSubmitting}
                  className="w-full rounded-xl bg-yellow-400 px-8 py-4 text-sm font-bold text-neutral-950 transition hover:bg-yellow-300 disabled:opacity-50"
                >
                  {bookingSubmitting ? "Submitting Booking..." : "Submit Booking Request"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </section>

      <section
        id="rate-journey"
        className="border-t border-neutral-800 bg-neutral-900/40"
      >
        <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="rounded-3xl border border-neutral-800 bg-neutral-950 p-8">
            <h2 className="text-3xl font-bold text-white">Rate Your Journey</h2>
            <p className="mt-3 text-neutral-400">
              Share feedback after your trip so service quality can be monitored and
              poor driver behavior can be identified and reviewed.
            </p>

            <form onSubmit={handleRatingSubmit} className="mt-8 grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-neutral-300">
                  Booking Reference
                </label>
                <input
                  type="text"
                  value={ratingBookingRef}
                  onChange={(e) => setRatingBookingRef(e.target.value)}
                  className="w-full rounded-xl border border-neutral-700 bg-neutral-900 px-4 py-3 text-white outline-none transition focus:border-yellow-400"
                  placeholder="e.g. BC-1234567890"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-neutral-300">
                  Your Name
                </label>
                <input
                  type="text"
                  value={ratingName}
                  onChange={(e) => setRatingName(e.target.value)}
                  className="w-full rounded-xl border border-neutral-700 bg-neutral-900 px-4 py-3 text-white outline-none transition focus:border-yellow-400"
                  placeholder="Enter your name"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-neutral-300">
                  Rating
                </label>
                <select
                  value={ratingScore}
                  onChange={(e) => setRatingScore(e.target.value)}
                  className="w-full rounded-xl border border-neutral-700 bg-neutral-900 px-4 py-3 text-white outline-none transition focus:border-yellow-400"
                >
                  <option value="5">5 - Excellent</option>
                  <option value="4">4 - Good</option>
                  <option value="3">3 - Average</option>
                  <option value="2">2 - Poor</option>
                  <option value="1">1 - Very Poor</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-medium text-neutral-300">
                  Comments
                </label>
                <textarea
                  rows={4}
                  value={ratingComment}
                  onChange={(e) => setRatingComment(e.target.value)}
                  className="w-full rounded-xl border border-neutral-700 bg-neutral-900 px-4 py-3 text-white outline-none transition focus:border-yellow-400"
                  placeholder="Tell us about the journey"
                />
              </div>

              {ratingSuccess && (
                <div className="md:col-span-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
                  {ratingSuccess}
                </div>
              )}

              {ratingError && (
                <div className="md:col-span-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                  {ratingError}
                </div>
              )}

              <div className="md:col-span-2">
                <button
                  type="submit"
                  disabled={ratingSubmitting}
                  className="w-full rounded-xl border border-yellow-400 px-8 py-4 text-sm font-bold text-yellow-300 transition hover:bg-yellow-400/10 disabled:opacity-50"
                >
                  {ratingSubmitting ? "Submitting Rating..." : "Submit Journey Rating"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </section>

      <section
        id="report-concern"
        className="border-t border-neutral-800 bg-neutral-950"
      >
        <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="rounded-3xl border border-red-500/20 bg-neutral-900 p-8">
            <h2 className="text-3xl font-bold text-white">Report a Concern</h2>
            <p className="mt-3 text-neutral-400">
              Use this form to report driver misconduct, safety concerns, lost
              property, suspected theft, or other serious issues. For emergencies,
              call <span className="font-bold text-red-300">999</span> immediately.
            </p>

            <form onSubmit={handleConcernSubmit} className="mt-8 grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-neutral-300">
                  Booking Reference
                </label>
                <input
                  type="text"
                  value={concernBookingRef}
                  onChange={(e) => setConcernBookingRef(e.target.value)}
                  className="w-full rounded-xl border border-neutral-700 bg-neutral-950 px-4 py-3 text-white outline-none transition focus:border-red-400"
                  placeholder="Enter booking reference if available"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-neutral-300">
                  Your Name
                </label>
                <input
                  type="text"
                  value={concernName}
                  onChange={(e) => setConcernName(e.target.value)}
                  className="w-full rounded-xl border border-neutral-700 bg-neutral-950 px-4 py-3 text-white outline-none transition focus:border-red-400"
                  placeholder="Enter your name"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-neutral-300">
                  Email
                </label>
                <input
                  type="email"
                  value={concernEmail}
                  onChange={(e) => setConcernEmail(e.target.value)}
                  className="w-full rounded-xl border border-neutral-700 bg-neutral-950 px-4 py-3 text-white outline-none transition focus:border-red-400"
                  placeholder="Enter email"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-neutral-300">
                  Phone
                </label>
                <input
                  type="text"
                  value={concernPhone}
                  onChange={(e) => setConcernPhone(e.target.value)}
                  className="w-full rounded-xl border border-neutral-700 bg-neutral-950 px-4 py-3 text-white outline-none transition focus:border-red-400"
                  placeholder="Enter phone"
                />
              </div>

              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-medium text-neutral-300">
                  Concern Type
                </label>
                <select
                  value={concernType}
                  onChange={(e) => setConcernType(e.target.value)}
                  className="w-full rounded-xl border border-neutral-700 bg-neutral-950 px-4 py-3 text-white outline-none transition focus:border-red-400"
                >
                  <option>Driver Conduct</option>
                  <option>Safety Incident</option>
                  <option>Lost Property</option>
                  <option>Theft</option>
                  <option>Sexual Misconduct</option>
                  <option>Overcharging</option>
                  <option>Other</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-medium text-neutral-300">
                  Incident Details
                </label>
                <textarea
                  rows={5}
                  value={concernDetails}
                  onChange={(e) => setConcernDetails(e.target.value)}
                  className="w-full rounded-xl border border-neutral-700 bg-neutral-950 px-4 py-3 text-white outline-none transition focus:border-red-400"
                  placeholder="Describe what happened, when it happened, and any driver or vehicle details you know"
                />
              </div>

              <div className="md:col-span-2 rounded-2xl border border-red-400/30 bg-red-500/10 p-4 text-sm text-red-100">
                In an emergency or if there is immediate danger, call{" "}
                <span className="font-bold">999</span> first. This reporting form is
                for platform review, booking records, follow-up, and support.
              </div>

              {concernSuccess && (
                <div className="md:col-span-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
                  {concernSuccess}
                </div>
              )}

              {concernError && (
                <div className="md:col-span-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                  {concernError}
                </div>
              )}

              <div className="md:col-span-2">
                <button
                  type="submit"
                  disabled={concernSubmitting}
                  className="w-full rounded-xl bg-red-500 px-8 py-4 text-sm font-bold text-white transition hover:bg-red-400 disabled:opacity-50"
                >
                  {concernSubmitting ? "Submitting Concern..." : "Submit Concern Report"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </section>

      <section className="border-t border-neutral-800 bg-neutral-900">
        <div className="mx-auto max-w-7xl px-4 py-16 text-center sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl">
            <h2 className="text-3xl font-bold text-white">
              Powered by Trusted London Black Cab Network
            </h2>

            <p className="mt-4 text-neutral-300">
              SmartServeUK partners with professional black cab booking networks to
              ensure reliable service, licensed drivers, and a smooth customer
              experience across London.
            </p>

            <p className="mt-3 text-sm text-neutral-500">
              Integration with bcabs.london coming soon.
            </p>
          </div>

          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <a
              href="#early-access"
              className="rounded-xl bg-yellow-400 px-8 py-4 text-base font-bold text-neutral-950 transition hover:bg-yellow-300"
            >
              Pre-Register for Early Access
            </a>

            <Link
              href="/"
              className="rounded-xl border border-neutral-700 px-8 py-4 text-base font-bold text-white transition hover:border-yellow-400 hover:text-yellow-300"
            >
              Back to SmartServeUK
            </Link>
          </div>

          <div className="mt-6 text-center text-sm text-neutral-500">
            Early access registrations are now being collected for launch planning,
            airport demand analysis, and future driver-network expansion across London.
          </div>
        </div>
      </section>

      <section className="border-t border-neutral-800 bg-neutral-950">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="mb-10 max-w-2xl">
            <h2 className="text-3xl font-bold text-white">
              Frequently Asked Questions
            </h2>
            <p className="mt-3 text-neutral-400">
              Everything you need to know before booking your London black cab.
            </p>
          </div>

          <div className="space-y-6">
            <div className="group rounded-2xl border border-neutral-800 bg-neutral-900/60 p-5 transition hover:border-yellow-400/40 hover:bg-neutral-900">
              <div className="flex items-start justify-between gap-4">
                <div className="font-semibold text-white">Are all drivers licensed?</div>
                <div className="text-yellow-400 transition group-hover:translate-x-1">
                  →
                </div>
              </div>

              <p className="mt-3 text-sm leading-6 text-neutral-400">
                Yes — all black cab drivers are fully licensed and regulated, ensuring
                high safety and professional standards.
              </p>
            </div>

            <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-5">
              <div className="font-semibold text-white">
                Can I pre-book airport transfers?
              </div>
              <p className="mt-2 text-sm text-neutral-400">
                Yes — advance booking is ideal for airport journeys including Heathrow,
                Gatwick, and other major London airports.
              </p>
            </div>

            <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-5">
              <div className="font-semibold text-white">
                Is pricing fixed or metered?
              </div>
              <p className="mt-2 text-sm text-neutral-400">
                Pricing is transparent and based on standard London black cab fares,
                with clear estimates provided before booking.
              </p>
            </div>

            <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-5">
              <div className="font-semibold text-white">
                How do complaints and serious concerns work?
              </div>
              <p className="mt-2 text-sm text-neutral-400">
                The platform keeps a booking footprint, accepts concern reports, and
                helps with review and follow-up. In emergencies or where there is
                immediate risk, contact emergency services first by calling 999.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section
        id="early-access"
        className="border-t border-neutral-800 bg-neutral-900/40"
      >
        <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="rounded-3xl border border-neutral-800 bg-neutral-950 p-8 shadow-sm">
            <div className="max-w-2xl">
              <h2 className="text-3xl font-bold text-white">
                Join the Early Access List
              </h2>
              <p className="mt-3 text-neutral-400">
                Be among the first to hear when Black Cab Booking goes live for London
                airport transfers, hotel pickups, and advance city rides.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="mt-8 grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-neutral-300">
                  Full Name
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Enter your name"
                  className="w-full rounded-xl border border-neutral-700 bg-neutral-900 px-4 py-3 text-white placeholder:text-neutral-500 outline-none transition focus:border-yellow-400"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-neutral-300">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="w-full rounded-xl border border-neutral-700 bg-neutral-900 px-4 py-3 text-white placeholder:text-neutral-500 outline-none transition focus:border-yellow-400"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-neutral-300">
                  Phone Number
                </label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Optional"
                  className="w-full rounded-xl border border-neutral-700 bg-neutral-900 px-4 py-3 text-white placeholder:text-neutral-500 outline-none transition focus:border-yellow-400"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-neutral-300">
                  Journey Type
                </label>
                <select
                  value={journeyType}
                  onChange={(e) => setJourneyType(e.target.value)}
                  className="w-full rounded-xl border border-neutral-700 bg-neutral-900 px-4 py-3 text-white outline-none transition focus:border-yellow-400"
                >
                  <option>Airport Transfer</option>
                  <option>Hotel Pickup</option>
                  <option>Business Travel</option>
                  <option>City Journey</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-medium text-neutral-300">
                  Notes
                </label>
                <textarea
                  rows={4}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Tell us what kind of journey you may need"
                  className="w-full rounded-xl border border-neutral-700 bg-neutral-900 px-4 py-3 text-white placeholder:text-neutral-500 outline-none transition focus:border-yellow-400"
                />
              </div>

              {successMessage && (
                <div className="md:col-span-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
                  {successMessage}
                </div>
              )}

              {errorMessage && (
                <div className="md:col-span-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                  {errorMessage}
                </div>
              )}

              <div className="md:col-span-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full rounded-xl bg-yellow-400 px-8 py-4 text-sm font-bold text-neutral-950 transition hover:bg-yellow-300 disabled:opacity-50"
                >
                  {submitting ? "Submitting..." : "Join Early Access"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </section>

      <section className="border-t border-neutral-800 bg-neutral-950">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-8 text-sm text-neutral-500 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <div>
            © 2026 SmartServeUK Black Cab. London black cab booking platform concept.
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <Link href="/" className="transition hover:text-yellow-300">
              SmartServeUK Home
            </Link>

            <a href="#why-blackcab" className="transition hover:text-yellow-300">
              Why Black Cab
            </a>

            <a href="#early-access" className="transition hover:text-yellow-300">
              Early Access
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}