import type { Metadata } from "next";
import VerificationCenter from "./verification-center";

export const metadata: Metadata = {
  title: "SKTECH Verification Center",
  description: "Check an SKTECH Official ID, KK YouthPass, or issued certificate using its public verification link or record ID.",
};

export default function VerifyPage() {
  return <VerificationCenter />;
}
