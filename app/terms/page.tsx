const EFFECTIVE_DATE = "[EFFECTIVE DATE TO CONFIRM BEFORE LAUNCH]";
const OPERATOR_NAME = "[OPERATOR LEGAL NAME TO CONFIRM BEFORE LAUNCH]";
const LEGAL_CONTACT_EMAIL = "[LEGAL CONTACT EMAIL TO CONFIRM BEFORE LAUNCH]";

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

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      <h1 className="text-3xl font-bold">Terms and Conditions</h1>
      <p className="mt-2 text-sm text-neutral-500">
        Effective date: {EFFECTIVE_DATE}
      </p>

      <p className="mt-6 text-neutral-700">
        These Terms and Conditions (&ldquo;Terms&rdquo;) govern your use of
        this website, operated by {OPERATOR_NAME} under the brand names
        &ldquo;SmartServeUK&rdquo; and &ldquo;London Food Hubs&rdquo;
        (together, &ldquo;the Service&rdquo;, &ldquo;we&rdquo;,
        &ldquo;us&rdquo;). By using the Service, you agree to these Terms.
        These Terms describe the Service as it actually works today; they
        do not describe features that are not yet built.
      </p>

      <Section title="1. What this Service is">
        <p>
          The Service is a restaurant discovery, listing, and directory
          platform. It lets people search for and browse restaurants,
          street food traders, and other food businesses across London, and
          lets restaurant owners claim and manage their own listings,
          submit reviews, and request corrections or removals.
        </p>
        <p>
          <strong>The Service does not currently process online food
          orders, payments, bookings, or deliveries.</strong> It does not
          take commission on any transaction, guarantee any booking, or act
          as a party to any transaction between you and a restaurant. If
          this changes in the future, these Terms will be updated to
          describe it accurately before it launches.
        </p>
      </Section>

      <Section title="2. Accounts">
        <p>
          Some features (claiming a listing, submitting a review, managing a
          restaurant, requesting corrections or translations) require an
          account. You are responsible for the accuracy of the information
          you provide when creating an account, and for keeping your
          account credentials secure. You must not create an account using
          someone else&apos;s identity or impersonate another person or
          business.
        </p>
      </Section>

      <Section title="3. Restaurant listings and information accuracy">
        <p>
          Restaurant information on the Service may come from a number of
          sources: the restaurant owner directly, publicly available
          information, our own editorial research, or an approved
          onboarding/import process. We take reasonable steps to keep
          listings accurate, but we do not guarantee that every listing is
          complete, current, or error-free at all times. If you spot
          something wrong, please use the correction/removal options on the
          listing.
        </p>
      </Section>

      <Section title="4. Restaurant ownership claims">
        <p>
          If you submit a claim to manage a restaurant listing, you confirm
          that you are the owner of that business or are otherwise
          authorised to manage its listing on the Service. We review claims
          before granting management access, and we may decline a claim we
          cannot verify. Submitting a claim does not itself grant you any
          rights over the listing — only an approved claim does.
        </p>
      </Section>

      <Section title="5. Restaurant owner responsibilities">
        <p>
          If you manage a restaurant listing, the content you supply
          (description, menu, opening hours, images, and similar) must be
          accurate to the best of your knowledge and must not be unlawful,
          misleading, or infringe anyone else&apos;s rights. We may remove
          or correct content that clearly breaches this.
        </p>
      </Section>

      <Section title="6. Reviews and user content">
        <p>
          If you submit a review or other content, it must be your own
          genuine opinion or experience, written in good faith, and must
          not be unlawful, defamatory, harassing, or knowingly false.
          Reviews go through a moderation step before being published, and
          we may decline to publish, or may later remove, content that
          breaches this or that we are required to remove by law. You keep
          ownership of content you submit; by submitting it, you allow us
          to display it on the Service as part of normal operation.
        </p>
      </Section>

      <Section title="7. Corrections and removal requests">
        <p>
          Anyone can ask us to correct or remove a restaurant listing using
          the options provided on that listing&apos;s page. These requests
          are reviewed by our team rather than actioned automatically or
          instantly, and we use reasonable judgement in deciding the
          outcome.
        </p>
      </Section>

      <Section title="8. Translations">
        <p>
          The Service&apos;s own interface may be shown in the language you
          select. A restaurant&apos;s own supplied content (description,
          menu, and similar) is not automatically translated — it is shown
          in the language the owner provided it in, unless the owner has
          requested and approved a translation into another supported
          language through our translation-request process. Reviews are
          always shown in the original language they were submitted in and
          are not automatically translated. We do not currently charge for
          translations, and nothing in these Terms should be read as
          describing a paid translation service.
        </p>
      </Section>

      <Section title="9. Acceptable use">
        <p>You agree not to:</p>
        <ul className="list-disc ml-6 space-y-1">
          <li>
            Use the Service for any unlawful purpose, or in a way that
            breaches any applicable law or regulation.
          </li>
          <li>
            Attempt to claim a restaurant listing you have no genuine
            connection to.
          </li>
          <li>
            Submit false, misleading, or knowingly inaccurate reviews or
            listing content.
          </li>
          <li>
            Attempt to bypass, disable, or interfere with the security or
            access-control features of the Service.
          </li>
          <li>
            Scrape, harvest, or systematically extract data from the
            Service beyond ordinary, individual browsing use, without our
            prior written permission.
          </li>
        </ul>
      </Section>

      <Section title="10. Third-party websites and content">
        <p>
          Restaurant listings may link to third-party websites, social media
          profiles, or embedded content (for example, an embedded map for a
          specific location). We do not control and are not responsible for
          the content, accuracy, or practices of any third-party site you
          reach from the Service.
        </p>
      </Section>

      <Section title="11. Intellectual property">
        <p>
          The Service&apos;s own branding, design, and platform-created
          content belong to us or our licensors. Restaurant owners and
          reviewers retain ownership of the content they submit, subject to
          the licence described in the sections above allowing us to
          display it on the Service.
        </p>
      </Section>

      <Section title="12. Suspension and termination">
        <p>
          We may suspend or restrict an account or a listing where we
          reasonably believe these Terms have been breached, or where doing
          so is necessary to protect the Service or its users. We will act
          proportionately and, where practical, tell you why.
        </p>
      </Section>

      <Section title="13. Disclaimers">
        <p>
          The Service is provided on an &ldquo;as is&rdquo; and
          &ldquo;as available&rdquo; basis. We do not guarantee that
          restaurant information is always accurate, complete, or
          up to date, that the Service will be uninterrupted or error-free,
          or that any particular restaurant, review, or outcome will meet
          your expectations.
        </p>
      </Section>

      <Section title="14. Limitation of liability">
        <p>
          To the fullest extent permitted by law, we are not liable for any
          indirect, incidental, or consequential loss arising from your use
          of the Service, or for the accuracy of information supplied by
          restaurant owners or other users. Nothing in these Terms is
          intended to exclude or limit liability that cannot lawfully be
          excluded or limited.
        </p>
      </Section>

      <Section title="15. Governing law">
        <p>
          These Terms are governed by the laws of England and Wales, and any
          dispute relating to them will be subject to the exclusive
          jurisdiction of the courts of England and Wales, without prejudice
          to any mandatory consumer-protection rights you may have in the
          country where you live.
        </p>
      </Section>

      <Section title="16. Changes to these Terms">
        <p>
          We may update these Terms from time to time as the Service
          changes. If we make a material change, we will update the
          effective date at the top of this page.
        </p>
      </Section>

      <Section title="17. Contact">
        <p>
          Questions about these Terms can be sent to {LEGAL_CONTACT_EMAIL}.
        </p>
      </Section>
    </div>
  );
}
