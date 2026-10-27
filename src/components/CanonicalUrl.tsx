import { Helmet } from "react-helmet-async";
import { useLocation } from "react-router-dom";

const SITE_URL = "https://pivothub.io";

/** Gives every route a self-referencing canonical and og:url. */
const CanonicalUrl = () => {
  const { pathname } = useLocation();
  const path = pathname === "/" ? "/" : pathname.replace(/\/+$/, "");
  const url = `${SITE_URL}${path}`;
  return (
    <Helmet>
      <link rel="canonical" href={url} />
      <meta property="og:url" content={url} />
    </Helmet>
  );
};

export default CanonicalUrl;
