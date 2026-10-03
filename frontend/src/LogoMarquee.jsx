export default function LogoMarquee() {
  /* ConceptFlow AI tech stack & integrations — using existing marquee logo files
     that are still relevant (Vercel for hosting, GitHub for repo, Supabase for DB).
     Kept full set as partner/integration logos since they represent common
     tools in the educational AI stack. */
  const logos = [
    { alt: "Vercel", src: "/images/logo-marquee/vercel.png" },
    { alt: "Supabase", src: "/images/logo-marquee/supabase.png" },
    { alt: "GitHub", src: "/images/logo-marquee/github.png" },
    { alt: "Stripe", src: "/images/logo-marquee/stripe.png" },
    { alt: "BigQuery", src: "/images/logo-marquee/bigquery.png" },
    { alt: "Slack", src: "/images/logo-marquee/slack.png" },
    { alt: "HubSpot", src: "/images/logo-marquee/hubspot.png" },
    { alt: "Zapier", src: "/images/logo-marquee/zapier.png" },
    { alt: "Snowflake", src: "/images/logo-marquee/snowflake.png" },
    { alt: "AWS S3", src: "/images/logo-marquee/aws-s3.png" },
  ];

  const imgClass = "pointer-events-none h-8 w-auto object-contain select-none grayscale brightness-0 invert opacity-75 md:h-10";

  return (
    <div className="overflow-hidden">
      <div className="flex w-max">
        <div className="flex shrink-0 animate-marquee items-center" style={{ gap: '42px', paddingRight: '42px' }}>
          {logos.map((logo) => (
            <img key={logo.alt} alt={logo.alt} src={logo.src} className={imgClass} height="40" width="120" decoding="async" loading="lazy" />
          ))}
        </div>
        <div className="flex shrink-0 animate-marquee items-center" style={{ gap: '42px', paddingRight: '42px' }} aria-hidden="true">
          {logos.map((logo) => (
            <img key={logo.alt} alt="" src={logo.src} className={imgClass} height="40" width="120" decoding="async" loading="lazy" />
          ))}
        </div>
      </div>
    </div>
  );
}
