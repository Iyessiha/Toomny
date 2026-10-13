import type { Metadata } from "next";
import { CguBody } from "@/components/legal/cgu-body";

export function generateMetadata(): Metadata {
  return { title: "Terms of Use — Toomny" };
}

export default function CguPageEn() {
  return <CguBody locale="en" />;
}
