import Link from "next/link";

const EFFECTIVE_DATE = "22 September 2026";
const OPERATOR_NAME = "MBN Continental (UK) Ltd";
const OPERATOR_ADDRESS = "85 Halley Road, London E7 8DS, United Kingdom";
const NAMED_CONTACT = "Md. Mahtab Hossain Siddiqui";
const PRIVACY_CONTACT_EMAIL = "mahtab@mbncon.com";
const CONTACT_PHONE = "07454586658";

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-8">
      <h2 className="text-xl font-semibold text-neutral-900">{title}</h2>
      <div className="mt-2 space-y-3 text-neutral-700">{children}</div>
    </section>
  );
}

export default function PrivacyPolicyPage() {
  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      <h1 className="text-3xl font-bold">Privacy Policy</h1>
      <p className="mt-2 text-sm text-neutral-500">
        Effective date: {EFFECTIVE_DATE}
      </p>

      <p className="mt-6 text-neutral-700">
        This Privacy Policy explains what personal information this website
        (including the London Food Hubs restaurant discovery service and the
        wider SmartServeUK platform it runs on) collects, why, and what
        choices you have. It describes our actual, currently implemented
        data practices — it does not describe features that do not exist yet
        (for example, this Service does not currently process online orders,
        payments, or deliveries, and does not run any advertising or
        analytics tracking).
      </p>
      <p className="mt-3 text-neutral-700">
        This is a practical, plain-English description of our data
        practices, not a certification of legal compliance and not a
        substitute for formal legal advice.
      </p>

      <Section title="Who operates this service">
        <p>
          This website is operated by {OPERATOR_NAME}. Our business/contact
          address is {OPERATOR_ADDRESS}. The named contact for this Service
          is {NAMED_CONTACT}. &ldquo;SmartServeUK&rdquo; and &ldquo;London
          Food Hubs&rdquo; are brand names used on this website by the same
          operator. In this policy, &ldquo;we&rdquo;, &ldquo;us&rdquo; and
          &ldquo;the Service&rdquo; refer to that operator and this website.
        </p>
      </Section>

      <Section title="Information we collect">
        <p>
          We collect different categories of information depending on how
          you use the Service. We only describe below what is actually
          collected by the features that exist today.
        </p>

        <h3 className="font-semibold text-neutral-900 mt-4">
          Account information
        </h3>
        <p>
          If you create an account, we collect your full name, email
          address, an optional phone number, and the account role you sign
          up as (for example, customer, restaurant, caterer, supplier, or
          household). Account creation and sign-in are handled by Firebase
          Authentication — see &ldquo;Third-party service providers&rdquo;
          below.
        </p>

        <h3 className="font-semibold text-neutral-900 mt-4">
          Restaurant ownership claim information (private)
        </h3>
        <p>
          If you submit a claim to be recognised as the owner or authorised
          representative of a restaurant listing, we collect your name, a
          business contact email, and — if you choose to provide them — a
          role/title, a contact phone number, and a free-text note to help
          us verify the claim. This information is stored in a private
          record that is never included in the public restaurant listing
          and is only accessible to you (the person who submitted the
          claim) and to platform administrators reviewing claims. It is not
          shown to other visitors, other restaurant owners, or search
          engines.
        </p>

        <h3 className="font-semibold text-neutral-900 mt-4">
          Restaurant owner / business listing information
        </h3>
        <p>
          If you manage a restaurant listing, we store the business
          information you provide for that listing — for example the
          restaurant&apos;s name, description, menu, cuisine, address,
          opening hours, contact details, images, and social/website links.
          This information is business/public-facing information about the
          restaurant, intended to be displayed publicly on the Service, and
          is treated differently from the private claimant information
          above.
        </p>

        <h3 className="font-semibold text-neutral-900 mt-4">
          Reviews and other content you submit
        </h3>
        <p>
          If you submit a review, we store your display name, star rating,
          and review text, linked to your account. Reviews go through a
          moderation step (pending, approved, or rejected) before they are
          shown publicly, and moderation records (who reviewed it and any
          moderator note) are kept for administrative purposes and are not
          shown publicly.
        </p>

        <h3 className="font-semibold text-neutral-900 mt-4">
          Correction and removal requests
        </h3>
        <p>
          If you submit a correction request (flagging that something about
          a listing is wrong) or a removal request (asking for a listing to
          be taken down), we store your account identifier, an optional
          contact email, and the free-text details you provide, together
          with the outcome of our review. This is used only to process your
          request and is not shown publicly.
        </p>

        <h3 className="font-semibold text-neutral-900 mt-4">
          Restaurant translation requests
        </h3>
        <p>
          If, as a restaurant owner, you request that your own listing
          content be translated into another supported language, we record
          that request against your account and the restaurant it relates
          to, so it can be tracked and actioned. We do not currently process
          any payment for this — see &ldquo;Translations&rdquo; in our{" "}
          <Link className="underline" href="/terms">
            Terms
          </Link>
          .
        </p>

        <h3 className="font-semibold text-neutral-900 mt-4">
          Restaurant signup / onboarding applications
        </h3>
        <p>
          If a restaurant applies to join the platform through our onboarding
          signup form, we collect the information submitted on that form —
          typically a business name, an owner/contact name, a phone number,
          an email address, the cuisines offered, and any notes supplied —
          so that we can review and process the application.
        </p>

        <h3 className="font-semibold text-neutral-900 mt-4">
          Administrative and workflow information
        </h3>
        <p>
          Where an administrator takes an action that affects your account,
          a listing, a claim, a review, or a request (for example, approving
          a claim or moderating a review), we keep a basic record of that
          action — such as which administrator account acted, when, and any
          moderation note — for accountability and audit purposes. This
          information is not displayed publicly.
        </p>

        <h3 className="font-semibold text-neutral-900 mt-4">
          Technical information
        </h3>
        <p>
          Our sign-in system (Firebase Authentication) uses your browser&apos;s
          local storage to keep you signed in between visits. This is
          strictly necessary for the account features to work and is not
          used for advertising or analytics. We do not currently run any
          analytics, advertising, or third-party tracking on this website —
          see our{" "}
          <Link className="underline" href="/cookie-policy">
            Cookie Policy
          </Link>{" "}
          for full detail.
        </p>
      </Section>

      <Section title="Why we process this information">
        <ul className="list-disc ml-6 space-y-1">
          <li>To create and operate your account and let you sign in.</li>
          <li>
            To let restaurant owners claim, manage, and publish their own
            listings.
          </li>
          <li>
            To publish restaurant/business information for people searching
            for places to eat.
          </li>
          <li>
            To collect, moderate, and display reviews and other user
            content.
          </li>
          <li>
            To review and act on correction, removal, and translation
            requests.
          </li>
          <li>
            To review restaurant onboarding applications and set up new
            listings.
          </li>
          <li>
            To keep the Service secure, prevent abuse, and maintain an
            administrative record of moderation and claim decisions.
          </li>
        </ul>
      </Section>

      <Section title="Third-party service providers">
        <p>
          We use the following infrastructure providers to run this Service.
          They process information on our behalf as part of providing that
          infrastructure — we do not sell your information to them or to
          anyone else, and we do not use them for advertising.
        </p>
        <ul className="list-disc ml-6 space-y-1">
          <li>
            <strong>Firebase (Google)</strong> — Firebase Authentication
            (account sign-in) and Cloud Firestore (our database) store the
            information described above. Google publishes its own
            information about how Firebase/Google Cloud handles data, which
            you can review directly on Google&apos;s own sites.
          </li>
          <li>
            <strong>Hostinger</strong> — our web hosting provider, which
            runs the application you are using.
          </li>
        </ul>
        <p>
          As Firebase/Google Cloud is a global infrastructure provider, your
          information may be stored or processed in data centres outside
          the United Kingdom. We have not made any additional claims about
          specific international-transfer safeguards beyond what Google
          itself publishes, and we will update this section if that
          changes.
        </p>
      </Section>

      <Section title="How long we keep information">
        <p>
          We keep account, listing, claim, review, and request information
          for as long as it is needed to provide the Service — broadly, for
          as long as your account or a related listing/claim/request stays
          active, and for a reasonable further period afterwards for
          administrative, security, or record-keeping reasons. We have not
          yet finalised fixed retention periods for every category of
          information listed above; this policy will be updated once
          specific retention periods are confirmed, rather than us stating a
          number we cannot yet stand behind.
        </p>
      </Section>

      <Section title="Security">
        <p>
          We restrict access to private information (such as restaurant
          claim details) using database access-control rules, so that only
          the person who submitted it and platform administrators can read
          it — it is never included in the public restaurant listing. No
          method of storing or transmitting information is completely
          secure, and we cannot guarantee absolute security.
        </p>
      </Section>

      <Section title="Your rights and how to contact us">
        <p>
          Depending on where you live, you may have rights to access,
          correct, delete, or request a copy of the personal information we
          hold about you, and to object to or restrict some of our
          processing. In practice:
        </p>
        <ul className="list-disc ml-6 space-y-1">
          <li>
            You can request a correction to a restaurant listing, or request
            that a listing be removed, using the correction/removal options
            on that restaurant&apos;s page.
          </li>
          <li>
            For anything else — including requesting a copy of your
            information, asking us to delete your account information, or
            any other privacy question — please contact us at{" "}
            <a className="underline" href={`mailto:${PRIVACY_CONTACT_EMAIL}`}>
              {PRIVACY_CONTACT_EMAIL}
            </a>
            , or by phone or WhatsApp on {CONTACT_PHONE}.
          </li>
        </ul>
        <p>
          These requests are currently reviewed and actioned manually by our
          team rather than through an automated self-service system, so
          please allow us a reasonable amount of time to respond.
        </p>
      </Section>

      <Section title="Children">
        <p>
          This Service is intended for general audience use in connection
          with discovering restaurants in London. It is not directed at
          young children, and we do not currently operate any
          age-verification mechanism.
        </p>
      </Section>

      <Section title="Changes to this policy">
        <p>
          We may update this Privacy Policy from time to time as the Service
          changes. If we make a material change, we will update the
          effective date at the top of this page.
        </p>
      </Section>

      <Section title="Language of this policy">
        <p>
          This policy is currently published in English only, which is its
          authoritative version. Although the rest of this website is
          available in English, Bengali, Arabic, and French, a translated
          version of this policy is not yet available. If you need this
          information in another language, please contact us using the
          details above.
        </p>
      </Section>
    </div>
  );
}
