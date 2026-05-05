import { redirect } from "next/navigation";

export default function OfficialFacialRegistrationRedirectPage() {
  redirect("/dashboard/official/admission?step=3");
}
