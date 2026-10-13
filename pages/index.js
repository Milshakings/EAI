import { getSessionFromReq } from "../lib/auth";
import { MENU_POR_ROL } from "../lib/auth";

export default function IndexRedirect() {
  return null;
}

export async function getServerSideProps({ req }) {
  const session = getSessionFromReq(req);
  if (!session) {
    return { redirect: { destination: "/login", permanent: false } };
  }
  const primeraRuta = MENU_POR_ROL[session.rol]?.[0] || "inyector";
  return { redirect: { destination: `/${primeraRuta}`, permanent: false } };
}
